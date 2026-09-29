import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { voegRegelToe, pasRegelsAan, GidsConflict } from '@/lib/schrijfstijl/gids';
import type { Analyse } from '@/lib/schrijfstijl/correcties';

export const dynamic = 'force-dynamic';

/**
 * Frits beslist over een voorgestelde schrijfregel. Dit is de enige plek die de gids aanpast.
 *
 * POST { actie: 'toevoegen', nieuweTekst? }   -> nieuwe regel, of bestaande regel(s) aanpassen
 * POST { actie: 'niet_toevoegen' }
 *
 * `nieuweTekst` mag Frits zelf nog bijschaven; zonder komt de tekst uit het voorstel.
 * Alleen op de dev-server: een route die een bestand in de repo schrijft hoort niet op een
 * productieserver. Zelfde slot als /api/wcag-regels/deelgebied.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige body' }, { status: 400 });
  }

  const correctie = await prisma.schrijfcorrectie.findUnique({ where: { id: params.id } });
  if (!correctie) return NextResponse.json({ error: 'Correctie niet gevonden' }, { status: 404 });
  if (correctie.status !== 'voorstel') {
    return NextResponse.json({ error: 'Er staat bij deze correctie geen voorstel open.' }, { status: 409 });
  }

  if (body.actie === 'niet_toevoegen') {
    const bijgewerkt = await prisma.schrijfcorrectie.update({
      where: { id: correctie.id },
      data: { status: 'niet_toegevoegd', beslistOp: new Date() },
    });
    return NextResponse.json(bijgewerkt);
  }
  if (body.actie !== 'toevoegen') {
    return NextResponse.json({ error: "actie moet 'toevoegen' of 'niet_toevoegen' zijn" }, { status: 400 });
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'De schrijfgids aanpassen kan alleen vanaf de lokale dev-server.' },
      { status: 400 }
    );
  }

  const analyse = correctie.analyse as unknown as Analyse;
  const nieuweTekst: string = (typeof body.nieuweTekst === 'string' && body.nieuweTekst.trim()) || analyse.voorstel!.nieuweTekst;
  const herkomst = {
    reden: analyse.voorstel!.reden,
    criterium: correctie.criteriumCode,
    correctieId: correctie.id,
  };

  try {
    const wijziging =
      analyse.uitkomst === 'nieuw'
        ? voegRegelToe(analyse.voorstel!.sectie!, nieuweTekst, herkomst)
        : pasRegelsAan(analyse.regelIds, analyse.oudeTeksten ?? {}, nieuweTekst, herkomst);

    const bijgewerkt = await prisma.schrijfcorrectie.update({
      where: { id: correctie.id },
      data: { status: 'toegevoegd', beslistOp: new Date(), wijzigingId: wijziging.id },
    });
    return NextResponse.json({ correctie: bijgewerkt, wijziging });
  } catch (e) {
    if (e instanceof GidsConflict) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }
}
