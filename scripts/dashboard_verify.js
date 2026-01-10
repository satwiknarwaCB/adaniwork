const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullVerification() {
    const ps = await prisma.commissioningProject.findMany({
        where: { fiscalYear: 'FY_25-26' }
    });

    const included = ps.filter(p => p.includedInTotal);
    const plan = included.filter(p => p.planActual === 'Plan');
    const rephase = included.filter(p => p.planActual === 'Rephase');
    const actual = included.filter(p => p.planActual === 'Actual');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('        COMPREHENSIVE DASHBOARD VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ==================== KPI CARDS ====================
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    KPI CARDS (TOP)                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    const planTotal = plan.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const rephaseTotal = rephase.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const actualTotal = actual.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const achievement = (actualTotal / planTotal) * 100;
    const projectCount = new Set(plan.map(p => `${p.projectName}|${p.spv}`)).size;

    console.log('Card 1 - PLAN CAPACITY:', planTotal.toFixed(1), 'MW');
    console.log('Card 1 - REPHASE CAPACITY:', rephaseTotal.toFixed(1), 'MW');
    console.log('Card 2 - ACTUAL COMMISSIONING:', actualTotal.toFixed(1), 'MW');
    console.log('Card 3 - STATUS PERFORMANCE:', achievement.toFixed(2) + '%');
    console.log('Project Segments:', projectCount);

    // ==================== OVERALL ACHIEVEMENT PIE ====================
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│              OVERALL ACHIEVEMENT GAUGE                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    const periods = [
        { name: 'Yearly (Full FY)', plan: planTotal, actual: actualTotal },
        {
            name: 'Half (H1 Apr-Sep)',
            plan: plan.reduce((s, p) => s + ['apr', 'may', 'jun', 'jul', 'aug', 'sep'].reduce((m, k) => m + (p[k] || 0), 0), 0),
            actual: actual.reduce((s, p) => s + ['apr', 'may', 'jun', 'jul', 'aug', 'sep'].reduce((m, k) => m + (p[k] || 0), 0), 0)
        },
        {
            name: 'Half (H2 Oct-Mar)',
            plan: plan.reduce((s, p) => s + ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'].reduce((m, k) => m + (p[k] || 0), 0), 0),
            actual: actual.reduce((s, p) => s + ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'].reduce((m, k) => m + (p[k] || 0), 0), 0)
        },
        { name: 'Quarterly (Q1)', plan: plan.reduce((s, p) => s + (p.q1 || 0), 0), actual: actual.reduce((s, p) => s + (p.q1 || 0), 0) },
        { name: 'Quarterly (Q2)', plan: plan.reduce((s, p) => s + (p.q2 || 0), 0), actual: actual.reduce((s, p) => s + (p.q2 || 0), 0) },
        { name: 'Quarterly (Q3)', plan: plan.reduce((s, p) => s + (p.q3 || 0), 0), actual: actual.reduce((s, p) => s + (p.q3 || 0), 0) },
        { name: 'Quarterly (Q4)', plan: plan.reduce((s, p) => s + (p.q4 || 0), 0), actual: actual.reduce((s, p) => s + (p.q4 || 0), 0) },
        { name: 'Monthly (Oct)', plan: plan.reduce((s, p) => s + (p.oct || 0), 0), actual: actual.reduce((s, p) => s + (p.oct || 0), 0) },
    ];

    periods.forEach(p => {
        const ach = p.plan > 0 ? (p.actual / p.plan * 100) : 0;
        console.log(`${p.name}: Plan=${p.plan.toFixed(1)} | Actual=${p.actual.toFixed(1)} | Ach=${ach.toFixed(1)}%`);
    });

    // ==================== TECHNOLOGY MIX ====================
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│                   TECHNOLOGY MIX                             │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    const solar = plan.filter(p => (p.category || '').toLowerCase().includes('solar'));
    const wind = plan.filter(p => (p.category || '').toLowerCase().includes('wind'));

    const techViews = [
        { name: 'Yearly', solar: solar.reduce((s, p) => s + (p.totalCapacity || 0), 0), wind: wind.reduce((s, p) => s + (p.totalCapacity || 0), 0) },
        { name: 'Half (H1)', solar: solar.reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0), wind: wind.reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0) },
        { name: 'Quarterly (Q3)', solar: solar.reduce((s, p) => s + (p.q3 || 0), 0), wind: wind.reduce((s, p) => s + (p.q3 || 0), 0) },
        { name: 'Monthly (Oct)', solar: solar.reduce((s, p) => s + (p.oct || 0), 0), wind: wind.reduce((s, p) => s + (p.oct || 0), 0) },
    ];

    techViews.forEach(v => {
        const total = v.solar + v.wind;
        console.log(`${v.name}: Total=${total.toFixed(1)} | Solar=${v.solar.toFixed(1)} (${(v.solar / total * 100).toFixed(1)}%) | Wind=${v.wind.toFixed(1)} (${(v.wind / total * 100).toFixed(1)}%)`);
    });

    // ==================== BUSINESS MODEL SPLIT ====================
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│                 BUSINESS MODEL SPLIT                         │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    const modelViews = [
        {
            name: 'Yearly',
            ppa: plan.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (p.totalCapacity || 0), 0),
            merchant: plan.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (p.totalCapacity || 0), 0),
            group: plan.filter(p => p.projectType === 'Group').reduce((s, p) => s + (p.totalCapacity || 0), 0)
        },
        {
            name: 'Half (H1)',
            ppa: plan.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0),
            merchant: plan.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0),
            group: plan.filter(p => p.projectType === 'Group').reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0)
        },
        {
            name: 'Quarterly (Q3)',
            ppa: plan.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (p.q3 || 0), 0),
            merchant: plan.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (p.q3 || 0), 0),
            group: plan.filter(p => p.projectType === 'Group').reduce((s, p) => s + (p.q3 || 0), 0)
        },
        {
            name: 'Monthly (Oct)',
            ppa: plan.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (p.oct || 0), 0),
            merchant: plan.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (p.oct || 0), 0),
            group: plan.filter(p => p.projectType === 'Group').reduce((s, p) => s + (p.oct || 0), 0)
        },
    ];

    modelViews.forEach(v => {
        const total = v.ppa + v.merchant + v.group;
        console.log(`${v.name}: Total=${total.toFixed(1)} | PPA=${v.ppa.toFixed(1)} (${(v.ppa / total * 100).toFixed(1)}%) | Merchant=${v.merchant.toFixed(1)} (${(v.merchant / total * 100).toFixed(1)}%) | Group=${v.group.toFixed(1)} (${(v.group / total * 100).toFixed(1)}%)`);
    });

    // ==================== QUARTERLY PERFORMANCE BAR CHART ====================
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│            QUARTERLY PERFORMANCE BAR CHART                   │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    ['q1', 'q2', 'q3', 'q4'].forEach((q, i) => {
        const planQ = plan.reduce((s, p) => s + (p[q] || 0), 0);
        const actualQ = actual.reduce((s, p) => s + (p[q] || 0), 0);
        const rephaseQ = rephase.reduce((s, p) => s + (p[q] || 0), 0);
        console.log(`Q${i + 1}: Plan=${planQ.toFixed(1)} | Actual=${actualQ.toFixed(1)} | Rephase=${rephaseQ.toFixed(1)} | Dev=${(actualQ - planQ).toFixed(1)}`);
    });

    // ==================== CATEGORY-SPECIFIC ACHIEVEMENTS ====================
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│          CATEGORY-SPECIFIC ACHIEVEMENTS                      │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    const categories = ['Khavda Solar', 'Rajasthan Solar', 'Khavda Wind', 'Mundra Wind'];
    categories.forEach(cat => {
        const catPlan = plan.filter(p => (p.category || '').includes(cat));
        const catActual = actual.filter(p => (p.category || '').includes(cat));

        if (catPlan.length > 0) {
            const planY = catPlan.reduce((s, p) => s + (p.totalCapacity || 0), 0);
            const actualY = catActual.reduce((s, p) => s + (p.totalCapacity || 0), 0);
            const planH2 = catPlan.reduce((s, p) => s + ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'].reduce((m, k) => m + (p[k] || 0), 0), 0);
            const actualH2 = catActual.reduce((s, p) => s + ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'].reduce((m, k) => m + (p[k] || 0), 0), 0);
            console.log(`${cat}:`);
            console.log(`  Yearly:  Plan=${planY.toFixed(1)} | Actual=${actualY.toFixed(1)} | Ach=${(planY > 0 ? (actualY / planY * 100) : 0).toFixed(1)}%`);
            console.log(`  H2:      Plan=${planH2.toFixed(1)} | Actual=${actualH2.toFixed(1)} | Ach=${(planH2 > 0 ? (actualH2 / planH2 * 100) : 0).toFixed(1)}%`);
        }
    });

    // ==================== AGEL OVERALL SUMMARY TABLE ====================
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│             AGEL OVERALL SUMMARY TABLE                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');

    const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
    console.log('\nPLAN Row:');
    months.forEach(m => console.log(`  ${m.toUpperCase()}: ${plan.reduce((s, p) => s + (p[m] || 0), 0).toFixed(1)}`));
    console.log(`  TOTAL: ${planTotal.toFixed(1)}`);

    console.log('\nREPHASE Row:');
    months.forEach(m => console.log(`  ${m.toUpperCase()}: ${rephase.reduce((s, p) => s + (p[m] || 0), 0).toFixed(1)}`));
    console.log(`  TOTAL: ${rephaseTotal.toFixed(1)}`);

    console.log('\nACTUAL Row:');
    months.forEach(m => console.log(`  ${m.toUpperCase()}: ${actual.reduce((s, p) => s + (p[m] || 0), 0).toFixed(1)}`));
    console.log(`  TOTAL: ${actualTotal.toFixed(1)}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                   VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
}

fullVerification().catch(console.error).finally(() => prisma.$disconnect());
