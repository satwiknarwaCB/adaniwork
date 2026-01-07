import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';

        const rows = await prisma.locationRelationship.findMany({
            where: { fiscalYear },
        });

        return NextResponse.json(rows.map((r: any) => ({
            location: r.location,
            locationCode: r.locationCode
        })), { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
        const body = await request.json();

        // Clear existing
        await prisma.locationRelationship.deleteMany({
            where: { fiscalYear },
        });

        if (Array.isArray(body)) {
            await prisma.locationRelationship.createMany({
                data: body.map((rel: any) => ({
                    location: rel.location,
                    locationCode: rel.locationCode,
                    fiscalYear
                })),
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
