import asyncio
import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Any, AsyncIterator, Dict, Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import httpx

from app.core.config import settings


def _json_loads(value: Optional[str], default: Any):
    if value is None:
        return default
    try:
        parsed = json.loads(value)
        return parsed if parsed is not None else default
    except Exception:
        return default


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def url_hash(url: str) -> str:
    normalized = url.strip()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


_TAG_RE = re.compile(r"<[^>]+>")
_SCRIPT_RE = re.compile(r"(?is)<script[^>]*>.*?</script>")
_STYLE_RE = re.compile(r"(?is)<style[^>]*>.*?</style>")
_TITLE_RE = re.compile(r"(?is)<title[^>]*>(.*?)</title>")


def strip_html(html: str) -> Tuple[Optional[str], str]:
    clean = _SCRIPT_RE.sub(" ", html)
    clean = _STYLE_RE.sub(" ", clean)
    title = None
    m = _TITLE_RE.search(clean)
    if m:
        title = unescape(re.sub(r"\s+", " ", m.group(1)).strip()) or None
    text = _TAG_RE.sub(" ", clean)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return title, text


_EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
_PHONE_RE = re.compile(r"(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{2}[\s-]?\d{2}")


def redact_pii(text: str) -> Tuple[str, bool]:
    original = text
    redacted = _EMAIL_RE.sub("[REDACTED_EMAIL]", original)
    redacted = _PHONE_RE.sub("[REDACTED_PHONE]", redacted)
    return redacted, redacted != original


def _default_taxonomy() -> Dict[str, List[str]]:
    return {
        "news": ["breaking", "haber", "news", "press", "gazete"],
        "government": ["gov", "resmi", "bakanlık", "mevzuat", "yönetmelik", "tüzük"],
        "docs": ["documentation", "docs", "readme", "api", "reference", "kılavuz"],
        "forum": ["forum", "thread", "konu", "reply", "yanıt", "discussion", "tartışma"],
        "social": ["profile", "follow", "tweet", "post", "instagram", "linkedin", "facebook"],
        "code_repo": ["github", "gitlab", "commit", "pull request", "issue", "repository"],
        "marketplace": ["price", "satın al", "sepete", "checkout", "listing", "ürün"],
    }


def classify(text: str, config: Dict[str, Any]) -> Tuple[Optional[str], List[str]]:
    lowered = text.lower()
    keyword_categories = config.get("keyword_categories") or _default_taxonomy()

    best_category = None
    best_score = 0
    for cat, keywords in keyword_categories.items():
        score = 0
        for kw in keywords or []:
            if kw and kw.lower() in lowered:
                score += 1
        if score > best_score:
            best_category = cat
            best_score = score

    tags: List[str] = []
    for rule in config.get("tag_rules") or []:
        tag = rule.get("tag")
        if not tag:
            continue
        keywords = rule.get("keywords")
        pattern = rule.get("regex")
        if keywords:
            for kw in keywords:
                if kw and kw.lower() in lowered:
                    tags.append(tag)
                    break
        elif pattern:
            try:
                if re.search(pattern, text, re.IGNORECASE):
                    tags.append(tag)
            except re.error:
                continue

    if best_category and best_score > 0:
        tags.append(best_category)

    uniq = []
    seen = set()
    for t in tags:
        t2 = str(t).strip()
        if not t2:
            continue
        key = t2.lower()
        if key in seen:
            continue
        seen.add(key)
        uniq.append(t2)
    return best_category, uniq


def quality_score(title: Optional[str], content_text: str) -> Tuple[float, List[str]]:
    flags: List[str] = []
    length = len(content_text or "")
    score = 0.0
    if length < 80:
        flags.append("too_short")
        score += max(0.0, length / 80.0) * 20.0
    else:
        score += min(60.0, 20.0 + (length / 1000.0) * 40.0)

    if not title:
        flags.append("no_title")
    else:
        score += 10.0

    if "cookie" in (content_text or "").lower() and length < 300:
        flags.append("boilerplate")
        score -= 10.0

    score = max(0.0, min(100.0, score))
    return score, flags


def detect_language_heuristic(text: str) -> Optional[str]:
    sample = (text or "")[:1500].lower()
    if not sample.strip():
        return None
    tr_hits = sum(sample.count(ch) for ch in ["ğ", "ü", "ş", "ı", "ö", "ç"])
    en_hits = sum(sample.count(ch) for ch in ["the ", " and ", " of ", " to ", " for "])
    if tr_hits >= 2 and tr_hits >= en_hits:
        return "tr"
    if en_hits >= 2 and en_hits >= tr_hits:
        return "en"
    return None


@dataclass(frozen=True)
class FetchedDocument:
    url: str
    title: Optional[str]
    content_text: str
    raw_text: Optional[str]
    extracted: Dict[str, Any]


