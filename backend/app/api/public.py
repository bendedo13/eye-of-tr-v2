import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.cms import BlogPost, SiteSetting
from app.models.guest_bank_inquiry import GuestBankInquiry


router = APIRouter(prefix="/api/public", tags=["public"])


class GuestBankInquiryIn(BaseModel):
    name: str
    email: str
    phone: str | None = None
    desired_plan: str | None = None
    desired_credits: int | None = None
    message: str | None = None


@router.post("/bank-transfer-inquiry")
def create_guest_bank_inquiry(payload: GuestBankInquiryIn, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip()
    if not name or not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Name and valid email are required")

    row = GuestBankInquiry(
        name=name[:120],
        email=email[:255],
        phone=(payload.phone or "").strip()[:50] or None,
        desired_plan=(payload.desired_plan or "").strip()[:120] or None,
        desired_credits=int(payload.desired_credits) if payload.desired_credits else None,
        message=(payload.message or "").strip() or None,
        status="new",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"status": "ok", "request_id": row.id}


@router.get("/blog-posts")
def public_blog_posts(locale: str, db: Session = Depends(get_db)):
    posts = (
        db.query(BlogPost)
        .filter(BlogPost.locale == locale)
        .filter(BlogPost.is_published.is_(True))
        .order_by(desc(BlogPost.published_at), desc(BlogPost.created_at))
        .all()
    )
    return {
        "items": [
            {
                "slug": p.slug,
                "title": p.title,
                "excerpt": p.excerpt,
                "cover_image_url": p.cover_image_url,
                "author_name": p.author_name,
                "published_at": p.published_at,
            }
            for p in posts
        ]
    }


@router.get("/blog-posts/{slug}")
def public_blog_post(slug: str, locale: str, db: Session = Depends(get_db)):
    p = (
        db.query(BlogPost)
        .filter(BlogPost.locale == locale)
        .filter(BlogPost.slug == slug)
        .filter(BlogPost.is_published.is_(True))
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "post": {
            "slug": p.slug,
            "title": p.title,
            "excerpt": p.excerpt,
            "content_html": p.content_html,
            "cover_image_url": p.cover_image_url,
            "author_name": p.author_name,
            "published_at": p.published_at,
        }
    }


@router.get("/site-config")
def public_site_config(locale: str, db: Session = Depends(get_db)):
    keys = [
        f"home.{locale}.hero_title",
        f"home.{locale}.hero_subtitle",
        f"home.{locale}.hero_badge",
        f"home.{locale}.privacy_badge",
        f"home.{locale}.cta_title_part1",
        f"home.{locale}.cta_title_part2",
        f"home.{locale}.cta_description",
        f"home.{locale}.cta_button",
        "home.hero_image_url",
        "home.hero_image_title",
        "home.analysis_video_url",
        "home.analysis_video_title",
        "site.maintenance_mode",
        "site.contact_email",
    ]
    rows = db.query(SiteSetting).filter(SiteSetting.key.in_(keys)).all()
    out: dict[str, Any] = {}
    for r in rows:
        try:
            out[r.key] = json.loads(r.value_json)
        except Exception:
            out[r.key] = r.value_json
    return {"config": out}


@router.get("/legal-pages/{slug}")
def public_legal_page(slug: str, locale: str, db: Session = Depends(get_db)):
    key = f"legal.{locale}.{slug}"
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        data = json.loads(row.value_json)
        if not isinstance(data, dict):
            data = {"content_html": row.value_json}
    except Exception:
        data = {"content_html": row.value_json}
    return {
        "page": {
            "slug": slug,
            "locale": locale,
            "title": data.get("title"),
            "subtitle": data.get("subtitle"),
            "content_html": data.get("content_html") or data.get("html") or "",
            "updated_at": data.get("updated_at"),
        }
    }
