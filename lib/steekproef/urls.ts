/**
 * URL-normalisatie voor de kandidatenpool van de steekproef.
 *
 * Eén pagina mag maar één keer in de pool staan. Dezelfde pagina komt in de praktijk
 * onder meerdere spellingen binnen: met en zonder afsluitende slash, met een
 * cachebreker (`?cb=...` achter elk SIMsite-document), via een voorleeslink van
 * ReadSpeaker, of op www en zonder www. De nulmeting van 28 september 2026 liet zien
 * wat er gebeurt als dat per run anders wordt opgelost: dezelfde PDF stond in de ene
 * run met en in de andere zonder `?cb=`.
 *
 * Alles hier is puur: geen netwerk. Wat pas na het ophalen blijkt (een doorverwijzing,
 * een canonical, of www en zonder www echt dezelfde site zijn) regelt de inventarisatie.
 *
 * Wijzig je de regels, verhoog dan NORMALISATIE_VERSIE: een pool van vóór de wijziging
 * is dan niet meer één-op-één te vergelijken met een pool van erna.
 */

export const NORMALISATIE_VERSIE = 1;

/** Queryparameters die nooit een andere pagina aanwijzen. */
const RUIS_PARAMETERS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^msclkid$/i,
  /^mc_(cid|eid)$/i,
  /^_ga$/i,
  /^_gl$/i,
  /^cb$/i, // cachebreker van SIMsite-documenten
];

export const DOCUMENT_EXTENSIES = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'rtf',
] as const;
export type DocumentSoort = (typeof DOCUMENT_EXTENSIES)[number];

/** Wat nooit een pagina of document is: beeld, stijl, script, data, archief, media. */
const GEEN_KANDIDAAT_EXTENSIES =
  /\.(jpe?g|png|gif|svg|webp|avif|ico|bmp|tiff?|css|js|mjs|json|xml|txt|zip|rar|7z|tar|gz|mp4|m4v|mov|avi|webm|mp3|wav|ogg|m4a|woff2?|ttf|eot|ics|vcf)$/i;

export interface Sitecontext {
  /** De host waar alles van de site onder komt te staan, bijvoorbeeld `www.leudal.nl`. */
  canonHost: string;
  /** Hosts die bewezen dezelfde site zijn (www en zonder www). Worden `canonHost`. */
  aliassen: string[];
}

export function sitecontextVoor(startUrl: string, aliassen: string[] = []): Sitecontext {
  const u = new URL(startUrl);
  return { canonHost: u.hostname.toLowerCase(), aliassen: aliassen.map((a) => a.toLowerCase()) };
}

/** `www.x.nl` <-> `x.nl`. */
export function wwwVariant(host: string): string {
  const h = host.toLowerCase();
  return h.startsWith('www.') ? h.slice(4) : `www.${h}`;
}

function veiligDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Een voorleeslink van ReadSpeaker wijst naar hetzelfde document als de gewone link
 * ernaast (`docreader.readspeaker.com/...?url=<pdf>`). Die pakken we uit, anders staat
 * elk document twee keer in de pool.
 */
export function pakVoorleeslinkUit(u: URL): URL | null {
  if (!/readspeaker\.com$/i.test(u.hostname)) return null;
  const doel = u.searchParams.get('url');
  if (!doel) return null;
  try {
    return new URL(doel);
  } catch {
    return null;
  }
}

/** De extensie van het laatste padsegment, of null. */
export function documentSoortVan(url: string): DocumentSoort | null {
  try {
    const pad = new URL(url).pathname.toLowerCase();
    const m = pad.match(/\.([a-z0-9]+)$/);
    if (!m) return null;
    return (DOCUMENT_EXTENSIES as readonly string[]).includes(m[1]) ? (m[1] as DocumentSoort) : null;
  } catch {
    return null;
  }
}

export interface Genormaliseerd {
  /** De sleutel in de pool. Absolute URL, altijd https voor de site zelf. */
  urlNorm: string;
  soort: 'html' | 'document';
  documentSoort: DocumentSoort | null;
  /** Wat de normalisatie heeft gedaan, voor de voorbeelden in de rapportage. */
  ingrepen: string[];
}

/**
 * Normaliseer een URL. Geeft null voor wat nooit een kandidaat is: mailto, tel,
 * javascript, ankers binnen de pagina, afbeeldingen, stylesheets en dergelijke.
 */
