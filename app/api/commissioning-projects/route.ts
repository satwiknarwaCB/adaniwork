import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/commissioning-projects - Get commissioning projects for a fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
    
    const response = await fetch(`${API_BASE_URL}/commissioning-projects?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
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
        { error: data.detail || 'Failed to get commissioning projects' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting commissioning projects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/commissioning-projects - Save commissioning projects
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
    const projects = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/commissioning-projects?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projects),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.detail || 'Failed to save commissioning projects' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error saving commissioning projects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
