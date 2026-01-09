const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkDuplicates() {
    const all = await p.commissioningProject.findMany({ where: { isDeleted: false } });
    const seen = new Map();
    const dups = [];

    all.forEach(p => {
        const key = `${p.fiscalYear}|${p.sno}|${p.projectName}|${p.spv}|${p.category}|${p.section}|${p.planActual}|${p.capacity}`;
        if (seen.has(key)) {
            dups.push({ key, id1: seen.get(key), id2: p.id });
        }
        seen.set(key, p.id);
    });

    if (dups.length > 0) {
        console.log('Found', dups.length, 'duplicates in DB:');
        dups.slice(0, 5).forEach(d => console.log(d));
    } else {
        console.log('No exact duplicates found in DB.');
    }
}

checkDuplicates().catch(console.error).finally(() => p.$disconnect());
