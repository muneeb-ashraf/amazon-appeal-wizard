import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Verify JWT token
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.json(
        { authenticated: true },
        { status: 200 }
      );
    } catch (error) {
      // Token is invalid or expired
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
