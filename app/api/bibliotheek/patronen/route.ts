import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bekendeCriteria } from '@/lib/bibliotheek/server';
import { controleerPatroon, patroonId } from '@/lib/bibliotheek/validatie';

/** Nieuw patroon. Begint altijd als concept; vaststellen gaat via het oordeel-tabblad. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ fouten: ['Geen geldige invoer.'] }, { status: 400 });
  }
  const { fouten, data } = controleerPatroon({ ...body, status: 'concept' }, await bekendeCriteria());
  if (fouten.length > 0) return NextResponse.json({ fouten }, { status: 400 });

  const bestaand = new Set((await prisma.patroon.findMany({ select: { id: true } })).map((p) => p.id));
  const patroon = await prisma.patroon.create({
    data: { ...data, id: patroonId(data.criteria, data.titel, bestaand) },
  });
  return NextResponse.json(patroon, { status: 201 });
}
