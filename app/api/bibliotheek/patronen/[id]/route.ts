import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bekendeCriteria } from '@/lib/bibliotheek/server';
import { controleerPatroon } from '@/lib/bibliotheek/validatie';

/**
 * Patroon bijwerken: alle velden tegelijk, zoals het oordeel-tabblad ze stuurt.
 *
 * Wordt de status `vastgesteld`, dan vult de route `vastgesteldOp` met nu; de
 * naam komt van het scherm, waar hij vooraf op "Frits" staat (besluit 1). Wie
 * mag vaststellen is een afspraak: de app kent geen gebruikers. Terug naar
 * concept wist beide velden.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const oud = await prisma.patroon.findUnique({ where: { id: params.id } });
  if (!oud) return NextResponse.json({ fouten: ['Patroon bestaat niet.'] }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ fouten: ['Geen geldige invoer.'] }, { status: 400 });
  }
  const { fouten, data } = controleerPatroon(body, await bekendeCriteria());
  if (fouten.length > 0) return NextResponse.json({ fouten }, { status: 400 });

  const nuVastgesteld = data.status === 'vastgesteld';
  const wasVastgesteld = oud.status === 'vastgesteld';
  const patroon = await prisma.patroon.update({
    where: { id: params.id },
    data: {
      ...data,
      vastgesteldDoor: nuVastgesteld ? data.vastgesteldDoor : null,
      vastgesteldOp: nuVastgesteld ? (wasVastgesteld ? oud.vastgesteldOp : new Date()) : null,
    },
  });
  return NextResponse.json(patroon);
}
