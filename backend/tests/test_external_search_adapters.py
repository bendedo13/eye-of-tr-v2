import unittest

import httpx


class ExternalSearchAdaptersTests(unittest.IsolatedAsyncioTestCase):
    async def test_serpapi_parses_visual_matches(self):
        from app.adapters.serpapi_lens_adapter import get_serpapi_lens_adapter

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(str(request.url.host), "serpapi.com")
            data = {
                "search_metadata": {"status": "Success"},
                "visual_matches": [
                    {
                        "position": 1,
                        "title": "Example",
                        "link": "https://example.com/page",
                        "thumbnail": "https://example.com/thumb.jpg",
                        "source": "example.com",
                    }
                ],
            }
            return httpx.Response(200, json=data)

        transport = httpx.MockTransport(handler)
        adapter = get_serpapi_lens_adapter({"api_key": "k", "transport": transport})
        res = await adapter.search_by_image_url("https://images.example.com/a.jpg")
        self.assertEqual(res.status, "success")
        self.assertEqual(res.total_matches, 1)
        self.assertEqual(res.matches[0].platform, "serpapi")
        self.assertEqual(res.matches[0].profile_url, "https://example.com/page")

    async def test_rapidapi_parses_results_list(self):
        from app.adapters.rapidapi_image_search_adapter import get_rapidapi_image_search_adapter

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertIn("x-rapidapi-key", request.headers)
            data = {
                "data": [
                    {"title": "A", "url": "https://a.example", "image_url": "https://a.example/i.jpg", "source": "a.example"}
                ]
            }
            return httpx.Response(200, json=data)

        transport = httpx.MockTransport(handler)
        adapter = get_rapidapi_image_search_adapter(
            {"api_key": "rk", "host": "real-time-image-search.p.rapidapi.com", "endpoint": "https://real-time-image-search.p.rapidapi.com/search", "transport": transport}
        )
        res = await adapter.search("beach", limit=10)
        self.assertEqual(res.status, "success")
        self.assertEqual(res.total_matches, 1)
        self.assertEqual(res.matches[0].platform, "rapidapi")
        self.assertEqual(res.matches[0].profile_url, "https://a.example")


if __name__ == "__main__":
    unittest.main()
