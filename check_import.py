import pandas as pd
import sys
sys.path.insert(0, 'd:/PWORK/CEO-tracker/backend')

from excel_parser import parse_excel_workbook

file_path = r'd:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx'

with open(file_path, 'rb') as f:
    content = f.read()

result = parse_excel_workbook(content, file_path)

print("="*80)
print(f"TOTAL PROJECTS: {len(result['projects'])}")
print("="*80)

# Count by category and section
from collections import Counter
cat_sec = Counter()
for p in result['projects']:
    cat_sec[(p['category'], p['section'], p['included_in_total'])] += 1

print("\nBy Category/Section/Included:")
for (cat, sec, inc), count in sorted(cat_sec.items()):
    inc_str = "INCLUDED" if inc else "EXCLUDED"
    print(f"  {cat:<40} | Section {sec} | {inc_str:<10} | {count} rows")

# Show sample project with values
print("\n" + "="*80)
print("SAMPLE PROJECT (First from A. Khavda Solar):")
for p in result['projects']:
    if p['section'] == 'A' and 'Khavda Solar' in p['category']:
        print(f"  Name: {p['project_name']}")
        print(f"  SPV: {p['spv']}")
        print(f"  Type: {p['project_type']}")
        print(f"  Location: {p['plot_location']}")
        print(f"  Capacity: {p['capacity']}")
        print(f"  Status: {p['plan_actual']}")
        print(f"  Monthly: Apr={p['apr']}, May={p['may']}, Jun={p['jun']}")
        break
