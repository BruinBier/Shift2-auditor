import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_STATUS = ['todo', 'bezig', 'klaar', 'nvt'] as const;

// PUT: handmatig status of seconds van een fase corrigeren. Raakt de timer niet.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: { status?: string; seconds?: number } = {};
    if (body.status !== undefined) {
      if (!VALID_STATUS.includes(body.status)) {
        return NextResponse.json({ error: 'ongeldige status' }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.seconds !== undefined) {
      const s = Math.round(Number(body.seconds));
      if (!Number.isFinite(s) || s < 0) {
        return NextResponse.json({ error: 'seconds moet een niet-negatief getal zijn' }, { status: 400 });
      }
      data.seconds = s;
    }

    const phase = await prisma.videoPhase.update({ where: { id }, data });
    return NextResponse.json(phase);
  } catch (error) {
    console.error('Error updating video phase:', error);
    return NextResponse.json({ error: 'Failed to update phase' }, { status: 500 });
  }
}
