"""Test login endpoint directly"""
import requests
import json

url = "http://localhost:8000/api/auth/login"
data = {
    "email": "testalan@gmail.com",
    "password": "123456"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ LOGIN SUCCESSFUL!")
        token = response.json().get("access_token")
        print(f"Token: {token[:50]}...")
    else:
        print(f"\n❌ LOGIN FAILED")
        print(f"Error: {response.json()}")
except Exception as e:
    print(f"❌ Request failed: {e}")
