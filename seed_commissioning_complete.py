"""
Complete seed script for AGEL FY 25-26 Commissioning Status
Extracted from PDF: AGEL FY 25-26 Commissioning Status Update_31-Oct-25.pdf
"""

import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.database import get_db_connection, init_db

init_db()

FISCAL_YEAR = "FY_25-26"

# A. Khavda Solar Projects (Section A - Included in Total) - 22 projects
khavda_solar_projects = [
    {"sno": 1, "projectName": "AGEL Merchant", "spv": "ARE56L", "projectType": "Merchant", "plotLocation": "S-08", "capacity": 50, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 2, "projectName": "AGEL Merchant", "spv": "ARE56L", "projectType": "Merchant", "plotLocation": "A-02", "capacity": 187.5, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 3, "projectName": "MLP AP New", "spv": "ARE57L", "projectType": "PPA", "plotLocation": "A-11", "capacity": 350, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 4, "projectName": "MLP AP New", "spv": "ARE57L", "projectType": "PPA", "plotLocation": "A-12", "capacity": 570, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 5, "projectName": "SECI H-3", "spv": "AHEJ5L", "projectType": "PPA", "plotLocation": "A-13", "capacity": 250, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 6, "projectName": "AGEL Merchant", "spv": "ARE45L", "projectType": "Merchant", "plotLocation": "A-14", "capacity": 500, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 7, "projectName": "MLP T3 AP", "spv": "ARE56L", "projectType": "PPA", "plotLocation": "S-06", "capacity": 25, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 8, "projectName": "Google Hybrid", "spv": "ARE3L", "projectType": "Merchant", "plotLocation": "A-6", "capacity": 35, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 9, "projectName": "AGEL Merchant", "spv": "ASEJ6PL", "projectType": "Merchant", "plotLocation": "A-6", "capacity": 100, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 10, "projectName": "AGEL Hybrid Merchant", "spv": "AGE25BL", "projectType": "Merchant", "plotLocation": "S-8", "capacity": 150, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 11, "projectName": "AGEL Merchant", "spv": "AHEJ5L", "projectType": "Merchant", "plotLocation": "A-15a", "capacity": 292, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 12, "projectName": "AGEL Hybrid Merchant", "spv": "AGE26BL", "projectType": "Merchant", "plotLocation": "S-5", "capacity": 150, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 13, "projectName": "AGEL Merchant", "spv": "AGE24L", "projectType": "Merchant", "plotLocation": "S-5", "capacity": 150, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 14, "projectName": "AGEL Merchant", "spv": "AGE24L", "projectType": "Merchant", "plotLocation": "A-14", "capacity": 125, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 15, "projectName": "Cement - Hybrid", "spv": "ACL", "projectType": "Group", "plotLocation": "A-1", "capacity": 75, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 16, "projectName": "MLP T3 AP", "spv": "AGE25CL", "projectType": "PPA", "plotLocation": "A-6", "capacity": 50, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 17, "projectName": "MLP T1 J&K", "spv": "AGE26AL", "projectType": "PPA", "plotLocation": "A-16", "capacity": 200, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 18, "projectName": "MLP T1 CG", "spv": "AGE26AL", "projectType": "PPA", "plotLocation": "A-16", "capacity": 167, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 19, "projectName": "MLP T1 TN", "spv": "AGE26AL", "projectType": "PPA", "plotLocation": "A-16", "capacity": 333, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 20, "projectName": "MLP T1 OR", "spv": "AGE26AL", "projectType": "PPA", "plotLocation": "A-16", "capacity": 50, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 21, "projectName": "MLP T1 TR", "spv": "AGE26AL", "projectType": "PPA", "plotLocation": "A10a", "capacity": 425, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 22, "projectName": "MLP T3 AP", "spv": "AGE25CL", "projectType": "PPA", "plotLocation": "A-6", "capacity": 167, "planActual": "Actual", "section": "A", "includedInTotal": True},
]

# B. Rajasthan Solar Projects (Section B - Included in Total) - 4 projects
rajasthan_solar_projects = [
    {"sno": 1, "projectName": "KCTL", "spv": "KCTL", "projectType": "Group", "plotLocation": "A-15a", "capacity": 300, "planActual": "PLAN", "section": "B", "includedInTotal": True},
    {"sno": 2, "projectName": "Merchant", "spv": "ASEJ6PL", "projectType": "Merchant", "plotLocation": "Bap", "capacity": 50, "planActual": "PLAN", "section": "B", "includedInTotal": True},
    {"sno": 3, "projectName": "MCIPL", "spv": "MCIPL", "projectType": "Group", "plotLocation": "Bandha", "capacity": 534, "planActual": "PLAN", "section": "B", "includedInTotal": True},
    {"sno": 4, "projectName": "MLP AP New", "spv": "AGE26BL", "projectType": "PPA", "plotLocation": "Baiya", "capacity": 500, "planActual": "PLAN", "section": "B", "includedInTotal": True},
]

