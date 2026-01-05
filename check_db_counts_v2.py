import sqlite3
import os

DB_PATH = os.path.join("d:/PWORK/CEO-tracker/data", "adani-excel.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
try:
    c.execute("SELECT count(*) FROM commissioning_projects")
    print(f"Projects: {c.fetchone()[0]}")
    c.execute("SELECT count(*) FROM commissioning_summaries")
    print(f"Summaries: {c.fetchone()[0]}")
except Exception as e:
    print(f"Error: {e}")
conn.close()
