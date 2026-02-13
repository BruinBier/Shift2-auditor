import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/quick-findings - Get all quick findings
export async function GET() {
  try {
    const quickFindings = await prisma.quickFinding.findMany({
      orderBy: [
        { criterionCode: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json(quickFindings);
  } catch (error) {
    console.error('Error fetching quick findings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick findings' },
      { status: 500 }
    );
  }
}

// POST /api/quick-findings - Create a new quick finding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const quickFinding = await prisma.quickFinding.create({
      data: {
        title: body.title,
        description: body.description,
        advice: body.advice,
        criterionCode: body.criterionCode,
        keywords: body.keywords || null,
        crawler: body.crawler || false,
        status: body.status || null,
        impact: body.impact || null,
        responsibility: body.responsibility || null,
      },
    });

    return NextResponse.json(quickFinding, { status: 201 });
  } catch (error) {
    console.error('Error creating quick finding:', error);
    return NextResponse.json(
      { error: 'Failed to create quick finding' },
      { status: 500 }
    );
  }
}