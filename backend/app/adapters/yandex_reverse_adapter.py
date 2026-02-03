import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List

import httpx

from app.adapters import AdapterResponse, SearchMatch


logger = logging.getLogger(__name__)


class YandexReverseAdapter:
    def __init__(self, config: Dict[str, Any]):
        self.timeout = int(config.get("timeout", 25))
        self.enabled = bool(config.get("enabled", False))
        self.endpoint = str(config.get("endpoint", "https://yandex.com/images/search"))

    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        start_time = asyncio.get_event_loop().time()
        res = await self.search(image_path)
        res.search_time_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        return res

    async def search(self, image_path: str) -> AdapterResponse:
        if not self.enabled:
            return AdapterResponse(
                provider="yandex_reverse",
                status="error",
                error="Yandex reverse-image provider disabled",
                matches=[],
                total_matches=0,
                search_time_ms=0,
            )

        p = Path(image_path)
        if not p.exists():
            return AdapterResponse(provider="yandex_reverse", status="error", error="File not found", matches=[])

        try:
            file_bytes = p.read_bytes()
            files = {"upfile": ("blob", file_bytes, "application/octet-stream")}
            data = {"rpt": "imageview"}

            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                resp = await client.post(self.endpoint, data=data, files=files, headers={"User-Agent": "Mozilla/5.0"})
                resp.raise_for_status()
                text = resp.text

            return AdapterResponse(
                provider="yandex_reverse",
                status="error",
                error="Yandex reverse-image result parsing not supported in this mode",
                matches=[],
                total_matches=0,
                search_time_ms=0,
            )
        except httpx.HTTPStatusError as e:
            return AdapterResponse(
                provider="yandex_reverse",
                status="error",
                error=f"Yandex reverse-image error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0,
            )
        except Exception as e:
            logger.error(f"Yandex reverse adapter error: {e}")
            return AdapterResponse(provider="yandex_reverse", status="error", error=str(e), matches=[], total_matches=0, search_time_ms=0)


def get_yandex_reverse_adapter(config: Dict[str, Any]) -> YandexReverseAdapter:
    return YandexReverseAdapter(config)

