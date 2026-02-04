from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx

from app.adapters import AdapterResponse, SearchMatch
from app.adapters.rapidapi_image_search_adapter import get_rapidapi_image_search_adapter
from app.adapters.serpapi_lens_adapter import get_serpapi_lens_adapter
from app.core.config import settings
from app.services.image_hashing import DualHash, compute_dual_hash, hamming_distance_hex, similarity_from_hamming, stable_image_id
from app.services.image_preprocessing import preprocess_image_bytes
from app.services.pii_masking import mask_pii
from app.services.redis_client import redis_get_json, redis_set_json

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ReverseSearchRun:
    search_id: str
    image_sha256: str
    dual_hash: DualHash
    public_image_url: str
    stored_filename: str


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _uploads_dir() -> Path:
    return (_backend_root() / settings.UPLOAD_DIR).resolve()


def _ensure_public_base_url() -> str:
    base = (settings.PUBLIC_BASE_URL or "").strip().rstrip("/")
    if not base:
        raise RuntimeError("PUBLIC_BASE_URL is not configured")
    return base


def _domain(url: Optional[str]) -> str:
    if not url:
        return ""
    try:
        return (urlparse(url).netloc or "").lower()
    except Exception:
        return ""


HIGH_REP = {
    "instagram.com",
    "www.instagram.com",
    "facebook.com",
    "www.facebook.com",
    "tiktok.com",
    "www.tiktok.com",
    "x.com",
    "www.x.com",
    "twitter.com",
    "www.twitter.com",
    "linkedin.com",
    "www.linkedin.com",
    "pinterest.com",
    "www.pinterest.com",
    "youtube.com",
    "www.youtube.com",
}


def domain_reputation(domain: str) -> float:
    if not domain:
        return 50.0
    if domain in HIGH_REP:
        return 90.0
    if domain.endswith(".gov") or domain.endswith(".edu"):
        return 85.0
    if domain.endswith(".org"):
        return 70.0
    return 55.0


async def _download_thumbnail_hash_similarity(
    client: httpx.AsyncClient,
    url: str,
    ref: DualHash,
    *,
    max_bytes: int = 2_000_000,
) -> Optional[Tuple[float, float, float]]:
    try:
        r = await client.get(url)
        r.raise_for_status()
        content = r.content
        if not content or len(content) > max_bytes:
            return None
        h = compute_dual_hash(content)
        ah = similarity_from_hamming(hamming_distance_hex(ref.ahash, h.ahash), 64)
        ph = similarity_from_hamming(hamming_distance_hex(ref.phash, h.phash), 64)
        return (ah + ph) / 2.0, ah, ph
    except Exception:
        return None


def _dedupe_matches(matches: List[SearchMatch]) -> List[SearchMatch]:
    seen_url: set[str] = set()
    seen_domain: set[str] = set()
    out: List[SearchMatch] = []
    for m in matches:
        key_url = (m.profile_url or "").strip().lower()
        d = _domain(m.profile_url) or _domain(m.image_url)
        if key_url and key_url in seen_url:
            continue
        if d and d in seen_domain:
            continue
        if key_url:
            seen_url.add(key_url)
        if d:
            seen_domain.add(d)
        out.append(m)
    return out


def _repeat_counts(matches: List[SearchMatch]) -> Tuple[Dict[str, int], Dict[str, int]]:
    by_url: Dict[str, int] = {}
    by_domain: Dict[str, int] = {}
    for m in matches:
        u = (m.profile_url or "").strip().lower()
        if u:
            by_url[u] = by_url.get(u, 0) + 1
        d = _domain(m.profile_url) or _domain(m.image_url)
        if d:
            by_domain[d] = by_domain.get(d, 0) + 1
    return by_url, by_domain


def _score_match(
    *,
    hash_similarity: float,
    domain_rep: float,
    repeat_norm: float,
) -> Tuple[float, Dict[str, float]]:
    hs = max(0.0, min(1.0, float(hash_similarity)))
    dr = max(0.0, min(100.0, float(domain_rep))) / 100.0
    rn = max(0.0, min(1.0, float(repeat_norm)))
    score = (0.40 * hs + 0.30 * dr + 0.30 * rn) * 100.0
    return float(score), {"hash_similarity": hs * 100.0, "domain_reputation": dr * 100.0, "repeat": rn * 100.0}


async def prepare_reverse_search(image_bytes: bytes, filename: str) -> ReverseSearchRun:
    processed_bytes, _, _ = preprocess_image_bytes(image_bytes, size=512)
    dual = compute_dual_hash(processed_bytes)
    image_sha = stable_image_id(processed_bytes)
    search_id = str(uuid.uuid4())

    uploads = _uploads_dir()
    reverse_dir = (uploads / "reverse").resolve()
    reverse_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{search_id}.jpg"
    stored_path = reverse_dir / stored_filename
    stored_path.write_bytes(processed_bytes)

    base = _ensure_public_base_url()
    public_url = f"{base}/uploads/reverse/{stored_filename}"

    return ReverseSearchRun(
        search_id=search_id,
        image_sha256=image_sha,
        dual_hash=dual,
        public_image_url=public_url,
        stored_filename=stored_filename,
    )


