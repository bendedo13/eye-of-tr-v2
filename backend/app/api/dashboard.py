"""Dashboard and user statistics endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.credit_service import CreditService
from app.services.referral_service import ReferralService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcı dashboard istatistikleri
    - Kredi bilgisi
    - Arama istatistikleri
    - Referral bilgisi
    """
    # Kredi bilgisi
    credit_info = CreditService.get_credit_info(user)
    
    # Arama istatistikleri
    search_stats = AnalyticsService.get_user_stats(db, user.id)
    
    # Referral istatistikleri
    referral_stats = ReferralService.get_referral_stats(user, db)
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "tier": user.tier,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        "credits": credit_info,
        "search_stats": search_stats,
        "referral": referral_stats
    }


@router.get("/live-stats")
def get_live_site_stats(db: Session = Depends(get_db)):
    """
    Canlı site istatistikleri (PUBLIC - auth gerekmez)
    Ana sayfada gösterilecek:
    - Günlük/Haftalık ziyaretçi
    - Toplam arama
    - Başarı oranı %95+
    """
    return AnalyticsService.get_live_stats(db)
