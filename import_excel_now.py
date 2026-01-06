import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from excel_parser import parse_excel_workbook, import_projects_to_db

excel_path = r'd:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx'

print(f"Reading Excel file: {excel_path}")
with open(excel_path, 'rb') as f:
    data = f.read()

print("Parsing Excel...")
result = parse_excel_workbook(data, 'Summary Linked')

projects = result.get('projects', [])
summaries = result.get('summaries', [])

print(f"Parsed {len(projects)} project rows")
print(f"Parsed {len(summaries)} summary rows")

if projects:
    print("\nSample project:")
    print(projects[0])

print("\nImporting to database with fiscal_year = 'FY_25-26'...")
import_result = import_projects_to_db(projects, summaries, 'FY_25-26')
print(f"Import result: {import_result}")
