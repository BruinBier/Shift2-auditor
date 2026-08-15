import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Eén waarneming bijwerken of verwijderen.
 *
 * `status` volgt de levensloop: open (nog niet uitgewerkt), uitgewerkt (er is een
 * voorstel uit voortgekomen), vervallen (bleek niets te zijn). Bij 'uitgewerkt'
 * hoort een findingId, zodat terug te zien is waar de waarneming heen ging.
 */

const GELDIGE_STATUS = new Set(['open', 'uitgewerkt', 'vervallen']);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; waarnemingId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const bestaande = await prisma.waarneming.findUnique({
      where: { id: params.waarnemingId },
      select: { id: true, projectId: true },
    });
    if (!bestaande || bestaande.projectId !== params.id) {
      return NextResponse.json({ error: 'Waarneming niet gevonden' }, { status: 404 });
    }

    const data: any = {};
    if (body.tekst !== undefined) {
      const tekst = (body.tekst ?? '').trim();
      if (!tekst) {
        return NextResponse.json({ error: 'Tekst mag niet leeg zijn' }, { status: 400 });
      }
      data.tekst = tekst;
    }
    if (body.status !== undefined) {
      if (!GELDIGE_STATUS.has(body.status)) {
        return NextResponse.json(
          { error: `status moet een van ${Array.from(GELDIGE_STATUS).join(', ')} zijn` },
          { status: 400 }
        );
      }
      data.status = body.status;
    }
    if (body.sampleItemId !== undefined) data.sampleItemId = body.sampleItemId || null;
    if (body.url !== undefined) data.url = body.url?.trim() || null;
    if (body.findingId !== undefined) data.findingId = body.findingId || null;

    const waarneming = await prisma.waarneming.update({
      where: { id: params.waarnemingId },
      data,
      include: {
        sampleItem: { select: { id: true, title: true } },
        finding: { select: { id: true, findingCode: true, status: true } },
      },
    });

    return NextResponse.json(waarneming);
  } catch (error: any) {
    console.error('Fout bij bijwerken waarneming:', error);
    return NextResponse.json(
      { error: 'Bijwerken mislukt', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; waarnemingId: string }> }
) {
  try {
    const params = await context.params;
    const bestaande = await prisma.waarneming.findUnique({
      where: { id: params.waarnemingId },
      select: { id: true, projectId: true },
    });
    if (!bestaande || bestaande.projectId !== params.id) {
      return NextResponse.json({ error: 'Waarneming niet gevonden' }, { status: 404 });
    }

    await prisma.waarneming.delete({ where: { id: params.waarnemingId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Fout bij verwijderen waarneming:', error);
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  }
}
