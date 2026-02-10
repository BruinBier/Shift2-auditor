import { NextResponse } from 'next/server';
import { QUICK_FINDINGS } from '@/lib/quick-findings-data';

// GET /api/quick-findings - Get all quick findings (hardcoded data)
export async function GET() {
  try {
    // Sort by criterion code and title
    const sortedFindings = [...QUICK_FINDINGS].sort((a, b) => {
      if (a.criterionCode !== b.criterionCode) {
        return a.criterionCode.localeCompare(b.criterionCode);
      }
      return a.title.localeCompare(b.title);
    });

    // Add timestamps if not present
    const findingsWithTimestamps = sortedFindings.map(f => ({
      ...f,
      createdAt: f.createdAt || new Date().toISOString(),
      updatedAt: f.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json(findingsWithTimestamps);
  } catch (error) {
    console.error('Error fetching quick findings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick findings' },
      { status: 500 }
    );
  }
}