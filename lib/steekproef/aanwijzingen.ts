import * as cheerio from 'cheerio';
import { documentSoortVan, pakVoorleeslinkUit } from './urls';

/**
 * Statische aanwijzingen uit opgehaalde HTML, zonder browser.
 *
 * INDICATIEF. Dit is `fetch` plus Cheerio: wat JavaScript pas later op de pagina zet,
 * staat er niet in, en een speler die na een cookiekeuze laadt evenmin. In fase 1 van
 * steekproefselectie v2 bepalen deze tellingen alleen welke pagina's later een volledig
 * profiel in de browser krijgen. Ze bepalen de steekproef NIET.
 *
 * Er wordt geteld binnen de hoofdinhoud (`main`, anders `[role=main]`, anders de body
 * zonder header, footer en navigatie). Het zoekveld in de header of het logo telt dus
 * niet op elke pagina mee -- dat was de zwakte van de bestaande crawler-tests, die over
 * het hele document tellen.
 */

export const AANWIJZINGEN_VERSIE = 2; // 2: meegestuurde paginadata (fase 2a)

/**
 * Aanwijzingen uit meegestuurde paginadata (fase 2a).
 *
 * SIMsite-pagina's (Next.js) sturen hun inhoud mee als JSON in `script#__NEXT_DATA__`.
 * Een video achter een toestemmingsscherm staat dan nog niet als element op de pagina,
 * maar wel als `youtube.com/embed/...` in die data; een kaart als `ParagraphDynamicMap`.
 * Op 28 september 2026 stonden zo de video's op leudal.nl/trainees en /zorgfraude en de
 * kaart op /sneeuwroute-3 in de data, terwijl de HTML-telling nul gaf.
 *
 * Alleen `props.pageProps.contentDetails` telt: de inhoud van de pagina zelf. Menu,
 * nieuwslijsten en configuratie staan elders in dezelfde JSON en zeggen niets over deze
 * pagina. En alleen specifieke aanwijzingen: een embed-URL, iframe-HTML, of een
 * componentnaam uit de lijst hieronder -- nooit een los woord als "video" of "kaart".
 *
 * Dit is een AANWIJZING voor de profielkeuze, geen bewijs. De browsermeting is leidend.
 */
export interface Paginadata {
  bron: 'next-data' | 'json-script' | null;
  /** Componenttypes in de pagina-inhoud, met aantal (`ParagraphText: 4`). */
  componenten: Record<string, number>;
  video: number;
  kaart: number;
  iframe: number;
  bewijs: { soort: 'video' | 'kaart' | 'iframe'; reden: 'embed-url' | 'iframe-html' | 'component' | 'schema.org'; waarde: string }[];
}

/** Componenttypes die op zichzelf een kaart of video zijn. Uitbreiden na waarneming, niet op gevoel. */
export const COMPONENT_SOORT: [RegExp, 'video' | 'kaart' | 'iframe'][] = [
  [/^Paragraph(DynamicMap|Map|Maps|GeoMap|LeafletMap)$/, 'kaart'],
  [/^Paragraph(Video|Videos|MediaVideo|VideoEmbed|Youtube|Vimeo)$/, 'video'],
  [/^Paragraph(Iframe|IFrame|Embed|EmbedCode|ExternalContent)$/, 'iframe'],
];

