# Design Document: Pricing and Credit Fixes

## Overview

This design addresses three interconnected issues in the pricing and credit system:

1. **Pricing Updates**: Modify hardcoded pricing values to reflect new pricing structure
2. **Admin Pricing Management**: Add database-backed pricing configuration with admin UI
3. **AlanSearch Credit Bug**: Fix the initialization and validation logic for new user credits

The solution maintains backward compatibility while introducing dynamic pricing management capabilities. The design follows a hybrid approach: hardcoded defaults with database overrides, ensuring the system remains operational even if database values are missing.

## Architecture

### Current System

```
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ GET /api/pricing/plans
       │
┌──────▼──────────────────┐
│  Backend (FastAPI)      │
│  ┌──────────────────┐   │
│  │ PRICING_PLANS    │   │
│  │ (hardcoded)      │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

### Proposed System

```
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ GET /api/pricing/plans
       │
┌──────▼──────────────────────────┐
│  Backend (FastAPI)              │
│  ┌──────────────────┐           │
│  │ PricingService   │           │
│  │  - get_plans()   │           │
│  │  - update_plan() │           │
│  └────┬─────────────┘           │
│       │                         │
│  ┌────▼─────────┐  ┌─────────┐ │
│  │ PRICING_PLANS│  │ DB:     │ │
│  │ (defaults)   │  │ Pricing │ │
│  └──────────────┘  └─────────┘ │
└─────────────────────────────────┘
       ▲
       │ POST /api/admin/pricing
       │
┌──────┴──────┐
│ Admin Panel │
└─────────────┘
```

## Components and Interfaces

### 1. Database Schema

**New Table: `pricing_overrides`**

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

This table stores admin-configured pricing overrides. NULL values indicate "use default from PRICING_PLANS".

### 2. Backend Components

#### PricingService (New)

```python
class PricingService:
    @staticmethod
    def get_plan(plan_id: str, db: Session) -> dict:
        """Get plan with database overrides applied"""
        
    @staticmethod
    def get_all_plans(db: Session) -> list[dict]:
        """Get all plans with overrides"""
        
    @staticmethod
    def update_plan_pricing(
        plan_id: str,
        price_try: float | None,
        price_usd: float | None,
        db: Session,
        admin_user_id: int
    ) -> dict:
        """Update pricing for a plan"""
        
    @staticmethod
    def reset_plan_pricing(plan_id: str, db: Session) -> dict:
        """Reset plan to default pricing"""
```

#### Updated Pricing API Endpoints

**Modify existing endpoints:**
- `GET /api/pricing/plans` - Use PricingService instead of direct PRICING_PLANS
- `GET /api/pricing/plans-grouped` - Use PricingService

**No changes needed to:**
- `POST /api/pricing/subscribe` - Already uses plan data correctly
- `POST /api/pricing/bank-transfer` - Already uses plan data correctly

#### New Admin API Endpoints

```python
# GET /api/admin/pricing
def admin_get_pricing(request: Request, db: Session):
    """Get all pricing plans with override status"""
    
# PUT /api/admin/pricing/{plan_id}
def admin_update_pricing(
    plan_id: str,
    request: Request,
    payload: dict,
    db: Session
):
    """Update pricing for a specific plan"""
    
# DELETE /api/admin/pricing/{plan_id}
def admin_reset_pricing(plan_id: str, request: Request, db: Session):
    """Reset plan to default pricing"""
```

#### User Registration Fix

**Modify `backend/app/api/auth.py`:**

Current code:
```python
user = User(
    email=data.email,
    username=data.username,
    hashed_password=get_password_hash(data.password),
    referral_code=referral_code,
    credits=1,  # 1 ücretsiz arama kredisi
    tier="free",
    is_active=True,
)
```

The issue: `alan_search_credits` is not explicitly set, relying on database default. However, the credit check happens before the database default is applied in some scenarios.

Fix: Explicitly initialize `alan_search_credits=1` in User constructor.

#### AlanSearch Credit Validation Fix

**Modify `backend/app/api/alan_search.py`:**

Current code:
```python
# Check credits
if user.alan_search_credits <= 0 and user.tier != "unlimited":
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="No AlanSearch credits remaining"
    )

# Consume credit
if user.tier != "unlimited":
    user.alan_search_credits -= 1
    db.commit()
