/**
 * Onderdelen die de onderzoeker zélf vond, bij één sampleoordeel.
 *
 * Een meting vindt niet alles. `get-consistentie` legt de pagina's van de steekproef naast
 * elkaar, maar een onderdeel dat pas na een klik verschijnt, een pagina buiten de steekproef
 * of twee elementen die de sleutel niet aan elkaar koppelt, komen daar niet uit. Wat de
 * auditor met eigen ogen ziet hoort in dezelfde lijst als wat gemeten is.
 *
 * Twee dingen die deze route bewust NIET doet:
 *
 *   Het oordeel aanraken. Iets aan je eigen lijst toevoegen is geen uitspraak dat het
 *   criterium zakt; dat weeg je in de stap erna.
 *
 *   Het akkoord laten vervallen. Dat gebeurt bij `reden`, omdat een bevestiging hoort bij de
 *   tekst die iemand las. Een eigen aantekening erbij zetten is iets anders dan het oordeel
 *   herschrijven, en zou eerdere goedkeuring niet mogen intrekken.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Variant {
  /** Wat er stond: de zichtbare tekst of de toegankelijke naam. */
  wat: string;
  /** Waar je het zag: een paginanaam of een adres, in je eigen woorden. */
  waar: string;
}

interface ZelfGevonden {
  id: string;
  omschrijving: string;
  varianten: Variant[];
  notitie?: string;
  toegevoegdOp: string;
  /**
   * De sleutel van het gemeten onderdeel waar deze aantekening bij hoort. Leeg betekent
   * een eigen vondst die los in de lijst staat.
   */
  overOnderdeel?: string;
  /** `agent` is een lezing van de assistent, geen meting en geen oordeel. */
  door?: 'agent' | 'onderzoeker';
  /**
   * Wat de onderzoeker ermee deed.
   *
   * Een afgewezen lezing wordt niet gewist maar blijft staan als afgewezen. Anders is
   * later niet meer te zien dat er iets is voorgesteld en dat iemand het heeft weggewogen
   * — en dat hoort juist in de verantwoording thuis. Dezelfde poort als bij een voorstel
   * voor een bevinding.
   */
  status?: 'open' | 'overgenomen' | 'afgewezen';
  /** Waarom afgewezen, als de onderzoeker dat opschreef. */
  reactie?: string;
}

/** De bestaande lijst, met de rommel eruit. Wat er niet uitziet als een regel, telt niet. */
function huidigeLijst(waarde: unknown): ZelfGevonden[] {
  if (!Array.isArray(waarde)) return [];
  return waarde.filter(
    (r): r is ZelfGevonden => !!r && typeof r === 'object' && typeof (r as any).id === 'string'
  );
}

