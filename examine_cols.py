import pandas as pd

df = pd.read_excel('d:/PWORK/CEO-tracker/AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx', 
                   sheet_name='Summary Linked', header=None)

# Find header row
for i, row in df.iterrows():
    row_str = ' '.join([str(x).lower() for x in row.values if pd.notna(x)])
    if 's. no' in row_str or 's.no' in row_str:
        print(f"HEADER ROW {i}:")
        for j, val in enumerate(row.values):
            if pd.notna(val):
                print(f"  Col {j}: {val}")
        
        # Show next few data rows
        print(f"\nDATA ROWS:")
        for k in range(i+1, min(i+6, len(df))):
            data_row = df.iloc[k]
            print(f"\nRow {k}:")
            for j, val in enumerate(data_row.values[:15]):
                if pd.notna(val):
                    print(f"  Col {j}: {val}")
        break
