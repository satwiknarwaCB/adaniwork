import pandas as pd
import numpy as np

def verify_specific_rows():
    df = pd.read_excel('AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx', sheet_name='Summary Linked', header=None)
    
    # Check Row 36 (usually a Plan row)
    row_plan = df.iloc[36]
    row_actual = df.iloc[38]
    
    def analyze(row, label):
        print(f"\n--- Analysis for {label} (Row {row.name}) ---")
        print(f"Project: {row[2]} | Type: {row[8]}")
        
        # Monthly Sum (Cols 9-20)
        months = [float(v) if pd.notna(v) and isinstance(v, (int, float)) else 0 for v in row[9:21]]
        m_sum = sum(months)
        
        # Extracted Columns
        total_cap_col = float(row[21]) if pd.notna(row[21]) else 0
        base_cap = float(row[6]) if pd.notna(row[6]) else 0
        q1 = float(row[24]) if pd.notna(row[24]) else 0
        q2 = float(row[25]) if pd.notna(row[25]) else 0
        q3 = float(row[26]) if pd.notna(row[26]) else 0
        q4 = float(row[27]) if pd.notna(row[27]) else 0
        q_sum = q1 + q2 + q3 + q4
        
        print(f"Base Capacity (Col 6): {base_cap}")
        print(f"Monthly Sum (9-20):    {m_sum}")
        print(f"Quarterly Sum (24-27): {q_sum}")
        print(f"Total Capacity (Col 21): {total_cap_col}")
        
        if 'Plan' in str(row[8]):
            print(f"Logic: Total Capacity uses BASE capacity? {'YES' if abs(base_cap - total_cap_col) < 0.1 else 'NO'}")
        else:
            print(f"Logic: Total Capacity uses MONTHLY sum? {'YES' if abs(m_sum - total_cap_col) < 0.1 else 'NO'}")

    analyze(row_plan, "Plan Row")
    analyze(row_actual, "Actual Row")

if __name__ == "__main__":
    verify_specific_rows()
