import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fiscalYear = (formData.get('fiscalYear') as string) || 'FY_25-26';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row
        let startRow = -1;
        for (let i = 0; i < data.length; i++) {
            const rowStr = data[i].join(' ');
            if (rowStr.includes('Project Name') && rowStr.includes('Plan Actual')) {
                startRow = i;
                break;
            }
        }

        if (startRow === -1) {
            return NextResponse.json({ error: "Could not find header row with 'Project Name' and 'Plan Actual'" }, { status: 400 });
        }

        const headers = data[startRow];
        const monthIndices: any = {};
        const targetMonths = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25',
            'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26'];

        headers.forEach((h, idx) => {
            if (targetMonths.includes(String(h).trim())) {
                monthIndices[String(h).trim()] = idx;
            }
        });

        const dbMonthMap: any = {
            'Apr-25': 'apr', 'May-25': 'may', 'Jun-25': 'jun',
            'Jul-25': 'jul', 'Aug-25': 'aug', 'Sep-25': 'sep',
            'Oct-25': 'oct', 'Nov-25': 'nov', 'Dec-25': 'dec',
            'Jan-26': 'jan', 'Feb-26': 'feb', 'Mar-26': 'mar'
        };

        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        let currentProject = { name: '', spv: '' };

        for (let i = startRow + 1; i < data.length; i++) {
            const row = data[i];
            const projName = String(row[1] || '').trim();
            if (projName && !['nan', '', '0.0', 'S.No.'].includes(projName)) {
                currentProject.name = projName;
                currentProject.spv = String(row[2] || '').trim();
            }

            const rawType = String(row[6] || '').trim();
            if (!rawType || rawType === 'Plan Actual') continue;

            let planActual = rawType;
            if (rawType.includes('Actual')) planActual = 'Actual';
            else if (rawType.includes('Plan')) planActual = 'Plan';
            else if (rawType.includes('Rephase')) planActual = 'Rephase';

            if (!currentProject.name) continue;

            const existing = await prisma.commissioningProject.findFirst({
                where: {
                    projectName: currentProject.name,
                    spv: currentProject.spv,
                    planActual,
                    fiscalYear
                }
            });

            if (existing) {
                const updateData: any = {};
                Object.entries(dbMonthMap).forEach(([excelMonth, dbCol]: [string, any]) => {
                    const idx = monthIndices[excelMonth];
                    if (idx !== undefined) {
                        const val = parseFloat(String(row[idx] || '0').replace(/,/g, ''));
                        updateData[dbCol] = isNaN(val) ? 0 : val;
                    }
                });

                await prisma.commissioningProject.update({
                    where: { id: existing.id },
                    data: updateData
                });
                successCount++;
            } else {
                failedCount++;
                errors.push(`Project '${currentProject.name}' (${planActual}) not found in DB`);
            }
        }

        return NextResponse.json({ success: successCount, failed: failedCount, errors: errors.slice(0, 50) });
    } catch (error: any) {
        console.error('Error uploading commissioning data:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
