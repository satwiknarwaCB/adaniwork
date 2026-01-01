"""
Enhanced seed script with sample monthly values for testing
Adds realistic monthly data to ACTUAL rows for testing summary tables
"""

import sqlite3
import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.database import get_db_connection

def add_sample_monthly_data():
    """Add sample monthly data to existing ACTUAL rows for testing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get all ACTUAL rows
        cursor.execute('''
            SELECT id, capacity, plan_actual FROM commissioning_projects 
            WHERE fiscal_year = 'FY_25-26' AND plan_actual = 'Actual' AND is_deleted = 0
        ''')
        actual_rows = cursor.fetchall()
        
        print(f"Found {len(actual_rows)} ACTUAL rows to update with sample data")
        
        for row in actual_rows:
            project_id = row[0]
            capacity = row[1] or 100  # Default if no capacity
            
            # Generate realistic monthly distribution (commissioning happens over time)
            # Most commissioning happens in Oct-Mar (H2)
            apr = random.uniform(0, capacity * 0.05)
            may = random.uniform(0, capacity * 0.05)
            jun = random.uniform(0, capacity * 0.08)
            jul = random.uniform(0, capacity * 0.10)
            aug = random.uniform(0, capacity * 0.10)
            sep = random.uniform(0, capacity * 0.12)
            oct = random.uniform(0, capacity * 0.15)
            nov = random.uniform(0, capacity * 0.10)
            dec = random.uniform(0, capacity * 0.10)
            jan = random.uniform(0, capacity * 0.08)
            feb = random.uniform(0, capacity * 0.04)
            mar = random.uniform(0, capacity * 0.03)
            
            # Round to 1 decimal
            apr, may, jun = round(apr, 1), round(may, 1), round(jun, 1)
            jul, aug, sep = round(jul, 1), round(aug, 1), round(sep, 1)
            oct, nov, dec = round(oct, 1), round(nov, 1), round(dec, 1)
            jan, feb, mar = round(jan, 1), round(feb, 1), round(mar, 1)
            
            cursor.execute('''
                UPDATE commissioning_projects SET
                    apr = ?, may = ?, jun = ?, jul = ?, aug = ?, sep = ?,
                    oct = ?, nov = ?, dec = ?, jan = ?, feb = ?, mar = ?
                WHERE id = ?
            ''', (apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar, project_id))
        
        # Also add some sample monthly data to PLAN rows (for testing quarterly breakdown)
        cursor.execute('''
            SELECT id, capacity FROM commissioning_projects 
            WHERE fiscal_year = 'FY_25-26' AND plan_actual = 'Plan' AND is_deleted = 0
        ''')
        plan_rows = cursor.fetchall()
        
        print(f"Found {len(plan_rows)} PLAN rows to update with quarterly distribution")
        
        for row in plan_rows:
            project_id = row[0]
            capacity = row[1] or 100
            
            # For PLAN, distribute capacity across quarters (planned commissioning schedule)
            # Q1 (Apr-Jun): ~15%, Q2 (Jul-Sep): ~25%, Q3 (Oct-Dec): ~35%, Q4 (Jan-Mar): ~25%
            q1_share = capacity * 0.15
            q2_share = capacity * 0.25
            q3_share = capacity * 0.35
            q4_share = capacity * 0.25
            
            apr = round(q1_share * 0.2, 1)
            may = round(q1_share * 0.3, 1)
            jun = round(q1_share * 0.5, 1)
            jul = round(q2_share * 0.3, 1)
            aug = round(q2_share * 0.3, 1)
            sep = round(q2_share * 0.4, 1)
            oct = round(q3_share * 0.4, 1)
            nov = round(q3_share * 0.3, 1)
            dec = round(q3_share * 0.3, 1)
            jan = round(q4_share * 0.4, 1)
            feb = round(q4_share * 0.3, 1)
            mar = round(q4_share * 0.3, 1)
            
            cursor.execute('''
                UPDATE commissioning_projects SET
                    apr = ?, may = ?, jun = ?, jul = ?, aug = ?, sep = ?,
                    oct = ?, nov = ?, dec = ?, jan = ?, feb = ?, mar = ?
                WHERE id = ?
            ''', (apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar, project_id))
        
        # Also update REPHASE rows with slightly different distribution
        cursor.execute('''
            SELECT id, capacity FROM commissioning_projects 
            WHERE fiscal_year = 'FY_25-26' AND plan_actual = 'Rephase' AND is_deleted = 0
        ''')
        rephase_rows = cursor.fetchall()
        
        print(f"Found {len(rephase_rows)} REPHASE rows to update with revised schedule")
        
        for row in rephase_rows:
            project_id = row[0]
            capacity = row[1] or 100
            
            # Rephase typically shifts work to later months
            # Q1: ~10%, Q2: ~20%, Q3: ~40%, Q4: ~30%
            q1_share = capacity * 0.10
            q2_share = capacity * 0.20
            q3_share = capacity * 0.40
            q4_share = capacity * 0.30
            
            apr = round(q1_share * 0.2, 1)
            may = round(q1_share * 0.3, 1)
            jun = round(q1_share * 0.5, 1)
            jul = round(q2_share * 0.3, 1)
            aug = round(q2_share * 0.3, 1)
            sep = round(q2_share * 0.4, 1)
            oct = round(q3_share * 0.4, 1)
            nov = round(q3_share * 0.3, 1)
            dec = round(q3_share * 0.3, 1)
            jan = round(q4_share * 0.4, 1)
            feb = round(q4_share * 0.3, 1)
            mar = round(q4_share * 0.3, 1)
            
            cursor.execute('''
                UPDATE commissioning_projects SET
                    apr = ?, may = ?, jun = ?, jul = ?, aug = ?, sep = ?,
                    oct = ?, nov = ?, dec = ?, jan = ?, feb = ?, mar = ?
                WHERE id = ?
            ''', (apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar, project_id))
        
        conn.commit()
        print("\n✅ Successfully added sample monthly data to all rows!")
        print("   Refresh your browser to see the data in summary tables.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    add_sample_monthly_data()
