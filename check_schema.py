import sqlite3

def check():
    conn = sqlite3.connect(r'd:/PWORK/CEO-tracker/data/adani-excel.db')
    cursor = conn.cursor()
    
    for table in ['dropdown_options', 'location_relationships']:
        cursor.execute(f"PRAGMA table_info({table})")
        info = cursor.fetchall()
        print(f"Table {table}:")
        for col in info:
            print(f"  {col}")
        
    conn.close()

if __name__ == "__main__":
    check()
