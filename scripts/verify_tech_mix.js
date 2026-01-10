const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTechMix() {
    const ps = await prisma.commissioningProject.findMany({
        where: { fiscalYear: 'FY_25-26', includedInTotal: true, planActual: 'Plan' }
    });

    const solar = ps.filter(p => (p.category || '').toLowerCase().includes('solar'));
    const wind = ps.filter(p => (p.category || '').toLowerCase().includes('wind'));

    // Screenshot 1: HALF (H1 = Q1 + Q2)
    console.log('=== SCREENSHOT 1: HALF (H1 = Apr-Sep) ===');
    const solarH1 = solar.reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0);
    const windH1 = wind.reduce((s, p) => s + (p.q1 || 0) + (p.q2 || 0), 0);
    const totalH1 = solarH1 + windH1;
    console.log('Solar H1:', solarH1.toFixed(1), 'MW', '(' + ((solarH1 / totalH1) * 100).toFixed(1) + '%)');
    console.log('Wind H1:', windH1.toFixed(1), 'MW', '(' + ((windH1 / totalH1) * 100).toFixed(1) + '%)');
    console.log('Total:', totalH1.toFixed(1), 'MW');
    console.log('Website shows: 4,321.5 MW (Solar 82.6%, Wind 17.4%)');
    console.log('Match:', Math.abs(totalH1 - 4321.5) < 1 ? '✅ YES' : '❌ NO');

    // Screenshot 2: QUARTERLY (Q3 = Oct-Dec)
    console.log('\n=== SCREENSHOT 2: QUARTERLY (Q3 = Oct-Dec) ===');
    const solarQ3 = solar.reduce((s, p) => s + (p.q3 || 0), 0);
    const windQ3 = wind.reduce((s, p) => s + (p.q3 || 0), 0);
    const totalQ3 = solarQ3 + windQ3;
    console.log('Solar Q3:', solarQ3.toFixed(1), 'MW', '(' + ((solarQ3 / totalQ3) * 100).toFixed(1) + '%)');
    console.log('Wind Q3:', windQ3.toFixed(1), 'MW', '(' + ((windQ3 / totalQ3) * 100).toFixed(1) + '%)');
    console.log('Total:', totalQ3.toFixed(1), 'MW');
    console.log('Website shows: 2,113 MW (Solar 85.2%, Wind 14.8%)');
    console.log('Match:', Math.abs(totalQ3 - 2113) < 1 ? '✅ YES' : '❌ NO');

    // Screenshot 3: MONTHLY (Oct)
    console.log('\n=== SCREENSHOT 3: MONTHLY (Oct) ===');
    const solarOct = solar.reduce((s, p) => s + (p.oct || 0), 0);
    const windOct = wind.reduce((s, p) => s + (p.oct || 0), 0);
    const totalOct = solarOct + windOct;
    console.log('Solar Oct:', solarOct.toFixed(1), 'MW', '(' + ((solarOct / totalOct) * 100).toFixed(1) + '%)');
    console.log('Wind Oct:', windOct.toFixed(1), 'MW', '(' + ((windOct / totalOct) * 100).toFixed(1) + '%)');
    console.log('Total:', totalOct.toFixed(1), 'MW');
    console.log('Website shows: 419 MW (Solar 87.6%, Wind 12.4%)');
    console.log('Match:', Math.abs(totalOct - 419) < 1 ? '✅ YES' : '❌ NO');

    // Also verify YEARLY for completeness
    console.log('\n=== YEARLY (Full FY) ===');
    const solarTotal = solar.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const windTotal = wind.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const total = solarTotal + windTotal;
    console.log('Solar:', solarTotal.toFixed(1), 'MW', '(' + ((solarTotal / total) * 100).toFixed(1) + '%)');
    console.log('Wind:', windTotal.toFixed(1), 'MW', '(' + ((windTotal / total) * 100).toFixed(1) + '%)');
    console.log('Total:', total.toFixed(1), 'MW');
}

verifyTechMix().catch(console.error).finally(() => prisma.$disconnect());
