import io
import json
import os
import random
import statistics
import sys
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Tuple

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("RATE_LIMIT_VISUAL_LOCATION_PER_MINUTE", "500")
os.environ.setdefault("VISUAL_LOCATION_SPAM_PER_MINUTE", "500")
os.environ.setdefault("VISUAL_LOCATION_SPAM_PER_DAY", "5000")
os.environ.setdefault("MAX_ACCOUNTS_PER_IP_PER_DAY", "999")
os.environ.setdefault("RATE_LIMIT_AUTH_PER_MINUTE", "500")
os.environ.setdefault("BING_API_KEY", "")
os.environ.setdefault("FACECHECK_API_KEY", "")
os.environ.setdefault("YANDEX_API_KEY", "")
os.environ.setdefault("FACECHECK_ENABLED", "false")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.modules.visual_location.phash import compute_ahash, compute_dhash, compute_phash  # noqa: E402
from app.modules.visual_location.orb import compute_orb_descriptors, encode_desc_b64  # noqa: E402
from app.services.mailer import get_last_code  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


@dataclass
class Case:
    name: str
    difficulty: str  # kolay|zor
    expected_id: str
    expected_lat: float
    expected_lon: float
    query_bytes: bytes


def _png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_base_image(seed: int, *, size: Tuple[int, int]) -> Image.Image:
    random.seed(seed)
    w, h = size
    bg = (
        30 + (seed * 37) % 200,
        30 + (seed * 91) % 200,
        30 + (seed * 147) % 200,
    )
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    for i in range(18):
        x0 = random.randint(0, w - 1)
        y0 = random.randint(0, h - 1)
        x1 = min(w - 1, x0 + random.randint(40, 240))
        y1 = min(h - 1, y0 + random.randint(40, 240))
        color = (random.randint(30, 240), random.randint(30, 240), random.randint(30, 240))
        if i % 2 == 0:
            d.rectangle([x0, y0, x1, y1], outline=color, width=4)
        else:
            d.ellipse([x0, y0, x1, y1], outline=color, width=4)
    for y in range(h // 3):
        d.line([(0, y), (w, y)], fill=(50, 100, 200))

    grid = 8
    block = max(10, w // 24)
    start_x = (w - (grid * block)) // 2
    start_y = (h - (grid * block)) // 2
    code = (seed * 2654435761) & 0xFFFFFFFF
    for by in range(grid):
        for bx in range(grid):
            bit = (code >> ((by * grid + bx) % 32)) & 1
            fill = (250, 250, 250) if bit else (5, 5, 5)
            x0 = start_x + bx * block
            y0 = start_y + by * block
            d.rectangle([x0, y0, x0 + block - 1, y0 + block - 1], fill=fill)
    return img


def _augment(img: Image.Image, *, difficulty: str) -> Image.Image:
    if difficulty == "kolay":
        img = ImageEnhance.Brightness(img).enhance(1.05)
        img = ImageEnhance.Contrast(img).enhance(1.08)
        if random.random() < 0.5:
            img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        img = img.rotate(random.uniform(-6, 6), resample=Image.Resampling.BICUBIC, expand=False)
        return img

    img = ImageEnhance.Color(img).enhance(0.70)
    img = ImageEnhance.Brightness(img).enhance(0.90)
    img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(1.5, 2.5)))
    img = img.rotate(random.uniform(-10, 10), resample=Image.Resampling.BICUBIC, expand=False)
    w, h = img.size
    cx = random.randint(int(w * 0.08), int(w * 0.12))
    cy = random.randint(int(h * 0.08), int(h * 0.12))
    img = img.crop((cx, cy, w - cx, h - cy)).resize((w, h), Image.Resampling.BICUBIC)
    return img


def _register_and_verify(*, ip: str, device_id: str) -> str:
    uniq = uuid.uuid4().hex[:8]
    email = f"vl.eval.{uniq}@example.com"
    username = f"vleval_{uniq}"
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
        u.credits = 200
        db.commit()

    return token


def _analyze(token: str, *, device_id: str, img_bytes: bytes) -> Dict[str, Any]:
    files = {"file": ("image.png", img_bytes, "image/png")}
    data = {"consent": "true", "device_id": device_id}
    r = client.post(
        "/api/visual-location/analyze",
        headers={"Authorization": f"Bearer {token}", "x-forwarded-for": "127.0.0.88"},
        files=files,
        data=data,
    )
    assert r.status_code == 200, r.text
    return r.json()


