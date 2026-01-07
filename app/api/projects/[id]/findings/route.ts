import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const criterionId = searchParams.get('criterion');
    const sampleId = searchParams.get('sample');
    const search = searchParams.get('search');

    const where: any = { projectId: params.id };

    if (status) {
      where.status = status;
    }
    if (criterionId) {
      where.wcagCriterionId = criterionId;
    }
    if (sampleId) {
      where.occurrences = {
        some: {
          sampleItemId: sampleId,
        },
      };
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { advice: { contains: search, mode: 'insensitive' } },
        { findingCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const findings = await prisma.finding.findMany({
      where,
      include: {
        wcagCriterion: true,
        occurrences: {
          include: {
            sampleItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(findings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const finding = await prisma.finding.create({
      data: {
        projectId: params.id,
        findingCode: body.findingCode,
        wcagCriterionId: body.wcagCriterionId,
        status: body.status || 'open',
        impact: body.impact || 'onbekend',
        responsibility: body.responsibility || 'onbekend',
        description: body.description,
        advice: body.advice,
        evidence: body.evidence,
      },
      include: {
        wcagCriterion: true,
        occurrences: true,
      },
    });
    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    console.error('Error creating finding:', error);
    return NextResponse.json({ error: 'Failed to create finding' }, { status: 500 });
  }
}
