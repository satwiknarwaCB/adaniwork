import sqlite3
import os

DB_PATH = os.path.join("data", "adani-excel.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("Deep Analysis of 'AGEL Merchant':")
c.execute("SELECT project_name, spv, plan_actual, section, category, capacity FROM commissioning_projects WHERE project_name LIKE '%AGEL Merchant%'")
for r in c.fetchall():
    print(f"  {r}")

conn.close()
