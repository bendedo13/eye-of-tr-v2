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
from app.models.cms import SiteSetting
from app.models.bank_transfer import BankTransferRequest

router = APIRouter(prefix="/api/pricing", tags=["pricing"])
logger = logging.getLogger(__name__)


import httpx
from app.core.config import settings

# Pricing plans - SIMPLIFIED: Only Alan Search Monthly + Credit Pack
PRICING_PLANS = [
    {
        "id": "free",
        "name": {"tr": "Ücretsiz", "en": "Free Trial"},
        "price_try": 0,
        "price_usd": 0,
        "credits": 1,
        "search_normal": 1,
        "search_detailed": 0,
        "search_location": 1,
        "daily_limit": 1,
        "billing_period": "once",
        "features": {
            "tr": ["1 ücretsiz Alan Search", "1 ücretsiz Konum Arama", "Temel sonuçlar"],
            "en": ["1 free Alan Search", "1 free Location Search", "Basic results"]
        },
        "recommended": False,
    },
    {
        "id": "alan_search_monthly",
        "name": {"tr": "Alan Search Aylık", "en": "Alan Search Monthly"},
        "price_try": 299,
        "price_usd": 14.99,
        "credits": 999999,
        "search_normal": 999999,
        "search_detailed": 0,
        "search_location": 999999,
        "daily_limit": 50,
        "billing_period": "monthly",
        "tier": "alan_search",
        "features": {
            "tr": ["Sınırsız Alan Search", "Sınırsız Konum Arama", "Ad soyad ile kişi bulma", "Öncelikli destek", "Sonuçlarda blur yok"],
            "en": ["Unlimited Alan Search", "Unlimited Location Search", "Find people by name", "Priority support", "No blur on results"]
        },
        "recommended": True,
        "variant_id_try": "1272158",
        "variant_id_usd": "1272158",
    },
    {
        "id": "credit_pack",
        "name": {"tr": "Kredi Paketi", "en": "Credit Pack"},
        "price_try": 100,
        "price_usd": 5.00,
        "credits": 1,
        "search_normal": 1,
        "search_detailed": 0,
        "search_location": 1,
        "daily_limit": 0,
        "billing_period": "once",
        "is_one_time": True,
        "features": {
            "tr": ["1 kredi", "Alan Search veya Konum Arama", "Abonelik gerektirmez", "Tek seferlik ödeme"],
            "en": ["1 credit", "Alan Search or Location Search", "No subscription needed", "One-time payment"]
        },
        "recommended": False,
        "variant_id_try": "1272158",
        "variant_id_usd": "1272158",
    },
]


def _resolve_plan_for_locale(plan: dict, locale: str = "tr", currency: str = "TRY") -> dict:
    """Resolve plan name/features/price for a specific locale."""
    name = plan["name"]
    features = plan.get("features", {})
    resolved_name = name.get(locale, name.get("en", "Plan")) if isinstance(name, dict) else name
    resolved_features = features.get(locale, features.get("en", [])) if isinstance(features, dict) else features
    price = plan.get("price_try", 0) if currency == "TRY" else plan.get("price_usd", 0)
    variant_id = plan.get("variant_id_try") if currency == "TRY" else plan.get("variant_id_usd")

    return {
        "id": plan["id"],
        "name": resolved_name,
        "price": price,
        "currency": currency,
        "credits": plan.get("credits", 0),
        "search_normal": plan.get("search_normal", 0),
        "search_detailed": plan.get("search_detailed", 0),
        "search_location": plan.get("search_location", 0),
        "daily_limit": plan.get("daily_limit", 0),
        "billing_period": plan.get("billing_period", "monthly"),
        "tier": plan.get("tier", "free"),
        "features": resolved_features,
        "recommended": plan.get("recommended", False),
        "is_one_time": plan.get("is_one_time", False),
        "discount_pct": plan.get("discount_pct", 0),
        "variant_id": variant_id,
    }


class SubscribeRequest(BaseModel):
    plan_id: str
    currency: str = "TRY"


