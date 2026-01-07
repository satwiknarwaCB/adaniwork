import pandas as pd
import numpy as np

def extract_summary():
    df = pd.read_excel('AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx', sheet_name='Summary Linked', header=None)
    
    # Let's find rows with "Total" or "Subtotal"
    summaries = []
    for i, row in df.iterrows():
        row_str = " ".join([str(v) for v in row.values if pd.notna(v)])
        if 'Total' in row_str or 'Subtotal' in row_str or 'Achievement' in row_str:
            summaries.append((i, row_str, row.values))
            
    print(f"{'Row':<5} {'Label':<40} {'Calculated Values'}")
    print("-" * 100)
    for idx, label, vals in summaries:
        # Extract numeric values from the row
        nums = [v for v in vals if isinstance(v, (int, float)) and not np.isnan(v)]
        print(f"{idx:<5} {label[:40]:<40} {nums}")

if __name__ == "__main__":
    extract_summary()
