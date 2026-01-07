import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessments = await prisma.criterionAssessment.findMany({
      where: { projectId: params.id },
      include: {
        wcagCriterion: true,
      },
    });
    return NextResponse.json(assessments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}
