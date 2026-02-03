"""Pricing and subscription endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import logging

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, Payment
from app.models.cms import SiteSetting

router = APIRouter(prefix="/api/pricing", tags=["pricing"])
logger = logging.getLogger(__name__)


import httpx
from app.core.config import settings

# Pricing plans mapping to LemonSqueezy Variant IDs
PLAN_VARIANTS = {
    "premium_monthly": "1272158",  # PLAN 1
    "premium_yearly": "1272167",   # PLAN 2 - Pro
    "unlimited": "1272174"         # PLAN 3 - Kurumsal
}

# Pricing plans (Sync with LS)
PRICING_PLANS = [
    {
        "id": "free",
        "name": "Free Trial",
        "price": 0,
        "currency": "TRY",
        "credits": 1,
        "features": [
            "1 ücretsiz arama",
            "Temel sonuçlar",
            "Sınırlı erişim"
        ],
        "recommended": False
    },
    {
        "id": "premium_monthly",
        "name": "Premium Aylık",
        "price": 299.99,
        "currency": "TRY",
        "credits": 50,
        "features": [
            "50 arama kredisi/ay",
            "Tüm özellikler",
            "Öncelikli destek",
            "Blur yok"
        ],
        "recommended": True,
        "variant_id": PLAN_VARIANTS["premium_monthly"]
    },
    {
        "id": "premium_yearly",
        "name": "Premium Yıllık",
        "price": 2999.99,
        "currency": "TRY",
        "credits": 600,
        "features": [
            "600 arama kredisi/yıl",
            "Tüm özellikler",
            "VIP destek",
            "Blur yok",
            "%17 indirim"
        ],
        "recommended": False,
        "variant_id": PLAN_VARIANTS["premium_yearly"]
    },
    {
        "id": "unlimited",
        "name": "Sınırsız Kullanım",
        "price": 20000.00,
        "currency": "TRY",
        "credits": 999999,
        "features": [
            "Sınırsız arama",
            "Tüm özellikler",
            "7/24 özel destek",
            "API erişimi",
            "Ticari kullanım",
            "Özel entegrasyon"
        ],
        "recommended": False,
        "variant_id": PLAN_VARIANTS["unlimited"]
    }
]


class SubscribeRequest(BaseModel):
    plan_id: str


@router.get("/plans")
def get_pricing_plans(db: Session = Depends(get_db)):
    """Tüm fiyatlandırma planları (PUBLIC)"""
    plans = PRICING_PLANS
    currency = "TRY"
    row = db.query(SiteSetting).filter(SiteSetting.key == "pricing.plans").first()
    if row:
        try:
            plans = __import__("json").loads(row.value_json)
        except Exception:
            plans = PRICING_PLANS
    row_cur = db.query(SiteSetting).filter(SiteSetting.key == "pricing.currency").first()
    if row_cur:
        try:
            currency = str(__import__("json").loads(row_cur.value_json))
        except Exception:
            currency = "TRY"
    return {
        "plans": plans,
        "currency": currency
    }


@router.post("/subscribe")
async def subscribe_to_plan(
    data: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    LemonSqueezy Checkout URL oluştur
    """
    # Plan kontrolü
    plan = next((p for p in PRICING_PLANS if p["id"] == data.plan_id), None)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    if plan["id"] == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free plan cannot be purchased"
        )

    variant_id = plan.get("variant_id")
    if not variant_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Variant ID not configured for this plan"
        )

    # Email kontrolü (LemonSqueezy için gerekli)
    if not user.email or "@" not in user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz email adresi. Lütfen profilinizden geçerli bir email adresi ayarlayın."
        )

    # Ödeme kaydı oluştur (pending)
    payment = Payment(
        user_id=user.id,
        amount=plan["price"],
        currency=plan["currency"],
        plan_name=plan["name"],
        status="pending",
        payment_method="lemonsqueezy"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    logger.info(f"LemonSqueezy checkout requested: user={user.email}, plan={plan['name']}, variant={variant_id}")
    
    # LemonSqueezy API Call to create checkout
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
            
            logger.info(f"LemonSqueezy Request Payload: {payload}")
            
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
                logger.error(f"LemonSqueezy API error ({resp.status_code}): {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Payment service error: {resp.text}"
                )
            
            checkout_data = resp.json()
            checkout_url = checkout_data["data"]["attributes"]["url"]
            
            return {
                "status": "success",
                "payment_id": payment.id,
                "checkout_url": checkout_url
            }

    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment service error"
        )


@router.post("/confirm-payment/{payment_id}")
def confirm_payment(
    payment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ödeme onaylama (webhook veya manuel)
    Gerçek üretimde ödeme gateway'inden callback gelecek
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already completed"
        )
    
    # Ödeme durumunu güncelle
    payment.status = "completed"
    from datetime import datetime
    payment.completed_at = datetime.utcnow()
    
    # Kullanıcıya kredi ekle ve tier güncelle
    plan = next((p for p in PRICING_PLANS if p["name"] == payment.plan_name), None)
    
    if plan:
        if plan["id"] == "unlimited":
            user.tier = "unlimited"
            user.credits = 999999  # Sınırsız
        else:
            user.tier = "premium"
            user.credits += plan["credits"]
    
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
