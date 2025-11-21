#!/usr/bin/env python3
"""
Script to populate the production database with default data.
This script can be run on the production server to initialize the database.
"""

import json
import os
import sys
from pathlib import Path

# Add the backend directory to the path so we can import from it
backend_dir = Path(__file__).parent / "backend"
sys.path.append(str(backend_dir))

from database import get_db_connection
from main import convert_to_table_row

def load_sample_data():
    """Load sample data from JSON files and populate the database."""
    # Define paths to JSON files
    components_dir = Path(__file__).parent / "app" / "components"
    
    files_map = [
        {'name': 'FY_23', 'file': 'ex.json'},
        {'name': 'FY_24', 'file': 'ex_fy25.json'},
        {'name': 'FY_25', 'file': 'ex_fy26.json'},
        {'name': 'FY_26', 'file': 'ex_fy27.json'},
        {'name': 'FY_27', 'file': 'ex_fy28.json'},
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    results = []
    
    try:
        for item in files_map:
            file_path = components_dir / item['file']
            if not file_path.exists():
                results.append({'fiscalYear': item['name'], 'message': 'File not found', 'count': 0})
                print(f"File not found: {file_path}")
                continue
               
            with open(file_path, 'r') as f:
                try:
                    raw_data = json.load(f)
                except json.JSONDecodeError as e:
                    raw_data = []
                    print(f"Error parsing JSON in {file_path}: {e}")
           
            if not raw_data:
                results.append({'fiscalYear': item['name'], 'message': 'No data to import', 'count': 0})
                print(f"No data in {file_path}")
                continue
               
            converted_data = [convert_to_table_row(row, i) for i, row in enumerate(raw_data)]
            data_json = json.dumps(converted_data)
           
            # Upsert logic
            cursor.execute('SELECT 1 FROM table_data WHERE fiscal_year = ?', (item['name'],))
            exists = cursor.fetchone()
           
            if exists:
                cursor.execute('''
                    UPDATE table_data
                    SET data = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE fiscal_year = ?
                ''', (data_json, item['name']))
                print(f"Updated data for {item['name']} with {len(converted_data)} records")
            else:
                cursor.execute('''
                    INSERT INTO table_data (fiscal_year, data, version)
                    VALUES (?, ?, 1)
                ''', (item['name'], data_json))
                print(f"Inserted data for {item['name']} with {len(converted_data)} records")
               
            results.append({
                'fiscalYear': item['name'],
                'message': 'Data imported successfully',
                'count': len(converted_data)
            })
           
        conn.commit()
        print("All fiscal year data imported successfully")
        return results
       
    except Exception as e:
        conn.rollback()
        print(f"Error importing data: {e}")
        raise
    finally:
        conn.close()

def populate_dropdown_options():
    """Populate the database with default dropdown options."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Default dropdown options
        default_options = {
            'groups': ['AGEL', 'ACL'],
            'ppa-merchants': ['PPA', 'Merchant'],
            'types': ['Solar', 'Wind', 'Hybrid'],
            'location-codes': ['Khavda', 'RJ'],
            'locations': ['Khavda', 'Baap', 'Essel'],
            'connectivities': ['CTU']
        }
        
        # Soft delete existing options
        cursor.execute('''
            UPDATE dropdown_options
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
        ''')
        
        # Insert new options
        for option_type, values in default_options.items():
            for value in values:
                cursor.execute('''
                    INSERT INTO dropdown_options (option_type, option_value, version)
                    VALUES (?, ?, 1)
                ''', (option_type, value))
        
        conn.commit()
        print("Default dropdown options populated successfully")
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error populating dropdown options: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Populating production database with default data...")
    
    try:
        # Load sample data
        data_results = load_sample_data()
        print("\nData import results:")
        for result in data_results:
            print(f"  {result['fiscalYear']}: {result['message']} ({result.get('count', 0)} records)")
        
        # Populate dropdown options
        populate_dropdown_options()
        
        print("\nDatabase population completed successfully!")
    except Exception as e:
        print(f"Failed to populate database: {e}")
        sys.exit(1)