import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // POST request to FastAPI backend
        const response = await fetch(`${API_BASE_URL}/api/manual-add-project`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data, { status: 200 });
        } else {
            return NextResponse.json(
                { error: data.detail || 'Failed to add project' },
                { status: response.status }
            );
        }
    } catch (error: any) {
        console.error('Error in manual-add-project proxy:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
