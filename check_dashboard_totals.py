import sqlite3

def check_dashboard_totals():
    conn = sqlite3.connect('data/adani-excel.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check Solar
    cursor.execute("SELECT plan_actual, SUM(capacity) as total_plan, SUM(total_capacity) as total_actual FROM commissioning_projects WHERE category LIKE '%Solar%' AND included_in_total = 1 AND is_deleted = 0 GROUP BY plan_actual")
    solar = cursor.fetchall()
    print("--- Solar (Included Only) ---")
    for r in solar:
        print(f"{r['plan_actual']}: {r['total_plan']} / {r['total_actual']}")
        
    # Check Wind
    cursor.execute("SELECT plan_actual, SUM(capacity) as total_plan, SUM(total_capacity) as total_actual FROM commissioning_projects WHERE category LIKE '%Wind%' AND included_in_total = 1 AND is_deleted = 0 GROUP BY plan_actual")
    wind = cursor.fetchall()
    print("\n--- Wind (Included Only) ---")
    for r in wind:
        print(f"{r['plan_actual']}: {r['total_plan']} / {r['total_actual']}")
        
    # Check sections
    cursor.execute("SELECT category, section, included_in_total, SUM(capacity) as cap FROM commissioning_projects WHERE plan_actual = 'Plan' AND is_deleted = 0 GROUP BY category, section, included_in_total")
    sections = cursor.fetchall()
    print("\n--- Section Breakdown (Plan) ---")
    for s in sections:
        print(f"{s['category']} Sec {s['section']} (Inc={s['included_in_total']}): {s['cap']} MW")

    conn.close()

if __name__ == "__main__":
    check_dashboard_totals()
