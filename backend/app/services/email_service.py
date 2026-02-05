import smtplib
import logging
from email.message import EmailMessage
from typing import List, Optional, Dict, Any
from jinja2 import Template
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

from app.core.config import settings
from app.models.notification import EmailLog

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_pass = settings.SMTP_PASS
        self.smtp_from = settings.SMTP_FROM

    def _send_sync(self, to_email: str, subject: str, html_content: str) -> bool:
        if not self.smtp_host or not self.smtp_from:
            logger.warning("SMTP not configured, skipping email.")
            return False

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.smtp_from
        msg["To"] = to_email
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype="html")

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=20) as server:
                server.starttls()
                if self.smtp_user and self.smtp_pass:
                    server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_email(
        self,
        to_email: str,
        subject: str,
        template_str: str,
        context: Dict[str, Any],
        db: Session,
        user_id: Optional[int] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """
        Send an email using a Jinja2 template string and context.
        Logs the attempt to DB.
        """
        # Render template
        try:
            template = Template(template_str)
            html_content = template.render(**context)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            return

        # Create log entry (pending)
        log_entry = EmailLog(
            recipient_email=to_email,
            subject=subject,
            status="queued",
            user_id=user_id,
            template_name="custom"
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        # Define actual send task
        def _task():
            # Re-create session for background task if needed, but for simplicity we use sync call
            # In production, use a proper queue like Celery. Here we use FastAPI BackgroundTasks.
            # We need a new DB session for updating the log in background to avoid threading issues with the passed session.
            from app.db.database import SessionLocal
            _db = SessionLocal()
            try:
                success = self._send_sync(to_email, subject, html_content)
                _log = _db.query(EmailLog).filter(EmailLog.id == log_entry.id).first()
                if _log:
                    _log.status = "sent" if success else "failed"
                    if not success:
                        _log.error_message = "SMTP Error"
                    _db.commit()
            except Exception as e:
                logger.error(f"Background email task error: {e}")
            finally:
                _db.close()

        if background_tasks:
            background_tasks.add_task(_task)
        else:
            # Fallback to sync
            _task()

email_service = EmailService()
