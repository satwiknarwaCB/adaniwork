import pandas as pd
import numpy as np

def verify_math_logic(file_path):
    # Read the sheet
    df = pd.read_excel(file_path, sheet_name='Summary Linked', header=None)
    
    # 1. Identify columns for months
    # We'll look for the header row first
    header_row_idx = -1
    for i, row in df.iterrows():
        row_str = " ".join([str(v) for v in row.values if pd.notna(v)])
        if 'Project Name' in row_str and 'Plan Actual' in row_str:
            header_row_idx = i
            break
            
    if header_row_idx == -1:
        print("Could not find header row.")
        return

    headers = df.iloc[header_row_idx].values
    print(f"Header row found at index {header_row_idx}")
    
    col_map = {}
    months = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 
              'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26']
    
    for i, h in enumerate(headers):
        h_str = str(h).strip()
        if h_str in months:
            col_map[h_str] = i
        elif 'total' in h_str.lower() and 'capacity' in h_str.lower():
            col_map['total_capacity'] = i
        elif 'q1' in h_str.lower(): col_map['q1'] = i
        elif 'q2' in h_str.lower(): col_map['q2'] = i
        elif 'q3' in h_str.lower(): col_map['q3'] = i
        elif 'q4' in h_str.lower(): col_map['q4'] = i
        elif 'cumm' in h_str.lower(): col_map['cumm'] = i
        elif 'capacity' in h_str.lower() and 'total' not in h_str.lower(): col_map['base_capacity'] = i

    print(f"Detected Column Mapping: {col_map}")

    # 2. Check a few data rows (Project Rows)
    print("\n--- Project Row Math Verification ---")
    rows_to_check = []
    for i in range(header_row_idx + 1, header_row_idx + 100):
        row_type = str(df.iloc[i, 6]).strip() # Col 6 is Plan Actual
        if row_type in ['Plan', 'Actual', 'Rephase / Fcst', 'Actual / Fcst']:
            rows_to_check.append(i)
            if len(rows_to_check) > 10: break

    for idx in rows_to_check:
        row = df.iloc[idx]
        row_type = str(row[6]).strip()
        project_name = str(df.iloc[idx-1, 1]) if pd.isna(row[1]) else str(row[1])
        
        # Monthly Sum
        month_vals = [float(row[col_map[m]]) if pd.notna(row[col_map[m]]) else 0 for m in months if m in col_map]
        monthly_sum = sum(month_vals)
        
        # Excel column values
        excel_total = float(row[col_map['total_capacity']]) if 'total_capacity' in col_map and pd.notna(row[col_map['total_capacity']]) else 0
        base_cap = float(row[col_map['base_capacity']]) if 'base_capacity' in col_map and pd.notna(row[col_map['base_capacity']]) else 0
        
        print(f"Row {idx} | Type: {row_type:<10} | Project: {project_name[:20]:<20}")
        print(f"  - Sum of Months: {monthly_sum:.2f}")
        print(f"  - Total Capacity Column: {excel_total:.2f}")
        print(f"  - Base Capacity Column: {base_cap:.2f}")
        
        if 'Actual' in row_type:
            print(f"  - Verification: Total Capacity == Sum of Months? {'MATCH' if abs(monthly_sum - excel_total) < 0.1 else 'MISMATCH'}")
        else:
            print(f"  - Verification: Total Capacity == Base Capacity? {'MATCH' if abs(base_cap - excel_total) < 0.1 else 'MISMATCH'}")
        
    # 3. Check Subtotals
    print("\n--- Subtotal/Summary Row Math Verification ---")
    summary_rows = []
    for i, row in df.iterrows():
        row_str = str(row[1]).lower() if pd.notna(row[1]) else ""
        if 'total' in row_str or 'subtotal' in row_str:
            summary_rows.append(i)

    for idx in summary_rows[:5]:
        row = df.iloc[idx]
        label = str(row[1])
        excel_total = float(row[col_map['total_capacity']]) if 'total_capacity' in col_map and pd.notna(row[col_map['total_capacity']]) else 0
        month_vals = [float(row[col_map[m]]) if pd.notna(row[col_map[m]]) else 0 for m in months if m in col_map]
        monthly_sum = sum(month_vals)
        print(f"Row {idx} | Label: {label:<40}")
        print(f"  - Sum of Months: {monthly_sum:.2f} | Total Col: {excel_total:.2f}")
        print(f"  - Internal Verification: {'MATCH' if abs(monthly_sum - excel_total) < 0.5 else 'MISMATCH'}")

if __name__ == "__main__":
    verify_math_logic('AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx')
