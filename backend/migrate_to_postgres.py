"""
Migration script to transfer data from SQLite to PostgreSQL.
Run this script after:
1. Docker PostgreSQL is running
2. .env has USE_POSTGRES=true
"""

import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# SQLite connection
SQLITE_DB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'adani-excel.db')
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/adani_tracker")


def migrate():
    print(f"SQLite source: {SQLITE_DB}")
    print(f"PostgreSQL target: {POSTGRES_URL.split('@')[1] if '@' in POSTGRES_URL else POSTGRES_URL}")
    
    if not os.path.exists(SQLITE_DB):
        print("SQLite database not found. Nothing to migrate.")
        return
    
    # Connect to both databases
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()
    
    try:
        pg_conn = psycopg2.connect(POSTGRES_URL)
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        print("\nMake sure Docker is running with: docker-compose up -d")
        return
    
    tables = ['users', 'commissioning_projects', 'commissioning_summaries']
    
    for table in tables:
        print(f"\nMigrating {table}...")
        
        try:
            # Get data from SQLite
            sqlite_cur.execute(f"SELECT * FROM {table}")
            rows = sqlite_cur.fetchall()
            
            if not rows:
                print(f"  No data in {table}")
                continue
            
            # Get column names
            columns = [desc[0] for desc in sqlite_cur.description]
            cols_str = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))
            
            # Clear existing data in PostgreSQL
            pg_cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
            
            # Insert data
            inserted = 0
            for row in rows:
                values = []
                for col in columns:
                    val = row[col]
                    # Handle password bytes
                    if col == 'password' and isinstance(val, bytes):
                        val = val.decode('utf-8')
                    values.append(val)
                
                query = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders})"
                try:
                    pg_cur.execute(query, tuple(values))
                    inserted += 1
                except Exception as e:
                    print(f"  Error inserting row: {e}")
            
            print(f"  Migrated {inserted} rows")
            
        except Exception as e:
            print(f"  Error migrating {table}: {e}")
    
    pg_conn.commit()
    print("\n✅ Migration complete!")
    
    sqlite_conn.close()
    pg_conn.close()


if __name__ == "__main__":
    migrate()
