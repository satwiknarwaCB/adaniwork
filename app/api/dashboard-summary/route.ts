import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';

        const aggregates = await prisma.commissioningProject.aggregate({
            where: {
                fiscalYear,
                isDeleted: false,
            },
            _count: {
                _all: true,
            },
        });

        const statusCounts = await prisma.commissioningProject.groupBy({
            by: ['planActual'],
            where: {
                fiscalYear,
                isDeleted: false,
            },
            _count: {
                _all: true,
            },
        });

        const lastUpdate = await prisma.commissioningProject.aggregate({
            where: { fiscalYear },
            _max: { updatedAt: true },
        });

        const counts: any = {
            'Plan': 0,
            'Rephase': 0,
            'Actual': 0,
        };

        statusCounts.forEach((sc: { planActual: string | number; _count: { _all: any; }; }) => {
            counts[sc.planActual] = sc._count._all;
        });
        return NextResponse.json({
            fiscal_year: fiscalYear,
            total_projects: aggregates._count._all,
            plan_count: counts['Plan'],
            rephase_count: counts['Rephase'],
            actual_count: counts['Actual'],
            last_update: lastUpdate._max.updatedAt,
        }, { status: 200 });
    } catch (error: any) {
        console.error('Error getting dashboard summary:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
