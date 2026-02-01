"""Credit management service"""
import logging
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import User

logger = logging.getLogger(__name__)


class CreditService:
    """Kredi yönetim servisi"""
    
    @staticmethod
    def has_credits(user: User) -> bool:
        """Kullanıcının kredisi var mı?"""
        return user.credits > 0 or user.tier in ["premium", "unlimited"]
    
    @staticmethod
    def consume_credit(user: User, db: Session, amount: int = 1) -> bool:
        """
        Kredi tüket
        Returns: True if successful, False if insufficient credits
        """
        # Unlimited tier kredisi tüketmez
        if user.tier == "unlimited":
            logger.info(f"User {user.email} (unlimited tier) - no credit consumed")
            return True
        
        # Kredi kontrolü
        if user.credits < amount:
            logger.warning(f"User {user.email} - insufficient credits ({user.credits} < {amount})")
            return False
        
        # Kredi tüket
        user.credits -= amount
        db.commit()
        db.refresh(user)
        
        logger.info(f"User {user.email} - consumed {amount} credit(s), remaining: {user.credits}")
        return True
    
    @staticmethod
    def add_credits(user: User, db: Session, amount: int, reason: str = "manual") -> None:
        """Kredi ekle"""
        user.credits += amount
        db.commit()
        db.refresh(user)
        
        logger.info(f"User {user.email} - added {amount} credit(s), reason: {reason}, total: {user.credits}")
    
    @staticmethod
    def award_referral_credit(user: User, db: Session) -> bool:
        """
        3 referral = 1 ücretsiz kredi
        Returns: True if credit awarded
        """
        # Her 3 referral için 1 kredi ver
        credits_to_award = user.referral_count // 3
        
        if credits_to_award > 0:
            # Daha önce verilmemiş kredileri ver
            # Not: Gerçek üretimde, awarded_referral_credits alanı eklenebilir
            CreditService.add_credits(user, db, credits_to_award, "referral_reward")
            logger.info(f"User {user.email} - awarded {credits_to_award} credit(s) for {user.referral_count} referrals")
            return True
        
        return False
    
    @staticmethod
    def get_credit_info(user: User) -> dict:
        """Kullanıcının kredi durumu"""
        return {
            "credits": user.credits,
            "tier": user.tier,
            "has_credits": CreditService.has_credits(user),
            "is_unlimited": user.tier == "unlimited"
        }
