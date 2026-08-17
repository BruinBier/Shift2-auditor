import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Levert een artefact van een meting uit: de schermafdruk, de opgehaalde tekst.
 *
 * Op de kaart stond alleen een bestandsnaam, en daar heeft niemand iets aan. Een
 * reflow-meting die "nul elementen te breed" zegt is pas te vertrouwen als je het beeld
 * ernaast kunt leggen — dat is de hele reden dat get-reflow een schermafdruk maakt.
 *
 * Alleen uit tmp/audit-cli, alleen de bestandsnaam zonder pad, en alleen de soorten die
 * de CLI zelf wegschrijft. Zonder die drie sloten is dit een route waarmee je elk
 * bestand op de machine kunt opvragen.
 */

const MAP = path.resolve(process.cwd(), 'tmp', 'audit-cli');

const SOORTEN: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Alleen lokaal beschikbaar' }, { status: 400 });
  }

  const gevraagd = request.nextUrl.searchParams.get('pad') ?? '';
  // Alleen de bestandsnaam. Een pad met mappen erin, absoluut of met .., komt er niet
  // door: basename gooit dat weg, en daarna controleren we of het resultaat gelijk is
  // aan wat er gevraagd werd.
  const naam = path.basename(gevraagd);
  if (!naam || naam !== gevraagd.replace(/^.*[\\/]/, '')) {
    return NextResponse.json({ error: 'Ongeldige bestandsnaam' }, { status: 400 });
  }

  const ext = path.extname(naam).toLowerCase();
  const soort = SOORTEN[ext];
  if (!soort) {
    return NextResponse.json({ error: `Bestandssoort ${ext || '(geen)'} wordt niet uitgeleverd` }, { status: 400 });
  }

  const volledig = path.resolve(MAP, naam);
  // Gordel én bretels: ook na basename nog controleren dat we binnen de map blijven.
  if (!volledig.startsWith(MAP + path.sep)) {
    return NextResponse.json({ error: 'Buiten de werkmap' }, { status: 400 });
  }
  if (!fs.existsSync(volledig)) {
    return NextResponse.json(
      { error: 'Dit artefact bestaat niet meer. tmp/audit-cli wordt opgeruimd; draai de meting opnieuw.' },
      { status: 404 }
    );
  }

  const inhoud = fs.readFileSync(volledig);
  return new NextResponse(new Uint8Array(inhoud), {
    headers: { 'Content-Type': soort, 'Cache-Control': 'no-store' },
  });
}
