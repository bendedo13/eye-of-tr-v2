"""Twitter/X public profile crawler.

Extracts profile photos and header images from public Twitter/X profiles.
Uses Nitter instances as a fallback for easier HTML parsing.
"""
import logging
import re
from typing import List
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.modules.face_index.social_crawlers.base import BaseSocialCrawler, CrawledImage

logger = logging.getLogger(__name__)

# Known public Nitter instances (open source Twitter frontend)
NITTER_INSTANCES = [
    "nitter.privacydev.net",
    "nitter.poast.org",
    "nitter.cz",
]


class TwitterCrawler(BaseSocialCrawler):
    PLATFORM = "twitter"

    def _get_referer(self) -> str:
        return "https://x.com/"

    def _extract_username(self, url: str) -> str:
        """Extract username from Twitter/X URL."""
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        parts = path.split("/")
        # Filter out non-username paths
        reserved = {"home", "explore", "search", "settings", "i", "compose", "messages", "notifications"}
        username = parts[0] if parts else ""
        return "" if username.lower() in reserved else username

    async def crawl_profile(self, profile_url: str, db: Session) -> List[CrawledImage]:
        """Extract image URLs from a public Twitter/X profile."""
        results: List[CrawledImage] = []
        username = self._extract_username(profile_url)
        if not username:
            logger.warning(f"Could not extract username from: {profile_url}")
            return results

        # Strategy 1: Try X.com directly
        await self.rate_limiter.acquire("x.com", rpm=10)
        x_results = await self._crawl_x_direct(username, db)
        results.extend(x_results)

        # Strategy 2: Try Nitter instances if direct failed
        if not results:
            nitter_results = await self._crawl_nitter(username, db)
            results.extend(nitter_results)

        logger.info(f"[Twitter] @{username}: found {len(results)} images")
        return results

    async def _crawl_x_direct(self, username: str, db: Session) -> List[CrawledImage]:
        """Try to extract images from x.com directly."""
        results: List[CrawledImage] = []
        url = f"https://x.com/{username}"

        resp = await self.fetch_with_proxy(url, db)
        if not resp:
            return results

        html = resp.text

        # Extract og:image (profile photo)
        og_image = self._extract_meta_image(html, "og:image")
        if og_image:
            results.append(CrawledImage(
                url=og_image,
                page_url=url,
                context="profile_photo",
            ))

        # Extract twitter:image
        tw_image = self._extract_meta_image(html, "twitter:image")
        if tw_image and tw_image not in [r.url for r in results]:
            results.append(CrawledImage(
                url=tw_image,
                page_url=url,
                context="profile_photo",
            ))

        # Extract profile image from embedded data
        profile_images = self._extract_twitter_cdn_images(html)
        for img_url in profile_images:
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(
                    url=img_url,
                    page_url=url,
                    context="profile_photo",
                ))

        return results

    async def _crawl_nitter(self, username: str, db: Session) -> List[CrawledImage]:
        """Try Nitter instances for easier HTML parsing."""
        results: List[CrawledImage] = []

        for instance in NITTER_INSTANCES:
            await self.rate_limiter.acquire(instance, rpm=5)
            url = f"https://{instance}/{username}"

            resp = await self.fetch_with_proxy(url, db, max_retries=1)
            if not resp:
                continue

            html = resp.text

            # Nitter has straightforward HTML - profile pic in .profile-card-avatar
            avatar_match = re.search(
                r'class="profile-card-avatar"[^>]*>\s*<img[^>]+src="([^"]+)"',
                html, re.I,
            )
            if avatar_match:
                img_url = avatar_match.group(1)
                # Nitter proxies images, resolve to original
                if img_url.startswith("/pic/"):
                    img_url = f"https://{instance}{img_url}"
                results.append(CrawledImage(
                    url=img_url,
                    page_url=url,
                    context="profile_photo",
                ))

            # Extract banner/header image
            banner_match = re.search(
                r'class="profile-banner"[^>]*>\s*(?:<a[^>]*>)?\s*<img[^>]+src="([^"]+)"',
                html, re.I,
            )
            if banner_match:
                img_url = banner_match.group(1)
                if img_url.startswith("/pic/"):
                    img_url = f"https://{instance}{img_url}"
                results.append(CrawledImage(
                    url=img_url,
                    page_url=url,
                    context="header_image",
                ))

            # Extract timeline images
            for m in re.finditer(r'class="still-image"[^>]*href="([^"]+)"', html):
                img_url = m.group(1)
                if img_url.startswith("/pic/"):
                    img_url = f"https://{instance}{img_url}"
                if img_url not in [r.url for r in results]:
                    results.append(CrawledImage(
                        url=img_url,
                        page_url=url,
                        context="post_image",
                    ))

            if results:
                break  # Found images, stop trying other instances

        return results[:20]

    def _extract_meta_image(self, html: str, property_name: str) -> str:
        """Extract image from meta tag."""
        match = re.search(
            rf'<meta\s+(?:property|name)=["\']{ re.escape(property_name) }["\']\s+content=["\']([^"\']+)["\']',
            html, re.I,
        )
        if not match:
            match = re.search(
                rf'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']{ re.escape(property_name) }["\']',
                html, re.I,
            )
        return match.group(1) if match else ""

    def _extract_twitter_cdn_images(self, html: str) -> List[str]:
        """Extract Twitter CDN image URLs."""
        urls = set()
        for pattern in [
            r'(https?://pbs\.twimg\.com/profile_images/[^\s"\'<>]+)',
            r'(https?://pbs\.twimg\.com/profile_banners/[^\s"\'<>]+)',
            r'(https?://pbs\.twimg\.com/media/[^\s"\'<>]+)',
        ]:
            for m in re.finditer(pattern, html, re.I):
                url = m.group(1).split("?")[0]
                urls.add(url)
        return list(urls)[:10]
