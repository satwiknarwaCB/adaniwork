const Database = require('better-sqlite3');

// Open SQLite database
const db = new Database('data/adani-excel.db', { readonly: true });

// Count projects
const sqliteCount = db.prepare("SELECT COUNT(*) as count FROM commissioning_projects").get();
console.log('SQLite DB projects:', sqliteCount.count);

// Get sample data
const sample = db.prepare("SELECT project_name, capacity, plan_actual FROM commissioning_projects LIMIT 5").all();
console.log('\nSample from SQLite:');
sample.forEach(p => console.log(`  ${p.project_name} | ${p.capacity} | ${p.plan_actual}`));

db.close();
