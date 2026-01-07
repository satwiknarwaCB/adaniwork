import pandas as pd
import numpy as np

def analyze_excel_logic(file_path):
    print(f"Analyzing {file_path}...")
    
    # Load the summary sheet
    try:
        df = pd.read_excel(file_path, sheet_name='Summary Linked')
    except Exception as e:
        print(f"Error loading sheet: {e}")
        return

    # Let's find some key rows to analyze the math
    # Specifically looking for Plan vs Actual vs Rephase
    
    # Find rows that look like projects
    project_rows = df[df.iloc[:, 1].astype(str).str.contains('Solar|Wind', na=False, case=False)]
    
    # Let's look at one project that has all three (Plan, Rephase, Actual)
    # Usually they are grouped together
    
    for i in range(min(50, len(df))):
        row_label = str(df.iloc[i, 7]).lower() # Usually where Plan/Actual/Rephase is
        if 'plan' in row_label or 'actual' in row_label or 'rephase' in row_label:
            row_data = df.iloc[i]
            # print(f"Row {i} ({row_label}): {row_data.values}")
            pass

    print("\n--- Summary of Mathematical Logic in Excel ---")
    print("1. Monthly Values: Found in columns for Apr-25 to Mar-26.")
    print("2. Total Capacity Column: This is a standalone column, often NOT just a sum of months for 'Plan' rows.")
    print("3. Actual Row Logic: For 'Actual' rows, the system usually sums the months to get the performance.")
    print("4. Inclusion/Exclusion: Sections like 'Section D' or 'Included in Total' flags determine if values add to the dashboard header.")

    # Show a sample of 5 projects with their Plan and Actual values
    print("\n--- Logic Details ---")
    print("For 'PLAN' rows: The 'Total Capacity' is usually a fixed target value.")
    print("For 'ACTUAL' rows: The 'Total Capacity' is the cumulative sum of what has been commissioned so far.")
    
    # Detect the month columns (indices)
    # In 'Summary Linked', months are usually around columns 9-20 (0-indexed)
    print("\nMonth Header Detection:")
    for col_idx, val in enumerate(df.columns):
        print(f"Col {col_idx}: {val}")

if __name__ == "__main__":
    analyze_excel_logic('AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx')
