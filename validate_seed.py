import sqlite3
conn = sqlite3.connect('data/adani-excel.db')
cur = conn.cursor()

# Get only included totals
cur.execute('SELECT SUM(capacity) FROM commissioning_projects WHERE plan_actual="Plan" AND included_in_total=1 AND category LIKE "%Solar%"')
solar = cur.fetchone()[0]

cur.execute('SELECT SUM(capacity) FROM commissioning_projects WHERE plan_actual="Plan" AND included_in_total=1 AND category LIKE "%Wind%"')
wind = cur.fetchone()[0]

cur.execute('SELECT SUM(capacity) FROM commissioning_projects WHERE plan_actual="Plan" AND included_in_total=0')
excluded = cur.fetchone()[0]

print("=" * 50)
print("SEED VALIDATION - FINAL RESULTS")
print("=" * 50)
print()
print("INCLUDED IN TOTALS:")
print(f"  Solar (A+B+C):  {solar:,.1f} MW  [Expected: 5,869]")
print(f"  Wind (A+C):     {wind:,.1f} MW  [Expected: 1,204]")
print(f"  OVERALL:        {solar+wind:,.1f} MW  [Expected: 7,073]")
print()
print("EXCLUDED FROM TOTALS (Display Only):")
print(f"  D1+D2+B+D:      {excluded:,.1f} MW")
print()
print("VALIDATION STATUS:")
print(f"  Solar match:    {'PASS' if abs(solar-5869) < 1 else 'FAIL'}")
print(f"  Wind match:     {'PASS' if abs(wind-1204) < 1 else 'FAIL'}")
print(f"  Overall match:  {'PASS' if abs(solar+wind-7073) < 2 else 'FAIL'}")
print("=" * 50)
