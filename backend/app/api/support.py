from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
import uuid
import os
from pathlib import Path

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.support import SupportTicket, SupportMessage, SupportTicketStatus, SupportTicketPriority, SupportTicketCategory
from app.core.config import settings

router = APIRouter(prefix="/api/support", tags=["support"])

# --- Schemas ---

class SupportTicketCreate(BaseModel):
    title: str
    description: str
    category: str = "general"
    priority: str = "medium"

class SupportTicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    attachments: Optional[List[str]]

    class Config:
        from_attributes = True

class SupportMessageCreate(BaseModel):
    content: str

class SupportMessageResponse(BaseModel):
    id: int
    content: str
    is_admin: bool
    created_at: datetime
    attachments: Optional[List[str]]
    user: dict  # Basic user info

    class Config:
        from_attributes = True

# --- File Upload Helper ---

def validate_and_save_support_file(file: UploadFile, ticket_id: int) -> str:
    """Validate and save support ticket files"""
    # Allowed file types
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".txt"}
    max_file_size = 10 * 1024 * 1024  # 10MB
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya formatı. İzin verilenler: {', '.join(allowed_extensions)}")
    
    # Check file size (by reading first chunk)
    contents = file.file.read(max_file_size + 1)
    if len(contents) > max_file_size:
        raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'dan büyük olamaz")
    
    # Generate unique filename
    unique_filename = f"support_{ticket_id}_{uuid.uuid4()}{file_ext}"
    upload_dir = Path(settings.UPLOAD_DIR) / "support"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Read remaining content if any
    while True:
        chunk = file.file.read(8192)
        if not chunk:
            break
        with open(file_path, "ab") as f:
            f.write(chunk)
    
    return f"/uploads/support/{unique_filename}"

# --- User Endpoints ---

@router.post("/tickets", response_model=SupportTicketResponse)
def create_support_ticket(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form("general"),
    priority: str = Form("medium"),
    files: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new support ticket"""
    # Validate category and priority
    try:
        SupportTicketCategory(category)
        SupportTicketPriority(priority)
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz kategori veya öncelik")
    
    # Create ticket
    ticket = SupportTicket(
        user_id=current_user.id,
        title=title,
        description=description,
        category=category,
        priority=priority,
        status=SupportTicketStatus.OPEN.value
    )
    
    db.add(ticket)
    db.flush()  # Get ticket ID without committing
    
    # Handle file uploads
    attachments = []
    for file in files:
        if file.filename:
            try:
                file_url = validate_and_save_support_file(file, ticket.id)
                attachments.append(file_url)
            except HTTPException:
                # Skip invalid files but continue with ticket creation
                continue
    
    if attachments:
        ticket.attachments = attachments
    
    # Create initial message
    message = SupportMessage(
        ticket_id=ticket.id,
        user_id=current_user.id,
        content=description,
        is_admin=False
    )
    db.add(message)
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.get("/tickets", response_model=List[SupportTicketResponse])
def get_user_tickets(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's support tickets"""
    query = db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id)
    
    if status:
        query = query.filter(SupportTicket.status == status)
    
    tickets = query.order_by(desc(SupportTicket.created_at)).all()
    return tickets

@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
def get_ticket_details(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific ticket details"""
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    return ticket

@router.get("/tickets/{ticket_id}/messages", response_model=List[SupportMessageResponse])
def get_ticket_messages(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for a specific ticket"""
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    messages = db.query(SupportMessage).filter(
        SupportMessage.ticket_id == ticket_id
    ).order_by(SupportMessage.created_at).all()
    
    return messages

@router.post("/tickets/{ticket_id}/messages", response_model=SupportMessageResponse)
def add_ticket_message(
    ticket_id: int,
    message: SupportMessageCreate,
    files: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a message to a ticket"""
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Destek talebi bulunamadı")
    
    if ticket.status == SupportTicketStatus.CLOSED.value:
        raise HTTPException(status_code=400, detail="Kapalı talebe mesaj eklenemez")
    
    # Create message
    db_message = SupportMessage(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=message.content,
        is_admin=False
    )
    
    db.add(db_message)
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
        db_message.attachments = attachments
    
    # Update ticket status
    ticket.status = SupportTicketStatus.OPEN.value
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_message)
    
    return db_message