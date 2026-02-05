import sys
from pathlib import Path
from dotenv import load_dotenv

# Setup path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Load env
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

from app.db.database import SessionLocal
from app.models.user import User
from app.models.lens import LensAnalysisLog # Import to register model
from app.models.notification import NotificationRead # Import to register model
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@faceseek.io"
        password = "admin_password_123"
        
        # Check if exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"⚠️ Admin {email} already exists. Updating password...")
            existing.hashed_password = get_password_hash(password)
            existing.role = "admin"
            existing.is_active = True
            db.commit()
            print(f"✅ Admin password updated to '{password}'")
            return

        # Create new
        user = User(
            email=email,
            username="admin",
            hashed_password=get_password_hash(password),
            referral_code="ADMIN001",
            role="admin",
            tier="unlimited",
            credits=99999,
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"✅ Created Admin User: {email}")
        print(f"🔑 Password: {password}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
