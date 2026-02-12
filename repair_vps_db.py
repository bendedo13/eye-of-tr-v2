import os
import sys
import sqlite3
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def repair_db():
    db_path = "/opt/faceseek/faceseek.db"
    if not os.path.exists(db_path):
        logger.error(f"Database not found at {db_path}")
        sys.exit(1)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Table definitions: (table_name, [(col_name, col_type, default_val)])
        schema_definition = [
            ("users", [
                ("tier", "TEXT", "'free'"),
                ("credits", "INTEGER", "1"),
                ("role", "TEXT", "'user'"),
                ("is_active", "BOOLEAN", "1"),
                ("referral_code", "TEXT", "NULL"),
                ("referred_by", "TEXT", "NULL"),
                ("referral_count", "INTEGER", "0"),
                ("alan_search_credits", "INTEGER", "1"),
                ("total_searches", "INTEGER", "0"),
                ("successful_searches", "INTEGER", "0"),
                ("last_search_at", "DATETIME", "NULL")
            ]),
            ("fi_sources", [
                ("crawl_config_json", "TEXT", "'{}'"),
                ("robots_txt_cached", "TEXT", "NULL"),
                ("robots_txt_fetched_at", "DATETIME", "NULL"),
                ("rate_limit_rpm", "INTEGER", "30"),
                ("rate_limit_concurrent", "INTEGER", "2"),
                ("schedule_cron", "TEXT", "NULL"),
                ("schedule_enabled", "BOOLEAN", "0"),
                ("total_images_found", "INTEGER", "0"),
                ("total_faces_indexed", "INTEGER", "0"),
                ("last_crawl_at", "DATETIME", "NULL"),
                ("last_crawl_status", "TEXT", "NULL"),
                ("crawl_state_json", "TEXT", "'{}'")
            ]),
            ("fi_proxies", [
                ("country", "TEXT", "NULL"),
                ("label", "TEXT", "NULL"),
                ("is_active", "BOOLEAN", "1"),
                ("last_check_at", "DATETIME", "NULL"),
                ("last_check_ok", "BOOLEAN", "NULL"),
                ("success_count", "INTEGER", "0"),
                ("fail_count", "INTEGER", "0"),
                ("avg_response_ms", "INTEGER", "NULL")
            ]),
            ("search_logs", [
                ("was_blurred", "BOOLEAN", "0"),
                ("credits_used", "INTEGER", "1"),
                ("providers_used", "TEXT", "NULL"),
                ("search_duration_ms", "INTEGER", "NULL")
            ])
        ]

        for table_name, columns in schema_definition:
            logger.info(f"Checking table: {table_name}")
            
            # Get existing columns
            cursor.execute(f"PRAGMA table_info({table_name})")
            existing_cols = [row[1] for row in cursor.fetchall()]
            
            if not existing_cols:
                logger.warning(f"Table {table_name} does not exist or has no columns yet. Skipping schema repair for it.")
                continue

            for col_name, col_type, default_val in columns:
                if col_name not in existing_cols:
                    logger.info(f"Adding column {col_name} to {table_name}")
                    try:
                        sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type} DEFAULT {default_val}"
                        cursor.execute(sql)
                        logger.info(f"Successfully added {col_name}")
                    except sqlite3.OperationalError as e:
                        logger.error(f"Failed to add {col_name} to {table_name}: {e}")
                else:
                    logger.debug(f"Column {col_name} already exists in {table_name}")

        conn.commit()
        conn.close()
        logger.info("Database repair completed successfully.")

    except Exception as e:
        logger.error(f"An error occurred during DB repair: {e}")
        sys.exit(1)

if __name__ == "__main__":
    repair_db()
