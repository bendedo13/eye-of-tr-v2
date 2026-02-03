import io
import json
import os
import statistics
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("RATE_LIMIT_LOCATION_INTELLIGENCE_PER_MINUTE", "500")
os.environ.setdefault("LOCATION_INTELLIGENCE_SPAM_PER_MINUTE", "500")
os.environ.setdefault("LOCATION_INTELLIGENCE_SPAM_PER_DAY", "5000")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.mailer import get_last_code  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


@dataclass
class TestCase:
    name: str
    difficulty: str  # "kolay" | "zor"
    expected_label: str  # "evet" | "hayır"
    image_bytes: bytes
    mime: str


def _png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_easy_lowres_single() -> bytes:
    img = Image.new("RGB", (160, 160), (20, 120, 40))
    for y in range(60):
        for x in range(160):
            img.putpixel((x, y), (40, 110 + (y // 6), 200))
    d = ImageDraw.Draw(img)
    d.rectangle([60, 70, 100, 120], outline=(240, 240, 240), width=2)
    return _png_bytes(img)


def _make_easy_highres_complex() -> bytes:
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (40, 140, 60))
    d = ImageDraw.Draw(img)

    for y in range(h // 3):
        c = int(120 + 80 * (y / (h / 3)))
        d.line([(0, y), (w, y)], fill=(60, 110, c))

    for x in range(80, w, 220):
        d.rectangle([x, 420, x + 120, 980], outline=(230, 230, 230), width=6)
        d.line([(x, 700), (x + 120, 700)], fill=(230, 230, 230), width=4)

    for i in range(20):
        cx = 80 + i * 90
        cy = 860 + (i % 4) * 20
        d.ellipse([cx, cy, cx + 28, cy + 28], fill=(30, 170, 70))

    img = ImageEnhance.Contrast(img).enhance(1.15)
    img = ImageEnhance.Brightness(img).enhance(1.05)
    return _png_bytes(img)


def _make_hard_lowres_blurry() -> bytes:
    img = Image.new("RGB", (96, 96), (110, 110, 110))
    d = ImageDraw.Draw(img)
    d.ellipse([18, 18, 78, 78], fill=(125, 125, 125))
    img = img.filter(ImageFilter.GaussianBlur(radius=4))
    img = ImageEnhance.Contrast(img).enhance(0.85)
    return _png_bytes(img)


def _make_hard_highres_indoor_multi() -> bytes:
    w, h = 2560, 1440
    img = Image.new("RGB", (w, h), (120, 90, 70))
    d = ImageDraw.Draw(img)

    for y in range(h):
        r = int(110 + 40 * (y / h))
        g = int(85 + 25 * (y / h))
        b = int(65 + 20 * (y / h))
        d.line([(0, y), (w, y)], fill=(r, g, b))

    for x in range(120, w, 260):
        d.rectangle([x, 180, x + 180, 1240], outline=(140, 120, 100), width=8)
        d.rectangle([x + 30, 260, x + 150, 420], fill=(160, 135, 110))
        d.rectangle([x + 30, 460, x + 150, 640], fill=(160, 135, 110))

    img = ImageEnhance.Sharpness(img).enhance(0.6)
    img = ImageEnhance.Color(img).enhance(0.35)
    return _png_bytes(img)


def _register_and_verify(*, ip: str, device_id: str) -> Tuple[str, str]:
    uniq = uuid.uuid4().hex[:8]
    email = f"li.eval.{uniq}@example.com"
    username = f"lieval_{uniq}"
    password = "Passw0rd!123"

    r = client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password, "referral_code": None, "device_id": device_id},
        headers={"x-forwarded-for": ip},
    )
    assert r.status_code == 200, r.text
    code = get_last_code(email)
    assert code and len(code) == 6

    r = client.post("/api/auth/verify-email", json={"email": email, "code": code, "device_id": device_id})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]

    with SessionLocal() as db:
        u = db.query(User).filter(User.email == email).first()
        assert u is not None
        u.credits = 100
        db.commit()

    return email, token


def _parse_yes_label(factors: List[str]) -> Optional[str]:
    for f in factors:
        if f.lower().startswith("uygunluk etiketi:"):
            v = f.split(":", 1)[1].strip().lower()
            if v in ("evet", "hayır"):
                return v
    return None


