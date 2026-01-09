const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function debugDashboardCounts() {
    const fy = 'FY_25-26';

    const planRows = await p.commissioningProject.findMany({
        where: { fiscalYear: fy, isDeleted: false, planActual: 'Plan', includedInTotal: true }
    });

    const solarKeys = new Set(planRows.filter(p => p.category.toLowerCase().includes('solar')).map(p => `${p.sno}|${p.projectName}|${p.spv}|${p.section}`));
    const windKeys = new Set(planRows.filter(p => p.category.toLowerCase().includes('wind')).map(p => `${p.sno}|${p.projectName}|${p.spv}|${p.section}`));
    const allKeys = new Set(planRows.map(p => `${p.sno}|${p.projectName}|${p.spv}|${p.section}`));

    console.log('Solar Unique Keys:', solarKeys.size);
    console.log('Wind Unique Keys:', windKeys.size);
    console.log('Total Unique Keys (Set of Solar + Wind):', allKeys.size);

    // Find overlap
    for (const k of solarKeys) {
        if (windKeys.has(k)) {
            console.log('Overlap found:', k);
        }
    }
}

debugDashboardCounts().catch(console.error).finally(() => p.$disconnect());
