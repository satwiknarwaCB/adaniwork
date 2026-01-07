import pandas as pd
import os

file_path = r'd:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx'
df_dict = pd.read_excel(file_path, sheet_name=None, header=None)

for sheet, df in df_dict.items():
    print(f"\n--- SHEET: {sheet} ---")
    for i, row in df.head(20).iterrows():
        row_vals = [str(x).strip() for x in row.values if pd.notna(x)]
        if any('plan' in v.lower() for v in row_vals) and any('actual' in v.lower() for v in row_vals):
            print(f"Row {i} looks like a header: {row_vals}")
        elif any('project' in v.lower() for v in row_vals):
            print(f"Row {i} has 'project': {row_vals}")
