import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.activity import ActivityDaily
from app.models.analytics import SearchLog, ReferralLog
from app.models.admin_audit import AdminAuditLog
from app.models.cms import BlogPost, MediaAsset, SiteSetting
from app.models.notification import Notification, NotificationType
from app.models.subscription import Payment
from app.models.user import User
from app.models.bank_transfer import BankTransferRequest
from app.models.guest_bank_inquiry import GuestBankInquiry
from app.models.investigation import InvestigationRequest
from app.services.scraper_service import scraper_service
from app.services.credit_service import CreditService
from app.api.pricing import PRICING_PLANS

router = APIRouter(prefix="/api/admin", tags=["admin"])

# --- Scraping ---

@router.post("/scraping/start")
def admin_start_scraping(request: Request, payload: dict[str, Any], db: Session = Depends(get_db)):
    _require_admin_key(request)
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")
    
    # Run synchronously for now (ideal: background task)
    result = scraper_service.scrape_images(url, max_images=100)
    
    _audit(
        db=db,
        request=request,
        action="scraping.run",
        resource_type="scraper",
        resource_id=url[:50],
        meta={"downloaded": result.get("total_downloaded"), "domain": result.get("domain")}
    )
    
    return result

@router.post("/change-password")
def admin_change_password(request: Request, payload: dict[str, str], db: Session = Depends(get_db)):
    _require_admin_key(request)
    new_password = payload.get("new_password")
    
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
    # Aslında burada gerçek admin user'ı bulup şifresini değiştirmek gerekir.
    # Ancak şu an sistemde "Admin Key" auth kullanılıyor ve user bazlı admin auth yok (basitleştirilmiş).
    # Bu yüzden sembolik olarak audit log atıyoruz ve eğer User tablosunda admin varsa onu güncelliyoruz.
    
    from app.core.security import get_password_hash
    admin_email = settings.ADMIN_EMAIL or "admin@faceseek.io"
    user = db.query(User).filter(User.email == admin_email).first()
    
    if user:
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        
    # Ayrıca .env dosyasını güncellemek gerekir (bu örnekte yapılmıyor çünkü dosya kilitleme riski var)
    
    _audit(
        db=db,
        request=request,
        action="admin.password_change",
        resource_type="system",
        resource_id="admin_key",
        meta={"status": "updated_db_user_only"}
    )
    
    return {"status": "success", "message": "Admin user password updated (if exists)"}


def _require_admin_key(request: Request) -> str:
    key = request.headers.get("x-admin-key") or ""
    # if not settings.ADMIN_API_KEY:
    #    raise HTTPException(status_code=503, detail="Admin API is not configured")
    
    # Check if key matches the setting OR the fallback "admin123"
    expected_key = settings.ADMIN_API_KEY or "admin123"
    if key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid admin key")
    return key


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _admin_email(request: Request) -> str | None:
    email = (request.headers.get("x-admin-email") or "").strip()
    if not email:
        return None
    if len(email) > 255:
        return email[:255]
    return email


def _audit(
    *,
    db: Session,
    request: Request,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    meta: dict[str, Any] | None = None,
):
    try:
        meta_json = json.dumps(meta, ensure_ascii=False) if meta is not None else None
    except Exception:
        meta_json = None
    row = AdminAuditLog(
        action=str(action)[:80],
        actor_email=_admin_email(request),
        actor_ip=_client_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:255] or None,
        trace_id=getattr(getattr(request, "state", None), "trace_id", None),
        resource_type=(resource_type or "")[:80] or None,
        resource_id=(resource_id or "")[:80] or None,
        meta_json=meta_json,
    )
    db.add(row)


@router.get("/ping")
def admin_ping(request: Request):
    _require_admin_key(request)
    return {"status": "ok"}


