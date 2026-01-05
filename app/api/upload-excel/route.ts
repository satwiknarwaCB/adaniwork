import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        // Forward the request to FastAPI backend
        const response = await fetch(`${API_BASE_URL}/api/upload-excel`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(
                {
                    error: result.detail || 'Failed to process upload',
                    failed: result.failed || 0,
                    errors: result.errors || [],
                    parse_errors: result.parse_errors || []
                },
                { status: response.status }
            );
        }
    } catch (error: any) {
        console.error('Error uploading Excel file:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
