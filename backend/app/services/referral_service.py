"""Referral system service"""
import logging
from sqlalchemy.orm import Session
from typing import Optional

from app.models.user import User
from app.models.analytics import ReferralLog
from app.services.credit_service import CreditService

logger = logging.getLogger(__name__)


class ReferralService:
    """Referans sistemi servisi"""
    
    @staticmethod
    def process_referral(new_user: User, referral_code: Optional[str], db: Session) -> bool:
        """
        Yeni kullanıcı kaydında referral işle
        Returns: True if referral processed successfully
        """
        if not referral_code:
            logger.info(f"New user {new_user.email} - no referral code")
            return False
        
        # Referrer'ı bul
        referrer = db.query(User).filter(User.referral_code == referral_code).first()
        
        if not referrer:
            logger.warning(f"Invalid referral code: {referral_code}")
            return False
        
        # Kendi kendine referral yapamaz
        if referrer.id == new_user.id:
            logger.warning(f"User {new_user.email} - self-referral not allowed")
            return False
        
        # Referral kaydı oluştur
        new_user.referred_by = referral_code
        referrer.referral_count += 1
        
        referral_log = ReferralLog(
            referrer_user_id=referrer.id,
            referrer_code=referral_code,
            referee_user_id=new_user.id,
            referee_email=new_user.email,
            reward_given=False
        )
        
        db.add(referral_log)
        db.commit()
        
        logger.info(f"Referral processed: {referrer.email} referred {new_user.email}")
        
        # 3 referral = 1 detaylı + 2 normal arama = 4 kredi
        if referrer.referral_count % 3 == 0:
            CreditService.add_credits(referrer, db, 4, "referral_reward")

            referral_log.reward_given = True
            referral_log.credits_awarded = 4
            db.commit()

            logger.info(f"Referral reward: {referrer.email} earned 4 credits (total referrals: {referrer.referral_count})")
        
        return True
    
    @staticmethod
    def get_referral_stats(user: User, db: Session) -> dict:
        """Kullanıcının referral istatistikleri"""
        
        # Toplam referral sayısı
        total_referrals = user.referral_count
        
        # Kazanılan toplam kredi
        total_credits_earned = db.query(ReferralLog).filter(
            ReferralLog.referrer_user_id == user.id,
            ReferralLog.reward_given == True
        ).count()
        
        # Bir sonraki krediye kalan referral sayısı
        next_credit_in = 3 - (total_referrals % 3)
        
        # Son referral'lar
        recent_referrals = db.query(ReferralLog).filter(
            ReferralLog.referrer_user_id == user.id
        ).order_by(ReferralLog.created_at.desc()).limit(10).all()
        
        return {
            "referral_code": user.referral_code,
            "total_referrals": total_referrals,
            "total_credits_earned": total_credits_earned,
            "next_credit_in": next_credit_in if next_credit_in < 3 else 0,
            "recent_referrals": [
                {
                    "email": r.referee_email,
                    "date": r.created_at.isoformat() if r.created_at else None,
                    "reward_given": r.reward_given
                }
                for r in recent_referrals
            ]
        }
    
    @staticmethod
    def get_referral_url(user: User, base_url: str = "https://faceseek.com") -> str:
        """Referral URL oluştur"""
        return f"{base_url}/register?ref={user.referral_code}"
