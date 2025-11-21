import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/table-data - Get table data for a specific fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25';
    
    // Call FastAPI backend to get table data
    const response = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
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
        { error: data.detail || 'Failed to get table data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/table-data - Update table data for a specific fiscal year
export async function POST(request: Request) {
  try {
    const { fiscalYear = 'FY_25', data } = await request.json();
    
    // Validate input
    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to update table data
    const response = await fetch(`${API_BASE_URL}/table-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fiscalYear, data }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.detail || 'Failed to update table data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/table-data - Delete table data for a specific fiscal year
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25';
    
    // Call FastAPI backend to delete table data
    const response = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.detail || 'Failed to delete table data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error deleting table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}