import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const fiscalYear = body.fiscalYear || 'FY_25-26';

        // Reset monthly columns to 0 or null
        await prisma.commissioningProject.updateMany({
            where: { fiscalYear },
            data: {
                apr: null, may: null, jun: null, jul: null, aug: null, sep: null,
                oct: null, nov: null, dec: null, jan: null, feb: null, mar: null,
                totalCapacity: 0, cummTillOct: 0, q1: 0, q2: 0, q3: 0, q4: 0,
            },
        });

        return NextResponse.json({ success: true, message: 'Data reset successfully' });
    } catch (error: any) {
        console.error('Error resetting commissioning data:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
