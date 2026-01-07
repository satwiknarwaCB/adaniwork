import pandas as pd
import os

file_path = r'd:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx'
df_dict = pd.read_excel(file_path, sheet_name=None, header=None)

for sheet, df in df_dict.items():
    print(f"\nCHECKING SHEET: {sheet}")
    header_found = False
    for i, row in df.iterrows():
        row_vals = [str(v).strip().lower() for v in row.values]
        has_name = any('project' in v and 'name' in v for v in row_vals)
        has_plan = any('plan' in v and ('actual' in v or 'status' in v) for v in row_vals)
        if has_name and has_plan:
            print(f"Found headers at row {i}!")
            print(f"Columns: {row_vals}")
            header_found = True
            break
    if not header_found:
        print("COULD NOT FIND HEADERS in this sheet.")
        # Print row 5-10 for inspection
        for i, row in df.iloc[5:15].iterrows():
            print(f"Row {i}: {[str(x) for x in row.values if pd.notna(x)]}")
