const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

const prisma = new PrismaClient();
const sqlite = new Database('adani_tracker_fresh.db', { readonly: true });

async function verify() {
    console.log('=== VERIFYING DATA MATCH ===\n');

    // Count from PostgreSQL (website)
    const pgCount = await prisma.commissioningProject.count({ where: { isDeleted: false } });

    // Count from SQLite (new file)
    const sqliteCount = sqlite.prepare("SELECT COUNT(*) as count FROM commissioning_projects").get().count;

    console.log('PostgreSQL (Website):', pgCount, 'projects');
    console.log('SQLite (Fresh DB):   ', sqliteCount, 'projects');
    console.log('Match:', pgCount === sqliteCount ? '✅ YES' : '❌ NO');

    // Compare a sample record
    const pgSample = await prisma.commissioningProject.findFirst({
        where: { projectName: 'AGEL Merchant', planActual: 'Plan', section: 'A' },
        select: { projectName: true, capacity: true, apr: true, may: true, category: true }
    });

    const sqliteSample = sqlite.prepare(
        "SELECT project_name, capacity, apr, may, category FROM commissioning_projects WHERE project_name = 'AGEL Merchant' AND plan_actual = 'Plan' AND section = 'A' LIMIT 1"
    ).get();

    console.log('\n--- Sample Record Comparison ---');
    console.log('PostgreSQL:', JSON.stringify(pgSample));
    console.log('SQLite:    ', JSON.stringify(sqliteSample));

    sqlite.close();
}

verify().catch(console.error).finally(() => prisma.$disconnect());
