import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * De Shift2-huisregels voor één succescriterium, als tekst.
 *
 * Bestaat zodat het besprekingsblok uit de taakstapel zichzelf kan uitleggen. Een
 * verwijzing naar `wcag-regels/Shift2_Regels_SC_1_1_1.md` helpt alleen een AI die
 * in deze repository kan lezen; plak je het blok in een chatvenster zonder toegang
 * tot de bestanden, dan is de verwijzing waardeloos. Door de regels mee te sturen
 * werkt het overal — en blijft het onderzoek van niemands gereedschap afhankelijk.
 *
 * GET /api/wcag-regels?code=1.1.1
 */

const MAP = path.join(process.cwd(), 'wcag-regels');

/** Alleen een echte SC-code. Zonder deze controle is dit een leesbaar bestandssysteem. */
const CODE = /^\d{1}\.\d{1,2}\.\d{1,2}$/;

async function lees(bestand: string): Promise<string | null> {
  try {
    return await readFile(path.join(MAP, bestand), 'utf8');
  } catch {
    // Niet elk criterium heeft een regelbestand; dat is geen fout.
    return null;
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? '';
  if (!CODE.test(code)) {
    return NextResponse.json({ error: 'Ongeldige criteriumcode' }, { status: 400 });
  }

  const bestandsnaam = `Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`;
  const [regels, schrijfregels, scope] = await Promise.all([
    lees(bestandsnaam),
    lees('Shift2_Schrijfregels.md'),
    lees('Shift2_Scope_Per_Sample.md'),
  ]);

  return NextResponse.json({
    code,
    bestandsnaam,
    regels,
    schrijfregels,
    scope,
  });
}
