"""Base class for social media crawlers with proxy support."""
import logging
import time
from dataclasses import dataclass
from typing import List, Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.face_index.proxy_manager import ProxyManager
from app.modules.face_index.crawler import DomainRateLimiter

logger = logging.getLogger(__name__)


@dataclass
class CrawledImage:
    """Represents an image URL found by a social crawler."""
    url: str
    page_url: str
    context: str = ""  # e.g. "profile_photo", "post_image", "header_image"


class BaseSocialCrawler:
    """Base class for social media crawlers with proxy rotation and rate limiting."""

    PLATFORM = "unknown"
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    def __init__(self, proxy_manager: ProxyManager, rate_limiter: DomainRateLimiter):
        self.proxy_manager = proxy_manager
        self.rate_limiter = rate_limiter
        self._timeout = int(getattr(settings, "FACE_INDEX_PROXY_TIMEOUT", 15))

    def _get_headers(self) -> dict:
        """Return platform-specific HTTP headers."""
        return {
            "User-Agent": self.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        }

    async def fetch_with_proxy(
        self, url: str, db: Session, headers: Optional[dict] = None, max_retries: int = 3
    ) -> Optional[httpx.Response]:
        """Fetch a URL using a proxy from the pool, with retry logic."""
        hdrs = headers or self._get_headers()

        for attempt in range(max_retries):
            proxy_info = self.proxy_manager.get_next_proxy(db)
            proxy_url = proxy_info["url"] if proxy_info else None

            try:
                start = time.monotonic()
                async with httpx.AsyncClient(
                    proxy=proxy_url,
                    timeout=self._timeout,
                    follow_redirects=True,
                    headers=hdrs,
                ) as client:
                    resp = await client.get(url)
                    elapsed_ms = int((time.monotonic() - start) * 1000)

                    if proxy_info:
                        self.proxy_manager.report_success(proxy_info["id"], elapsed_ms, db)

                    if resp.status_code == 200:
                        return resp

                    logger.debug(
                        f"[{self.PLATFORM}] {url} returned {resp.status_code} "
                        f"(proxy={proxy_info['id'] if proxy_info else 'direct'})"
                    )
            except Exception as e:
                if proxy_info:
                    self.proxy_manager.report_failure(proxy_info["id"], db)
                logger.debug(
                    f"[{self.PLATFORM}] fetch error attempt {attempt + 1}: {e} "
                    f"(proxy={proxy_info['id'] if proxy_info else 'direct'})"
                )

        return None

    async def fetch_image_bytes(
        self, url: str, db: Session, max_retries: int = 2
    ) -> Optional[bytes]:
        """Download image bytes through proxy."""
        headers = {
            "User-Agent": self.USER_AGENT,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": self._get_referer(),
        }

        for attempt in range(max_retries):
            proxy_info = self.proxy_manager.get_next_proxy(db)
            proxy_url = proxy_info["url"] if proxy_info else None

            try:
                start = time.monotonic()
                async with httpx.AsyncClient(
                    proxy=proxy_url,
                    timeout=self._timeout,
                    follow_redirects=True,
                ) as client:
                    resp = await client.get(url, headers=headers)
                    elapsed_ms = int((time.monotonic() - start) * 1000)

                    if proxy_info:
                        self.proxy_manager.report_success(proxy_info["id"], elapsed_ms, db)

                    ct = resp.headers.get("content-type", "")
                    if resp.status_code == 200 and ct.startswith("image/"):
                        return resp.content
            except Exception as e:
                if proxy_info:
                    self.proxy_manager.report_failure(proxy_info["id"], db)
                logger.debug(f"[{self.PLATFORM}] image download error: {e}")

        return None

    def _get_referer(self) -> str:
        """Return the referer header for the platform."""
        return ""

    async def crawl_profile(self, profile_url: str, db: Session) -> List[CrawledImage]:
        """Override in subclasses. Extract image URLs from a public profile."""
        raise NotImplementedError
