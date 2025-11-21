import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/location-codes - Get all location codes
export async function GET(request: Request) {
  try {
    // Call FastAPI backend to get location codes (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/location-codes`, {
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
        { error: data.detail || 'Failed to get location codes' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting location codes:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/location-codes - Update location codes
export async function POST(request: Request) {
  try {
    const locationCodes: string[] = await request.json();
    
    // Validate input
    if (!Array.isArray(locationCodes)) {
      return NextResponse.json(
        { error: 'Location codes data must be an array' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to update location codes (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/location-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationCodes),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update location codes' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating location codes:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}