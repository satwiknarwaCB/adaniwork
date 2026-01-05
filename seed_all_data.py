import pandas as pd
import sys
import os
import sqlite3

# Import our parser functions
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from excel_parser import parse_excel_workbook, import_projects_to_db

DB_PATH = os.path.join(os.getcwd(), 'data', 'adani-excel.db')

FILES = {
    'summary': 'AGEL FY 25-26 Commissioning Status_31-Dec-25(Summary Linked).csv',
    'kh_solar': 'KH SOlar Actual.xlsx',
    'kh_wind_internal': 'KH Wind Internal.xlsx',
    'rj_solar': 'RJ Solar Actual.xlsx',
    'wind_actual': 'WindActual.xlsx'
}

def seed_data():
    print("Starting Smart Data Import...")
    
    # 1. Clear old data (handled by import_projects_to_db)
    
    # 2. Process Summary Master CSV first
    print(f"Reading {FILES['summary']}...")
    try:
        with open(FILES['summary'], 'rb') as f:
            content = f.read()
        
        # This will parse the CSV and identify only individual project rows
        # The new parser logic automatically skips 'Subtotal' and 'Total' rows
        result = parse_excel_workbook(content, FILES['summary'])
        
        projects = result['projects']
        print(f"Found {len(projects)} individual project rows in Summary Master.")
        
        # 3. Process granular Actual sheets
        all_summaries = []
        
        # Mapping sheet types to Categories
        actual_files = [
            (FILES['kh_solar'], 'Solar'),
            (FILES['rj_solar'], 'Solar'),
            (FILES['wind_actual'], 'Wind'),
            (FILES['kh_wind_internal'], 'Internal')
        ]
        
        for file_path, category in actual_files:
            if os.path.exists(file_path):
                print(f"Reading granular actuals from {file_path}...")
                with open(file_path, 'rb') as f:
                    content = f.read()
                res = parse_excel_workbook(content, file_path)
                all_summaries.extend(res['summaries'])
        
        print(f"Found {len(all_summaries)} total summary/actual records.")
        
        # 4. Final Import to Database
        db_result = import_projects_to_db(projects, all_summaries, "FY_25-26")
        
        if db_result['success']:
            print(f"SUCCESS! Imported {db_result['inserted_projects']} Projects and {db_result['inserted_summaries']} Summaries.")
            print("The website now contains only individual project data. Aggregations will be handled automatically by the UI.")
        else:
            print(f"DB ERROR: {db_result.get('error')}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    seed_data()
