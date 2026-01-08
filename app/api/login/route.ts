import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

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
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Hardcoded personas for demo
    if (email === 'superadmin@adani.com' && password === 'adani123') {
      return NextResponse.json({
        access_token: 'dummy-super-token',
        token_type: 'bearer',
        user: { username: 'Super Admin', email: 'superadmin@adani.com', role: 'SUPER_ADMIN' }
      });
    }

    if (email === 'admin@adani.com' && password === 'adani123456') {
      return NextResponse.json({
        access_token: 'dummy-admin-token',
        token_type: 'bearer',
        user: { username: 'Admin', email: 'admin@adani.com', role: 'ADMIN' }
      });
    }

    if (email === 'user@adani.com' && password === 'adani123') {
      return NextResponse.json({
        access_token: 'dummy-user-token',
        token_type: 'bearer',
        user: { username: 'Standard User', email: 'user@adani.com', role: 'USER' }
      });
    }

    // Find user in DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({
      access_token: 'dummy-session-token',
      token_type: 'bearer',
      user: {
        username: user.username,
        email: user.email,
        role: user.role.toUpperCase() // Ensure role is uppercase to match types
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}