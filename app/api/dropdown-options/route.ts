import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// Define the structure for dropdown options
interface DropdownOptions {
  fiscalYear?: string;
  groups: string[];
  ppaMerchants: string[];
  types: string[];
  locationCodes: string[];
  locations: string[];
  connectivities: string[];
}

// GET /api/dropdown-options - Get all dropdown options
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25'; // Default to FY_25
    
    // Call FastAPI backend to get dropdown options
    const response = await fetch(`${API_BASE_URL}/dropdown-options?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
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
        { error: data.detail || 'Failed to get dropdown options' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting dropdown options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dropdown-options - Update dropdown options
export async function POST(request: Request) {
  try {
    const optionsData = await request.json();
    
    // Validate input
    if (!optionsData || typeof optionsData !== 'object') {
      return NextResponse.json(
        { error: 'Valid options data is required' },
        { status: 400 }
      );
    }
    
    // Call FastAPI backend to update dropdown options
    const response = await fetch(`${API_BASE_URL}/dropdown-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(optionsData),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update dropdown options' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating dropdown options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}