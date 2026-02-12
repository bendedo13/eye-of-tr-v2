"""Test AlanSearch OSINT module."""
import unittest


class TestAlanSearchPlatforms(unittest.TestCase):
    def test_platforms_list_not_empty(self):
        from app.api.alan_search import OSINT_PLATFORMS
        self.assertGreater(len(OSINT_PLATFORMS), 0)

    def test_all_platforms_have_required_fields(self):
        from app.api.alan_search import OSINT_PLATFORMS
        for p in OSINT_PLATFORMS:
            self.assertIn("id", p)
            self.assertIn("name", p)
            self.assertIn("icon", p)
            self.assertIn("query_template", p)

    def test_expected_platforms_present(self):
        from app.api.alan_search import OSINT_PLATFORMS
        ids = [p["id"] for p in OSINT_PLATFORMS]
        self.assertIn("linkedin", ids)
        self.assertIn("twitter", ids)
        self.assertIn("instagram", ids)
        self.assertIn("facebook", ids)
        self.assertIn("github", ids)


class TestAlanSearchRequest(unittest.TestCase):
    def test_request_model_defaults(self):
        from app.api.alan_search import AlanSearchRequest
        req = AlanSearchRequest(query="John Doe")
        self.assertEqual(req.query, "John Doe")
        self.assertEqual(req.platforms, [])
        self.assertIsNone(req.region)


if __name__ == "__main__":
    unittest.main()
