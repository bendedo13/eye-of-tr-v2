from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.support import SupportTicket, SupportMessage, SupportTicketStatus, SupportTicketPriority, SupportTicketCategory
from app.api.support import validate_and_save_support_file

router = APIRouter(prefix="/admin/support", tags=["admin-support"])

# --- Admin Schemas ---

class AdminTicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    user_email: str
    assigned_admin_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    message_count: int

class AdminReplyCreate(BaseModel):
    content: str
    status: Optional[str] = None

# --- Admin Endpoints ---

@router.get("/tickets", response_model=List[AdminTicketResponse])
def admin_list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to_me: bool = False,
    db: Session = Depends(get_db)
):
    """List all support tickets with filters"""
    query = db.query(SupportTicket)
    
    if status:
        query = query.filter(SupportTicket.status == status)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    if category:
        query = query.filter(SupportTicket.category == category)
    if assigned_to_me:
        # This would need admin user context - simplified for now
        pass
    
    tickets = query.join(User).order_by(desc(SupportTicket.created_at)).all()
    
    # Add message count for each ticket
    result = []
    for ticket in tickets:
        message_count = db.query(SupportMessage).filter(
            SupportMessage.ticket_id == ticket.id
        ).count()
        
        result.append({
            "id": ticket.id,
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,
            "user_email": ticket.user.email,
            "assigned_admin_id": ticket.assigned_admin_id,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "message_count": message_count
        })
    
    return result

@router.get("/tickets/{ticket_id}")
def admin_get_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db)
):
    """Get ticket details with messages"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    messages = db.query(SupportMessage).filter(
        SupportMessage.ticket_id == ticket_id
    ).order_by(SupportMessage.created_at).all()
    
    return {
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,
            "user_email": ticket.user.email,
            "user_id": ticket.user_id,
            "assigned_admin_id": ticket.assigned_admin_id,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "attachments": ticket.attachments
        },
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "is_admin": msg.is_admin,
                "created_at": msg.created_at,
                "attachments": msg.attachments,
                "user_email": msg.user.email
            }
            for msg in messages
        ]
    }

@router.post("/tickets/{ticket_id}/reply")
def admin_reply_to_ticket(
    ticket_id: int,
    reply: AdminReplyCreate,
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    """Admin reply to a ticket"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    # Create admin message
    message = SupportMessage(
        ticket_id=ticket_id,
        user_id=1,  # This should be admin user ID - simplified
        content=reply.content,
        is_admin=True
    )
    
    db.add(message)
    db.flush()
    
    # Handle file uploads
    attachments = []
    for file in files:
        if file.filename:
            try:
                file_url = validate_and_save_support_file(file, ticket.id)
                attachments.append(file_url)
            except HTTPException:
                continue
    
    if attachments:
        message.attachments = attachments
    
    # Update ticket status if provided
    if reply.status:
        try:
            SupportTicketStatus(reply.status)
            ticket.status = reply.status
            if reply.status == SupportTicketStatus.RESOLVED.value:
                ticket.resolved_at = datetime.utcnow()
        except ValueError:
            pass
    
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"status": "success", "message_id": message.id}

@router.put("/tickets/{ticket_id}/status")
def admin_update_ticket_status(
    ticket_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Update ticket status"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    try:
        SupportTicketStatus(status)
        ticket.status = status
        
        if status == SupportTicketStatus.RESOLVED.value:
            ticket.resolved_at = datetime.utcnow()
        
        ticket.updated_at = datetime.utcnow()
        db.commit()
        
        return {"status": "success"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz durum")

@router.put("/tickets/{ticket_id}/assign")
def admin_assign_ticket(
    ticket_id: int,
    admin_id: int,
    db: Session = Depends(get_db)
):
    """Assign ticket to admin"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    ticket.assigned_admin_id = admin_id
    ticket.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success"}