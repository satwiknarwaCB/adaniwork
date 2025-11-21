import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/locations - Get all locations
export async function GET(request: Request) {
  try {
    // Call FastAPI backend to get locations (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/locations`, {
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
        { error: data.detail || 'Failed to get locations' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting locations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Update locations
export async function POST(request: Request) {
  try {
    const locations: string[] = await request.json();
    
    // Validate input
    if (!Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Locations data must be an array' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to update locations (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locations),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update locations' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating locations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}