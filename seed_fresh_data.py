"""
Fresh seed script for AGEL FY 25-26 Commissioning Status
- Clears ALL existing data
- Creates projects with sample monthly values
- Totals are auto-calculated by backend:
  - PLAN/REPHASE: totalCapacity = capacity
  - ACTUAL: totalCapacity = sum of monthly values
"""

import sqlite3
import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.database import get_db_connection, init_db

# Initialize DB tables
init_db()

FISCAL_YEAR = "FY_25-26"

def generate_monthly_values(capacity, plan_type):
    """Generate realistic monthly values based on plan type - using integers"""
    if plan_type == 'Plan':
        # Plan: distribute capacity across months (planned schedule)
        # Q1: 15%, Q2: 25%, Q3: 35%, Q4: 25%
        q1 = capacity * 0.15
        q2 = capacity * 0.25
        q3 = capacity * 0.35
        q4 = capacity * 0.25
    elif plan_type == 'Rephase':
        # Rephase: shifted to later months
        # Q1: 10%, Q2: 20%, Q3: 40%, Q4: 30%
        q1 = capacity * 0.10
        q2 = capacity * 0.20
        q3 = capacity * 0.40
        q4 = capacity * 0.30
    else:  # Actual
        # Actual: random realistic distribution (less than planned)
        achieved = capacity * random.uniform(0.3, 0.7)  # 30-70% achieved so far
        q1 = achieved * 0.15
        q2 = achieved * 0.30
        q3 = achieved * 0.35
        q4 = achieved * 0.20
    
    # Use integers - no rounding errors
    return {
        'apr': int(q1 * 0.20),
        'may': int(q1 * 0.30),
        'jun': int(q1 * 0.50),
        'jul': int(q2 * 0.30),
        'aug': int(q2 * 0.30),
        'sep': int(q2 * 0.40),
        'oct': int(q3 * 0.40),
        'nov': int(q3 * 0.30),
        'dec': int(q3 * 0.30),
        'jan': int(q4 * 0.40),
        'feb': int(q4 * 0.30),
        'mar': int(q4 * 0.30),
    }

# ==================== SOLAR PROJECTS ====================

# A. Khavda Solar Projects (Section A - Included) - PDF: 4485 MW
khavda_solar = [
    {"sno": 1, "name": "AGEL Merchant S-08", "spv": "ARE56L", "type": "Merchant", "loc": "S-08", "capacity": 250},
    {"sno": 2, "name": "AGEL Merchant A-02", "spv": "ARE56L", "type": "Merchant", "loc": "A-02", "capacity": 50},
    {"sno": 3, "name": "MLP AP New A-11", "spv": "ARE57L", "type": "PPA", "loc": "A-11", "capacity": 188},
    {"sno": 4, "name": "MLP AP New A-12", "spv": "ARE57L", "type": "PPA", "loc": "A-12", "capacity": 350},
    {"sno": 5, "name": "SECI H-3", "spv": "AHEJ5L", "type": "PPA", "loc": "A-13", "capacity": 570},
    {"sno": 6, "name": "AGEL Merchant A-14", "spv": "ARE45L", "type": "Merchant", "loc": "A-14", "capacity": 250},
    {"sno": 7, "name": "MLP T3 AP", "spv": "ARE56L", "type": "PPA", "loc": "S-06", "capacity": 500},
    {"sno": 8, "name": "Google Hybrid", "spv": "ARE3L", "type": "Merchant", "loc": "A-6", "capacity": 25},
    {"sno": 9, "name": "AGEL Merchant", "spv": "ASEJ6PL", "type": "Merchant", "loc": "A-6", "capacity": 35},
    {"sno": 10, "name": "AGEL Hybrid Merchant", "spv": "AGE25BL", "type": "Merchant", "loc": "S-8", "capacity": 100},
    {"sno": 11, "name": "AGEL Merchant A-15a", "spv": "AHEJ5L", "type": "Merchant", "loc": "A-15a", "capacity": 150},
    {"sno": 12, "name": "AGEL Hybrid Merchant S-5", "spv": "AGE26BL", "type": "Merchant", "loc": "S-5", "capacity": 292},
    {"sno": 13, "name": "AGEL Merchant S-5", "spv": "AGE24L", "type": "Merchant", "loc": "S-5", "capacity": 150},
    {"sno": 14, "name": "AGEL Merchant A-14b", "spv": "AGE24L", "type": "Merchant", "loc": "A-14", "capacity": 150},
    {"sno": 15, "name": "Cement - Hybrid", "spv": "ACL", "type": "Group", "loc": "A-1", "capacity": 125},
    {"sno": 16, "name": "MLP T3 AP-6", "spv": "AGE25CL", "type": "PPA", "loc": "A-6", "capacity": 75},
    {"sno": 17, "name": "MLP T1 J&K", "spv": "AGE26AL", "type": "PPA", "loc": "A-16", "capacity": 50},
    {"sno": 18, "name": "MLP T1 CG", "spv": "AGE26AL", "type": "PPA", "loc": "A-16", "capacity": 200},
    {"sno": 19, "name": "MLP T1 TN", "spv": "AGE26AL", "type": "PPA", "loc": "A-16", "capacity": 167},
    {"sno": 20, "name": "MLP T1 OR", "spv": "AGE26AL", "type": "PPA", "loc": "A-16", "capacity": 333},
    {"sno": 21, "name": "MLP T1 TR", "spv": "AGE26AL", "type": "PPA", "loc": "A10a", "capacity": 50},
    {"sno": 22, "name": "MLP T3 AP-6b", "spv": "AGE25CL", "type": "PPA", "loc": "A-6", "capacity": 425},
]

