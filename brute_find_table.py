
import sqlite3
import os

def find_missing_table():
    db_paths = [
        'backend/faceseek.db',
        'faceseek.db',
        'backend/test.db',
        'backend/test_trace.db'
    ]
    
    target_count = 11073
    
    for path in db_paths:
        if not os.path.exists(path):
            continue
            
        print(f"Checking {path}...")
        try:
            conn = sqlite3.connect(path)
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [t[0] for t in cur.fetchall()]
            
            for t in tables:
                try:
                    cur.execute(f"SELECT COUNT(*) FROM {t}")
                    count = cur.fetchone()[0]
                    if count == target_count or (target_count - 100 < count < target_count + 100):
                        print(f"!!! FOUND POTENTIAL TABLE: {t} in {path} with {count} rows")
                        # Show schema
                        cur.execute(f"PRAGMA table_info({t})")
                        print(f"Schema: {cur.fetchall()}")
                except:
                    pass
            conn.close()
        except:
            pass

if __name__ == "__main__":
    find_missing_table()
