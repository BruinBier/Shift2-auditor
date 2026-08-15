import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Waarnemingen: de ruwe observaties van de onderzoeker.
 *
 * "Hier klopt iets niet", zonder oordeel. Geen criterium, geen impact, geen tekst
 * volgens de schrijfregels — dat is juist het werk dat er nog aan moet gebeuren.
 * Grondstof, geen bevinding. Zie CONTEXT.md en docs/adr/0001-akkoord-als-poort.md.
 *
 * De onderzoeker is hier de spotter, niet de opsteller: hij noteert wat hem
 * opvalt, het systeem werkt het later uit tot een voorstel, en dat voorstel gaat
 * langs dezelfde poort als een machinale vondst.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const waarnemingen = await prisma.waarneming.findMany({
      where: {
        projectId: params.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        sampleItem: { select: { id: true, title: true, url: true } },
        finding: {
          select: { id: true, findingCode: true, status: true, description: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(waarnemingen);
  } catch (error: any) {
    console.error('Fout bij ophalen waarnemingen:', error);
    return NextResponse.json({ error: 'Ophalen mislukt' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const tekst: string = (body.tekst ?? '').trim();

    if (!tekst) {
      return NextResponse.json(
        { error: 'Een waarneming zonder tekst zegt niets. Beschrijf wat je zag.' },
        { status: 400 }
      );
    }

    // Hoort het sample bij dit project? Anders belandt een waarneming op een
    // pagina uit een ander onderzoek.
    if (body.sampleItemId) {
      const sample = await prisma.sampleItem.findFirst({
        where: { id: body.sampleItemId, projectId: params.id },
        select: { id: true },
      });
      if (!sample) {
        return NextResponse.json(
          { error: 'Dit sample hoort niet bij dit project' },
          { status: 400 }
        );
      }
    }

    const waarneming = await prisma.waarneming.create({
      data: {
        projectId: params.id,
        sampleItemId: body.sampleItemId || null,
        url: body.url?.trim() || null,
        tekst,
        screenshotPath: body.screenshotPath?.trim() || null,
      },
      include: {
        sampleItem: { select: { id: true, title: true, url: true } },
      },
    });

    return NextResponse.json(waarneming, { status: 201 });
  } catch (error: any) {
    console.error('Fout bij aanmaken waarneming:', error);
    return NextResponse.json(
      { error: 'Aanmaken mislukt', details: error?.message },
      { status: 500 }
    );
  }
}
