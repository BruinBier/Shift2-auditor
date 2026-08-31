import { NextRequest, NextResponse } from 'next/server';
import { bestaandeSessie, verversBeeld } from '@/lib/schermsessie';

/**
 * Muis en toetsenbord van het paneel naar de browser erachter.
 *
 * Dit is het deel dat een opname niet kan. Tab indrukken en zien waar de focus heen springt,
 * een uitklapmenu openen, een formulier invullen — dat is precies wat je bij 2.1.1, 2.1.2 en
 * 2.4.7 moet doen en wat op een stilstaand beeld niet te beoordelen is.
 *
 * Wat er binnenkomt wordt niet doorgegeven zoals het komt: alleen de handelingen hieronder,
 * met getallen die binnen het venster vallen. Een route die willekeurige CDP-opdrachten
 * doorgeeft is een route waarmee je de browser op deze machine kunt besturen.
 */

export const dynamic = 'force-dynamic';

const KNOPPEN = new Set(['left', 'middle', 'right', 'none']);

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

  const getal = (v: unknown, max: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, Math.round(n)));
  };

  try {
    if (body.soort === 'inspecteer') {
      // Kijken zonder te bedienen. Er wordt géén muisgebeurtenis doorgestuurd: een klik op
      // een link zou de pagina verlaten, en dan ben je je markering kwijt en sta je ergens
      // anders dan waar je aan het beoordelen was.
      const uit = await sessie.page.evaluate(
        (x: number, y: number, kiezen: boolean) => {
          const raak = document.elementFromPoint(x, y) as HTMLElement | null;
          if (!raak) return null;
          // Het element eromheen dat er werkelijk toe doet, want je klikt vaak op een icoon
          // of een span binnen een link.
          //
          // De volgorde is het punt. Eerst kijken of er een gemeten element in de buurt is:
          // dát is waar de uitspraak over gaat. Pas daarna naar een bedienbaar element.
          //
          // `[role]` mag NIET in die tweede zoekopdracht staan. Het icoon in een
          // sociale-media-link is een `<span role="img">`, en met `[role]` erin stopt de klim
          // daar: je klikt op een link die rood omrand staat en krijgt te horen dat er niets
          // over gemeld is. Alleen rollen die een bedieningselement aanduiden tellen mee.
          const el = (raak.closest('[data-shift2-markering]') ||
            raak.closest(
              'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="radio"]'
            ) ||
            raak) as HTMLElement;

          document.querySelectorAll('[data-shift2-aangeklikt]').forEach((a) => {
            const b = a as HTMLElement;
            const terug = b.getAttribute('data-shift2-markering') || '';
            if (terug) b.style.setProperty('outline', terug, 'important');
            else b.style.removeProperty('outline');
            b.removeAttribute('data-shift2-aangeklikt');
          });
          el.style.setProperty('transition', 'none', 'important');
          el.setAttribute('data-shift2-aangeklikt', '1');

          // In of uit de selectie. Paars en dik, zodat je in één blik ziet wat er straks in
          // de bevinding komt -- ook als je er zes bij elkaar zoekt die verspreid staan.
          let staatErin = false;
          if (kiezen) {
            staatErin = !el.hasAttribute('data-shift2-gekozen');
            if (staatErin) el.setAttribute('data-shift2-gekozen', '1');
            else el.removeAttribute('data-shift2-gekozen');
          } else {
            staatErin = el.hasAttribute('data-shift2-gekozen');
          }
          if (staatErin) {
            el.style.setProperty('outline', '4px solid #7e22ce', 'important');
            el.style.setProperty('outline-offset', '3px', 'important');
          } else {
            el.style.setProperty('outline', '4px solid #f59e0b', 'important');
            el.style.setProperty('outline-offset', '3px', 'important');
          }

          const naam =
            el.getAttribute('aria-label') ||
            (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) ||
            el.getAttribute('title') ||
            el.getAttribute('alt') ||
            '';
          return {
            element: el.tagName.toLowerCase(),
            rol: el.getAttribute('role'),
            naam,
            href: el.getAttribute('href'),
            waarom: el.getAttribute('data-shift2-waarom') || null,
            gemarkeerd: el.hasAttribute('data-shift2-markering'),
            gekozen: staatErin,
          };
        },
        getal(body.x, 4000),
        getal(body.y, 4000),
        body.kiezen === true
      );
      await verversBeeld(String(body.sessie));
      return NextResponse.json({ ok: true, aangeklikt: uit });
    }

    if (body.soort === 'muis') {
      const type =
        body.type === 'mousePressed'
          ? 'mousePressed'
          : body.type === 'mouseReleased'
          ? 'mouseReleased'
          : 'mouseMoved';
      await sessie.cdp.send('Input.dispatchMouseEvent', {
        type,
        x: getal(body.x, 4000),
        y: getal(body.y, 4000),
        button: KNOPPEN.has(body.knop) ? body.knop : 'left',
        clickCount: type === 'mouseMoved' ? 0 : 1,
      });
    } else if (body.soort === 'scroll') {
      await sessie.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: getal(body.x, 4000),
        y: getal(body.y, 4000),
        deltaX: Math.max(-2000, Math.min(2000, Number(body.deltaX) || 0)),
        deltaY: Math.max(-2000, Math.min(2000, Number(body.deltaY) || 0)),
      });
    } else if (body.soort === 'toets') {
      // De toets zoals de browser hem kent. `text` alleen bij een teken dat je werkelijk
      // typt; bij Tab of Escape hoort daar niets te staan, anders belandt er een teken in
      // het veld.
      const neer = body.type === 'keyUp' ? 'keyUp' : 'keyDown';
      const tekst = typeof body.tekst === 'string' ? body.tekst.slice(0, 4) : '';
      await sessie.cdp.send('Input.dispatchKeyEvent', {
        type: neer === 'keyDown' && tekst ? 'keyDown' : neer === 'keyDown' ? 'rawKeyDown' : 'keyUp',
        key: String(body.key ?? '').slice(0, 32),
        code: String(body.code ?? '').slice(0, 32),
        windowsVirtualKeyCode: Number(body.keyCode) || 0,
        nativeVirtualKeyCode: Number(body.keyCode) || 0,
        ...(tekst ? { text: tekst, unmodifiedText: tekst } : {}),
        modifiers:
          (body.alt ? 1 : 0) | (body.ctrl ? 2 : 0) | (body.meta ? 4 : 0) | (body.shift ? 8 : 0),
      });
    } else {
      return NextResponse.json({ ok: false, error: 'Onbekende handeling' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }

  // Na een handeling een vers beeld sturen. Niet elke klik levert een hertekening op die
  // groot genoeg is voor de stroom, en dan lijkt het alsof de klik niet aankwam.
  //
  // Bij het loslaten van de muis pas ná een pauze: een klik op een link, een uitklapmenu of
  // een tabblad heeft tijd nodig voordat er iets te zien is. Meteen verversen levert het
  // oude beeld op. Muisbewegingen krijgen die pauze niet -- die komen met tientallen tegelijk.
  if (body.soort === 'muis' && body.type === 'mouseMoved') {
    verversBeeld(String(body.sessie)).catch(() => {});
  } else {
    const wacht = body.soort === 'muis' ? 700 : 120;
    setTimeout(() => verversBeeld(String(body.sessie)).catch(() => {}), wacht);
    verversBeeld(String(body.sessie)).catch(() => {});
  }

  // Bij een muisbeweging teruggeven welke aanwijzer daar hoort. Zo staat er in het paneel
  // een handje boven een link en een tekstcursor boven een invoerveld, net als in een gewone
  // browser -- in plaats van overal hetzelfde kruisje, dat suggereert dat je iets moet
  // aanwijzen in plaats van bedienen.
  let cursor: string | null = null;
  if (body.soort === 'muis' && body.type === 'mouseMoved') {
    cursor = await sessie.page
      .evaluate(
        (x: number, y: number) => {
          const el = document.elementFromPoint(x, y) as HTMLElement | null;
          if (!el) return 'default';
          const c = getComputedStyle(el).cursor;
          return c && c !== 'auto' ? c : 'default';
        },
        getal(body.x, 4000),
        getal(body.y, 4000)
      )
      .catch(() => null);
  }

  return NextResponse.json({ ok: true, ...(cursor ? { cursor } : {}) });
}

/**
 * Wat er ná de handeling op de pagina staat: het adres, en waar de focus is.
 *
 * De focus is hier het punt. Bij een screencast zie je een omranding bewegen, maar niet
 * wélk element focus heeft en hoe het wordt aangekondigd. Dat is bij 2.4.7 en 4.1.2 juist
 * de vraag, en het is met een tekstregel ernaast in één oogopslag te volgen.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sessie = bestaandeSessie(request.nextUrl.searchParams.get('sessie') ?? '');
  if (!sessie) return NextResponse.json({ ok: false, error: 'Geen browser open' }, { status: 404 });

  // Even wachten voor we de focusring uitlezen. Een lopende CSS-overgang wint van alles in
  // de cascade, en dan meet je de beginwaarde: nul. Zonder deze pauze meldde dit "GEEN
  // zichtbare omranding" op elementen die wél een ring krijgen — een valse 2.4.7-afkeuring
  // uit het gereedschap zelf.
  await new Promise((r) => setTimeout(r, 300));

  const stand = await sessie.page
    .evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return { url: location.href, focus: null };
      const naam =
        el.getAttribute('aria-label') ||
        (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) ||
        el.getAttribute('title') ||
        '';
      // De link waar de focus in zit, ook als de focus op een span erbinnen staat.
      const anker = el.closest('[data-shift2-waarom], [data-shift2-markering]') as HTMLElement | null;
      const st0 = getComputedStyle(el);
      const onzeRand = anker?.getAttribute('data-shift2-markering') || '';
      const huidigeRand =
        st0.outlineWidth + ' ' + st0.outlineStyle + ' ' + st0.outlineColor;
      return {
        url: location.href,
        focus: {
          element: el.tagName.toLowerCase(),
          rol: el.getAttribute('role'),
          naam,
          // Wat er mis is met dit element, uit de meting die het markeerde. Leeg betekent:
          // er is niets over dit element gemeld, of er is nog niet gemarkeerd.
          waarom: anker?.getAttribute('data-shift2-waarom') || null,
          // Is dit element door de meting langsgelopen? Zonder dat onderscheid lijkt
          // "niets gemeld" hetzelfde als "nog niet gemeten", en dat is het verschil tussen
          // goedgekeurd en onbekeken.
          gemarkeerd: !!anker,
          // Kijk je naar de focusring van de site, of naar onze markering? Zonder dit
          // onderscheid beoordeel je 2.4.7 op een rand die wij eroverheen hebben gelegd.
          isOnzeMarkering:
            !!onzeRand && huidigeRand.replace(/\s+/g, ' ').includes(onzeRand.split(' ')[1]),
          // Wat de opmaak doet, niet een oordeel. Een focusring is lang niet altijd een
          // outline: box-shadow wordt er net zo vaak voor gebruikt, en alleen op outline
          // kijken keurt af wat gewoon zichtbaar is.
          ring: (() => {
            const st = getComputedStyle(el);
            const dik = parseFloat(st.outlineWidth || '0') || 0;
            if (st.outlineStyle !== 'none' && dik > 0)
              return 'outline ' + st.outlineWidth + ' ' + st.outlineStyle + ' ' + st.outlineColor;
            if (st.boxShadow && st.boxShadow !== 'none')
              return 'box-shadow ' + st.boxShadow.slice(0, 60);
            return null;
          })(),
        },
      };
    })
    .catch(() => null);

  return NextResponse.json({ ok: true, stand });
}
