"""Proxy pool manager with rotation, health checking, and failure tracking."""
import logging
import random
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.face_index.models import ProxyServer

logger = logging.getLogger(__name__)


class ProxyManager:
    """Manages a pool of proxy servers with rotation and health tracking."""

    def __init__(self):
        self._proxies: List[dict] = []
        self._index = 0
        self._last_load = 0.0
        self._cache_ttl = 60.0  # reload from DB every 60s

    def load_proxies(self, db: Session) -> List[dict]:
        """Load active proxies from database."""
        now = time.monotonic()
        if self._proxies and (now - self._last_load) < self._cache_ttl:
            return self._proxies

        rows = db.query(ProxyServer).filter(ProxyServer.is_active == True).all()
        self._proxies = [
            {
                "id": r.id,
                "url": r.proxy_url,
                "type": r.proxy_type,
                "country": r.country,
                "fail_count": r.fail_count or 0,
                "success_count": r.success_count or 0,
            }
            for r in rows
        ]
        self._last_load = now
        self._index = 0
        logger.info(f"ProxyManager loaded {len(self._proxies)} active proxies")
        return self._proxies

    def get_next_proxy(self, db: Session) -> Optional[dict]:
        """Get next proxy based on configured rotation strategy."""
        proxies = self.load_proxies(db)
        if not proxies:
            return None

        rotation = str(getattr(settings, "FACE_INDEX_PROXY_ROTATION", "round_robin"))

        if rotation == "random":
            return random.choice(proxies)
        elif rotation == "least_fail":
            return min(proxies, key=lambda p: p["fail_count"])
        else:  # round_robin
            proxy = proxies[self._index % len(proxies)]
            self._index += 1
            return proxy

    def get_proxy_url(self, db: Session) -> Optional[str]:
        """Get the URL string of the next proxy, or None if no proxies available."""
        proxy = self.get_next_proxy(db)
        return proxy["url"] if proxy else None

    def get_httpx_proxy(self, db: Session) -> Optional[str]:
        """Get proxy URL formatted for httpx client."""
        if not getattr(settings, "FACE_INDEX_PROXY_ENABLED", True):
            return None
        return self.get_proxy_url(db)

    def report_success(self, proxy_id: int, response_ms: int, db: Session):
        """Record a successful request through a proxy."""
        try:
            row = db.query(ProxyServer).filter(ProxyServer.id == proxy_id).first()
            if row:
                row.success_count = (row.success_count or 0) + 1
                row.last_check_at = datetime.now(timezone.utc)
                row.last_check_ok = True
                # Running average
                old_avg = row.avg_response_ms or response_ms
                total = (row.success_count or 1)
                row.avg_response_ms = int((old_avg * (total - 1) + response_ms) / total)
                db.commit()
        except Exception as e:
            logger.debug(f"report_success error: {e}")

    def report_failure(self, proxy_id: int, db: Session):
        """Record a failed request. Deactivate if too many failures."""
        try:
            row = db.query(ProxyServer).filter(ProxyServer.id == proxy_id).first()
            if row:
                row.fail_count = (row.fail_count or 0) + 1
                row.last_check_at = datetime.now(timezone.utc)
                row.last_check_ok = False

                max_fails = int(getattr(settings, "FACE_INDEX_PROXY_MAX_FAILS", 10))
                if row.fail_count >= max_fails:
                    row.is_active = False
                    logger.warning(f"Proxy {proxy_id} deactivated after {row.fail_count} failures")
                    # Force reload on next get
                    self._last_load = 0.0

                db.commit()
        except Exception as e:
            logger.debug(f"report_failure error: {e}")

    def invalidate_cache(self):
        """Force reload of proxies from DB on next call."""
        self._last_load = 0.0
        self._proxies = []

    def reactivate_all(self, db: Session) -> int:
        """Reactivate all inactive proxies."""
        rows = db.query(ProxyServer).filter(ProxyServer.is_active == False).all()
        count = 0
        for row in rows:
            row.is_active = True
            row.fail_count = 0
            row.last_check_ok = None
            count += 1
        db.commit()
        self.invalidate_cache()
        return count


async def health_check_all(db: Session) -> Dict[str, int]:
    """Test all active proxies and update their status."""
    import httpx

    proxies = db.query(ProxyServer).filter(ProxyServer.is_active == True).all()
    ok_count = 0
    fail_count = 0
    timeout = int(getattr(settings, "FACE_INDEX_PROXY_TIMEOUT", 15))

    for proxy in proxies:
        try:
            start = time.monotonic()
            async with httpx.AsyncClient(
                proxy=proxy.proxy_url,
                timeout=timeout,
            ) as client:
                resp = await client.get("https://httpbin.org/ip")
                elapsed_ms = int((time.monotonic() - start) * 1000)

                if resp.status_code == 200:
                    proxy.last_check_ok = True
                    proxy.success_count = (proxy.success_count or 0) + 1
                    old_avg = proxy.avg_response_ms or elapsed_ms
                    total = proxy.success_count or 1
                    proxy.avg_response_ms = int((old_avg * (total - 1) + elapsed_ms) / total)
                    ok_count += 1
                else:
                    proxy.last_check_ok = False
                    proxy.fail_count = (proxy.fail_count or 0) + 1
                    fail_count += 1
        except Exception:
            proxy.last_check_ok = False
            proxy.fail_count = (proxy.fail_count or 0) + 1
            fail_count += 1

        proxy.last_check_at = datetime.now(timezone.utc)

    db.commit()
    return {"ok": ok_count, "failed": fail_count, "total": ok_count + fail_count}


async def reactivate_all_proxies(db: Session) -> Dict[str, int]:
    """Reactivate all inactive proxies."""
    manager = get_proxy_manager()
    count = manager.reactivate_all(db)
    return {"reactivated": count}


# Singleton
_manager: Optional[ProxyManager] = None


def get_proxy_manager() -> ProxyManager:
    global _manager
    if _manager is None:
        _manager = ProxyManager()
    return _manager
