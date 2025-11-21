import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/backup-data?fiscalYear=xxx - Get backup data for a specific fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25';

    // Call FastAPI backend to get backup data
    const response = await fetch(`${API_BASE_URL}/backup-data?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
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
        { error: data.detail || 'Failed to get backup data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting backup data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/backup-data/restore - Restore data from a specific version
export async function POST(request: Request) {
  try {
    const { fiscalYear, version } = await request.json();

    if (!fiscalYear || !version) {
      return NextResponse.json(
        { error: 'Fiscal year and version are required' },
        { status: 400 }
      );
    }

    // Call FastAPI backend to restore backup data
    const response = await fetch(`${API_BASE_URL}/backup-data/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fiscalYear, version }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to restore backup data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error restoring backup data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/backup-data?fiscalYear=xxx&version=yyy - Delete a specific backup version
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear');
    const version = searchParams.get('version');

    if (!fiscalYear || !version) {
      return NextResponse.json(
        { error: 'Fiscal year and version are required' },
        { status: 400 }
      );
    }

    // Call FastAPI backend to delete backup data
    const response = await fetch(`${API_BASE_URL}/backup-data?fiscalYear=${encodeURIComponent(fiscalYear)}&version=${encodeURIComponent(version)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to delete backup data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error deleting backup data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}