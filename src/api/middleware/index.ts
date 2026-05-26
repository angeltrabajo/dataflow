import { NextResponse } from 'next/server';

/**
 * CORS headers for API responses.
 */
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Error response helper following the Result pattern.
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, errors: [message] },
    { status }
  );
}
