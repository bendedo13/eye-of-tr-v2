"""Test Face++ service integration (unit tests with mocks)."""
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class TestFacePPService(unittest.TestCase):
    def test_not_available_without_keys(self):
        """Face++ should report not available when API keys are missing."""
        with patch("app.services.facepp_service.settings") as mock_settings:
            mock_settings.FACEPP_API_KEY = None
            mock_settings.FACEPP_API_SECRET = None
            mock_settings.FACEPP_ENABLED = True
            mock_settings.FACEPP_THRESHOLD = 0.65
            mock_settings.FACEPP_API_URL = "https://api-us.faceplusplus.com/facepp/v3"

            from app.services.facepp_service import FacePPService
            svc = FacePPService()
            self.assertFalse(svc.is_available())

    def test_not_available_when_disabled(self):
        """Face++ should report not available when disabled."""
        with patch("app.services.facepp_service.settings") as mock_settings:
            mock_settings.FACEPP_API_KEY = "test_key"
            mock_settings.FACEPP_API_SECRET = "test_secret"
            mock_settings.FACEPP_ENABLED = False
            mock_settings.FACEPP_THRESHOLD = 0.65
            mock_settings.FACEPP_API_URL = "https://api-us.faceplusplus.com/facepp/v3"

            from app.services.facepp_service import FacePPService
            svc = FacePPService()
            self.assertFalse(svc.is_available())

    def test_available_with_keys_and_enabled(self):
        """Face++ should be available when keys present and enabled."""
        with patch("app.services.facepp_service.settings") as mock_settings:
            mock_settings.FACEPP_API_KEY = "test_key"
            mock_settings.FACEPP_API_SECRET = "test_secret"
            mock_settings.FACEPP_ENABLED = True
            mock_settings.FACEPP_THRESHOLD = 0.65
            mock_settings.FACEPP_API_URL = "https://api-us.faceplusplus.com/facepp/v3"

            from app.services.facepp_service import FacePPService
            svc = FacePPService()
            self.assertTrue(svc.is_available())


class TestFacePPCompare(unittest.IsolatedAsyncioTestCase):
    @patch("app.services.facepp_service.settings")
    async def test_compare_returns_none_when_disabled(self, mock_settings):
        """Compare should return None when service is disabled."""
        mock_settings.FACEPP_API_KEY = None
        mock_settings.FACEPP_API_SECRET = None
        mock_settings.FACEPP_ENABLED = False
        mock_settings.FACEPP_THRESHOLD = 0.65
        mock_settings.FACEPP_API_URL = "https://api-us.faceplusplus.com/facepp/v3"

        from app.services.facepp_service import FacePPService
        svc = FacePPService()
        result = await svc.compare_faces("base64_1", "base64_2")
        self.assertIsNone(result)

    @patch("app.services.facepp_service.httpx.AsyncClient")
    @patch("app.services.facepp_service.settings")
    async def test_compare_success(self, mock_settings, mock_client_cls):
        """Compare should return confidence data on success."""
        mock_settings.FACEPP_API_KEY = "key"
        mock_settings.FACEPP_API_SECRET = "secret"
        mock_settings.FACEPP_ENABLED = True
        mock_settings.FACEPP_THRESHOLD = 0.65
        mock_settings.FACEPP_API_URL = "https://api.faceplusplus.com/facepp/v3"

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "confidence": 89.5,
            "thresholds": {"1e-3": 62.327, "1e-4": 69.101, "1e-5": 73.975},
            "request_id": "test123",
        }

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        from app.services.facepp_service import FacePPService
        svc = FacePPService()
        result = await svc.compare_faces("b64_img1", "b64_img2")

        self.assertIsNotNone(result)
        self.assertEqual(result["confidence"], 89.5)
        self.assertIn("thresholds", result)


if __name__ == "__main__":
    unittest.main()
