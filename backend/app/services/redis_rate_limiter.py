from __future__ import annotations

import time
from typing import Optional

from app.services.redis_client import get_redis


async def allow_fixed_window(*, key: str, limit: int, window_seconds: int = 60) -> bool:
    if limit <= 0:
        return True

    r = await get_redis()
    if not r:
        return True

    now = int(time.time())
    window = now // int(window_seconds)
    redis_key = f"rl:{key}:{window}"
    try:
        v = await r.incr(redis_key)
        if v == 1:
            await r.expire(redis_key, int(window_seconds))
        return int(v) <= int(limit)
    finally:
        try:
            await r.aclose()
        except Exception:
            pass
