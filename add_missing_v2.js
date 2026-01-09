const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingProjects() {
    console.log('Adding 4 missing Solar Section A projects...\n');

    const missingProjects = [
        // S.No 2: AGEL Merchant, ARE50L, Merchant, A-02, 50 MW
        { sno: 2, projectName: 'AGEL Merchant', spv: 'ARE50L', projectType: 'Merchant', plotLocation: 'A-02', capacity: 50, planActual: 'Plan', apr: 0, may: 50, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 50, q1: 50, q2: 0, q3: 0, q4: 0, cummTillOct: 50 },
        { sno: 2, projectName: 'AGEL Merchant', spv: 'ARE50L', projectType: 'Merchant', plotLocation: 'A-02', capacity: 50, planActual: 'Rephase', apr: 0, may: 50, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 50, q1: 50, q2: 0, q3: 0, q4: 0, cummTillOct: 50 },
        { sno: 2, projectName: 'AGEL Merchant', spv: 'ARE50L', projectType: 'Merchant', plotLocation: 'A-02', capacity: 50, planActual: 'Actual', apr: 0, may: 50, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 50, q1: 50, q2: 0, q3: 0, q4: 0, cummTillOct: 50 },

        // S.No 4: MLP AP New, ARE57L, PPA, A-12, 350 MW
        { sno: 4, projectName: 'MLP AP New', spv: 'ARE57L', projectType: 'PPA', plotLocation: 'A-12', capacity: 350, planActual: 'Plan', apr: 0, may: 100, jun: 250, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 350, q1: 350, q2: 0, q3: 0, q4: 0, cummTillOct: 350 },
        { sno: 4, projectName: 'MLP AP New', spv: 'ARE57L', projectType: 'PPA', plotLocation: 'A-12', capacity: 350, planActual: 'Rephase', apr: 0, may: 50, jun: 175, jul: 75, aug: 50, sep: 0, oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 350, q1: 225, q2: 125, q3: 0, q4: 0, cummTillOct: 350 },
        { sno: 4, projectName: 'MLP AP New', spv: 'ARE57L', projectType: 'PPA', plotLocation: 'A-12', capacity: 350, planActual: 'Actual', apr: 0, may: 50, jun: 175, jul: 0, aug: 0, sep: 0, oct: 0, nov: 125, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 350, q1: 225, q2: 0, q3: 125, q4: 0, cummTillOct: 350 },

        // S.No 14: AGEL Merchant, AGE24L, Merchant, A-11, 150 MW
        { sno: 14, projectName: 'AGEL Merchant', spv: 'AGE24L', projectType: 'Merchant', plotLocation: 'A-11', capacity: 150, planActual: 'Plan', apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 150, jan: 0, feb: 0, mar: 0, totalCapacity: 150, q1: 0, q2: 0, q3: 0, q4: 150, cummTillOct: 0 },
        { sno: 14, projectName: 'AGEL Merchant', spv: 'AGE24L', projectType: 'Merchant', plotLocation: 'A-11', capacity: 150, planActual: 'Rephase', apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 50, jan: 100, feb: 0, mar: 0, totalCapacity: 150, q1: 0, q2: 0, q3: 0, q4: 150, cummTillOct: 0 },
        { sno: 14, projectName: 'AGEL Merchant', spv: 'AGE24L', projectType: 'Merchant', plotLocation: 'A-11', capacity: 150, planActual: 'Actual', apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 75, jan: 75, feb: 0, mar: 0, totalCapacity: 150, q1: 0, q2: 0, q3: 0, q4: 150, cummTillOct: 0 },

        // S.No 22: MLP T3 AP, AGE25CL, PPA, A-8, 425 MW
        { sno: 22, projectName: 'MLP T3 AP', spv: 'AGE25CL', projectType: 'PPA', plotLocation: 'A-8', capacity: 425, planActual: 'Plan', apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 425, dec: 0, jan: 0, feb: 0, mar: 0, totalCapacity: 425, q1: 0, q2: 0, q3: 425, q4: 0, cummTillOct: 0 },
        { sno: 22, projectName: 'MLP T3 AP', spv: 'AGE25CL', projectType: 'PPA', plotLocation: 'A-8', capacity: 425, planActual: 'Rephase', apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 150, jan: 150, feb: 125, mar: 0, totalCapacity: 425, q1: 0, q2: 0, q3: 0, q4: 425, cummTillOct: 0 },
        { sno: 22, projectName: 'MLP T3 AP', spv: 'AGE25CL', projectType: 'PPA', plotLocation: 'A-8', capacity: 425, planActual: 'Actual', apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 100, jan: 150, feb: 175, mar: 0, totalCapacity: 425, q1: 0, q2: 0, q3: 0, q4: 425, cummTillOct: 0 }
    ];

    for (const proj of missingProjects) {
        try {
            const created = await prisma.commissioningProject.create({
                data: {
                    fiscalYear: 'FY_25-26',
                    category: 'Khavda Solar',
                    section: 'A',
                    includedInTotal: true,
                    isDeleted: false,
                    ...proj
                }
            });
            console.log(`✅ Added: S.No ${proj.sno} | ${proj.projectName} | ${proj.planActual} | ID: ${created.id}`);
        } catch (err) {
            console.log(`❌ Error: S.No ${proj.sno} | ${proj.projectName} | ${proj.planActual}:`, err.message);
        }
    }

    // Verify
    const count = await prisma.commissioningProject.count({ where: { isDeleted: false } });
    const sectionA = await prisma.commissioningProject.count({
        where: { isDeleted: false, section: 'A', category: 'Khavda Solar', planActual: 'Plan' }
    });

    console.log('\n=== VERIFICATION ===');
    console.log('Total projects:', count);
    console.log('Section A Solar (Plan rows):', sectionA);
}

addMissingProjects().catch(err => console.error('Error:', err)).finally(() => prisma.$disconnect());
