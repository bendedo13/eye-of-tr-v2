import asyncio
import logging
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from app.adapters import AdapterResponse, SearchMatch
from app.core.config import settings

logger = logging.getLogger(__name__)


class SerpApiGoogleLensAdapter:
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key") or settings.SERPAPI_API_KEY
        self.engine = config.get("engine") or settings.SERPAPI_ENGINE
        self.gl = config.get("gl") or settings.SERPAPI_GL
        self.hl = config.get("hl") or settings.SERPAPI_HL
        self.timeout = int(config.get("timeout") or settings.SERPAPI_TIMEOUT or 30)
        self.public_base_url = (config.get("public_base_url") or settings.PUBLIC_BASE_URL or "").strip()
        self.transport = config.get("transport")
        self.endpoint = "https://serpapi.com/search.json"

    def _backend_root(self) -> Path:
        return Path(__file__).resolve().parents[2]

    def _upload_dir(self) -> Path:
        return (self._backend_root() / settings.UPLOAD_DIR).resolve()

    def _stage_public_image(self, image_path: str) -> tuple[Path, str]:
        if not self.public_base_url:
            raise RuntimeError("PUBLIC_BASE_URL is not configured")

        src = Path(image_path)
        if not src.exists():
            raise FileNotFoundError(str(src))

        ext = src.suffix.lower() or ".jpg"
        stage_dir = (self._upload_dir() / "serpapi").resolve()
        stage_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        staged = stage_dir / filename
        staged.write_bytes(src.read_bytes())

        base = self.public_base_url.rstrip("/")
        public_url = f"{base}/uploads/serpapi/{filename}"
        return staged, public_url

    def _parse_visual_matches(self, data: Dict[str, Any]) -> List[SearchMatch]:
        items = data.get("visual_matches") or []
        matches: List[SearchMatch] = []
        for idx, item in enumerate(items):
            link = item.get("link") or item.get("url") or item.get("source_link")
            thumb = item.get("thumbnail") or item.get("image") or item.get("thumbnailUrl")
            title = item.get("title") or item.get("snippet") or item.get("source")
            source = item.get("source") or item.get("domain")
            confidence = max(40.0, 85.0 - float(idx) * 2.0)
            matches.append(
                SearchMatch(
                    platform="serpapi",
                    username=str(source or title or "Unknown"),
                    profile_url=str(link) if link else None,
                    image_url=str(thumb) if thumb else None,
                    confidence=float(confidence),
                    metadata={
                        "title": title,
                        "source": source,
                        "position": item.get("position", idx + 1),
                    },
                )
            )
        return matches

    async def search_by_image_url(self, image_url: str) -> AdapterResponse:
        if not self.api_key:
            return AdapterResponse(provider="serpapi", status="error", error="SerpAPI API key not configured", matches=[])

        params = {
            "engine": self.engine,
            "api_key": self.api_key,
            "url": image_url,
            "gl": self.gl,
            "hl": self.hl,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout, transport=self.transport) as client:
                resp = await client.get(self.endpoint, params=params)
                resp.raise_for_status()
                data = resp.json()

            status_value = (data.get("search_metadata") or {}).get("status")
            if status_value and str(status_value).lower() not in ("success", "ok"):
                err = data.get("error") or f"SerpAPI status: {status_value}"
                return AdapterResponse(provider="serpapi", status="error", error=str(err), matches=[], search_time_ms=0)

            matches = self._parse_visual_matches(data)
            return AdapterResponse(
                provider="serpapi",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=int(resp.elapsed.total_seconds() * 1000),
            )
        except httpx.HTTPStatusError as e:
            return AdapterResponse(
                provider="serpapi",
                status="error",
                error=f"SerpAPI error: {e.response.status_code}",
                matches=[],
                total_matches=0,
                search_time_ms=0,
            )
        except Exception as e:
            return AdapterResponse(provider="serpapi", status="error", error=str(e), matches=[], total_matches=0, search_time_ms=0)

    async def search(self, image_path: str) -> AdapterResponse:
        staged: Optional[Path] = None
        try:
            staged, public_url = self._stage_public_image(image_path)
            return await self.search_by_image_url(public_url)
        finally:
            if staged and staged.exists():
                try:
                    staged.unlink()
                except Exception:
                    pass

    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        start_time = asyncio.get_event_loop().time()
        result = await self.search(image_path)
        elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        result.search_time_ms = elapsed_ms
        return result


def get_serpapi_lens_adapter(config: Dict[str, Any]) -> SerpApiGoogleLensAdapter:
    return SerpApiGoogleLensAdapter(config)
