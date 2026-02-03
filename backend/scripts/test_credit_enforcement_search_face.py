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
from app.db.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)


def main():
    uniq = uuid.uuid4().hex[:8]
    email = f"credit.test.{uniq}@example.com"
    username = f"cred_{uniq}"
    password = "Passw0rd!123"
    device_id = f"device-cred-{uniq}"

    r = client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password, "referral_code": None, "device_id": device_id},
        headers={"x-forwarded-for": "127.0.0.20"},
    )
    assert r.status_code == 200, r.text

    code = get_last_code(email)
    assert code, "No verification code captured"
    r = client.post("/api/auth/verify-email", json={"email": email, "code": code, "device_id": device_id})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]

    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    assert user
    user.credits = 0
    db.commit()
    db.close()

    files = {"file": ("q.jpg", b"0", "image/jpeg")}
    r = client.post("/search-face?top_k=1&include_facecheck=false", files=files, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 402, r.text

    print("OK: search-face kredi 0 iken 402 döndürüyor")


if __name__ == "__main__":
    main()

