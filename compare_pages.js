const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function comparePages() {
    console.log('=== COMPARING DATA BETWEEN PAGES ===\n');

    // All projects in DB
    const allProjects = await p.commissioningProject.findMany({
        where: { isDeleted: false, planActual: 'Plan' },
        select: { projectName: true, category: true, section: true, spv: true }
    });

    console.log('TOTAL Plan rows in DB:', allProjects.length);

    // Commissioning Status Page shows: ALL projects
    console.log('\n--- Commissioning Status Page would show ---');
    console.log('All Plan rows:', allProjects.length);

    // Solar page shows: only projects with category containing 'solar'
    const solarProjects = allProjects.filter(p => p.category?.toLowerCase().includes('solar'));
    console.log('\n--- Solar Page would show ---');
    console.log('Solar Plan rows:', solarProjects.length);

    // Section A specifically
    const sectionA = solarProjects.filter(p => p.section === 'A');
    console.log('Section A only:', sectionA.length);

    // Wind page shows: only projects with category containing 'wind'  
    const windProjects = allProjects.filter(p => p.category?.toLowerCase().includes('wind'));
    console.log('\n--- Wind Page would show ---');
    console.log('Wind Plan rows:', windProjects.length);

    console.log('\n=== CONCLUSION ===');
    console.log('All pages read from the SAME database.');
    console.log('The database only has', sectionA.length, 'Solar Section A projects.');
    console.log('Your Excel has 22, so', 22 - sectionA.length, 'were NOT imported during upload.');
}

comparePages().catch(console.error).finally(() => p.$disconnect());
