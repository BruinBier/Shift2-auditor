import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; adviceId: string } }
) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.adviceText !== undefined) data.adviceText = String(body.adviceText).trim();
    if (body.reasonText !== undefined) data.reasonText = String(body.reasonText).trim();
    if (body.wcagCriterionId !== undefined) data.wcagCriterionId = body.wcagCriterionId || null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const advice = await prisma.projectAdvice.update({
      where: { id: params.adviceId },
      data,
      include: { wcagCriterion: true },
    });
    return NextResponse.json(advice);
  } catch (error) {
    console.error('Error updating advice:', error);
    return NextResponse.json({ error: 'Failed to update advice' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; adviceId: string } }
) {
  try {
    await prisma.projectAdvice.delete({ where: { id: params.adviceId } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting advice:', error);
    return NextResponse.json({ error: 'Failed to delete advice' }, { status: 500 });
  }
}
