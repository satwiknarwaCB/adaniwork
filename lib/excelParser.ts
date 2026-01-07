import * as XLSX from 'xlsx';
import { prisma } from './prisma';

export interface ExcelParseResult {
    projects: any[];
    summaries: any[];
    errors: string[];
    sheets_found: string[];
}

const SECTION_MARKERS: Record<string, [string, string, boolean]> = {
    // Solar Sections
    'a. khavda solar projects': ['Khavda Solar', 'A', true],
    'a. khavda solar': ['Khavda Solar', 'A', true],
    'b. rajasthan solar projects': ['Rajasthan Solar', 'B', true],
    'b. rajasthan solar': ['Rajasthan Solar', 'B', true],
    'c. rajasthan solar projects': ['Rajasthan Solar Additional 500MW', 'C', true],
    'c. rajasthan solar': ['Rajasthan Solar Additional 500MW', 'C', true],
    'd1. khavda solar': ['Khavda Solar Copper+Merchant 50MW', 'D1', false],
    'd1. khavda solarar': ['Khavda Solar Copper+Merchant 50MW', 'D1', false],
    'd2. khavda solar': ['Khavda Solar Internal 650MW', 'D2', false],
    'd2. khavda solarar': ['Khavda Solar Internal 650MW', 'D2', false],
    // Wind Sections - matching original Python parser
    'a. khavda wind projects': ['Khavda Wind', 'A', true],
    'a. khavda wind': ['Khavda Wind', 'A', true],
    'b. khavda wind': ['Khavda Wind Internal 421MW', 'B', false],
    'c. mundra wind': ['Mundra Wind 76MW', 'C', true],
    'd. mundra wind': ['Mundra Wind Internal 224.4MW', 'D', false],
};

const SKIP_PATTERNS = [
    'agel overall', 'agel fy', 'chairman', 'budget', 'grand total',
    'total (a', 'total(a', 'monthwise', '(a+b', '(a + b', '(1+2',
    'subtotal', 'overall total'
];

function safeFloat(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(String(val).replace(/,/g, '').replace(/%/g, ''));
    return isNaN(num) ? null : num;
}

