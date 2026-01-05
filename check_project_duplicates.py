import sqlite3
import os

DB_PATH = os.path.join("data", "adani-excel.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

print("Project Counts by Category:")
c.execute("SELECT category, count(*) FROM commissioning_projects GROUP BY category")
for r in c.fetchall():
    print(f"  {r[0]}: {r[1]}")

print("\nDuplicate Check (First 5):")
c.execute("SELECT project_name, plan_actual, count(*) FROM commissioning_projects GROUP BY project_name, plan_actual HAVING count(*) > 1 LIMIT 5")
for r in c.fetchall():
    print(f"  {r[0]} ({r[1]}): {r[2]} occurrences")

conn.close()
