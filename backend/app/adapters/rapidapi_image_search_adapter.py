import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from app.adapters import AdapterResponse, SearchMatch
from app.core.config import settings

logger = logging.getLogger(__name__)


class RapidApiRealTimeImageSearchAdapter:
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key") or settings.RAPIDAPI_KEY
        self.host = config.get("host") or settings.RAPIDAPI_HOST
        self.endpoint = config.get("endpoint") or settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT
        self.timeout = int(config.get("timeout") or 30)
        self.transport = config.get("transport")
        self.default_params = config.get("default_params") or {
            "size": settings.RAPIDAPI_IMAGE_SEARCH_SIZE,
            "color": settings.RAPIDAPI_IMAGE_SEARCH_COLOR,
            "type": settings.RAPIDAPI_IMAGE_SEARCH_TYPE,
            "time": settings.RAPIDAPI_IMAGE_SEARCH_TIME,
            "usage_rights": settings.RAPIDAPI_IMAGE_SEARCH_USAGE_RIGHTS,
            "file_type": settings.RAPIDAPI_IMAGE_SEARCH_FILE_TYPE,
            "aspect_ratio": settings.RAPIDAPI_IMAGE_SEARCH_ASPECT_RATIO,
            "safe_search": settings.RAPIDAPI_IMAGE_SEARCH_SAFE_SEARCH,
            "region": settings.RAPIDAPI_IMAGE_SEARCH_REGION,
        }

    def _extract_items(self, data: Any) -> List[Dict[str, Any]]:
        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]
        if isinstance(data, dict):
            for key in ("data", "results", "items", "images", "value"):
                v = data.get(key)
                if isinstance(v, list):
                    return [x for x in v if isinstance(x, dict)]
        return []

    def _to_matches(self, items: List[Dict[str, Any]]) -> List[SearchMatch]:
        matches: List[SearchMatch] = []
        for idx, item in enumerate(items):
            title = item.get("title") or item.get("name") or item.get("snippet")
            link = item.get("url") or item.get("link") or item.get("page_url") or item.get("source_url")
            image = item.get("image") or item.get("image_url") or item.get("thumbnail") or item.get("thumbnailUrl")
            source = item.get("source") or item.get("domain") or item.get("displayLink")
            confidence = max(35.0, 80.0 - float(idx) * 1.5)
            matches.append(
                SearchMatch(
                    platform="rapidapi",
                    username=str(source or title or "Unknown"),
                    profile_url=str(link) if link else None,
                    image_url=str(image) if image else None,
                    confidence=float(confidence),
                    metadata={"title": title, "position": idx + 1},
                )
            )
        return matches

    async def search(self, query: str, *, limit: int = 25, params_override: Optional[Dict[str, str]] = None) -> AdapterResponse:
        if not self.api_key:
            return AdapterResponse(provider="rapidapi", status="error", error="RapidAPI key not configured", matches=[])

        q = (query or "").strip()
        if not q:
            return AdapterResponse(provider="rapidapi", status="error", error="Empty query", matches=[])

        headers = {"x-rapidapi-host": self.host, "x-rapidapi-key": self.api_key}
        params: Dict[str, str] = {"query": q, "limit": str(int(max(1, min(100, limit))))}
        for k, v in (self.default_params or {}).items():
            if v is None:
                continue
            params[str(k)] = str(v)
        for k, v in (params_override or {}).items():
            if v is None:
                continue
            params[str(k)] = str(v)

        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout, transport=self.transport) as client:
                resp = await client.get(self.endpoint, headers=headers, params=params)
                resp.raise_for_status()
                data = resp.json()

            items = self._extract_items(data)
            matches = self._to_matches(items)
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            return AdapterResponse(
                provider="rapidapi",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=elapsed_ms,
            )
        except httpx.HTTPStatusError as e:
            return AdapterResponse(
                provider="rapidapi",
                status="error",
                error=f"RapidAPI error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0,
            )
        except Exception as e:
            return AdapterResponse(provider="rapidapi", status="error", error=str(e), matches=[], total_matches=0, search_time_ms=0)

    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        import os

        filename = os.path.basename(image_path)
        query = filename.split(".")[0]

        start_time = asyncio.get_event_loop().time()
        result = await self.search(query)
        elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        result.search_time_ms = elapsed_ms
        return result


def get_rapidapi_image_search_adapter(config: Dict[str, Any]) -> RapidApiRealTimeImageSearchAdapter:
    return RapidApiRealTimeImageSearchAdapter(config)
