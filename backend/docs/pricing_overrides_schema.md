# Pricing Overrides Database Schema

## Overview

The `pricing_overrides` table enables dynamic pricing management through the admin panel. It stores admin-configured overrides for subscription plans and credit packs, allowing price adjustments without code deployments.

## Table: pricing_overrides

### Schema

```sql
CREATE TABLE pricing_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id VARCHAR(50) NOT NULL UNIQUE,
    price_try FLOAT NULL,
    price_usd FLOAT NULL,
    credits INTEGER NULL,
    search_normal INTEGER NULL,
    search_detailed INTEGER NULL,
    search_location INTEGER NULL,
    updated_by INTEGER NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX ix_pricing_overrides_id ON pricing_overrides(id);
CREATE UNIQUE INDEX ix_pricing_overrides_plan_id ON pricing_overrides(plan_id);
```

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key, auto-increment |
| `plan_id` | VARCHAR(50) | NO | Unique identifier for the pricing plan (e.g., "basic_monthly", "credit_pack") |
| `price_try` | FLOAT | YES | Override price in Turkish Lira (NULL = use default) |
| `price_usd` | FLOAT | YES | Override price in US Dollars (NULL = use default) |
| `credits` | INTEGER | YES | Override credit amount (NULL = use default) |
| `search_normal` | INTEGER | YES | Override normal search count (NULL = use default) |
| `search_detailed` | INTEGER | YES | Override detailed search count (NULL = use default) |
| `search_location` | INTEGER | YES | Override location search count (NULL = use default) |
| `updated_by` | INTEGER | YES | Foreign key to users.id - admin who made the update |
| `updated_at` | TIMESTAMP | NO | Timestamp of last update (auto-updated) |

### Constraints

1. **Primary Key**: `id` column
2. **Unique Constraint**: `plan_id` must be unique
3. **Foreign Key**: `updated_by` references `users(id)`
4. **Indexes**: 
   - Index on `id` (primary key)
   - Unique index on `plan_id`

### NULL Value Semantics

NULL values in pricing/credit columns indicate "use default from PRICING_PLANS constant". This design:
- Allows selective overriding of specific fields
- Maintains backward compatibility with hardcoded defaults
- Enables gradual migration from static to dynamic pricing

### Usage Examples

#### Override only TRY price for basic_monthly plan
```sql
INSERT INTO pricing_overrides (plan_id, price_try, updated_by)
VALUES ('basic_monthly', 299.0, 1);
```

#### Override both currencies for credit_pack
```sql
INSERT INTO pricing_overrides (plan_id, price_try, price_usd, updated_by)
VALUES ('credit_pack', 59.99, 2.99, 1);
```

#### Reset to defaults (delete override)
```sql
DELETE FROM pricing_overrides WHERE plan_id = 'basic_monthly';
```

## Model Implementation

The table is implemented using SQLAlchemy ORM in `backend/app/models/pricing.py`:

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

## Table Creation

The table is automatically created when the application starts via:
- `Base.metadata.create_all(bind=engine)` in `backend/main.py`
- `backend/scripts/init_admin.py` for initial setup

No manual migration is required - SQLAlchemy handles table creation automatically.

## Related Requirements

This schema satisfies:
- **Requirement 2.3**: Persist pricing changes to database
- **Requirement 4.1**: Maintain backward compatibility with PRICING_PLANS constant
- **Requirement 4.4**: Log pricing changes with timestamp and admin identifier
