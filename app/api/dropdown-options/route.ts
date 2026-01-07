import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';

        const rows = await prisma.dropdownOption.findMany({
            where: { fiscalYear },
        });

        const options: any = {
            groups: [], ppaMerchants: [], types: [],
            locationCodes: [], locations: [], connectivities: [],
            sections: [], categories: []
        };

        const mapping: any = {
            "groups": "groups", "ppa_merchants": "ppaMerchants", "types": "types",
            "location_codes": "locationCodes", "locations": "locations",
            "connectivities": "connectivities", "sections": "sections",
            "categories": "categories"
        };

        rows.forEach(row => {
            const key = mapping[row.optionType] || row.optionType;
            if (options[key]) {
                options[key].push(row.optionValue);
            }
        });

        return NextResponse.json(options, { status: 200 });
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
        await prisma.dropdownOption.deleteMany({
            where: { fiscalYear },
        });

        const invMapping: any = {
            "groups": "groups", "ppaMerchants": "ppa_merchants", "types": "types",
            "locationCodes": "location_codes", "locations": "locations",
            "connectivities": "connectivities", "sections": "sections",
            "categories": "categories"
        };

        const entries: any[] = [];
        Object.entries(body).forEach(([key, values]: [string, any]) => {
            const dbKey = invMapping[key] || key;
            if (Array.isArray(values)) {
                values.forEach(val => {
                    entries.push({
                        optionType: dbKey,
                        optionValue: String(val),
                        fiscalYear
                    });
                });
            }
        });

        await prisma.dropdownOption.createMany({
            data: entries,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
