import os
import sys
from pathlib import Path
import uuid

from fastapi.testclient import TestClient

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.mailer import get_last_code  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def main():
    uniq = uuid.uuid4().hex[:8]
    email = f"test.user.{uniq}@example.com"
    username = f"testuser_{uniq}"
    password = "Passw0rd!123"
    device_id = f"device-test-{uniq}"

    r = client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password, "referral_code": None, "device_id": device_id},
        headers={"x-forwarded-for": "127.0.0.10"},
    )
    assert r.status_code in (200, 400, 429), r.text
    if r.status_code != 200:
        print("Register blocked (expected in repeated runs):", r.status_code, r.json())
        return

    r = client.post("/api/auth/login", json={"email": email, "password": password, "device_id": device_id})
    assert r.status_code == 403, r.text

    code = get_last_code(email)
    assert code and len(code) == 6, "No verification code captured (DEBUG must be true)"

    r = client.post("/api/auth/verify-email", json={"email": email, "code": code, "device_id": device_id})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]

    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["email"] == email
    assert me["username"] == username

    r = client.post("/api/auth/login", json={"email": email, "password": password, "device_id": device_id})
    assert r.status_code == 200, r.text

    r = client.post(
        "/api/auth/register",
        json={"email": "other@example.com", "username": "otheruser", "password": password, "referral_code": None, "device_id": device_id},
        headers={"x-forwarded-for": "127.0.0.10"},
    )
    assert r.status_code in (400, 429), r.text

    print("OK: register→verify→login akışı çalışıyor")


if __name__ == "__main__":
    main()
