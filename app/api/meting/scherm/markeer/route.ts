import { NextRequest, NextResponse } from 'next/server';
import { bestaandeSessie, verversBeeld } from '@/lib/schermsessie';
import { draaiMeting } from '@/lib/meting-draaien';

/**
 * Kaders om de links in de levende weergave, op basis van de meting zelf.
 *
 * NIET DOOR DE REGEL NA TE BOUWEN. De volgorde waarin een toegankelijke naam ontstaat —
 * `aria-labelledby`, dan `aria-label`, dan de tekst zonder wat op `aria-hidden` staat, dan
 * `title` — staat in `get-links` en hoort daar te blijven staan. Zou dit paneel die
 * berekening overdoen, dan bestaat dezelfde regel op twee plekken, en dan is het een kwestie
 * van tijd tot er één wordt bijgewerkt. Precies zo ging het mis met de logolink op
 * heuvelrug.nl: de regel stond in twee bestanden, één was verouderd, en wie die las keurde
 * het logo van elke gemeentesite af.
 *
 * Deze route draait daarom het echte commando en zet de kaders op wat dáár uitkomt. Wat je
 * in het paneel ziet is dus geen tweede lezing maar dezelfde meting.
 *
 * Wat het kost: twintig seconden, want het commando opent zijn eigen browser. Daarom een
 * knop en niet iets dat vanzelf gebeurt.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

  // De pagina zoals hij nú in het paneel staat. Heeft de onderzoeker doorgeklikt, dan wordt
  // die pagina gemeten en niet de pagina waarmee hij begon.
  const huidigeUrl: string = await sessie.page.evaluate(() => location.href).catch(() => sessie.url);

  const gemeten = await draaiMeting('get-links', huidigeUrl, { scope: 'pagina' });
  if (!gemeten.ok) {
    return NextResponse.json({ ok: false, error: gemeten.error }, { status: 500 });
  }

  const antwoord: any = gemeten.antwoord ?? {};
  const opvallend: any[] = Array.isArray(antwoord.opvallend) ? antwoord.opvallend : [];
  const andereRol: any[] = Array.isArray(antwoord.ankers_met_een_andere_rol)
    ? antwoord.ankers_met_een_andere_rol
    : [];

/**
 * De melding uit de meting, uitgeschreven tot wat er mis is.
 *
 * `get-links` levert korte codes -- "alleen de platformnaam". Dat is genoeg voor een lijst,
 * maar niet voor iemand die aan het tabben is en wil weten wat hij ziet. De zin hieronder
 * zegt wat er mis is, met de gemeten naam en bestemming erin, en onder welk criterium het
 * valt. Er wordt niets opnieuw beoordeeld: de code komt uit de meting, alleen de formulering
 * gebeurt hier.
 */
