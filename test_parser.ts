import { parseExcelWorkbook } from './lib/excelParser';
import * as fs from 'fs';

const filePath = 'd:\\PWORK\\CEO-tracker\\AGEL FY 25-26 Commissioning Status_31-Dec-25.xlsx';

async function test() {
    const buffer = fs.readFileSync(filePath);
    const result = await parseExcelWorkbook(buffer);

    console.log('Total:', result.projects.length);

    // Group by category AND section
    const summary: Record<string, number> = {};
    result.projects.forEach((p: any) => {
        const key = `${p.section}:${p.category}`;
        summary[key] = (summary[key] || 0) + 1;
    });

    console.log('\n--- SECTIONS ---');
    // Print each on its own line
    const keys = Object.keys(summary).sort();
    for (const k of keys) {
        console.log(k + ' = ' + summary[k]);
    }
}

test();
