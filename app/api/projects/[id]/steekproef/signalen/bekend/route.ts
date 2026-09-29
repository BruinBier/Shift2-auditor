import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * De cache: welke opdrachten zijn door deze aanbieder al beantwoord?
 *
 * De sleutel bevat onderwerp + vraagId + vraagVersie + contentHash (zie classifier.ts).
 * Een bekende sleutel hoeft niet opnieuw gesteld te worden.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { sleutels, aanbieder } = await request.json();
  if (!Array.isArray(sleutels) || !aanbieder) return NextResponse.json({ error: 'sleutels en aanbieder zijn verplicht' }, { status: 400 });
  const rijen = await prisma.paginaSignaal.findMany({
    where: { projectId: params.id, aanbieder, sleutel: { in: sleutels } },
    select: { sleutel: true },
  });
  return NextResponse.json({ bekend: rijen.map((r) => r.sleutel) });
}