class BankTransferRequestIn(BaseModel):
    plan_id: str | None = None
    credits: int | None = None
    amount: float
    currency: str = "TRY"
    note: str | None = None


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

    resolved = [_resolve_plan_for_locale(p, locale, cur) for p in PRICING_PLANS]
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

    for p in PRICING_PLANS:
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
    db: Session = Depends(get_db)
):
    """LemonSqueezy Checkout URL oluştur"""
    plan = next((p for p in PRICING_PLANS if p["id"] == data.plan_id), None)

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if plan["id"] == "free":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Free plan cannot be purchased")

    cur = data.currency.upper() if data.currency else "TRY"
    variant_id = plan.get("variant_id_try") if cur == "TRY" else plan.get("variant_id_usd")
    if not variant_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Variant ID not configured")

    if not user.email or "@" not in user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz email adresi. Lütfen profilinizden geçerli bir email adresi ayarlayın."
        )

    price = plan.get("price_try", 0) if cur == "TRY" else plan.get("price_usd", 0)
    plan_name = plan["name"]
    if isinstance(plan_name, dict):
        plan_name = plan_name.get("tr", plan_name.get("en", data.plan_id))

    payment = Payment(
        user_id=user.id,
        amount=price,
        currency=cur,
        plan_name=str(plan_name),
        status="pending",
        payment_method="lemonsqueezy"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    logger.info(f"LemonSqueezy checkout: user={user.email}, plan={data.plan_id}, variant={variant_id}")

    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "data": {
                    "type": "checkouts",
                    "attributes": {
                        "checkout_data": {
                            "custom": {
                                "user_id": str(user.id),
                                "payment_id": str(payment.id),
                                "plan_id": str(plan["id"])
                            },
                            "email": user.email,
                            "name": user.username
                        }
                    },
                    "relationships": {
                        "store": {
                            "data": {
                                "type": "stores",
                                "id": str(settings.LEMONSQUEEZY_STORE_ID)
                            }
                        },
                        "variant": {
                            "data": {
                                "type": "variants",
                                "id": str(variant_id)
                            }
                        }
                    }
                }
            }

            resp = await client.post(
                "https://api.lemonsqueezy.com/v1/checkouts",
                headers={
                    "Authorization": f"Bearer {settings.LEMONSQUEEZY_API_KEY}",
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json"
                },
                json=payload
            )

            if resp.status_code != 201:
                # API key eksikse özel mesaj
                if settings.LEMONSQUEEZY_API_KEY is None:
                    logger.error("LemonSqueezy API key not configured")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Payment service not configured. Please contact admin."
                    )

                logger.error(f"LemonSqueezy API error ({resp.status_code}): {resp.text}")
                raise HTTPException(
                    status_code=resp.status_code if resp.status_code >= 400 else status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Payment service error. Please try again."
                )

            checkout_data = resp.json()
            checkout_url = checkout_data["data"]["attributes"]["url"]

            return {
                "status": "success",
                "payment_id": payment.id,
                "checkout_url": checkout_url
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment service error"
        )


@router.post("/bank-transfer")
def create_bank_transfer_request(
    data: BankTransferRequestIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Havale/EFT/FAST ödeme talebi oluşturur (manuel onay)."""
    if not data.plan_id and not data.credits:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan veya kredi seçimi gerekli")
    if data.plan_id and data.credits:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan ve kredi aynı anda seçilemez")
    if data.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz tutar")

    plan_id = (data.plan_id or "").strip() or None
    plan_name = None
    credits_requested = None

    if plan_id:
        plan = next((p for p in PRICING_PLANS if p.get("id") == plan_id), None)
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
        name = plan.get("name", plan_id)
        plan_name = name.get("tr", name.get("en", plan_id)) if isinstance(name, dict) else name
        credits_requested = int(plan.get("credits") or 0) or None
    else:
        credits = int(data.credits or 0)
        if credits <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz kredi miktarı")
        credits_requested = credits
        plan_name = "Credit Topup"

    req = BankTransferRequest(
        user_id=user.id,
        plan_id=plan_id,
        plan_name=str(plan_name) if plan_name else None,
        credits_requested=credits_requested,
        amount=float(data.amount),
        currency=(data.currency or "TRY"),
        status="pending",
        user_note=(data.note or None),
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    logger.info(f"Bank transfer requested: user={user.email}, plan_id={plan_id}, credits={credits_requested}, amount={data.amount}")

    return {"status": "ok", "request_id": req.id}


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

    plan = next((p for p in PRICING_PLANS if p.get("id") == payment.plan_name or
                 (isinstance(p.get("name"), dict) and payment.plan_name in p["name"].values())), None)

    if plan:
        tier = plan.get("tier", "free")
        if tier == "unlimited" or plan["id"].startswith("unlimited"):
            user.tier = "unlimited"
            user.credits = 999999
        elif tier == "pro" or plan["id"].startswith("pro"):
            user.tier = "pro"
            user.credits += plan.get("credits", 0)
        elif tier == "basic" or plan["id"].startswith("basic"):
            user.tier = "basic"
            user.credits += plan.get("credits", 0)
        else:
            user.credits += plan.get("credits", 0)

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
