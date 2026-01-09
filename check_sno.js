const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
    // Find all projects with S.No 2, 4, 14, 22
    const projects = await p.commissioningProject.findMany({
        where: {
            sno: { in: [2, 4, 14, 22] },
            planActual: 'Plan',
            isDeleted: false
        },
        select: { sno: true, projectName: true, category: true, section: true, spv: true }
    });

    console.log('Projects with S.No 2, 4, 14, 22:');
    console.log(JSON.stringify(projects, null, 2));

    // Also check total count
    const total = await p.commissioningProject.count({ where: { isDeleted: false } });
    console.log('\nTotal projects in DB:', total);
}

check().finally(() => p.$disconnect());
