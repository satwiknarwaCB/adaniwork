import sqlite3
import os
import bcrypt
from typing import List, Any, Dict, Optional

# Database path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
DB_PATH = os.path.join(DB_DIR, 'adani-excel.db')

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Allows accessing columns by name
    return conn

def init_db():
    """Initializes the database tables if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:

        # --- Legacy Tables Removed ---

        # Users
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
        
        # Add role column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer'")
        except:
            pass  # Column already exists
        
        # Commissioning Projects
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS commissioning_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fiscal_year TEXT NOT NULL,
                sno INTEGER NOT NULL,
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
        
        # Add section and included_in_total columns if they don't exist
        try:
            cursor.execute("ALTER TABLE commissioning_projects ADD COLUMN section TEXT NOT NULL DEFAULT 'A'")
        except:
            pass
        try:
            cursor.execute("ALTER TABLE commissioning_projects ADD COLUMN included_in_total BOOLEAN DEFAULT TRUE")
        except:
            pass
        
        # Commissioning Summaries
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


        # --- Legacy Variables Removed ---



        # --- Legacy Indexes Removed ---
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_commissioning_projects_fiscal_year ON commissioning_projects(fiscal_year)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_commissioning_summaries_fiscal_year ON commissioning_summaries(fiscal_year)')

        # Create admin user if it doesn't exist
        admin_email = "admin@adani.com"
        admin_username = "adani"
        admin_password = "adani123456"
        
        # Check if admin user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
        existing_user = cursor.fetchone()
        
        if not existing_user:
            # Hash the password
            hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
            # Insert admin user with admin role
            cursor.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (admin_username, admin_email, hashed_password, 'admin')
            )
            print(f"Admin user created: {admin_email}")
        else:
            # Update existing admin user to have admin role
            cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (admin_email,))

        conn.commit()
        print("SQLite database initialized successfully")
    except Exception as e:
        print(f"Failed to initialize SQLite database: {e}")
    finally:
        conn.close()

# Initialize DB on module load (or call explicitly)
if __name__ == "__main__":
    init_db()