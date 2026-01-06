
import sqlite3
import os

db_path = r'd:\PWORK\CEO-tracker\data\adani-excel.db'
if not os.path.exists(db_path):
    print(f"Error: DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update projects
cursor.execute("UPDATE commissioning_projects SET fiscal_year = 'FY_25-26'")
p_count = cursor.rowcount
print(f"Updated {p_count} projects to FY_25-26")

# Update summaries
cursor.execute("UPDATE commissioning_summaries SET fiscal_year = 'FY_25-26'")
s_count = cursor.rowcount
print(f"Updated {s_count} summaries to FY_25-26")

conn.commit()
conn.close()
print("Success!")
