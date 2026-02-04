import unittest


class _FakeRedis:
    def __init__(self):
        self.data = {}
        self.ttl = {}

    async def incr(self, key: str) -> int:
        self.data[key] = int(self.data.get(key, 0)) + 1
        return int(self.data[key])

    async def expire(self, key: str, seconds: int) -> None:
        self.ttl[key] = int(seconds)

    async def aclose(self) -> None:
        return None


class RedisRateLimiterTests(unittest.IsolatedAsyncioTestCase):
    async def test_fixed_window_blocks_after_limit(self):
        from app.services import redis_rate_limiter

        fake = _FakeRedis()

        async def fake_get_redis():
            return fake

        orig = redis_rate_limiter.get_redis
        redis_rate_limiter.get_redis = fake_get_redis
        try:
            ok1 = await redis_rate_limiter.allow_fixed_window(key="k", limit=2, window_seconds=60)
            ok2 = await redis_rate_limiter.allow_fixed_window(key="k", limit=2, window_seconds=60)
            ok3 = await redis_rate_limiter.allow_fixed_window(key="k", limit=2, window_seconds=60)
            self.assertTrue(ok1)
            self.assertTrue(ok2)
            self.assertFalse(ok3)
        finally:
            redis_rate_limiter.get_redis = orig


if __name__ == "__main__":
    unittest.main()
