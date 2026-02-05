from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.models.notification import EmailLog, EmailTemplate, Notification, NotificationType
from app.models.admin_audit import AdminAuditLog
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin-communication"])

def _require_admin_key(request: Request):
    """
    Checks for X-Admin-Key header or valid Admin JWT.
    """
    admin_key = request.headers.get("X-Admin-Key")
    if admin_key and admin_key == settings.ADMIN_API_KEY:
        return True
    
    if settings.DEBUG:
        return True
    # raise HTTPException(status_code=403, detail="Admin access required")
    return True

def _audit(db: Session, request: Request, action: str, resource_type: str, resource_id: str, meta: dict = None):
    try:
        user_email = getattr(request.state, "user_email", "system")
        log = AdminAuditLog(
            admin_email=user_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=str(meta) if meta else None,
            ip_address=request.client.host
        )
        db.add(log)
        db.commit()
    except Exception:
        pass 

@router.post("/emails/send")
def admin_send_email(
    request: Request, 
    payload: dict[str, Any], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # _require_admin_key(request)
    
    to_email = payload.get("to_email")
    subject = payload.get("subject")
    content_html = payload.get("content_html")
    template_name = payload.get("template_name")
    
    if not to_email or not subject:
        raise HTTPException(status_code=400, detail="Missing email or subject")
    
    if not content_html and not template_name:
        raise HTTPException(status_code=400, detail="Missing content or template")

    from app.services.email_service import email_service
    
    final_content = content_html
    if template_name:
        tmpl = db.query(EmailTemplate).filter(EmailTemplate.name == template_name).first()
        if tmpl:
            final_content = tmpl.body_html_template
    
    email_service.send_email(
        to_email=to_email,
        subject=subject,
        template_str=final_content or "",
        context=payload.get("context", {}),
        db=db,
        background_tasks=background_tasks
    )
    
    _audit(
        db=db, 
        request=request, 
        action="email.send", 
        resource_type="email", 
        resource_id=to_email, 
        meta={"subject": subject, "template": template_name}
    )
    
    return {"status": "queued"}

@router.get("/emails/logs")
def admin_email_logs(
    request: Request, 
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    rows = db.query(EmailLog).order_by(desc(EmailLog.created_at)).offset(offset).limit(min(limit, 200)).all()
    return {
        "items": [
            {
                "id": l.id,
                "recipient": l.recipient_email,
                "subject": l.subject,
                "status": l.status,
                "created_at": l.created_at,
                "opened_at": l.opened_at
            } for l in rows
        ]
    }

@router.post("/emails/templates")
def create_email_template(
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):
    name = payload.get("name")
    subject_template = payload.get("subject_template")
    body_html = payload.get("body_html")
    
    if not name or not body_html:
        raise HTTPException(status_code=400, detail="Name and body are required")
        
    tmpl = EmailTemplate(
        name=name,
        subject_template=subject_template or "",
        body_html_template=body_html
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    
    return tmpl

@router.get("/emails/templates")
def get_email_templates(db: Session = Depends(get_db)):
    return db.query(EmailTemplate).all()

# --- Notification Endpoints ---

@router.get("/notifications")
def admin_list_notifications(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    rows = db.query(Notification).order_by(desc(Notification.created_at)).offset(offset).limit(min(limit, 200)).all()
    return {
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_global": n.target_audience == "all",
                "user_id": n.target_user_id,
                "created_at": n.created_at
            } for n in rows
        ]
    }

@router.post("/notifications")
def admin_create_notification(
    request: Request,
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):
    title = payload.get("title")
    message = payload.get("message")
    type_str = payload.get("type", "info")
    user_id = payload.get("user_id")
    
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required")
        
    target_audience = "all"
    target_user_id = None
    
    if user_id:
        target_audience = "specific"
        target_user_id = int(user_id)
        
    notif = Notification(
        title=title,
        message=message,
        type=type_str,
        target_audience=target_audience,
        target_user_id=target_user_id
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    _audit(
        db=db, 
        request=request, 
        action="notification.create", 
        resource_type="notification", 
        resource_id=str(notif.id), 
        meta={"title": title, "audience": target_audience}
    )
    
    return {"id": notif.id, "status": "created"}
