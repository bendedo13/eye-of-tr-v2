"""Yandex Search API adapter"""
import logging
import os
import xml.etree.ElementTree as ET
from typing import Dict, Any
import asyncio
import httpx

from app.adapters import AdapterResponse, SearchMatch

logger = logging.getLogger(__name__)


class YandexAdapter:
    """Yandex Search API adapter (via Yandex.Cloud XML)"""
    
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key")
        self.folder_id = config.get("folder_id")
        self.endpoint = "https://yandex.com/search/xml"
        self.timeout = config.get("timeout", 30)
        
        if not self.api_key:
            logger.warning("Yandex API key not configured")
        if not self.folder_id:
            logger.warning("Yandex Folder ID not configured")
    
    async def search(self, query: str) -> AdapterResponse:
        """
        Yandex search
        query: kişi adı veya kullanıcı adı
        """
        if not self.api_key or not self.folder_id:
            return AdapterResponse(
                provider="yandex",
                status="error",
                error="Yandex API key or Folder ID not configured",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        
        try:
            params = {
                "folderid": self.folder_id,
                "apikey": self.api_key,
                "query": query,
                "l10n": "en",
                "sortby": "rlv",
                "filter": "moderate",
                "groupby": "attr=d.mode=deep.groups-on-page=10.docs-in-group=1"
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.endpoint, params=params)
                response.raise_for_status()
                xml_content = response.text
            
            # Parse XML
            # Yandex XML yapısı bazen karmaşık olabilir, basit bir parser kullanalım
            try:
                root = ET.fromstring(xml_content)
            except ET.ParseError as e:
                logger.error(f"XML Parse error: {e}")
                # Hata durumunda response text'i loglayalım (kısaltarak)
                logger.debug(f"XML content: {xml_content[:500]}")
                raise
            
            # Check for errors in XML
            # <response><error code="...">Message</error></response>
            error_elem = root.find(".//error")
            if error_elem is not None:
                raise Exception(f"Yandex API Error: {error_elem.text}")

            matches = []
            # Navigate to results: response -> results -> grouping -> group -> doc
            for doc in root.findall(".//doc"):
                url = doc.findtext("url")
                title = doc.findtext("title")
                domain = doc.findtext("domain")
                
                # Clean title (remove tags like <hlword>)
                if title:
                    # Basit tag temizleme
                    try:
                        title_root = ET.fromstring(f"<root>{title}</root>")
                        title = "".join(title_root.itertext())
                    except:
                        pass # Eğer parse edilemezse ham title kalsın
                
                match = SearchMatch(
                    platform="yandex",
                    username=title or "Unknown",
                    profile_url=url or "",
                    image_url="", # Yandex XML search usually doesn't return thumbnail directly
                    confidence=0.80,
                    metadata={
                        "domain": domain,
                        "title": title
                    }
                )
                matches.append(match)
            
            logger.info(f"Yandex search: {len(matches)} results for '{query}'")
            
            return AdapterResponse(
                provider="yandex",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=int(response.elapsed.total_seconds() * 1000)
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Yandex API error: {e.response.status_code} - {e.response.text}")
            return AdapterResponse(
                provider="yandex",
                status="error",
                error=f"Yandex API error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
        except Exception as e:
            logger.error(f"Yandex adapter error: {e}")
            return AdapterResponse(
                provider="yandex",
                status="error",
                error=str(e),
                matches=[],
                total_matches=0,
                search_time_ms=0
            )
    
    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        """Zamanlama ile arama"""
        # Dosya adından query çıkar
        filename = os.path.basename(image_path)
        query = filename.split('.')[0]
        
        start_time = asyncio.get_event_loop().time()
        result = await self.search(query)
        elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        result.search_time_ms = elapsed_ms
        
        return result


def get_yandex_adapter(config: Dict[str, Any]) -> YandexAdapter:
    """Yandex adapter factory"""
    return YandexAdapter(config)
