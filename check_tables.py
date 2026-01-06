import sqlite3

def check():
    conn = sqlite3.connect(r'd:/PWORK/CEO-tracker/data/adani-excel.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables: {tables}")
    
    for table in ['dropdown_options', 'location_relationships']:
        if table in tables:
            cursor.execute(f"SELECT * FROM {table} LIMIT 1")
            print(f"{table} sample: {cursor.fetchone()}")
        else:
            print(f"{table} does NOT exist.")
    conn.close()

if __name__ == "__main__":
    check()
