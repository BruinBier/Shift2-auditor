import { NextResponse } from 'next/server';
import { getAvailableTestNames } from '@/lib/crawler/test-runner';

/**
 * GET /api/tests/available
 * Returns list of all available test names
 */
export async function GET() {
  try {
    const tests = getAvailableTestNames();

    return NextResponse.json({
      tests,
      total: tests.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting available tests:', error);
    return NextResponse.json({
      error: 'Failed to get available tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}