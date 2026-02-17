# Admin Pricing Management Endpoints

This document describes the admin pricing management endpoints implemented for dynamic pricing configuration.

## Overview

Three new endpoints have been added to the admin API to allow administrators to manage pricing plans dynamically without requiring code deployments:

1. `GET /api/admin/pricing` - Get all pricing plans with override status
2. `PUT /api/admin/pricing/{plan_id}` - Update pricing for a specific plan
3. `DELETE /api/admin/pricing/{plan_id}` - Reset pricing to defaults

## Authentication

All endpoints require admin authentication via the `x-admin-key` header:

```
x-admin-key: <your-admin-key>
x-admin-email: admin@example.com  (optional, for audit trail)
```

## Endpoints

### 1. GET /api/admin/pricing

Get all pricing plans with override status indicator.

**Request:**
```http
GET /api/admin/pricing
x-admin-key: <admin-key>
```

**Response:**
```json
{
  "plans": [
    {
      "id": "basic_monthly",
      "name": "Basic Monthly",
      "price_try": 299.0,
      "price_usd": 14.99,
      "credits": 100,
      "search_normal": 50,
      "search_detailed": 30,
      "search_location": 20,
      "has_override": true,
      "default_price_try": 139.0,
      "default_price_usd": 9.99,
      "updated_by": 1,
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "credit_pack",
      "name": "Credit Pack",
      "price_try": 59.99,
      "price_usd": 2.99,
      "credits": 50,
      "has_override": false,
      "default_price_try": 59.99,
      "default_price_usd": 2.99
    }
  ]
}
```

**Fields:**
- `has_override`: Boolean indicating if the plan has database overrides
- `default_price_try`: Original hardcoded TRY price
- `default_price_usd`: Original hardcoded USD price
- `updated_by`: Admin user ID who made the last update (if override exists)
- `updated_at`: Timestamp of last update (if override exists)

### 2. PUT /api/admin/pricing/{plan_id}

Update pricing for a specific plan.

**Request:**
```http
PUT /api/admin/pricing/basic_monthly
x-admin-key: <admin-key>
x-admin-email: admin@example.com
Content-Type: application/json

{
  "price_try": 399.99,
  "price_usd": 19.99
}
```

**Validation:**
- At least one price (price_try or price_usd) must be provided
- Prices must be positive numbers (>= 0)
- Plan ID must exist in PRICING_PLANS

**Response:**
```json
{
  "status": "ok",
  "plan": {
    "id": "basic_monthly",
    "name": "Basic Monthly",
    "price_try": 399.99,
    "price_usd": 19.99,
    "credits": 100,
    "search_normal": 50,
    "search_detailed": 30,
    "search_location": 20
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid price values or missing plan
- `401 Unauthorized`: Invalid admin key
- `500 Internal Server Error`: Database error

### 3. DELETE /api/admin/pricing/{plan_id}

Reset plan pricing to defaults by removing database overrides.

**Request:**
```http
DELETE /api/admin/pricing/basic_monthly
x-admin-key: <admin-key>
```

**Response:**
```json
{
  "status": "ok",
  "plan": {
    "id": "basic_monthly",
    "name": "Basic Monthly",
    "price_try": 139.0,
    "price_usd": 9.99,
    "credits": 100,
    "search_normal": 50,
    "search_detailed": 30,
    "search_location": 20
  }
}
```

**Error Responses:**
- `404 Not Found`: Plan not found
- `401 Unauthorized`: Invalid admin key
- `500 Internal Server Error`: Database error

## Audit Trail

All pricing changes are logged in the `admin_audit_log` table with:
- Action: `pricing.update` or `pricing.reset`
- Resource type: `pricing`
- Resource ID: Plan ID
- Actor email: From `x-admin-email` header
- Actor IP: From request
- Metadata: Price values and admin user ID

## Database Schema

Pricing overrides are stored in the `pricing_overrides` table:

```sql
CREATE TABLE pricing_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id TEXT NOT NULL UNIQUE,
    price_try REAL,
    price_usd REAL,
    credits INTEGER,
    search_normal INTEGER,
    search_detailed INTEGER,
    search_location INTEGER,
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

## Implementation Details

### PricingService

The `PricingService` class handles the business logic:

- `get_plan(plan_id, db)`: Get a single plan with overrides applied
- `get_all_plans(db)`: Get all plans with overrides applied
- `update_plan_pricing(plan_id, price_try, price_usd, db, admin_user_id)`: Update pricing
- `reset_plan_pricing(plan_id, db)`: Reset to defaults

### Fallback Behavior

- If no database override exists, the hardcoded PRICING_PLANS values are used
- NULL values in the database mean "use default"
- The system remains operational even if the database is unavailable (falls back to defaults)

## Testing

A test script is available at `backend/scripts/test_admin_pricing.py` that verifies:

1. GET endpoint returns all plans with correct structure
2. PUT endpoint updates pricing correctly
3. Overrides are reflected in subsequent GET requests
4. Validation rejects negative prices
5. DELETE endpoint resets to defaults
6. Override removal is reflected in GET requests
7. Invalid plan IDs are rejected
8. Unauthorized access is rejected

Run the test:
```bash
python backend/scripts/test_admin_pricing.py
```

## Requirements Satisfied

- **Requirement 2.1**: Admin can view all pricing plans with override status
- **Requirement 2.2**: Price validation (positive numbers)
- **Requirement 2.3**: Pricing changes persist to database
- **Requirement 2.5**: Can reset to defaults
- **Requirement 2.6**: Override status indicator
- **Requirement 4.4**: Admin user ID and timestamp recorded

## Example Usage

### Update pricing for a plan:

```bash
curl -X PUT http://localhost:8000/api/admin/pricing/basic_monthly \
  -H "x-admin-key: your-admin-key" \
  -H "x-admin-email: admin@example.com" \
  -H "Content-Type: application/json" \
  -d '{"price_try": 399.99, "price_usd": 19.99}'
```

### Get all pricing plans:

```bash
curl -X GET http://localhost:8000/api/admin/pricing \
  -H "x-admin-key: your-admin-key"
```

### Reset pricing to defaults:

```bash
curl -X DELETE http://localhost:8000/api/admin/pricing/basic_monthly \
  -H "x-admin-key: your-admin-key"
```
