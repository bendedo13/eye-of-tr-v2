from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, case, and_, or_
from pydantic import BaseModel

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification, NotificationRead, NotificationType

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# --- Schemas ---

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_global: bool
    created_at: datetime
    is_read: bool
    action_link: Optional[str] = None
    priority: str = "normal"

    class Config:
        from_attributes = True

class UnreadCountResponse(BaseModel):
    count: int

# --- Endpoints ---

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının bildirimlerini getirir (Global + Kişisel).
    NotificationRead tablosunu kullanarak okundu bilgisini ekler.
    """
    # Subquery to check if read
    read_alias = aliased(NotificationRead)
    
    # Global bildirimler (target_audience='all') veya kullanıcıya özel bildirimler
    # Ve henüz süresi dolmamışlar
    query = db.query(
        Notification,
        case(
            (read_alias.id != None, True),
            else_=False
        ).label("is_read_status")
    ).outerjoin(
        read_alias,
        and_(
            read_alias.notification_id == Notification.id,
            read_alias.user_id == current_user.id
        )
    ).filter(
        or_(
            Notification.target_user_id == current_user.id,
            Notification.target_audience == "all"
        ),
        or_(
            Notification.expires_at == None,
            Notification.expires_at > datetime.utcnow()
        )
    ).order_by(Notification.created_at.desc())
    
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    response = []
    for notif, is_read in results:
        is_global = notif.target_audience == "all"
        response.append(NotificationResponse(
            id=notif.id,
            title=notif.title,
            message=notif.message,
            type=notif.type.value if hasattr(notif.type, 'value') else str(notif.type),
            is_global=is_global,
            created_at=notif.created_at,
            is_read=is_read,
            action_link=notif.action_url,
            priority="normal" # Modelde priority yok, default dönüyoruz
        ))
        
    return response

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Okunmamış bildirim sayısını döner"""
    read_alias = aliased(NotificationRead)
    
    count = db.query(func.count(Notification.id)).outerjoin(
        read_alias,
        and_(
            read_alias.notification_id == Notification.id,
            read_alias.user_id == current_user.id
        )
    ).filter(
        or_(
            Notification.target_user_id == current_user.id,
            Notification.target_audience == "all"
        ),
        or_(
            Notification.expires_at == None,
            Notification.expires_at > datetime.utcnow()
        ),
        read_alias.id == None  # Okunmamış olanlar (Join null ise)
    ).scalar()
    
    return {"count": count}

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bir bildirimi okundu olarak işaretle"""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
        
    # Check permission
    is_global = notif.target_audience == "all"
    if not is_global and notif.target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
        
    # Check if already read
    existing = db.query(NotificationRead).filter(
        NotificationRead.notification_id == notification_id,
        NotificationRead.user_id == current_user.id
    ).first()
    
    if not existing:
        read_record = NotificationRead(
            user_id=current_user.id,
            notification_id=notification_id
        )
        db.add(read_record)
        db.commit()
        
    return {"status": "success"}

@router.put("/read-all")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tüm okunmamış bildirimleri okundu olarak işaretle"""
    # Okunmamış bildirimleri bul
    read_alias = aliased(NotificationRead)
    
    unread_notifications = db.query(Notification).outerjoin(
        read_alias,
        and_(
            read_alias.notification_id == Notification.id,
            read_alias.user_id == current_user.id
        )
    ).filter(
        or_(
            Notification.target_user_id == current_user.id,
            Notification.target_audience == "all"
        ),
        or_(
            Notification.expires_at == None,
            Notification.expires_at > datetime.utcnow()
        ),
        read_alias.id == None
    ).all()
    
    new_reads = []
    for notif in unread_notifications:
        new_reads.append(NotificationRead(
            user_id=current_user.id,
            notification_id=notif.id
        ))
        
    if new_reads:
        db.bulk_save_objects(new_reads)
        db.commit()
        
    return {"status": "success", "count": len(new_reads)}
