import tempfile
import unittest


class _FakeAdapter:
    def __init__(self, provider: str, *, match_count: int):
        self.provider = provider
        self.match_count = int(match_count)
        self.calls = 0

    async def search_with_timing(self, image_path: str):
        from app.adapters import AdapterResponse, SearchMatch

        self.calls += 1
        matches = [
            SearchMatch(platform=self.provider, username="x", profile_url="https://example.com", image_url=None, confidence=0.8)
            for _ in range(self.match_count)
        ]
        return AdapterResponse(provider=self.provider, status="success", matches=matches, total_matches=len(matches), search_time_ms=5)


class SearchServiceFallbackCacheTests(unittest.IsolatedAsyncioTestCase):
    async def test_fallback_stops_when_min_matches_reached(self):
        from app.services.search_service import SearchService

        s = SearchService()
        s.adapters = {
            "a": _FakeAdapter("a", match_count=0),
            "b": _FakeAdapter("b", match_count=2),
            "c": _FakeAdapter("c", match_count=5),
        }
        s._reverse_image_providers = set()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f:
            f.write(b"abc")
            path = f.name

        out = await s.fallback_search(path, provider_order=["a", "b", "c"], min_total_matches=2)
        self.assertEqual(out["status"], "success")
        self.assertEqual(out["total_matches"], 2)
        self.assertEqual(s.adapters["a"].calls, 1)
        self.assertEqual(s.adapters["b"].calls, 1)
        self.assertEqual(s.adapters["c"].calls, 0)

    async def test_waterfall_cache_reuses_sha(self):
        from app.services.search_service import SearchService

        s = SearchService()
        s.adapters = {"eyeofweb": _FakeAdapter("eyeofweb", match_count=1)}
        s._reverse_image_providers = set()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f:
            f.write(b"same-bytes")
            path = f.name

        out1 = await s.waterfall_search(path, user_tier="free", strategy="fallback")
        out2 = await s.waterfall_search(path, user_tier="free", strategy="fallback")
        self.assertEqual(out1["total_matches"], out2["total_matches"])
        self.assertEqual(s.adapters["eyeofweb"].calls, 1)


if __name__ == "__main__":
    unittest.main()
