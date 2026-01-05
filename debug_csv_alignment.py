import pandas as pd
import io
import sys

# Mock SUMMARY_COLS
SUMMARY_COLS = {
    'sno': 1, 'project_name': 2, 'spv': 3, 'type': 4, 'plot_location': 5, 
    'capacity': 6, 'project_type': 7, 'plan_actual': 8,
    'apr': 9, 'may': 10, 'jun': 11, 'jul': 12, 'aug': 13, 'sep': 14,
    'oct': 15, 'nov': 16, 'dec': 17, 'jan': 18, 'feb': 19, 'mar': 20,
    'total_capacity': 21, 'cumm_till_oct': 22, 'q1': 24, 'q2': 25, 'q3': 26, 'q4': 27
}

file_path = "d:/PWORK/CEO-tracker/AGEL FY 25-26 Commissioning Status_31-Dec-25(Summary Linked).csv"
try:
    df = pd.read_csv(file_path, header=None)
    print(f"Columns: {len(df.columns)}")
    print(f"Rows: {len(df)}")
    
    # Check row 34 (likely Solar section)
    row_34 = df.iloc[33] 
    print(f"Row 34 text: {row_34.iloc[1]}")
    
    # Check a project row
    # Search for ARE45L
    for idx, row in df.iterrows():
        if "ARE45L" in str(row.values):
            print(f"Found ARE45L at row {idx}")
            print(f"Col 8 (Plan/Actual): {row.iloc[8]}")
            print(f"Col 2 (Project Name): {row.iloc[2]}")
            break
except Exception as e:
    print(f"Error: {e}")
