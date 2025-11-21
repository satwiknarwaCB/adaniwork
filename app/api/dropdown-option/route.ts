import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// POST /api/dropdown-option - Add a single dropdown option
export async function POST(request: Request) {
  try {
    const { fiscalYear = 'FY_25', optionType, optionValue } = await request.json();
    
    // Validate input
    if (!optionType || !optionValue) {
      return NextResponse.json(
        { error: 'Option type and value are required' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to add the dropdown option
    const response = await fetch(`${API_BASE_URL}/dropdown-option`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fiscalYear,
        optionType,
        optionValue
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to add dropdown option' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error adding dropdown option:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}