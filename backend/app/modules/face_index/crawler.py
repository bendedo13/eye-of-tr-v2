import asyncio
import hashlib
import json
import logging
import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.face_index.models import FaceSource, FaceCrawlJob, FaceImage
from app.modules.face_index.image_pipeline import store_downloaded_image, process_image

logger = logging.getLogger(__name__)

# ---- Robots.txt ----

_robots_cache: Dict[str, Optional[str]] = {}


async def fetch_robots_txt(domain: str) -> Optional[str]:
    if domain in _robots_cache:
        return _robots_cache[domain]
    url = f"https://{domain}/robots.txt"
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                _robots_cache[domain] = resp.text
                return resp.text
    except Exception:
        pass
    _robots_cache[domain] = None
    return None


def is_allowed_by_robots(robots_txt: Optional[str], path: str, user_agent: str = "*") -> bool:
    if not robots_txt:
        return True
    try:
        from robotexclusionrulesparser import RobotExclusionRulesParser
        parser = RobotExclusionRulesParser()
        parser.parse(robots_txt)
        return parser.is_allowed(user_agent, path)
    except Exception:
        return True


# ---- Rate Limiter ----

class DomainRateLimiter:
    def __init__(self, default_rpm: int = 30):
        self._timestamps: Dict[str, List[float]] = {}
        self._default_rpm = default_rpm

    async def acquire(self, domain: str, rpm: Optional[int] = None):
        limit = rpm or self._default_rpm
        now = time.monotonic()
        window = 60.0

        if domain not in self._timestamps:
            self._timestamps[domain] = []

        # Clean old entries
        self._timestamps[domain] = [t for t in self._timestamps[domain] if now - t < window]

        if len(self._timestamps[domain]) >= limit:
            oldest = self._timestamps[domain][0]
            wait = window - (now - oldest) + 0.1
            if wait > 0:
                await asyncio.sleep(wait)

        self._timestamps[domain].append(time.monotonic())


_rate_limiter = DomainRateLimiter()


# ---- Image URL extraction ----

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_SKIP_PATTERNS = re.compile(r"(icon|logo|sprite|button|arrow|avatar-default|placeholder|1x1|pixel)", re.I)


def extract_image_urls(html: str, base_url: str) -> List[str]:
    """Extract image URLs from HTML, filtering out icons/logos/tiny images."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")
    urls: List[str] = []
    seen: Set[str] = set()

    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if not src:
            continue

        full_url = urljoin(base_url, src)
        if full_url in seen:
            continue
        seen.add(full_url)

        # Filter obvious non-face images
        if _SKIP_PATTERNS.search(full_url):
            continue

        # Check extension
        path = urlparse(full_url).path.lower()
        ext = "." + path.rsplit(".", 1)[-1] if "." in path else ""
        if ext and ext not in _IMAGE_EXTENSIONS:
            continue

        urls.append(full_url)

    return urls


def extract_page_links(html: str, base_url: str, same_domain: bool = True) -> List[str]:
    """Extract page links for BFS crawling."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "lxml")
    base_domain = urlparse(base_url).netloc
    links: List[str] = []
    seen: Set[str] = set()

    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"])
        parsed = urlparse(href)
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if clean in seen:
            continue
        seen.add(clean)
        if same_domain and parsed.netloc != base_domain:
            continue
        if parsed.scheme not in ("http", "https"):
            continue
        links.append(clean)

    return links


# ---- Crawl Execution ----

SOCIAL_KINDS = {"instagram", "twitter", "facebook", "tiktok"}


async def _download_and_process_images(
    image_urls: List[tuple],
    source: FaceSource,
    job: FaceCrawlJob,
    db: Session,
    proxy_url: Optional[str] = None,
):
    """Download images and process faces. Shared by website and social crawlers."""
    min_image_size = int(getattr(settings, "FACE_INDEX_MIN_IMAGE_SIZE", 10240))
    user_agent = str(getattr(settings, "FACE_INDEX_CRAWLER_USER_AGENT", "FaceSeek-Crawler/1.0"))
    domain = urlparse(source.base_url).netloc
    headers = {"User-Agent": user_agent}

    from app.modules.face_index.proxy_manager import get_proxy_manager
    pm = get_proxy_manager()

    async with httpx.AsyncClient(
        timeout=15, follow_redirects=True, headers=headers,
        proxy=proxy_url,
    ) as dl_client:
        for img_url, page_url in image_urls:
            db.refresh(job)
            if job.status == "cancelled":
                return

            url_hash = hashlib.sha256(img_url.encode()).hexdigest()
            if db.query(FaceImage).filter(FaceImage.url_hash == url_hash).first():
                job.images_skipped += 1
                db.commit()
                continue

            await _rate_limiter.acquire(domain, source.rate_limit_rpm)

            # Try with rotating proxies on failure
            data = None
            ct = ""
            for attempt in range(2):
                try:
                    p_info = pm.get_next_proxy(db) if getattr(settings, "FACE_INDEX_PROXY_ENABLED", True) else None
                    p_url = p_info["url"] if p_info else proxy_url

                    async with httpx.AsyncClient(
                        timeout=15, follow_redirects=True, headers=headers,
                        proxy=p_url,
                    ) as retry_client:
                        resp = await retry_client.get(img_url)
                        if resp.status_code != 200:
                            if p_info:
                                pm.report_failure(p_info["id"], db)
                            continue
                        ct = resp.headers.get("content-type", "")
                        if not ct.startswith("image/"):
                            break
                        data = resp.content
                        if p_info:
                            pm.report_success(p_info["id"], 0, db)
                        break
                except Exception:
                    if p_info:
                        pm.report_failure(p_info["id"], db)

            if not data or not ct.startswith("image/"):
                job.errors_count += 1
                db.commit()
                continue

            if len(data) < min_image_size:
                job.images_skipped += 1
                db.commit()
                continue

            record = store_downloaded_image(
                source=source,
                job_id=job.id,
                source_url=img_url,
                page_url=page_url,
                image_bytes=data,
                content_type=ct,
                db=db,
            )
            if record:
                job.images_downloaded += 1
                db.commit()

                n_faces = await process_image(record.id, db)
                job.faces_detected += n_faces
                job.faces_indexed += n_faces
                db.commit()
            else:
                job.images_skipped += 1
                db.commit()


