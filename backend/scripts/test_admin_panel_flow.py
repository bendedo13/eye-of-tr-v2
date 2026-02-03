import os
import sys
from pathlib import Path
from datetime import datetime
import uuid

from fastapi.testclient import TestClient

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ADMIN_API_KEY", "dev-admin-key-change-me")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app  # noqa: E402


client = TestClient(app)


def main():
    uniq = uuid.uuid4().hex[:8]
    email = f"admin.flow.{uniq}@example.com"
    username = f"admin_{uniq}"
    device_id = f"dev-{uniq}"
    password = "Passw0rd!123"

    r = client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password, "referral_code": None, "device_id": device_id},
        headers={"x-forwarded-for": "3.3.3.3"},
    )
    assert r.status_code == 200, r.text

    r = client.post(
        "/api/analytics/heartbeat",
        json={"device_id": device_id, "seconds": 15, "path": "/tr", "locale": "tr"},
        headers={"x-forwarded-for": "8.8.8.8"},
    )
    assert r.status_code == 200, r.text

    r = client.get("/api/admin/ping", headers={"x-admin-key": os.environ["ADMIN_API_KEY"]})
    assert r.status_code == 200, r.text

    r = client.get("/api/admin/overview", headers={"x-admin-key": os.environ["ADMIN_API_KEY"]})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "total_users" in data
    assert "active_users_today" in data

    r = client.get("/api/admin/users", headers={"x-admin-key": os.environ["ADMIN_API_KEY"]}, params={"q": email})
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert len(items) >= 1

    r = client.post(
        "/api/admin/site-settings",
        headers={"x-admin-key": os.environ["ADMIN_API_KEY"]},
        json={"key": "home.tr.hero_title", "value": "TEST BAŞLIK"},
    )
    assert r.status_code == 200, r.text

    r = client.get("/api/public/site-config", params={"locale": "tr"})
    assert r.status_code == 200, r.text
    assert r.json()["config"].get("home.tr.hero_title") == "TEST BAŞLIK"

    slug = f"test-post-{uniq}"
    r = client.post(
        "/api/admin/blog-posts",
        headers={"x-admin-key": os.environ["ADMIN_API_KEY"]},
        json={
            "locale": "tr",
            "slug": slug,
            "title": f"Test {uniq}",
            "excerpt": "Kısa özet",
            "content_html": "<p>Merhaba</p>",
            "is_published": True,
            "author_name": "FaceSeek",
        },
    )
    assert r.status_code == 200, r.text

    r = client.get("/api/public/blog-posts", params={"locale": "tr"})
    assert r.status_code == 200, r.text
    assert any(p["slug"] == slug for p in r.json()["items"])

    r = client.get(f"/api/public/blog-posts/{slug}", params={"locale": "tr"})
    assert r.status_code == 200, r.text
    assert r.json()["post"]["title"].startswith("Test")

    print("OK: admin panel flow passed", datetime.now().isoformat())


if __name__ == "__main__":
    main()

