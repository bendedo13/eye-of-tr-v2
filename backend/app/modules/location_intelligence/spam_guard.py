import asyncio
import time
from dataclasses import dataclass
from typing import Dict, Tuple


@dataclass
class _WindowCounter:
    count: int
    window_start: float


class InMemorySpamGuard:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._per_minute: Dict[Tuple[str, str], _WindowCounter] = {}
        self._per_day: Dict[Tuple[str, str], _WindowCounter] = {}

    async def allow(
        self,
        *,
        ip: str,
        device_id: str,
        per_minute_limit: int,
        per_day_limit: int,
    ) -> bool:
        now = time.time()
        minute_key = (ip, device_id)
        day_key = (ip, device_id)

        async with self._lock:
            if not self._allow_window(self._per_minute, minute_key, now, 60.0, per_minute_limit):
                return False
            if not self._allow_window(self._per_day, day_key, now, 86400.0, per_day_limit):
                return False
            return True

    def _allow_window(
        self,
        store: Dict[Tuple[str, str], _WindowCounter],
        key: Tuple[str, str],
        now: float,
        window_seconds: float,
        limit: int,
    ) -> bool:
        limit = max(1, int(limit))
        entry = store.get(key)
        if entry is None or (now - entry.window_start) >= window_seconds:
            store[key] = _WindowCounter(count=1, window_start=now)
            return True
        if entry.count >= limit:
            return False
        entry.count += 1
        return True


spam_guard = InMemorySpamGuard()

