"""Instagram public profile crawler.

Extracts profile photos and public post images from Instagram public profiles.
Uses multiple strategies: direct HTML, mobile API, and Proxigram/Bibliogram fallbacks.
"""
import json
import logging
import re
from typing import List
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.modules.face_index.social_crawlers.base import BaseSocialCrawler, CrawledImage

logger = logging.getLogger(__name__)

# Public Proxigram/Bibliogram instances (open-source Instagram frontends)
PROXIGRAM_INSTANCES = [
    "proxigram.lunar.icu",
    "ig.opnxng.com",
    "proxigram.privacydev.net",
]


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
        parts = path.split("/")
        return parts[0] if parts else ""

    async def crawl_profile(self, profile_url: str, db: Session) -> List[CrawledImage]:
        """Extract image URLs from a public Instagram profile using multiple strategies."""
        results: List[CrawledImage] = []
        username = self._extract_username(profile_url)
        if not username:
            logger.warning(f"[Instagram] Could not extract username from: {profile_url}")
            return results

        normalized_url = f"https://www.instagram.com/{username}/"

        # Strategy 1: Direct Instagram fetch (og:image, JSON-LD, CDN URLs)
        logger.info(f"[Instagram] @{username}: Strategy 1 - Direct HTML fetch")
        await self.rate_limiter.acquire("instagram.com", rpm=10)
        resp = await self.fetch_with_proxy(normalized_url, db)
        if resp:
            html = resp.text
            logger.debug(f"[Instagram] @{username}: Got {len(html)} bytes of HTML")

            og_image = self._extract_og_image(html)
            if og_image:
                logger.info(f"[Instagram] @{username}: Found og:image profile photo")
                results.append(CrawledImage(url=og_image, page_url=normalized_url, context="profile_photo"))

            ld_images = self._extract_json_ld_images(html)
            logger.info(f"[Instagram] @{username}: Found {len(ld_images)} JSON-LD images")
            for img_url in ld_images:
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(url=img_url, page_url=normalized_url, context="post_image"))

            shared_images = self._extract_shared_data_images(html)
            logger.info(f"[Instagram] @{username}: Found {len(shared_images)} shared data images")
            for img_url in shared_images:
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(url=img_url, page_url=normalized_url, context="post_image"))

            page_images = self._extract_display_urls(html)
            logger.info(f"[Instagram] @{username}: Found {len(page_images)} CDN images")
            for img_url in page_images:
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(url=img_url, page_url=normalized_url, context="post_image"))
        else:
            logger.warning(f"[Instagram] @{username}: Direct fetch failed")

        # Strategy 2: Try Instagram JSON API (?__a=1&__d=dis)
        if len(results) < 3:
            logger.info(f"[Instagram] @{username}: Strategy 2 - JSON API endpoint")
            await self.rate_limiter.acquire("instagram.com", rpm=10)
            api_url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
            api_headers = self._get_headers()
            api_headers["X-IG-App-ID"] = "936619743392459"
            api_headers["X-Requested-With"] = "XMLHttpRequest"
            api_resp = await self.fetch_with_proxy(api_url, db, headers=api_headers)
            if api_resp:
                try:
                    api_data = api_resp.json()
                    user_data = api_data.get("data", {}).get("user", {})
                    # Profile pic HD
                    profile_pic = user_data.get("profile_pic_url_hd") or user_data.get("profile_pic_url")
                    if profile_pic and profile_pic not in [r.url for r in results]:
                        logger.info(f"[Instagram] @{username}: API returned profile pic HD")
                        results.append(CrawledImage(url=profile_pic, page_url=normalized_url, context="profile_photo"))

                    # Edge timeline media — increased limit for better coverage
                    edges = (user_data.get("edge_owner_to_timeline_media", {})
                             .get("edges", []))
                    for edge in edges[:50]:
                        node = edge.get("node", {})
                        display_url = node.get("display_url")
                        if display_url and display_url not in [r.url for r in results]:
                            results.append(CrawledImage(url=display_url, page_url=normalized_url, context="post_image"))
                    logger.info(f"[Instagram] @{username}: API returned {len(edges)} timeline edges")
                except Exception as e:
                    logger.debug(f"[Instagram] @{username}: API parse error: {e}")
            else:
                logger.debug(f"[Instagram] @{username}: API endpoint failed")

        # Strategy 3: Proxigram fallback (like Nitter for Instagram)
        if len(results) < 3:
            logger.info(f"[Instagram] @{username}: Strategy 3 - Proxigram fallback")
            proxigram_results = await self._crawl_proxigram(username, db)
            for ci in proxigram_results:
                if ci.url not in [r.url for r in results]:
                    results.append(ci)

        # Strategy 4: Authenticated follower profile photo crawling
        logger.info(f"[Instagram] @{username}: Strategy 4 - Authenticated follower crawl")
        try:
            from app.modules.face_index.social_crawlers.instagram_auth import get_ig_auth_crawler
            auth_crawler = get_ig_auth_crawler()
            follower_photos = await auth_crawler.crawl_followers_profile_photos(username, db)
            for ci in follower_photos:
                if ci.url not in [r.url for r in results]:
                    results.append(ci)
            if follower_photos:
                logger.info(f"[Instagram] @{username}: Auth crawler added {len(follower_photos)} follower photos")
        except Exception as e:
            logger.debug(f"[Instagram] @{username}: Auth follower crawl skipped: {e}")

        logger.info(f"[Instagram] @{username}: Total found {len(results)} images across all strategies")
        return results

    async def _crawl_proxigram(self, username: str, db: Session) -> List[CrawledImage]:
        """Try Proxigram instances (open-source Instagram frontend)."""
        results: List[CrawledImage] = []

        for instance in PROXIGRAM_INSTANCES:
            await self.rate_limiter.acquire(instance, rpm=5)
            url = f"https://{instance}/u/{username}"

            resp = await self.fetch_with_proxy(url, db, max_retries=1)
            if not resp:
                continue

            html = resp.text

            # Profile avatar
            avatar_match = re.search(
                r'<img[^>]+class="[^"]*avatar[^"]*"[^>]+src="([^"]+)"',
                html, re.I,
            )
            if avatar_match:
                img_url = avatar_match.group(1)
                if img_url.startswith("/"):
                    img_url = f"https://{instance}{img_url}"
                results.append(CrawledImage(url=img_url, page_url=url, context="profile_photo"))

            # Post images
            for m in re.finditer(r'<img[^>]+src="([^"]+)"[^>]*class="[^"]*post[^"]*"', html, re.I):
                img_url = m.group(1)
                if img_url.startswith("/"):
                    img_url = f"https://{instance}{img_url}"
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(url=img_url, page_url=url, context="post_image"))

            # Any CDN images in the page
            for pattern in [
                r'(https?://(?:scontent|instagram)[a-z0-9.-]*\.(?:cdninstagram|fbcdn)\.net/[^\s"\'<>]+)',
                r'src="(/proxy/[^\s"\'<>]+)"',
            ]:
                for m in re.finditer(pattern, html, re.I):
                    img_url = m.group(1)
                    if img_url.startswith("/"):
                        img_url = f"https://{instance}{img_url}"
                    if img_url not in [r.url for r in results]:
                        results.append(CrawledImage(url=img_url, page_url=url, context="post_image"))

            if results:
                logger.info(f"[Instagram] Proxigram {instance}: found {len(results)} images for @{username}")
                break

        return results[:30]

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
        match = re.search(r'window\._sharedData\s*=\s*({.*?});</script>', html, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                self._deep_extract_urls(data, images)
            except (json.JSONDecodeError, Exception):
                pass

        for m in re.finditer(r'"display_url"\s*:\s*"([^"]+)"', html):
            url = m.group(1).replace("\\u0026", "&").replace("\\/", "/")
            if url not in images:
                images.append(url)

        return images

    def _extract_display_urls(self, html: str) -> List[str]:
        """Extract Instagram CDN image URLs from HTML."""
        urls = set()
        for pattern in [
            r'(https?://(?:scontent|instagram)[a-z0-9.-]*\.(?:cdninstagram|fbcdn)\.net/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))',
            r'(https?://[a-z0-9.-]*\.fbcdn\.net/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))',
        ]:
            for m in re.finditer(pattern, html, re.I):
                url = m.group(1).replace("\\u0026", "&").replace("\\/", "/").split("?")[0]
                if "s150x150" not in url and "s320x320" not in url:
                    urls.add(url)
        return list(urls)[:20]

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
