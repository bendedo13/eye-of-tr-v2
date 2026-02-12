
import sqlite3
import os

def check_counts():
    db_path = 'backend/faceseek.db'
    if not os.path.exists(db_path):
        print(f"File not found: {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cur.fetchall()]
    
    results = []
    for t in tables:
        cur.execute(f"SELECT count(*) FROM {t}")
        count = cur.fetchone()[0]
        results.append((t, count))
        
    # Sort by count descending
    results.sort(key=lambda x: x[1], reverse=True)
    for t, c in results:
        print(f"{t}: {c}")
    conn.close()

if __name__ == "__main__":
    check_counts()
