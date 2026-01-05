import pandas as pd
import io
import sys
from typing import Dict, List, Any, Optional

# Mock the parser logic exactly
SUMMARY_COLS = {
    'sno': 1, 'project_name': 2, 'spv': 3, 'type': 4, 'plot_location': 5, 
    'capacity': 6, 'project_type': 7, 'plan_actual': 8,
    'apr': 9, 'may': 10, 'jun': 11, 'jul': 12, 'aug': 13, 'sep': 14,
    'oct': 15, 'nov': 16, 'dec': 17, 'jan': 18, 'feb': 19, 'mar': 20,
    'total_capacity': 21, 'cumm_till_oct': 22, 'q1': 24, 'q2': 25, 'q3': 26, 'q4': 27
}

SECTION_MARKERS = {
    'A. Khavda Solar Projects': ('Khavda Solar', 'A', True),
    'B. Rajasthan Solar Projects': ('Rajasthan Solar', 'B', True),
    'C. Rajasthan Solar Projects (Additional': ('Rajasthan Solar Additional 500MW', 'C', True),
    'D1. Khavda Solar (Copper': ('Khavda Solar Copper+Merchant 50MW', 'D1', False),
    'D2. Khavda Solar (Additional': ('Khavda Solar Internal 650MW', 'D2', False),
    'A. Khavda Wind Projects': ('Khavda Wind', 'A', True),
    'B. Khavda Wind (Additional': ('Khavda Wind Internal 421MW', 'B', False),
    'C. Mundra Wind': ('Mundra Wind 76MW', 'C', True),
    'D. Mundra Wind': ('Mundra Wind Internal 224.4MW', 'D', False),
}

def safe_float(value):
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        if isinstance(value, str):
            value = value.replace(',', '').replace('%', '').strip()
        return float(value)
    except:
        return None

file_path = "d:/PWORK/CEO-tracker/AGEL FY 25-26 Commissioning Status_31-Dec-25(Summary Linked).csv"
df = pd.read_csv(file_path, header=None)

projects = []
current_category = None
current_section = None

for idx, row in df.iterrows():
    text_1 = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ''
    text_0 = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''
    row_text = f"{text_0} {text_1}"
    
    for marker, (cat, sec, inc) in SECTION_MARKERS.items():
        if marker in row_text:
            current_category = cat
            current_section = sec
            print(f"Found Section {cat} at row {idx}")
            break
            
    if current_category:
        try:
            plan_actual = str(row.iloc[8]).strip() if pd.notna(row.iloc[8]) else ''
            if plan_actual in ['Plan', 'Rephase', 'Actual / Fcst', 'Actual']:
                projects.append(idx)
        except:
            pass

print(f"Total projects parsed: {len(projects)}")
