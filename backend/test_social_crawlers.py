#!/usr/bin/env python3
"""Test script for social media crawlers.

Tests Instagram, Twitter, Facebook, and TikTok crawlers with real profiles.
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.modules.face_index.proxy_manager import get_proxy_manager
from app.modules.face_index.crawler import DomainRateLimiter
from app.modules.face_index.social_crawlers import get_social_crawler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


async def test_instagram():
    """Test Instagram crawler."""
    logger.info("=" * 60)
    logger.info("TESTING INSTAGRAM CRAWLER")
    logger.info("=" * 60)
    
    db = SessionLocal()
    pm = get_proxy_manager()
    rl = DomainRateLimiter()
    
    try:
        crawler = get_social_crawler("instagram", pm, rl)
        
        # Test with Instagram's official account
        profile_url = "https://www.instagram.com/instagram/"
        logger.info(f"Crawling: {profile_url}")
        
        results = await crawler.crawl_profile(profile_url, db)
        
        logger.info(f"✅ Found {len(results)} images")
        for i, img in enumerate(results[:5], 1):
            logger.info(f"  {i}. {img.context}: {img.url[:80]}...")
        
        return len(results) > 0
    except Exception as e:
        logger.error(f"❌ Instagram test failed: {e}", exc_info=True)
        return False
    finally:
        db.close()


async def test_twitter():
    """Test Twitter crawler."""
    logger.info("=" * 60)
    logger.info("TESTING TWITTER CRAWLER")
    logger.info("=" * 60)
    
    db = SessionLocal()
    pm = get_proxy_manager()
    rl = DomainRateLimiter()
    
    try:
        crawler = get_social_crawler("twitter", pm, rl)
        
        # Test with Twitter's official account
        profile_url = "https://x.com/twitter"
        logger.info(f"Crawling: {profile_url}")
        
        results = await crawler.crawl_profile(profile_url, db)
        
        logger.info(f"✅ Found {len(results)} images")
        for i, img in enumerate(results[:5], 1):
            logger.info(f"  {i}. {img.context}: {img.url[:80]}...")
        
        return len(results) > 0
    except Exception as e:
        logger.error(f"❌ Twitter test failed: {e}", exc_info=True)
        return False
    finally:
        db.close()


async def test_facebook():
    """Test Facebook crawler."""
    logger.info("=" * 60)
    logger.info("TESTING FACEBOOK CRAWLER")
    logger.info("=" * 60)
    
    db = SessionLocal()
    pm = get_proxy_manager()
    rl = DomainRateLimiter()
    
    try:
        crawler = get_social_crawler("facebook", pm, rl)
        
        # Test with Facebook's official page
        profile_url = "https://www.facebook.com/facebook"
        logger.info(f"Crawling: {profile_url}")
        
        results = await crawler.crawl_profile(profile_url, db)
        
        logger.info(f"✅ Found {len(results)} images")
        for i, img in enumerate(results[:5], 1):
            logger.info(f"  {i}. {img.context}: {img.url[:80]}...")
        
        return len(results) > 0
    except Exception as e:
        logger.error(f"❌ Facebook test failed: {e}", exc_info=True)
        return False
    finally:
        db.close()


async def test_tiktok():
    """Test TikTok crawler."""
    logger.info("=" * 60)
    logger.info("TESTING TIKTOK CRAWLER")
    logger.info("=" * 60)
    
    db = SessionLocal()
    pm = get_proxy_manager()
    rl = DomainRateLimiter()
    
    try:
        crawler = get_social_crawler("tiktok", pm, rl)
        
        # Test with TikTok's official account
        profile_url = "https://www.tiktok.com/@tiktok"
        logger.info(f"Crawling: {profile_url}")
        
        results = await crawler.crawl_profile(profile_url, db)
        
        logger.info(f"✅ Found {len(results)} images")
        for i, img in enumerate(results[:5], 1):
            logger.info(f"  {i}. {img.context}: {img.url[:80]}...")
        
        return len(results) > 0
    except Exception as e:
        logger.error(f"❌ TikTok test failed: {e}", exc_info=True)
        return False
    finally:
        db.close()


async def main():
    """Run all tests."""
    logger.info("🚀 Starting Social Media Crawler Tests")
    logger.info("")
    
    results = {
        "Instagram": await test_instagram(),
        "Twitter": await test_twitter(),
        "Facebook": await test_facebook(),
        "TikTok": await test_tiktok(),
    }
    
    logger.info("")
    logger.info("=" * 60)
    logger.info("TEST RESULTS SUMMARY")
    logger.info("=" * 60)
    
    for platform, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{platform:15} {status}")
    
    total = len(results)
    passed = sum(results.values())
    logger.info("")
    logger.info(f"Total: {passed}/{total} tests passed")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
