/**
 * Comprehensive Data Test Script
 * Tests all aspects of data accuracy
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fullTest() {
    console.log('='.repeat(70));
    console.log(' COMPREHENSIVE DATA ACCURACY TEST');
    console.log('='.repeat(70));

    // Expected from Excel (based on the screenshot)
    const EXPECTED = {
        'Solar': {
            'A': { name: 'Khavda Solar', minProjects: 22 },  // 22 rows in Section A
            'B': { name: 'Rajasthan Solar', minProjects: 4 },
            'C': { name: 'Rajasthan Additional', minProjects: 1 },
        },
        'Wind': {
            'A': { name: 'Khavda Wind', minProjects: 12 },
            'B': { name: 'Khavda Wind Internal', minProjects: 1 },
            'C': { name: 'Mundra Wind', minProjects: 1 },
            'D': { name: 'Mundra Wind Internal', minProjects: 1 },
        }
    };

    let allPassed = true;

    // Test 1: Solar sections
    console.log('\n🔶 SOLAR PROJECTS');
    console.log('-'.repeat(70));

    for (const [section, info] of Object.entries(EXPECTED['Solar'])) {
        const projects = await p.commissioningProject.findMany({
            where: {
                isDeleted: false,
                category: { contains: 'Solar' },
                section: section,
                planActual: 'Plan'
            },
            select: { projectName: true, spv: true }
        });

        const unique = new Set(projects.map(p => `${p.projectName}|${p.spv}`));
        const status = unique.size >= info.minProjects ? '✅' : '❌';

        console.log(`${status} Section ${section} (${info.name}): ${unique.size} projects (expected >= ${info.minProjects})`);

        if (unique.size < info.minProjects) allPassed = false;
    }

    // Total Solar
    const totalSolar = await p.commissioningProject.findMany({
        where: { isDeleted: false, category: { contains: 'Solar' }, planActual: 'Plan' },
        select: { projectName: true, spv: true, section: true }
    });
    const uniqueSolar = new Set(totalSolar.map(p => `${p.projectName}|${p.spv}|${p.section}`));
    console.log(`\n   📌 Total Unique Solar Projects: ${uniqueSolar.size}`);

    // Test 2: Wind sections
    console.log('\n🔷 WIND PROJECTS');
    console.log('-'.repeat(70));

    for (const [section, info] of Object.entries(EXPECTED['Wind'])) {
        const projects = await p.commissioningProject.findMany({
            where: {
                isDeleted: false,
                category: { contains: 'Wind' },
                section: section,
                planActual: 'Plan'
            },
            select: { projectName: true, spv: true }
        });

        const unique = new Set(projects.map(p => `${p.projectName}|${p.spv}`));
        const status = unique.size >= info.minProjects ? '✅' : '❌';

        console.log(`${status} Section ${section} (${info.name}): ${unique.size} projects (expected >= ${info.minProjects})`);

        if (unique.size < info.minProjects) allPassed = false;
    }

    // Total Wind
    const totalWind = await p.commissioningProject.findMany({
        where: { isDeleted: false, category: { contains: 'Wind' }, planActual: 'Plan' },
        select: { projectName: true, spv: true, section: true }
    });
    const uniqueWind = new Set(totalWind.map(p => `${p.projectName}|${p.spv}|${p.section}`));
    console.log(`\n   📌 Total Unique Wind Projects: ${uniqueWind.size}`);

    // Test 3: Check Plan/Rephase/Actual completeness
    console.log('\n📊 PLAN/REPHASE/ACTUAL COMPLETENESS');
    console.log('-'.repeat(70));

    const all = await p.commissioningProject.findMany({
        where: { isDeleted: false },
        select: { projectName: true, spv: true, section: true, planActual: true, category: true }
    });

    const groups = new Map();
    all.forEach(proj => {
        const key = `${proj.projectName}|${proj.spv}|${proj.section}|${proj.category}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(proj.planActual);
    });

    let complete = 0;
    let incomplete = 0;
    groups.forEach((types, key) => {
        const hasPlan = types.includes('Plan');
        const hasRephase = types.includes('Rephase');
        const hasActual = types.includes('Actual');
        if (hasPlan && hasRephase && hasActual) {
            complete++;
        } else {
            incomplete++;
        }
    });

    console.log(`✅ Projects with all 3 types: ${complete}`);
    console.log(`${incomplete > 0 ? '❌' : '✅'} Projects missing types: ${incomplete}`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(' SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total rows in DB: ${all.length}`);
    console.log(`Unique Solar: ${uniqueSolar.size} | Unique Wind: ${uniqueWind.size}`);
    console.log(`Complete project groups: ${complete} | Incomplete: ${incomplete}`);
    console.log(`Overall: ${allPassed && incomplete === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(70));
}

fullTest().catch(console.error).finally(() => p.$disconnect());
