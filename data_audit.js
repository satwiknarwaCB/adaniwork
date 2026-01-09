/**
 * End-to-End Data Audit Script
 * This script analyzes the database and provides a full count report
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function auditData() {
    console.log('='.repeat(80));
    console.log(' CEO TRACKER - DATA AUDIT REPORT');
    console.log('='.repeat(80));

    // 1. Total counts
    const total = await p.commissioningProject.count({ where: { isDeleted: false } });
    console.log(`\n📊 TOTAL PROJECTS IN DATABASE: ${total}`);

    // 2. Breakdown by category
    console.log('\n--- CATEGORY BREAKDOWN ---');
    const categories = await p.commissioningProject.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { isDeleted: false }
    });
    categories.forEach(c => console.log(`  ${c.category}: ${c._count.id} rows`));

    // 3. Solar breakdown
    console.log('\n--- SOLAR DETAILS ---');
    const solarSections = await p.commissioningProject.groupBy({
        by: ['section', 'category'],
        _count: { id: true },
        where: { isDeleted: false, category: { contains: 'Solar' } }
    });
    solarSections.forEach(s => console.log(`  Section ${s.section} (${s.category}): ${s._count.id} rows`));

    // Count unique Solar projects (Plan rows only)
    const solarPlan = await p.commissioningProject.findMany({
        where: { isDeleted: false, category: { contains: 'Solar' }, planActual: 'Plan' },
        select: { projectName: true, spv: true, section: true }
    });
    const uniqueSolar = new Set(solarPlan.map(p => `${p.projectName}|${p.spv}|${p.section}`));
    console.log(`\n  📌 Unique SOLAR projects: ${uniqueSolar.size}`);
    console.log(`     (Expect: 22 in Section A, 4 in Section B, 1 in Section C = ~27+ total)`);

    // 4. Wind breakdown
    console.log('\n--- WIND DETAILS ---');
    const windSections = await p.commissioningProject.groupBy({
        by: ['section', 'category'],
        _count: { id: true },
        where: { isDeleted: false, category: { contains: 'Wind' } }
    });
    windSections.forEach(s => console.log(`  Section ${s.section} (${s.category}): ${s._count.id} rows`));

    // Count unique Wind projects (Plan rows only)
    const windPlan = await p.commissioningProject.findMany({
        where: { isDeleted: false, category: { contains: 'Wind' }, planActual: 'Plan' },
        select: { projectName: true, spv: true, section: true }
    });
    const uniqueWind = new Set(windPlan.map(p => `${p.projectName}|${p.spv}|${p.section}`));
    console.log(`\n  📌 Unique WIND projects: ${uniqueWind.size}`);
    console.log(`     (Expect: 12 in Section A, + others from B, C, D)`);

    // 5. Plan/Rephase/Actual breakdown
    console.log('\n--- PLAN/ACTUAL BREAKDOWN ---');
    const planTypes = await p.commissioningProject.groupBy({
        by: ['planActual'],
        _count: { id: true },
        where: { isDeleted: false }
    });
    planTypes.forEach(pt => console.log(`  ${pt.planActual}: ${pt._count.id} rows`));

    // 6. Check if we have all 3 types (Plan/Rephase/Actual) for each project
    console.log('\n--- MISSING PLAN/REPHASE/ACTUAL CHECK ---');
    const allPlan = await p.commissioningProject.findMany({
        where: { isDeleted: false },
        select: { projectName: true, spv: true, section: true, planActual: true, category: true }
    });

    // Group by project key
    const projectGroups = new Map();
    allPlan.forEach(proj => {
        const key = `${proj.projectName}|${proj.spv}|${proj.section}|${proj.category}`;
        if (!projectGroups.has(key)) projectGroups.set(key, []);
        projectGroups.get(key).push(proj.planActual);
    });

    let incomplete = 0;
    projectGroups.forEach((types, key) => {
        const hasPlan = types.includes('Plan');
        const hasRephase = types.includes('Rephase');
        const hasActual = types.includes('Actual');
        if (!hasPlan || !hasRephase || !hasActual) {
            incomplete++;
            if (incomplete <= 5) {
                console.log(`  ⚠️ ${key} - Missing: ${!hasPlan ? 'Plan ' : ''}${!hasRephase ? 'Rephase ' : ''}${!hasActual ? 'Actual' : ''}`);
            }
        }
    });
    if (incomplete > 5) console.log(`  ... and ${incomplete - 5} more incomplete projects`);
    console.log(`\n  Total projects missing some Plan/Rephase/Actual rows: ${incomplete}`);

    // 7. Summary
    console.log('\n' + '='.repeat(80));
    console.log(' SUMMARY');
    console.log('='.repeat(80));
    console.log(`  Total DB rows: ${total}`);
    console.log(`  Unique Solar projects: ${uniqueSolar.size}`);
    console.log(`  Unique Wind projects: ${uniqueWind.size}`);
    console.log(`  Total unique projects: ${uniqueSolar.size + uniqueWind.size}`);
    console.log(`  Expected rows (projects * 3): ${(uniqueSolar.size + uniqueWind.size) * 3}`);
    console.log('='.repeat(80));
}

auditData().catch(console.error).finally(() => p.$disconnect());
