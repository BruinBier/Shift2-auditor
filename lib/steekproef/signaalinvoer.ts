import * as cheerio from 'cheerio';

/**
 * De invoer voor semantische vragen (steekproefselectie v2, fase 4): pure functies van
 * opgehaalde HTML naar precies de velden die een vraag nodig heeft.
 *
 * Zo weinig mogelijk, en altijd hetzelfde: de contentHash is de hash van deze invoer, dus
 * alles wat hier in komt en per ophaalbeurt verschilt (een datum, een sessie-id) maakt de
 * cache onbruikbaar. Daarom: alleen de hoofdinhoud, witruimte genormaliseerd, vaste
 * maxima, en geen tijdgevoelige velden.
 */

const MAX_TEKST = 700;
const REDACTIONEEL = '.text-container, [class*="paragraphText"], [class*="rich-text"], [class*="wysiwyg"], figure';

const schoon = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Tekst van een element met een spatie tussen blokken (cheerio plakt alinea's aan elkaar). */
function tekstMetSpaties($: cheerio.CheerioAPI, el: any): string {
  const kopie = $(el).clone();
  kopie.find('p, div, li, br, h1, h2, h3, h4, h5, h6, td, th, section, article, header, footer, dt, dd, figcaption').append(' ');
  return schoon(kopie.text());
}

/** Toestemmingsschermen en voorleesknoppen zijn geen inhoud van de pagina. */
const GEEN_INHOUD = '[class*="onsentScreen"], [class*="CookieConsent"], [class*="rsbtn"], [class*="readspeaker"]';

export interface Paginainvoer {
  titel: string;
  pad: string;
  koppen: string[];
  tekstBegin: string;
  actielinks: { tekst: string; doel: string }[];
}

export function leesPaginainvoer(html: string, url: string): Paginainvoer {
  const $ = cheerio.load(html);
  const main = $('main').first().length ? $('main').first() : $('#main-content').first().length ? $('#main-content').first() : $('body');
  main.find(`script, style, noscript, nav, [role=search], form[role=search], ${GEEN_INHOUD}`).remove();
  const titel = schoon($('title').first().text()).replace(/\s+[|–—·-]\s+[^|–—·-]+$/, '');
  const koppen = main
    .find('h1, h2, h3')
    .toArray()
    .map((h) => `${(h as any).tagName}: ${schoon($(h).text())}`)
    .filter((k) => k.length > 4)
    .slice(0, 12);
  const tekstBegin = tekstMetSpaties($, main).slice(0, MAX_TEKST);
  // Links die naar een handeling lijken te wijzen: op de tekst of op het doel. Dit is invoer
  // voor de vraag, geen oordeel: de classifier beslist.
  const actie = /(aanvra|aanmeld|melden|meld |regel|doorgeven|afspraak|reserv|inschrijv|start|invullen|formulier|digid|bestel|betaal|indienen|bezwaar)/i;
  const actielinks: Paginainvoer['actielinks'] = [];
  const gezien = new Set<string>();
  main.find('a[href], button').each((_, a) => {
    const tekst = schoon($(a).text()).slice(0, 80);
    const href = $(a).attr('href') || '';
    let doel = '';
    try {
      const u = new URL(href, url);
      doel = u.hostname === new URL(url).hostname ? u.pathname : u.hostname + u.pathname.split('/').slice(0, 2).join('/');
    } catch {
      doel = '';
    }
    if (!tekst && !doel) return;
    if (!(actie.test(tekst) || /\/form\/|loket|iburgerzaken|mijnafspraak|eloket|buitenbeter|digid/i.test(doel))) return;
    const sleutel = `${tekst}|${doel}`;
    if (gezien.has(sleutel) || actielinks.length >= 12) return;
    gezien.add(sleutel);
    actielinks.push({ tekst, doel });
  });
  return { titel, pad: new URL(url).pathname, koppen, tekstBegin, actielinks };
}

/** Tekst rond de video's: de alinea's direct voor en na een videocontainer of embed. */
export function leesTekstRondVideo(html: string): string {
  const $ = cheerio.load(html);
  const main = $('main').first();
  main.find(GEEN_INHOUD).remove();
  const stukken: string[] = [];

  // SIMsite zet een ingesloten video pas in de browser neer; in de opgehaalde HTML staat hij
  // alleen als <iframe> in de tekst-HTML binnen __NEXT_DATA__. Daar lezen we de kop en de
  // alinea's eromheen.
  const ruw = $('script#__NEXT_DATA__').html();
  if (ruw) {
    const fragmenten: string[] = [];
    const loop = (v: unknown) => {
      if (typeof v === 'string') {
        if (/<(iframe|oembed)/i.test(v)) fragmenten.push(v);
      } else if (Array.isArray(v)) v.forEach(loop);
      else if (v && typeof v === 'object') Object.values(v).forEach(loop);
    };
    try {
      loop(JSON.parse(ruw)?.props?.pageProps?.contentDetails);
    } catch {
      /* geen bruikbare data */
    }
    for (const f of fragmenten) {
      const $f = cheerio.load(`<div id="f">${f}</div>`);
      $f('iframe, oembed').each((_, v) => {
        let blok = $f(v);
        while (blok.parent().length && blok.parent().attr('id') !== 'f') blok = blok.parent();
        const voor = [blok.prev().prev(), blok.prev()].map((x) => schoon(x.text())).filter(Boolean).join(' ');
        const na = schoon(blok.next().text());
        const s = `${voor.slice(-300)} [VIDEO] ${na.slice(0, 200)}`.trim();
        if (s.length > 10 && !stukken.includes(s)) stukken.push(s);
      });
    }
  }
  const videos = main.find('[class*="VideoContainer"], iframe, video').toArray();
  for (const v of videos) {
    // Omhoog tot er tekst naast de video staat: de kop of alinea die hem inleidt.
    let ouder = $(v).parent();
    let tekst = '';
    for (let i = 0; i < 4 && ouder.length; i++) {
      const kopie = ouder.clone();
      kopie.find('[class*="VideoContainer"], iframe, video').replaceWith(' [VIDEO] ');
      tekst = tekstMetSpaties($, kopie);
      if (tekst.replace('[VIDEO]', '').trim().length > 40) break;
      ouder = ouder.parent();
    }
    const s = tekst.slice(0, 400);
    if (s && !stukken.includes(s)) stukken.push(s);
  }
  return stukken.slice(0, 3).join(' … ').slice(0, 900);
}

export interface Afbeeldingkandidaat {
  src: string;
  alt: string | null;
  onderschrift: string | null;
  tekstRond: string;
  afmetingen: string | null;
}

/**
 * Redactionele afbeeldingen: in een tekstveld of een figure, niet het logo, geen iconen,
 * geen afbeelding in een kaartje of link. Die zijn voor de beeldvraag.
 */
export function leesAfbeeldingen(html: string, url: string, max = 3): Afbeeldingkandidaat[] {
  const $ = cheerio.load(html);
  const main = $('main').first();
  const uit: Afbeeldingkandidaat[] = [];
  const gezien = new Set<string>();
  main.find('img').each((_, i) => {
    if (uit.length >= max) return;
    const img = $(i);
    // In een inhoudscomponent (tekstveld, figure, afbeeldings- of kolomcomponent), niet in een
    // hero, een nieuwsoverzicht, tegels of kaartjes.
    if (!img.closest(`${REDACTIONEEL}, [class*="ParagraphImage"], [class*="paragraphImage"], [class*="ColumnImage"], [class*="embedded-entity"], [class*="paragraph"]`).length) return;
    if (img.closest('header, [class*="Hero"], [class*="hero"], [class*="ContentList"], [class*="LatestNews"], [class*="BoxLink"], [class*="Teaser"], [class*="teaser"], [class*="card"]').length) return;
    // Een afbeelding in een link doet iets anders -- behalve een link naar de afbeelding zelf
    // (vergroten), zoals bij de situatieschets op heuvelrug.nl/bomen-kappen.
    const link = img.closest('a[href]');
    if (link.length && !/\.(jpe?g|png|gif|webp|svg)(\?|$)|\/media\//i.test(link.attr('href') || '')) return;
    const klasse = `${img.attr('class') || ''} ${img.attr('src') || ''} ${img.attr('alt') || ''}`;
    if (/logo|icon|icoon|avatar/i.test(klasse)) return;
    const b = Number(img.attr('width') || 0);
    const h = Number(img.attr('height') || 0);
    if ((b && b < 80) || (h && h < 80)) return;
    // De grootste variant uit srcset als die er is: beter te beoordelen.
    let src = img.attr('src') || '';
    const set = img.attr('srcset') || img.closest('picture').find('source').attr('srcset') || '';
    if (set) {
      const kandidaten = set.split(',').map((s) => s.trim().split(/\s+/));
      const grootste = kandidaten.sort((x, y) => parseInt(y[1] || '0') - parseInt(x[1] || '0'))[0];
      if (grootste?.[0]) src = grootste[0];
    }
    try {
      src = new URL(src, url).toString();
    } catch {
      return;
    }
    const sleutel = src.split('?')[0];
    if (gezien.has(sleutel)) return;
    gezien.add(sleutel);
    const fig = img.closest('figure');
    const blok = img.closest('p, div, figure').first();
    uit.push({
      src,
      alt: img.attr('alt') ?? null,
      onderschrift: fig.length ? schoon(fig.find('figcaption').text()) || null : null,
      tekstRond: schoon(`${schoon(blok.prev().text()).slice(-200)} [AFBEELDING] ${schoon(blok.next().text()).slice(0, 200)}`),
      afmetingen: b && h ? `${b}×${h}` : null,
    });
  });
  return uit;
}

/** Korte samenvatting van een pagina voor de clustervraag: titel, pad, koppen, begin. */
export function paginaSamenvatting(html: string, url: string) {
  const p = leesPaginainvoer(html, url);
  return { titel: p.titel, pad: p.pad, koppen: p.koppen.slice(0, 6), tekstBegin: p.tekstBegin.slice(0, 300) };
}
