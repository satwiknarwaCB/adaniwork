const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const ps = await prisma.commissioningProject.findMany({
        where: { fiscalYear: 'FY_25-26', includedInTotal: true }
    });

    // H2 = Oct, Nov, Dec, Jan, Feb, Mar
    const h2Months = ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

    console.log('=== KHAVDA SOLAR - H2 (Oct-Mar) ===');
    const khavdaSolar = ps.filter(p => (p.category || '').toLowerCase().includes('khavda') && (p.category || '').toLowerCase().includes('solar'));
    const ksPlan = khavdaSolar.filter(p => p.planActual === 'Plan');
    const ksActual = khavdaSolar.filter(p => p.planActual === 'Actual');

    const ksPlanH2 = ksPlan.reduce((s, p) => s + h2Months.reduce((ms, m) => ms + (p[m] || 0), 0), 0);
    const ksActualH2 = ksActual.reduce((s, p) => s + h2Months.reduce((ms, m) => ms + (p[m] || 0), 0), 0);

    console.log('Plan H2 Total:', ksPlanH2.toFixed(1), 'MW');
    console.log('Actual H2 Total:', ksActualH2.toFixed(1), 'MW');
    console.log('Achievement:', ((ksActualH2 / ksPlanH2) * 100).toFixed(1) + '%');
    console.log('Website shows: Target=1,267 MW, Achieved=2,367 MW, 186.8%');
    console.log('Match:', Math.abs(ksPlanH2 - 1267) < 10 && Math.abs(ksActualH2 - 2367) < 10 ? 'YES' : 'NO - INVESTIGATE');

    console.log('\n=== KHAVDA WIND - H2 (Oct-Mar) ===');
    const khavdaWind = ps.filter(p => (p.category || '').toLowerCase().includes('khavda') && (p.category || '').toLowerCase().includes('wind'));
    const kwPlan = khavdaWind.filter(p => p.planActual === 'Plan');
    const kwActual = khavdaWind.filter(p => p.planActual === 'Actual');

    const kwPlanH2 = kwPlan.reduce((s, p) => s + h2Months.reduce((ms, m) => ms + (p[m] || 0), 0), 0);
    const kwActualH2 = kwActual.reduce((s, p) => s + h2Months.reduce((ms, m) => ms + (p[m] || 0), 0), 0);

    console.log('Plan H2 Total:', kwPlanH2.toFixed(1), 'MW');
    console.log('Actual H2 Total:', kwActualH2.toFixed(1), 'MW');
    console.log('Achievement:', ((kwActualH2 / kwPlanH2) * 100).toFixed(1) + '%');
    console.log('Website shows: Target=374.4 MW, Achieved=613.6 MW, 163.9%');
    console.log('Match:', Math.abs(kwPlanH2 - 374.4) < 10 && Math.abs(kwActualH2 - 613.6) < 10 ? 'YES' : 'NO - INVESTIGATE');

    // Also check full year for context
    console.log('\n=== FULL YEAR CONTEXT ===');
    console.log('Khavda Solar - Full Year Plan:', ksPlan.reduce((s, p) => s + (p.totalCapacity || 0), 0).toFixed(1), 'MW');
    console.log('Khavda Solar - Full Year Actual:', ksActual.reduce((s, p) => s + (p.totalCapacity || 0), 0).toFixed(1), 'MW');
    console.log('Khavda Wind - Full Year Plan:', kwPlan.reduce((s, p) => s + (p.totalCapacity || 0), 0).toFixed(1), 'MW');
    console.log('Khavda Wind - Full Year Actual:', kwActual.reduce((s, p) => s + (p.totalCapacity || 0), 0).toFixed(1), 'MW');
}

verify().catch(console.error).finally(() => prisma.$disconnect());
