import io
import os
import sys
from pathlib import Path
import uuid

from fastapi.testclient import TestClient
from PIL import Image, ImageFilter

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("MAX_UPLOAD_SIZE", "1048576")
os.environ.setdefault("RATE_LIMIT_LOCATION_INTELLIGENCE_PER_MINUTE", "200")
os.environ.setdefault("LOCATION_INTELLIGENCE_SPAM_PER_MINUTE", "200")
os.environ.setdefault("LOCATION_INTELLIGENCE_SPAM_PER_DAY", "2000")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.mailer import get_last_code  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def _png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _register_and_verify(*, ip: str, device_id: str):
    uniq = uuid.uuid4().hex[:8]
    email = f"li.user.{uniq}@example.com"
    username = f"liuser_{uniq}"
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
        u.credits = 10
        db.commit()

    return email, token


def _me(token: str):
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    return r.json()


def _analyze(token: str, *, device_id: str, img_bytes: bytes, consent: bool):
    files = {"file": ("image.png", img_bytes, "image/png")}
    data = {"consent": "true" if consent else "false", "device_id": device_id}
    return client.post(
        "/api/location-intelligence/analyze",
        headers={"Authorization": f"Bearer {token}", "x-forwarded-for": "127.0.0.51"},
        files=files,
        data=data,
    )


def main():
    device_id = f"device-li-{uuid.uuid4().hex[:8]}"
    email, token = _register_and_verify(ip="127.0.0.50", device_id=device_id)

    before = _me(token)["credits"]

    img = Image.new("RGB", (512, 512), (30, 120, 40))
    for x in range(512):
        for y in range(160):
            img.putpixel((x, y), (40, 90, 180))
    good_bytes = _png_bytes(img)

    r = _analyze(token, device_id=device_id, img_bytes=good_bytes, consent=False)
    assert r.status_code == 400, r.text
    assert _me(token)["credits"] == before

    r = _analyze(token, device_id=device_id, img_bytes=good_bytes, consent=True)
    assert r.status_code == 200, r.text
    payload = r.json()
    assert "predicted_location" in payload
    assert "analysis" in payload and isinstance(payload["analysis"], str) and len(payload["analysis"]) > 10
    assert "confidence" in payload and 0 <= int(payload["confidence"]) <= 100
    assert "factors" in payload and isinstance(payload["factors"], list) and len(payload["factors"]) >= 3
    assert "mandatory_notice" in payload and "Kesinlik içermez" in payload["mandatory_notice"]

    after = _me(token)["credits"]
    assert after == before - 1

    invalid = b"not-an-image"
    r = _analyze(token, device_id=device_id, img_bytes=invalid, consent=True)
    assert r.status_code == 422, r.text
    assert _me(token)["credits"] == after

    lowq = Image.new("RGB", (96, 96), (120, 120, 120)).filter(ImageFilter.GaussianBlur(radius=3))
    r = _analyze(token, device_id=device_id, img_bytes=_png_bytes(lowq), consent=True)
    assert r.status_code == 200, r.text

    indoor = Image.new("RGB", (512, 512), (90, 90, 90))
    r = _analyze(token, device_id=device_id, img_bytes=_png_bytes(indoor), consent=True)
    assert r.status_code == 200, r.text

    ai_like = Image.new("RGB", (512, 512), (240, 40, 220))
    r = _analyze(token, device_id=device_id, img_bytes=_png_bytes(ai_like), consent=True)
    assert r.status_code == 200, r.text

    with SessionLocal() as db:
        u = db.query(User).filter(User.email == email).first()
        assert u is not None
        u.credits = 0
        db.commit()

    r = _analyze(token, device_id=device_id, img_bytes=good_bytes, consent=True)
    assert r.status_code == 402, r.text

    print("OK: Location Intelligence happy path + edge-case kontrolleri geçti")


if __name__ == "__main__":
    main()
