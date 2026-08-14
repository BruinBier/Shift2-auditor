import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * De oordelen van dit project, met het criterium erbij.
 *
 * Ontbrak: de audit-CLI vroeg deze route al op in get-project, kreeg een 405 en
 * ving die op met `.catch(() => [])`. Daardoor meldde de CLI stelselmatig nul
 * oordelen terwijl er tientallen in de database stonden.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessments = await prisma.criterionAssessment.findMany({
      where: { projectId: params.id },
      include: {
        wcagCriterion: {
          select: { id: true, code: true, titleNl: true, level: true },
        },
      },
    });

    // Numeriek op criteriumcode, zodat 1.4.10 na 1.4.3 komt en niet ervoor.
    assessments.sort((a, b) => {
      const aDelen = (a.wcagCriterion?.code ?? '').split('.').map(Number);
      const bDelen = (b.wcagCriterion?.code ?? '').split('.').map(Number);
      for (let i = 0; i < Math.max(aDelen.length, bDelen.length); i++) {
        const verschil = (aDelen[i] ?? 0) - (bDelen[i] ?? 0);
        if (verschil !== 0) return verschil;
      }
      return 0;
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

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
