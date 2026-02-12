
import sqlite3
import os

def check_db(path):
    if not os.path.exists(path):
        return
    print(f"\n--- Checking {path} ({os.path.getsize(path)/1024:.1f} KB) ---")
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cur.fetchall()]
        for t in tables:
            cur.execute(f"SELECT count(*) FROM {t}")
            count = cur.fetchone()[0]
            if count > 0:
                print(f"{t}: {count}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db('backend/faceseek.db')
    check_db('faceseek.db')
    check_db('c:/Users/Asus/Desktop/eye-of-tr/backend/faceseek.db')
    check_db('c:/Users/Asus/Desktop/eye-of-tr-clean/backend/faceseek.db')
