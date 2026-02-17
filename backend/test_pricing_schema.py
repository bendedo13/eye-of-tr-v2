#!/usr/bin/env python3
"""
Test script to verify pricing_overrides table schema
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import inspect
from app.db.database import get_engine, Base
from app.models.pricing import PricingOverride

def test_pricing_schema():
    """Verify the pricing_overrides table schema"""
    print("Testing pricing_overrides table schema...\n")
    
    # Create tables
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    
    # Inspect the table
    inspector = inspect(engine)
    
    if "pricing_overrides" not in inspector.get_table_names():
        print("✗ Table 'pricing_overrides' was not created!")
        return False
    
    print("✓ Table 'pricing_overrides' exists")
    
    # Check columns
    columns = inspector.get_columns("pricing_overrides")
    column_names = [col["name"] for col in columns]
    
    expected_columns = [
        "id", "plan_id", "price_try", "price_usd", "credits",
        "search_normal", "search_detailed", "search_location",
        "updated_by", "updated_at"
    ]
    
    print("\nColumns found:")
    for col in columns:
        nullable = "NULL" if col["nullable"] else "NOT NULL"
        print(f"  - {col['name']}: {col['type']} ({nullable})")
    
    print("\nValidating columns:")
    for expected in expected_columns:
        if expected in column_names:
            print(f"  ✓ {expected}")
        else:
            print(f"  ✗ {expected} - MISSING!")
            return False
    
    # Check indexes
    indexes = inspector.get_indexes("pricing_overrides")
    print("\nIndexes:")
    for idx in indexes:
        print(f"  - {idx['name']}: {idx['column_names']} (unique={idx['unique']})")
    
    # Check foreign keys
    foreign_keys = inspector.get_foreign_keys("pricing_overrides")
    print("\nForeign Keys:")
    for fk in foreign_keys:
        print(f"  - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
    
    # Verify unique constraint on plan_id
    has_plan_id_unique = any(
        idx["unique"] and "plan_id" in idx["column_names"]
        for idx in indexes
    )
    
    if has_plan_id_unique:
        print("\n✓ Unique constraint on plan_id exists")
    else:
        print("\n✗ Unique constraint on plan_id is MISSING!")
        return False
    
    # Verify foreign key to users table
    has_user_fk = any(
        fk["referred_table"] == "users" and "updated_by" in fk["constrained_columns"]
        for fk in foreign_keys
    )
    
    if has_user_fk:
        print("✓ Foreign key to users table exists")
    else:
        print("✗ Foreign key to users table is MISSING!")
        return False
    
    print("\n" + "="*60)
    print("✓ All schema validations passed!")
    print("="*60)
    return True

if __name__ == "__main__":
    try:
        success = test_pricing_schema()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
