from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# --- Schemas ---
class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    user_id: Optional[int] = None # None = Global
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    duration_seconds: Optional[int] = None # Opsiyonel, frontend'de kullanılabilir

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    media_url: Optional[str]
    created_at: datetime
    is_read: bool

# --- Endpoints ---

@router.post("/", response_model=NotificationResponse)
def create_notification(
    notif: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
        
    db_notif = Notification(
        title=notif.title,
        message=notif.message,
        type=notif.type,
        user_id=notif.user_id,
        media_url=notif.media_url,
        media_type=notif.media_type,
        is_global=True if notif.user_id is None else False,
        expires_at=datetime.utcnow() + timedelta(days=7) # 7 gün sonra silinir
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.get("/my", response_model=List[NotificationResponse])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Hem kişisel hem global bildirimleri getir
    notifs = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.is_global == True),
        Notification.is_read == False # Sadece okunmamışlar (Basitlik için)
    ).order_by(Notification.created_at.desc()).limit(10).all()
    
    return notifs

@router.post("/{id}/read")
def mark_as_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
        
    # Global bildirimleri veritabanında 'read' işaretlemek diğer kullanıcıları etkiler.
    # Gerçek bir sistemde 'NotificationRead' adında ayrı bir tablo tutulur (User-Notification ilişkisi).
    # Ancak bu basit implementasyon için sadece kişisel bildirimleri siliyoruz/işaretliyoruz.
    # Global bildirimler frontend tarafında local storage'da "okundu" olarak tutulabilir.
    
    if notif.user_id == current_user.id:
        notif.is_read = True
        db.commit()
        
    return {"status": "ok"}
