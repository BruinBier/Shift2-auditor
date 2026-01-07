import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; criterionId: string } }
) {
  try {
    const body = await request.json();
    const assessment = await prisma.criterionAssessment.upsert({
      where: {
        projectId_wcagCriterionId: {
          projectId: params.projectId,
          wcagCriterionId: params.criterionId,
        },
      },
      update: {
        status: body.status,
        notes: body.notes,
      },
      create: {
        projectId: params.projectId,
        wcagCriterionId: params.criterionId,
        status: body.status,
        notes: body.notes,
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
