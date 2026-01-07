import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Find next S.No
        const maxSno = await prisma.commissioningProject.aggregate({
            where: { fiscalYear: body.fiscalYear },
            _max: { sno: true },
        });
        const nextSno = (maxSno._max.sno || 0) + 1;

        // Add 3 rows: Plan, Rephase, Actual
        const statuses = ['Plan', 'Rephase', 'Actual'];
        const records = statuses.map(status => ({
            fiscalYear: body.fiscalYear,
            sno: nextSno,
            projectName: body.projectName,
            spv: body.spv || '',
            projectType: body.projectType || '',
            plotLocation: '',
            capacity: body.capacity || 0,
            planActual: status,
            category: body.category,
            section: body.section || 'A',
            includedInTotal: true,
            totalCapacity: body.capacity || 0,
        }));

        await prisma.commissioningProject.createMany({
            data: records,
        });

        return NextResponse.json({ success: true, message: `Project '${body.projectName}' added successfully.` }, { status: 200 });
    } catch (error: any) {
        console.error('Error adding project manually:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
