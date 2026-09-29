import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * De uitkomst van één gemeten pagina of document opslaan. De rij is bij het starten van de
 * run al aangemaakt (status `gepland`); hier komt de meting erin.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string; runId: string } }) {
  const b = await request.json();
  const run = await prisma.steekproefProfielRun.findFirst({ where: { id: params.runId, projectId: params.id }, select: { id: true } });
  if (!run) return NextResponse.json({ error: 'Profielrun niet gevonden' }, { status: 404 });
  const rij = await prisma.paginaProfiel.findFirst({ where: { runId: run.id, urlNorm: b.urlNorm }, select: { id: true, document: true } });
  if (!rij) return NextResponse.json({ error: 'Deze URL staat niet in het plan van de run' }, { status: 404 });

  await prisma.paginaProfiel.update({
    where: { id: rij.id },
    data: {
      status: b.status,
      fout: b.fout ?? null,
      eindUrl: b.eindUrl ?? null,
      titel: b.titel ?? null,
      browser: b.browser ?? null,
      omgeleid: b.omgeleid ?? null,
      gehydrateerd: b.gehydrateerd ?? null,
      cookiescherm: b.cookiescherm ?? undefined,
      dichtgeklapt: b.dichtgeklapt ?? null,
      bereik: b.bereik ?? null,
      htmlTaal: b.htmlTaal ?? null,
      kenmerken: b.kenmerken ?? undefined,
      gebieden: b.gebieden ?? undefined,
      // Bij een document de geschatte soort uit het plan bewaren naast de meting.
      document: b.document ? { ...((rij.document as any) || {}), ...b.document } : undefined,
      schermafdruk: b.schermafdruk ?? null,
      duurMs: b.duurMs ?? null,
      gemetenOp: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}
