"""Pricing and subscription endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, Payment
from app.services.pricing_service import PricingService

router = APIRouter(prefix="/api/pricing", tags=["pricing"])
logger = logging.getLogger(__name__)


# Simplified pricing: monthly, yearly, one-time credits.
PRICING_PLANS = [
    {
        "id": "basic_monthly",
        "name": {"tr": "Basit Aylık", "en": "Basic Monthly"},
        "price_try": 299,
        "price_usd": 14.99,
        "credits": 100,
        "billing_period": "monthly",
        "tier": "basic",
        "features": {
            "tr": ["Tüm özellikler", "Bulanıksız sonuçlar", "Öncelikli destek"],
            "en": ["All features", "No blur", "Priority support"],
        },
        "recommended": True,
        "shopify_url": "",
    },
    {
        "id": "basic_yearly",
        "name": {"tr": "Basit Yıllık", "en": "Basic Yearly"},
        "price_try": 2990,
        "price_usd": 149.99,
        "credits": 1200,
        "billing_period": "yearly",
        "tier": "basic",
        "features": {
            "tr": ["Tüm özellikler", "Bulanıksız sonuçlar", "Öncelikli destek"],
            "en": ["All features", "No blur", "Priority support"],
        },
        "recommended": False,
        "shopify_url": "",
    },
    {
        "id": "credit_pack",
        "name": {"tr": "Kredi Satın Alma", "en": "Credit Purchase"},
        "price_try": 59.99,
        "price_usd": 2.99,
        "credits": 10,
        "billing_period": "once",
        "is_one_time": True,
        "tier": "credit",
        "features": {
            "tr": ["Abonelik gerektirmez", "İstediğin zaman kullan", "Tek seferlik ödeme"],
            "en": ["No subscription needed", "Use anytime", "One-time payment"],
        },
        "recommended": False,
        "shopify_url": "",
    },
]


def _resolve_plan_for_locale(plan: dict, locale: str = "tr", currency: str = "TRY") -> dict:
    """Resolve plan name/features/price for a specific locale."""
    safe_locale = "tr" if locale == "tr" else "en"
    name = plan["name"]
    features = plan.get("features", {})
    resolved_name = name.get(safe_locale, name.get("en", "Plan")) if isinstance(name, dict) else name
    resolved_features = features.get(safe_locale, features.get("en", [])) if isinstance(features, dict) else features
    price = plan.get("price_try", 0) if currency == "TRY" else plan.get("price_usd", 0)

    return {
        "id": plan["id"],
        "name": resolved_name,
        "price": price,
        "currency": currency,
        "credits": plan.get("credits", 0),
        "billing_period": plan.get("billing_period", "monthly"),
        "tier": plan.get("tier", "free"),
        "features": resolved_features,
        "recommended": plan.get("recommended", False),
        "is_one_time": plan.get("is_one_time", False),
        "discount_pct": plan.get("discount_pct", 0),
        "shopify_url": plan.get("shopify_url", ""),
    }


class SubscribeRequest(BaseModel):
    plan_id: str
    currency: str = "TRY"


@router.get("/plans")
def get_pricing_plans(
    locale: str = Query(default="tr", max_length=5),
    currency: str = Query(default="TRY", max_length=5),
    db: Session = Depends(get_db),
):
    """All pricing plans (PUBLIC) — locale-aware."""
    cur = currency.upper()
    if cur not in ("TRY", "USD"):
        cur = "TRY"

    # Use PricingService to get plans with database overrides
    plans = PricingService.get_all_plans(db)
    resolved = [_resolve_plan_for_locale(p, locale, cur) for p in plans]
    return {"plans": resolved, "currency": cur}


@router.get("/plans-grouped")
def get_pricing_plans_grouped(
    locale: str = Query(default="tr", max_length=5),
    currency: str = Query(default="TRY", max_length=5),
    db: Session = Depends(get_db),
):
    """Plans grouped by billing period for frontend toggle."""
    cur = currency.upper()
    if cur not in ("TRY", "USD"):
        cur = "TRY"

    monthly = []
    yearly = []
    one_time = []

    # Use PricingService to get plans with database overrides
    plans = PricingService.get_all_plans(db)
    
    for p in plans:
        resolved = _resolve_plan_for_locale(p, locale, cur)
        period = p.get("billing_period", "monthly")
        if p["id"] == "free":
            continue
        elif p.get("is_one_time"):
            one_time.append(resolved)
        elif period == "yearly":
            yearly.append(resolved)
        else:
            monthly.append(resolved)

    return {
        "monthly": monthly,
        "yearly": yearly,
        "one_time": one_time,
        "currency": cur,
    }


@router.post("/subscribe")
async def subscribe_to_plan(
    data: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Legacy abonelik endpointi — artık sadece plan doğrulama yapar."""
    plan = PricingService.get_plan(data.plan_id, db)

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if not user.email or "@" not in user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz email adresi. Lütfen profilinizden geçerli bir email adresi ayarlayın.",
        )

    cur = data.currency.upper() if data.currency else "TRY"
    price = plan.get("price_try", 0) if cur == "TRY" else plan.get("price_usd", 0)

    logger.info(f"Subscription init (Shopify handled on frontend): user={user.email}, plan={data.plan_id}, price={price} {cur}")

    return {
        "status": "ok",
        "plan_id": data.plan_id,
        "currency": cur,
        "amount": price,
        "message": "Ödeme Shopify üzerinden tamamlanacaktır.",
    }


@router.post("/confirm-payment/{payment_id}")
def confirm_payment(
    payment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ödeme onaylama (webhook veya manuel)"""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == user.id
    ).first()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already completed")

    payment.status = "completed"
    from datetime import datetime
    payment.completed_at = datetime.utcnow()

    plan = PricingService.get_plan(payment.plan_name, db)

    if plan:
        credits_to_add = int(plan.get("credits", 0) or 0)
        if credits_to_add:
            user.credits += credits_to_add
        if not plan.get("is_one_time"):
            user.tier = "basic"

    db.commit()

    logger.info(f"Payment confirmed: user={user.email}, plan={payment.plan_name}, new_tier={user.tier}")

    return {
        "status": "success",
        "message": "Ödeme başarıyla tamamlandı!",
        "user": {
            "tier": user.tier,
            "credits": user.credits
        }
    }


@router.get("/subscription")
def get_current_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mevcut abonelik bilgisi"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.is_active == True
    ).first()

    return {
        "tier": user.tier,
        "credits": user.credits,
        "subscription": {
            "plan_name": subscription.plan_name if subscription else "Free",
            "is_active": subscription.is_active if subscription else False,
            "start_date": subscription.start_date.isoformat() if subscription and subscription.start_date else None,
            "end_date": subscription.end_date.isoformat() if subscription and subscription.end_date else None
        } if subscription else None
    }
