/**
 * Wat er per deelgebied is nagelopen, bij één sampleoordeel.
 *
 * Sommige criteria bestaan uit meerdere losse vragen. SC 1.3.1 is er zo een: dertien
 * gebieden, van koppen tot citaten. Daar is één oordeel voor, met een onderbouwing in
 * lopende tekst — en die tekst maakt geen verschil tussen "geen tabellen op deze pagina" en
 * "niet naar tabellen gekeken". Een verhaal dat iets weglaat leest hetzelfde als een verhaal
 * dat niets te melden had.
 *
 * Aanleiding: BEV-03 (2026-08-04). De audit zette 1.3.1 op `opmerking` met een onderbouwing
 * over de koppenstructuur, terwijl er op diezelfde pagina `em`-elementen om gewone zinnen
 * stonden. Een afkeuring die er al was, gemist omdat niemand zag dat de andere twaalf
 * gebieden niet waren nagelopen.
 *
 * Twee dingen die deze route bewust NIET doet, net als bij `zelf-gevonden`:
 *
 *   Het oordeel aanraken. Een gebied afvinken is geen uitspraak dat het criterium zakt.
 *   Ook niet als er `fout` staat: daar hoort een bevinding bij, en die weegt de onderzoeker.
 *
 *   Het akkoord laten vervallen. Dat gebeurt bij `reden`, omdat een bevestiging hoort bij de
 *   tekst die iemand las.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  GebiedUitkomst,
  UITKOMSTEN,
  Uitkomst,
  bekendeGebieden,
  huidigeLijst,
  leesGebieden,
  voegSamen,
} from '@/lib/deelgebieden';

/**
 * Zoekt het oordeel op en controleert of het sample bij dit project hoort.
 *
 * Zonder die controle belandt een uitkomst bij een ander onderzoek.
 */
async function zoekOordeel(projectId: string, sampleItemId: string, criterionCode: string) {
  const sample = await prisma.sampleItem.findFirst({
    where: { id: sampleItemId, projectId },
    select: { id: true },
  });
  if (!sample) return { fout: 'dit sample hoort niet bij dit project' as const };

  const criterium = await prisma.wCAGCriterion.findFirst({
    where: { code: criterionCode },
    select: { id: true },
  });
  if (!criterium) return { fout: `onbekend criterium ${criterionCode}` as const };

  const oordeel = await prisma.sampleCriterionCheck.findFirst({
    where: { sampleItemId, wcagCriterionId: criterium.id },
    select: { id: true, gebieden: true },
  });
  if (!oordeel) {
    return { fout: 'er is nog geen oordeel voor deze pagina en dit criterium' as const };
  }
  return { oordeel };
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { sampleItemId, criterionCode } = body ?? {};

    if (!sampleItemId || !criterionCode) {
      return NextResponse.json(
        { error: 'sampleItemId en criterionCode zijn nodig' },
        { status: 400 }
      );
    }

    const bekend = bekendeGebieden(String(criterionCode));
    if (!bekend.length) {
      return NextResponse.json(
        {
          error: `criterium ${criterionCode} heeft geen deelgebieden; voeg ze toe onder "### Deelgebieden" in het regelbestand`,
        },
        { status: 400 }
      );
    }

    const ingevoerd: unknown[] = Array.isArray(body?.gebieden) ? body.gebieden : [];
    if (!ingevoerd.length) {
      return NextResponse.json({ error: 'geef minstens één gebied op' }, { status: 400 });
    }

    const gelezen = leesGebieden(String(criterionCode), ingevoerd, bekend);
    if ('fout' in gelezen) {
      return NextResponse.json(
        {
          error: gelezen.fout,
          ...(gelezen.bekendeGebieden ? { bekendeGebieden: gelezen.bekendeGebieden } : {}),
        },
        { status: 400 }
      );
    }

    const gevonden = await zoekOordeel(params.id, sampleItemId, String(criterionCode));
    if ('fout' in gevonden) return NextResponse.json({ error: gevonden.fout }, { status: 400 });
    const { oordeel } = gevonden;

    const { gebieden: samen, open } = voegSamen(
      huidigeLijst(oordeel.gebieden),
      gelezen.gebieden,
      bekend
    );

    await prisma.sampleCriterionCheck.update({
      where: { id: oordeel.id },
      // `as any`: Prisma's Json-invoertype accepteert geen interface met optionele velden.
      // Zelfde reden als bij `zelfGevonden` in de route hiernaast.
      data: { gebieden: samen as any },
    });

    return NextResponse.json({
      ok: true,
      gebieden: samen,
      nagelopen: samen.length,
      totaal: bekend.length,
      open,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'onbekende fout' }, { status: 500 });
  }
}

/**
 * Een gebied terugzetten op "nog niet nagelopen".
 *
 * Overschrijven kan met PUT, maar dat vervangt een bewering door een andere bewering. Soms
 * moet je terug naar géén bewering: de agent zette "Tabellen: niet aanwezig" terwijl hij daar
 * niet naar gekeken had, en dan hoort dat gebied weer op de open ring te staan zodat het op
 * de werklijst blijft. Zonder dit kun je alleen nog maar iets anders beweren.
 *
 *   { sampleItemId, criterionCode, gebieden: ["Tabellen"] }   één of meer gebieden
 *   { sampleItemId, criterionCode, alles: true }              de hele lijst leeg
 *
 * `alles` moet er expliciet bij: een lege lijst wist niets, want een vergeten veld hoort geen
 * werk te wissen.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { sampleItemId, criterionCode, alles } = body ?? {};

    if (!sampleItemId || !criterionCode) {
      return NextResponse.json(
        { error: 'sampleItemId en criterionCode zijn nodig' },
        { status: 400 }
      );
    }

    const teWissen: string[] = Array.isArray(body?.gebieden)
      ? body.gebieden.map((g: unknown) => String(g ?? '').trim()).filter(Boolean)
      : [];
    if (!teWissen.length && alles !== true) {
      return NextResponse.json(
        { error: 'noem de gebieden die weg moeten, of geef alles: true mee' },
        { status: 400 }
      );
    }

    const gevonden = await zoekOordeel(params.id, sampleItemId, String(criterionCode));
    if ('fout' in gevonden) return NextResponse.json({ error: gevonden.fout }, { status: 400 });
    const { oordeel } = gevonden;

    const bestaand = huidigeLijst(oordeel.gebieden);
    // Een naam die er niet in staat is geen fout maar wel het melden waard: meestal is het
    // een tikfout, en dan denk je dat er iets gewist is terwijl er niets gebeurde.
    const nietGevonden = teWissen.filter((g) => !bestaand.some((b) => b.gebied === g));
    const over = alles === true ? [] : bestaand.filter((b) => !teWissen.includes(b.gebied));

    await prisma.sampleCriterionCheck.update({
      where: { id: oordeel.id },
      // `null` en niet `[]`: leeg betekent "niets vastgelegd", en dat is dezelfde toestand
      // als voordat er ooit iets is ingevuld. Een lege array zou een derde toestand zijn.
      data: { gebieden: over.length ? (over as any) : null },
    });

    return NextResponse.json({
      ok: true,
      gewist: alles === true ? bestaand.map((b) => b.gebied) : teWissen.filter((g) => !nietGevonden.includes(g)),
      ...(nietGevonden.length ? { nietGevonden } : {}),
      gebieden: over,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'onbekende fout' }, { status: 500 });
  }
}