def _load_crawl_state(source: FaceSource) -> dict:
    """Load persisted crawl state from source."""
    try:
        return json.loads(source.crawl_state_json or "{}")
    except Exception:
        return {}


def _save_crawl_state(source: FaceSource, state: dict, db: Session):
    """Save crawl state to source for resume support."""
    source.crawl_state_json = json.dumps(state, default=str)
    db.commit()


# Social media profile photo min size is smaller (profile pics can be 3-5KB)
SOCIAL_MIN_IMAGE_SIZE = 3072  # 3KB for profile photos


async def run_crawl_job(job_id: int, db: Session):
    """Execute a full crawl job: fetch pages, download images, process faces.
    Supports stateful resume from last position via crawl_state_json.
    """
    job = db.query(FaceCrawlJob).filter(FaceCrawlJob.id == job_id).first()
    if not job:
        logger.error(f"Job {job_id} not found")
        return

    source = db.query(FaceSource).filter(FaceSource.id == job.source_id).first()
    if not source:
        job.status = "failed"
        job.message = "Source not found"
        db.commit()
        return

    job.status = "running"
    job.started_at = datetime.now(timezone.utc)
    db.commit()

    user_agent = str(getattr(settings, "FACE_INDEX_CRAWLER_USER_AGENT", "FaceSeek-Crawler/1.0"))

    try:
        config = json.loads(source.crawl_config_json or "{}")
    except Exception:
        config = {}

    # Load crawl state for resume
    crawl_state = _load_crawl_state(source)

    # Get proxy URL
    from app.modules.face_index.proxy_manager import get_proxy_manager
    pm = get_proxy_manager()
    proxy_url = pm.get_httpx_proxy(db)

    try:
        # ---- Social Media Sources ----
        if source.kind in SOCIAL_KINDS:
            from app.modules.face_index.social_crawlers import get_social_crawler
            social = get_social_crawler(source.kind, pm, _rate_limiter)

            logger.info(f"Job {job_id}: Starting social crawl for {source.kind} - {source.base_url}")
            crawled_images = await social.crawl_profile(source.base_url, db)

            job.pages_crawled = 1
            job.images_found = len(crawled_images)
            db.commit()

            # Filter already-crawled URLs from state
            previously_crawled = set(crawl_state.get("crawled_urls", []))
            new_images = [ci for ci in crawled_images if ci.url not in previously_crawled]

            logger.info(
                f"Job {job_id}: Social crawl found {len(crawled_images)} total, "
                f"{len(new_images)} new (skipping {len(previously_crawled)} from state)"
            )

            # Download images using social crawler's fetch (with proxy)
            for ci in new_images:
                db.refresh(job)
                if job.status == "cancelled":
                    break

                url_hash = hashlib.sha256(ci.url.encode()).hexdigest()
                if db.query(FaceImage).filter(FaceImage.url_hash == url_hash).first():
                    job.images_skipped += 1
                    db.commit()
                    previously_crawled.add(ci.url)
                    continue

                logger.debug(f"Job {job_id}: Downloading social image: {ci.url[:80]}...")
                data = await social.fetch_image_bytes(ci.url, db)
                if not data:
                    logger.warning(f"Job {job_id}: Failed to download: {ci.url[:80]}")
                    job.errors_count += 1
                    db.commit()
                    continue

                # Use smaller min size for social profile photos
                min_size = SOCIAL_MIN_IMAGE_SIZE if ci.context == "profile_photo" else int(
                    getattr(settings, "FACE_INDEX_MIN_IMAGE_SIZE", 10240)
                )
                if len(data) < min_size:
                    logger.debug(f"Job {job_id}: Image too small ({len(data)} bytes): {ci.url[:80]}")
                    job.images_skipped += 1
                    db.commit()
                    previously_crawled.add(ci.url)
                    continue

                ct = "image/jpeg"
                lower_url = ci.url.lower().split("?")[0]
                if lower_url.endswith(".png"):
                    ct = "image/png"
                elif lower_url.endswith(".webp"):
                    ct = "image/webp"

                record = store_downloaded_image(
                    source=source,
                    job_id=job.id,
                    source_url=ci.url,
                    page_url=ci.page_url,
                    image_bytes=data,
                    content_type=ct,
                    db=db,
                )
                if record:
                    job.images_downloaded += 1
                    db.commit()
                    logger.info(f"Job {job_id}: Stored image {record.id}, processing faces...")
                    n_faces = await process_image(record.id, db)
                    job.faces_detected += n_faces
                    job.faces_indexed += n_faces
                    db.commit()
                    logger.info(f"Job {job_id}: Image {record.id} -> {n_faces} faces detected")
                else:
                    job.images_skipped += 1
                    db.commit()

                previously_crawled.add(ci.url)

            # Save crawl state
            _save_crawl_state(source, {
                "crawled_urls": list(previously_crawled)[-500:],  # Keep last 500
                "last_crawl_time": datetime.now(timezone.utc).isoformat(),
            }, db)

        # ---- Website / Standard Sources ----
        else:
            max_pages = config.get("max_pages", 50)
            max_depth = config.get("depth", 2)

            domain = urlparse(source.base_url).netloc
            robots_txt = await fetch_robots_txt(domain)
            source.robots_txt_cached = robots_txt
            source.robots_txt_fetched_at = datetime.now(timezone.utc)
            db.commit()

            # Resume from state: load previously visited URLs
            visited: Set[str] = set(crawl_state.get("visited_urls", []))
            resume_queue = crawl_state.get("pending_queue", [])
            if resume_queue:
                queue = [(url, d) for url, d in resume_queue]
                logger.info(f"Job {job_id}: Resuming from state with {len(visited)} visited, {len(queue)} pending")
            else:
                queue = [(source.base_url, 0)]

            all_image_urls: List[tuple] = []

            headers = {"User-Agent": user_agent}

            async with httpx.AsyncClient(
                timeout=15, follow_redirects=True, headers=headers,
                proxy=proxy_url,
            ) as client:
                while queue and len(visited) < max_pages:
                    db.refresh(job)
                    if job.status == "cancelled":
                        logger.info(f"Job {job_id} cancelled, saving state...")
                        _save_crawl_state(source, {
                            "visited_urls": list(visited)[-1000:],
                            "pending_queue": queue[:200],
                        }, db)
                        return

                    url, depth = queue.pop(0)
                    if url in visited:
                        continue

                    path = urlparse(url).path
                    if not is_allowed_by_robots(robots_txt, path, user_agent):
                        continue

                    visited.add(url)
                    await _rate_limiter.acquire(domain, source.rate_limit_rpm)

                    try:
                        resp = await client.get(url)
                        if resp.status_code != 200:
                            continue
                        content_type = resp.headers.get("content-type", "")
                        if "text/html" not in content_type:
                            continue

                        html = resp.text
                        job.pages_crawled = len(visited)
                        db.commit()

                        images = extract_image_urls(html, url)
                        for img_url in images:
                            all_image_urls.append((img_url, url))

                        job.images_found = len(all_image_urls)
                        db.commit()

                        if depth < max_depth:
                            links = extract_page_links(html, url, same_domain=True)
                            for link in links:
                                if link not in visited:
                                    queue.append((link, depth + 1))

                        # Save state periodically (every 10 pages)
                        if len(visited) % 10 == 0:
                            _save_crawl_state(source, {
                                "visited_urls": list(visited)[-1000:],
                                "pending_queue": queue[:200],
                            }, db)

                    except Exception as e:
                        job.errors_count += 1
                        db.commit()
                        logger.debug(f"Page fetch error {url}: {e}")

            logger.info(f"Job {job_id}: Found {len(all_image_urls)} image URLs, downloading...")
            await _download_and_process_images(all_image_urls, source, job, db, proxy_url)

            # Save final state
            _save_crawl_state(source, {
                "visited_urls": list(visited)[-1000:],
                "pending_queue": [],
                "completed": True,
            }, db)

        # Flush FAISS to disk
        from app.modules.face_index.vector_store import get_face_index_store
        await get_face_index_store().flush()

        # Update source stats
        source.total_images_found = db.query(FaceImage).filter(FaceImage.source_id == source.id).count()
        from app.modules.face_index.models import IndexedFace as IF
        source.total_faces_indexed = db.query(IF).filter(IF.source_id == source.id).count()
        source.last_crawl_at = datetime.now(timezone.utc)
        source.last_crawl_status = "succeeded"

        job.status = "succeeded"
        job.finished_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            f"Job {job_id} completed: {job.pages_crawled} pages, "
            f"{job.images_downloaded} images, {job.faces_indexed} faces"
        )

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        job.status = "failed"
        job.message = str(e)[:500]
        job.finished_at = datetime.now(timezone.utc)
        source.last_crawl_status = "failed"
        db.commit()
