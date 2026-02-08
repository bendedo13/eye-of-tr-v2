from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from typing import List, Optional

import httpx

from app.core.config import settings
from app.modules.location_intelligence.schemas import LocationIntelligenceResult, LocationPrediction
from app.modules.visual_location.service import visual_similarity_location_service


logger = logging.getLogger(__name__)

MANDATORY_NOTICE_TR = (
    "Bu sonuçlar yapay zekâ tarafından üretilmiş tahminlerdir. "
    "Kesinlik içermez. Tüm hukuki ve fiili sorumluluk kullanıcıya aittir."
)


@dataclass
class _VisionResult:
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    score: Optional[float]
    web_labels: List[str]


class LocationIntelligenceService:
    async def analyze(self, image_bytes: bytes) -> LocationIntelligenceResult:
        predicted_location = LocationPrediction(
            country="Bilinmiyor",
            city=None,
            district=None,
            neighborhood=None,
            latitude=None,
            longitude=None,
        )
        factors: List[str] = []
        analysis_parts: List[str] = []
        confidence = 10

        local = visual_similarity_location_service.infer_from_local_index(image_bytes, top_k=10)
        local_pred = self._to_location_prediction(local.predicted_location)
        if self._has_location(local_pred):
            predicted_location = self._merge_location(predicted_location, local_pred)
            local_conf = int(max(0, min(100, round(local.confidence_0_1 * 100))))
            confidence = max(confidence, max(55, min(92, local_conf)))
            factors.append("Yerel görsel indeks eşleşmeleri kullanıldı.")
            analysis_parts.append("Yerel görsel indeks eşleşmeleri konum tahmini için sinyal sağladı.")

        exif_pred = visual_similarity_location_service.extract_exif_gps(image_bytes)
        if exif_pred and isinstance(exif_pred.latitude, (int, float)) and isinstance(exif_pred.longitude, (int, float)):
            predicted_location = self._merge_location(
                predicted_location,
                LocationPrediction(
                    country=None,
                    city=None,
                    district=None,
                    neighborhood=None,
                    latitude=float(exif_pred.latitude),
                    longitude=float(exif_pred.longitude),
                ),
            )
            confidence = max(confidence, 90)
            factors.append("EXIF GPS koordinatları bulundu.")
            analysis_parts.append("Görüntü EXIF GPS verisi içeriyor; koordinatlar dosyadan alındı.")

        vision_used = False
        if not self._has_location(predicted_location):
            vision_used = True
            vision = await self._vision_analyze(image_bytes)
            if vision and vision.latitude is not None and vision.longitude is not None:
                predicted_location = self._merge_location(
                    predicted_location,
                    LocationPrediction(
                        country=None,
                        city=None,
                        district=None,
                        neighborhood=None,
                        latitude=vision.latitude,
                        longitude=vision.longitude,
                    ),
                )
                if vision.description:
                    factors.append(f"Google Vision landmark tespiti: {vision.description}")
                else:
                    factors.append("Google Vision landmark tespiti bulundu.")
                if vision.score is not None:
                    confidence = max(confidence, int(max(45, min(95, vision.score * 100))))
                else:
                    confidence = max(confidence, 60)
                analysis_parts.append("Google Cloud Vision Landmark tespiti devreye alındı.")
            elif vision and vision.web_labels:
                label_str = ", ".join(vision.web_labels[:3])
                factors.append(f"Google Vision web etiketleri: {label_str}")
                confidence = max(confidence, 35)
                analysis_parts.append("Google Cloud Vision Web tespiti etiketler sundu ancak net bir konum çıkmadı.")

        if not analysis_parts:
            analysis_parts.append("EXIF ve yerel indeks eşleşmeleri konum için yeterli sinyal üretmedi.")
            if vision_used:
                analysis_parts.append("Google Cloud Vision landmark tespiti bulunamadı.")

        analysis_parts.append("Bu analiz yüz/kimlik tespiti yapmaz; yalnızca konum ipuçlarından tahmin üretir.")

        if not factors:
            factors.append("Yeterli sinyal bulunamadı.")

        analysis = " ".join(analysis_parts)
        return LocationIntelligenceResult(
            predicted_location=predicted_location,
            analysis=analysis,
            confidence=int(max(1, min(100, confidence))),
            factors=factors,
            mandatory_notice=MANDATORY_NOTICE_TR,
        )

    def _is_unknown_text(self, value: Optional[str]) -> bool:
        if not value:
            return True
        v = value.strip().lower()
        return v in {"bilinmiyor", "unknown", "n/a", "na"}

    def _has_location(self, pred: LocationPrediction) -> bool:
        if pred is None:
            return False
        if isinstance(pred.latitude, (int, float)) and isinstance(pred.longitude, (int, float)):
            return True
        return any(
            not self._is_unknown_text(v)
            for v in [pred.country, pred.city, pred.district, pred.neighborhood]
        )

    def _pick_text(self, incoming: Optional[str], existing: Optional[str]) -> Optional[str]:
        if incoming and not self._is_unknown_text(incoming):
            return incoming
        return existing

    def _merge_location(self, base: LocationPrediction, incoming: LocationPrediction) -> LocationPrediction:
        return LocationPrediction(
            country=self._pick_text(incoming.country, base.country),
            city=self._pick_text(incoming.city, base.city),
            district=self._pick_text(incoming.district, base.district),
            neighborhood=self._pick_text(incoming.neighborhood, base.neighborhood),
            latitude=incoming.latitude if incoming.latitude is not None else base.latitude,
            longitude=incoming.longitude if incoming.longitude is not None else base.longitude,
        )

    def _to_location_prediction(self, pred) -> LocationPrediction:
        return LocationPrediction(
            country=getattr(pred, "country", None),
            city=getattr(pred, "city", None),
            district=getattr(pred, "district", None),
            neighborhood=getattr(pred, "neighborhood", None),
            latitude=getattr(pred, "latitude", None),
            longitude=getattr(pred, "longitude", None),
        )

    async def _vision_analyze(self, image_bytes: bytes) -> Optional[_VisionResult]:
        api_key = getattr(settings, "GOOGLE_CLOUD_VISION_API_KEY", None)
        if not api_key:
            return None

        endpoint = getattr(settings, "GOOGLE_CLOUD_VISION_ENDPOINT", "https://vision.googleapis.com/v1/images:annotate")
        url = f"{endpoint}?key={api_key}"
        payload = {
            "requests": [
                {
                    "image": {"content": base64.b64encode(image_bytes).decode("utf-8")},
                    "features": [
                        {"type": "LANDMARK_DETECTION", "maxResults": int(getattr(settings, "GOOGLE_CLOUD_VISION_MAX_RESULTS", 5))},
                        {"type": "WEB_DETECTION", "maxResults": 3},
                    ],
                }
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=float(getattr(settings, "GOOGLE_CLOUD_VISION_TIMEOUT", 20))) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            logger.warning("Google Vision request failed: %s", exc)
            return None

        responses = data.get("responses") or []
        if not responses:
            return None

        response0 = responses[0] or {}
        if response0.get("error"):
            logger.warning("Google Vision response error: %s", response0.get("error"))
            return None

        landmarks = response0.get("landmarkAnnotations") or []
        best = None
        if landmarks:
            best = max(landmarks, key=lambda x: x.get("score", 0))

        lat = None
        lon = None
        desc = None
        score = None
        if best:
            desc = best.get("description")
            score = best.get("score")
            locations = best.get("locations") or []
            if locations:
                lat_lng = (locations[0] or {}).get("latLng") or {}
                lat = lat_lng.get("latitude")
                lon = lat_lng.get("longitude")

        web = response0.get("webDetection") or {}
        labels = [l.get("label") for l in (web.get("bestGuessLabels") or []) if l.get("label")]

        return _VisionResult(
            description=desc,
            latitude=lat if isinstance(lat, (int, float)) else None,
            longitude=lon if isinstance(lon, (int, float)) else None,
            score=score if isinstance(score, (int, float)) else None,
            web_labels=labels,
        )


location_intelligence_service = LocationIntelligenceService()