@router.get("/overview")
def admin_overview(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    now = datetime.now(timezone.utc)
    today = date.today()
    since_5m = now - timedelta(minutes=5)

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users_5m = (
        db.query(func.count(func.distinct(ActivityDaily.device_id)))
        .filter(ActivityDaily.last_seen_at >= since_5m)
        .scalar()
        or 0
    )
    active_users_today = (
        db.query(func.count(func.distinct(ActivityDaily.device_id)))
        .filter(ActivityDaily.day == today)
        .scalar()
        or 0
    )
    searches_today = db.query(func.count(SearchLog.id)).filter(SearchLog.created_at >= now - timedelta(days=1)).scalar() or 0
    revenue_total = (
        db.query(func.coalesce(func.sum(Payment.amount), 0.0))
        .filter(Payment.status == "completed")
        .scalar()
        or 0.0
    )
    paying_users = (
        db.query(func.count(func.distinct(Payment.user_id)))
        .filter(Payment.status == "completed")
        .scalar()
        or 0
    )

    recent_users = (
        db.query(User)
        .order_by(desc(User.created_at))
        .limit(8)
        .all()
    )
    recent_users_out = [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "tier": u.tier,
            "credits": u.credits,
            "is_active": bool(u.is_active),
            "created_at": u.created_at,
        }
        for u in recent_users
    ]

    recent_payments = (
        db.query(Payment, User)
        .join(User, User.id == Payment.user_id)
        .order_by(desc(Payment.created_at))
        .limit(8)
        .all()
    )
    recent_payments_out = [
        {
            "id": p.id,
            "email": u.email,
            "amount": p.amount,
            "currency": p.currency,
            "plan_name": p.plan_name,
            "status": p.status,
            "created_at": p.created_at,
            "completed_at": p.completed_at,
        }
        for p, u in recent_payments
    ]

    recent_searches = (
        db.query(SearchLog)
        .order_by(desc(SearchLog.created_at))
        .limit(10)
        .all()
    )
    recent_searches_out = [
        {
            "id": s.id,
            "user_id": s.user_id,
            "search_type": s.search_type,
            "query": s.query,
            "file_name": s.file_name,
            "results_found": s.results_found,
            "is_successful": bool(s.is_successful),
            "providers_used": s.providers_used,
            "search_duration_ms": s.search_duration_ms,
            "credits_used": s.credits_used,
            "created_at": s.created_at,
        }
        for s in recent_searches
    ]

    return {
        "total_users": int(total_users),
        "active_users_5m": int(active_users_5m),
        "active_users_today": int(active_users_today),
        "searches_24h": int(searches_today),
        "revenue_total": float(revenue_total),
        "paying_users": int(paying_users),
        "recent_users": recent_users_out,
        "recent_payments": recent_payments_out,
        "recent_searches": recent_searches_out,
    }


@router.get("/users")
def admin_users(
    request: Request,
    q: str | None = None,
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _require_admin_key(request)

    query = db.query(User)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter((User.email.ilike(like)) | (User.username.ilike(like)))
    if status_filter == "active":
        query = query.filter(User.is_active.is_(True))
    if status_filter == "disabled":
        query = query.filter(User.is_active.is_(False))

    users = query.order_by(desc(User.created_at)).offset(offset).limit(min(limit, 200)).all()

    today = date.today()
    user_ids = [u.id for u in users]

    activity_rows = (
        db.query(ActivityDaily.user_id, func.sum(ActivityDaily.seconds).label("seconds"), func.max(ActivityDaily.last_seen_at).label("last_seen_at"))
        .filter(ActivityDaily.day == today)
        .filter(ActivityDaily.user_id.in_(user_ids))
        .group_by(ActivityDaily.user_id)
        .all()
    )
    activity_by_user: dict[int, dict[str, Any]] = {}
    for r in activity_rows:
        if r.user_id is None:
            continue
        activity_by_user[int(r.user_id)] = {"seconds_today": int(r.seconds or 0), "last_seen_at": r.last_seen_at}

    payment_rows = (
        db.query(Payment.user_id, func.coalesce(func.sum(Payment.amount), 0.0).label("total_paid"), func.max(Payment.completed_at).label("last_paid_at"))
        .filter(Payment.status == "completed")
        .filter(Payment.user_id.in_(user_ids))
        .group_by(Payment.user_id)
        .all()
    )
    paid_by_user: dict[int, dict[str, Any]] = {}
    for r in payment_rows:
        paid_by_user[int(r.user_id)] = {"total_paid": float(r.total_paid or 0.0), "last_paid_at": r.last_paid_at}

    out = []
    for u in users:
        a = activity_by_user.get(u.id, {})
        p = paid_by_user.get(u.id, {})
        out.append(
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "role": u.role,
                "tier": u.tier,
                "credits": u.credits,
                "is_active": bool(u.is_active),
                "referral_code": u.referral_code,
                "referred_by": u.referred_by,
                "referral_count": u.referral_count,
                "total_searches": u.total_searches,
                "successful_searches": u.successful_searches,
                "created_at": u.created_at,
                "last_search_at": u.last_search_at,
                "seconds_today": a.get("seconds_today", 0),
                "last_seen_at": a.get("last_seen_at"),
                "total_paid": p.get("total_paid", 0.0),
                "last_paid_at": p.get("last_paid_at"),
            }
        )
    return {"items": out}


