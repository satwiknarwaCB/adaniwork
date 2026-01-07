import sys
sys.path.insert(0, 'd:/PWORK/CEO-tracker/backend')

from excel_parser import parse_excel_workbook, import_projects_to_db

# Read Excel file
with open('d:/PWORK/CEO-tracker/AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx', 'rb') as f:
    content = f.read()

# Parse
result = parse_excel_workbook(content, 'test.xlsx')
print(f"Parsed {len(result['projects'])} projects")

# Import to database
r = import_projects_to_db(result['projects'], fiscal_year='FY_25-26')
print(f"Import result: {r}")

# Verify
import sqlite3
conn = sqlite3.connect('d:/PWORK/CEO-tracker/data/adani-excel.db')
c = conn.cursor()
c.execute('SELECT COUNT(*) FROM commissioning_projects')
print(f"Projects now in DB: {c.fetchone()[0]}")

# Show sample
c.execute('SELECT project_name, plan_actual, category, apr, may, jun FROM commissioning_projects LIMIT 5')
for row in c.fetchall():
    print(row)
conn.close()
