
import sqlite3
import os

def stats():
    db_path = 'backend/faceseek.db'
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]
    
    results = []
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        results.append((t, cur.fetchone()[0]))
    
    results.sort(key=lambda x: x[1], reverse=True)
    for t, count in results:
        print(f"{t}: {count} rows")
    
    # Sample dp_documents to see if face IDs are there
    if 'dp_documents' in tables:
        cur.execute("SELECT extracted_json FROM dp_documents LIMIT 5")
        for row in cur.fetchall():
            print(f"dp_doc sample: {row[0][:200]}...")

    conn.close()

if __name__ == "__main__":
    stats()
