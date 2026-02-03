import asyncio
import time


class AsyncRateLimiter:
    def __init__(self, per_minute: int):
        self._lock = asyncio.Lock()
        self._per_minute = max(1, int(per_minute))
        self._min_interval = 60.0 / float(self._per_minute)
        self._last = 0.0

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            wait = self._min_interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()

