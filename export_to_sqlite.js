const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportToSQLite() {
    console.log('Exporting PostgreSQL to fresh SQLite...\n');

    // Delete old file if exists
    const dbPath = 'adani_tracker_fresh.db';
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    // Create new SQLite database
    const sqlite = new Database(dbPath);

    // Create tables
    sqlite.exec(`
        CREATE TABLE commissioning_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fiscal_year TEXT,
            sno INTEGER,
            project_name TEXT,
            spv TEXT,
            project_type TEXT,
            plot_location TEXT,
            capacity REAL,
            plan_actual TEXT,
            apr REAL, may REAL, jun REAL,
            jul REAL, aug REAL, sep REAL,
            oct REAL, nov REAL, dec REAL,
            jan REAL, feb REAL, mar REAL,
            total_capacity REAL,
            cumm_till_oct REAL,
            q1 REAL, q2 REAL, q3 REAL, q4 REAL,
            category TEXT,
            section TEXT,
            included_in_total INTEGER DEFAULT 1,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT
        );
        
        CREATE TABLE dropdown_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            option_type TEXT,
            option_value TEXT,
            fiscal_year TEXT
        );
    `);

    // Get data from PostgreSQL
    const projects = await prisma.commissioningProject.findMany({ where: { isDeleted: false } });
    const options = await prisma.dropdownOption.findMany();

    console.log('Projects to export:', projects.length);
    console.log('Dropdown options to export:', options.length);

    // Insert projects
    const insertProject = sqlite.prepare(`
        INSERT INTO commissioning_projects 
        (fiscal_year, sno, project_name, spv, project_type, plot_location, capacity, plan_actual,
         apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar,
         total_capacity, cumm_till_oct, q1, q2, q3, q4, category, section, included_in_total, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of projects) {
        insertProject.run(
            p.fiscalYear, p.sno, p.projectName, p.spv, p.projectType, p.plotLocation, p.capacity, p.planActual,
            p.apr, p.may, p.jun, p.jul, p.aug, p.sep, p.oct, p.nov, p.dec, p.jan, p.feb, p.mar,
            p.totalCapacity, p.cummTillOct, p.q1, p.q2, p.q3, p.q4, p.category, p.section,
            p.includedInTotal ? 1 : 0, 0
        );
    }

    // Insert dropdown options
    const insertOption = sqlite.prepare(`
        INSERT INTO dropdown_options (option_type, option_value, fiscal_year)
        VALUES (?, ?, ?)
    `);

    for (const opt of options) {
        insertOption.run(opt.optionType, opt.optionValue, opt.fiscalYear);
    }

    sqlite.close();

    const size = fs.statSync(dbPath).size;
    console.log('\n✅ Created:', dbPath);
    console.log('File size:', (size / 1024).toFixed(2), 'KB');
    console.log('\nSend this file to them!');
}

exportToSQLite().catch(console.error).finally(() => prisma.$disconnect());
