import { NextRequest, NextResponse } from 'next/server';
import { bestaandeSessie } from '@/lib/schermsessie';

/**
 * De hele pagina opnemen bij "Ik zie hier nog iets": een full-page screenshot plus de
 * volledige HTML.
 *
 * Eerst geprobeerd met een sleep-rechthoek (een gebied aanwijzen, met een vaste checkvraag
 * erbij) — dat werkte niet naar wens: geen kader nodig, en de checkvraag moest weg omdat de
 * onderzoeker zelf typt wát en waar het probleem is. Deze route doet dus geen selectie: hij
 * legt gewoon de hele pagina vast, zoals `get-screenshot --full-page` en `get-html` dat al
 * op de opdrachtregel doen, maar dan zonder het commando te hoeven typen.
 *
 * WAT DEZE ROUTE NIET DOET: beoordelen. Er wordt niets gemeten en niets vastgelegd.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Alleen lokaal beschikbaar' }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Ongeldige body' }, { status: 400 });
  }

  const sessie = bestaandeSessie(String(body.sessie ?? ''));
  if (!sessie) {
    return NextResponse.json(
      { ok: false, error: 'Er staat geen browser open voor dit paneel.' },
      { status: 404 }
    );
  }

  const screenshot = await sessie.page
    .screenshot({ type: 'jpeg', quality: 70, fullPage: true })
    .then((buf: Buffer) => buf.toString('base64'))
    .catch(() => null);

  // Alleen de body: de head (scripts, meta, style-tags) draagt niets bij aan een WCAG-vraag
  // en maakt de meegestuurde tekst onnodig lang -- op een gewone pagina scheelt dat weinig,
  // maar de scripts in de head liepen hier op tot een aanzienlijk deel van de hele HTML.
  const html: string | null = await sessie.page
    .evaluate(() => document.body.outerHTML)
    .catch(() => null);

  return NextResponse.json({ ok: true, screenshot, html });
}
