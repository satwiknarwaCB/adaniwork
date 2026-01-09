const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function exportToSQL() {
    console.log('Exporting database to SQL file...\n');

    let sql = '-- AGEL Commissioning Tracker Database Export\n';
    sql += '-- Generated: ' + new Date().toISOString() + '\n\n';

    // Export commissioning_projects
    const projects = await p.commissioningProject.findMany({ where: { isDeleted: false } });
    console.log('Projects:', projects.length);

    sql += '-- Commissioning Projects\n';
    sql += 'CREATE TABLE IF NOT EXISTS commissioning_projects (\n';
    sql += '  id SERIAL PRIMARY KEY,\n';
    sql += '  fiscal_year VARCHAR(20),\n';
    sql += '  sno INTEGER,\n';
    sql += '  project_name VARCHAR(255),\n';
    sql += '  spv VARCHAR(255),\n';
    sql += '  project_type VARCHAR(100),\n';
    sql += '  plot_location VARCHAR(255),\n';
    sql += '  capacity FLOAT,\n';
    sql += '  plan_actual VARCHAR(50),\n';
    sql += '  apr FLOAT, may FLOAT, jun FLOAT,\n';
    sql += '  jul FLOAT, aug FLOAT, sep FLOAT,\n';
    sql += '  oct FLOAT, nov FLOAT, dec FLOAT,\n';
    sql += '  jan FLOAT, feb FLOAT, mar FLOAT,\n';
    sql += '  total_capacity FLOAT,\n';
    sql += '  cumm_till_oct FLOAT,\n';
    sql += '  q1 FLOAT, q2 FLOAT, q3 FLOAT, q4 FLOAT,\n';
    sql += '  category VARCHAR(255),\n';
    sql += '  section VARCHAR(10),\n';
    sql += '  included_in_total BOOLEAN DEFAULT TRUE,\n';
    sql += '  is_deleted BOOLEAN DEFAULT FALSE,\n';
    sql += '  created_at TIMESTAMP DEFAULT NOW(),\n';
    sql += '  updated_at TIMESTAMP DEFAULT NOW()\n';
    sql += ');\n\n';

    sql += 'DELETE FROM commissioning_projects;\n\n';

    for (const proj of projects) {
        const vals = [
            proj.fiscalYear ? `'${proj.fiscalYear}'` : 'NULL',
            proj.sno ?? 'NULL',
            proj.projectName ? `'${proj.projectName.replace(/'/g, "''")}'` : 'NULL',
            proj.spv ? `'${proj.spv.replace(/'/g, "''")}'` : 'NULL',
            proj.projectType ? `'${proj.projectType.replace(/'/g, "''")}'` : 'NULL',
            proj.plotLocation ? `'${proj.plotLocation.replace(/'/g, "''")}'` : 'NULL',
            proj.capacity ?? 'NULL',
            proj.planActual ? `'${proj.planActual}'` : 'NULL',
            proj.apr ?? 'NULL', proj.may ?? 'NULL', proj.jun ?? 'NULL',
            proj.jul ?? 'NULL', proj.aug ?? 'NULL', proj.sep ?? 'NULL',
            proj.oct ?? 'NULL', proj.nov ?? 'NULL', proj.dec ?? 'NULL',
            proj.jan ?? 'NULL', proj.feb ?? 'NULL', proj.mar ?? 'NULL',
            proj.totalCapacity ?? 'NULL',
            proj.cummTillOct ?? 'NULL',
            proj.q1 ?? 'NULL', proj.q2 ?? 'NULL', proj.q3 ?? 'NULL', proj.q4 ?? 'NULL',
            proj.category ? `'${proj.category.replace(/'/g, "''")}'` : 'NULL',
            proj.section ? `'${proj.section}'` : 'NULL',
            proj.includedInTotal,
            false
        ];
        sql += `INSERT INTO commissioning_projects (fiscal_year, sno, project_name, spv, project_type, plot_location, capacity, plan_actual, apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar, total_capacity, cumm_till_oct, q1, q2, q3, q4, category, section, included_in_total, is_deleted) VALUES (${vals.join(', ')});\n`;
    }

    // Export dropdown_options
    const options = await p.dropdownOption.findMany();
    console.log('Dropdown Options:', options.length);

    sql += '\n-- Dropdown Options\n';
    sql += 'CREATE TABLE IF NOT EXISTS dropdown_options (\n';
    sql += '  id SERIAL PRIMARY KEY,\n';
    sql += '  option_type VARCHAR(100),\n';
    sql += '  option_value VARCHAR(255),\n';
    sql += '  fiscal_year VARCHAR(20)\n';
    sql += ');\n\n';

    sql += 'DELETE FROM dropdown_options;\n\n';

    for (const opt of options) {
        sql += `INSERT INTO dropdown_options (option_type, option_value, fiscal_year) VALUES ('${opt.optionType}', '${opt.optionValue.replace(/'/g, "''")}', '${opt.fiscalYear}');\n`;
    }

    // Write to file
    fs.writeFileSync('adani_tracker_backup.sql', sql);
    console.log('\n✅ Exported to: adani_tracker_backup.sql');
    console.log('File size:', (fs.statSync('adani_tracker_backup.sql').size / 1024).toFixed(2), 'KB');
}

exportToSQL().catch(console.error).finally(() => p.$disconnect());
