import os
import bcrypt
from typing import List, Any, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Configuration
USE_POSTGRES = os.getenv("USE_POSTGRES", "false").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/adani_tracker")

# SQLite path (fallback)
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
DB_PATH = os.path.join(DB_DIR, 'adani-excel.db')

if USE_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    print(f"Database mode: PostgreSQL ({DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'})")
else:
    import sqlite3
    print(f"Database mode: SQLite ({DB_PATH})")


def get_db_connection():
    """Establishes a connection to the database (PostgreSQL or SQLite)."""
    if USE_POSTGRES:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            return conn
        except Exception as e:
            print(f"Error connecting to PostgreSQL: {e}")
            raise e
    else:
        if not os.path.exists(DB_DIR):
            os.makedirs(DB_DIR)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    """Initializes the database tables if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if USE_POSTGRES:
            # PostgreSQL Tables
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role VARCHAR(50) DEFAULT 'viewer',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS commissioning_projects (
                    id SERIAL PRIMARY KEY,
                    fiscal_year VARCHAR(50) NOT NULL,
                    sno INTEGER,
                    project_name TEXT NOT NULL,
                    spv TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    plot_location TEXT NOT NULL,
                    capacity REAL,
                    plan_actual TEXT NOT NULL,
                    apr REAL,
                    may REAL,
                    jun REAL,
                    jul REAL,
                    aug REAL,
                    sep REAL,
                    oct REAL,
                    nov REAL,
                    dec REAL,
                    jan REAL,
                    feb REAL,
                    mar REAL,
                    total_capacity REAL,
                    cumm_till_oct REAL,
                    q1 REAL,
                    q2 REAL,
                    q3 REAL,
                    q4 REAL,
                    category TEXT NOT NULL,
                    section TEXT NOT NULL DEFAULT 'A',
                    included_in_total BOOLEAN DEFAULT TRUE,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS commissioning_summaries (
                    id SERIAL PRIMARY KEY,
                    fiscal_year VARCHAR(50) NOT NULL,
                    category TEXT NOT NULL,
                    summary_type TEXT NOT NULL,
                    apr REAL,
                    may REAL,
                    jun REAL,
                    jul REAL,
                    aug REAL,
                    sep REAL,
                    oct REAL,
                    nov REAL,
                    dec REAL,
                    jan REAL,
                    feb REAL,
                    mar REAL,
                    total REAL,
                    cumm_till_oct REAL,
                    q1 REAL,
                    q2 REAL,
                    q3 REAL,
                    q4 REAL,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cp_fiscal_year ON commissioning_projects(fiscal_year)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cs_fiscal_year ON commissioning_summaries(fiscal_year)')
            
            # Admin user
            cursor.execute("SELECT id FROM users WHERE email = %s", ("admin@adani.com",))
            if not cursor.fetchone():
                hashed = bcrypt.hashpw("adani123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                cursor.execute(
                    "INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, %s)",
                    ("adani", "admin@adani.com", hashed, "admin")
                )
                print("Admin user created: admin@adani.com")
            
            conn.commit()
            print("PostgreSQL database initialized successfully")
            
        else:
            # SQLite Tables
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'viewer',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer'")
            except:
                pass
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS commissioning_projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fiscal_year TEXT NOT NULL,
                    sno INTEGER,
                    project_name TEXT NOT NULL,
                    spv TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    plot_location TEXT NOT NULL,
                    capacity REAL,
                    plan_actual TEXT NOT NULL,
                    apr REAL,
                    may REAL,
                    jun REAL,
                    jul REAL,
                    aug REAL,
                    sep REAL,
                    oct REAL,
                    nov REAL,
                    dec REAL,
                    jan REAL,
                    feb REAL,
                    mar REAL,
                    total_capacity REAL,
                    cumm_till_oct REAL,
                    q1 REAL,
                    q2 REAL,
                    q3 REAL,
                    q4 REAL,
                    category TEXT NOT NULL,
                    section TEXT NOT NULL DEFAULT 'A',
                    included_in_total BOOLEAN DEFAULT TRUE,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            try:
                cursor.execute("ALTER TABLE commissioning_projects ADD COLUMN section TEXT NOT NULL DEFAULT 'A'")
            except:
                pass
            try:
                cursor.execute("ALTER TABLE commissioning_projects ADD COLUMN included_in_total BOOLEAN DEFAULT TRUE")
            except:
                pass
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS commissioning_summaries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fiscal_year TEXT NOT NULL,
                    category TEXT NOT NULL,
                    summary_type TEXT NOT NULL,
                    apr REAL,
                    may REAL,
                    jun REAL,
                    jul REAL,
                    aug REAL,
                    sep REAL,
                    oct REAL,
                    nov REAL,
                    dec REAL,
                    jan REAL,
                    feb REAL,
                    mar REAL,
                    total REAL,
                    cumm_till_oct REAL,
                    q1 REAL,
                    q2 REAL,
                    q3 REAL,
                    q4 REAL,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_commissioning_projects_fiscal_year ON commissioning_projects(fiscal_year)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_commissioning_summaries_fiscal_year ON commissioning_summaries(fiscal_year)')
            
            # Admin user
            cursor.execute("SELECT id FROM users WHERE email = ?", ("admin@adani.com",))
            if not cursor.fetchone():
                hashed = bcrypt.hashpw("adani123456".encode('utf-8'), bcrypt.gensalt())
                cursor.execute(
                    "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                    ("adani", "admin@adani.com", hashed, "admin")
                )
                print("Admin user created: admin@adani.com")
            else:
                cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", ("admin@adani.com",))
            
            conn.commit()
            print("SQLite database initialized successfully")
            
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
