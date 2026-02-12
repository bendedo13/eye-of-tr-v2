"""TikTok public profile crawler.

Extracts profile photos and video thumbnails from public TikTok profiles.
Uses ProxiTok instances and public web metadata.
"""
import logging
import re
from typing import List
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.modules.face_index.social_crawlers.base import BaseSocialCrawler, CrawledImage

logger = logging.getLogger(__name__)

# Public ProxiTok instances (open-source TikTok frontend)
PROXITOK_INSTANCES = [
    "proxitok.pabloferreiro.es",
    "tok.artemislena.eu",
    "proxitok.pussthecat.org",
]


class TiktokCrawler(BaseSocialCrawler):
    PLATFORM = "tiktok"

    def _get_referer(self) -> str:
        return "https://www.tiktok.com/"

    def _extract_username(self, url: str) -> str:
        """Extract username from TikTok URL."""
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        if path.startswith("@"):
            return path[1:]
        return path

    async def crawl_profile(self, profile_url: str, db: Session) -> List[CrawledImage]:
        """Extract image URLs from a public TikTok profile."""
        results: List[CrawledImage] = []
        username = self._extract_username(profile_url)
        if not username:
            logger.warning(f"[TikTok] Could not extract username from: {profile_url}")
            return results

        # Strategy 1: ProxiTok fallback (Reliable HTML)
        logger.info(f"[TikTok] @{username}: Strategy 1 - ProxiTok")
        proxitok_results = await self._crawl_proxitok(username, db)
        results.extend(proxitok_results)

        # Strategy 2: Direct TikTok metadata (if ProxiTok fails)
        if not results:
            logger.info(f"[TikTok] @{username}: Strategy 2 - Direct web meta")
            await self.rate_limiter.acquire("tiktok.com", rpm=5)
            meta_results = await self._crawl_direct_meta(username, db)
            results.extend(meta_results)

        logger.info(f"[TikTok] @{username}: Total found {len(results)} images")
        return results

    async def _crawl_proxitok(self, username: str, db: Session) -> List[CrawledImage]:
        """Try ProxiTok instances."""
        results: List[CrawledImage] = []

        for instance in PROXITOK_INSTANCES:
            await self.rate_limiter.acquire(instance, rpm=5)
            url = f"https://{instance}/@{username}"

            resp = await self.fetch_with_proxy(url, db, max_retries=1)
            if not resp:
                continue

            html = resp.text

            # Profile avatar
            avatar_match = re.search(
                r'class="is-rounded[^"]*"[^>]+src="([^"]+)"',
                html, re.I,
            )
            if avatar_match:
                img_url = avatar_match.group(1)
                results.append(CrawledImage(url=img_url, page_url=url, context="profile_photo"))

            # Video thumbnails
            for m in re.finditer(r'<img[^>]+src="([^"]+)"[^>]*class="video-feed-item[^"]*"', html):
                img_url = m.group(1)
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(url=img_url, page_url=url, context="post_image"))

            # Any TikTok CDN URLs
            for m in re.finditer(r'(https?://[a-z0-9.-]+\.tiktokcdn\.com/[^\s"\'<>]+)', html, re.I):
                img_url = m.group(1)
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(url=img_url, page_url=url, context="post_image"))

            if results:
                break

        return results[:20]

    async def _crawl_direct_meta(self, username: str, db: Session) -> List[CrawledImage]:
        """Try to extract images from tiktok.com meta tags."""
        results: List[CrawledImage] = []
        url = f"https://www.tiktok.com/@{username}"

        resp = await self.fetch_with_proxy(url, db)
        if not resp:
            return results

        html = resp.text

        # og:image
        match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
        if match:
            results.append(CrawledImage(url=match.group(1), page_url=url, context="profile_photo"))

        # Also find any other images in the meta tags
        for m in re.finditer(r'content="(https?://[a-z0-9.-]+\.tiktokcdn\.com/[^"]+)"', html):
            img_url = m.group(1)
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(url=img_url, page_url=url, context="post_image"))

        return results
