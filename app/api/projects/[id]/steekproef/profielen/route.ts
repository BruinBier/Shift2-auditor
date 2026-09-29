import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Profielruns (steekproefselectie v2, fase 2): de browsermeting van een deel van de pool.
 *
 * De meting zelf draait in de CLI (`npm run cli -- steekproef-profiel`), want die heeft de
 * auditsessie. POST legt het plan vast (welke pagina's, waarom), daarna komt per pagina een
 * PATCH op `/<runId>/profiel`, en tot slot een PATCH op `/<runId>` met de samenvatting.
 *
 * Meten, niet kiezen: er komt hier geen steekproef uit.
 */

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const runs = await prisma.steekproefProfielRun.findMany({
    where: { projectId: params.id },
    orderBy: { gestartOp: 'desc' },
    select: {
      id: true,
      inventarisId: true,
      status: true,
      config: true,
      versies: true,
      browser: true,
      uitleg: true,
      samenvatting: true,
      gestartOp: true,
      klaarOp: true,
    },
  });
  return NextResponse.json(runs);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const inventaris = await prisma.steekproefInventaris.findFirst({
    where: { id: body.inventarisId, projectId: params.id, status: 'klaar' },
    select: { id: true },
  });
  if (!inventaris) return NextResponse.json({ error: 'Inventarisatie niet gevonden of niet klaar' }, { status: 400 });

  const run = await prisma.steekproefProfielRun.create({
    data: {
      projectId: params.id,
      inventarisId: inventaris.id,
      status: 'bezig',
      config: body.config ?? null,
      versies: body.versies ?? null,
      browser: body.browser ?? null,
      uitleg: body.uitleg ?? null,
    },
  });

  const rijen = [
    ...(body.paginas || []).map((p: any) => ({
      runId: run.id,
      urlNorm: p.urlNorm,
      soort: 'html',
      redenen: p.redenen || [],
      laag: p.laag ?? null,
      status: 'gepland',
      statisch: p.statisch ?? undefined,
    })),
    ...(body.documenten || []).map((d: any) => ({
      runId: run.id,
      urlNorm: d.urlNorm,
      soort: 'document',
      redenen: d.redenen || [],
      laag: 'document',
      status: 'gepland',
      document: { geschatteSoort: d.geschatteSoort },
    })),
  ];
  if (rijen.length) await prisma.paginaProfiel.createMany({ data: rijen });

  return NextResponse.json({ id: run.id, gepland: rijen.length }, { status: 201 });
}
