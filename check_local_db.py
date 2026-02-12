
import sqlite3
import os

def check_db():
    db_path = 'backend/faceseek.db'
    if not os.path.exists(db_path):
        print("DB not found")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # List all tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]
    print(f"Tables index ({len(tables)} total):")
    print(sorted(tables))
    
    # Check for fi_ tables
    fi_tables = [t for t in tables if t.startswith('fi_')]
    print(f"FI tables: {fi_tables}")
    
    # Check unlimited users
    cur.execute("SELECT email, tier, credits FROM users WHERE tier = 'unlimited' OR credits > 100000 LIMIT 5")
    users = cur.fetchall()
    print(f"Unlimited users sample: {users}")
    
    # Search for Acun in any table?
    for table in tables:
        try:
            cur.execute(f"PRAGMA table_info({table})")
            cols = [c[1] for c in cur.fetchall()]
            text_cols = [c for c in cols if 'name' in c or 'title' in c or 'content' in c or 'extracted' in c]
            
            if text_cols:
                for col in text_cols:
                    cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {col} LIKE '%Acun%'")
                    count = cur.fetchone()[0]
                    if count > 0:
                        print(f"FOUND 'Acun' in {table}.{col}: {count} matches")
        except Exception as e:
            continue

    conn.close()

if __name__ == "__main__":
    check_db()
