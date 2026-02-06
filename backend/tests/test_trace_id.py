import os
import unittest


class TraceIdMiddlewareTests(unittest.TestCase):
    def test_trace_id_header_present(self):
        os.environ["SECRET_KEY"] = "dev-secret"
        os.environ["DATABASE_URL"] = "sqlite:///./test_trace.db"
        os.environ["DEBUG"] = "true"

        from fastapi.testclient import TestClient
        from main import app

        c = TestClient(app)
        r = c.get("/api/dashboard/live-stats")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.headers.get("x-trace-id"))


if __name__ == "__main__":
    unittest.main()