async function zoekOordeel(projectId: string, sampleItemId: string, criterionCode: string) {
  // Hoort dit sample bij dit project? Anders belandt een aantekening bij een ander onderzoek.
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
    select: { id: true, zelfGevonden: true },
  });
  return { oordeel, wcagCriterionId: criterium.id };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { sampleItemId, criterionCode } = body ?? {};
    const omschrijving = String(body?.omschrijving ?? '').trim();
    const notitie = String(body?.notitie ?? '').trim();
    const varianten: Variant[] = Array.isArray(body?.varianten)
      ? body.varianten
          .map((v: any) => ({ wat: String(v?.wat ?? '').trim(), waar: String(v?.waar ?? '').trim() }))
          .filter((v: Variant) => v.wat || v.waar)
      : [];

    if (!sampleItemId || !criterionCode) {
      return NextResponse.json({ error: 'sampleItemId en criterionCode zijn nodig' }, { status: 400 });
    }
    if (!omschrijving) {
      return NextResponse.json({ error: 'omschrijving is leeg' }, { status: 400 });
    }
    // Eén variant is geen vergelijking. 3.2.4 gaat erover dat hetzelfde onderdeel op de ene
    // plek anders heet dan op de andere; met één regel valt er niets naast elkaar te leggen.
    // Een eigen vondst moet twee varianten hebben, anders valt er niets naast elkaar te
    // leggen. Een aantekening bij een gemeten onderdeel hoeft dat niet: het onderdeel
    // staat er al, met zijn varianten.
    const overOnderdeel = String(body?.overOnderdeel ?? '').trim();
    if (!overOnderdeel && varianten.length < 2) {
      return NextResponse.json(
        { error: 'geef minstens twee varianten op — anders valt er niets te vergelijken' },
        { status: 400 }
      );
    }

    const gevonden = await zoekOordeel(params.id, sampleItemId, criterionCode);
    if ('fout' in gevonden) return NextResponse.json({ error: gevonden.fout }, { status: 400 });
    if (!gevonden.oordeel) {
      return NextResponse.json(
        { error: 'er is nog geen oordeel voor deze pagina en dit criterium' },
        { status: 404 }
      );
    }

    const regel: ZelfGevonden = {
      id: crypto.randomUUID(),
      omschrijving,
      varianten,
      ...(notitie ? { notitie } : {}),
      ...(overOnderdeel ? { overOnderdeel } : {}),
      ...(body?.door === 'agent' ? { door: 'agent' as const } : {}),
      toegevoegdOp: new Date().toISOString(),
    };
    const lijst = [...huidigeLijst(gevonden.oordeel.zelfGevonden), regel];

    await prisma.sampleCriterionCheck.update({
      where: { id: gevonden.oordeel.id },
      data: { zelfGevonden: lijst as any },
    });

    return NextResponse.json({ toegevoegd: regel, aantal: lijst.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'onbekende fout' }, { status: 500 });
  }
}

/** De stand van een lezing bijwerken: overgenomen of afgewezen. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { sampleItemId, criterionCode, onderdeelId, status } = body ?? {};
    const reactie = String(body?.reactie ?? '').trim();
    if (!['open', 'overgenomen', 'afgewezen'].includes(status)) {
      return NextResponse.json({ error: 'onbekende status' }, { status: 400 });
    }
    if (!sampleItemId || !criterionCode || !onderdeelId) {
      return NextResponse.json({ error: 'sampleItemId, criterionCode en onderdeelId zijn nodig' }, { status: 400 });
    }

    const gevonden = await zoekOordeel(params.id, sampleItemId, criterionCode);
    if ('fout' in gevonden) return NextResponse.json({ error: gevonden.fout }, { status: 400 });
    if (!gevonden.oordeel) return NextResponse.json({ error: 'geen oordeel gevonden' }, { status: 404 });

    const lijst = huidigeLijst(gevonden.oordeel.zelfGevonden).map((r) =>
      r.id === onderdeelId ? { ...r, status, ...(reactie ? { reactie } : {}) } : r
    );
    await prisma.sampleCriterionCheck.update({
      where: { id: gevonden.oordeel.id },
      data: { zelfGevonden: lijst as any },
    });
    return NextResponse.json({ onderdeelId, status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'onbekende fout' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { sampleItemId, criterionCode, onderdeelId } = body ?? {};
    if (!sampleItemId || !criterionCode || !onderdeelId) {
      return NextResponse.json(
        { error: 'sampleItemId, criterionCode en onderdeelId zijn nodig' },
        { status: 400 }
      );
    }

    const gevonden = await zoekOordeel(params.id, sampleItemId, criterionCode);
    if ('fout' in gevonden) return NextResponse.json({ error: gevonden.fout }, { status: 400 });
    if (!gevonden.oordeel) return NextResponse.json({ error: 'geen oordeel gevonden' }, { status: 404 });

    const lijst = huidigeLijst(gevonden.oordeel.zelfGevonden).filter((r) => r.id !== onderdeelId);
    await prisma.sampleCriterionCheck.update({
      where: { id: gevonden.oordeel.id },
      data: { zelfGevonden: lijst as any },
    });

    return NextResponse.json({ verwijderd: onderdeelId, aantal: lijst.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'onbekende fout' }, { status: 500 });
  }
}
