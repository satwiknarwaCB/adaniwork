import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check for the Next.js API routes
    return NextResponse.json({
      status: 'ok',
      message: 'Next.js API routes are working',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
}