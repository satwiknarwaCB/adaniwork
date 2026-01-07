import pandas as pd
import numpy as np

def inspect_excel_structure(file_path):
    df = pd.read_excel(file_path, sheet_name='Summary Linked', header=None)
    
    # Header row is around 30
    header_idx = 30
    header = df.iloc[header_idx]
    
    print("--- Column Headers ---")
    for i, v in enumerate(header):
        print(f"Col {i}: {v}")
        
    # Pick a project (e.g., Khavda Solar Section A)
    # Usually starts shortly after header
    print("\n--- Sample Project Data (Rows 35-40) ---")
    print(df.iloc[35:45, :10].to_string())
    
    # Check Math for Row 36 (Total Capacity)
    print("\n--- Math Check for Row 36 ---")
    row_36 = df.iloc[36]
    print(f"Project/Type: {row_36[1]} / {row_36[6]}")
    # Months are likely Cols 8-19
    months_sum = sum([float(v) if pd.notna(v) else 0 for v in row_36[8:20]])
    total_cap_col = row_36[21] # Based on previous output
    print(f"Sum of monthly columns (8-19): {months_sum}")
    print(f"Total Capacity Column (21): {total_cap_col}")
    print(f"Capacity Column (5): {row_36[5]}")

if __name__ == "__main__":
    inspect_excel_structure('AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx')