# B. Rajasthan Solar (Section B - Included) - PDF: 1384 MW
rajasthan_solar = [
    {"sno": 1, "name": "KCTL", "spv": "KCTL", "type": "Group", "loc": "Bikaner", "capacity": 300},
    {"sno": 2, "name": "Merchant Bap", "spv": "ASEJ6PL", "type": "Merchant", "loc": "Bap", "capacity": 50},
    {"sno": 3, "name": "MCIPL", "spv": "MCIPL", "type": "Group", "loc": "Bandha", "capacity": 534},
    {"sno": 4, "name": "MLP AP New", "spv": "AGE26BL", "type": "PPA", "loc": "Baiya", "capacity": 500},
]

# C. Rajasthan Additional 500MW (Section C - Included)
rajasthan_additional = [
    {"sno": 1, "name": "NHPC BOO", "spv": "ASEB1PL", "type": "PPA", "loc": "Essel park", "capacity": 0},
]

# D1. Khavda Solar Copper+Merchant 50MW (Section D1 - EXCLUDED)
khavda_copper = [
    {"sno": 1, "name": "Cement RJ", "spv": "ACL", "type": "Group", "loc": "A-15a", "capacity": 12.5},
    {"sno": 2, "name": "AGEL Hybrid Merchant", "spv": "AHEJ5L", "type": "Merchant", "loc": "S-4", "capacity": 12.5},
    {"sno": 3, "name": "AGEL Merchant", "spv": "ASEJ6PL", "type": "Merchant", "loc": "A-15a", "capacity": 25},
]

# D2. Khavda Solar Internal 650MW (Section D2 - EXCLUDED)
khavda_internal = [
    {"sno": 1, "name": "MLP AP New Internal", "spv": "ARE57L", "type": "PPA", "loc": "A-12", "capacity": 350},
    {"sno": 2, "name": "MLP T1 Internal", "spv": "AGE25BL", "type": "PPA", "loc": "Baiya", "capacity": 300},
]

# ==================== WIND PROJECTS ====================

# A. Khavda Wind (Section A - Included) - PDF: 1128 MW
khavda_wind = [
    {"sno": 1, "name": "AGEL Merchant PSS-04", "spv": "AGE24L", "type": "Merchant", "loc": "PSS-04", "capacity": 52},
    {"sno": 2, "name": "Hybrid Cement", "spv": "ACL", "type": "Group", "loc": "PSS-04", "capacity": 57.2},
    {"sno": 3, "name": "AGEL Merchant PSS-04b", "spv": "AHEJ5L", "type": "Merchant", "loc": "PSS-04", "capacity": 62.4},
    {"sno": 4, "name": "AGEL Hybrid Merchant", "spv": "AGE26BL", "type": "Merchant", "loc": "PSS-11", "capacity": 156},
    {"sno": 5, "name": "AGEL Merchant PSS-08", "spv": "AHEJ5L", "type": "Merchant", "loc": "PSS-08", "capacity": 67.6},
    {"sno": 6, "name": "AGEL Merchant PSS-08b", "spv": "ARE41L", "type": "Merchant", "loc": "PSS-08", "capacity": 130},
    {"sno": 7, "name": "Google Hybrid Wind", "spv": "ARE3L", "type": "Merchant", "loc": "PSS-08", "capacity": 16},
    {"sno": 8, "name": "Google Hybrid Wind 2", "spv": "ARE3L", "type": "Merchant", "loc": "PSS-08", "capacity": 26},
    {"sno": 9, "name": "AGEL Hybrid Merchant PSS-08", "spv": "ASEJ6PL", "type": "Merchant", "loc": "PSS-08", "capacity": 62.4},
    {"sno": 10, "name": "SECI H-3 Wind", "spv": "AHEJ5L", "type": "PPA", "loc": "PSS-05", "capacity": 203},
    {"sno": 11, "name": "AGEL Merchant PSS-10", "spv": "AGE25CL", "type": "Merchant", "loc": "PSS-10", "capacity": 156},
    {"sno": 12, "name": "AGEL Merchant PSS-12", "spv": "AGE26AL", "type": "Merchant", "loc": "PSS-12", "capacity": 140},
]

