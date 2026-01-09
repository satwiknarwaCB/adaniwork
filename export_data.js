const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function exportAll() {
    console.log('Exporting all data from local database...\n');

    // Export projects
    const projects = await p.commissioningProject.findMany({
        where: { isDeleted: false },
        orderBy: [{ category: 'asc' }, { sno: 'asc' }]
    });
    fs.writeFileSync('chatbot_export/projects.json', JSON.stringify(projects, null, 2));
    console.log(`✅ Exported ${projects.length} projects`);

    // Export summaries
    const summaries = await p.commissioningSummary.findMany({
        where: { isDeleted: false }
    });
    fs.writeFileSync('chatbot_export/summaries.json', JSON.stringify(summaries, null, 2));
    console.log(`✅ Exported ${summaries.length} summaries`);

    // Export dropdown options
    const options = await p.dropdownOption.findMany();
    fs.writeFileSync('chatbot_export/dropdown_options.json', JSON.stringify(options, null, 2));
    console.log(`✅ Exported ${options.length} dropdown options`);

    console.log('\n📁 All data exported to chatbot_export/ folder');
    console.log('Share this folder + schema.prisma + CHATBOT_INTEGRATION.md');
}

exportAll().catch(console.error).finally(() => p.$disconnect());
