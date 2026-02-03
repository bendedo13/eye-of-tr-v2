import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.core.config import settings
from app.modules.visual_location.schemas import LocationEvidence, VisualLocationPrediction
from app.modules.visual_location.geonames import geocode_name


_FLOAT_RE = re.compile(r"(-?\d{1,3}\.\d+)")


@dataclass(frozen=True)
class LocationCandidate:
    location: VisualLocationPrediction
    confidence_0_1: float
    source: str
    url: Optional[str] = None


def _extract_lat_lon(content: str) -> Optional[Tuple[float, float]]:
    if not content:
        return None
    vals = _FLOAT_RE.findall(content)
    if len(vals) < 2:
        return None
    try:
        lat = float(vals[0])
        lon = float(vals[1])
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            return None
        return lat, lon
    except Exception:
        return None


def _extract_float(content: str) -> Optional[float]:
    if not content:
        return None
    m = _FLOAT_RE.search(content)
    if not m:
        return None
    try:
        v = float(m.group(1))
        return float(v)
    except Exception:
        return None


def extract_from_html(html: str, *, url: Optional[str] = None) -> List[LocationCandidate]:
    html = html or ""
    candidates: List[LocationCandidate] = []

    meta_patterns = [
        (r'property="place:location:latitude"\s+content="([^"]+)"', r'property="place:location:longitude"\s+content="([^"]+)"'),
        (r'name="geo.position"\s+content="([^"]+)"', None),
        (r'name="ICBM"\s+content="([^"]+)"', None),
        (r'property="og:latitude"\s+content="([^"]+)"', r'property="og:longitude"\s+content="([^"]+)"'),
    ]

    for lat_pat, lon_pat in meta_patterns:
        mlat = re.search(lat_pat, html, flags=re.IGNORECASE)
        if not mlat:
            continue
        if lon_pat:
            mlon = re.search(lon_pat, html, flags=re.IGNORECASE)
            if not mlon:
                continue
            lat = _extract_float(mlat.group(1))
            lon = _extract_float(mlon.group(1))
            if isinstance(lat, float) and isinstance(lon, float) and (-90.0 <= lat <= 90.0) and (-180.0 <= lon <= 180.0):
                candidates.append(
                    LocationCandidate(
                        location=VisualLocationPrediction(latitude=lat, longitude=lon),
                        confidence_0_1=0.80,
                        source="meta_tag",
                        url=url,
                    )
                )
        else:
            ll = _extract_lat_lon(mlat.group(1))
            if ll:
                candidates.append(
                    LocationCandidate(
                        location=VisualLocationPrediction(latitude=ll[0], longitude=ll[1]),
                        confidence_0_1=0.75,
                        source="meta_tag",
                        url=url,
                    )
                )

    for m in re.finditer(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, flags=re.IGNORECASE | re.DOTALL):
        blob = (m.group(1) or "").strip()
        if not blob:
            continue
        try:
            data = json.loads(blob)
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if not isinstance(it, dict):
                continue
            geo = it.get("geo")
            if isinstance(geo, dict):
                lat = geo.get("latitude")
                lon = geo.get("longitude")
                if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
                    candidates.append(
                        LocationCandidate(
                            location=VisualLocationPrediction(latitude=float(lat), longitude=float(lon)),
                            confidence_0_1=0.78,
                            source="jsonld",
                            url=url,
                        )
                    )
            loc = it.get("location")
            if isinstance(loc, dict) and isinstance(loc.get("geo"), dict):
                lat = loc["geo"].get("latitude")
                lon = loc["geo"].get("longitude")
                if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
                    candidates.append(
                        LocationCandidate(
                            location=VisualLocationPrediction(latitude=float(lat), longitude=float(lon)),
                            confidence_0_1=0.72,
                            source="jsonld",
                            url=url,
                        )
                    )

    name_candidates: List[str] = []
    for pat in [
        r'property="og:locality"\s+content="([^"]+)"',
        r'property="og:region"\s+content="([^"]+)"',
        r'property="og:country-name"\s+content="([^"]+)"',
        r'name="geo.placename"\s+content="([^"]+)"',
        r'name="geo.region"\s+content="([^"]+)"',
    ]:
        mm = re.search(pat, html, flags=re.IGNORECASE)
        if mm:
            name_candidates.append(mm.group(1).strip())

    for name in name_candidates[:3]:
        geo = geocode_name(name)
        if geo and isinstance(geo.latitude, (int, float)) and isinstance(geo.longitude, (int, float)):
            candidates.append(
                LocationCandidate(
                    location=geo,
                    confidence_0_1=0.55,
                    source="geonames",
                    url=url,
                )
            )

    return candidates


async def fetch_html(url: str, *, timeout_s: float = 1.2, max_bytes: int = 200_000) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=timeout_s, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            content = resp.content[:max_bytes]
            return content.decode(resp.encoding or "utf-8", errors="ignore")
    except Exception:
        return None


async def extract_location_from_urls(urls: List[str], *, timeout_s: float = 1.2) -> List[LocationCandidate]:
    urls = [u for u in urls if isinstance(u, str) and u.startswith("http")]
    urls = urls[:5]
    if not urls:
        return []
    tasks = [fetch_html(u, timeout_s=timeout_s) for u in urls]
    htmls = await _gather(tasks)
    candidates: List[LocationCandidate] = []
    for u, h in zip(urls, htmls):
        if not h:
            continue
        candidates.extend(extract_from_html(h, url=u))
    candidates.sort(key=lambda c: c.confidence_0_1, reverse=True)
    return candidates


async def _gather(tasks):
    import asyncio

    return await asyncio.gather(*tasks, return_exceptions=False)


def combine_candidates(
    *,
    base: Optional[Tuple[VisualLocationPrediction, float]] = None,
    exif: Optional[VisualLocationPrediction],
    web_candidates: List[LocationCandidate],
) -> Tuple[VisualLocationPrediction, float, List[LocationEvidence]]:
    evidences: List[LocationEvidence] = []
    candidates: List[LocationCandidate] = []

    if base and base[0] and isinstance(base[1], (int, float)):
        loc, conf = base
        if isinstance(loc.latitude, (int, float)) and isinstance(loc.longitude, (int, float)):
            candidates.append(LocationCandidate(location=loc, confidence_0_1=float(max(0.0, min(1.0, conf))), source="local_index", url=None))

    if exif and isinstance(exif.latitude, (int, float)) and isinstance(exif.longitude, (int, float)):
        candidates.append(LocationCandidate(location=exif, confidence_0_1=0.90, source="exif", url=None))

    candidates.extend(web_candidates[:5])

    if not candidates:
        return VisualLocationPrediction(country="Bilinmiyor"), 0.15, []

    best = max(candidates, key=lambda c: c.confidence_0_1)
    conf = float(max(0.0, min(1.0, best.confidence_0_1)))

    lat_sum = 0.0
    lon_sum = 0.0
    w_sum = 0.0
    for c in candidates:
        if not (isinstance(c.location.latitude, (int, float)) and isinstance(c.location.longitude, (int, float))):
            continue
        w = float(max(0.0, min(1.0, c.confidence_0_1)))
        lat_sum += float(c.location.latitude) * w
        lon_sum += float(c.location.longitude) * w
        w_sum += w

    if w_sum > 0:
        avg_lat = lat_sum / w_sum
        avg_lon = lon_sum / w_sum
        best.location.latitude = float(avg_lat)
        best.location.longitude = float(avg_lon)

    for c in candidates:
        evidences.append(LocationEvidence(source=c.source, confidence_0_1=float(c.confidence_0_1), url=c.url))

    return best.location, conf, evidences
