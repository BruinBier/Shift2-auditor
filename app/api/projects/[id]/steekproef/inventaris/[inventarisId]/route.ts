import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Eén inventarisatie met haar kandidaten.
 *
 * Filters: `?status=kandidaat|uitgesloten|dubbel|niet_opgehaald`, `?soort=html|document`.
 * Zonder filters komt alles mee, op `urlNorm` gesorteerd -- dezelfde volgorde als waarin
 * de poolhash is berekend.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string; inventarisId: string } }) {
  const run = await prisma.steekproefInventaris.findFirst({
    where: { id: params.inventarisId, projectId: params.id },
  });
  if (!run) return NextResponse.json({ error: 'Inventarisatie niet gevonden' }, { status: 404 });

  const status = request.nextUrl.searchParams.get('status');
  const soort = request.nextUrl.searchParams.get('soort');
  const kandidaten = await prisma.inventarisKandidaat.findMany({
    where: {
      inventarisId: run.id,
      ...(status ? { status } : {}),
      ...(soort ? { soort } : {}),
    },
    orderBy: { urlNorm: 'asc' },
  });
  return NextResponse.json({ ...run, kandidaten });
}
