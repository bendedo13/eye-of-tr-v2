"""Face++ API integration service.

Provides face comparison as a fallback when internal FAISS match score is below threshold.
Requires FACEPP_API_KEY and FACEPP_API_SECRET in environment.
"""
import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class FacePPService:
    """Face++ Compare API client for fallback face matching."""

    def __init__(self):
        self.api_key = settings.FACEPP_API_KEY
        self.api_secret = settings.FACEPP_API_SECRET
        self.base_url = settings.FACEPP_API_URL
        self.enabled = settings.FACEPP_ENABLED
        self.threshold = settings.FACEPP_THRESHOLD

    def is_available(self) -> bool:
        """Check if Face++ is configured and enabled."""
        return bool(self.enabled and self.api_key and self.api_secret)

    async def compare_faces(
        self,
        image_base64_1: str,
        image_base64_2: str,
    ) -> Optional[dict]:
        """Compare two face images using Face++ Compare API.

        Returns dict with confidence score and thresholds, or None on failure.
        """
        if not self.is_available():
            logger.debug("Face++ not available (disabled or missing keys)")
            return None

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"{self.base_url}/compare",
                    data={
                        "api_key": self.api_key,
                        "api_secret": self.api_secret,
                        "image_base64_1": image_base64_1,
                        "image_base64_2": image_base64_2,
                    },
                )

                if resp.status_code != 200:
                    logger.warning(f"Face++ API error: {resp.status_code} - {resp.text[:200]}")
                    return None

                data = resp.json()

                if "error_message" in data:
                    logger.warning(f"Face++ error: {data['error_message']}")
                    return None

                return {
                    "confidence": data.get("confidence", 0),
                    "thresholds": data.get("thresholds", {}),
                    "request_id": data.get("request_id"),
                }

        except Exception as e:
            logger.error(f"Face++ compare error: {e}")
            return None

    async def detect_faces(self, image_base64: str) -> Optional[dict]:
        """Detect faces in an image using Face++ Detect API.

        Returns dict with face rectangles and attributes, or None on failure.
        """
        if not self.is_available():
            return None

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"{self.base_url}/detect",
                    data={
                        "api_key": self.api_key,
                        "api_secret": self.api_secret,
                        "image_base64": image_base64,
                        "return_attributes": "gender,age",
                    },
                )

                if resp.status_code != 200:
                    logger.warning(f"Face++ detect error: {resp.status_code}")
                    return None

                data = resp.json()
                faces = data.get("faces", [])
                return {
                    "face_count": len(faces),
                    "faces": [
                        {
                            "face_token": f.get("face_token"),
                            "rectangle": f.get("face_rectangle"),
                            "attributes": f.get("attributes"),
                        }
                        for f in faces
                    ],
                }

        except Exception as e:
            logger.error(f"Face++ detect error: {e}")
            return None

    async def search_face(
        self,
        image_base64: str,
        face_set_token: Optional[str] = None,
    ) -> Optional[dict]:
        """Search for a face in a Face++ FaceSet.

        Returns search results with confidence scores, or None on failure.
        """
        if not self.is_available():
            return None

        if not face_set_token:
            logger.debug("Face++ search: no face_set_token provided")
            return None

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"{self.base_url}/search",
                    data={
                        "api_key": self.api_key,
                        "api_secret": self.api_secret,
                        "image_base64": image_base64,
                        "faceset_token": face_set_token,
                    },
                )

                if resp.status_code != 200:
                    logger.warning(f"Face++ search error: {resp.status_code}")
                    return None

                data = resp.json()
                results = data.get("results", [])
                return {
                    "results": [
                        {
                            "face_token": r.get("face_token"),
                            "confidence": r.get("confidence", 0),
                        }
                        for r in results
                    ],
                    "thresholds": data.get("thresholds", {}),
                }

        except Exception as e:
            logger.error(f"Face++ search error: {e}")
            return None


# Singleton instance
_facepp_service: Optional[FacePPService] = None


def get_facepp_service() -> FacePPService:
    global _facepp_service
    if _facepp_service is None:
        _facepp_service = FacePPService()
    return _facepp_service
