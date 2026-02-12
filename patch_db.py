
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL env var not set")
        sys.exit(1)
    
    # SQLite fix (remove postgres handling just in case, or keep it generic)
    if "@postgres" in db_url:
        db_url = db_url.replace("@postgres", "@127.0.0.1")
        
    print(f"Connecting to {db_url}...")
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Columns to add: name, type, default
            columns = [
                ("successful_searches", "INTEGER", "0"),
                ("total_searches", "INTEGER", "0"),
                ("alan_search_credits", "INTEGER", "1")
            ]
            
            for col_name, col_type, default_val in columns:
                try:
                    print(f"Adding {col_name}...")
                    # SQLite doesn't support IF NOT EXISTS in older versions
                    # Postgres does, but we can catch error for both
                    if "sqlite" in db_url:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type} DEFAULT {default_val}"))
                    else:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type} DEFAULT {default_val}"))
                    conn.commit()
                    print(f"Added {col_name}")
                except OperationalError as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print(f"Column {col_name} already exists. Skipping.")
                    else:
                        print(f"Error adding {col_name}: {e}")
                        # Don't exit, try next column
                        
        print("Schema Patch Completed")
    except Exception as e:
        print(f"Critical Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
