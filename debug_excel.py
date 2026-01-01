import pandas as pd
import json

file_path = r'd:\PWORK\CEO-tracker\AGEL_Commissioning_Single_Sheet.xlsx'
df = pd.read_excel(file_path)

with open('excel_info.txt', 'w') as f:
    f.write("Columns:\n")
    f.write(str(df.columns.tolist()))
    f.write("\n\nFirst Row:\n")
    f.write(str(df.iloc[0].to_dict()))
    
    # Check for specific strings
    f.write("\n\nHeaders mapping check:\n")
    cols = [str(c).strip() for c in df.columns]
    f.write(f"Has 'Project Name': {'Project Name' in cols}\n")
    f.write(f"Has 'Capacity Type': {'Capacity Type' in cols}\n")
    f.write(f"Has 'Apr-25': {'Apr-25' in cols}\n")
