import asyncio
import time
from dataclasses import dataclass
from typing import Dict, Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings


@dataclass
class _Bucket:
    tokens: float
    last_refill: float


class InMemoryRateLimiter:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._buckets: Dict[str, _Bucket] = {}

    async def allow(self, key: str, limit_per_minute: int) -> bool:
        capacity = max(1, int(limit_per_minute))
        refill_per_sec = capacity / 60.0
        now = time.monotonic()

        async with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                self._buckets[key] = _Bucket(tokens=float(capacity - 1), last_refill=now)
                return True

            elapsed = max(0.0, now - bucket.last_refill)
            bucket.tokens = min(float(capacity), bucket.tokens + elapsed * refill_per_sec)
            bucket.last_refill = now

            if bucket.tokens >= 1.0:
                bucket.tokens -= 1.0
                return True
            return False


_limiter = InMemoryRateLimiter()


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _limit_for_path(path: str) -> Optional[int]:
    p = path.rstrip("/") or "/"
    if p.startswith("/api/data-platform"):
        return settings.RATE_LIMIT_DATA_PLATFORM_PER_MINUTE
    if p in ("/api/upload", "/upload-face"):
        return settings.RATE_LIMIT_UPLOAD_PER_MINUTE
    if p in ("/api/search", "/search-face"):
        return settings.RATE_LIMIT_SEARCH_PER_MINUTE
    if p in ("/api/location-intelligence/analyze",):
        return settings.RATE_LIMIT_LOCATION_INTELLIGENCE_PER_MINUTE
    if p in ("/api/visual-location/analyze",):
        return settings.RATE_LIMIT_VISUAL_LOCATION_PER_MINUTE
    if p in ("/api/auth/login", "/api/auth/register"):
        return settings.RATE_LIMIT_AUTH_PER_MINUTE
    return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        limit = _limit_for_path(request.url.path)
        if limit is None:
            return await call_next(request)

        ip = _client_ip(request)
        key = f"{request.url.path}:{ip}"
        ok = await _limiter.allow(key, limit_per_minute=limit)
        if not ok:
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla istek. Lütfen biraz sonra tekrar deneyin."},
                headers={"Retry-After": "60"},
            )

        return await call_next(request)
