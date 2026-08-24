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
import { leesKaarttekst } from '@/lib/criterium-kaarttekst';

/**
 * `opmerking` staat er sinds 2026-08-23, en niet uit volledigheidsdrang.
 *
 * De eerste versie kende alleen ok, nvt en fout. Op de homepage van heuvelrug.nl staat het
 * bezoekadres in dezelfde opsomming als de drie contactnummers (B003) — volgens de regels een
 * OPMERKING en uitdrukkelijk geen afkeuring, want er gaat niets verloren; er wordt alleen een
 * verband beweerd dat er niet is. Zonder deze waarde moest dat als `fout` weg, en dan staat er
 * een rood kruis bij iets dat het criterium niet laat zakken.
 */
const UITKOMSTEN = ['ok', 'nvt', 'fout', 'opmerking'] as const;
type Uitkomst = (typeof UITKOMSTEN)[number];

interface GebiedUitkomst {
  gebied: string;
  uitkomst: Uitkomst;
  toelichting?: string;
}

/** De bestaande lijst, met de rommel eruit. Wat er niet uitziet als een regel, telt niet. */
function huidigeLijst(waarde: unknown): GebiedUitkomst[] {
  if (!Array.isArray(waarde)) return [];
  return waarde.filter(
    (r): r is GebiedUitkomst =>
      !!r &&
      typeof r === 'object' &&
      typeof (r as any).gebied === 'string' &&
      UITKOMSTEN.includes((r as any).uitkomst)
  );
}

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

    /**
     * De gebieden staan in het regelbestand, niet in de database, en dus is dít de plek waar
     * gecontroleerd wordt of een naam bestaat.
     *
     * Zonder die controle zou een tikfout stilzwijgend niets doen: de regel komt in de kolom
     * te staan, de kaart zoekt hem op naam op, vindt niets, en toont het gebied als "nog niet
     * nagelopen". Het werk is dan gedaan en toch onzichtbaar — precies het gat dat deze hele
     * lijst moet dichten.
     */
    const kaart = leesKaarttekst(String(criterionCode));
    const bekend = kaart?.gebieden ?? [];
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

    const nieuw: GebiedUitkomst[] = [];
    for (const r of ingevoerd) {
      const gebied = String((r as any)?.gebied ?? '').trim();
      const uitkomst = String((r as any)?.uitkomst ?? '').trim();
      const toelichting = String((r as any)?.toelichting ?? '').trim();

      if (!bekend.includes(gebied)) {
        return NextResponse.json(
          {
            error: `onbekend gebied "${gebied}" bij ${criterionCode}`,
            bekendeGebieden: bekend,
          },
          { status: 400 }
        );
      }
      if (!UITKOMSTEN.includes(uitkomst as Uitkomst)) {
        return NextResponse.json(
          { error: `uitkomst moet ${UITKOMSTEN.join(', ')} zijn, niet "${uitkomst}"` },
          { status: 400 }
        );
      }
      // Een fout of opmerking zonder uitleg is een teken waar niemand iets mee kan. Bij `ok`
      // en `nvt` mag de uitleg weg: daar is de uitkomst zelf het hele bericht.
      if ((uitkomst === 'fout' || uitkomst === 'opmerking') && !toelichting) {
        return NextResponse.json(
          { error: `gebied "${gebied}" staat op ${uitkomst}; schrijf erbij wat er aan de hand is` },
          { status: 400 }
        );
      }

      nieuw.push({
        gebied,
        uitkomst: uitkomst as Uitkomst,
        ...(toelichting ? { toelichting } : {}),
      });
    }

    const gevonden = await zoekOordeel(params.id, sampleItemId, String(criterionCode));
    if ('fout' in gevonden) return NextResponse.json({ error: gevonden.fout }, { status: 400 });
    const { oordeel } = gevonden;

    /**
     * Samenvoegen, niet overschrijven.
     *
     * Een ronde hoeft niet alle dertien gebieden tegelijk te doen — je kunt de koppen nu
     * nalopen en de tabellen straks. Wie de hele lijst opnieuw wil zetten, stuurt hem
     * gewoon in zijn geheel op.
     */
    const bestaand = huidigeLijst(oordeel.gebieden);
    const perGebied = new Map(bestaand.map((g) => [g.gebied, g]));
    for (const g of nieuw) perGebied.set(g.gebied, g);
    // In de volgorde van het regelbestand, zodat de kaart niet van volgorde verspringt
    // afhankelijk van wie wanneer wat invulde.
    const samen = bekend.map((g) => perGebied.get(g)).filter(Boolean) as GebiedUitkomst[];

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
      open: bekend.filter((g) => !perGebied.has(g)),
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
