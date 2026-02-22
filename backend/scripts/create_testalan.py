"""Create testalan user"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

# Delete if exists
existing = db.query(User).filter(User.email == "testalan@gmail.com").first()
if existing:
    db.delete(existing)
    db.commit()
    print("Deleted existing user")

# Create new user
new_user = User(
    email="testalan@gmail.com",
    username="testalan",
    hashed_password=pwd_context.hash("123456"),
    credits=100,
    tier="basic",
    role="user",
    is_active=True,
    referral_code=User.generate_referral_code()
)

db.add(new_user)
db.commit()

print("="*50)
print("✅ TEST USER CREATED")
print("="*50)
print("📧 Email: testalan@gmail.com")
print("🔑 Password: 123456")
print("💳 Credits: 100")
print("🎖️  Tier: basic")
print("✅ Active: True")
print("="*50)

db.close()
