"""Credit management service"""
import logging
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import User, UserProfile

logger = logging.getLogger(__name__)


class CreditService:
    """Kredi yönetim servisi"""
    
    @staticmethod
    def has_credits(user: User) -> bool:
        """Kullanıcının kredisi var mı?"""
        return user.credits > 0
    
    @staticmethod
    def consume_credit(user: User, db: Session, amount: int = 1) -> bool:
        """
        Kredi tüket
        Returns: True if successful, False if insufficient credits
        """
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
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if profile and profile.credit_limit is not None:
            user.credits = min(int(user.credits), int(profile.credit_limit))
        db.commit()
        db.refresh(user)
        
        logger.info(f"User {user.email} - added {amount} credit(s), reason: {reason}, total: {user.credits}")
    
    @staticmethod
    def award_referral_credit(user: User, db: Session) -> bool:
        """
        3 referral = 1 detaylı + 2 normal arama = 4 kredi
        Returns: True if credit awarded
        """
        credits_to_award = (user.referral_count // 3) * 4

        if credits_to_award > 0:
            CreditService.add_credits(user, db, credits_to_award, "referral_reward")
            logger.info(f"User {user.email} - awarded {credits_to_award} credit(s) for {user.referral_count} referrals")
            return True
        
        return False
    
    @staticmethod
    def get_credit_info(user: User) -> dict:
        """Kullanıcının kredi durumu"""
        return {
            "credits": user.credits,
            "alan_search_credits": user.alan_search_credits,
            "location_search_credits": user.location_search_credits,
            "tier": user.tier,
            "has_credits": CreditService.has_credits(user)
        }
