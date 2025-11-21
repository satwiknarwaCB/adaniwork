import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/ppa-merchants - Get all ppa merchants
export async function GET(request: Request) {
  try {
    // Call FastAPI backend to get ppa merchants (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/ppa-merchants`, {
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
        { error: data.detail || 'Failed to get ppa merchants' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting ppa merchants:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ppa-merchants - Update ppa merchants
export async function POST(request: Request) {
  try {
    console.log('PPA Merchants POST route called');
    
    // Parse the request body
    let ppaMerchants: string[];
    try {
      ppaMerchants = await request.json();
      console.log('Parsed ppaMerchants:', ppaMerchants);
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate input
    if (!Array.isArray(ppaMerchants)) {
      return NextResponse.json(
        { error: 'PPA merchants data must be an array' },
        { status: 400 }
      );
    }
    
    // Log for debugging
    console.log('Sending ppaMerchants to backend:', ppaMerchants);
    
    // Call FastAPI backend to update ppa merchants (without fiscalYear)
    const response = await fetch(`${API_BASE_URL}/dropdown-options/ppa-merchants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ppaMerchants),
    });

    const data = await response.json();
    
    // Log response for debugging
    console.log('Backend response status:', response.status);
    console.log('Backend response data:', data);

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to update ppa merchants' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error updating ppa merchants:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}