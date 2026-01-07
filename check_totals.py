import sqlite3
conn = sqlite3.connect('d:/PWORK/CEO-tracker/data/adani-excel.db')
c = conn.cursor()

print("="*60)
print("SOLAR (included_in_total=1):")
print("="*60)
c.execute("""
    SELECT plan_actual, ROUND(SUM(apr),1), ROUND(SUM(may),1), ROUND(SUM(jun),1), ROUND(SUM(jul),1) 
    FROM commissioning_projects 
    WHERE category LIKE '%Solar%' AND included_in_total=1 
    GROUP BY plan_actual
""")
for row in c.fetchall():
    print(f"  {row[0]:<12} Apr={row[1]:>7} May={row[2]:>7} Jun={row[3]:>7} Jul={row[4]:>7}")

print("\n" + "="*60)
print("WIND (included_in_total=1):")
print("="*60)
c.execute("""
    SELECT plan_actual, ROUND(SUM(apr),1), ROUND(SUM(may),1), ROUND(SUM(jun),1), ROUND(SUM(jul),1)
    FROM commissioning_projects 
    WHERE category LIKE '%Wind%' AND included_in_total=1 
    GROUP BY plan_actual
""")
for row in c.fetchall():
    print(f"  {row[0]:<12} Apr={row[1]:>7} May={row[2]:>7} Jun={row[3]:>7} Jul={row[4]:>7}")

conn.close()