export async function parseExcelWorkbook(buffer: Buffer): Promise<ExcelParseResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetsFound = workbook.SheetNames;

    let summarySheetName = sheetsFound.find(s => s.toLowerCase().includes('summary') && s.toLowerCase().includes('linked'));
    if (!summarySheetName) {
        summarySheetName = sheetsFound[0];
    }

    const worksheet = workbook.Sheets[summarySheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let headerRowIdx = -1;
    const colMap: Record<string, number> = {};

    // Find header row
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowStr = row.map(c => String(c || '')).join(' ').toLowerCase();
        const hasSNo = rowStr.includes('s.no') || rowStr.includes('s. no') || rowStr.includes('sl no') || rowStr.includes('priority');
        const hasProject = rowStr.includes('project');
        const hasCapacity = rowStr.includes('capacity') || rowStr.includes('mw');

        if (hasProject && hasCapacity && (hasSNo || rowStr.includes('spv'))) {
            headerRowIdx = i;
            row.forEach((cell, idx) => {
                if (!cell) return;
                const low = String(cell).toLowerCase().trim();

                if (low.includes('s.no') || low.includes('s. no') || low.includes('sl no') || low === 'priority') colMap['sno'] = idx;
                else if (low.includes('project') && low.includes('name')) colMap['projectName'] = idx;
                else if (low === 'project') colMap['projectName'] = idx;
                else if (low === 'spv') colMap['spv'] = idx;
                else if (low === 'type') colMap['projectType'] = idx;
                else if (low.includes('plot') || low.includes('location')) colMap['plotLocation'] = idx;
                else if (low.includes('capacity') && !low.includes('total')) colMap['capacity'] = idx;
                else if (low.includes('plan') && (low.includes('actual') || low.includes('status'))) colMap['planActual'] = idx;
                else if (low.includes('total') && low.includes('capacity')) colMap['totalCapacity'] = idx;
                else if (low.includes('cumm') && (low.includes('till') || low.includes('upto'))) colMap['cummTillOct'] = idx;
                else if (low === 'q1') colMap['q1'] = idx;
                else if (low === 'q2') colMap['q2'] = idx;
                else if (low === 'q3') colMap['q3'] = idx;
                else if (low === 'q4') colMap['q4'] = idx;

                // Handle date headers - could be Date object (cellDates:true) or numeric serial
                if (cell instanceof Date) {
                    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    const mKey = monthNames[cell.getMonth()];
                    colMap[mKey] = idx;
                } else {
                    const numVal = Number(cell);
                    if (!isNaN(numVal) && numVal > 40000 && numVal < 50000) {
                        const date = XLSX.SSF.parse_date_code(numVal);
                        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                        const mKey = monthNames[date.m - 1];
                        colMap[mKey] = idx;
                    } else if (!low.includes('cumm') && !low.includes('total')) {
                        // Month text matching - but skip if it's a cumm or total column
                        const months: Record<string, string> = {
                            'apr': 'apr', 'may': 'may', 'jun': 'jun', 'jul': 'jul', 'aug': 'aug', 'sep': 'sep',
                            'oct': 'oct', 'nov': 'nov', 'dec': 'dec', 'jan': 'jan', 'feb': 'feb', 'mar': 'mar'
                        };
                        for (const [key, val] of Object.entries(months)) {
                            if (low.includes(key + '-') || low === key) {
                                colMap[val] = idx;
                                break;
                            }
                        }
                    }
                }
            });
            break;
        }
    }

    if (headerRowIdx === -1) {
        return { projects: [], summaries: [], errors: ['Header row not found'], sheets_found: sheetsFound };
    }

    const projects: any[] = [];
    let currentCategory = 'Other';
    let currentSection = 'A';
    let includedInTotal = true;
    const sticky: any = { sno: null, projectName: '', spv: '', projectType: '', plotLocation: '', capacity: 0 };

    for (let i = headerRowIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const rowText = row.slice(0, 5).join(' ').toLowerCase();

        // Section markers
        let sectionFound = false;
        for (const [marker, [cat, sec, inc]] of Object.entries(SECTION_MARKERS)) {
            if (rowText.includes(marker)) {
                currentCategory = cat;
                currentSection = sec;
                includedInTotal = inc;
                sectionFound = true;
                break;
            }
        }
        if (sectionFound) continue;

        // Skip patterns
        if (SKIP_PATTERNS.some(p => rowText.includes(p))) continue;

        const nameIdx = colMap['projectName'];
        const rowName = row[nameIdx];

        if (rowName && String(rowName).trim().length > 2) {
            sticky.projectName = String(rowName).trim();
            sticky.sno = row[colMap['sno']];
            sticky.spv = row[colMap['spv']] || '';
            sticky.projectType = row[colMap['projectType']] || '';
            sticky.plotLocation = row[colMap['plotLocation']] || '';
            sticky.capacity = safeFloat(row[colMap['capacity']]) || 0;
        }

        if (!sticky.projectName) continue;

        const typeIdx = colMap['planActual'];
        const rawType = String(row[typeIdx] || '').toLowerCase();
        let status = 'Plan';
        if (rawType.includes('rephase')) status = 'Rephase';
        else if (rawType.includes('actual') || rawType.includes('fcst')) status = 'Actual';
        else if (rawType.includes('plan')) status = 'Plan';
        else continue;

        const project: any = {
            sno: sticky.sno,
            projectName: sticky.projectName,
            spv: sticky.spv,
            projectType: sticky.projectType,
            plotLocation: sticky.plotLocation,
            capacity: sticky.capacity,
            planActual: status,
            category: currentCategory,
            section: currentSection,
            includedInTotal: includedInTotal
        };

        ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'].forEach(m => {
            project[m] = safeFloat(row[colMap[m]]);
        });
        project.totalCapacity = safeFloat(row[colMap['totalCapacity']]);
        project.cummTillOct = safeFloat(row[colMap['cummTillOct']]);
        project.q1 = safeFloat(row[colMap['q1']]);
        project.q2 = safeFloat(row[colMap['q2']]);
        project.q3 = safeFloat(row[colMap['q3']]);
        project.q4 = safeFloat(row[colMap['q4']]);

        projects.push(project);
    }

    if (projects.length === 0) {
        return {
            projects: [],
            summaries: [],
            errors: ['No projects identified in summary sheet'],
            sheets_found: sheetsFound
        };
    }

    return { projects, summaries: [], errors: [], sheets_found: sheetsFound };
}

