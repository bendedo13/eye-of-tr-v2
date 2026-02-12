"""Authenticated Instagram follower profile photo crawler.

Uses instaloader to log in with stored credentials and enumerate a target
profile's followers, collecting their HD profile photos for face indexing.
Falls back gracefully to public crawl if session is unavailable.
"""
import asyncio
import logging
import os
import time
from pathlib import Path
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.face_index.social_crawlers.base import BaseSocialCrawler, CrawledImage

logger = logging.getLogger(__name__)

# Session file location (persisted between restarts)
SESSION_DIR = Path(__file__).resolve().parents[4] / "data" / "ig_sessions"


def _get_instaloader():
    """Lazy import to avoid hard dependency."""
    try:
        import instaloader
        return instaloader
    except ImportError:
        logger.warning("instaloader not installed – pip install instaloader")
        return None


class InstagramAuthCrawler:
    """Authenticated Instagram crawler for follower profile photos.

    Designed to work alongside the existing public InstagramCrawler.
    Uses instaloader for session management and follower enumeration.
    """

    def __init__(self):
        self._loader = None
        self._logged_in = False

    def _ensure_session(self) -> bool:
        """Create instaloader instance and log in (or resume session)."""
        if self._logged_in and self._loader:
            return True

        instaloader = _get_instaloader()
        if not instaloader:
            return False

        if not settings.IG_SESSION_ENABLED:
            logger.debug("Instagram session crawling is disabled")
            return False

        username = settings.IG_SESSION_USERNAME
        password = settings.IG_SESSION_PASSWORD
        if not username or not password:
            logger.warning("IG_SESSION_USERNAME or IG_SESSION_PASSWORD not set")
            return False

        self._loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            quiet=True,
        )

        # Try resuming saved session first
        SESSION_DIR.mkdir(parents=True, exist_ok=True)
        session_file = SESSION_DIR / f"{username}.session"

        try:
            if session_file.exists():
                self._loader.load_session_from_file(username, str(session_file))
                self._logged_in = True
                logger.info(f"[IG Auth] Resumed session for @{username}")
                return True
        except Exception as e:
            logger.debug(f"[IG Auth] Session file load failed: {e}")

        # Fresh login
        try:
            self._loader.login(username, password)
            self._loader.save_session_to_file(str(session_file))
            self._logged_in = True
            logger.info(f"[IG Auth] Logged in as @{username}")
            return True
        except Exception as e:
            logger.error(f"[IG Auth] Login failed: {e}")
            return False

    async def crawl_followers_profile_photos(
        self,
        target_username: str,
        db: Session,
        max_followers: Optional[int] = None,
    ) -> List[CrawledImage]:
        """Enumerate followers and collect their HD profile photos.

        Args:
            target_username: Instagram username whose followers to crawl
            db: SQLAlchemy session
            max_followers: Override settings.IG_SESSION_MAX_FOLLOWERS

        Returns:
            List of CrawledImage with follower profile photos
        """
        instaloader_mod = _get_instaloader()
        if not instaloader_mod:
            return []

        if not self._ensure_session():
            logger.info("[IG Auth] Session not available, skipping follower crawl")
            return []

        limit = max_followers or int(settings.IG_SESSION_MAX_FOLLOWERS)
        delay = float(settings.IG_SESSION_RATE_LIMIT_SECONDS)
        results: List[CrawledImage] = []

        try:
            profile = instaloader_mod.Profile.from_username(
                self._loader.context, target_username
            )
        except Exception as e:
            logger.error(f"[IG Auth] Could not load profile @{target_username}: {e}")
            return []

        logger.info(
            f"[IG Auth] @{target_username}: {profile.followers} followers, "
            f"crawling up to {limit} profile photos"
        )

        # Add target's own HD profile photo first
        if profile.profile_pic_url:
            # Get HD version
            try:
                hd_url = profile.profile_pic_url
                # instaloader can get full-res pic
                results.append(CrawledImage(
                    url=hd_url,
                    page_url=f"https://www.instagram.com/{target_username}/",
                    context="profile_photo",
                ))
            except Exception:
                pass

        # Enumerate followers
        count = 0
        try:
            # Run the blocking iterator in a thread to keep async compatibility
            def _iter_followers():
                nonlocal count
                collected = []
                try:
                    for follower in profile.get_followers():
                        if count >= limit:
                            break

                        pic_url = follower.profile_pic_url
                        if not pic_url:
                            continue

                        # Skip default profile pics (usually very small or standard pattern)
                        if "default" in pic_url.lower() or "s150x150" in pic_url:
                            continue

                        collected.append(CrawledImage(
                            url=pic_url,
                            page_url=f"https://www.instagram.com/{follower.username}/",
                            context="profile_photo",
                        ))
                        count += 1

                        if count % 50 == 0:
                            logger.info(f"[IG Auth] @{target_username}: collected {count} follower photos")

                        # Rate limiting to avoid Instagram throttling
                        time.sleep(delay)
                except Exception as e:
                    logger.warning(f"[IG Auth] Follower iteration stopped: {e}")

                return collected

            follower_images = await asyncio.to_thread(_iter_followers)
            results.extend(follower_images)

        except Exception as e:
            logger.error(f"[IG Auth] Follower crawl error: {e}")

        logger.info(
            f"[IG Auth] @{target_username}: collected {len(results)} total profile photos "
            f"({count} followers + target)"
        )
        return results


# Singleton
_ig_auth_crawler: Optional[InstagramAuthCrawler] = None


def get_ig_auth_crawler() -> InstagramAuthCrawler:
    global _ig_auth_crawler
    if _ig_auth_crawler is None:
        _ig_auth_crawler = InstagramAuthCrawler()
    return _ig_auth_crawler
