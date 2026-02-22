import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Setup path to import backend modules
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Load env from backend/.env explicitly to match the running server
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

# Verify we are using the right DB
print(f"📂 Using Database: {os.getenv('DATABASE_URL')}")

from app.db.database import SessionLocal
from app.models.user import User, UserProfile
from app.models.lens import LensAnalysisLog # Import to register model
from app.core.security import get_password_hash

def create_user():
    db = SessionLocal()
    try:
        email = "testadmin@example.com"
        username = "testadmin"
        password = "benalan1"
        full_name = "Test Kullanıcı"
        credits = 1000
        
        # Check if exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"⚠️ User {email} already exists. Updating password...")
            existing.hashed_password = get_password_hash(password)
            existing.is_active = True
            existing.credits = credits
            db.commit()
            profile = db.query(UserProfile).filter(UserProfile.user_id == existing.id).first()
            if not profile:
                profile = UserProfile(user_id=existing.id)
                db.add(profile)
            profile.full_name = full_name
            db.commit()
            print(f"✅ User {email} password updated to '{password}'")
            return

        # Create new
        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(password),
            referral_code="TEST1234",
            credits=credits,
            tier="basic",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        profile = UserProfile(user_id=user.id, full_name=full_name)
        db.add(profile)
        db.commit()
        print(f"✅ Created User: {email}")
        print(f"🔑 Password: {password}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