export async function importProjectsToDb(projects: any[], fiscalYear: string = 'FY_25-26') {
    // Deduplicate
    const unique = new Map<string, any>();
    projects.forEach(p => {
        const key = `${p.projectName}|${p.spv}|${p.planActual}|${p.section}|${p.category}`;
        if (!unique.has(key)) {
            unique.set(key, p);
        } else {
            const existing = unique.get(key);
            const newVals = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'].filter(m => p[m] !== null).length;
            const oldVals = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'].filter(m => existing[m] !== null).length;
            if (newVals > oldVals) unique.set(key, p);
        }
    });

    const finalProjects = Array.from(unique.values());

    // Extract unique values for dropdown options
    const categoriesSet = new Set<string>();
    const typesSet = new Set<string>();
    const spvsSet = new Set<string>();
    const sectionsSet = new Set<string>();

    finalProjects.forEach(p => {
        // We only want the high level category (Solar/Wind) for the tabs
        if (p.category.toLowerCase().includes('solar')) categoriesSet.add('Solar');
        else if (p.category.toLowerCase().includes('wind')) categoriesSet.add('Wind');
        else categoriesSet.add(p.category);

        typesSet.add(p.projectType);
        spvsSet.add(p.spv);
        sectionsSet.add(p.category); // Using the full category name as the section dropdown value
    });

    await prisma.$transaction([
        prisma.commissioningProject.deleteMany({ where: { fiscalYear } }),
        prisma.commissioningProject.createMany({
            data: finalProjects.map(p => ({
                fiscalYear,
                sno: p.sno ? parseInt(String(p.sno)) : null,
                projectName: p.projectName,
                spv: p.spv,
                projectType: p.projectType,
                plotLocation: p.plotLocation,
                capacity: p.capacity,
                planActual: p.planActual,
                category: p.category,
                section: p.section,
                includedInTotal: p.includedInTotal,
                apr: p.apr, may: p.may, jun: p.jun,
                jul: p.jul, aug: p.aug, sep: p.sep,
                oct: p.oct, nov: p.nov, dec: p.dec,
                jan: p.jan, feb: p.feb, mar: p.mar,
                totalCapacity: p.totalCapacity,
                cummTillOct: p.cummTillOct,
                q1: p.q1, q2: p.q2, q3: p.q3, q4: p.q4
            }))
        }),
        // Update Dropdown Options
        prisma.dropdownOption.deleteMany({ where: { fiscalYear } }),
        prisma.dropdownOption.createMany({
            data: [
                ...Array.from(categoriesSet).map(c => ({ optionType: 'categories', optionValue: c, fiscalYear })),
                ...Array.from(typesSet).map(t => ({ optionType: 'types', optionValue: t, fiscalYear })),
                ...Array.from(spvsSet).map(s => ({ optionType: 'spv', optionValue: s, fiscalYear })),
                ...Array.from(sectionsSet).map(s => ({ optionType: 'sections', optionValue: s, fiscalYear }))
            ]
        })
    ]);

    return { success: true, inserted_projects: finalProjects.length };
}
