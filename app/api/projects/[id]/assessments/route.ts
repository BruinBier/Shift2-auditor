import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { wcagCriterionId, status, explanation } = await request.json();
    const projectId = params.id;

    // Check if assessment already exists
    const existingAssessment = await prisma.criterionAssessment.findFirst({
      where: {
        projectId,
        wcagCriterionId,
      },
    });

    let assessment;
    if (existingAssessment) {
      // Update existing assessment
      assessment = await prisma.criterionAssessment.update({
        where: {
          id: existingAssessment.id,
        },
        data: {
          status,
          explanation: explanation !== undefined ? explanation : existingAssessment.explanation,
        },
      });
    } else {
      // Create new assessment
      assessment = await prisma.criterionAssessment.create({
        data: {
          projectId,
          wcagCriterionId,
          status,
          explanation: explanation || null,
        },
      });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error saving assessment:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}
