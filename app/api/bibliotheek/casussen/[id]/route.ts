import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bekendeOefensets } from '@/lib/bibliotheek/server';
import { controleerCasus } from '@/lib/bibliotheek/validatie';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const oud = await prisma.casus.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!oud) return NextResponse.json({ fouten: ['Casus bestaat niet.'] }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ fouten: ['Geen geldige invoer.'] }, { status: 400 });
  }
  const { fouten, data } = controleerCasus(body, await bekendeOefensets());
  if (fouten.length > 0) return NextResponse.json({ fouten }, { status: 400 });

  const casus = await prisma.casus.update({ where: { id: params.id }, data });
  return NextResponse.json(casus);
}

/** Een rapportbevinding die naar deze casus wees, houdt haar patroon; alleen de casus valt weg. */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const oud = await prisma.casus.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!oud) return NextResponse.json({ fouten: ['Casus bestaat niet.'] }, { status: 404 });
  await prisma.casus.delete({ where: { id: params.id } });
  return NextResponse.json({ verwijderd: params.id });
}
