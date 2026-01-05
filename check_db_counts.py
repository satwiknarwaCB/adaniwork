import sqlite3
conn = sqlite3.connect("backend/commissioning.db")
c = conn.cursor()
c.execute("SELECT count(*) FROM commissioning_projects")
print(f"Projects: {c.fetchone()[0]}")
c.execute("SELECT count(*) FROM commissioning_summaries")
print(f"Summaries: {c.fetchone()[0]}")
conn.close()
