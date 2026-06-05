import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Phase = 'nulmeting' | 'tussencheck' | 'herinspectie' | 'afgerond';

const VALID_TRANSITIONS: Record<Phase, Phase[]> = {
  nulmeting: ['tussencheck'],
  tussencheck: ['herinspectie'],
  herinspectie: ['afgerond'],
  afgerond: [],
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const target: Phase = body.checkPhase;
    const label: string | undefined = body.interimCheckLabel;

    if (!target || !['nulmeting', 'tussencheck', 'herinspectie', 'afgerond'].includes(target)) {
      return NextResponse.json({ error: 'Invalid checkPhase' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { checkPhase: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[project.checkPhase];
    if (!allowed.includes(target)) {
      return NextResponse.json(
        { error: `Cannot transition from ${project.checkPhase} to ${target}` },
        { status: 400 }
      );
    }

    // Reset interimReviewed when entering herinspectie — verification starts fresh.
    if (target === 'herinspectie') {
      await prisma.finding.updateMany({
        where: { projectId: params.id },
        data: { interimReviewed: false },
      });
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        checkPhase: target,
        checkPhaseStartedAt: new Date(),
        ...(label !== undefined ? { interimCheckLabel: label } : {}),
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('Error changing project phase:', error);
    return NextResponse.json({ error: 'Failed to change phase', details: error.message }, { status: 500 });
  }
}
