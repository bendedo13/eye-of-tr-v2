import httpx
import base64
import logging
import asyncio
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas.lens import LensAnalysisResult, VisualMatch, KnowledgeGraph

logger = logging.getLogger(__name__)

class LensService:
    def __init__(self):
        self.api_key = settings.RAPIDAPI_LENS_KEY
        self.api_host = settings.RAPIDAPI_LENS_HOST
        self.base_url = settings.RAPIDAPI_LENS_BASE_URL
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.api_host,
            "Content-Type": "application/json"
        }

    async def analyze_image(self, image_bytes: bytes, search_type: str = "face_search") -> LensAnalysisResult:
        """
        Analyze image using Real-Time Lens Data API.
        Retry mechanism with exponential backoff included.
        """
        # Convert to base64
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        payload = {
            "image": base64_image,
            # The API documentation usually specifies how to pass the image. 
            # Assuming standard base64 payload based on user prompt.
            # If the API expects a specific format (e.g., "data:image/jpeg;base64,..."), 
            # we might need to prepend that. For now, sending raw base64 string.
        }

        # User prompt specified endpoint: /v1/lens
        url = f"{self.base_url}/v1/lens"
        
        retries = 3
        last_exception = None

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, json=payload, headers=self.headers)
                    response.raise_for_status()
                    data = response.json()
                    return self._parse_response(data)
            except httpx.HTTPError as e:
                last_exception = e
                logger.warning(f"Lens API attempt {attempt + 1} failed: {str(e)}")
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
            except Exception as e:
                logger.error(f"Unexpected error in Lens API: {str(e)}")
                raise e

        raise last_exception or Exception("Lens API failed after retries")

    def _parse_response(self, data: Dict[str, Any]) -> LensAnalysisResult:
        """
        Parse the raw JSON response from Lens API into our schema.
        """
        visual_matches = []
        if "visual_matches" in data:
            for item in data["visual_matches"]:
                visual_matches.append(VisualMatch(
                    title=item.get("title"),
                    source=item.get("source"),
                    link=item.get("link"),
                    thumbnail=item.get("thumbnail"),
                    position=item.get("position")
                ))

        knowledge_graph = None
        if "knowledge_graph" in data:
            kg = data["knowledge_graph"]
            knowledge_graph = KnowledgeGraph(
                title=kg.get("title"),
                subtitle=kg.get("subtitle"),
                description=kg.get("description"),
                images=kg.get("images"),
                attributes=kg.get("attributes")
            )

        text_segments = data.get("text_segments", [])

        return LensAnalysisResult(
            visual_matches=visual_matches,
            knowledge_graph=knowledge_graph,
            text_segments=text_segments,
            raw_data=data # Keep raw data just in case
        )

lens_service = LensService()
