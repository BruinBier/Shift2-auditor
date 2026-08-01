import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { typeVoorImpact } from '@/lib/finding-classification';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: params.id },
      include: {
        wcagCriterion: true,
        occurrences: {
          include: {
            sampleItem: true,
          },
        },
      },
    });

    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    return NextResponse.json(finding);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch finding' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const finding = await prisma.finding.update({
      where: { id: params.id },
      data: {
        ...(body.findingCode && { findingCode: body.findingCode }),
        ...(body.wcagCriterionId && { wcagCriterionId: body.wcagCriterionId }),
        ...(body.status && { status: body.status }),
        // impact en type horen bij elkaar; een expliciet type wint
        ...(body.impact !== undefined && {
          impact: body.impact,
          type: typeVoorImpact(body.impact),
        }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.responsibility && { responsibility: body.responsibility }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.advice !== undefined && { advice: body.advice }),
        ...(body.evidence !== undefined && { evidence: body.evidence }),
      },
      include: {
        wcagCriterion: true,
        occurrences: {
          include: {
            sampleItem: true,
          },
        },
      },
    });
    return NextResponse.json(finding);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update finding' }, { status: 500 });
  }
}
