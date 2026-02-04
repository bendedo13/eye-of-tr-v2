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
    admin_headers = {"x-admin-key": os.environ["ADMIN_API_KEY"], "x-admin-email": "admin@local"}

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

    r = client.get("/api/admin/ping", headers=admin_headers)
    assert r.status_code == 200, r.text

    r = client.get("/api/admin/overview", headers=admin_headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "total_users" in data
    assert "active_users_today" in data

    r = client.get("/api/admin/users", headers=admin_headers, params={"q": email})
    assert r.status_code == 200, r.text
    items = r.json()["items"]
    assert len(items) >= 1
    user_id = items[0]["id"]

    r = client.patch(
        f"/api/admin/users/{user_id}",
        headers=admin_headers,
        json={"credits": 42},
    )
    assert r.status_code == 200, r.text

    r = client.post(
        "/api/admin/site-settings",
        headers=admin_headers,
        json={"key": "home.tr.hero_title", "value": "TEST BAŞLIK"},
    )
    assert r.status_code == 200, r.text

    r = client.get("/api/public/site-config", params={"locale": "tr"})
    assert r.status_code == 200, r.text
    assert r.json()["config"].get("home.tr.hero_title") == "TEST BAŞLIK"

    slug = f"test-post-{uniq}"
    r = client.post(
        "/api/admin/blog-posts",
        headers=admin_headers,
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
    post_id = r.json()["id"]

    r = client.put(
        f"/api/admin/blog-posts/{post_id}",
        headers=admin_headers,
        json={"title": f"Test {uniq} (upd)", "excerpt": "Güncellendi"},
    )
    assert r.status_code == 200, r.text

    r = client.get(f"/api/admin/blog-posts/{post_id}", headers=admin_headers)
    assert r.status_code == 200, r.text
    assert "(upd)" in r.json()["post"]["title"]

    r = client.get("/api/public/blog-posts", params={"locale": "tr"})
    assert r.status_code == 200, r.text
    assert any(p["slug"] == slug for p in r.json()["items"])

    r = client.get(f"/api/public/blog-posts/{slug}", params={"locale": "tr"})
    assert r.status_code == 200, r.text
    assert r.json()["post"]["title"].startswith("Test")

    r = client.post(
        "/api/admin/media/upload",
        headers=admin_headers,
        data={"folder": "admin"},
        files={"file": ("test.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", "image/png")},
    )
    assert r.status_code == 200, r.text

    r = client.get("/api/admin/media", headers=admin_headers)
    assert r.status_code == 200, r.text
    assert len(r.json()["items"]) >= 1

    r = client.get("/api/admin/payments", headers=admin_headers)
    assert r.status_code == 200, r.text

    r = client.get("/api/admin/referrals", headers=admin_headers)
    assert r.status_code == 200, r.text

    r = client.get("/api/admin/audit", headers=admin_headers, params={"limit": 200})
    assert r.status_code == 200, r.text
    audit = r.json()["items"]
    actions = {a["action"] for a in audit}
    assert "user.update" in actions
    assert "site_setting.set" in actions
    assert "blog_post.create" in actions
    assert "blog_post.update" in actions
    assert "media.upload" in actions
    assert any((a.get("actor_email") or "") == "admin@local" for a in audit)

    r = client.delete(f"/api/admin/blog-posts/{post_id}", headers=admin_headers)
    assert r.status_code == 200, r.text
    r = client.get("/api/admin/audit", headers=admin_headers, params={"limit": 200})
    assert r.status_code == 200, r.text
    assert any(a["action"] == "blog_post.delete" and str(a.get("resource_id")) == str(post_id) for a in r.json()["items"])

    print("OK: admin panel flow passed", datetime.now().isoformat())


if __name__ == "__main__":
    main()
