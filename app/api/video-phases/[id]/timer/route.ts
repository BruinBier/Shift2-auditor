import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function elapsedSeconds(startedAt: Date): number {
  return Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
}

// POST: timer starten voor deze fase.
// Stopt eerst elke lopende timer in het HELE systeem (max. 1 tegelijk), dan start deze.
// Beide stappen in één transactie zodat er nooit twee tegelijk lopen.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Stop een eventueel lopende timer en schrijf de tijd weg.
      const running = await tx.videoPhase.findFirst({
        where: { timerStartedAt: { not: null } },
      });
      let stopped = null;
      if (running && running.timerStartedAt) {
        stopped = await tx.videoPhase.update({
          where: { id: running.id },
          data: {
            seconds: running.seconds + elapsedSeconds(running.timerStartedAt),
            timerStartedAt: null,
          },
        });
      }

      // 2. Start de gevraagde fase.
      const started = await tx.videoPhase.update({
        where: { id },
        data: { timerStartedAt: new Date(), status: 'bezig' },
      });

      return { started, stopped };
    });

    return NextResponse.json(result);
  } catch (error) {
    // Partieel-unieke index schendt bij een gelijktijdige start-race.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Er loopt al een timer, probeer opnieuw' },
        { status: 409 }
      );
    }
    console.error('Error starting timer:', error);
    return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 });
  }
}

// DELETE: timer stoppen voor deze fase. Idempotent (no-op als niet lopend).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const phase = await prisma.videoPhase.findUnique({ where: { id } });
    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }
    if (!phase.timerStartedAt) {
      return NextResponse.json(phase); // niets te doen
    }

    const stopped = await prisma.videoPhase.update({
      where: { id },
      data: {
        seconds: phase.seconds + elapsedSeconds(phase.timerStartedAt),
        timerStartedAt: null,
      },
    });
    return NextResponse.json(stopped);
  } catch (error) {
    console.error('Error stopping timer:', error);
    return NextResponse.json({ error: 'Failed to stop timer' }, { status: 500 });
  }
}
