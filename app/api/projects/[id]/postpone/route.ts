import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Schuift de planning van een onderzoek op en legt vast waarom.
 *
 * Start- en einddatum schuiven allebei even ver op, zodat de looptijd
 * gelijk blijft. De oude en nieuwe datums worden samen met de reden
 * bewaard in project_planning_changes, zodat ook een tweede of derde
 * uitstel achteraf te verantwoorden is.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const weeks = Number(data.weeks);
    const reason = typeof data.reason === 'string' ? data.reason.trim() : '';

    if (!Number.isFinite(weeks) || weeks === 0) {
      return NextResponse.json(
        { error: 'Geef het aantal weken op waarmee de planning opschuift.' },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { error: 'Geef een reden voor het uitstel.' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        dateStart: true,
        dateEnd: true,
        reportDate: true,
        researcherName: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Onderzoek niet gevonden.' }, { status: 404 });
    }
    if (!project.dateStart && !project.dateEnd) {
      return NextResponse.json(
        { error: 'Dit onderzoek heeft nog geen planning om op te schuiven.' },
        { status: 400 }
      );
    }

    const days = weeks * 7;
    const shift = (d: Date | null) => {
      if (!d) return null;
      const next = new Date(d);
      next.setDate(next.getDate() + days);
      return next;
    };

    const newDateStart = shift(project.dateStart);
    const newDateEnd = shift(project.dateEnd);
    // De rapportdatum loopt mee met de deadline; blijft die leeg, dan laten
    // we hem met rust.
    const newReportDate = project.reportDate ? shift(project.reportDate) : null;

    const [updated] = await prisma.$transaction([
      prisma.project.update({
        where: { id: params.id },
        data: {
          dateStart: newDateStart,
          dateEnd: newDateEnd,
          ...(newReportDate ? { reportDate: newReportDate } : {}),
        },
      }),
      prisma.projectPlanningChange.create({
        data: {
          projectId: params.id,
          oldDateStart: project.dateStart,
          oldDateEnd: project.dateEnd,
          newDateStart,
          newDateEnd,
          reason,
          authorName: data.authorName || project.researcherName || 'Onbekend',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dateStart: updated.dateStart,
      dateEnd: updated.dateEnd,
    });
  } catch (error) {
    console.error('Error postponing project planning:', error);
    return NextResponse.json(
      { error: 'Het uitstellen is niet gelukt.' },
      { status: 500 }
    );
  }
}

/** De verschuivingen van dit onderzoek, nieuwste eerst. */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const changes = await prisma.projectPlanningChange.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(changes);
  } catch (error) {
    console.error('Error fetching planning changes:', error);
    return NextResponse.json(
      { error: 'Ophalen van de planningswijzigingen is niet gelukt.' },
      { status: 500 }
    );
  }
}
