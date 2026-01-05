import pandas as pd
import io

file_path = "d:/PWORK/CEO-tracker/AGEL FY 25-26 Commissioning Status_31-Dec-25(Summary Linked).csv"
df = pd.read_csv(file_path, header=None)

# Find row with "Khavda Solar Projects"
for idx, row in df.iterrows():
    row_str = " ".join([str(v) for v in row.values if pd.notna(v)])
    if "Khavda Solar Projects" in row_str:
        print(f"Found at row {idx}")
        for i, val in enumerate(row):
            if pd.notna(val):
                print(f"  Col {i}: '{val}'")
        break