# B. Khavda Wind Internal 421MW (Section B - EXCLUDED)
khavda_wind_internal = [
    {"sno": 1, "name": "AGEL Merchant PSS-11", "spv": "AGE25CL", "type": "Merchant", "loc": "PSS-11", "capacity": 99},
    {"sno": 2, "name": "AGEL Merchant PSS-12b", "spv": "AGE26AL", "type": "Merchant", "loc": "PSS-12", "capacity": 312},
    {"sno": 3, "name": "AGEL Merchant PSS-09", "spv": "AGE25BL", "type": "Merchant", "loc": "PSS-09", "capacity": 10},
]

# C. Mundra Wind 76MW (Section C - Included)
mundra_wind = [
    {"sno": 1, "name": "Cement - Mundra", "spv": "ACL", "type": "Group", "loc": "Mundra", "capacity": 76},
]

# D. Mundra Wind Internal 224.4MW (Section D - EXCLUDED)
mundra_wind_internal = [
    {"sno": 1, "name": "Cement Internal", "spv": "ACL", "type": "Group", "loc": "Mundra", "capacity": 124.4},
    {"sno": 2, "name": "AGEL Merchant Mundra", "spv": "ASEJ6PL", "type": "Merchant", "loc": "Mundra", "capacity": 100},
]


def seed_fresh_data():
    """Clear all data and seed fresh with monthly values"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. DELETE ALL EXISTING DATA
        print("🗑️  Clearing all existing data...")
        cursor.execute("DELETE FROM commissioning_projects WHERE fiscal_year = ?", (FISCAL_YEAR,))
        cursor.execute("DELETE FROM commissioning_summaries WHERE fiscal_year = ?", (FISCAL_YEAR,))
        
        # 2. BUILD PROJECT LIST WITH CATEGORIES
        all_projects = []
        
        def add_projects(projects, category, section, included):
            for p in projects:
                all_projects.append({
                    **p,
                    "category": category,
                    "section": section,
                    "included": included
                })
        
        # Solar
        add_projects(khavda_solar, "Khavda Solar Projects", "A", True)
        add_projects(rajasthan_solar, "Rajasthan Solar Projects", "B", True)
        add_projects(rajasthan_additional, "Rajasthan Solar Additional 500MW", "C", True)
        add_projects(khavda_copper, "Khavda Solar Copper + Merchant 50MW", "D1", False)
        add_projects(khavda_internal, "Khavda Solar Internal 650MW", "D2", False)
        
        # Wind
        add_projects(khavda_wind, "Khavda Wind Projects", "A", True)
        add_projects(khavda_wind_internal, "Khavda Wind Internal 421MW", "B", False)
        add_projects(mundra_wind, "Mundra Wind 76MW", "C", True)
        add_projects(mundra_wind_internal, "Mundra Wind Internal 224.4MW", "D", False)
        
        # 3. INSERT EACH PROJECT WITH 3 VARIANTS (Plan, Rephase, Actual)
        print(f"📝 Inserting {len(all_projects) * 3} project rows...")
        
        for proj in all_projects:
            for plan_type in ['Plan', 'Rephase', 'Actual']:
                monthly = generate_monthly_values(proj['capacity'], plan_type)
                
                cursor.execute('''
                    INSERT INTO commissioning_projects (
                        fiscal_year, sno, project_name, spv, project_type, plot_location,
                        capacity, plan_actual, category, section, included_in_total,
                        apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    FISCAL_YEAR,
                    proj['sno'],
                    proj['name'],
                    proj['spv'],
                    proj['type'],
                    proj['loc'],
                    proj['capacity'],
                    plan_type,
                    proj['category'],
                    proj['section'],
                    proj['included'],
                    monthly['apr'], monthly['may'], monthly['jun'],
                    monthly['jul'], monthly['aug'], monthly['sep'],
                    monthly['oct'], monthly['nov'], monthly['dec'],
                    monthly['jan'], monthly['feb'], monthly['mar']
                ))
        
        conn.commit()
        
        # 4. CALCULATE TOTALS
        solar_included = sum(p['capacity'] for p in all_projects 
                           if p['included'] and 'Solar' in p['category'])
        wind_included = sum(p['capacity'] for p in all_projects 
                          if p['included'] and 'Wind' in p['category'])
        
        print("\n✅ Fresh data seeded successfully!")
        print(f"   Total projects: {len(all_projects)}")
        print(f"   Total rows (Plan + Rephase + Actual): {len(all_projects) * 3}")
        print()
        print("📊 EXPECTED TOTALS (Included Sections Only):")
        print(f"   Solar (A+B+C): {solar_included:.1f} MW")
        print(f"   Wind (A+C): {wind_included:.1f} MW")
        print(f"   Overall: {solar_included + wind_included:.1f} MW")
        print()
        print("🔄 Totals are AUTO-CALCULATED by backend:")
        print("   - PLAN/REPHASE: totalCapacity = capacity")
        print("   - ACTUAL: totalCapacity = sum(apr...mar)")
        print()
        print("🌐 Refresh your browser to see the data!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed_fresh_data()
