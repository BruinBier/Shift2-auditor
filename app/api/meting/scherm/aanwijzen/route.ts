import { NextRequest, NextResponse } from 'next/server';
import { bestaandeSessie, verversBeeld } from '@/lib/schermsessie';

/**
 * Het element aanwijzen waar één bevinding over gaat.
 *
 * Verschil met `oplichten` hiernaast: dat werkt op `data-shift2-nr`, het nummer dat de
 * markering van een meting achterlaat. Dat bestaat alleen ná zo'n meting en alleen voor de
 * criteria die er een hebben. Deze route werkt op een CSS-selector die de agent bij de
 * bevinding heeft geschreven, en dus voor elk criterium.
 *
 * Waarom het nodig is: de kaders van een markering zijn criteriumbreed. Bij 1.1.1 met zeven
 * afbeeldingen vind je het logo zo, maar bij een criterium met dertig gemarkeerde links is
 * "hier zit het probleem" een zoekopdracht. De bevinding weet welk element ze bedoelt; dit
 * maakt dat zichtbaar.
 *
 * WAT DEZE ROUTE NIET DOET: beoordelen. Er wordt niets gemeten en niets vastgelegd — er
 * springt een kader om een element en de pagina scrolt ernaartoe. Een selector die niets
 * vindt is dan ook geen fout in het oordeel maar een verouderde verwijzing; dat staat er zo
 * bij.
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

  const selector = String(body.selector ?? '').trim();
  if (!selector) {
    return NextResponse.json({ ok: false, error: 'Geen selector' }, { status: 400 });
  }
  // Een selector is een leesactie in de pagina die al openstaat; er wordt niets uitgevoerd.
  // De lengtegrens houdt een ongeluk klein — geen veiligheidsmaatregel maar een zeef.
  if (selector.length > 300) {
    return NextResponse.json({ ok: false, error: 'Selector te lang' }, { status: 400 });
  }

  /**
   * Waarom dit element is aangewezen — de bevinding die erover gaat.
   *
   * Komt op het element te staan, zodat een klik erop de bevinding laat zien — beschrijving
   * én advies, want wie kijkt naar wat er mis is wil ook weten wat eraan moet gebeuren. Ruim
   * bemeten, maar wel begrensd: het is een attribuut in een pagina, geen opslagplaats.
   */
  const waarom = String(body.waarom ?? '').trim().slice(0, 4000) || null;

  const gevonden = await sessie.page
    .evaluate(
      ({ sel, waarom }: { sel: string; waarom: string | null }) => {
      let treffers: Element[];
      try {
        treffers = Array.from(document.querySelectorAll(sel));
      } catch {
        return { fout: 'ongeldig' as const };
      }
      if (!treffers.length) return { fout: 'niets' as const };

      // Alles wat eerder werd aangewezen weer normaal, anders bouwt het zich op — en dan
      // krijgt de vorige bevinding nog steeds een kader en zijn uitleg.
      document.querySelectorAll('[data-shift2-aangewezen]').forEach((ander) => {
        const a = ander as HTMLElement;
        a.style.removeProperty('outline');
        a.style.removeProperty('outline-offset');
        a.removeAttribute('data-shift2-aangewezen');
        a.removeAttribute('data-shift2-waarom');
        a.removeAttribute('data-shift2-markering');
      });

      // Geen animatie: een lopende overgang wint van alles in de cascade, en dan legt de
      // opname de beginwaarde vast in plaats van het kader. Zelfde reden als bij oplichten.
      for (const el of treffers as HTMLElement[]) {
        el.style.setProperty('transition', 'none', 'important');
        el.style.setProperty('outline', '5px solid #1d4ed8', 'important');
        el.style.setProperty('outline-offset', '4px', 'important');
        el.setAttribute('data-shift2-aangewezen', '1');
        // Dezelfde attributen als de markering zet, zodat een klik op dit element het juiste
        // antwoord geeft. Zonder deze twee zegt het paneel "over dit element is niets
        // gemeld" terwijl je er via de bevinding naartoe bent gestuurd — het lelijkste
        // antwoord dat er is: het spreekt de kaart tegen waar je net vandaan komt.
        if (waarom) el.setAttribute('data-shift2-waarom', waarom);
        // De randopmaak als waarde, want andere routes lezen dit attribuut ALS CSS: het
        // oplichten valt erop terug en het klikken zet het ermee terug. Zou hier een woord
        // staan, dan verdween het kader bij de eerste klik.
        el.setAttribute('data-shift2-markering', '5px solid #1d4ed8');

        /**
         * Ook de link of knop eromheen.
         *
         * Een klik landt op het bedienbare element, niet op de afbeelding erbinnen, en het
         * paneel zoekt met `closest()` omhoog — dus van de `<a>` komt het nooit bij de
         * `<img>`. Zonder deze regel klik je op het aangewezen logo en krijg je "over dit
         * element is niets gemeld", terwijl je er via de bevinding naartoe bent gestuurd.
         *
         * Geen kader eromheen: dat zou een tweede rand geven om iets groters dan wat de
         * bevinding aanwijst. Alleen de uitleg.
         */
        const bedienbaar = el.closest('a, button, [role="link"], [role="button"]') as HTMLElement | null;
        if (bedienbaar && bedienbaar !== el && waarom) {
          if (!bedienbaar.hasAttribute('data-shift2-waarom')) {
            bedienbaar.setAttribute('data-shift2-waarom', waarom);
            bedienbaar.setAttribute('data-shift2-aangewezen', '1');
          }
        }
      }

      const eerste = treffers[0] as HTMLElement;
      eerste.scrollIntoView({ block: 'center', inline: 'center' });
      const r = eerste.getBoundingClientRect();

      return {
        aantal: treffers.length,
        naam: (eerste.getAttribute('aria-label') || eerste.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60),
        element: eerste.tagName.toLowerCase(),
        inBeeld: r.top >= 0 && r.bottom <= window.innerHeight,
      };
      },
      { sel: selector, waarom },
    )
    .catch(() => null);

  if (!gevonden) {
    return NextResponse.json({ ok: false, error: 'De pagina reageerde niet.' }, { status: 500 });
  }
  if ('fout' in gevonden) {
    return NextResponse.json(
      {
        ok: false,
        error:
          gevonden.fout === 'ongeldig'
            ? `"${selector}" is geen geldige selector.`
            : `"${selector}" komt niet voor op deze pagina. De site kan veranderd zijn sinds het oordeel, of de verwijzing klopt niet.`,
      },
      { status: 404 }
    );
  }

  await verversBeeld(String(body.sessie));

  return NextResponse.json({ ok: true, ...gevonden });
}
