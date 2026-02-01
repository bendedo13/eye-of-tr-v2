"""Bing Image Search API adapter"""
import httpx
import logging
from typing import Dict, Any, List
import asyncio

from app.adapters import AdapterResponse, SearchMatch

logger = logging.getLogger(__name__)


class BingAdapter:
    """Bing Image Search API adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key")
        self.endpoint = "https://api.bing.microsoft.com/v7.0/images/search"
        self.timeout = config.get("timeout", 30)
        
        if not self.api_key:
            logger.warning("Bing API key not configured")
    
    async def search(self, query: str) -> AdapterResponse:
        """
        Bing image search
        query: kişi adı veya kullanıcı adı
        """
        if not self.api_key:
            return AdapterResponse(
                provider="bing",
                status="error",
                error="Bing API key not configured",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        
        try:
            headers = {
                "Ocp-Apim-Subscription-Key": self.api_key
            }
            
            params = {
                "q": query,
                "count": 50,
                "safeSearch": "Moderate"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.endpoint,
                    headers=headers,
                    params=params
                )
                
                response.raise_for_status()
                data = response.json()
            
            # Parse results
            matches = []
            for item in data.get("value", []):
                match = SearchMatch(
                    platform="bing",
                    username=item.get("name", "Unknown"),
                    profile_url=item.get("contentUrl", ""),
                    image_url=item.get("thumbnailUrl", ""),
                    confidence=0.85,  # Bing için varsayılan confidence
                    metadata={
                        "width": item.get("width"),
                        "height": item.get("height"),
                        "thumbnail": item.get("thumbnailUrl"),
                        "hostPageUrl": item.get("hostPageUrl")
                    }
                )
                matches.append(match)
            
            logger.info(f"Bing search: {len(matches)} results for '{query}'")
            
            return AdapterResponse(
                provider="bing",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=int(response.elapsed.total_seconds() * 1000)
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Bing API error: {e.response.status_code} - {e.response.text}")
            return AdapterResponse(
                provider="bing",
                status="error",
                error=f"Bing API error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        except Exception as e:
            logger.error(f"Bing adapter error: {e}")
            return AdapterResponse(
                provider="bing",
                status="error",
                error=str(e),
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
    
    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        """Zamanlama ile arama (diğer adapter'larla uyumlu)"""
        # Not: Bing sadece query destekler, görsel arama için farklı endpoint gerekir
        # Şimdilik dosya adından query çıkaralım
        import os
        filename = os.path.basename(image_path)
        query = filename.split('.')[0]  # Dosya adını query olarak kullan
        
        start_time = asyncio.get_event_loop().time()
        result = await self.search(query)
        elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        result.search_time_ms = elapsed_ms
        
        return result


def get_bing_adapter(config: Dict[str, Any]) -> BingAdapter:
    """Bing adapter factory"""
    return BingAdapter(config)
