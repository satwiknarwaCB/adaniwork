const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
    // Count Wind projects
    const windPlan = await p.commissioningProject.findMany({
        where: {
            isDeleted: false,
            category: { contains: 'Wind' },
            planActual: 'Plan'
        },
        select: { sno: true, projectName: true, spv: true, section: true }
    });

    console.log('Wind Plan rows:', windPlan.length);
    console.log('\nProjects:');
    windPlan.forEach(proj => {
        console.log(`  S.No ${proj.sno}: ${proj.projectName} | ${proj.spv} | Section ${proj.section}`);
    });

    // Count unique groups
    const groups = new Set(windPlan.map(p => `${p.projectName}|${p.spv}|${p.section}`));
    console.log('\nUnique project groups:', groups.size);
}

check().catch(console.error).finally(() => p.$disconnect());