@router.patch("/users/{user_id}")
def admin_update_user(user_id: int, request: Request, payload: dict[str, Any], db: Session = Depends(get_db)):
    _require_admin_key(request)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "credits" in payload:
        user.credits = int(payload["credits"])
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    if "tier" in payload:
        user.tier = str(payload["tier"])
    if "role" in payload:
        user.role = str(payload["role"])

    _audit(db=db, request=request, action="user.update", resource_type="user", resource_id=str(user.id), meta=payload)
    db.commit()
    db.refresh(user)
    return {"status": "ok"}


@router.get("/payments")
def admin_payments(request: Request, status_filter: str | None = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    _require_admin_key(request)
    q = db.query(Payment, User).join(User, User.id == Payment.user_id)
    if status_filter:
        q = q.filter(Payment.status == status_filter)
    rows = q.order_by(desc(Payment.created_at)).offset(offset).limit(min(limit, 200)).all()
    items = []
    for p, u in rows:
        items.append(
            {
                "id": p.id,
                "user_id": u.id,
                "email": u.email,
                "amount": p.amount,
                "currency": p.currency,
                "plan_name": p.plan_name,
                "status": p.status,
                "payment_method": p.payment_method,
                "transaction_id": p.transaction_id,
                "created_at": p.created_at,
                "completed_at": p.completed_at,
            }
        )
    return {"items": items}


@router.get("/bank-transfers")
def admin_bank_transfers(
    request: Request,
    status_filter: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    q = db.query(BankTransferRequest, User).join(User, User.id == BankTransferRequest.user_id)
    if status_filter:
        q = q.filter(BankTransferRequest.status == status_filter)
    rows = q.order_by(desc(BankTransferRequest.created_at)).offset(offset).limit(min(limit, 500)).all()
    items = []
    for r, u in rows:
        items.append(
            {
                "id": r.id,
                "user_id": r.user_id,
                "email": u.email,
                "username": u.username,
                "plan_id": r.plan_id,
                "plan_name": r.plan_name,
                "credits_requested": r.credits_requested,
                "amount": r.amount,
                "currency": r.currency,
                "status": r.status,
                "user_note": r.user_note,
                "admin_note": r.admin_note,
                "created_at": r.created_at,
                "reviewed_at": r.reviewed_at,
            }
        )
    return {"items": items}


@router.get("/guest-bank-inquiries")
def admin_guest_bank_inquiries(
    request: Request,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    rows = (
        db.query(GuestBankInquiry)
        .order_by(desc(GuestBankInquiry.created_at))
        .offset(offset)
        .limit(min(limit, 500))
        .all()
    )
    items = [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "phone": r.phone,
            "desired_plan": r.desired_plan,
            "desired_credits": r.desired_credits,
            "message": r.message,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in rows
    ]
    return {"items": items}


@router.post("/bank-transfers/{request_id}/approve")
def admin_approve_bank_transfer(
    request_id: int,
    request: Request,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    req = db.query(BankTransferRequest).filter(BankTransferRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    credits_awarded = 0
    plan_label = req.plan_name or req.plan_id or "Credit Topup"

    if req.plan_id:
        plan = next((p for p in PRICING_PLANS if p.get("id") == req.plan_id), None)
        if plan:
            if plan.get("id") == "unlimited":
                user.tier = "unlimited"
                user.credits = 999999
            else:
                user.tier = "premium"
                credits_to_add = int(plan.get("credits") or 0)
                if credits_to_add > 0:
                    CreditService.add_credits(user, db, credits_to_add, "bank_transfer_plan")
                    credits_awarded = credits_to_add
        elif req.credits_requested:
            CreditService.add_credits(user, db, req.credits_requested, "bank_transfer")
            credits_awarded = req.credits_requested
    elif req.credits_requested:
        CreditService.add_credits(user, db, req.credits_requested, "bank_transfer")
        credits_awarded = req.credits_requested

    req.status = "approved"
    req.reviewed_at = datetime.now(timezone.utc)
    req.admin_note = payload.get("admin_note") if payload else None

    payment = Payment(
        user_id=user.id,
        amount=req.amount,
        currency=req.currency,
        plan_name=str(plan_label),
        status="completed",
        payment_method="bank_transfer",
        completed_at=datetime.now(timezone.utc),
    )
    db.add(payment)

    message = (payload or {}).get("message") or (
        f"Havale ödemeniz onaylandı. {credits_awarded} kredi hesabınıza tanımlandı."
        if credits_awarded
        else f"Havale ödemeniz onaylandı. {plan_label} planı aktif edildi."
    )
    db.add(
        Notification(
            title="Ödeme Onaylandı",
            message=message,
            type=NotificationType.SUCCESS.value,
            target_audience="specific",
            target_user_id=user.id,
        )
    )

    _audit(
        db=db,
        request=request,
        action="bank_transfer.approve",
        resource_type="bank_transfer",
        resource_id=str(req.id),
        meta={"user_id": user.id, "plan_id": req.plan_id, "credits_awarded": credits_awarded},
    )

    db.commit()
    return {"status": "ok"}


@router.post("/bank-transfers/{request_id}/reject")
def admin_reject_bank_transfer(
    request_id: int,
    request: Request,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    req = db.query(BankTransferRequest).filter(BankTransferRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    note = (payload or {}).get("admin_note") or (payload or {}).get("message")
    if not note:
        raise HTTPException(status_code=400, detail="Rejection reason required")

    req.status = "rejected"
    req.reviewed_at = datetime.now(timezone.utc)
    req.admin_note = note

    payment = Payment(
        user_id=user.id,
        amount=req.amount,
        currency=req.currency,
        plan_name=str(req.plan_name or req.plan_id or "Credit Topup"),
        status="failed",
        payment_method="bank_transfer",
    )
    db.add(payment)

    db.add(
        Notification(
            title="Ödeme Reddedildi",
            message=str(note),
            type=NotificationType.ERROR.value,
            target_audience="specific",
            target_user_id=user.id,
        )
    )

    _audit(
        db=db,
        request=request,
        action="bank_transfer.reject",
        resource_type="bank_transfer",
        resource_id=str(req.id),
        meta={"user_id": user.id, "reason": note},
    )

    db.commit()
    return {"status": "ok"}


@router.get("/referrals")
def admin_referrals(request: Request, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    _require_admin_key(request)
    rows = (
        db.query(ReferralLog)
        .order_by(desc(ReferralLog.created_at))
        .offset(offset)
        .limit(min(limit, 500))
        .all()
    )
    items = []
    for r in rows:
        items.append(
            {
                "id": r.id,
                "referrer_user_id": int(r.referrer_user_id),
                "referrer_code": r.referrer_code,
                "referee_user_id": int(r.referee_user_id),
                "referee_email": r.referee_email,
                "reward_given": bool(r.reward_given),
                "credits_awarded": r.credits_awarded,
                "created_at": r.created_at,
            }
        )
    return {"items": items}


@router.get("/site-settings")
def admin_get_site_settings(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    rows = db.query(SiteSetting).all()
    out: dict[str, Any] = {}
    for r in rows:
        try:
            out[r.key] = json.loads(r.value_json)
        except Exception:
            out[r.key] = r.value_json
    return {"settings": out}


@router.post("/site-settings")
def admin_set_site_setting(request: Request, payload: dict[str, Any], db: Session = Depends(get_db)):
    _require_admin_key(request)
    if "key" not in payload:
        raise HTTPException(status_code=400, detail="Missing key")
    key = str(payload["key"]).strip()
    value = payload.get("value")
    value_json = json.dumps(value, ensure_ascii=False)
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if row:
        row.value_json = value_json
    else:
        row = SiteSetting(key=key, value_json=value_json)
        db.add(row)
    _audit(db=db, request=request, action="site_setting.set", resource_type="site_setting", resource_id=key, meta={"key": key, "value": value})
    db.commit()
    return {"status": "ok"}


@router.get("/blog-posts")
def admin_list_blog_posts(request: Request, locale: str | None = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    _require_admin_key(request)
    q = db.query(BlogPost)
    if locale:
        q = q.filter(BlogPost.locale == locale)
    rows = q.order_by(desc(BlogPost.updated_at)).offset(offset).limit(min(limit, 200)).all()
    items = []
    for p in rows:
        items.append(
            {
                "id": p.id,
                "locale": p.locale,
                "slug": p.slug,
                "title": p.title,
                "excerpt": p.excerpt,
                "cover_image_url": p.cover_image_url,
                "author_name": p.author_name,
                "is_published": p.is_published,
                "published_at": p.published_at,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
        )
    return {"items": items}


@router.get("/blog-posts/{post_id}")
def admin_get_blog_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    p = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "post": {
            "id": p.id,
            "locale": p.locale,
            "slug": p.slug,
            "title": p.title,
            "excerpt": p.excerpt,
            "content_html": p.content_html,
            "cover_image_url": p.cover_image_url,
            "author_name": p.author_name,
            "is_published": p.is_published,
            "published_at": p.published_at,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
    }


@router.post("/blog-posts")
def admin_create_blog_post(request: Request, payload: dict[str, Any], db: Session = Depends(get_db)):
    _require_admin_key(request)
    for k in ("locale", "slug", "title", "content_html"):
        if not payload.get(k):
            raise HTTPException(status_code=400, detail=f"Missing {k}")
    p = BlogPost(
        locale=str(payload["locale"]).strip(),
        slug=str(payload["slug"]).strip(),
        title=str(payload["title"]).strip(),
        excerpt=payload.get("excerpt"),
        content_html=str(payload["content_html"]),
        cover_image_url=payload.get("cover_image_url"),
        author_name=payload.get("author_name"),
        is_published=bool(payload.get("is_published", False)),
        published_at=datetime.now(timezone.utc) if payload.get("is_published") else None,
    )
    db.add(p)
    _audit(
        db=db,
        request=request,
        action="blog_post.create",
        resource_type="blog_post",
        resource_id=str(payload.get("slug") or ""),
        meta={"locale": payload.get("locale"), "slug": payload.get("slug"), "title": payload.get("title"), "is_published": bool(payload.get("is_published", False))},
    )
    db.commit()
    db.refresh(p)
    return {"id": p.id}


@router.put("/blog-posts/{post_id}")
def admin_update_blog_post(post_id: int, request: Request, payload: dict[str, Any], db: Session = Depends(get_db)):
    _require_admin_key(request)
    p = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ("locale", "slug", "title", "excerpt", "content_html", "cover_image_url", "author_name"):
        if field in payload:
            setattr(p, field, payload[field])
    if "is_published" in payload:
        p.is_published = bool(payload["is_published"])
        if p.is_published and not p.published_at:
            p.published_at = datetime.now(timezone.utc)
        if not p.is_published:
            p.published_at = None
    _audit(db=db, request=request, action="blog_post.update", resource_type="blog_post", resource_id=str(p.id), meta=payload)
    db.commit()
    return {"status": "ok"}


@router.delete("/blog-posts/{post_id}")
def admin_delete_blog_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    p = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    _audit(db=db, request=request, action="blog_post.delete", resource_type="blog_post", resource_id=str(p.id), meta={"slug": p.slug, "locale": p.locale, "title": p.title})
    db.delete(p)
    db.commit()
    return {"status": "ok"}


@router.post("/media/upload")
async def admin_upload_media(
    request: Request,
    file: UploadFile = File(...),
    folder: str = Form("admin"),
    db: Session = Depends(get_db),
):
    _require_admin_key(request)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    safe_folder = "".join([c for c in folder if c.isalnum() or c in ("-", "_")]).strip() or "admin"
    ext = Path(file.filename).suffix.lower()[:10]
    name = f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{os.urandom(6).hex()}{ext}"

    upload_root = (Path(__file__).resolve().parents[2] / settings.UPLOAD_DIR).resolve()
    target_dir = (upload_root / safe_folder).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = (target_dir / name).resolve()
    if upload_root not in target_path.parents:
        raise HTTPException(status_code=400, detail="Invalid folder")

    target_path.write_bytes(content)

    url = f"/uploads/{safe_folder}/{name}"
    asset = MediaAsset(
        filename=name,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        url=url,
    )
    db.add(asset)
    _audit(
        db=db,
        request=request,
        action="media.upload",
        resource_type="media",
        resource_id=name,
        meta={"content_type": file.content_type, "size_bytes": len(content), "folder": safe_folder},
    )
    db.commit()
    db.refresh(asset)

    return {"id": asset.id, "url": url, "filename": name}


@router.get("/audit")
def admin_audit(
    request: Request,
    q: str | None = None,
    action: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    query = db.query(AdminAuditLog)
    if action:
        query = query.filter(AdminAuditLog.action == action)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter((AdminAuditLog.actor_email.ilike(like)) | (AdminAuditLog.resource_id.ilike(like)) | (AdminAuditLog.action.ilike(like)))
    rows = query.order_by(desc(AdminAuditLog.created_at)).offset(offset).limit(min(limit, 500)).all()
    return {
        "items": [
            {
                "id": r.id,
                "action": r.action,
                "actor_email": r.actor_email,
                "actor_ip": r.actor_ip,
                "user_agent": r.user_agent,
                "trace_id": r.trace_id,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "meta_json": r.meta_json,
                "created_at": r.created_at,
            }
            for r in rows
        ]
    }


@router.get("/media")
def admin_list_media(request: Request, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    _require_admin_key(request)
    rows = db.query(MediaAsset).order_by(desc(MediaAsset.created_at)).offset(offset).limit(min(limit, 200)).all()
    return {
        "items": [
            {
                "id": m.id,
                "filename": m.filename,
                "content_type": m.content_type,
                "size_bytes": m.size_bytes,
                "url": m.url,
                "created_at": m.created_at,
            }
            for m in rows
        ]
    }


# --- Notifications ---

@router.get("/notifications")
def admin_list_notifications(request: Request, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    _require_admin_key(request)
    rows = db.query(Notification).order_by(desc(Notification.created_at)).offset(offset).limit(min(limit, 200)).all()
    return {
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "target_audience": n.target_audience,
                "created_at": n.created_at,
            }
            for n in rows
        ]
    }

@router.post("/notifications")
def admin_create_notification(request: Request, payload: dict[str, Any], db: Session = Depends(get_db)):
    _require_admin_key(request)
    if not payload.get("title") or not payload.get("message"):
        raise HTTPException(status_code=400, detail="Missing title or message")
    
    n = Notification(
        title=str(payload["title"]).strip(),
        message=str(payload["message"]).strip(),
        type=payload.get("type", "text"),
        media_url=payload.get("media_url"),
        target_audience=payload.get("target_audience", "all"),
        target_user_id=payload.get("target_user_id"),
    )
    db.add(n)
    
    _audit(
        db=db,
        request=request,
        action="notification.create",
        resource_type="notification",
        resource_id=str(n.title)[:50],
        meta={"audience": n.target_audience, "type": n.type}
    )
    
    db.commit()
    db.refresh(n)
    return {"id": n.id, "status": "sent"}


# --- Investigations ---

@router.get("/investigations")
def admin_list_investigations(
    request: Request,
    status_filter: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    q = db.query(InvestigationRequest)
    if status_filter:
        q = q.filter(InvestigationRequest.status == status_filter)
    rows = q.order_by(desc(InvestigationRequest.created_at)).offset(offset).limit(min(limit, 500)).all()
    items = []
    for r in rows:
        user_email = None
        if r.user_id:
            u = db.query(User).filter(User.id == r.user_id).first()
            user_email = u.email if u else None
        items.append(
            {
                "id": r.id,
                "user_id": r.user_id,
                "user_email": user_email,
                "guest_name": r.guest_name,
                "guest_email": r.guest_email,
                "guest_phone": r.guest_phone,
                "photo_urls": r.photo_urls,
                "country": r.country,
                "city": r.city,
                "detail": r.detail,
                "search_type": r.search_type,
                "amount": r.amount,
                "currency": r.currency,
                "status": r.status,
                "admin_note": r.admin_note,
                "created_at": r.created_at,
                "completed_at": r.completed_at,
            }
        )
    return {"items": items}


@router.get("/investigations/{inv_id}")
def admin_get_investigation(inv_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    r = db.query(InvestigationRequest).filter(InvestigationRequest.id == inv_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    user_email = None
    if r.user_id:
        u = db.query(User).filter(User.id == r.user_id).first()
        user_email = u.email if u else None
    return {
        "id": r.id,
        "user_id": r.user_id,
        "user_email": user_email,
        "guest_name": r.guest_name,
        "guest_email": r.guest_email,
        "guest_phone": r.guest_phone,
        "photo_urls": r.photo_urls,
        "country": r.country,
        "city": r.city,
        "detail": r.detail,
        "search_type": r.search_type,
        "amount": r.amount,
        "currency": r.currency,
        "status": r.status,
        "payment_method": r.payment_method,
        "result_json": r.result_json,
        "result_pdf_url": r.result_pdf_url,
        "result_summary": r.result_summary,
        "admin_note": r.admin_note,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
        "completed_at": r.completed_at,
    }


@router.put("/investigations/{inv_id}")
def admin_update_investigation(
    inv_id: int,
    request: Request,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    r = db.query(InvestigationRequest).filter(InvestigationRequest.id == inv_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")

    for field in ("status", "admin_note", "result_summary", "result_pdf_url", "result_json", "payment_method"):
        if field in payload:
            setattr(r, field, payload[field])

    if payload.get("status") == "completed" and not r.completed_at:
        r.completed_at = datetime.now(timezone.utc)

    _audit(
        db=db,
        request=request,
        action="investigation.update",
        resource_type="investigation",
        resource_id=str(inv_id),
        meta=payload,
    )
    db.commit()
    return {"status": "ok"}


# --- Blog Auto-Generation ---

@router.post("/blog/auto-generate")
async def admin_blog_auto_generate(request: Request, db: Session = Depends(get_db)):
    """Manually trigger blog auto-generation."""
    _require_admin_key(request)
    payload = await request.json()
    locale = str(payload.get("locale", "tr")).strip()[:5]
    count = min(int(payload.get("count", 5)), 20)

    from app.services.blog_generator import get_blog_generator
    generator = get_blog_generator()
    result = await generator.run_generation_cycle(db, locale=locale, count=count)

    _audit(db=db, request=request, action="blog.auto_generate", resource_type="blog", resource_id="auto",
           meta={"locale": locale, "count": count, "result": result})

    return {"status": "ok", **result}


@router.get("/blog/auto-status")
def admin_blog_auto_status(request: Request, db: Session = Depends(get_db)):
    """Get blog auto-generation status."""
    _require_admin_key(request)
    from app.core.config import settings as cfg

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(BlogPost).filter(
        BlogPost.author_name == "FaceSeek AI",
        BlogPost.created_at >= today_start,
    ).count()

    total_ai = db.query(BlogPost).filter(BlogPost.author_name == "FaceSeek AI").count()
    total_all = db.query(BlogPost).count()

    return {
        "enabled": bool(getattr(cfg, "BLOG_AUTO_ENABLED", True)),
        "daily_count": int(getattr(cfg, "BLOG_AUTO_COUNT", 5)),
        "schedule": str(getattr(cfg, "BLOG_AUTO_SCHEDULE", "03:00")),
        "locales": str(getattr(cfg, "BLOG_AUTO_LOCALES", "tr,en")),
        "today_generated": today_count,
        "total_ai_posts": total_ai,
        "total_posts": total_all,
    }


@router.get("/blog/seo-keywords")
def admin_get_seo_keywords(request: Request, locale: str = "tr", db: Session = Depends(get_db)):
    """Get SEO keywords for blog generation."""
    _require_admin_key(request)
    from app.services.blog_generator import get_blog_generator
    generator = get_blog_generator()
    keywords = generator.get_seo_keywords(db, locale)
    return {"locale": locale, "keywords": keywords}


@router.put("/blog/seo-keywords")
async def admin_update_seo_keywords(request: Request, db: Session = Depends(get_db)):
    """Update SEO keywords for blog generation."""
    _require_admin_key(request)
    payload = await request.json()
    locale = str(payload.get("locale", "tr")).strip()[:5]
    keywords = payload.get("keywords", [])
    if not isinstance(keywords, list):
        raise HTTPException(status_code=400, detail="keywords must be a list")

    from app.services.blog_generator import get_blog_generator
    generator = get_blog_generator()
    generator.save_seo_keywords(db, locale, keywords)

    _audit(db=db, request=request, action="blog.seo_keywords.update", resource_type="blog",
           resource_id=locale, meta={"count": len(keywords)})

    return {"status": "ok", "locale": locale, "count": len(keywords)}
