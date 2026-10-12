import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Gekoppelde werkitems van een technisch issue: andere technische issues.
 *
 * Een koppeling geldt twee kanten op en staat er één keer in, met de kleinste id als
 * vanId. Zo kan hetzelfde paar niet twee keer bestaan, en weghalen aan één kant haalt
 * het aan beide kanten weg.
 */

const paar = (a: string, b: string) => (a < b ? { vanId: a, naarId: b } : { vanId: b, naarId: a });

const kort = { select: { id: true, nummer: true, title: true, status: true, supplier: true } } as const;

async function gekoppeld(id: string) {
  const rijen = await prisma.technicalIssueKoppeling.findMany({
    where: { OR: [{ vanId: id }, { naarId: id }] },
    include: { van: kort, naar: kort },
    orderBy: { createdAt: 'asc' },
  });
  return rijen.map((r) => (r.vanId === id ? r.naar : r.van));
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await gekoppeld(params.id));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { anderId } = await request.json().catch(() => ({}));
  if (typeof anderId !== 'string' || !anderId) {
    return NextResponse.json({ error: 'anderId ontbreekt' }, { status: 400 });
  }
  if (anderId === params.id) {
    return NextResponse.json({ error: 'Een issue kan niet aan zichzelf gekoppeld worden' }, { status: 400 });
  }
  const bestaan = await prisma.technicalIssue.count({ where: { id: { in: [params.id, anderId] } } });
  if (bestaan !== 2) return NextResponse.json({ error: 'Issue niet gevonden' }, { status: 404 });

  const sleutel = paar(params.id, anderId);
  await prisma.technicalIssueKoppeling.upsert({
    where: { vanId_naarId: sleutel },
    create: sleutel,
    update: {},
  });
  return NextResponse.json(await gekoppeld(params.id), { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const anderId = request.nextUrl.searchParams.get('ander');
  if (!anderId) return NextResponse.json({ error: 'ander ontbreekt' }, { status: 400 });
  await prisma.technicalIssueKoppeling.deleteMany({ where: paar(params.id, anderId) });
  return NextResponse.json(await gekoppeld(params.id));
}
