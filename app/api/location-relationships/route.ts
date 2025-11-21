import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

// Define the structure for the location relationships document
interface LocationRelationshipsDocument {
  fiscalYear: string;
  relationships: LocationRelationship[];
}

// GET /api/location-relationships - Get all location relationships
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25'; // Default to FY_25
    
    // Call FastAPI backend to get location relationships
    const response = await fetch(`${API_BASE_URL}/location-relationships?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
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
        { error: data.detail || 'Failed to get location relationships' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting location relationships:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/location-relationships - Update location relationships
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25';
    
    const relationships: LocationRelationship[] = await request.json();
    
    // Validate input
    if (!Array.isArray(relationships)) {
      return NextResponse.json(
        { error: 'Relationships data must be an array' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to update location relationships
    const response = await fetch(`${API_BASE_URL}/location-relationships?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(relationships),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update location relationships' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating location relationships:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}