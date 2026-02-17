#!/usr/bin/env python3
"""Create test users for FaceSeek"""
import sys
sys.path.insert(0, '/opt/faceseek/backend')

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

# Test user oluştur
test_user = db.query(User).filter(User.email == 'test@faceseek.io').first()
if not test_user:
    test_user = User(
        email='test@faceseek.io',
        username='TestUser',
        hashed_password=get_password_hash('Test123!'),
        referral_code='TEST001',
        credits=10,
        tier='free',
        role='user',
        is_active=True
    )
    db.add(test_user)
    db.commit()
    print('✅ Test user created: test@faceseek.io / Test123!')
else:
    print('ℹ️  Test user already exists')
    
# Admin user kontrol
admin = db.query(User).filter(User.email == 'admin@face-seek.com').first()
if admin:
    print(f'✅ Admin exists: {admin.email}, role={admin.role}')
    # Admin şifresini güncelle
    admin.hashed_password = get_password_hash('Benalan.1')
    admin.role = 'admin'
    db.commit()
    print('✅ Admin password updated to: Benalan.1')
else:
    print('⚠️  Admin user NOT found! Creating...')
    admin = User(
        email='admin@face-seek.com',
        username='Admin',
        hashed_password=get_password_hash('Benalan.1'),
        referral_code='ADMIN001',
        credits=999999,
        tier='unlimited',
        role='admin',
        is_active=True
    )
    db.add(admin)
    db.commit()
    print('✅ Admin user created!')
    
db.close()
print('\n📋 Login Credentials:')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('👤 Test User:')
print('   Email: test@faceseek.io')
print('   Password: Test123!')
print('\n🔐 Admin:')
print('   Email: admin@face-seek.com')  
print('   Password: Benalan.1')
print('   API Key: Benalan.1')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
