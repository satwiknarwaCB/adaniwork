const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkSolarProjects() {
    // Count unique solar projects by planActual type
    const solarProjects = await p.commissioningProject.findMany({
        where: {
            isDeleted: false,
            category: { contains: 'Solar' }
        },
        select: { projectName: true, category: true, section: true, planActual: true }
    });

    // Group by Plan type to count unique projects
    const planProjects = solarProjects.filter(p => p.planActual === 'Plan');
    const uniqueNames = [...new Set(planProjects.map(p => p.projectName))];

    console.log('=== Solar Project Count ===');
    console.log('Total Solar rows in DB:', solarProjects.length);
    console.log('Plan rows:', planProjects.length);
    console.log('Unique project names:', uniqueNames.length);
    console.log('\nProjects by Section:');

    // Count by section
    const sections = {};
    planProjects.forEach(p => {
        const key = p.section || 'Unknown';
        sections[key] = (sections[key] || 0) + 1;
    });
    Object.entries(sections).forEach(([sec, count]) => {
        console.log(`  Section ${sec}: ${count} projects`);
    });

    console.log('\nProject Names:');
    uniqueNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
}

checkSolarProjects().catch(console.error).finally(() => p.$disconnect());
