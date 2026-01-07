import pandas as pd
import os

file_path = r'd:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx'
df_dict = pd.read_excel(file_path, sheet_name='Summary Linked', header=None)

print("=== SUMMARY LINKED SHEET ANALYSIS ===\n")
for i, row in df_dict.head(50).iterrows():
    row_vals = [str(x).strip() if pd.notna(x) else '' for x in row.values]
    # Check for keywords
    has_total = any('total' in v.lower() for v in row_vals if v)
    has_plan = any('plan' in v.lower() for v in row_vals if v)
    has_actual = any('actual' in v.lower() for v in row_vals if v)
    has_rephase = any('rephase' in v.lower() for v in row_vals if v)
    
    # Filter to show only meaningful cells
    meaningful = [v for v in row_vals[:15] if v and v != 'nan']
    if meaningful:
        marker = ""
        if has_total: marker = " [TOTAL ROW - SKIP]"
        elif has_plan and not has_actual: marker = " [PLAN]"
        elif has_rephase: marker = " [REPHASE]"
        elif has_actual: marker = " [ACTUAL]"
        print(f"Row {i:2}: {meaningful}{marker}")
