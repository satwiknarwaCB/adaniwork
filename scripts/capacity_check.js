const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCapacity() {
    const ps = await prisma.commissioningProject.findMany({
        where: { fiscalYear: 'FY_25-26', includedInTotal: true, planActual: 'Plan' }
    });

    const capacitySum = ps.reduce((s, x) => s + (x.capacity || 0), 0);
    const totalCapacitySum = ps.reduce((s, x) => s + (x.totalCapacity || 0), 0);

    console.log('capacity sum:', capacitySum.toFixed(1));
    console.log('totalCapacity sum:', totalCapacitySum.toFixed(1));
    console.log('diff:', (capacitySum - totalCapacitySum).toFixed(1));

    // The 'capacity' column stores the static capacity rating
    // The 'totalCapacity' column stores the sum of monthly phasing
    // For charts, we should use totalCapacity (which equals sum of months)
}

checkCapacity().catch(console.error).finally(() => prisma.$disconnect());
