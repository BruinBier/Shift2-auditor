import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/quick-findings/[id] - Eén snelle bevinding. Hier was geen GET, en daardoor gaf
// `create-finding-from-quick` in de CLI altijd 405 (NIS-01, 2026-10-23).
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const quickFinding = await prisma.quickFinding.findUnique({ where: { id: params.id } });
  if (!quickFinding) {
    return NextResponse.json({ error: 'Snelle bevinding niet gevonden' }, { status: 404 });
  }
  return NextResponse.json(quickFinding);
}

// PUT /api/quick-findings/[id] - Update a quick finding
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const quickFinding = await prisma.quickFinding.update({
      where: { id },
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

    return NextResponse.json(quickFinding);
  } catch (error) {
    console.error('Error updating quick finding:', error);
    return NextResponse.json(
      { error: 'Failed to update quick finding' },
      { status: 500 }
    );
  }
}

// DELETE /api/quick-findings/[id] - Delete a quick finding
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.quickFinding.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick finding:', error);
    return NextResponse.json(
      { error: 'Failed to delete quick finding' },
      { status: 500 }
    );
  }
}
