
import sqlite3
import os
import json

def inspect():
    db_path = '/opt/faceseek/backend/faceseek.db'
    if not os.path.exists(db_path):
        print('DB not found')
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]
    print(f'Tables: {tables}')
    
    for t in ['dp_documents', 'fi_faces', 'fi_images', 'fi_sources', 'users']:
        if t in tables:
            cur.execute(f'SELECT COUNT(*) FROM {t}')
            print(f'{t}: {cur.fetchone()[0]} rows')
    
    # Check for Acun in dp_documents
    if 'dp_documents' in tables:
        cur.execute("SELECT title, url FROM dp_documents WHERE title LIKE '%Acun%' OR content_text LIKE '%Acun%' LIMIT 5")
        print(f'Acun in dp_documents: {cur.fetchall()}')
        
    # Check for a face_id from meta.json in the DB
    meta_path = '/opt/faceseek/backend/dataset/faiss_index/face_index.meta.json'
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            meta = json.load(f)
            sample_ids = meta.get('face_ids', [])[:5]
            print(f'Sample IDs from meta: {sample_ids}')
            
            if 'fi_faces' in tables:
                for fid in sample_ids:
                    cur.execute("SELECT id FROM fi_faces WHERE face_id = ?", (fid,))
                    res = cur.fetchone()
                    print(f'ID {fid} in fi_faces: {res is not None}')

    conn.close()

if __name__ == '__main__':
    inspect()
