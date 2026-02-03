from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from PIL import Image

from app.modules.visual_location.local_index import LocalIndexEntry, load_local_index
from app.modules.visual_location.phash import (
    PHash,
    compute_ahash,
    compute_dhash,
    compute_phash,
    hamming_distance,
    similarity_percent_from_hamming,
)
from app.modules.visual_location.orb import compute_orb_descriptors, orb_similarity_0_1
from app.modules.visual_location.schemas import VisualLocationPrediction, VisualMatch


MANDATORY_NOTICE_TR = (
    "Bu sonuçlar yapay zekâ ve matematiksel benzerlik algoritmaları tarafından üretilmiş tahminlerdir. "
    "Kesinlik içermez. Tüm hukuki ve fiili sorumluluk kullanıcıya aittir."
)


@dataclass
class InferenceResult:
    predicted_location: VisualLocationPrediction
    confidence_0_1: float
    matches: List[VisualMatch]
    providers_used: List[str]


class VisualSimilarityLocationService:
    def __init__(self):
        self._local_index_path = os.getenv("VISUAL_LOCATION_LOCAL_INDEX_PATH")
        self._local_index = load_local_index(self._local_index_path)

    def refresh_local_index(self) -> None:
        self._local_index_path = os.getenv("VISUAL_LOCATION_LOCAL_INDEX_PATH")
        self._local_index = load_local_index(self._local_index_path)

    def infer_from_local_index(self, image_bytes: bytes, *, top_k: int = 10) -> InferenceResult:
        self.refresh_local_index()
        ph = compute_phash(image_bytes)
        ah = compute_ahash(image_bytes)
        dh = compute_dhash(image_bytes)
        q_desc = compute_orb_descriptors(image_bytes)
        scored: List[Tuple[float, float, LocalIndexEntry]] = []
        for entry in self._local_index:
            d_ph = float(hamming_distance(ph, entry.phash))
            d_ah = float(hamming_distance(ah, entry.ahash)) if entry.ahash else d_ph
            d_dh = float(hamming_distance(dh, entry.dhash)) if entry.dhash else d_ph
            dist = 0.60 * d_ph + 0.20 * d_ah + 0.20 * d_dh
            hash_sim = similarity_percent_from_hamming(int(round(dist)))
            orb_sim = float(orb_similarity_0_1(q_desc, getattr(entry, "orb_desc", None))) * 100.0
            combined = (0.65 * hash_sim + 0.35 * orb_sim) if orb_sim > 0 else hash_sim
            scored.append((combined, hash_sim, entry))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[: max(1, int(top_k))]

        matches: List[VisualMatch] = []
        providers_used: List[str] = []
        for combined, _hash_sim, entry in top:
            sim = float(max(0.0, min(100.0, combined)))
            conf = float(max(0.0, min(1.0, sim / 100.0)))
            providers_used.append(entry.provider)
            matches.append(
                VisualMatch(
                    provider=entry.provider,
                    source_url=entry.source_url,
                    image_url=entry.image_url,
                    title=entry.title,
                    similarity_percent=sim,
                    confidence_0_1=conf,
                    location_hint=entry.location_hint,
                )
            )

        predicted, confidence = self._infer_location_from_matches(matches)
        return InferenceResult(
            predicted_location=predicted,
            confidence_0_1=confidence,
            matches=matches,
            providers_used=sorted(list(set(providers_used))),
        )

    def _infer_location_from_matches(self, matches: List[VisualMatch]) -> Tuple[VisualLocationPrediction, float]:
        best = None
        for m in sorted(matches, key=lambda x: x.similarity_percent, reverse=True):
            if m.location_hint:
                best = m
                break

        if not best or not best.location_hint:
            return (
                VisualLocationPrediction(country="Bilinmiyor"),
                0.15,
            )

        confidence = float(max(0.0, min(1.0, best.confidence_0_1)))
        confidence = max(0.25, min(0.92, confidence))

        return (
            VisualLocationPrediction(
                country=best.location_hint.country or "Bilinmiyor",
                city=best.location_hint.city,
                district=None,
                neighborhood=None,
                latitude=best.location_hint.latitude,
                longitude=best.location_hint.longitude,
            ),
            confidence,
        )

    def extract_exif_gps(self, image_bytes: bytes) -> Optional[VisualLocationPrediction]:
        try:
            img = Image.open(self._io(image_bytes))
            exif = img.getexif()
            if not exif:
                return None
            gps = exif.get(34853)
            if not gps:
                return None
            lat = self._gps_to_deg(gps.get(2), gps.get(1))
            lon = self._gps_to_deg(gps.get(4), gps.get(3))
            if lat is None or lon is None:
                return None
            return VisualLocationPrediction(country=None, city=None, district=None, neighborhood=None, latitude=lat, longitude=lon)
        except Exception:
            return None

    def _gps_to_deg(self, dms, ref) -> Optional[float]:
        if not dms:
            return None
        try:
            deg = float(dms[0][0]) / float(dms[0][1])
            minute = float(dms[1][0]) / float(dms[1][1])
            sec = float(dms[2][0]) / float(dms[2][1])
            val = deg + (minute / 60.0) + (sec / 3600.0)
            if ref in ("S", "W"):
                val *= -1.0
            return float(val)
        except Exception:
            return None

    def _io(self, b: bytes):
        import io

        return io.BytesIO(b)


visual_similarity_location_service = VisualSimilarityLocationService()
