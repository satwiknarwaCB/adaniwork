const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    const total = await p.commissioningProject.count({ where: { isDeleted: false } });

    const solarPlan = await p.commissioningProject.findMany({
        where: { isDeleted: false, category: { contains: 'Solar' }, planActual: 'Plan' },
        select: { projectName: true, spv: true, section: true }
    });

    const windPlan = await p.commissioningProject.findMany({
        where: { isDeleted: false, category: { contains: 'Wind' }, planActual: 'Plan' },
        select: { projectName: true, spv: true, section: true }
    });

    const us = new Set(solarPlan.map(x => x.projectName + '|' + x.spv + '|' + x.section));
    const uw = new Set(windPlan.map(x => x.projectName + '|' + x.spv + '|' + x.section));

    console.log('AUDIT RESULTS');
    console.log('=============');
    console.log('Total rows:', total);
    console.log('Unique Solar projects:', us.size);
    console.log('Unique Wind projects:', uw.size);
    console.log('Total unique projects:', us.size + uw.size);

    await p.$disconnect();
})();
