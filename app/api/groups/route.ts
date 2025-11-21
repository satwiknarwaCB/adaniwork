import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/groups - Get all groups
export async function GET(request: Request) {
  try {
    // Call FastAPI backend to get groups (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/groups`, {
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
        { error: data.detail || 'Failed to get groups' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting groups:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Update groups
export async function POST(request: Request) {
  try {
    const groups: string[] = await request.json();
    
    // Validate input
    if (!Array.isArray(groups)) {
      return NextResponse.json(
        { error: 'Groups data must be an array' },
        { status: 400 }
      );
    }
    
    // Log for debugging
    console.log('Sending groups to backend:', groups);
    
    // Call FastAPI backend to update groups (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groups),
    });

    const data = await response.json();
    
    // Log response for debugging
    console.log('Backend response status:', response.status);
    console.log('Backend response data:', data);

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update groups' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating groups:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}