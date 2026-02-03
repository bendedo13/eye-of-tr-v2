import os
import sys
from pathlib import Path
import uuid
from urllib.parse import urlparse, parse_qs

from fastapi.testclient import TestClient

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.mailer import get_last_code, get_last_reset_url  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def main():
    uniq = uuid.uuid4().hex[:8]
    email = f"pw.reset.{uniq}@example.com"
    username = f"pw_{uniq}"
    device_id = f"dev-{uniq}"
    password = "Passw0rd!123"
    new_password = "Passw0rd!999"

    r = client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password, "referral_code": None, "device_id": device_id},
        headers={"x-forwarded-for": "127.0.0.30"},
    )
    assert r.status_code == 200, r.text

    code = get_last_code(email)
    assert code
    r = client.post("/api/auth/verify-email", json={"email": email, "code": code, "device_id": device_id})
    assert r.status_code == 200, r.text

    r = client.post(
        "/api/auth/request-password-reset",
        json={"email": email, "device_id": "other-device", "reset_url_base": "http://localhost:3000/tr/reset-password"},
    )
    assert r.status_code == 200, r.text

    reset_url = get_last_reset_url(email)
    assert reset_url
    qs = parse_qs(urlparse(reset_url).query)
    token = qs["token"][0]

    r = client.post(
        "/api/auth/reset-password",
        json={"email": email, "token": token, "new_password": new_password, "device_id": "any"},
    )
    assert r.status_code == 200, r.text

    r = client.post("/api/auth/login", json={"email": email, "password": password, "device_id": device_id})
    assert r.status_code == 401, r.text

    r = client.post("/api/auth/login", json={"email": email, "password": new_password, "device_id": device_id})
    assert r.status_code == 200, r.text

    print("OK: password reset akışı çalışıyor")


if __name__ == "__main__":
    main()

