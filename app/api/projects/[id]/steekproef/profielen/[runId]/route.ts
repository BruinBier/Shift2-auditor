import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Eén profielrun met al zijn profielen, en het afronden ervan (PATCH). */

export async function GET(_request: NextRequest, { params }: { params: { id: string; runId: string } }) {
  const run = await prisma.steekproefProfielRun.findFirst({
    where: { id: params.runId, projectId: params.id },
    include: { profielen: { orderBy: [{ soort: 'desc' }, { urlNorm: 'asc' }] } },
  });
  if (!run) return NextResponse.json({ error: 'Profielrun niet gevonden' }, { status: 404 });
  return NextResponse.json(run);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string; runId: string } }) {
  const body = await request.json();
  const run = await prisma.steekproefProfielRun.findFirst({ where: { id: params.runId, projectId: params.id }, select: { id: true } });
  if (!run) return NextResponse.json({ error: 'Profielrun niet gevonden' }, { status: 404 });
  const bijgewerkt = await prisma.steekproefProfielRun.update({
    where: { id: run.id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.samenvatting !== undefined ? { samenvatting: body.samenvatting } : {}),
      ...(body.status && body.status !== 'bezig' ? { klaarOp: new Date() } : {}),
    },
    select: { id: true, status: true },
  });
  return NextResponse.json(bijgewerkt);
}
