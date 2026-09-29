import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VRAGEN, effectiefAntwoord, isGeldigAntwoord, type VraagId, type Zekerheid } from '@/lib/steekproef/vragen';

/**
 * Semantische signalen (steekproefselectie v2, fase 4).
 *
 * Een signaal is een antwoord op een kleine, gesloten vraag -- geen besluit over de
 * steekproef. Niets in de selectie leest deze tabel (nog).
 *
 * GET  ?vraag=paginarol   de opgeslagen signalen, met het effectieve antwoord (laag = twijfel)
 * POST { aanbieder, model, signalen: [...] }   opslaan; wat er al is (zelfde sleutel en
 *      aanbieder) wordt overgeslagen, niet overschreven.
 */

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const vraag = request.nextUrl.searchParams.get('vraag');
  const rijen = await prisma.paginaSignaal.findMany({
    where: { projectId: params.id, ...(vraag ? { vraagId: vraag } : {}) },
    orderBy: [{ vraagId: 'asc' }, { onderwerp: 'asc' }],
  });
  return NextResponse.json(rijen.map((r) => ({ ...r, effectief: effectiefAntwoord(r.antwoord, r.zekerheid as Zekerheid) })));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const aanbieder = String(body.aanbieder || '').trim();
  const model = String(body.model || '').trim();
  if (!aanbieder || !model) return NextResponse.json({ error: 'aanbieder en model zijn verplicht' }, { status: 400 });

  const geweigerd: { sleutel: string; fout: string }[] = [];
  const rijen: any[] = [];
  for (const s of body.signalen || []) {
    const vraagId = s.vraagId as VraagId;
    if (!VRAGEN[vraagId]) {
      geweigerd.push({ sleutel: s.sleutel, fout: `onbekende vraag ${s.vraagId}` });
      continue;
    }
    if (Number(s.vraagVersie) !== VRAGEN[vraagId].versie) {
      geweigerd.push({ sleutel: s.sleutel, fout: `vraagversie ${s.vraagVersie}, catalogus heeft ${VRAGEN[vraagId].versie}` });
      continue;
    }
    if (!isGeldigAntwoord(vraagId, s.antwoord) || !['hoog', 'middel', 'laag'].includes(s.zekerheid)) {
      geweigerd.push({ sleutel: s.sleutel, fout: `ongeldig antwoord of zekerheid: ${s.antwoord} / ${s.zekerheid}` });
      continue;
    }
    rijen.push({
      projectId: params.id,
      sleutel: s.sleutel,
      onderwerp: s.onderwerp,
      onderwerpSoort: s.onderwerpSoort,
      vraagId,
      vraagVersie: VRAGEN[vraagId].versie,
      aanbieder,
      model,
      antwoord: s.antwoord,
      zekerheid: s.zekerheid,
      reden: String(s.reden || '').slice(0, 300),
      contentHash: s.contentHash,
      invoer: s.invoer ?? undefined,
      waarom: s.waarom ?? null,
    });
  }
  const r = await prisma.paginaSignaal.createMany({ data: rijen, skipDuplicates: true });
  return NextResponse.json({ opgeslagen: r.count, overgeslagen: rijen.length - r.count, geweigerd }, { status: 201 });
}
