import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';

        const response = await fetch(`${API_BASE_URL}/location-relationships?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
        const body = await request.json();

        const response = await fetch(`${API_BASE_URL}/location-relationships?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
