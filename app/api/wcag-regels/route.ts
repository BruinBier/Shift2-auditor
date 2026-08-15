import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
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

const KOP = '## Vastgelegd tijdens overleg';

/**
 * Voegt een regel toe die uit een overleg is gekomen.
 *
 * Dit is het sluitstuk van de lus. Zonder deze route komt een afspraak alleen in
 * wcag-regels/ als iemand hem daar met een editor in zet — en dan leert het systeem
 * alleen bij als er toevallig een ontwikkelaar meekijkt. De volgende auditronde
 * maakt dan dezelfde fout, en die corrigeer je opnieuw met de hand.
 *
 * Alleen toevoegen, nooit overschrijven: bestaande regels zijn vakinhoud waar
 * mensen op vertrouwen. De nieuwe regel komt onder een eigen kopje achteraan, met
 * datum en aanleiding, zodat in git terug te zien is wanneer een regel ontstond en
 * waarom.
 *
 * POST /api/wcag-regels  { code, regel, aanleiding? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code: string = body.code ?? '';
    const regel: string = (body.regel ?? '').trim();
    const aanleiding: string = (body.aanleiding ?? '').trim();

    if (!CODE.test(code)) {
      return NextResponse.json({ error: 'Ongeldige criteriumcode' }, { status: 400 });
    }
    if (!regel) {
      return NextResponse.json({ error: 'Geen regel meegegeven' }, { status: 400 });
    }

    const bestandsnaam = `Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`;
    const pad = path.join(MAP, bestandsnaam);
    const bestaand = await lees(bestandsnaam);
    const datum = new Date().toISOString().slice(0, 10);

    const stukken: string[] = [];
    if (bestaand === null) {
      // Eerste regel voor dit criterium.
      stukken.push(`# Shift2-beoordelingsregels SC ${code}`);
      stukken.push('');
      stukken.push(
        'Aanvullingen op de checklist, vastgelegd tijdens het werk. Bij twijfel gaat de'
      );
      stukken.push('checklist voor, tenzij hieronder uitdrukkelijk anders staat.');
      stukken.push('');
      stukken.push(KOP);
    } else {
      stukken.push(bestaand.replace(/\s+$/, ''));
      stukken.push('');
      if (!bestaand.includes(KOP)) stukken.push(KOP);
    }

    stukken.push('');
    stukken.push(`### ${datum}`);
    stukken.push('');
    stukken.push(regel);
    if (aanleiding) {
      stukken.push('');
      stukken.push(`Aanleiding: ${aanleiding}`);
    }
    stukken.push('');

    await writeFile(pad, stukken.join('\n'), 'utf8');

    return NextResponse.json({
      bestandsnaam,
      nieuwBestand: bestaand === null,
      datum,
    });
  } catch (error: any) {
    console.error('Fout bij vastleggen regel:', error);
    return NextResponse.json(
      { error: 'Vastleggen mislukt', details: error?.message },
      { status: 500 }
    );
  }
}
