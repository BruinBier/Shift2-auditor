import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * De hele steekproef in één keer accorderen.
 *
 * Anders dan bij een bevinding gaat het akkoord hier over de lijst als geheel.
 * De vraag bij een sample is niet "klopt deze pagina" maar "dekt deze verzameling
 * de site" -- en dat beoordeel je aan de lijst, niet aan de items apart. Vandaar
 * één knop in plaats van een vinkje per rij.
 *
 * Zelf een sample bewerken laat de vlag ook vervallen (zie de PATCH op
 * app/api/sample-items/[id]/route.ts): dat is immers ook kijken.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resultaat = await prisma.sampleItem.updateMany({
      where: { projectId: params.id, voorgesteld: true },
      data: { voorgesteld: false },
    });

    return NextResponse.json({ goedgekeurd: resultaat.count });
  } catch (error) {
    console.error('Error approving sample items:', error);
    return NextResponse.json(
      { error: 'De steekproef goedkeuren is niet gelukt.' },
      { status: 500 }
    );
  }
}
