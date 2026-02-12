#!/usr/bin/env python3
"""Create test user for Acun Ilıcalı search testing and generate JWT token"""
import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
import json
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

# Configuration
TEST_EMAIL = "acun@faceseek.test"
TEST_PASSWORD = "TestAcun@2024!"
TEST_USERNAME = "acun_ilicali"
API_BASE = os.getenv("API_BASE", "http://localhost:5000")

print("\n" + "="*70)
print("[SETUP] ACUN ILICALI TEST USER SETUP")
print("="*70)

# Step 1: Create user in database
print("\n[1/3] Creating test user in database...")
db = SessionLocal()

try:
    existing = db.query(User).filter(User.email == TEST_EMAIL).first()

    if existing:
        print(f"[OK] Found existing user: {TEST_EMAIL}")
        # Update for testing
        existing.credits = 1000
        existing.tier = "unlimited"
        existing.is_active = True
        db.commit()
        user_id = existing.id
    else:
        print(f"[NEW] Creating new test user: {TEST_EMAIL}")
        new_user = User(
            email=TEST_EMAIL,
            username=TEST_USERNAME,
            hashed_password=get_password_hash(TEST_PASSWORD),
            credits=1000,
            tier="unlimited",
            role="user",
            is_active=True,
            referral_code=User.generate_referral_code()
        )
        db.add(new_user)
        db.commit()
        user_id = new_user.id
        print(f"[OK] User created with ID: {user_id}")

    print(f"   Email: {TEST_EMAIL}")
    print(f"   Username: {TEST_USERNAME}")
    print(f"   Tier: unlimited")
    print(f"   Credits: 1000")

finally:
    db.close()

# Step 2: Get JWT token via login endpoint
print("\n[2/3] Getting JWT token from login endpoint...")
try:
    login_url = f"{API_BASE}/api/login"
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    response = requests.post(login_url, json=login_data, timeout=10)

    if response.status_code == 200:
        token_response = response.json()
        jwt_token = token_response.get("access_token")
        print(f"[OK] JWT token generated successfully")
        print(f"   Token length: {len(jwt_token)} chars")
    else:
        print(f"[ERR] Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        jwt_token = None
except Exception as e:
    print(f"[ERR] Error getting token: {e}")
    jwt_token = None

# Step 3: Display results
print("\n" + "="*70)
print("[OK] TEST USER READY FOR ACUN ILICALI SEARCH TESTING")
print("="*70)
print(f"\nEmail:      {TEST_EMAIL}")
print(f"Password:   {TEST_PASSWORD}")
print(f"Username:   {TEST_USERNAME}")
print(f"Credits:    1000 (unlimited tier)")
if jwt_token:
    print(f"JWT Token:  {jwt_token[:50]}...")
else:
    print(f"JWT Token:  (Failed to generate)")

if jwt_token:
    print(f"\nUSAGE IN CURL:")
    print(f"   curl -X POST http://localhost:5000/api/search-face \\")
    print(f"     -H 'Authorization: Bearer {jwt_token[:30]}...' \\")
    print(f"     -F 'file=@image.jpg'")

    # Save token to file for easy access
    token_file = Path(__file__).parent.parent / ".test_token"
    token_file.write_text(jwt_token)
    print(f"\nToken saved to: {token_file}")

    # Also save credentials
    creds_file = Path(__file__).parent.parent / ".test_credentials.json"
    creds_file.write_text(json.dumps({
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "token": jwt_token,
        "api_base": API_BASE
    }, indent=2))
    print(f"Credentials saved to: {creds_file}")

print("\n" + "="*70)
print("\nNext steps:")
print("   1. Get 3 Acun Ilicali images")
print("   2. Run: python scripts/test_search_with_images.py")
print("   3. Verify results include face matches from dataset")
print("\n" + "="*70 + "\n")