const EMBED_VIDEO = /(?:youtube(?:-nocookie)?\.com\/embed\/[\w-]{6,}|player\.vimeo\.com\/video\/\d+|bluebillywig\.com\/[\w/.-]*\.(?:html|js)|\.bbvms\.com\/p\/|content\.jwplatform\.com\/players\/|cdn\.jwplayer\.com\/players\/)/i;
const EMBED_KAART = /(?:google\.[a-z.]+\/maps\/embed|maps\.google\.[a-z.]+\/maps\?[^"'\s]*output=embed|openstreetmap\.org\/export\/embed|arcgis\.com\/apps\/[\w/]*(?:embed|webappviewer)|kaartviewer\.nl\/embed)/i;
const IFRAME_SRC = /<iframe[^>]*\ssrc=["']?([^"'\s>]+)/gi;

export function leesPaginadata($: cheerio.CheerioAPI): Paginadata {
  const leeg: Paginadata = { bron: null, componenten: {}, video: 0, kaart: 0, iframe: 0, bewijs: [] };
  let wortel: unknown = null;
  let bron: Paginadata['bron'] = null;
  let metComponenten = false;

  const next = $('script#__NEXT_DATA__').html();
  if (next) {
    try {
      const j = JSON.parse(next);
      if (j?.props?.pageProps?.contentDetails) {
        wortel = j.props.pageProps.contentDetails;
        bron = 'next-data';
        metComponenten = true;
      }
    } catch {
      /* onleesbare JSON: dan geen aanwijzing uit deze bron */
    }
  }
  // Andere JSON in de pagina: alleen embed-URL's en iframe-HTML tellen, geen componentnamen
  // (die zijn per framework anders en dus niet te vertrouwen zonder waarneming).
  if (!wortel) {
    const blokken: unknown[] = [];
    $('script[type="application/json"]').each((_, e) => {
      try {
        blokken.push(JSON.parse($(e).html() || ''));
      } catch {
        /* overslaan */
      }
    });
    if (blokken.length) {
      wortel = blokken;
      bron = 'json-script';
    }
  }

  const uit: Paginadata = { ...leeg, bron };
  const video = new Set<string>();
  const kaart = new Set<string>();
  const iframe = new Set<string>();
  const bewijs = (soort: Paginadata['bewijs'][number]['soort'], reden: Paginadata['bewijs'][number]['reden'], waarde: string) => {
    if (uit.bewijs.length < 8 && !uit.bewijs.some((b) => b.soort === soort && b.waarde === waarde)) uit.bewijs.push({ soort, reden, waarde: waarde.slice(0, 120) });
  };

  const loop = (v: unknown) => {
    if (typeof v === 'string') {
      const ev = v.match(EMBED_VIDEO);
      if (ev) {
        video.add(ev[0]);
        bewijs('video', 'embed-url', ev[0]);
      }
      const ek = v.match(EMBED_KAART);
      if (ek) {
        kaart.add(ek[0]);
        bewijs('kaart', 'embed-url', ek[0]);
      }
      if (/<iframe/i.test(v)) {
        for (const m of v.matchAll(IFRAME_SRC)) {
          // Een iframe die een video of kaart is, is hierboven al geteld. De iframe-aanwijzing
          // is voor wat overblijft: een widget, een formulier of kader van een ander domein.
          if (EMBED_VIDEO.test(m[1]) || EMBED_KAART.test(m[1])) continue;
          iframe.add(m[1]);
          bewijs('iframe', 'iframe-html', m[1]);
        }
      }
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) loop(x);
      return;
    }
    if (v && typeof v === 'object') {
      const t = (v as any).__typename;
      if (metComponenten && typeof t === 'string' && /^Paragraph/.test(t)) {
        uit.componenten[t] = (uit.componenten[t] || 0) + 1;
        for (const [re, soort] of COMPONENT_SOORT) {
          if (!re.test(t)) continue;
          const sleutel = `${t}#${uit.componenten[t]}`;
          if (soort === 'kaart') kaart.add(sleutel);
          if (soort === 'video') video.add(sleutel);
          if (soort === 'iframe') iframe.add(sleutel);
          bewijs(soort, 'component', t);
        }
      }
      for (const x of Object.values(v)) loop(x);
    }
  };
  if (wortel) loop(wortel);

  // schema.org: een VideoObject is een specifieke, door de site zelf opgegeven video.
  $('script[type="application/ld+json"]').each((_, e) => {
    const tekst = $(e).html() || '';
    if (/"@type"\s*:\s*"VideoObject"/.test(tekst)) {
      video.add('schema.org VideoObject');
      bewijs('video', 'schema.org', 'VideoObject');
      if (!uit.bron) uit.bron = 'json-script';
    }
  });

  uit.video = video.size;
  uit.kaart = kaart.size;
  uit.iframe = iframe.size;
  return uit;
}

export interface Aanwijzingen {
  bereik: 'main' | 'body';
  formulieren: number;
  zoekformulieren: number;
  invoervelden: number;
  tabellen: number;
  video: number;
  iframes: number;
  iframeDomeinen: string[];
  documentlinks: number;
  afbeeldingen: number;
  /** Uit de meegestuurde paginadata (fase 2a). Aanwijzing, geen bewijs. */
  paginadata: Paginadata;
}

export interface Paginalezing {
  titel: string | null;
  canonical: string | null;
  taal: string | null;
  noindex: boolean;
  /** Alle links op de pagina (ook header en footer), absoluut, in documentvolgorde. */
  links: string[];
  aanwijzingen: Aanwijzingen;
}

const VIDEOSPELERS =
  /(youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|bluebillywig|jwplayer|jwplatform|kaltura|dailymotion|scribit|qbrick|brightcove|vidyard|wistia|mediasite)/i;

/** Titel zonder sitenaam erachter: "Paspoort | Gemeente Leudal" -> "Paspoort". */
export function schoneTitel(ruw: string | null | undefined): string | null {
  if (!ruw) return null;
  const t = ruw.replace(/\s+/g, ' ').trim();
  const delen = t.split(/\s+[|–—·-]\s+/);
  const eerste = delen.length > 1 && delen[0].trim().length >= 3 ? delen[0].trim() : t;
  return eerste || null;
}

function isZoekformulier($: cheerio.CheerioAPI, form: any): boolean {
  const f = $(form);
  if ((f.attr('role') || '').toLowerCase() === 'search') return true;
  if (f.closest('[role=search], search').length) return true;
  const actie = (f.attr('action') || '').toLowerCase();
  if (/zoek|search/.test(actie)) return true;
  const velden = f.find('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select');
  if (velden.length === 1) {
    const naam = `${velden.attr('name') || ''} ${velden.attr('type') || ''} ${velden.attr('id') || ''}`.toLowerCase();
    if (/(^|\W)(q|s|search|zoek|zoekterm|query|keyword|term)(\W|$)/.test(naam) || /search/.test(naam)) return true;
  }
  return false;
}

export function leesPagina(html: string, basisUrl: string): Paginalezing {
  const $ = cheerio.load(html);

  const links: string[] = [];
  $('a[href], area[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      links.push(new URL(href, basisUrl).toString());
    } catch {
      /* onbruikbare href */
    }
  });

  let canonical: string | null = null;
  const can = $('link[rel="canonical"]').attr('href');
  if (can) {
    try {
      canonical = new URL(can, basisUrl).toString();
    } catch {
      canonical = null;
    }
  }

  const robots = ($('meta[name="robots"]').attr('content') || '').toLowerCase();

  // Het bereik: de hoofdinhoud, anders de body zonder sjabloononderdelen.
  let wortel = $('main').first();
  let bereik: 'main' | 'body' = 'main';
  if (!wortel.length) wortel = $('[role=main]').first();
  if (!wortel.length) {
    bereik = 'body';
    const body = $('body').clone();
    body.find('header, footer, nav, [role=banner], [role=contentinfo], [role=navigation]').remove();
    wortel = body;
  }

  let formulieren = 0;
  let zoekformulieren = 0;
  wortel.find('form').each((_, f) => {
    if (isZoekformulier($, f)) zoekformulieren++;
    else formulieren++;
  });

  const tabellen = wortel.find('table').filter((_, t) => !/^(presentation|none)$/i.test($(t).attr('role') || '')).length;

  const iframeDomeinen = new Set<string>();
  let video = wortel.find('video').length;
  let iframes = 0;
  wortel.find('iframe').each((_, f) => {
    iframes++;
    const src = $(f).attr('src') || $(f).attr('data-src') || '';
    if (VIDEOSPELERS.test(src)) video++;
    try {
      iframeDomeinen.add(new URL(src, basisUrl).hostname.toLowerCase());
    } catch {
      /* src zonder adres, bijvoorbeeld een lege plaatshouder die pas na toestemming vult */
    }
  });
  // Spelers die zich niet als iframe of video aandienen, maar als container.
  video += wortel.find('[class*="bluebillywig"], [class*="jwplayer"], [data-video-id], [data-youtube-id]').length;

  let documentlinks = 0;
  wortel.find('a[href]').each((_, a) => {
    try {
      let u = new URL($(a).attr('href')!, basisUrl);
      u = pakVoorleeslinkUit(u) || u;
      if (documentSoortVan(u.toString())) documentlinks++;
    } catch {
      /* onbruikbare href */
    }
  });

  return {
    titel: schoneTitel($('title').first().text()),
    canonical,
    taal: ($('html').attr('lang') || '').trim() || null,
    noindex: /noindex/.test(robots),
    links,
    aanwijzingen: {
      bereik,
      formulieren,
      zoekformulieren,
      invoervelden: wortel.find('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select').length,
      tabellen,
      video,
      iframes,
      iframeDomeinen: [...iframeDomeinen].sort(),
      documentlinks,
      afbeeldingen: wortel.find('img').length,
      paginadata: leesPaginadata($),
    },
  };
}
