import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api"
ADMIN_KEY = "Benalan.1"
ADMIN_EMAIL = "admin@face-seek.com"

def test_auth():
    print("Starting Comprehensive Auth Tests...")
    print("-" * 50)

    # 1. Test Registration
    print("\n1. Testing Registration...")
    reg_data = {
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "username": f"user_{uuid.uuid4().hex[:6]}",
        "password": "TestPassword123!",
        "device_id": str(uuid.uuid4())
    }
    try:
        reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_data, timeout=5)
        print(f"Status: {reg_res.status_code}")
        print(f"Response: {reg_res.text}")
        if reg_res.status_code == 200:
            print("✅ Registration successful!")
        else:
            print("❌ Registration failed")
    except Exception as e:
        print(f"❌ Error during registration: {e}")

    # 2. Test User Login
    print("\n2. Testing User Login...")
    login_data = {
        "email": reg_data["email"],
        "password": reg_data["password"],
        "device_id": reg_data["device_id"]
    }
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=5)
        print(f"Status: {login_res.status_code}")
        if login_res.status_code == 200:
            token = login_res.json().get("access_token")
            print("✅ Login successful!")
            
            # Test /me endpoint
            print("\n3. Testing /me endpoint...")
            me_res = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=5)
            print(f"Status: {me_res.status_code}")
            if me_res.status_code == 200:
                print(f"✅ /me successful! User: {me_res.json().get('username')}")
            else:
                print("❌ /me failed")
        else:
            print(f"❌ Login failed: {login_res.text}")
    except Exception as e:
        print(f"❌ Error during login: {e}")

    # 4. Test Admin Access
    print("\n4. Testing Admin Access...")
    try:
        admin_res = requests.get(
            f"{BASE_URL}/admin/ping", 
            headers={"x-admin-key": ADMIN_KEY, "x-admin-email": ADMIN_EMAIL}, 
            timeout=5
        )
        print(f"Status: {admin_res.status_code}")
        if admin_res.status_code == 200:
            print("✅ Admin access successful!")
        else:
            print(f"❌ Admin access failed: {admin_res.text}")
    except Exception as e:
        print(f"❌ Error during admin access test: {e}")

if __name__ == "__main__":
    test_auth()