function foutInWoorden(l: any): string {
  const naam = (l.naam || '').trim();
  const href = (l.href || '').trim();
  const redenen: string[] = Array.isArray(l.waarom) ? l.waarom : [];
  const zinnen: string[] = [];

  for (const r of redenen) {
    if (r === 'geen naam')
      zinnen.push(
        `Deze link heeft geen enkele toegankelijke naam. Een schermlezer kondigt hem aan als "link" en zegt er niet bij waarheen. Afkeuring onder 2.4.4, en een aparte bevinding onder 4.1.2.`
      );
    else if (r === 'alleen de platformnaam')
      zinnen.push(
        `De toegankelijke naam is alleen "${naam}" terwijl de link naar ${href} gaat — de pagina van de organisatie zelf. Een schermlezer leest "link, ${naam}" voor, en daaruit blijkt niet van wie die pagina is. Afkeuring onder 2.4.4 (impact klein, redacteur). Advies: vul de naam aan met de organisatie.`
      );
    else if (r.startsWith('naam komt alleen uit title'))
      zinnen.push(
        `De naam "${naam}" komt uitsluitend uit het title-attribuut. Dat is niet automatisch fout: de vraag is of die naam de bestemming dekt (${href}).`
      );
    else if (r === 'noemt alleen het linktype')
      zinnen.push(
        `De naam "${naam}" noemt alleen het soort link en niet waar hij heen gaat. Dat is geen naam voor de link. Afkeuring onder 2.4.4.`
      );
    else if (r === 'generieke tekst zonder context')
      zinnen.push(
        `De naam "${naam}" is generiek, en er staat geen verduidelijkende tekst in hetzelfde element of in de tabelkoppen van de cel. Een kop erboven telt niet mee. Afkeuring onder 2.4.4.`
      );
    else if (r.startsWith('tekst belooft een ander doel'))
      zinnen.push(
        `De naam "${naam}" belooft iets anders dan waar de link heen gaat (${href}). Wie erop klikt komt ergens uit dat hij niet verwacht. Afkeuring onder 2.4.4 (impact matig, redacteur).`
      );
    else if (r === 'naam noemt een ander platform')
      zinnen.push(
        `De naam "${naam}" noemt een ander platform dan de bestemming (${href}). Naam en logo lopen uit elkaar; dat is een opmerking onder 2.4.4, geen afkeuring.`
      );
    else if (r === 'webadres als naam')
      zinnen.push(`De naam is een webadres. Voorgelezen levert dat geen bruikbare aankondiging op. Afkeuring onder 2.4.4.`);
    else if (r.startsWith('title zegt homepage'))
      zinnen.push(
        `De title belooft de homepage, maar dit is een subsite: de bezoeker denkt naar de hoofdsite te gaan. Afkeuring onder 2.4.4.`
      );
    else zinnen.push(r);
  }
  return zinnen.join(' ');
}

  // De fouttekst wordt HIER gemaakt, niet in de pagina: foutInWoorden bestaat in Node en
  // niet in de browser. Die aanroep stond eerst binnen de evaluate, en dan valt het hele
  // markeren stil op een ReferenceError -- de meting draaide, maar er kwam geen enkel kader.
  const opvallendMetTekst = opvallend.map((l: any) => ({ ...l, foutTekst: foutInWoorden(l) }));

  const aantal = await sessie.page
    .evaluate(
      (rood: any[], grijs: any[]) => {
        const oud = document.getElementById('shift2-kaders');
        if (oud) oud.remove();

        // Een link uit de meting terugvinden op de pagina: op de bestemming, en bij meerdere
        // links naar hetzelfde adres op de naam erbij. Beide komen uit de meting, dus hier
        // wordt niets opnieuw uitgerekend.
        const sleutel = (href: string, naam: string) =>
          (href || '').trim() + '||' + (naam || '').replace(/\s+/g, ' ').trim().toLowerCase();
        // De reden komt uit de meting mee en wordt op het element bewaard, zodat de
        // focusmelding hem straks kan oplezen zonder iets opnieuw uit te rekenen.
        const redenPer = new Map<string, string>();
        for (const l of rood) {
          const w = l.foutTekst || '';
          if (w) {
            redenPer.set(sleutel(l.href, l.naam), w);
            if (!redenPer.has((l.href || '').trim())) redenPer.set((l.href || '').trim(), w);
          }
        }
        const roodSet = new Set(rood.map((l) => sleutel(l.href, l.naam)));
        const grijsSet = new Set(grijs.map((l) => sleutel(l.href, l.naam)));
        const roodHref = new Set(rood.map((l) => (l.href || '').trim()));
        const grijsHref = new Set(grijs.map((l) => (l.href || '').trim()));

        const laag = document.createElement('div');
        laag.id = 'shift2-kaders';
        laag.setAttribute(
          'style',
          'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none;'
        );

        let n = 0;
        // De lijst die in het paneel komt te staan. Elk element krijgt een nummer, zodat een
        // klik op een regel het juiste kader kan laten oplichten -- dat scheelt zoeken op een
        // pagina van vijfduizend pixels hoog.
        const items: any[] = [];
        const ankers = Array.from(document.querySelectorAll('a'));
        for (const a of ankers) {
          const st = getComputedStyle(a);
          if (st.display === 'none' || st.visibility === 'hidden') continue;
          if (a.getAttribute('aria-hidden') === 'true') continue;
          const r = a.getBoundingClientRect();
          if (!r.width || !r.height) continue;

          const href = (a.getAttribute('href') || '').trim();
          const tekst = (a.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
          const s = sleutel(href, tekst);

          // Eerst op naam én bestemming; dan alleen op bestemming, want de zichtbare tekst
          // is niet altijd de toegankelijke naam -- en dat verschil is nou juist het punt
          // van dit criterium.
          const isGrijs = grijsSet.has(s) || grijsHref.has(href) || !!a.getAttribute('role');
          const isRood = !isGrijs && (roodSet.has(s) || roodHref.has(href));
          const kleur = isGrijs ? '#5a5a5a' : isRood ? '#d40000' : '#0a7c2f';

          // Eerst de overgang uit. Een lopende CSS-transitie wint van alles, ook van
          // !important: heuvelrug.nl laat de outline ingroeien vanaf nul, en dan staat de
          // inline stijl er wél maar meet je 0px en zie je niets. Dat kostte een half uur
          // zoeken naar een specificiteitsprobleem dat er niet was.
          (a as HTMLElement).style.setProperty('transition', 'none', 'important');
          // Met !important, want de site zet de outline zelf op nul. Op heuvelrug.nl geldt
          // dat voor de hele hoofdnavigatie: die kreeg wél de opdracht maar bleef onzichtbaar,
          // en dan lijkt het alsof het markeren niet werkt terwijl het gewoon overschreven is.
          (a as HTMLElement).style.setProperty(
            'outline',
            '2px ' + (isGrijs ? 'dashed' : 'solid') + ' ' + kleur,
            'important'
          );
          (a as HTMLElement).style.setProperty('outline-offset', '2px', 'important');
          // Wat we erop gezet hebben, en waarom het opvalt. Het eerste is nodig om onze eigen
          // markering later te kunnen onderscheiden van de focusring van de site; zonder dat
          // zou je 2.4.7 beoordelen op een rand die wij eroverheen hebben gelegd.
          a.setAttribute(
            'data-shift2-markering',
            '2px ' + (isGrijs ? 'dashed' : 'solid') + ' ' + kleur
          );
          const reden = isGrijs
            ? 'draagt een andere rol dan link — valt buiten 2.4.4, hoort onder 4.1.2'
            : redenPer.get(s) || redenPer.get(href) || '';
          if (reden) a.setAttribute('data-shift2-waarom', reden);
          else a.removeAttribute('data-shift2-waarom');
          a.setAttribute('data-shift2-nr', String(n));
          if (isGrijs || isRood)
            items.push({
              nr: n,
              kleur: isGrijs ? 'rol' : 'op',
              naam: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) || '(geen tekst)',
              waarom: reden,
            });
          n++;
        }
        // Wat buiten de meting viel. get-links loopt de <a>-elementen af; knoppen,
        // elementen met een linkrol en alles in een ingesloten kader komen er niet in voor.
        // Zonder een eigen kleur daarvoor lijkt een pagina volledig nagelopen terwijl er
        // bedieningselementen buiten zijn gebleven -- en dat is precies het gat waar een
        // onderzoek in valt.
        let buiten = 0;
        const nietMee = Array.from(
          document.querySelectorAll('button, [role="link"], [role="button"], summary, iframe, input[type="submit"], input[type="button"]')
        );
        for (const e of nietMee) {
          const el = e as HTMLElement;
          if (el.closest('a')) continue;
          const st = getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          el.style.setProperty('transition', 'none', 'important');
          el.style.setProperty('outline', '2px dotted #1d4ed8', 'important');
          el.style.setProperty('outline-offset', '2px', 'important');
          el.setAttribute('data-shift2-markering', '2px dotted #1d4ed8');
          el.setAttribute(
            'data-shift2-waarom',
            'NIET MEEGENOMEN in de meting van 2.4.4. get-links beoordeelt de <a>-elementen; dit is een ' +
              el.tagName.toLowerCase() +
              (el.getAttribute('role') ? ' met role="' + el.getAttribute('role') + '"' : '') +
              '. Wil je hierover een uitspraak, dan hoort die onder 4.1.2 of 2.5.3.'
          );
          el.setAttribute('data-shift2-nr', String(n + buiten));
          items.push({
            nr: n + buiten,
            kleur: 'buiten',
            naam:
              (el.getAttribute('aria-label') || el.textContent || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 60) || ('<' + el.tagName.toLowerCase() + '>'),
            waarom: el.getAttribute('data-shift2-waarom') || '',
          });
          buiten++;
        }
        (window as any).__shift2Buiten = buiten;
        document.body.appendChild(laag);
        // Terugmelden wat de browser er ná het zetten werkelijk van maakt. Een stijl die
        // gezet is maar wegvalt tegen een overgang of een sterkere regel, is niet te zien
        // aan het aantal -- alleen aan de berekende waarde.
        const steekproef = ankers.slice(0, 4).map((a) => {
          const cs = getComputedStyle(a);
          return {
            tekst: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22),
            berekend: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
          };
        });
        return { n, buiten, steekproef, items };
      },
      opvallendMetTekst,
      andereRol
    )
    .catch(() => ({ n: 0, buiten: 0, steekproef: [], items: [] }));

  await verversBeeld(String(body.sessie));

  return NextResponse.json({
    ok: true,
    gemarkeerd: (aantal as any).n ?? 0,
    buitenDeMeting: (aantal as any).buiten ?? 0,
    items: (aantal as any).items ?? [],
    steekproef: (aantal as any).steekproef ?? [],
    telling: antwoord.telling ?? null,
    opvallend: opvallend.length,
    andereRol: andereRol.length,
    url: huidigeUrl,
  });
}
