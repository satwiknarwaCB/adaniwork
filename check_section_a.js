const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkAllSectionA() {
    const projects = await p.commissioningProject.findMany({
        where: {
            isDeleted: false,
            section: 'A',
            category: { contains: 'Solar' },
            planActual: 'Plan'
        },
        select: { sno: true, projectName: true, spv: true, capacity: true },
        orderBy: { sno: 'asc' }
    });

    console.log('=== Section A Solar Projects (Plan rows) ===');
    console.log('Total in DB:', projects.length);
    console.log('\nAll Projects:');
    projects.forEach(p => {
        console.log(`  S.No ${p.sno}: ${p.projectName} | SPV: ${p.spv} | Cap: ${p.capacity}`);
    });

    // Check for missing S.No
    const snoList = projects.map(p => p.sno);
    console.log('\nS.No in DB:', snoList.join(', '));

    // Expected S.No 1-22
    const missing = [];
    for (let i = 1; i <= 22; i++) {
        if (!snoList.includes(i)) missing.push(i);
    }
    if (missing.length > 0) {
        console.log('Missing S.No:', missing.join(', '));
    }
}

checkAllSectionA().catch(console.error).finally(() => p.$disconnect());
