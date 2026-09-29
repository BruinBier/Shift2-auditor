import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CORRECTIE_STATUSSEN } from '@/lib/schrijfstijl/correcties';

export const dynamic = 'force-dynamic';

/**
 * De lijst met correcties waar Claude Code van kan leren.
 *
 * GET  ?status=te_analyseren          -> de lijst (zonder status: alles)
 * POST { findingId, bewerktDescription, bewerktAdvice }
 *                                     -> "Leer van mijn correctie" bij een bevinding
 * POST { bron: 'test', criteriumCode, origineelDescription, origineelAdvice,
 *        bewerktDescription, bewerktAdvice }
 *                                     -> een testcorrectie uit het gesprek, zonder bevinding
 *
 * Hier wordt niets geanalyseerd. Zie writing/FRITS-WRITING-WORKFLOW.md.
 */

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  if (status && !(CORRECTIE_STATUSSEN as readonly string[]).includes(status)) {
    return NextResponse.json({ error: `status moet een van ${CORRECTIE_STATUSSEN.join(', ')} zijn` }, { status: 400 });
  }
  const correcties = await prisma.schrijfcorrectie.findMany({
    where: status ? { status } : undefined,
    orderBy: { ingediendOp: 'desc' },
    include: {
      finding: {
        select: {
          id: true,
          findingCode: true,
          projectId: true,
          project: { select: { kenmerk: true, title: true } },
        },
      },
    },
  });
  return NextResponse.json(correcties);
}

const tekst = (v: unknown) => (typeof v === 'string' ? v : '');
const normaal = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige body' }, { status: 400 });
  }

  if (body.bron === 'test') {
    const data = {
      bron: 'test',
      criteriumCode: tekst(body.criteriumCode).trim() || null,
      origineelDescription: tekst(body.origineelDescription),
      origineelAdvice: tekst(body.origineelAdvice),
      bewerktDescription: tekst(body.bewerktDescription),
      bewerktAdvice: tekst(body.bewerktAdvice),
    };
    if (
      normaal(data.origineelDescription) === normaal(data.bewerktDescription) &&
      normaal(data.origineelAdvice) === normaal(data.bewerktAdvice)
    ) {
      return NextResponse.json({ error: 'Origineel en bewerkt zijn gelijk; er valt niets te leren.' }, { status: 400 });
    }
    const correctie = await prisma.schrijfcorrectie.create({ data });
    return NextResponse.json(correctie, { status: 201 });
  }

  const findingId = tekst(body.findingId);
  const finding = findingId
    ? await prisma.finding.findUnique({
        where: { id: findingId },
        include: { wcagCriterion: { select: { code: true } } },
      })
    : null;
  if (!finding) return NextResponse.json({ error: 'Bevinding niet gevonden' }, { status: 404 });
  if (finding.aiDescription == null && finding.aiAdvice == null) {
    return NextResponse.json(
      { error: 'Deze bevinding is niet door Claude geschreven; er is geen origineel om mee te vergelijken.' },
      { status: 400 }
    );
  }

  const bewerktDescription = tekst(body.bewerktDescription) || finding.description;
  const bewerktAdvice = tekst(body.bewerktAdvice) || finding.advice;
  if (
    normaal(finding.aiDescription) === normaal(bewerktDescription) &&
    normaal(finding.aiAdvice) === normaal(bewerktAdvice)
  ) {
    return NextResponse.json({ error: 'Je tekst is gelijk aan die van Claude; er valt niets te leren.' }, { status: 400 });
  }

  // Klikt Frits twee keer (eerst een woord, later nog een zin), dan is dat één correctie.
  // Een die al geanalyseerd is blijft staan zoals hij was; dan komt er een nieuwe bij.
  const open = await prisma.schrijfcorrectie.findFirst({
    where: { findingId: finding.id, status: 'te_analyseren' },
  });
  const data = {
    bron: 'bevinding',
    findingId: finding.id,
    criteriumCode: finding.wcagCriterion?.code ?? null,
    origineelDescription: finding.aiDescription ?? '',
    origineelAdvice: finding.aiAdvice ?? '',
    bewerktDescription,
    bewerktAdvice,
  };
  const correctie = open
    ? await prisma.schrijfcorrectie.update({ where: { id: open.id }, data: { ...data, ingediendOp: new Date() } })
    : await prisma.schrijfcorrectie.create({ data });

  return NextResponse.json({ ...correctie, bijgewerkt: !!open }, { status: open ? 200 : 201 });
}
