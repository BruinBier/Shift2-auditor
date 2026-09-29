import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leesGids } from '@/lib/schrijfstijl/gids';
import { controleerAnalyse, type Analyse } from '@/lib/schrijfstijl/correcties';

export const dynamic = 'force-dynamic';

/**
 * De analyse van Claude Code bij een correctie wegschrijven.
 *
 * PUT { ...analyse }   (formaat: writing/FRITS-WRITING-WORKFLOW.md, stap 6)
 *
 * Raakt de gids niet. Een analyse met een voorstel wacht daarna op Frits; een analyse zonder
 * voorstel ('geen') is meteen afgehandeld.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const correctie = await prisma.schrijfcorrectie.findUnique({ where: { id: params.id } });
  if (!correctie) return NextResponse.json({ error: 'Correctie niet gevonden' }, { status: 404 });
  if (correctie.status === 'toegevoegd' || correctie.status === 'niet_toegevoegd') {
    return NextResponse.json({ error: 'Over deze correctie heeft Frits al beslist.' }, { status: 409 });
  }

  let analyse: Analyse;
  try {
    analyse = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }

  const gids = leesGids();
  const fout = controleerAnalyse(analyse, new Set(gids.regels.map((r) => r.id)), gids.secties);
  if (fout) return NextResponse.json({ error: fout }, { status: 422 });

  // De regels zoals ze nu luiden: dat is de OUDE REGEL die Frits te zien krijgt.
  analyse.oudeTeksten = Object.fromEntries(
    analyse.regelIds.map((id) => [id, gids.regels.find((r) => r.id === id)!.tekst])
  );

  const bijgewerkt = await prisma.schrijfcorrectie.update({
    where: { id: correctie.id },
    data: {
      analyse: analyse as any,
      status: analyse.uitkomst === 'geen' ? 'geen_wijziging' : 'voorstel',
      geanalyseerdOp: new Date(),
    },
  });
  return NextResponse.json(bijgewerkt);
}
