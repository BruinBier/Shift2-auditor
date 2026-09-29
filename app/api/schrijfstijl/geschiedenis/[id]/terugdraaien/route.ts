import { NextResponse } from 'next/server';
import { draaiTerug, GidsConflict } from '@/lib/schrijfstijl/gids';

export const dynamic = 'force-dynamic';

/**
 * Een wijziging in de schrijfgids terugdraaien. De terugdraaiing komt zelf ook in de
 * geschiedenis, zodat te zien blijft dat een regel er een tijd heeft gestaan.
 *
 * POST /api/schrijfstijl/geschiedenis/<wijzigingId>/terugdraaien
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'De schrijfgids aanpassen kan alleen vanaf de lokale dev-server.' },
      { status: 400 }
    );
  }
  try {
    return NextResponse.json(draaiTerug(params.id));
  } catch (e) {
    if (e instanceof GidsConflict) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }
}
