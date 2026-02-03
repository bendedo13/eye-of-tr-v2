from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from app.modules.visual_location.phash import PHash
from app.modules.visual_location.schemas import VisualLocationPrediction


@dataclass(frozen=True)
class LocalIndexEntry:
    entry_id: str
    provider: str
    source_url: str | None
    image_url: str | None
    title: str | None
    phash: PHash
    ahash: PHash | None
    dhash: PHash | None
    orb_desc: object | None
    location_hint: VisualLocationPrediction | None


def load_local_index(path: str | None) -> List[LocalIndexEntry]:
    if not path:
        return []
    p = Path(path)
    if not p.exists():
        return []
    raw = json.loads(p.read_text(encoding="utf-8"))
    out: List[LocalIndexEntry] = []
    for item in raw.get("entries", []):
        ph_raw = item.get("phash", 0)
        ah_raw = item.get("ahash", None)
        dh_raw = item.get("dhash", None)

        ph = int(ph_raw, 16) if isinstance(ph_raw, str) else int(ph_raw or 0)
        ah = int(ah_raw, 16) if isinstance(ah_raw, str) else (int(ah_raw) if ah_raw is not None else None)
        dh = int(dh_raw, 16) if isinstance(dh_raw, str) else (int(dh_raw) if dh_raw is not None else None)
        loc = item.get("location_hint") or None
        location = VisualLocationPrediction(**loc) if isinstance(loc, dict) else None
        orb_desc = None
        if item.get("orb_desc_b64"):
            try:
                from app.modules.visual_location.orb import decode_desc_b64

                orb_desc = decode_desc_b64(str(item.get("orb_desc_b64")), rows=int(item.get("orb_rows") or 0))
            except Exception:
                orb_desc = None
        out.append(
            LocalIndexEntry(
                entry_id=str(item.get("id")),
                provider=str(item.get("provider", "local-index")),
                source_url=item.get("source_url"),
                image_url=item.get("image_url"),
                title=item.get("title"),
                phash=PHash(ph),
                ahash=PHash(ah) if ah is not None else None,
                dhash=PHash(dh) if dh is not None else None,
                orb_desc=orb_desc,
                location_hint=location,
            )
        )
    return out
