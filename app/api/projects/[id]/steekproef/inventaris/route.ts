import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inventariseer, vatSamen, type InventarisInvoer } from '@/lib/steekproef/inventaris';
import { urlsUitTekstveld } from '@/lib/steekproef/urls';

/**
 * Kandidateninventarisatie voor de steekproef (steekproefselectie v2, fase 1).
 *
 * POST start een inventarisatie en geeft meteen het id terug; het werk loopt daarna in
 * de server door (een grote site kost een minuut of twee). GET geeft de inventarisaties
 * van dit project, nieuwste eerst, zonder de kandidaten zelf -- die staan onder
 * `/steekproef/inventaris/<inventarisId>`.
 *
 * Deze route KIEST NIETS. De pool en de aanwijzingen zijn in fase 1 alleen zichtbaar;
 * de steekproef wordt nog steeds door de workflow `steekproef-samenstellen` voorgesteld.
 */

/** Een inventarisatie die langer dan dit op "bezig" staat, is afgebroken (herstart server). */
const VERLOPEN_NA_MS = 30 * 60 * 1000;

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const runs = await prisma.steekproefInventaris.findMany({
    where: { projectId: params.id },
    orderBy: { gestartOp: 'desc' },
    select: {
      id: true,
      status: true,
      startUrl: true,
      canonHost: true,
      samenvatting: true,
      poolHash: true,
      kandidatenHash: true,
      fout: true,
      gestartOp: true,
      klaarOp: true,
      versies: true,
    },
  });
  // Is de pool gelijk aan die van de vorige inventarisatie? Alleen zinvol bij dezelfde
  // versies; anders kan een regelwijziging het verschil verklaren.
  const metVergelijking = runs.map((r, i) => {
    const vorige = runs.slice(i + 1).find((x) => x.status === 'klaar');
    return {
      ...r,
      gelijkAanVorige:
        r.status === 'klaar' && vorige
          ? {
              vorigeId: vorige.id,
              pool: r.poolHash === vorige.poolHash,
              kandidaten: r.kandidatenHash === vorige.kandidatenHash,
              zelfdeVersies: JSON.stringify(r.versies) === JSON.stringify(vorige.versies),
            }
          : null,
    };
  });
  return NextResponse.json(metVergelijking);
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      scopeInScope: true,
      scopeOutOfScope: true,
      sampleClientPages: true,
      scopeUrls: { select: { url: true, inScope: true, parentUrlId: true } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });

  const lopend = await prisma.steekproefInventaris.findFirst({
    where: { projectId: params.id, status: 'bezig', gestartOp: { gt: new Date(Date.now() - VERLOPEN_NA_MS) } },
  });
  if (lopend) {
    return NextResponse.json({ error: 'Er loopt al een inventarisatie voor dit project', id: lopend.id }, { status: 409 });
  }

  // Het beginpunt: de planning (Details > Planning), anders de eerste binnen-scope-URL die
  // niet zelf door discovery is gevonden.
  const startUrl =
    urlsUitTekstveld(project.scopeInScope)[0] ||
    project.scopeUrls.find((s) => s.inScope && !s.parentUrlId)?.url ||
    null;
  if (!startUrl) {
    return NextResponse.json(
      { error: 'Geen website in de scope. Vul "Binnen scope" in bij Details > Planning of op het tabblad Scope.' },
      { status: 400 },
    );
  }

  const invoer: InventarisInvoer = {
    startUrl,
    scopeUrls: project.scopeUrls.map((s) => ({ url: s.url, inScope: s.inScope })),
    klantUrls: urlsUitTekstveld(project.sampleClientPages),
    buitenScopeUrls: urlsUitTekstveld(project.scopeOutOfScope),
  };

  const run = await prisma.steekproefInventaris.create({
    data: { projectId: params.id, status: 'bezig', startUrl, invoer: invoer as any },
  });

  // Bewust niet afwachten: het antwoord gaat nu terug, de inventarisatie loopt door.
  void voerUit(run.id, invoer);

  return NextResponse.json({ id: run.id, status: 'bezig', startUrl }, { status: 202 });
}

async function voerUit(runId: string, invoer: InventarisInvoer) {
  try {
    const r = await inventariseer(invoer);
    const samenvatting = vatSamen(r, invoer.klantUrls);

    // In blokken: een grote site levert ruim duizend rijen op.
    const rijen = r.kandidaten.map((k) => ({
      inventarisId: runId,
      urlNorm: k.urlNorm,
      soort: k.soort,
      documentSoort: k.documentSoort,
      bronnen: k.bronnen,
      status: k.status,
      reden: k.reden,
      dubbelVan: k.dubbelVan,
      httpStatus: k.httpStatus,
      contentType: k.contentType,
      eindUrl: k.eindUrl,
      titel: k.titel,
      canonical: k.canonical,
      taal: k.taal,
      noindex: k.noindex,
      grootte: k.grootte,
      aanwijzingen: (k.aanwijzingen ?? undefined) as any,
      vingerafdruk: (k.vingerafdruk ?? undefined) as any,
      gevondenOp: k.gevondenOp,
      varianten: k.varianten,
      ingrepen: k.ingrepen,
      diepte: k.diepte,
      waarschuwing: k.waarschuwing,
    }));
    for (let i = 0; i < rijen.length; i += 500) {
      await prisma.inventarisKandidaat.createMany({ data: rijen.slice(i, i + 500) });
    }

    await prisma.steekproefInventaris.update({
      where: { id: runId },
      data: {
        status: 'klaar',
        canonHost: r.canonHost,
        versies: r.versies as any,
        instellingen: { linkDiepte: r.linkDiepte, aliassen: r.aliassen, canonicalGenegeerd: r.canonicalGenegeerd } as any,
        sitemap: r.sitemap as any,
        uitsluitregels: r.uitsluitregels as any,
        externeHosts: r.externeHosts as any,
        samenvatting: samenvatting as any,
        poolHash: r.poolHash,
        kandidatenHash: r.kandidatenHash,
        klaarOp: new Date(),
      },
    });
  } catch (e: any) {
    console.error('[steekproef/inventaris] mislukt:', e);
    await prisma.steekproefInventaris
      .update({ where: { id: runId }, data: { status: 'mislukt', fout: String(e?.message || e).slice(0, 2000), klaarOp: new Date() } })
      .catch(() => {});
  }
}
