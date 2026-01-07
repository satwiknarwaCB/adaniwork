import pandas as pd
import os

file_path = r'd:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx'
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

df_dict = pd.read_excel(file_path, sheet_name=None, header=None)
for sheet, df in df_dict.items():
    print(f"\n--- Sheet: {sheet} ---")
    print(f"Shape: {df.shape}")
    for i, row in df.head(30).iterrows():
        row_vals = [str(x).strip() for x in row.values if pd.notna(x)]
        if row_vals:
            print(f"Row {i:2}: {row_vals}")
