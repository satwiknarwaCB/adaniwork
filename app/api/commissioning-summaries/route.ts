import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/commissioning-summaries - Get commissioning summaries for a fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
    
    const response = await fetch(`${API_BASE_URL}/commissioning-summaries?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to get commissioning summaries' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting commissioning summaries:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/commissioning-summaries - Save commissioning summaries
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
    const summaries = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/commissioning-summaries?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summaries),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.detail || 'Failed to save commissioning summaries' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error saving commissioning summaries:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
