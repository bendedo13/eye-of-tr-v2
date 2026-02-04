from __future__ import annotations

import json
from typing import Any, Optional

from app.core.config import settings


async def get_redis():
    url = (getattr(settings, "REDIS_URL", None) or "").strip()
    if not url:
        return None
    try:
        from redis.asyncio import Redis
    except Exception:
        return None
    return Redis.from_url(url, encoding="utf-8", decode_responses=True)


async def redis_get_json(key: str) -> Optional[Any]:
    r = await get_redis()
    if not r:
        return None
    try:
        v = await r.get(key)
        if not v:
            return None
        return json.loads(v)
    finally:
        try:
            await r.aclose()
        except Exception:
            pass


async def redis_set_json(key: str, value: Any, *, ttl_seconds: int) -> None:
    r = await get_redis()
    if not r:
        return
    try:
        await r.set(key, json.dumps(value, ensure_ascii=False), ex=int(ttl_seconds))
    finally:
        try:
            await r.aclose()
        except Exception:
            pass
