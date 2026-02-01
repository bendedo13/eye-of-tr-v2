"""Facecheck.id API adapter"""
import httpx
import logging
from typing import Dict, Any
import asyncio
import base64

from app.adapters import AdapterResponse, SearchMatch

logger = logging.getLogger(__name__)


class FacecheckAdapter:
    """Facecheck.id API adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key")
        self.api_url = config.get("api_url", "https://facecheck.id/api/v1")
        self.timeout = config.get("timeout", 60)
        
        if not self.api_key:
            logger.warning("Facecheck API key not configured")
    
    async def search(self, image_path: str) -> AdapterResponse:
        """
        Facecheck.id ile yüz arama
        """
        if not self.api_key:
            return AdapterResponse(
                provider="facecheck",
                status="error",
                error="Facecheck API key not configured",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        
        try:
            # Görsel dosyasını oku ve base64 encode et
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode()
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "image": image_data,
                "search_engines": ["google", "yandex", "bing"],
                "limit": 50
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/search",
                    headers=headers,
                    json=payload
                )
                
                response.raise_for_status()
                data = response.json()
            
            # Parse results
            matches = []
            for item in data.get("results", []):
                match = SearchMatch(
                    platform="facecheck",
                    username=item.get("name", "Unknown"),
                    profile_url=item.get("url", ""),
                    image_url=item.get("image_url", ""),
                    confidence=item.get("similarity", 0.0) * 100,  # 0-1 to 0-100
                    metadata={
                        "source": item.get("source"),
                        "title": item.get("title"),
                        "domain": item.get("domain")
                    }
                )
                matches.append(match)
            
            logger.info(f"Facecheck search: {len(matches)} results")
            
            return AdapterResponse(
                provider="facecheck",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=int(response.elapsed.total_seconds() * 1000)
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Facecheck API error: {e.response.status_code} - {e.response.text}")
            return AdapterResponse(
                provider="facecheck",
                status="error",
                error=f"Facecheck API error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        except FileNotFoundError:
            logger.error(f"Image file not found: {image_path}")
            return AdapterResponse(
                provider="facecheck",
                status="error",
                error="Image file not found",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        except Exception as e:
            logger.error(f"Facecheck adapter error: {e}")
            return AdapterResponse(
                provider="facecheck",
                status="error",
                error=str(e),
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
    
    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        """Zamanlama ile arama"""
        start_time = asyncio.get_event_loop().time()
        result = await self.search(image_path)
        elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        result.search_time_ms = elapsed_ms
        
        return result


def get_facecheck_adapter(config: Dict[str, Any]) -> FacecheckAdapter:
    """Facecheck adapter factory"""
    return FacecheckAdapter(config)
