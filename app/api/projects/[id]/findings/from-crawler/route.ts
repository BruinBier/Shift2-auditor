import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { typeVoorImpact } from '@/lib/finding-classification';
import { createFindingWithCode } from '@/lib/finding-code';

const prisma = new PrismaClient();

interface CreateFindingRequest {
  quickFindingId: string;
  scopeUrlIds: string[]; // Selected URLs where the issue was found
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body: CreateFindingRequest = await request.json();
    const { quickFindingId, scopeUrlIds } = body;

    if (!quickFindingId || !scopeUrlIds || scopeUrlIds.length === 0) {
      return NextResponse.json(
        { error: 'quickFindingId and scopeUrlIds are required' },
        { status: 400 }
      );
    }

    // Get the QuickFinding template
    const quickFinding = await prisma.quickFinding.findUnique({
      where: { id: quickFindingId },
    });

    if (!quickFinding) {
      return NextResponse.json(
        { error: 'QuickFinding not found' },
        { status: 404 }
      );
    }

    // Get the WCAG criterion
    const wcagCriterion = await prisma.wCAGCriterion.findUnique({
      where: { code: quickFinding.criterionCode },
    });

    if (!wcagCriterion) {
      return NextResponse.json(
        { error: `WCAG criterion ${quickFinding.criterionCode} not found` },
        { status: 404 }
      );
    }

    // Get the highest sort order
    const lastFinding = await prisma.finding.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (lastFinding?.sortOrder || 0) + 1;

    // findingCode wordt binnen de transactie toegekend, zodat twee
    // gelijktijdige aanmaakacties niet dezelfde code krijgen.
    const finding = await createFindingWithCode(projectId, (findingCode) => ({
      data: {
        projectId,
        findingCode,
        wcagCriterionId: wcagCriterion.id,
        status: quickFinding.status || 'open',
        type: typeVoorImpact(quickFinding.impact),
        impact: quickFinding.impact,
        responsibility: quickFinding.responsibility,
        description: quickFinding.description,
        advice: quickFinding.advice,
        sortOrder,
        affectedUrls: {
          create: scopeUrlIds.map((scopeUrlId) => ({
            scopeUrlId,
          })),
        },
      },
      include: {
        affectedUrls: {
          include: {
            scopeUrl: true,
          },
        },
        wcagCriterion: true,
      },
    }));

    return NextResponse.json({
      success: true,
      finding,
      message: `Bevinding ${finding.findingCode} is aangemaakt met ${scopeUrlIds.length} pagina's`,
    });
  } catch (error) {
    console.error('Error creating finding from crawler:', error);
    return NextResponse.json(
      { error: 'Failed to create finding' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}