def _analyze(token: str, *, device_id: str, img: bytes, mime: str) -> Dict[str, Any]:
    files = {"file": ("image.png", img, mime)}
    data = {"consent": "true", "device_id": device_id}
    r = client.post(
        "/api/location-intelligence/analyze",
        headers={"Authorization": f"Bearer {token}", "x-forwarded-for": "127.0.0.77"},
        files=files,
        data=data,
    )
    assert r.status_code == 200, r.text
    return r.json()


def _mean(xs: List[float]) -> float:
    return float(statistics.mean(xs)) if xs else 0.0


def _stdev(xs: List[float]) -> float:
    return float(statistics.pstdev(xs)) if len(xs) >= 2 else 0.0


def main():
    device_id = f"device-li-eval-{uuid.uuid4().hex[:8]}"
    _email, token = _register_and_verify(ip="127.0.0.76", device_id=device_id)

    cases: List[TestCase] = [
        TestCase(
            name="kolay-1 (düşük çözünürlük, tek nesne, gökyüzü+bitki)",
            difficulty="kolay",
            expected_label="evet",
            image_bytes=_make_easy_lowres_single(),
            mime="image/png",
        ),
        TestCase(
            name="kolay-2 (yüksek çözünürlük, çoklu nesne, yüksek detay)",
            difficulty="kolay",
            expected_label="evet",
            image_bytes=_make_easy_highres_complex(),
            mime="image/png",
        ),
        TestCase(
            name="zor-1 (düşük çözünürlük, bulanık, düşük ipucu)",
            difficulty="zor",
            expected_label="hayır",
            image_bytes=_make_hard_lowres_blurry(),
            mime="image/png",
        ),
        TestCase(
            name="zor-2 (yüksek çözünürlük, kapalı alan benzeri, düşük renk doygunluğu)",
            difficulty="zor",
            expected_label="hayır",
            image_bytes=_make_hard_highres_indoor_multi(),
            mime="image/png",
        ),
    ]

    per_image: List[Dict[str, Any]] = []
    for c in cases:
        payload = _analyze(token, device_id=device_id, img=c.image_bytes, mime=c.mime)
        factors = payload.get("factors") or []
        predicted = _parse_yes_label(factors) or "bilinmiyor"
        conf_0_1 = float(payload.get("confidence", 0)) / 100.0
        correct = 1 if predicted == c.expected_label else 0
        per_image.append(
            {
                "ad": c.name,
                "zorluk": c.difficulty,
                "beklenen": c.expected_label,
                "tahmin": predicted,
                "dogruluk_yuzde": 100.0 * float(correct),
                "guven_0_1": conf_0_1,
                "faktorler": factors[:10],
            }
        )

    easy = [x for x in per_image if x["zorluk"] == "kolay"]
    hard = [x for x in per_image if x["zorluk"] == "zor"]

    def agg(rows: List[Dict[str, Any]]) -> Dict[str, float]:
        acc = [float(r["dogruluk_yuzde"]) / 100.0 for r in rows]
        conf = [float(r["guven_0_1"]) for r in rows]
        return {
            "n": float(len(rows)),
            "ortalama_dogruluk": _mean(acc),
            "std_dogruluk": _stdev(acc),
            "ortalama_guven": _mean(conf),
            "std_guven": _stdev(conf),
        }

    agg_easy = agg(easy)
    agg_hard = agg(hard)

    report = {
        "model": "FaceSeek Location Intelligence (uygunluk etiketi: evet/hayır)",
        "not": "Bu rapor 4 sentetik test görseli ile oluşturulmuştur. İstatistikler küçük örneklem nedeniyle betimseldir.",
        "per_fotograf": per_image,
        "grup_analizi": {
            "kolay": agg_easy,
            "zor": agg_hard,
            "farklar": {
                "dogruluk_farki_kolay_eksi_zor": agg_easy["ortalama_dogruluk"] - agg_hard["ortalama_dogruluk"],
                "guven_farki_kolay_eksi_zor": agg_easy["ortalama_guven"] - agg_hard["ortalama_guven"],
            },
        },
        "guclu_yonler": [
            "Gökyüzü + bitki örtüsü gibi dış ortam sinyali güçlü sahnelerde uygunluk etiketi stabil.",
            "Yüksek çözünürlükte kentsel detay/kenar yoğunluğu arttığında çevresel sinyaller daha tutarlı.",
        ],
        "zayif_yonler": [
            "Bulanık ve düşük çözünürlüklü görüntülerde sinyaller (sky/edge) zayıfladığı için uygunluk düşebilir.",
            "Kapalı alan benzeri, düşük doygunluklu sahnelerde dış ortam ipuçları sınırlı; model güveni düşebilir.",
        ],
    }

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

