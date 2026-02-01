"""Analytics and statistics service"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import Optional

from app.models.analytics import SiteVisit, SearchLog
from app.models.user import User

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Site istatistikleri ve analytics servisi"""
    
    @staticmethod
    def log_visit(db: Session, ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                  page_url: Optional[str] = None, referrer: Optional[str] = None) -> None:
        """Ziyaret kaydı oluştur"""
        try:
            visit = SiteVisit(
                ip_address=ip_address,
                user_agent=user_agent,
                page_url=page_url,
                referrer=referrer
            )
            db.add(visit)
            db.commit()
            logger.debug(f"Visit logged: {page_url} from {ip_address}")
        except Exception as e:
            logger.error(f"Failed to log visit: {e}")
            db.rollback()
    
    @staticmethod
    def log_search(db: Session, user_id: Optional[int], search_type: str, 
                   results_found: int, is_successful: bool, was_blurred: bool = False,
                   query: Optional[str] = None, file_name: Optional[str] = None,
                   providers_used: Optional[str] = None, search_duration_ms: Optional[int] = None,
                   credits_used: int = 1) -> None:
        """Arama kaydı oluştur"""
        try:
            search_log = SearchLog(
                user_id=user_id,
                search_type=search_type,
                query=query,
                file_name=file_name,
                results_found=results_found,
                is_successful=is_successful,
                providers_used=providers_used,
                search_duration_ms=search_duration_ms,
                credits_used=credits_used,
                was_blurred=was_blurred
            )
            db.add(search_log)
            
            # Kullanıcı istatistiklerini güncelle
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.total_searches += 1
                    if is_successful:
                        user.successful_searches += 1
                    user.last_search_at = datetime.utcnow()
            
            db.commit()
            logger.info(f"Search logged: user={user_id}, type={search_type}, results={results_found}")
        except Exception as e:
            logger.error(f"Failed to log search: {e}")
            db.rollback()
    
    @staticmethod
    def get_live_stats(db: Session) -> dict:
        """Canlı site istatistikleri (ana sayfa için)"""
        now = datetime.utcnow()
        
        # Bugün ve bu hafta hesapla
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Günlük ziyaretçi
        daily_visitors = db.query(func.count(SiteVisit.id)).filter(
            SiteVisit.visited_at >= today_start
        ).scalar() or 0
        
        # Haftalık ziyaretçi
        weekly_visitors = db.query(func.count(SiteVisit.id)).filter(
            SiteVisit.visited_at >= week_start
        ).scalar() or 0
        
        # Toplam arama sayısı
        total_searches = db.query(func.count(SearchLog.id)).scalar() or 0
        
        # Bu haftaki aramalar
        weekly_searches = db.query(func.count(SearchLog.id)).filter(
            SearchLog.created_at >= week_start
        ).scalar() or 0
        
        # Başarılı arama sayısı
        successful_searches = db.query(func.count(SearchLog.id)).filter(
            SearchLog.is_successful == True
        ).scalar() or 0
        
        # Başarı oranı (%95+ göster)
        if total_searches > 0:
            success_rate = (successful_searches / total_searches) * 100
            # Minimum %95 göster (güven için)
            success_rate = max(success_rate, 95.0)
        else:
            success_rate = 97.5  # Varsayılan yüksek oran
        
        # Toplam kullanıcı
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # Aktif kullanıcı (son 7 gün içinde arama yapan)
        active_users = db.query(func.count(func.distinct(SearchLog.user_id))).filter(
            SearchLog.created_at >= week_start,
            SearchLog.user_id.isnot(None)
        ).scalar() or 0
        
        return {
            "daily_visitors": daily_visitors + 847,  # Base sayı ekle (güven için)
            "weekly_visitors": weekly_visitors + 5234,  # Base sayı ekle
            "total_searches": total_searches + 12450,  # Base sayı ekle
            "weekly_searches": weekly_searches + 1823,  # Base sayı ekle
            "success_rate": round(success_rate, 1),
            "total_users": total_users + 3421,  # Base sayı ekle
            "active_users": active_users + 892,  # Base sayı ekle
            "last_updated": now.isoformat()
        }
    
    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> dict:
        """Kullanıcı istatistikleri (dashboard için)"""
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return {}
        
        # Son 30 günlük aramalar
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_searches = db.query(SearchLog).filter(
            SearchLog.user_id == user_id,
            SearchLog.created_at >= thirty_days_ago
        ).order_by(SearchLog.created_at.desc()).limit(10).all()
        
        # Bu ayki aramalar
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_searches = db.query(func.count(SearchLog.id)).filter(
            SearchLog.user_id == user_id,
            SearchLog.created_at >= month_start
        ).scalar() or 0
        
        return {
            "total_searches": user.total_searches,
            "successful_searches": user.successful_searches,
            "success_rate": round(user.success_rate, 1),
            "monthly_searches": monthly_searches,
            "last_search_at": user.last_search_at.isoformat() if user.last_search_at else None,
            "recent_searches": [
                {
                    "type": s.search_type,
                    "results": s.results_found,
                    "date": s.created_at.isoformat() if s.created_at else None,
                    "successful": s.is_successful,
                    "was_blurred": s.was_blurred
                }
                for s in recent_searches
            ]
        }
