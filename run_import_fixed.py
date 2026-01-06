
import pandas as pd
import io
import sys
import os
import sqlite3

# Import our parser logic
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from excel_parser import parse_excel_workbook, import_projects_to_db

def run_custom_import():
    csv_path = r"d:\PWORK\CEO-tracker\AGEL FY 25-26 Commissioning Status_31-Dec-25(Summary Linked).csv"
    
    if not os.path.exists(csv_path):
        print(f"Error: File not found at {csv_path}")
        return

    print(f"Reading CSV: {csv_path}")
    with open(csv_path, 'rb') as f:
        file_content = f.read()

    # Define the exact section markers based on the CSV and requirements
    CUSTOM_MARKERS = {
        'A. Khavda Solar Projects': ('Khavda Solar Projects', 'A', True),
        'B. Rajasthan Solar Projects': ('Rajasthan Solar Projects', 'B', True),
        'C. Rajasthan Solar Projects (Additional': ('Rajasthan Solar Additional 500MW', 'C', True),
        'D1. Khavda Solar (Copper': ('Khavda Solar Copper + Merchant 50MW', 'D1', False),
        'D2. Khavda Solar (Additional': ('Khavda Solar Internal 650MW', 'D2', False),
        'A. Khavda Wind Projects': ('Khavda Wind Projects', 'A', True),
        'B. Khavda Wind (Additional': ('Khavda Wind Internal 421MW', 'B', False),
        'C. Mundra Wind': ('Mundra Wind 76MW', 'C', True),
        'D. Mundra Wind': ('Mundra Wind Internal 224.4MW', 'D', False),
    }

    # Monkey patch the markers
    import excel_parser
    excel_parser.SECTION_MARKERS = CUSTOM_MARKERS

    print("Parsing file...")
    result = parse_excel_workbook(file_content, "Summary Linked.csv")
    
    projects = result['projects']
    print(f"Parsed {len(projects)} project rows.")

    # IMPORT FOR BOTH KEYS TO BE SAFE
    for fy in ["FY_25-26"]:
        print(f"Importing for {fy}...")
        import_result = import_projects_to_db(projects, result.get('summaries'), fy)
        if import_result.get('success'):
            print(f"Successfully imported {import_result['inserted_projects']} project records for {fy}.")
        else:
            print(f"Import failed for {fy}: {import_result.get('error')}")

if __name__ == "__main__":
    run_custom_import()