# C. Rajasthan Solar Additional 500MW (Section C - Included in Total) - 1 project
rajasthan_additional_500 = [
    {"sno": 1, "projectName": "NHPC BOO", "spv": "ASEB1PL", "projectType": "PPA", "plotLocation": "Essel park", "capacity": 500, "planActual": "Actual", "section": "C", "includedInTotal": True},
]

# D1. Khavda Solar Copper + Merchant 50MW (Section D1 - EXCLUDED from Total) - 3 projects
khavda_copper_merchant_50 = [
    {"sno": 1, "projectName": "Cement RJ", "spv": "ACL", "projectType": "Group", "plotLocation": "A-15a", "capacity": 12.5, "planActual": "PLAN", "section": "D1", "includedInTotal": False},
    {"sno": 2, "projectName": "AGEL Hybrid Merchant", "spv": "AHEJ5L", "projectType": "Merchant", "plotLocation": "S-4", "capacity": 12.5, "planActual": "PLAN", "section": "D1", "includedInTotal": False},
    {"sno": 3, "projectName": "AGEL Merchant", "spv": "ASEJ6PL", "projectType": "Merchant", "plotLocation": "A-15a", "capacity": 25, "planActual": "PLAN", "section": "D1", "includedInTotal": False},
]

# D2. Khavda Solar Internal 650MW (Section D2 - EXCLUDED from Total) - 2 projects
khavda_internal_650 = [
    {"sno": 1, "projectName": "MLP AP New", "spv": "ARE57L", "projectType": "PPA", "plotLocation": "A-12", "capacity": 350, "planActual": "PLAN", "section": "D2", "includedInTotal": False},
    {"sno": 2, "projectName": "MLP T1", "spv": "AGE25BL", "projectType": "PPA", "plotLocation": "Baiya", "capacity": 300, "planActual": "PLAN", "section": "D2", "includedInTotal": False},
]

# A. Khavda Wind Projects (Section A - Included in Total) - 10 projects
khavda_wind_projects = [
    {"sno": 1, "projectName": "AGEL Merchant", "spv": "AGE24L", "projectType": "Merchant", "plotLocation": "PSS-04", "capacity": 52, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 2, "projectName": "Hybrid Cement", "spv": "ACL", "projectType": "Group", "plotLocation": "PSS-04", "capacity": 57.2, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 3, "projectName": "AGEL Merchant", "spv": "AHEJ5L", "projectType": "Merchant", "plotLocation": "PSS-04", "capacity": 62.4, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 4, "projectName": "AGEL Hybrid Merchant", "spv": "AGE26BL", "projectType": "Merchant", "plotLocation": "PSS-11", "capacity": 202.8, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 5, "projectName": "AGEL Merchant", "spv": "AHEJ5L", "projectType": "Merchant", "plotLocation": "PSS-08", "capacity": 67.6, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 6, "projectName": "AGEL Merchant", "spv": "ARE41L", "projectType": "Merchant", "plotLocation": "PSS-08", "capacity": 130, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 7, "projectName": "Google Hybrid", "spv": "ARE3L", "projectType": "Merchant", "plotLocation": "PSS-08", "capacity": 15.6, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 8, "projectName": "Google Hybrid", "spv": "ARE3L", "projectType": "Merchant", "plotLocation": "PSS-08", "capacity": 26, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 9, "projectName": "AGEL Hybrid Merchant", "spv": "ASEJ6PL", "projectType": "Merchant", "plotLocation": "PSS-08", "capacity": 62.4, "planActual": "PLAN", "section": "A", "includedInTotal": True},
    {"sno": 10, "projectName": "SECI H-3", "spv": "AHEJ5L", "projectType": "PPA", "plotLocation": "PSS-05", "capacity": 78, "planActual": "PLAN", "section": "A", "includedInTotal": True},
]

# B. Khavda Wind Internal 421MW (Section B - EXCLUDED from Total) - 3 projects
khavda_wind_internal_421 = [
    {"sno": 1, "projectName": "AGEL Merchant", "spv": "AGE25CL", "projectType": "Merchant", "plotLocation": "PSS-11", "capacity": 98.8, "planActual": "PLAN", "section": "B", "includedInTotal": False},
    {"sno": 2, "projectName": "AGEL Merchant", "spv": "AGE26AL", "projectType": "Merchant", "plotLocation": "PSS-12", "capacity": 312, "planActual": "PLAN", "section": "B", "includedInTotal": False},
    {"sno": 3, "projectName": "AGEL Merchant", "spv": "AGE25BL", "projectType": "Merchant", "plotLocation": "PSS-09", "capacity": 10.4, "planActual": "PLAN", "section": "B", "includedInTotal": False},
]

