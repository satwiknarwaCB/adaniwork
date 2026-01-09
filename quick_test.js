const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient();

(async () => {
    // Solar Section A
    const solarA = await p.commissioningProject.findMany({ where: { isDeleted: false, category: { contains: 'Solar' }, section: 'A', planActual: 'Plan' }, select: { projectName: true, spv: true } });
    const uniqSolarA = new Set(solarA.map(x => x.projectName + '|' + x.spv)).size;

    // Solar B
    const solarB = await p.commissioningProject.findMany({ where: { isDeleted: false, category: { contains: 'Solar' }, section: 'B', planActual: 'Plan' }, select: { projectName: true, spv: true } });
    const uniqSolarB = new Set(solarB.map(x => x.projectName + '|' + x.spv)).size;

    // Wind A
    const windA = await p.commissioningProject.findMany({ where: { isDeleted: false, category: { contains: 'Wind' }, section: 'A', planActual: 'Plan' }, select: { projectName: true, spv: true } });
    const uniqWindA = new Set(windA.map(x => x.projectName + '|' + x.spv)).size;

    // Check incomplete
    const all = await p.commissioningProject.findMany({ where: { isDeleted: false }, select: { projectName: true, spv: true, section: true, planActual: true, category: true } });
    const groups = new Map();
    all.forEach(proj => { const k = proj.projectName + '|' + proj.spv + '|' + proj.section + '|' + proj.category; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(proj.planActual); });

    let complete = 0, incomplete = 0;
    groups.forEach(types => { if (types.includes('Plan') && types.includes('Rephase') && types.includes('Actual')) complete++; else incomplete++; });

    console.log('RESULTS:');
    console.log('Solar A:', uniqSolarA);
    console.log('Solar B:', uniqSolarB);
    console.log('Wind A:', uniqWindA);
    console.log('Total rows:', all.length);
    console.log('Complete groups:', complete);
    console.log('Incomplete:', incomplete);

    await p.$disconnect();
})();
