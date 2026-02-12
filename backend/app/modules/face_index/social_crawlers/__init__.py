"""Social media crawlers for public profile photo extraction."""
from typing import Optional

from app.modules.face_index.proxy_manager import ProxyManager
from app.modules.face_index.crawler import DomainRateLimiter


def get_social_crawler(kind: str, proxy_manager: ProxyManager, rate_limiter: DomainRateLimiter):
    """Factory: return the appropriate social crawler for a source kind."""
    if kind == "instagram":
        from app.modules.face_index.social_crawlers.instagram import InstagramCrawler
        return InstagramCrawler(proxy_manager, rate_limiter)
    elif kind == "twitter":
        from app.modules.face_index.social_crawlers.twitter import TwitterCrawler
        return TwitterCrawler(proxy_manager, rate_limiter)
    elif kind == "facebook":
        from app.modules.face_index.social_crawlers.facebook import FacebookCrawler
        return FacebookCrawler(proxy_manager, rate_limiter)
    elif kind == "tiktok":
        from app.modules.face_index.social_crawlers.tiktok import TiktokCrawler
        return TiktokCrawler(proxy_manager, rate_limiter)
    else:
        raise ValueError(f"Unknown social crawler kind: {kind}")