# C. Mundra Wind 76MW (Section C - Included in Total) - 1 project
mundra_wind_76 = [
    {"sno": 1, "projectName": "Merchant-Wind", "spv": "AWEK3L", "projectType": "Merchant", "plotLocation": "Mundra North", "capacity": 76, "planActual": "PLAN", "section": "C", "includedInTotal": True},
]

# D. Mundra Wind Internal 224.4MW (Section D - EXCLUDED from Total) - 1 project
mundra_wind_internal_224 = [
    {"sno": 1, "projectName": "Merchant-Wind", "spv": "AWEK3L", "projectType": "Merchant", "plotLocation": "Mundra North", "capacity": 198, "planActual": "PLAN", "section": "D", "includedInTotal": False},
]

def assign_category(projects, category_name):
    """Assign category to all projects in list"""
    for proj in projects:
        proj['category'] = category_name
    return projects

def seed_complete_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Clear existing data
        cursor.execute("DELETE FROM commissioning_projects WHERE fiscal_year = ?", (FISCAL_YEAR,))
        cursor.execute("DELETE FROM commissioning_summaries WHERE fiscal_year = ?", (FISCAL_YEAR,))
        
        # Combine all solar projects with proper categories
        all_solar = (
            assign_category(khavda_solar_projects, "Khavda Solar") +
            assign_category(rajasthan_solar_projects, "Rajasthan Solar") +
            assign_category(rajasthan_additional_500, "Rajasthan Solar Additional 500MW") +
            assign_category(khavda_copper_merchant_50, "Khavda Solar Copper+Merchant 50MW") +
            assign_category(khavda_internal_650, "Khavda Solar Internal 650MW")
        )
        
        # Combine all wind projects with proper categories
        all_wind = (
            assign_category(khavda_wind_projects, "Khavda Wind") +
            assign_category(khavda_wind_internal_421, "Khavda Wind Internal 421MW") +
            assign_category(mundra_wind_76, "Mundra Wind 76MW") +
            assign_category(mundra_wind_internal_224, "Mundra Wind Internal 224.4MW")
        )
        
        all_projects_base = all_solar + all_wind
        
        # Create Plan, Rephase, and Actual variants for each project
        all_projects = []
        for proj in all_projects_base:
            # Plan variant
            plan_proj = proj.copy()
            plan_proj['planActual'] = 'Plan'
            all_projects.append(plan_proj)
            
            # Rephase variant
            rephase_proj = proj.copy()
            rephase_proj['planActual'] = 'Rephase'
            all_projects.append(rephase_proj)
            
            # Actual variant
            actual_proj = proj.copy()
            actual_proj['planActual'] = 'Actual'
            all_projects.append(actual_proj)
        
        # Insert all projects
        for proj in all_projects:
            cursor.execute('''
                INSERT INTO commissioning_projects (
                    fiscal_year, sno, project_name, spv, project_type, plot_location,
                    capacity, plan_actual, category, section, included_in_total,
                    apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar,
                    total_capacity, cumm_till_oct, q1, q2, q3, q4
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
            ''', (
                FISCAL_YEAR, proj["sno"], proj["projectName"], proj["spv"], proj["projectType"],
                proj["plotLocation"], proj["capacity"], proj["planActual"], proj["category"],
                proj["section"], proj["includedInTotal"]
            ))
        
        conn.commit()
        print(f"Successfully seeded {len(all_projects)} project entries for {FISCAL_YEAR}")
        print(f"  Base projects: {len(all_projects_base)}")
        print(f"  Solar base: {len(all_solar)}")
        print(f"  Wind base: {len(all_wind)}")
        print(f"  Plan entries: {sum(1 for p in all_projects if p['planActual'] == 'Plan')}")
        print(f"  Rephase entries: {sum(1 for p in all_projects if p['planActual'] == 'Rephase')}")
        print(f"  Actual entries: {sum(1 for p in all_projects if p['planActual'] == 'Actual')}")
        print(f"  Included in totals: {sum(1 for p in all_projects_base if p['includedInTotal'])}")
        print(f"  Excluded from totals: {sum(1 for p in all_projects_base if not p['includedInTotal'])}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    seed_complete_data()
