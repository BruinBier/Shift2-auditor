import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bekendeOefensets } from '@/lib/bibliotheek/server';
import { casusId, controleerCasus } from '@/lib/bibliotheek/validatie';

/** Nieuwe casus bij een patroon. Oordeel en criteria horen bij het patroon, niet hier. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ fouten: ['Geen geldige invoer.'] }, { status: 400 });
  }
  const patroonId = typeof body.patroonId === 'string' ? body.patroonId : '';
  const patroon = await prisma.patroon.findUnique({ where: { id: patroonId }, select: { id: true } });
  if (!patroon) return NextResponse.json({ fouten: ['Patroon bestaat niet.'] }, { status: 400 });

  const { fouten, data } = controleerCasus(body, await bekendeOefensets());
  if (fouten.length > 0) return NextResponse.json({ fouten }, { status: 400 });

  const bestaand = new Set((await prisma.casus.findMany({ select: { id: true } })).map((c) => c.id));
  const casus = await prisma.casus.create({
    data: { ...data, id: casusId(data.oefensets, bestaand), patroonId },
  });
  return NextResponse.json(casus, { status: 201 });
}