async def crawl_website(
    base_url: str,
    crawl_config: Dict[str, Any],
    strategy_override: Dict[str, Any],
) -> AsyncIterator[FetchedDocument]:
    cfg = dict(crawl_config or {})
    cfg.update(strategy_override or {})

    start_urls = cfg.get("start_urls") or [base_url]
    max_pages = int(cfg.get("max_pages") or 200)
    max_depth = int(cfg.get("max_depth") or 2)
    timeout_s = float(cfg.get("timeout_s") or 15.0)
    delay_ms = int(cfg.get("request_delay_ms") or 0)
    user_agent = str(cfg.get("user_agent") or "EyeOfTR-Collector/1.0")

    parsed_base = urlparse(base_url)
    allowed_domains = set(cfg.get("allowed_domains") or [])
    if parsed_base.hostname:
        allowed_domains.add(parsed_base.hostname.lower())

    disallow_patterns = [p for p in (cfg.get("disallow_patterns") or []) if p]
    allow_patterns = [p for p in (cfg.get("allow_patterns") or []) if p]

    def allowed(u: str) -> bool:
        pu = urlparse(u)
        if pu.scheme not in ("http", "https"):
            return False
        host = (pu.hostname or "").lower()
        if allowed_domains and host not in allowed_domains:
            return False
        if disallow_patterns:
            for pat in disallow_patterns:
                try:
                    if re.search(pat, u, re.IGNORECASE):
                        return False
                except re.error:
                    continue
        if allow_patterns:
            ok = False
            for pat in allow_patterns:
                try:
                    if re.search(pat, u, re.IGNORECASE):
                        ok = True
                        break
                except re.error:
                    continue
            if not ok:
                return False
        return True

    seen: set[str] = set()
    q: asyncio.Queue[Tuple[str, int]] = asyncio.Queue()
    for u in start_urls:
        u2 = urljoin(base_url, u)
        if allowed(u2):
            await q.put((u2, 0))

    async with httpx.AsyncClient(
        timeout=timeout_s,
        headers={"User-Agent": user_agent, "Accept": "text/html,application/xhtml+xml"},
        follow_redirects=True,
    ) as client:
        while not q.empty() and len(seen) < max_pages:
            url, depth = await q.get()
            if url in seen:
                continue
            if depth > max_depth:
                continue
            if not allowed(url):
                continue
            seen.add(url)

            if delay_ms > 0:
                await asyncio.sleep(delay_ms / 1000.0)

            try:
                res = await client.get(url)
                if res.status_code >= 400:
                    continue
                html = res.text
            except Exception:
                continue

            title, text = strip_html(html)
            yield FetchedDocument(
                url=url,
                title=title,
                content_text=text,
                raw_text=None,
                extracted={"status_code": res.status_code, "content_type": res.headers.get("content-type")},
            )

            if depth < max_depth:
                for href in re.findall(r'(?is)href\s*=\s*["\']([^"\']+)["\']', html):
                    href = href.strip()
                    if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("javascript:"):
                        continue
                    nu = urljoin(url, href)
                    if nu in seen:
                        continue
                    if allowed(nu):
                        await q.put((nu, depth + 1))


def _get_path(obj: Any, path: str) -> Any:
    cur = obj
    for part in path.split("."):
        if cur is None:
            return None
        if isinstance(cur, dict):
            cur = cur.get(part)
        elif isinstance(cur, list):
            try:
                idx = int(part)
                cur = cur[idx]
            except Exception:
                return None
        else:
            return None
    return cur


async def crawl_api(
    base_url: str,
    crawl_config: Dict[str, Any],
    strategy_override: Dict[str, Any],
) -> AsyncIterator[FetchedDocument]:
    cfg = dict(crawl_config or {})
    cfg.update(strategy_override or {})

    endpoints = cfg.get("endpoints") or [""]
    timeout_s = float(cfg.get("timeout_s") or 15.0)
    user_agent = str(cfg.get("user_agent") or "EyeOfTR-Collector/1.0")
    items_path = cfg.get("items_path") or "items"
    next_url_path = cfg.get("next_url_path") or "next"
    max_pages = int(cfg.get("max_pages") or 50)

    async with httpx.AsyncClient(
        timeout=timeout_s,
        headers={"User-Agent": user_agent, "Accept": "application/json"},
        follow_redirects=True,
    ) as client:
        for ep in endpoints:
            url = urljoin(base_url.rstrip("/") + "/", str(ep))
            pages = 0
            while url and pages < max_pages:
                pages += 1
                try:
                    res = await client.get(url)
                    if res.status_code >= 400:
                        break
                    payload = res.json()
                except Exception:
                    break

                items = _get_path(payload, items_path)
                if not isinstance(items, list):
                    items = []

                for it in items:
                    if not isinstance(it, dict):
                        continue
                    doc_url = it.get("url") or it.get("link") or url
                    title = it.get("title") or it.get("name")
                    body = it.get("content") or it.get("text") or json.dumps(it, ensure_ascii=False)
                    yield FetchedDocument(
                        url=str(doc_url),
                        title=str(title) if title is not None else None,
                        content_text=str(body),
                        raw_text=None,
                        extracted=it,
                    )

                next_url = _get_path(payload, next_url_path)
                if isinstance(next_url, str) and next_url.strip():
                    url = urljoin(url, next_url.strip())
                else:
                    break


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
