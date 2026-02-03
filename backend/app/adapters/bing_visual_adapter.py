import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List

import httpx

from app.adapters import AdapterResponse, SearchMatch


logger = logging.getLogger(__name__)


class BingVisualAdapter:
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key")
        self.endpoint = "https://api.bing.microsoft.com/v7.0/images/visualsearch"
        self.timeout = int(config.get("timeout", 30))

    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        start_time = asyncio.get_event_loop().time()
        res = await self.search(image_path)
        res.search_time_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        return res

    async def search(self, image_path: str) -> AdapterResponse:
        if not self.api_key:
            return AdapterResponse(provider="bing_visual", status="error", error="Bing API key not configured", matches=[])

        p = Path(image_path)
        if not p.exists():
            return AdapterResponse(provider="bing_visual", status="error", error="File not found", matches=[])

        try:
            headers = {"Ocp-Apim-Subscription-Key": self.api_key}
            file_bytes = p.read_bytes()
            files = {"image": (p.name, file_bytes, "application/octet-stream")}

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(self.endpoint, headers=headers, files=files)
                resp.raise_for_status()
                data = resp.json()

            matches: List[SearchMatch] = []
            tags = data.get("tags") or []
            idx = 0
            for tag in tags:
                actions = tag.get("actions") or []
                for action in actions:
                    action_type = str(action.get("actionType") or "").lower()
                    if action_type not in ("pagesincluding", "visualsearch"):
                        continue
                    value = ((action.get("data") or {}).get("value") or [])
                    for item in value:
                        host_url = item.get("hostPageUrl") or item.get("hostPageDisplayUrl")
                        content_url = item.get("contentUrl")
                        if not host_url and not content_url:
                            continue
                        confidence = max(0.6, 0.92 - (idx * 0.01))
                        idx += 1
                        matches.append(
                            SearchMatch(
                                platform="bing_visual",
                                username=item.get("name") or item.get("hostPageDisplayUrl") or "Bing",
                                profile_url=host_url or content_url,
                                image_url=item.get("thumbnailUrl") or content_url,
                                confidence=float(confidence),
                                metadata={
                                    "hostPageUrl": item.get("hostPageUrl"),
                                    "hostPageDisplayUrl": item.get("hostPageDisplayUrl"),
                                    "contentUrl": content_url,
                                    "webSearchUrl": item.get("webSearchUrl"),
                                },
                            )
                        )
                        if len(matches) >= 50:
                            break
                    if len(matches) >= 50:
                        break
                if len(matches) >= 50:
                    break

            return AdapterResponse(
                provider="bing_visual",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=0,
            )
        except httpx.HTTPStatusError as e:
            return AdapterResponse(
                provider="bing_visual",
                status="error",
                error=f"Bing Visual API error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0,
            )
        except Exception as e:
            logger.error(f"Bing visual adapter error: {e}")
            return AdapterResponse(provider="bing_visual", status="error", error=str(e), matches=[], total_matches=0, search_time_ms=0)


def get_bing_visual_adapter(config: Dict[str, Any]) -> BingVisualAdapter:
    return BingVisualAdapter(config)

