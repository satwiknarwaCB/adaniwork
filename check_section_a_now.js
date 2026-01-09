const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
    // Check Section A Solar count
    const sectionA = await p.commissioningProject.findMany({
        where: {
            isDeleted: false,
            section: 'A',
            category: 'Khavda Solar',
            planActual: 'Plan'
        },
        select: { sno: true, projectName: true, spv: true, capacity: true },
        orderBy: { sno: 'asc' }
    });

    console.log('Section A Solar (Plan rows):', sectionA.length);
    console.log('\nProjects:');
    sectionA.forEach(proj => {
        console.log(`  S.No ${proj.sno}: ${proj.projectName} | ${proj.spv} | ${proj.capacity} MW`);
    });

    // Check if specific S.No exist
    console.log('\n--- Checking for missing S.No ---');
    const missing = [2, 4, 14, 22];
    for (const sno of missing) {
        const found = sectionA.find(p => p.sno === sno);
        console.log(`S.No ${sno}: ${found ? 'FOUND' : 'MISSING'}`);
    }
}

check().catch(console.error).finally(() => p.$disconnect());
