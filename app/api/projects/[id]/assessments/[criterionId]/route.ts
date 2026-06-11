import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; criterionId: string } }
) {
  try {
    const body = await request.json();
    const assessment = await prisma.criterionAssessment.upsert({
      where: {
        projectId_wcagCriterionId: {
          projectId: params.id,
          wcagCriterionId: params.criterionId,
        },
      },
      update: {
        status: body.status,
        notes: body.notes,
        ...(body.explanation !== undefined ? { explanation: body.explanation } : {}),
      },
      create: {
        projectId: params.id,
        wcagCriterionId: params.criterionId,
        status: body.status,
        notes: body.notes,
        explanation: body.explanation,
      },
      include: {
        wcagCriterion: true,
      },
    });
    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}
