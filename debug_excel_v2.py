import pandas as pd

file_path = r'd:\PWORK\CEO-tracker\AGEL_Commissioning_Single_Sheet.xlsx'
df = pd.read_excel(file_path, header=None)

with open('excel_detailed.txt', 'w') as f:
    for i in range(10):
        f.write(f"Row {i}:\n")
        f.write(str(df.iloc[i].tolist()))
        f.write("\n\n")
