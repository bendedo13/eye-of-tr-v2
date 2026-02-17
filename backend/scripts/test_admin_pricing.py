"""Test script for admin pricing endpoints"""
import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

os.environ.setdefault("SECRET_KEY", "dev-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///./faceseek.db")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ADMIN_API_KEY", "dev-admin-key-change-me")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app  # noqa: E402


client = TestClient(app)


def main():
    admin_headers = {
        "x-admin-key": os.environ["ADMIN_API_KEY"],
        "x-admin-email": "admin@local"
    }
    
    print("Testing admin pricing endpoints...")
    
    # Test 1: GET /api/admin/pricing - Get all pricing plans
    print("\n1. Testing GET /api/admin/pricing...")
    r = client.get("/api/admin/pricing", headers=admin_headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert "plans" in data, "Response should contain 'plans' key"
    plans = data["plans"]
    assert len(plans) > 0, "Should return at least one plan"
    
    # Verify plan structure
    first_plan = plans[0]
    assert "id" in first_plan, "Plan should have 'id'"
    assert "price_try" in first_plan, "Plan should have 'price_try'"
    assert "price_usd" in first_plan, "Plan should have 'price_usd'"
    assert "has_override" in first_plan, "Plan should have 'has_override'"
    assert "default_price_try" in first_plan, "Plan should have 'default_price_try'"
    assert "default_price_usd" in first_plan, "Plan should have 'default_price_usd'"
    print(f"✓ Found {len(plans)} plans")
    print(f"  First plan: {first_plan['id']}, TRY: {first_plan['price_try']}, USD: {first_plan['price_usd']}")
    
    # Find a plan to test with (use basic_monthly if available)
    test_plan_id = None
    for plan in plans:
        if plan["id"] == "basic_monthly":
            test_plan_id = plan["id"]
            break
    
    if not test_plan_id and plans:
        test_plan_id = plans[0]["id"]
    
    assert test_plan_id, "No plan found to test with"
    print(f"  Using plan '{test_plan_id}' for testing")
    
    # Test 2: PUT /api/admin/pricing/{plan_id} - Update pricing
    print(f"\n2. Testing PUT /api/admin/pricing/{test_plan_id}...")
    new_price_try = 399.99
    new_price_usd = 19.99
    r = client.put(
        f"/api/admin/pricing/{test_plan_id}",
        headers=admin_headers,
        json={
            "price_try": new_price_try,
            "price_usd": new_price_usd
        }
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["status"] == "ok", "Status should be 'ok'"
    assert "plan" in data, "Response should contain updated plan"
    updated_plan = data["plan"]
    assert updated_plan["price_try"] == new_price_try, f"TRY price should be {new_price_try}"
    assert updated_plan["price_usd"] == new_price_usd, f"USD price should be {new_price_usd}"
    print(f"✓ Updated pricing: TRY={new_price_try}, USD={new_price_usd}")
    
    # Test 3: Verify the override is reflected in GET
    print(f"\n3. Verifying override is reflected in GET...")
    r = client.get("/api/admin/pricing", headers=admin_headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    plans = r.json()["plans"]
    test_plan = next((p for p in plans if p["id"] == test_plan_id), None)
    assert test_plan, f"Plan {test_plan_id} not found"
    assert test_plan["has_override"] is True, "Plan should have override"
    assert test_plan["price_try"] == new_price_try, f"TRY price should be {new_price_try}"
    assert test_plan["price_usd"] == new_price_usd, f"USD price should be {new_price_usd}"
    print(f"✓ Override confirmed: has_override={test_plan['has_override']}")
    
    # Test 4: Test validation - negative price should fail
    print(f"\n4. Testing validation (negative price should fail)...")
    r = client.put(
        f"/api/admin/pricing/{test_plan_id}",
        headers=admin_headers,
        json={
            "price_try": -100,
            "price_usd": 19.99
        }
    )
    assert r.status_code == 400, f"Expected 400 for negative price, got {r.status_code}"
    print(f"✓ Validation works: negative price rejected")
    
    # Test 5: DELETE /api/admin/pricing/{plan_id} - Reset to defaults
    print(f"\n5. Testing DELETE /api/admin/pricing/{test_plan_id}...")
    r = client.delete(f"/api/admin/pricing/{test_plan_id}", headers=admin_headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["status"] == "ok", "Status should be 'ok'"
    assert "plan" in data, "Response should contain plan with defaults"
    print(f"✓ Reset to defaults successful")
    
    # Test 6: Verify override is removed
    print(f"\n6. Verifying override is removed...")
    r = client.get("/api/admin/pricing", headers=admin_headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    plans = r.json()["plans"]
    test_plan = next((p for p in plans if p["id"] == test_plan_id), None)
    assert test_plan, f"Plan {test_plan_id} not found"
    assert test_plan["has_override"] is False, "Plan should not have override"
    assert test_plan["price_try"] == test_plan["default_price_try"], "Should use default TRY price"
    assert test_plan["price_usd"] == test_plan["default_price_usd"], "Should use default USD price"
    print(f"✓ Override removed: has_override={test_plan['has_override']}")
    
    # Test 7: Test invalid plan ID
    print(f"\n7. Testing invalid plan ID...")
    r = client.put(
        "/api/admin/pricing/invalid_plan_id",
        headers=admin_headers,
        json={
            "price_try": 100,
            "price_usd": 10
        }
    )
    assert r.status_code == 400, f"Expected 400 for invalid plan, got {r.status_code}"
    print(f"✓ Invalid plan ID rejected")
    
    # Test 8: Test unauthorized access
    print(f"\n8. Testing unauthorized access...")
    r = client.get("/api/admin/pricing", headers={"x-admin-key": "wrong-key"})
    assert r.status_code == 401, f"Expected 401 for wrong key, got {r.status_code}"
    print(f"✓ Unauthorized access rejected")
    
    print("\n" + "="*50)
    print("✓ All admin pricing endpoint tests passed!")
    print("="*50)


if __name__ == "__main__":
    main()
