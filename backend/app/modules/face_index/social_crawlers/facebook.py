"""Facebook public profile crawler.

Extracts profile photos from public Facebook profiles.
Uses mbasic.facebook.com for simpler HTML parsing.
"""
import logging
import re
from typing import List
from urllib.parse import urlparse, unquote

from sqlalchemy.orm import Session

from app.modules.face_index.social_crawlers.base import BaseSocialCrawler, CrawledImage

logger = logging.getLogger(__name__)


class FacebookCrawler(BaseSocialCrawler):
    PLATFORM = "facebook"

    def _get_referer(self) -> str:
        return "https://www.facebook.com/"

    def _extract_username(self, url: str) -> str:
        """Extract username or profile ID from Facebook URL."""
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        parts = path.split("/")

        # Handle /profile.php?id=123
        if parts and parts[0] == "profile.php":
            from urllib.parse import parse_qs
            params = parse_qs(parsed.query)
            return params.get("id", [""])[0]

        reserved = {
            "pages", "groups", "events", "marketplace", "watch",
            "gaming", "stories", "reels", "login", "help",
        }
        username = parts[0] if parts else ""
        return "" if username.lower() in reserved else username

    async def crawl_profile(self, profile_url: str, db: Session) -> List[CrawledImage]:
        """Extract image URLs from a public Facebook profile."""
        results: List[CrawledImage] = []
        username = self._extract_username(profile_url)
        if not username:
            logger.warning(f"Could not extract username from: {profile_url}")
            return results

        # Strategy 1: Try mbasic.facebook.com (simpler HTML)
        await self.rate_limiter.acquire("facebook.com", rpm=8)
        mbasic_results = await self._crawl_mbasic(username, db)
        results.extend(mbasic_results)

        # Strategy 2: Try main facebook.com
        if not results:
            await self.rate_limiter.acquire("facebook.com", rpm=8)
            main_results = await self._crawl_main(username, db)
            results.extend(main_results)

        # Strategy 3: Try to crawl public friends list from mbasic
        logger.info(f"[Facebook] {username}: Strategy 3 - Public friends crawl")
        friends_results = await self._crawl_friends(username, db)
        for ci in friends_results:
            if ci.url not in [r.url for r in results]:
                results.append(ci)

        logger.info(f"[Facebook] {username}: found {len(results)} total images")
        return results

    async def _crawl_friends(self, username: str, db: Session) -> List[CrawledImage]:
        """Crawl mbasic.facebook.com for public friends list and their profile photos."""
        results: List[CrawledImage] = []

        if username.isdigit():
            url = f"https://mbasic.facebook.com/profile.php?id={username}&sk=friends"
        else:
            url = f"https://mbasic.facebook.com/{username}/friends"

        await self.rate_limiter.acquire("facebook.com", rpm=5)
        resp = await self.fetch_with_proxy(url, db)
        if not resp:
            return results

        html = resp.text
        
        # Extract profile photos from the friends list
        # Patterns to find <img> tags that are profile pics in the friends list
        for m in re.finditer(r'<img[^>]+src="([^"]+?fbcdn[^"]+?)"[^>]+alt="([^"]+?)"', html, re.I):
            img_url = unquote(m.group(1)).replace("&amp;", "&")
            friend_name = m.group(2)
            
            if any(skip in img_url.lower() for skip in ("static", "rsrc", "pixel", "emoji")):
                continue
                
            results.append(CrawledImage(
                url=img_url,
                page_url=url,
                context="profile_photo",
            ))

        return results[:30]

    async def _crawl_mbasic(self, username: str, db: Session) -> List[CrawledImage]:
        """Crawl mbasic.facebook.com for simpler HTML."""
        results: List[CrawledImage] = []

        # Determine URL format
        if username.isdigit():
            url = f"https://mbasic.facebook.com/profile.php?id={username}"
        else:
            url = f"https://mbasic.facebook.com/{username}"

        resp = await self.fetch_with_proxy(url, db)
        if not resp:
            return results

        html = resp.text

        # Extract profile picture from mbasic page
        # mbasic uses simple <img> tags with the profile pic
        profile_pic = self._extract_mbasic_profile_pic(html)
        if profile_pic:
            results.append(CrawledImage(
                url=profile_pic,
                page_url=url,
                context="profile_photo",
            ))

        # Extract cover photo
        cover = self._extract_mbasic_cover(html)
        if cover and cover not in [r.url for r in results]:
            results.append(CrawledImage(
                url=cover,
                page_url=url,
                context="cover_photo",
            ))

        # Extract photos from timeline
        timeline_imgs = self._extract_mbasic_images(html)
        for img_url in timeline_imgs:
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(
                    url=img_url,
                    page_url=url,
                    context="post_image",
                ))

        return results[:15]

    async def _crawl_main(self, username: str, db: Session) -> List[CrawledImage]:
        """Crawl www.facebook.com for og:image and embedded data."""
        results: List[CrawledImage] = []

        if username.isdigit():
            url = f"https://www.facebook.com/profile.php?id={username}"
        else:
            url = f"https://www.facebook.com/{username}"

        resp = await self.fetch_with_proxy(url, db)
        if not resp:
            return results

        html = resp.text

        # Extract og:image
        og_image = self._extract_meta_image(html, "og:image")
        if og_image:
            results.append(CrawledImage(
                url=og_image,
                page_url=url,
                context="profile_photo",
            ))

        # Extract Facebook CDN images
        cdn_images = self._extract_fb_cdn_images(html)
        for img_url in cdn_images:
            if img_url not in [r.url for r in results]:
                results.append(CrawledImage(
                    url=img_url,
                    page_url=url,
                    context="post_image",
                ))

        return results[:15]

    def _extract_mbasic_profile_pic(self, html: str) -> str:
        """Extract profile picture from mbasic Facebook HTML."""
        # Profile pic is typically in an <img> tag with alt containing the name
        # within a profile-photo section
        match = re.search(
            r'<a[^>]*class="[^"]*profile[^"]*"[^>]*>\s*<img[^>]+src="([^"]+)"',
            html, re.I,
        )
        if match:
            return unquote(match.group(1)).replace("&amp;", "&")

        # Alternative: look for large profile image in the header area
        match = re.search(
            r'<img[^>]+src="(https://[^"]*?fbcdn[^"]*?)"[^>]*class="[^"]*"[^>]*/?>',
            html, re.I,
        )
        if match:
            url = unquote(match.group(1)).replace("&amp;", "&")
            if "emoji" not in url.lower() and "static" not in url.lower():
                return url

        return ""

    def _extract_mbasic_cover(self, html: str) -> str:
        """Extract cover photo from mbasic HTML."""
        match = re.search(
            r'id="cover-name-root"[^>]*>.*?<img[^>]+src="([^"]+)"',
            html, re.DOTALL | re.I,
        )
        if match:
            return unquote(match.group(1)).replace("&amp;", "&")
        return ""

    def _extract_mbasic_images(self, html: str) -> List[str]:
        """Extract image URLs from mbasic timeline posts."""
        urls = []
        for m in re.finditer(
            r'<img[^>]+src="(https://[^"]*?(?:fbcdn|facebook)[^"]*?)"[^>]*/?>',
            html, re.I,
        ):
            url = unquote(m.group(1)).replace("&amp;", "&")
            # Filter out tiny images, emojis, icons
            if any(skip in url.lower() for skip in ("emoji", "static", "rsrc", "pixel")):
                continue
            if url not in urls:
                urls.append(url)
        return urls[:10]

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

    def _extract_fb_cdn_images(self, html: str) -> List[str]:
        """Extract Facebook CDN image URLs."""
        urls = set()
        for pattern in [
            r'(https?://(?:scontent|external)[a-z0-9.-]*\.fbcdn\.net/[^\s"\'<>]+)',
            r'(https?://(?:z-m-scontent|scontent)[a-z0-9.-]*\.xx\.fbcdn\.net/[^\s"\'<>]+)',
        ]:
            for m in re.finditer(pattern, html, re.I):
                url = m.group(1).split("&amp;")[0].replace("\\u0025", "%")
                if "emoji" not in url.lower() and "rsrc" not in url.lower():
                    urls.add(url)
        return list(urls)[:10]