```

Issue: The logic is correct, but the problem is in user initialization. Once user initialization is fixed, this code will work correctly.

### 3. Frontend Components

#### Admin Pricing Management Page

**New page: `frontend/app/[locale]/admin/pricing/page.tsx`**

Features:
- Display all pricing plans in a table
- Show current prices for TRY and USD
- Indicate which prices are overridden vs defaults
- Inline editing for price values
- Save/Reset buttons per plan
- Validation for positive numbers

UI Structure:
```
┌─────────────────────────────────────────────────┐
│ Pricing Management                              │
├─────────────────────────────────────────────────┤
│ Plan ID    │ TRY Price │ USD Price │ Status    │
├────────────┼───────────┼───────────┼───────────┤
│ basic_     │ 299.00    │ 14.99     │ Override  │
│ monthly    │ [Edit]    │ [Edit]    │ [Reset]   │
├────────────┼───────────┼───────────┼───────────┤
│ credit_    │ 59.99     │ 2.99      │ Override  │
│ pack       │ [Edit]    │ [Edit]    │ [Reset]   │
└─────────────────────────────────────────────────┘
```

## Data Models

### PricingOverride Model

```python
class PricingOverride(Base):
    __tablename__ = "pricing_overrides"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String(50), unique=True, nullable=False, index=True)
    price_try = Column(Float, nullable=True)
    price_usd = Column(Float, nullable=True)
    credits = Column(Integer, nullable=True)
    search_normal = Column(Integer, nullable=True)
    search_detailed = Column(Integer, nullable=True)
    search_location = Column(Integer, nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    updater = relationship("User", foreign_keys=[updated_by])
```

### Updated PRICING_PLANS Constant

Update the following plans in `backend/app/api/pricing.py`:

**basic_monthly:**
- price_try: 139 → 299
- price_usd: 9.99 → 14.99

**credit_pack:**
- price_try: 79 → 59.99
- price_usd: 3.50 → 2.99

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pricing Override Consistency

*For any* pricing plan with database overrides, when the plan is retrieved through the API, the returned prices SHALL match the database override values exactly.

**Validates: Requirements 2.4**

### Property 2: Default Fallback Integrity

*For any* pricing plan without database overrides, when the plan is retrieved through the API, the returned prices SHALL match the hardcoded PRICING_PLANS constant values exactly.

**Validates: Requirements 2.5, 4.3**

### Property 3: New User Credit Initialization

*For any* newly registered user, the user's alan_search_credits field SHALL equal 1 immediately after registration completes.

**Validates: Requirements 3.1**

### Property 4: Credit Consumption Validation

*For any* user with alan_search_credits > 0 (excluding unlimited tier), when performing an AlanSearch, the operation SHALL succeed and decrement alan_search_credits by exactly 1.

**Validates: Requirements 3.2, 3.3**

### Property 5: Insufficient Credit Rejection

*For any* user with alan_search_credits = 0 (excluding unlimited tier), when attempting an AlanSearch, the system SHALL reject the request with a 402 Payment Required status.

**Validates: Requirements 3.4**

### Property 6: Price Update Validation

*For any* admin pricing update request with a negative price value, the system SHALL reject the update and return a validation error.

**Validates: Requirements 2.2**

### Property 7: Currency-Specific Pricing

*For any* pricing plan request with currency parameter "TRY", all returned prices SHALL use the price_try field values.

**Validates: Requirements 1.1, 1.3**

### Property 8: Currency-Specific Pricing (USD)

*For any* pricing plan request with currency parameter "USD", all returned prices SHALL use the price_usd field values.

**Validates: Requirements 1.2, 1.4**

### Property 9: Admin Audit Trail

*For any* successful pricing update through the admin panel, the system SHALL record the admin user ID and timestamp in the pricing_overrides table.

**Validates: Requirements 4.4**

### Property 10: Pricing API Response Format Consistency

*For any* pricing plan retrieved from the API, the response format SHALL contain all required fields (id, name, price, currency, credits, features) regardless of whether values come from database or defaults.

**Validates: Requirements 4.3**

## Error Handling

### Pricing Service Errors

1. **Database Connection Failure**: Fall back to hardcoded PRICING_PLANS, log warning
2. **Invalid Price Value**: Return 400 Bad Request with validation message
3. **Plan Not Found**: Return 404 Not Found
4. **Unauthorized Admin Access**: Return 401 Unauthorized

### Credit System Errors

1. **Insufficient Credits**: Return 402 Payment Required with clear message
2. **Invalid Credit Amount**: Return 400 Bad Request
3. **Database Update Failure**: Rollback transaction, return 500 Internal Server Error

### Admin Panel Errors

1. **Invalid Admin Key**: Return 401 Unauthorized
2. **Malformed Request**: Return 400 Bad Request with validation details
3. **Concurrent Update Conflict**: Return 409 Conflict, suggest retry

## Testing Strategy

### Unit Tests

**Pricing Service Tests:**
- Test get_plan with override present
- Test get_plan with no override (default fallback)
- Test update_plan_pricing with valid values
- Test update_plan_pricing with invalid values (negative, zero)
- Test reset_plan_pricing

**User Registration Tests:**
- Test new user has alan_search_credits = 1
- Test new user has credits = 1
- Test referral code processing doesn't affect alan_search_credits

**AlanSearch Tests:**
- Test search with sufficient credits
- Test search with zero credits
- Test search with unlimited tier
- Test credit decrement after successful search

**Admin API Tests:**
- Test GET /api/admin/pricing returns all plans
- Test PUT /api/admin/pricing updates database
- Test DELETE /api/admin/pricing resets to defaults
- Test unauthorized access is rejected

### Property-Based Tests

Each correctness property listed above should be implemented as a property-based test with minimum 100 iterations. Tests should generate random:
- User objects with varying credit amounts
- Pricing plans with different configurations
- Admin update requests with various price values
- Currency selections (TRY/USD)

### Integration Tests

1. **End-to-End Pricing Flow:**
   - Admin updates pricing → Frontend fetches pricing → User purchases → Correct amount charged

2. **End-to-End New User Flow:**
   - User registers → Receives 1 alan_search_credit → Performs search → Credit decremented → Second search fails with insufficient credits

3. **Admin Pricing Management Flow:**
   - Admin views pricing → Updates price → Price persists → API returns new price → Admin resets → API returns default

### Manual Testing Checklist

- [ ] Register new user, verify 1 free AlanSearch credit
- [ ] Perform AlanSearch with new user, verify success
- [ ] Attempt second AlanSearch, verify "insufficient credits" error
- [ ] Admin login, navigate to pricing management
- [ ] Update basic_monthly price to 299 TRY
- [ ] Verify frontend pricing page shows 299 TRY
- [ ] Reset pricing, verify default restored
- [ ] Test with both TRY and USD currency selections
