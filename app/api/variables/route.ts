import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// GET /api/variables?key=xxx - Get a specific variable
// GET /api/variables - Get all variables
export async function GET(request: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const userId = searchParams.get('user_id');
    
    // Build query string
    let queryString = '';
    const params = [];
    if (key) {
      params.push(`key=${encodeURIComponent(key)}`);
    }
    if (userId) {
      params.push(`user_id=${encodeURIComponent(userId)}`);
    }
    if (params.length > 0) {
      queryString = '?' + params.join('&');
    }
    
    // Call FastAPI backend
    const response = await fetch(`${API_BASE_URL}/variables${queryString}`, {
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
        { error: data.detail || 'Failed to get variables' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error getting variables:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/variables - Set a variable
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call FastAPI backend
    const response = await fetch(`${API_BASE_URL}/variables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to set variable' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error setting variable:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/variables?key=xxx - Delete a variable
export async function DELETE(request: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const userId = searchParams.get('user_id');
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }
    
    // Build query string
    let queryString = `key=${encodeURIComponent(key)}`;
    if (userId) {
      queryString += `&user_id=${encodeURIComponent(userId)}`;
    }
    
    // Call FastAPI backend
    const response = await fetch(`${API_BASE_URL}/variables?${queryString}`, {
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
        { error: data.detail || 'Failed to delete variable' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error deleting variable:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}