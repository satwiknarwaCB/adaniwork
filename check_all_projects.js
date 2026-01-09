const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkAllProjects() {
    console.log('=== CHECKING ALL PROJECTS IN DATABASE ===\n');

    // Get all non-deleted projects
    const allProjects = await p.commissioningProject.findMany({
        where: { isDeleted: false },
        select: { projectName: true, category: true, section: true, planActual: true, spv: true }
    });

    // Separate Solar and Wind
    const solarProjects = allProjects.filter(p => p.category?.toLowerCase().includes('solar'));
    const windProjects = allProjects.filter(p => p.category?.toLowerCase().includes('wind'));

    console.log('TOTAL in DB:', allProjects.length);
    console.log('Solar rows:', solarProjects.length);
    console.log('Wind rows:', windProjects.length);

    // Count unique projects (by name+spv+section) - this is how the pages group them
    const solarPlanRows = solarProjects.filter(p => p.planActual === 'Plan');
    const windPlanRows = windProjects.filter(p => p.planActual === 'Plan');

    console.log('\n=== SOLAR ===');
    console.log('Plan rows in DB:', solarPlanRows.length);

    // Group by section
    const solarBySection = {};
    solarPlanRows.forEach(p => {
        const sec = p.section || 'Unknown';
        if (!solarBySection[sec]) solarBySection[sec] = [];
        solarBySection[sec].push(p);
    });

    Object.entries(solarBySection).forEach(([sec, projects]) => {
        console.log(`  Section ${sec}: ${projects.length} projects`);
    });

    console.log('\n=== WIND ===');
    console.log('Plan rows in DB:', windPlanRows.length);

    // Group by section
    const windBySection = {};
    windPlanRows.forEach(p => {
        const sec = p.section || 'Unknown';
        if (!windBySection[sec]) windBySection[sec] = [];
        windBySection[sec].push(p);
    });

    Object.entries(windBySection).forEach(([sec, projects]) => {
        console.log(`  Section ${sec}: ${projects.length} projects`);
    });

    // Check grouped projects (how the status pages show them)
    console.log('\n=== GROUPED PROJECTS (as shown on Status Pages) ===');

    // Solar grouping
    const solarGroups = new Set();
    solarProjects.forEach(p => {
        solarGroups.add(`${p.projectName}|${p.spv}|${p.section}`);
    });
    console.log('Solar unique groups (displayed):', solarGroups.size);

    // Wind grouping
    const windGroups = new Set();
    windProjects.forEach(p => {
        windGroups.add(`${p.projectName}|${p.spv}|${p.section}`);
    });
    console.log('Wind unique groups (displayed):', windGroups.size);
}

checkAllProjects().catch(console.error).finally(() => p.$disconnect());
