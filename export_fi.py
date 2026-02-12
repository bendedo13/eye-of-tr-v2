
import sqlite3
import os

def migrate():
    local_db = 'backend/faceseek.db'
    output_sql = 'fi_data_export.sql'
    
    if not os.path.exists(local_db):
        print(f"Local DB not found at {local_db}")
        return

    tables = ['fi_sources', 'fi_crawl_jobs', 'fi_images', 'fi_faces', 'fi_proxies']
    
    conn = sqlite3.connect(local_db)
    cursor = conn.cursor()
    
    with open(output_sql, 'w', encoding='utf-8') as f:
        f.write("PRAGMA foreign_keys=OFF;\n")
        f.write("BEGIN TRANSACTION;\n")
        
        for table in tables:
            # Get column names
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.execute(f"PRAGMA table_info({table})").fetchall()]
            col_str = ", ".join(columns)
            
            # Get data
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            print(f"Exporting {len(rows)} rows from {table}...")
            
            for row in rows:
                # Format row values for SQL
                values = []
                for val in row:
                    if val is None:
                        values.append("NULL")
                    elif isinstance(val, str):
                        # Escape single quotes
                        escaped = val.replace("'", "''")
                        values.append(f"'{escaped}'")
                    else:
                        values.append(str(val))
                
                val_str = ", ".join(values)
                f.write(f"INSERT INTO {table} ({col_str}) VALUES ({val_str});\n")
        
        f.write("COMMIT;\n")
        f.write("PRAGMA foreign_keys=ON;\n")
    
    conn.close()
    print(f"Export completed: {output_sql}")

if __name__ == "__main__":
    migrate()
