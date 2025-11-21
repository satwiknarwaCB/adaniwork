import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/connectivities - Get all connectivities
export async function GET(request: Request) {
  try {
    // Call FastAPI backend to get connectivities (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/connectivities`, {
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
        { error: data.detail || 'Failed to get connectivities' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting connectivities:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/connectivities - Update connectivities
export async function POST(request: Request) {
  try {
    const connectivities: string[] = await request.json();
    
    // Validate input
    if (!Array.isArray(connectivities)) {
      return NextResponse.json(
        { error: 'Connectivities data must be an array' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to update connectivities (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/connectivities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectivities),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update connectivities' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating connectivities:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}