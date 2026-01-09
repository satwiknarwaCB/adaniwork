const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function getDashboardTruth() {
    const fy = 'FY_25-26';

    const allProjects = await p.commissioningProject.findMany({
        where: { fiscalYear: fy, isDeleted: false }
    });

    const calculateKPIs = (projects) => {
        const planRows = projects.filter(p => p.planActual === 'Plan' && p.includedInTotal);
        const actualRows = projects.filter(p => p.planActual === 'Actual' && p.includedInTotal);

        // Total Plan is sum of 'capacity' in Plan rows
        const totalPlan = planRows.reduce((sum, p) => sum + (p.capacity || 0), 0);

        // Total Actual is sum of 'totalCapacity' in Actual rows
        const totalActual = actualRows.reduce((sum, p) => sum + (p.totalCapacity || 0), 0);

        // Project Count is unique based on (sno, projectName, spv, section, category) for Plan rows
        const projectsSet = new Set(planRows.map(p => `${p.sno}|${p.projectName}|${p.spv}|${p.section}|${p.category}`));
        const projectCount = projectsSet.size;

        const achievement = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

        return {
            totalPlan: Math.round(totalPlan * 10) / 10,
            totalActual: Math.round(totalActual * 10) / 10,
            achievement: Math.round(achievement * 100) / 100,
            projectCount
        };
    };

    const solarProjects = allProjects.filter(p => p.category.toLowerCase().includes('solar'));
    const windProjects = allProjects.filter(p => p.category.toLowerCase().includes('wind'));

    console.log('--- DATABASE TRUTH (FY 25-26) ---');
    console.log('ALL CATEGORIES:', calculateKPIs(allProjects));
    console.log('SOLAR ONLY:', calculateKPIs(solarProjects));
    console.log('WIND ONLY:', calculateKPIs(windProjects));
}

getDashboardTruth().catch(console.error).finally(() => p.$disconnect());