export function normaliseer(ruw: string, basis: string, ctx: Sitecontext): Genormaliseerd | null {
  const tekst = (ruw || '').trim();
  if (!tekst || tekst.startsWith('#')) return null;
  if (/^(mailto|tel|javascript|data|sms|whatsapp|callto|fax):/i.test(tekst)) return null;

  let u: URL;
  try {
    u = new URL(tekst, basis);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const ingrepen: string[] = [];

  const uitgepakt = pakVoorleeslinkUit(u);
  if (uitgepakt) {
    u = uitgepakt;
    ingrepen.push('voorleeslink uitgepakt');
  }

  // Host: kleine letters, standaardpoort weg, bewezen aliassen naar de canonieke host.
  let host = u.hostname.toLowerCase();
  if (ctx.aliassen.includes(host) && host !== ctx.canonHost) {
    ingrepen.push(`${host} -> ${ctx.canonHost}`);
    host = ctx.canonHost;
  }
  const eigenSite = host === ctx.canonHost;
  const poort = u.port && !((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) ? `:${u.port}` : '';

  // Schema: de site zelf altijd https. Een http-link naar de eigen site is dezelfde pagina.
  let schema = u.protocol;
  if (eigenSite && schema === 'http:') {
    schema = 'https:';
    ingrepen.push('http -> https');
  }

  // Pad: dubbele slashes samen, afsluitende slash weg (behalve de root), en één
  // spelling voor procenttekens (%20 en een spatie zijn hetzelfde teken).
  let pad = u.pathname.replace(/\/{2,}/g, '/');
  if (pad.length > 1 && pad.endsWith('/')) {
    pad = pad.replace(/\/+$/, '');
    ingrepen.push('afsluitende slash');
  }
  const padGecodeerd = encodeURI(veiligDecode(pad));
  if (padGecodeerd !== pad) ingrepen.push('tekencodering');
  pad = padGecodeerd || '/';

  if (GEEN_KANDIDAAT_EXTENSIES.test(pad)) return null;

  const documentSoort = documentSoortVan(`${schema}//${host}${pad}`);

  // Query: bij een document wijst de extensie het bestand al aan; wat erachter staat is
  // cachebreker of tracking. Bij een pagina gaat alleen de bekende ruis weg, en de rest
  // op een vaste volgorde -- `?b=2&a=1` en `?a=1&b=2` zijn dezelfde pagina.
  const params = [...u.searchParams.entries()];
  let behouden: [string, string][];
  if (documentSoort) {
    behouden = [];
    if (params.length) ingrepen.push('query achter document weggelaten');
  } else {
    behouden = params.filter(([k]) => !RUIS_PARAMETERS.some((re) => re.test(k)));
    if (behouden.length !== params.length) ingrepen.push('ruisparameter weggelaten');
    behouden.sort(([a, av], [b, bv]) => (a === b ? av.localeCompare(bv) : a.localeCompare(b)));
  }
  const query = behouden.length ? '?' + new URLSearchParams(behouden).toString() : '';
  if (u.hash) ingrepen.push('anker weggelaten');

  return {
    urlNorm: `${schema}//${host}${poort}${pad}${query}`,
    soort: documentSoort ? 'document' : 'html',
    documentSoort,
    ingrepen,
  };
}

/**
 * Een regel uit `scopeOutOfScope` of een buiten-scope-URL, als uitsluitregel.
 *
 * - een host zonder pad (`https://mijn.heuvelrug.nl/`) sluit de hele host uit;
 * - een regel met een query sluit precies die variant uit, en niets anders:
 *   `…/&?product=306` raakt `?product=306`, niet `?product=1`;
 * - anders de pagina zelf en alles eronder (`/archief` sluit ook `/archief/2019` uit),
 *   met elke query.
 *
 * De query telt alleen als hij in de regel staat. Zo kan de onderzoeker één variant
 * uitsluiten zonder per ongeluk alle varianten van een pagina weg te gooien. Tot
 * 2026-09-28 negeerde de regel de query, en viel de hele afsprakenmodule van
 * heuvelrug.nl buiten scope (28 producten) waar er één was aangewezen.
 */
export interface Uitsluitregel {
  bron: string;
  host: string;
  pad: string | null;
  /** De genormaliseerde query met vraagteken, of null als de regel er geen heeft. */
  query: string | null;
}

export function uitsluitregel(ruw: string, ctx: Sitecontext): Uitsluitregel | null {
  const n = normaliseer(ruw, ruw, ctx);
  if (!n) return null;
  const u = new URL(n.urlNorm);
  const query = u.search || null;
  return { bron: ruw.trim(), host: u.hostname, pad: u.pathname === '/' && !query ? null : u.pathname, query };
}

export function uitgeslotenDoor(urlNorm: string, regels: Uitsluitregel[]): Uitsluitregel | null {
  const u = new URL(urlNorm);
  for (const r of regels) {
    if (u.hostname !== r.host) continue;
    if (r.query !== null) {
      if (u.pathname === r.pad && u.search === r.query) return r;
      continue;
    }
    if (r.pad === null) return r;
    if (u.pathname === r.pad || u.pathname.startsWith(r.pad + '/')) return r;
  }
  return null;
}

/**
 * Het domein zonder subdomeinen, grof: de laatste twee labels. Goed genoeg om
 * `mijn.heuvelrug.nl` als verwant aan `www.heuvelrug.nl` te herkennen; geen publieke
 * suffixlijst, dus `x.co.uk` gaat fout. Dat speelt bij Nederlandse overheden niet.
 */
export function hoofddomein(host: string): string {
  return host.toLowerCase().split('.').slice(-2).join('.');
}

/** Lees een tekstveld uit de planning (één URL per regel, eventueel met opsommingsteken). */
export function urlsUitTekstveld(tekst: string | null | undefined): string[] {
  if (!tekst) return [];
  const uit: string[] = [];
  for (const regel of tekst.split(/\r?\n/)) {
    const m = regel.match(/https?:\/\/\S+/i);
    if (m) uit.push(m[0].replace(/[),.;]+$/, ''));
  }
  return uit;
}
