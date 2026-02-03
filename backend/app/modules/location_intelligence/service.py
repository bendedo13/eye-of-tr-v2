from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import cv2
import numpy as np

from app.modules.location_intelligence.schemas import LocationIntelligenceResult, LocationPrediction


MANDATORY_NOTICE_TR = (
    "Bu sonuçlar yapay zekâ tarafından üretilmiş tahminlerdir. "
    "Kesinlik içermez. Tüm hukuki ve fiili sorumluluk kullanıcıya aittir."
)


@dataclass
class _Signals:
    brightness: float
    saturation: float
    green_ratio: float
    blue_ratio: float
    warm_ratio: float
    edge_density: float
    blur_score: float
    sky_ratio_top: float


class LocationIntelligenceService:
    def analyze(self, image_bytes: bytes) -> LocationIntelligenceResult:
        bgr = self._decode(image_bytes)
        bgr_small = self._downscale(bgr, max_side=768)
        signals = self._extract_signals(bgr_small)
        label, score, factors = self._classify(signals)

        confidence = int(max(0, min(100, round(score * 100))))
        confidence = max(5, min(92, confidence))

        analysis = self._analysis_text(label=label, signals=signals, factors=factors)

        predicted_location = LocationPrediction(
            country="Bilinmiyor",
            city=None,
            district=None,
            neighborhood=None,
            latitude=None,
            longitude=None,
        )

        return LocationIntelligenceResult(
            predicted_location=predicted_location,
            analysis=analysis,
            confidence=confidence,
            factors=factors,
            mandatory_notice=MANDATORY_NOTICE_TR,
        )

    def _decode(self, image_bytes: bytes) -> np.ndarray:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("Görüntü okunamadı")
        return bgr

    def _downscale(self, bgr: np.ndarray, *, max_side: int) -> np.ndarray:
        h, w = bgr.shape[:2]
        if max(h, w) <= max_side:
            return bgr
        scale = float(max_side) / float(max(h, w))
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))
        return cv2.resize(bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

    def _extract_signals(self, bgr: np.ndarray) -> _Signals:
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        h = hsv[:, :, 0].astype(np.float32)
        s = hsv[:, :, 1].astype(np.float32)
        v = hsv[:, :, 2].astype(np.float32)

        brightness = float(np.mean(v) / 255.0)
        saturation = float(np.mean(s) / 255.0)

        mask_color = (s > 60) & (v > 50)
        green = mask_color & (h >= 35) & (h <= 85)
        blue = mask_color & (h >= 85) & (h <= 130)
        warm = mask_color & ((h <= 20) | (h >= 160))

        total = float(h.size)
        green_ratio = float(np.count_nonzero(green) / total)
        blue_ratio = float(np.count_nonzero(blue) / total)
        warm_ratio = float(np.count_nonzero(warm) / total)

        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 80, 160)
        edge_density = float(np.count_nonzero(edges) / float(edges.size))

        lap = cv2.Laplacian(gray, cv2.CV_64F)
        blur_score = float(lap.var())

        top = hsv[: max(1, hsv.shape[0] // 3), :, :]
        ht = top[:, :, 0].astype(np.float32)
        st = top[:, :, 1].astype(np.float32)
        vt = top[:, :, 2].astype(np.float32)
        sky = (st > 40) & (vt > 60) & (ht >= 85) & (ht <= 130)
        sky_ratio_top = float(np.count_nonzero(sky) / float(sky.size))

        return _Signals(
            brightness=brightness,
            saturation=saturation,
            green_ratio=green_ratio,
            blue_ratio=blue_ratio,
            warm_ratio=warm_ratio,
            edge_density=edge_density,
            blur_score=blur_score,
            sky_ratio_top=sky_ratio_top,
        )

    def _classify(self, sig: _Signals) -> Tuple[str, float, List[str]]:
        factors: List[str] = []

        low_quality = sig.blur_score < 35.0
        if low_quality:
            factors.append("Görüntü bulanık / düşük detaylı (düşük kalite sinyali)")

        if sig.green_ratio > 0.16:
            factors.append("Bitki örtüsü yoğunluğu yüksek (yeşil oranı)")
        elif sig.green_ratio < 0.05:
            factors.append("Bitki örtüsü sinyali zayıf (yeşil oranı düşük)")

        if sig.sky_ratio_top > 0.20:
            factors.append("Üst bölgede gökyüzü olasılığı yüksek (mavi yoğunluğu)")
        elif sig.sky_ratio_top < 0.06:
            factors.append("Gökyüzü sinyali zayıf (kapalı alan veya dar kadraj olasılığı)")

        if sig.warm_ratio > 0.18 and sig.brightness > 0.55:
            factors.append("Sıcak tonlar ve yüksek parlaklık (kurak/sıcak iklim olasılığı)")

        if sig.edge_density > 0.10:
            factors.append("Yüksek kenar yoğunluğu (kentsel yapı / mimari detay olasılığı)")
        elif sig.edge_density < 0.04:
            factors.append("Düşük kenar yoğunluğu (doğal arazi veya düşük detay olasılığı)")

        scores = {
            "Akdeniz/Denizel": 0.35 + 0.9 * sig.blue_ratio + 0.4 * sig.warm_ratio + 0.25 * sig.brightness,
            "Kuzey/Serin": 0.30 + 0.35 * (1.0 - sig.saturation) + 0.25 * (1.0 - sig.brightness) + 0.15 * sig.green_ratio,
            "Kurak/Çöl": 0.30 + 0.9 * sig.warm_ratio + 0.35 * sig.brightness + 0.2 * (1.0 - sig.green_ratio),
            "Tropikal/Nemli": 0.30 + 1.1 * sig.green_ratio + 0.25 * sig.saturation + 0.15 * sig.brightness,
            "Kentsel/Yoğun": 0.28 + 1.0 * sig.edge_density + 0.15 * sig.brightness,
        }

        label = max(scores, key=scores.get)
        raw = float(scores[label])
        score = max(0.10, min(0.85, raw / 1.8))

        if low_quality:
            score = max(0.08, score * 0.65)

        if sig.sky_ratio_top < 0.06 and sig.edge_density < 0.05:
            factors.append("Kapalı alan / tabela ve yol işaretleri görünmüyor olabilir")
            score = max(0.06, score * 0.75)

        if sig.edge_density < 0.03 and sig.saturation > 0.55:
            factors.append("AI üretilmiş görsel olasılığı (anormal doku/kenar profili)")
            score = max(0.06, score * 0.80)

        factors.insert(0, f"Tahmini çevresel bölge: {label}")

        return label, score, factors

    def _analysis_text(self, *, label: str, signals: _Signals, factors: List[str]) -> str:
        parts: List[str] = []
        if label == "Akdeniz/Denizel":
            parts.append("Renk dağılımı ve üst bölgede mavi yoğunluğu, denizel/akdeniz iklimine benzer bir çevreyi işaret ediyor.")
        elif label == "Kurak/Çöl":
            parts.append("Sıcak tonların baskınlığı ve düşük yeşil oranı, kurak/arid bir iklim olasılığını artırıyor.")
        elif label == "Tropikal/Nemli":
            parts.append("Yeşil yoğunluğu ve doygunluk seviyesi, nemli/tropikal bir çevre olasılığını artırıyor.")
        elif label == "Kentsel/Yoğun":
            parts.append("Kenar yoğunluğu ve geometrik detaylar, kentsel/mimari yapı yoğunluğu olasılığına işaret ediyor.")
        else:
            parts.append("Parlaklık, doygunluk ve renk dağılımı, daha serin/kapalı hava koşullarına benzer bir çevre olasılığına işaret ediyor.")

        if signals.blur_score < 35.0:
            parts.append("Görüntü bulanık olduğu için tabela dili, yol çizgileri ve küçük çevresel ipuçları güvenilir biçimde ayrılamayabilir.")

        parts.append("Bu analiz yüz/kimlik tespiti yapmaz; sadece çevresel ipuçlarından tahmin üretir.")
        return " ".join(parts)


location_intelligence_service = LocationIntelligenceService()

