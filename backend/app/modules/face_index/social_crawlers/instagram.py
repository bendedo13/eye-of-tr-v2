"""Instagram public profile crawler.

Extracts profile photos and public post images from Instagram public profiles.
Requires proxy rotation to avoid rate limiting.
"""
import json
import logging
import re
from typing import List
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.modules.face_index.social_crawlers.base import BaseSocialCrawler, CrawledImage

logger = logging.getLogger(__name__)


class InstagramCrawler(BaseSocialCrawler):
    PLATFORM = "instagram"

    def _get_headers(self) -> dict:
        headers = super()._get_headers()
        headers["Sec-Fetch-Site"] = "none"
        headers["Sec-Fetch-Mode"] = "navigate"
        headers["Sec-Fetch-Dest"] = "document"
        return headers

    def _get_referer(self) -> str:
        return "https://www.instagram.com/"

    def _extract_username(self, url: str) -> str:
        """Extract username from Instagram URL."""
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        # Handle URLs like instagram.com/username or instagram.com/username/
        parts = path.split("/")
        return parts[0] if parts else ""

    async def crawl_profile(self, profile_url: str, db: Session) -> List[CrawledImage]:
        """Extract image URLs from a public Instagram profile."""
        results: List[CrawledImage] = []
        username = self._extract_username(profile_url)
        if not username:
            logger.warning(f"Could not extract username from: {profile_url}")
            return results

        normalized_url = f"https://www.instagram.com/{username}/"

        # Rate limit
        await self.rate_limiter.acquire("instagram.com", rpm=10)

        # Strategy 1: Fetch profile page HTML
        resp = await self.fetch_with_proxy(normalized_url, db)
        if not resp:
            logger.warning(f"[Instagram] Could not fetch profile: {normalized_url}")
            return results

        html = resp.text

        # Extract from og:image meta tag (profile photo - high res)
        og_image = self._extract_og_image(html)
        if og_image:
            results.append(CrawledImage(
                url=og_image,
                page_url=normalized_url,
                context="profile_photo",
            ))

        # Extract from JSON-LD structured data
        ld_images = self._extract_json_ld_images(html)
        for img_url in ld_images:
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(
                    url=img_url,
                    page_url=normalized_url,
                    context="post_image",
                ))

        # Extract from _sharedData or embedded JSON
        shared_images = self._extract_shared_data_images(html)
        for img_url in shared_images:
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(
                    url=img_url,
                    page_url=normalized_url,
                    context="post_image",
                ))

        # Extract high-res images from any image URLs in page
        page_images = self._extract_display_urls(html)
        for img_url in page_images:
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(
                    url=img_url,
                    page_url=normalized_url,
                    context="post_image",
                ))

        logger.info(f"[Instagram] @{username}: found {len(results)} images")
        return results

    def _extract_og_image(self, html: str) -> str:
        """Extract og:image meta tag content."""
        match = re.search(
            r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            html, re.I,
        )
        if not match:
            match = re.search(
                r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:image["\']',
                html, re.I,
            )
        return match.group(1) if match else ""

    def _extract_json_ld_images(self, html: str) -> List[str]:
        """Extract images from JSON-LD structured data."""
        images = []
        for match in re.finditer(
            r'<script\s+type=["\']application/ld\+json["\']\s*>(.*?)</script>',
            html, re.DOTALL,
        ):
            try:
                data = json.loads(match.group(1))
                if isinstance(data, list):
                    for item in data:
                        self._collect_images_from_json(item, images)
                else:
                    self._collect_images_from_json(data, images)
            except (json.JSONDecodeError, Exception):
                continue
        return images

    def _collect_images_from_json(self, data: dict, images: List[str]):
        """Recursively collect image URLs from JSON data."""
        if not isinstance(data, dict):
            return
        for key in ("image", "thumbnailUrl", "contentUrl", "url"):
            val = data.get(key)
            if isinstance(val, str) and self._is_image_url(val):
                images.append(val)
            elif isinstance(val, list):
                for v in val:
                    if isinstance(v, str) and self._is_image_url(v):
                        images.append(v)

    def _extract_shared_data_images(self, html: str) -> List[str]:
        """Extract images from window._sharedData or similar embedded JSON."""
        images = []
        # Pattern for _sharedData
        match = re.search(r'window\._sharedData\s*=\s*({.*?});</script>', html, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                self._deep_extract_urls(data, images)
            except (json.JSONDecodeError, Exception):
                pass

        # Pattern for __additionalDataLoaded or similar
        for m in re.finditer(r'"display_url"\s*:\s*"([^"]+)"', html):
            url = m.group(1).replace("\\u0026", "&").replace("\\/", "/")
            if url not in images:
                images.append(url)

        return images

    def _extract_display_urls(self, html: str) -> List[str]:
        """Extract Instagram CDN image URLs from HTML."""
        urls = set()
        # Instagram CDN patterns
        for pattern in [
            r'(https?://(?:scontent|instagram)[a-z0-9.-]*\.(?:cdninstagram|fbcdn)\.net/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))',
            r'(https?://[a-z0-9.-]*\.fbcdn\.net/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))',
        ]:
            for m in re.finditer(pattern, html, re.I):
                url = m.group(1).replace("\\u0026", "&").replace("\\/", "/").split("?")[0]
                # Filter out tiny thumbnails
                if "s150x150" not in url and "s320x320" not in url:
                    urls.add(url)
        return list(urls)[:20]  # Limit

    def _deep_extract_urls(self, obj, images: List[str], depth: int = 0):
        """Recursively extract image URLs from nested JSON."""
        if depth > 10:
            return
        if isinstance(obj, dict):
            for key, val in obj.items():
                if key in ("display_url", "thumbnail_src", "profile_pic_url_hd", "profile_pic_url"):
                    if isinstance(val, str) and self._is_image_url(val):
                        images.append(val)
                else:
                    self._deep_extract_urls(val, images, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                self._deep_extract_urls(item, images, depth + 1)

    def _is_image_url(self, url: str) -> bool:
        """Check if URL looks like an image."""
        lower = url.lower()
        return any(ext in lower for ext in (".jpg", ".jpeg", ".png", ".webp")) or "cdninstagram" in lower or "fbcdn" in lower
