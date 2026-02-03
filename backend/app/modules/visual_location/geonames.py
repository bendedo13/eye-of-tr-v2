from typing import Optional

import httpx

from app.core.config import settings
from app.modules.visual_location.schemas import VisualLocationPrediction


def geocode_name(name: str) -> Optional[VisualLocationPrediction]:
    username = str(getattr(settings, "GEONAMES_USERNAME", "") or "").strip()
    if not username:
        return None
    name = str(name or "").strip()
    if not name or len(name) < 2:
        return None
    try:
        url = "http://api.geonames.org/searchJSON"
        params = {"q": name, "maxRows": 1, "username": username}
        resp = httpx.get(url, params=params, timeout=1.2)
        resp.raise_for_status()
        data = resp.json()
        arr = data.get("geonames") or []
        if not arr:
            return None
        hit = arr[0]
        lat = float(hit.get("lat"))
        lon = float(hit.get("lng"))
        country = hit.get("countryName")
        city = hit.get("name")
        return VisualLocationPrediction(country=country, city=city, latitude=lat, longitude=lon)
    except Exception:
        return None

