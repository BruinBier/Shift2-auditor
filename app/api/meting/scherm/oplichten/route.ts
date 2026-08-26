import { NextRequest, NextResponse } from 'next/server';
import { bestaandeSessie, verversBeeld } from '@/lib/schermsessie';

/**
 * Eén gemarkeerd element opzoeken in de pagina en laten oplichten.
 *
 * Waarom dit bestaat: een gemeentepagina is al gauw vijfduizend pixels hoog, en "vijf
 * sociale-media-links met alleen de platformnaam" is een uitkomst waar je vervolgens naar
 * moet gaan zoeken. Klik je in het paneel op zo'n regel, dan scrolt de pagina ernaartoe en
 * springt het kader eruit — je ziet meteen waar het staat en wat eromheen.
 *
 * De nummers komen uit de markering (`data-shift2-nr`); hier wordt niets opnieuw beoordeeld.
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

  const nr = Number(body.nr);
  if (!Number.isFinite(nr) || nr < 0) {
    return NextResponse.json({ ok: false, error: 'Geen geldig nummer' }, { status: 400 });
  }

  const gevonden = await sessie.page
    .evaluate((n: number) => {
      const el = document.querySelector('[data-shift2-nr="' + n + '"]') as HTMLElement | null;
      if (!el) return null;

      el.scrollIntoView({ block: 'center', inline: 'center' });

      // Het kader dikker en in een opvallende kleur, met de eigen kleur bewaard zodat het
      // daarna terug kan. Geen animatie: een lopende overgang wint van alles in de cascade,
      // en dan legt de opname de beginwaarde vast in plaats van het opgelichte kader.
      const eigen = el.getAttribute('data-shift2-markering') || '2px solid #d40000';
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('outline', '5px solid #f59e0b', 'important');
      el.style.setProperty('outline-offset', '4px', 'important');
      el.setAttribute('data-shift2-opgelicht', eigen);

      // Alles wat eerder oplichtte weer normaal, anders bouwt het zich op.
      document.querySelectorAll('[data-shift2-opgelicht]').forEach((ander) => {
        if (ander === el) return;
        const a = ander as HTMLElement;
        const terug = a.getAttribute('data-shift2-opgelicht') || '';
        if (terug) {
          a.style.setProperty('outline', terug, 'important');
          a.style.setProperty('outline-offset', '2px', 'important');
        }
        a.removeAttribute('data-shift2-opgelicht');
      });

      const r = el.getBoundingClientRect();
      return {
        naam: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        waarom: el.getAttribute('data-shift2-waarom') || null,
        inBeeld: r.top >= 0 && r.bottom <= window.innerHeight,
      };
    }, nr)
    .catch(() => null);

  if (!gevonden) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Dit element staat niet meer op de pagina. Is er doorgeklikt, meet dan opnieuw met "Markeer de links".',
      },
      { status: 404 }
    );
  }

  await verversBeeld(String(body.sessie));

  return NextResponse.json({ ok: true, ...gevonden });
}
