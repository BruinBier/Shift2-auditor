import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
