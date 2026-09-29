import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bouwDendrogram, CLUSTER_VERSIE, snij, verschuivingen, type ClusterInvoer } from '@/lib/steekproef/clusters';
import { VINGERAFDRUK_VERSIE } from '@/lib/steekproef/vingerafdruk';

/**
 * Sjabloonclusters (steekproefselectie v2, fase 3). SCHADUWFUNCTIE.
 *
 * Rekent de clusters uit de vingerafdrukken van de laatste inventarisatie; niets wordt
 * opgeslagen. Deze clusters hebben GEEN invloed op de profielkeuze, het budget of de
 * steekproef -- ze zijn er om te beoordelen of ze inhoudelijk kloppen.
 *
 * ?drempel=0.8 (0,5..1)  ?inventaris=<id>
 */

const DREMPELS = [0.7, 0.75, 0.8, 0.85, 0.9];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t0 = Date.now();
  const q = request.nextUrl.searchParams;
  const drempel = Math.min(1, Math.max(0.5, Number(q.get('drempel') || 0.8)));

  const inv = await prisma.steekproefInventaris.findFirst({
    where: { projectId: params.id, status: 'klaar', ...(q.get('inventaris') ? { id: q.get('inventaris')! } : {}) },
    orderBy: { gestartOp: 'desc' },
    select: { id: true, gestartOp: true, versies: true, canonHost: true },
  });
  if (!inv) return NextResponse.json({ error: 'Geen afgeronde inventarisatie' }, { status: 404 });

  const rijen = await prisma.inventarisKandidaat.findMany({
    where: { inventarisId: inv.id, status: 'kandidaat', soort: 'html' },
    select: { urlNorm: true, titel: true, vingerafdruk: true, aanwijzingen: true },
  });
  const met = rijen.filter((r) => r.vingerafdruk);
  if (!met.length) {
    return NextResponse.json(
      { error: 'Deze inventarisatie heeft nog geen vingerafdrukken. Inventariseer opnieuw.', inventarisId: inv.id },
      { status: 409 },
    );
  }

  // Een vingerafdruk van een andere versie wordt niet met de huidige logica gelezen: dan
  // zou een oude inventarisatie stil anders geïnterpreteerd worden. Opnieuw inventariseren.
  const versies = [...new Set(met.map((r) => (r.vingerafdruk as any)?.versie ?? null))];
  if (versies.length !== 1 || versies[0] !== VINGERAFDRUK_VERSIE) {
    return NextResponse.json(
      {
        error: `Deze inventarisatie heeft vingerafdrukken van versie ${versies.join(', ')}; de clustering hoort bij versie ${VINGERAFDRUK_VERSIE}. Inventariseer opnieuw.`,
        inventarisId: inv.id,
        versies,
      },
      { status: 409 },
    );
  }

  const invoer: ClusterInvoer[] = met.map((r) => ({ urlNorm: r.urlNorm, titel: r.titel, vingerafdruk: r.vingerafdruk as any }));
  const boom = bouwDendrogram(invoer);
  const sneden = Object.fromEntries(DREMPELS.map((t) => [t, snij(boom, t)]));
  const gekozen = sneden[drempel] ?? snij(boom, drempel);

  const titel = new Map(met.map((r) => [r.urlNorm, r.titel]));
  const pd = new Map(met.map((r) => [r.urlNorm, (r.aanwijzingen as any)?.paginadata ?? null]));

  return NextResponse.json({
    inventarisId: inv.id,
    inventarisDatum: inv.gestartOp,
    canonHost: inv.canonHost,
    versies: { ...(inv.versies as any), cluster: CLUSTER_VERSIE },
    drempel,
    paginas: met.length,
    zonderVingerafdruk: rijen.length - met.length,
    perDrempel: DREMPELS.map((t) => {
      const c = sneden[t];
      return {
        drempel: t,
        clusters: c.length,
        singletons: c.filter((x) => x.leden.length === 1).length,
        grootste: c.slice(0, 5).map((x) => x.leden.length),
        verschuivingTovGekozen: t === drempel ? 0 : verschuivingen(gekozen, c).length,
      };
    }),
    clusters: gekozen.map((c) => ({
      ...c,
      leden: c.leden.map((u) => ({
        urlNorm: u,
        titel: titel.get(u) ?? null,
        video: (pd.get(u)?.video || 0) > 0,
        kaart: (pd.get(u)?.kaart || 0) > 0,
      })),
    })),
    duurMs: Date.now() - t0,
  });
}
