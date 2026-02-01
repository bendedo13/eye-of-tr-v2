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

router = APIRouter(prefix="/api/pricing", tags=["pricing"])
logger = logging.getLogger(__name__)


# Pricing plans
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
        "recommended": True
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
        "recommended": False
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
        "lifetime": True
    }
]


class SubscribeRequest(BaseModel):
    plan_id: str
    payment_method: str = "credit_card"


@router.get("/plans")
def get_pricing_plans():
    """Tüm fiyatlandırma planları (PUBLIC)"""
    return {
        "plans": PRICING_PLANS,
        "currency": "TRY"
    }


@router.post("/subscribe")
def subscribe_to_plan(
    data: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Plana abone ol (ödeme işlemi)
    NOT: Gerçek üretimde ödeme gateway'i entegre edilmeli
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
    
    # Ödeme kaydı oluştur (pending)
    payment = Payment(
        user_id=user.id,
        amount=plan["price"],
        currency=plan["currency"],
        plan_name=plan["name"],
        status="pending",
        payment_method=data.payment_method
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    logger.info(f"Payment initiated: user={user.email}, plan={plan['name']}, amount={plan['price']}")
    
    # NOT: Gerçek ödeme işlemi burada yapılmalı (Stripe, PayTR, vb.)
    # Şimdilik demo için direkt başarılı sayıyoruz
    
    return {
        "status": "pending",
        "payment_id": payment.id,
        "message": "Ödeme işlemi başlatıldı. Gerçek ödeme gateway'i entegre edilmeli.",
        "redirect_url": f"/payment/confirm/{payment.id}"
    }


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
