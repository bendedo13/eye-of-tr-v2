#!/usr/bin/env python3
"""
Admin User Initialization Script
Creates or updates the admin user in the database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.database import engine, Base, get_db
# Import all models to ensure they are registered for create_all
from app.models.user import User
from app.models.activity import ActivityDaily
from app.models.analytics import SearchLog, ReferralLog
from app.models.admin_audit import AdminAuditLog
from app.models.cms import BlogPost, MediaAsset, SiteSetting
from app.models.notification import Notification
from app.models.subscription import Payment
from app.models.support import SupportTicket, SupportMessage
from app.models.verification import EmailVerification, DeviceRegistration, IpRegistration, PasswordReset

from app.core.security import get_password_hash
from app.core.config import settings


def init_admin():
    """Create or update admin user"""
    # Create tables if they don't exist
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Admin credentials
        admin_email = settings.ADMIN_EMAIL or "admin@faceseek.io"
        admin_password = "Admin123!@#"  # Default password
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == admin_email).first()
        
        if admin_user:
            print(f"✓ Admin user already exists: {admin_email}")
            print(f"  - User ID: {admin_user.id}")
            print(f"  - Role: {admin_user.role}")
            
            # Update to admin role if not already
            if admin_user.role != "admin":
                admin_user.role = "admin"
                db.commit()
                print(f"  ✓ Updated role to 'admin'")
            
            # Ensure user is active
            if not admin_user.is_active:
                admin_user.is_active = True
                db.commit()
                print(f"  ✓ Activated admin user")
        else:
            # Generate unique referral code
            referral_code = User.generate_referral_code()
            while db.query(User).filter(User.referral_code == referral_code).first():
                referral_code = User.generate_referral_code()
            
            # Create new admin user
            admin_user = User(
                email=admin_email,
                username="admin",
                hashed_password=get_password_hash(admin_password),
                role="admin",
                tier="unlimited",
                credits=999999,
                is_active=True,
                referral_code=referral_code,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            print(f"✓ Created new admin user: {admin_email}")
            print(f"  - User ID: {admin_user.id}")
            print(f"  - Default Password: {admin_password}")
            print(f"  - Role: {admin_user.role}")
            print(f"  - Tier: {admin_user.tier}")
            print(f"  - Credits: {admin_user.credits}")
        
        print("\n" + "="*60)
        print("ADMIN LOGIN CREDENTIALS")
        print("="*60)
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print(f"Admin API Key: {settings.ADMIN_API_KEY or 'admin123'}")
        print("="*60)
        print("\nAdmin panel: http://localhost:3000/admin/login")
        print("User login: http://localhost:3000/tr/login")
        print("="*60)
        
        return admin_user
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing admin user...\n")
    init_admin()
    print("\n✓ Admin initialization complete!")
