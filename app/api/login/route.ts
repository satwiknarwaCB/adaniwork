import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// Handle CORS preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Call FastAPI backend
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Login failed' },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}