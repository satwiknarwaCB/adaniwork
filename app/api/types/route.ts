import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/types - Get all types
export async function GET(request: Request) {
  try {
    // Call FastAPI backend to get types (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/types`, {
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
        { error: data.detail || 'Failed to get types' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting types:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/types - Update types
export async function POST(request: Request) {
  try {
    const types: string[] = await request.json();
    
    // Validate input
    if (!Array.isArray(types)) {
      return NextResponse.json(
        { error: 'Types data must be an array' },
        { status: 400 }
      );
    }
    
    // Log for debugging
    console.log('Sending types to backend:', types);
    
    // Call FastAPI backend to update types (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(types),
    });

    const data = await response.json();
    
    // Log response for debugging
    console.log('Backend response status:', response.status);
    console.log('Backend response data:', data);

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update types' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating types:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}