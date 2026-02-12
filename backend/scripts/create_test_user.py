"""Simple test user creator for FaceSeek"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Check existing users
print("\n=== Checking existing users ===")
all_users = db.query(User).all()
for u in all_users[:5]:
    print(f"Email: {u.email}, Credits: {u.credits}, Tier: {u.tier}")

# Create/update test user
test_email = "test@faceseek.com"
test_password = "Test123!"

existing = db.query(User).filter(User.email == test_email).first()

if existing:
    print(f"\n✅ Found existing user: {test_email}")
    # Update credits and tier for testing
    existing.credits = 100
    existing.tier = "premium"
    existing.is_active = True
    db.commit()
else:
    print(f"\n Creating new test user: {test_email}")
    new_user = User(
        email=test_email,
        username="testuser",
        hashed_password=pwd_context.hash(test_password),
        credits=100,
        tier="premium",
        role="user",
        is_active=True,
        referral_code=User.generate_referral_code()
    )
    db.add(new_user)
    db.commit()

print("\n" + "="*60)
print("✅ TEST USER READY")
print("="*60)
print(f"📧 Email: {test_email}")
print(f"🔑 Password: {test_password}")
print(f"💳 Credits: 100")
print(f"🎖️  Tier: premium")
print("="*60)
print("\n🔗 Login at: http://localhost:3000/tr/login")
print("="*60)

db.close()