def _distance_deg(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    return float(((a_lat - b_lat) ** 2 + (a_lon - b_lon) ** 2) ** 0.5)


def _rating(acc: float) -> str:
    if acc >= 0.95:
        return "çok başarılı"
    if acc >= 0.85:
        return "başarılı"
    if acc >= 0.70:
        return "normal"
    if acc >= 0.50:
        return "başarısız"
    return "çok başarısız"


def main():
    random.seed(42)
    base_entries = []
    base_images = {}

    locations = [
        ("TR", "İstanbul", 41.0082, 28.9784),
        ("TR", "Ankara", 39.9334, 32.8597),
        ("TR", "İzmir", 38.4237, 27.1428),
        ("TR", "Antalya", 36.8969, 30.7133),
        ("DE", "Berlin", 52.5200, 13.4050),
        ("FR", "Paris", 48.8566, 2.3522),
        ("ES", "Barcelona", 41.3851, 2.1734),
        ("US", "New York", 40.7128, -74.0060),
        ("JP", "Tokyo", 35.6762, 139.6503),
        ("BR", "Rio de Janeiro", -22.9068, -43.1729),
    ]

    for i, (country, city, lat, lon) in enumerate(locations, start=1):
        entry_id = f"loc-{i:02d}"
        img = _make_base_image(i, size=(768, 768))
        img_bytes = _png_bytes(img)
        ph = compute_phash(img_bytes).value
        ah = compute_ahash(img_bytes).value
        dh = compute_dhash(img_bytes).value
        orb = compute_orb_descriptors(img_bytes)
        orb_b64 = encode_desc_b64(orb)
        orb_rows = int(orb.shape[0]) if orb is not None else 0
        base_images[entry_id] = img
        base_entries.append(
            {
                "id": entry_id,
                "provider": "local-index",
                "source_url": f"https://example.com/{entry_id}",
                "image_url": None,
                "title": f"{city} reference",
                "phash": hex(int(ph)),
                "ahash": hex(int(ah)),
                "dhash": hex(int(dh)),
                "orb_rows": orb_rows,
                "orb_desc_b64": orb_b64,
                "location_hint": {"country": country, "city": city, "latitude": lat, "longitude": lon},
            }
        )

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json", encoding="utf-8") as f:
        json.dump({"entries": base_entries}, f, ensure_ascii=False, indent=2)
        index_path = f.name

    os.environ["VISUAL_LOCATION_LOCAL_INDEX_PATH"] = index_path

    device_id = f"device-vl-{uuid.uuid4().hex[:8]}"
    ip = f"127.{random.randint(1, 200)}.{random.randint(1, 200)}.{random.randint(1, 200)}"
    token = _register_and_verify(ip=ip, device_id=device_id)

    cases: List[Case] = []
    for idx, (country, city, lat, lon) in enumerate(locations, start=1):
        entry_id = f"loc-{idx:02d}"
        difficulty = "kolay" if idx <= 5 else "zor"
        q = _augment(base_images[entry_id].copy(), difficulty=difficulty)
        cases.append(
            Case(
                name=f"{entry_id} ({city})",
                difficulty=difficulty,
                expected_id=entry_id,
                expected_lat=lat,
                expected_lon=lon,
                query_bytes=_png_bytes(q),
            )
        )

    per_image = []
    hits = 0
    confs = []
    tol = 0.25

    for c in cases:
        out = _analyze(token, device_id=device_id, img_bytes=c.query_bytes)
        pred = out.get("predicted_location") or {}
        plat = pred.get("latitude")
        plon = pred.get("longitude")
        ok = False
        dist = None
        if isinstance(plat, (int, float)) and isinstance(plon, (int, float)):
            dist = _distance_deg(float(plat), float(plon), c.expected_lat, c.expected_lon)
            ok = dist <= tol
        if ok:
            hits += 1
        conf = float(out.get("confidence_0_1", 0.0))
        confs.append(conf)
        per_image.append(
            {
                "ad": c.name,
                "zorluk": c.difficulty,
                "beklenen": {"lat": c.expected_lat, "lon": c.expected_lon},
                "tahmin": {"lat": plat, "lon": plon},
                "mesafe_deg": dist,
                "dogru_mu": ok,
                "guven_0_1": conf,
                "en_iyi_eslesme": (out.get("matches") or [{}])[0],
            }
        )

    overall_acc = hits / float(len(cases))

    easy = [r for r in per_image if r["zorluk"] == "kolay"]
    hard = [r for r in per_image if r["zorluk"] == "zor"]

    def _group_acc(rows):
        return sum(1 for r in rows if r["dogru_mu"]) / float(len(rows) or 1)

    report = {
        "aciklama": "Bu rapor, internet provider’ları devre dışı bırakılarak yalnızca yerel indeks (pHash) ile 10 görsel üzerinden üretilmiştir.",
        "tolerans_deg": tol,
        "genel": {
            "n": len(cases),
            "dogruluk": overall_acc,
            "puan": _rating(overall_acc),
            "ortalama_guven": float(statistics.mean(confs)) if confs else 0.0,
        },
        "kolay": {
            "n": len(easy),
            "dogruluk": _group_acc(easy),
            "ortalama_guven": float(statistics.mean([r["guven_0_1"] for r in easy])) if easy else 0.0,
        },
        "zor": {
            "n": len(hard),
            "dogruluk": _group_acc(hard),
            "ortalama_guven": float(statistics.mean([r["guven_0_1"] for r in hard])) if hard else 0.0,
        },
        "per_gorsel": per_image,
        "notlar": [
            "İnternet reverse-image provider sonuçları deterministik olmadığı için doğruluk kıyaslaması yerel kontrollü indeks üzerinden yapılmıştır.",
            "Gerçek internet entegrasyonu için provider anahtarları ile 'web' eşleşmelerine yer/EXIF çıkarımı eklenmelidir.",
        ],
    }

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
