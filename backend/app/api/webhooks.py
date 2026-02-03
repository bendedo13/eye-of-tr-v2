from fastapi import APIRouter, Request, HTTPException, Header, Depends
from sqlalchemy.orm import Session
import hmac
import hashlib
import json
import logging
from datetime import datetime

from app.db.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.subscription import Subscription, Payment
from app.api.pricing import PRICING_PLANS

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)

@router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    LemonSqueezy Webhook handler
    """
    if not x_signature:
        logger.error("Webhook missing X-Signature header")
        raise HTTPException(status_code=401, detail="Missing signature")

    # Read payload
    payload = await request.body()
    
    # Verify signature
    secret = settings.LEMONSQUEEZY_WEBHOOK_SECRET.encode('utf-8')
    expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(x_signature, expected_signature):
        logger.error("Webhook signature mismatch")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse JSON
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        logger.error("Failed to parse webhook JSON")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_name = data.get("meta", {}).get("event_name")
    logger.info(f"Received LemonSqueezy event: {event_name}")

    if event_name in ["order_created", "subscription_created"]:
        attributes = data.get("data", {}).get("attributes", {})
        custom_data = data.get("meta", {}).get("custom_data", {})
        
        user_id = custom_data.get("user_id")
        payment_id = custom_data.get("payment_id")
        plan_id = custom_data.get("plan_id")
        
        if not user_id or not payment_id:
            logger.error(f"Webhook missing metadata: user_id={user_id}, payment_id={payment_id}")
            return {"status": "error", "message": "Missing metadata"}

        # Find user and payment
        user = db.query(User).filter(User.id == int(user_id)).first()
        payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
        
        if not user or not payment:
            logger.error(f"User or Payment not found for webhook: user={user_id}, payment={payment_id}")
            return {"status": "error", "message": "Record not found"}

        if payment.status == "completed":
            logger.info(f"Payment {payment_id} already completed, skipping.")
            return {"status": "success", "already_processed": True}

        # Update Payment status
        payment.status = "completed"
        payment.completed_at = datetime.utcnow()
        payment.transaction_id = str(data.get("data", {}).get("id"))
        
        # Update User Tier and Credits
        plan = next((p for p in PRICING_PLANS if p["id"] == plan_id), None)
        if plan:
            if plan["id"] == "unlimited":
                user.tier = "unlimited"
                user.credits = 999999
            else:
                user.tier = "premium"
                user.credits += plan.get("credits", 0)
        
        # Log to Subscription table
        subscription = Subscription(
            user_id=user.id,
            plan_name=plan["name"] if plan else plan_id,
            plan_price=payment.amount,
            is_active=True,
            start_date=datetime.utcnow()
        )
        db.add(subscription)
        
        db.commit()
        logger.info(f"✅ Webhook processed: Payment {payment.id} completed. User {user.email} updated to {user.tier}.")
    
    return {"status": "success"}
