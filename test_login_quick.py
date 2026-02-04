"""Test login endpoint"""
import requests

url = "http://localhost:8000/api/auth/login"
data = {
    "email": "testalan@gmail.com",
    "password": "123456"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data, timeout=5)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ LOGIN SUCCESSFUL!")
    else:
        print(f"\n❌ LOGIN FAILED")
except requests.exceptions.ConnectionError as e:
    print(f"\n❌ CONNECTION ERROR: {e}")
    print("\nBackend is not reachable. Check if it's running on port 8000.")
except Exception as e:
    print(f"\n❌ Request failed: {e}")
