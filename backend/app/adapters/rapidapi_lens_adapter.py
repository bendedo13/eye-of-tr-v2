import logging
import base64
import httpx
from typing import Dict, Any, List
from app.adapters import BaseSearchAdapter, AdapterResponse, SearchMatch

logger = logging.getLogger(__name__)

class RapidApiLensAdapter(BaseSearchAdapter):
    """
    RapidAPI Real-Time Lens Data adapter for face search.
    This adapter integrates into the standard SearchService flow.
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.api_host = config.get("api_host")
        self.base_url = config.get("base_url")
        self.timeout = config.get("timeout", 30)

    async def search(self, image_path: str) -> AdapterResponse:
        if not self.validate_image(image_path):
            return AdapterResponse(
                provider="rapidapi_lens",
                status="error",
                matches=[],
                error="Invalid image file"
            )

        try:
            # Read and encode image
            with open(image_path, "rb") as image_file:
                image_bytes = image_file.read()
                base64_image = base64.b64encode(image_bytes).decode("utf-8")

            headers = {
                "X-RapidAPI-Key": self.api_key,
                "X-RapidAPI-Host": self.api_host,
                "Content-Type": "application/json"
            }
            
            payload = {
                "image": base64_image
                # Assuming standard payload, might need adjustment based on specific API docs
            }
            
            url = f"{self.base_url}/v1/lens"

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                matches = self._parse_results(data)
                
                return AdapterResponse(
                    provider="rapidapi_lens",
                    status="success",
                    matches=matches,
                    total_matches=len(matches)
                )

        except Exception as e:
            logger.error(f"RapidAPI Lens adapter error: {str(e)}")
            return AdapterResponse(
                provider="rapidapi_lens",
                status="error",
                matches=[],
                error=str(e)
            )

    def _parse_results(self, data: Dict[str, Any]) -> List[SearchMatch]:
        matches = []
        
        # Parse 'visual_matches' from Lens API
        visual_matches = data.get("visual_matches", [])
        for item in visual_matches:
            match = SearchMatch(
                platform="web", # Generic web platform since Lens aggregates
                username=item.get("title"),
                profile_url=item.get("link"),
                image_url=item.get("thumbnail"),
                confidence=80.0, # Default high confidence for visual matches
                metadata={
                    "source": item.get("source"),
                    "position": item.get("position")
                }
            )
            matches.append(match)
            
        # Also check knowledge graph for identity
        kg = data.get("knowledge_graph")
        if kg:
            # Create a high-confidence match for the identified entity
            match = SearchMatch(
                platform="knowledge_graph",
                username=kg.get("title"),
                profile_url=None, # Usually KG doesn't have a single profile URL
                image_url=kg.get("images", [{}])[0].get("url") if kg.get("images") else None,
                confidence=95.0,
                metadata={
                    "subtitle": kg.get("subtitle"),
                    "description": kg.get("description"),
                    "attributes": kg.get("attributes")
                }
            )
            matches.insert(0, match) # Put at top

        return matches

def get_rapidapi_lens_adapter(config: Dict[str, Any]) -> RapidApiLensAdapter:
    return RapidApiLensAdapter(config)