async def reverse_search_cached(*, image_bytes: bytes, filename: str, hint: Optional[str]) -> Dict[str, Any]:
    processed_bytes, _, _ = preprocess_image_bytes(image_bytes, size=512)
    dual = compute_dual_hash(processed_bytes)
    image_sha = stable_image_id(processed_bytes)

    cache_key = f"reverse:hash:{image_sha}"
    cached = await redis_get_json(cache_key)
    if cached:
        out = dict(cached)
        out["search_id"] = str(uuid.uuid4())
        out["image_sha256"] = image_sha
        out["ahash"] = dual.ahash
        out["phash"] = dual.phash
        out["cached"] = True
        return out

    uploads = _uploads_dir()
    reverse_dir = (uploads / "reverse").resolve()
    reverse_dir.mkdir(parents=True, exist_ok=True)
    search_id = str(uuid.uuid4())
    stored_filename = f"{search_id}.jpg"
    stored_path = reverse_dir / stored_filename
    stored_path.write_bytes(processed_bytes)

    base = _ensure_public_base_url()
    public_url = f"{base}/uploads/reverse/{stored_filename}"
    run = ReverseSearchRun(
        search_id=search_id,
        image_sha256=image_sha,
        dual_hash=dual,
        public_image_url=public_url,
        stored_filename=stored_filename,
    )
    result = await run_reverse_search(run=run, hint=hint, timeout_s=30)
    result["cached"] = False

    await redis_set_json(cache_key, result, ttl_seconds=int(settings.REVERSE_SEARCH_CACHE_TTL_SECONDS))
    await redis_set_json(f"reverse:search_id:{search_id}", result, ttl_seconds=int(settings.REVERSE_SEARCH_RESULT_TTL_SECONDS))
    return result


async def run_reverse_search(
    *,
    run: ReverseSearchRun,
    hint: Optional[str] = None,
    timeout_s: int = 30,
    max_matches: int = 30,
) -> Dict[str, Any]:
    serpapi = get_serpapi_lens_adapter(
        {
            "api_key": settings.SERPAPI_API_KEY,
            "engine": settings.SERPAPI_ENGINE,
            "gl": settings.SERPAPI_GL,
            "hl": settings.SERPAPI_HL,
            "timeout": timeout_s,
        }
    )
    rapidapi = get_rapidapi_image_search_adapter(
        {
            "api_key": settings.RAPIDAPI_KEY,
            "host": settings.RAPIDAPI_HOST,
            "endpoint": settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT,
            "timeout": timeout_s,
        }
    )

    hint_value = (hint or "").strip()
    if not hint_value:
        hint_value = "person"

    tasks = []
    tasks.append(serpapi.search_by_image_url(run.public_image_url))
    tasks.append(rapidapi.search(hint_value, limit=50))

    serp_res, rapid_res = await asyncio.gather(*tasks, return_exceptions=True)

    provider_results: List[AdapterResponse] = []
    for provider_name, r in (("serpapi", serp_res), ("rapidapi", rapid_res)):
        if isinstance(r, AdapterResponse):
            provider_results.append(r)
        else:
            provider_results.append(AdapterResponse(provider=provider_name, status="error", matches=[], error=str(r)))

    matches: List[SearchMatch] = []
    for pr in provider_results:
        if pr.status == "success":
            matches.extend(pr.matches)

    all_matches = list(matches)
    by_url, by_domain = _repeat_counts(all_matches)
    max_rep = max([1] + list(by_url.values()) + list(by_domain.values()))

    deduped = _dedupe_matches(all_matches)

    sem = asyncio.Semaphore(5)
    thumb_sim: Dict[int, float] = {}
    thumb_components: Dict[int, Dict[str, float]] = {}

    async with httpx.AsyncClient(timeout=5, follow_redirects=True) as thumb_client:
        async def compute_for_index(idx: int, m: SearchMatch) -> None:
            url = (m.image_url or "").strip()
            if not url.startswith("http"):
                return
            async with sem:
                res = await _download_thumbnail_hash_similarity(thumb_client, url, run.dual_hash)
            if not res:
                return
            sim, ah, ph = res
            thumb_sim[idx] = sim
            thumb_components[idx] = {"ahash": ah * 100.0, "phash": ph * 100.0}

        await asyncio.gather(*(compute_for_index(i, m) for i, m in enumerate(deduped[: min(len(deduped), 10)])))

    out_matches: List[Dict[str, Any]] = []
    for i, m in enumerate(deduped[:max_matches]):
        d = _domain(m.profile_url) or _domain(m.image_url)
        rep_url = by_url.get((m.profile_url or "").strip().lower(), 1)
        rep_domain = by_domain.get(d, 1)
        repeat_norm = float(max(rep_url, rep_domain)) / float(max_rep)
        hs = thumb_sim.get(i, 0.0)
        score, comps = _score_match(hash_similarity=hs, domain_rep=domain_reputation(d), repeat_norm=repeat_norm)
        if score < 40.0:
            continue

        md = dict(m.metadata or {})
        if i in thumb_components:
            md["hash_similarity"] = thumb_components[i]
        md["domain"] = d
        masked = mask_pii(
            {
                "platform": m.platform,
                "username": m.username,
                "profile_url": m.profile_url,
                "image_url": m.image_url,
                "confidence": score,
                "confidence_components": comps,
                "metadata": md,
            }
        )
        out_matches.append(masked)

    return {
        "search_id": run.search_id,
        "image_sha256": run.image_sha256,
        "ahash": run.dual_hash.ahash,
        "phash": run.dual_hash.phash,
        "providers": [p.to_dict() for p in provider_results],
        "matches": out_matches,
        "total_matches": len(out_matches),
    }


def cleanup_reverse_upload(search_id: str) -> None:
    try:
        p = (_uploads_dir() / "reverse" / f"{search_id}.jpg").resolve()
        if p.exists():
            p.unlink()
    except Exception:
        pass
