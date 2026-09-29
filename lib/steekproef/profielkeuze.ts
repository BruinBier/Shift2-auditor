import { createHash } from 'node:crypto';

/**
 * Welke pagina's en documenten krijgen een profiel in de browser (steekproefselectie v2,
 * fase 2)? Dit is GEEN steekproef: het bepaalt alleen wat er gemeten wordt.
 *
 * Drie lagen, in deze volgorde (zie docs/plannen/steekproef-v2/besluiten.md):
 *
 *   A. altijd: de homepage en de door de klant aangedragen HTML-pagina's;
 *   B. geprioriteerd op de statische aanwijzingen uit de inventarisatie (fase 1): video,
 *      iframe, formulier, tabel, documentlinks -- om de beurt per soort, zodat één talrijke
 *      soort (52 formulierpagina's bij Leudal) niet het hele budget opeet;
 *   C. gespreid over de pagina's zonder statische aanwijzing, voor wat Cheerio niet ziet
 *      (spelers en kaarten die pas met JavaScript of na toestemming laden). Een vast deel
 *      van het budget is hiervoor gereserveerd.
 *
 * Reproduceerbaar: dezelfde inventarisatie + dezelfde configuratie (inclusief seed) geeft
 * dezelfde lijst. Volgorde binnen een groep: sha256(seed | urlNorm), dan urlNorm.
 *
 * Het budget van 40 is een TESTWAARDE (besluit 2026-09-28). Mist de gespreide laag iets,
 * dan eerst slimmer kiezen, niet meteen meer.
 */

export const PROFIELKEUZE_VERSIE = 2; // 2: aanwijzingen uit paginadata, KAART_AANWIJZING (fase 2a)

export type Reden =
  | 'HOMEPAGE'
  | 'KLANT'
  | 'VIDEO_AANWIJZING'
  | 'KAART_AANWIJZING'
  | 'IFRAME_AANWIJZING'
  | 'FORMULIER_AANWIJZING'
  | 'TABEL_AANWIJZING'
  | 'DOCUMENTLINKS_AANWIJZING'
  | 'GESPREIDE_AANVULLING'
  | 'EXTRA_HANDMATIG';

export type DocumentReden = 'DOCUMENT_KLANT' | 'DOCUMENT_SOORT';

export interface ProfielConfig {
  budget: number;
  /** Deel van het budget dat voor laag C gereserveerd is (0..1). */
  aandeelGespreid: number;
  documentBudget: number;
  /** PDF's groter dan dit worden niet gemeten: een van 74,5 MB kostte 51 minuten. */
  maxDocumentMB: number;
  seed: string;
}

export const STANDAARD_CONFIG: ProfielConfig = {
  budget: 40,
  aandeelGespreid: 0.3,
  documentBudget: 12,
  maxDocumentMB: 25,
  seed: 'shift2-v2',
};

/** Wat de keuze nodig heeft uit een InventarisKandidaat. */
export interface KandidaatInvoer {
  urlNorm: string;
  soort: 'html' | 'document';
  status: string;
  bronnen: string[];
  /** Bytes volgens de server (content-length), als bekend. */
  grootte?: number | null;
  aanwijzingen: {
    formulieren?: number;
    tabellen?: number;
    video?: number;
    iframes?: number;
    iframeDomeinen?: string[];
    documentlinks?: number;
    /** Uit de meegestuurde paginadata (fase 2a): alleen een aanwijzing, geen bewijs. */
    paginadata?: { video?: number; kaart?: number; iframe?: number } | null;
  } | null;
}

export interface Gekozen {
  urlNorm: string;
  /** Alle redenen die voor deze pagina gelden; de eerste is de laag waarlangs hij binnenkwam. */
  redenen: Reden[];
  laag: 'A' | 'B' | 'C' | 'extra';
}

export interface GekozenDocument {
  urlNorm: string;
  redenen: DocumentReden[];
  geschatteSoort: DocumentSoortSchatting;
}

const orde = (seed: string) => (u: string) => createHash('sha256').update(`${seed}|${u}`).digest('hex');

/**
 * Hostnamen die een kaart zijn. Alleen de host is bekend (iframeDomeinen), dus geen
 * www.google.com: dat kan net zo goed een formulier zijn.
 */
const KAARTDIENST = /(^|\.)(maps\.google\.[a-z.]+|openstreetmap\.org|arcgis\.com|mapbox\.com|smartmap\.nl|pdok\.nl|kaartviewer\.nl)$/i;

const AANWIJZING_VOLGORDE: [Reden, (a: NonNullable<KandidaatInvoer['aanwijzingen']>) => boolean][] = [
  // Zeldzaam eerst: video, kaart en iframe komen weinig voor en vallen anders als eerste af.
  // Elk uit twee bronnen: de HTML-telling en de meegestuurde paginadata (fase 2a).
  ['VIDEO_AANWIJZING', (a) => (a.video || 0) > 0 || (a.paginadata?.video || 0) > 0],
  ['KAART_AANWIJZING', (a) => (a.paginadata?.kaart || 0) > 0 || (a.iframeDomeinen || []).some((d) => KAARTDIENST.test(d))],
  ['IFRAME_AANWIJZING', (a) => (a.iframes || 0) > 0 || (a.paginadata?.iframe || 0) > 0],
  ['FORMULIER_AANWIJZING', (a) => (a.formulieren || 0) > 0],
  ['TABEL_AANWIJZING', (a) => (a.tabellen || 0) > 0],
  ['DOCUMENTLINKS_AANWIJZING', (a) => (a.documentlinks || 0) > 0],
];

function aanwijzingRedenen(k: KandidaatInvoer): Reden[] {
  if (!k.aanwijzingen) return [];
  return AANWIJZING_VOLGORDE.filter(([, f]) => f(k.aanwijzingen!)).map(([r]) => r);
}

/** Het eerste padsegment als spreidingsgroep, of '(root)' voor een plat pad. */
function groep(urlNorm: string): string {
  const delen = new URL(urlNorm).pathname.split('/').filter(Boolean);
  return delen.length >= 2 ? delen[0] : '(plat)';
}

export function kiesPaginas(
  kandidaten: KandidaatInvoer[],
  homepage: string,
  config: ProfielConfig,
  extra: string[] = [],
): { gekozen: Gekozen[]; uitleg: Record<string, number | string> } {
  const sleutel = orde(config.seed);
  const html = kandidaten
    .filter((k) => k.soort === 'html' && k.status === 'kandidaat')
    .sort((a, b) => a.urlNorm.localeCompare(b.urlNorm));
  const perUrl = new Map(html.map((k) => [k.urlNorm, k]));
  const gekozen = new Map<string, Gekozen>();
  const kies = (k: KandidaatInvoer, eersteReden: Reden, laag: Gekozen['laag']) => {
    if (gekozen.has(k.urlNorm)) return false;
    const redenen: Reden[] = [eersteReden];
    if (k.urlNorm === homepage && eersteReden !== 'HOMEPAGE') redenen.push('HOMEPAGE');
    if (k.bronnen.includes('klant') && eersteReden !== 'KLANT') redenen.push('KLANT');
    for (const r of aanwijzingRedenen(k)) if (!redenen.includes(r)) redenen.push(r);
    gekozen.set(k.urlNorm, { urlNorm: k.urlNorm, redenen, laag });
    return true;
  };

  // A. Altijd.
  const home = perUrl.get(homepage);
  if (home) kies(home, 'HOMEPAGE', 'A');
  for (const k of html.filter((x) => x.bronnen.includes('klant'))) kies(k, 'KLANT', 'A');
  const naA = gekozen.size;

  // B. Om de beurt per aanwijzing, binnen de ruimte die C overlaat.
  const gereserveerdC = Math.ceil(config.budget * config.aandeelGespreid);
  const ruimteB = Math.max(0, config.budget - gekozen.size - gereserveerdC);
  const rijen = AANWIJZING_VOLGORDE.map(([reden, f]) => ({
    reden,
    lijst: html.filter((k) => k.aanwijzingen && f(k.aanwijzingen)).sort((a, b) => sleutel(a.urlNorm).localeCompare(sleutel(b.urlNorm))),
    i: 0,
  }));
  let inB = 0;
  while (inB < ruimteB && rijen.some((r) => r.i < r.lijst.length)) {
    for (const r of rijen) {
      if (inB >= ruimteB) break;
      while (r.i < r.lijst.length) {
        const k = r.lijst[r.i++];
        if (kies(k, r.reden, 'B')) {
          inB++;
          break;
        }
      }
    }
  }

  // C. Gespreid over de pagina's zonder statische aanwijzing; per padgroep om de beurt.
  //    Zijn die op, dan de overgebleven pagina's met een aanwijzing.
  const ruimteC = Math.max(0, config.budget - gekozen.size);
  const stil = html.filter((k) => !gekozen.has(k.urlNorm) && aanwijzingRedenen(k).length === 0);
  const rest = html.filter((k) => !gekozen.has(k.urlNorm) && aanwijzingRedenen(k).length > 0);
  const spreid = (lijst: KandidaatInvoer[]) => {
    const groepen = new Map<string, KandidaatInvoer[]>();
    for (const k of lijst) {
      const g = groep(k.urlNorm);
      if (!groepen.has(g)) groepen.set(g, []);
      groepen.get(g)!.push(k);
    }
    const namen = [...groepen.keys()].sort();
    for (const n of namen) groepen.get(n)!.sort((a, b) => sleutel(a.urlNorm).localeCompare(sleutel(b.urlNorm)));
    const uit: KandidaatInvoer[] = [];
    for (let i = 0; uit.length < lijst.length; i++) for (const n of namen) if (groepen.get(n)![i]) uit.push(groepen.get(n)![i]);
    return uit;
  };
  let inC = 0;
  for (const k of [...spreid(stil), ...spreid(rest)]) {
    if (inC >= ruimteC) break;
    if (kies(k, 'GESPREIDE_AANVULLING', 'C')) inC++;
  }

  // Extra: handmatig opgegeven, buiten het budget en apart herkenbaar.
  for (const u of extra) {
    const k = perUrl.get(u);
    if (k) kies(k, 'EXTRA_HANDMATIG', 'extra');
  }

  return {
    gekozen: [...gekozen.values()],
    uitleg: {
      htmlKandidaten: html.length,
      budget: config.budget,
      laagA: naA,
      gereserveerdVoorC: gereserveerdC,
      laagB: inB,
      laagC: inC,
      stilBeschikbaar: stil.length,
      extra: [...gekozen.values()].filter((g) => g.laag === 'extra').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Documenten
// ---------------------------------------------------------------------------

export type DocumentSoortSchatting = 'formulier' | 'besluit' | 'nota' | 'folder' | 'verslag' | 'bekendmaking' | 'overig';

/**
 * Een SCHATTING van het soort document uit de bestandsnaam, alleen om de meting te spreiden.
 * Het echte soort komt uit de meting (formuliervelden, titel) en later uit de classifier.
 */
export function schatDocumentSoort(urlNorm: string): DocumentSoortSchatting {
  let naam = urlNorm;
  try {
    naam = decodeURIComponent(new URL(urlNorm).pathname.split('/').pop() || '');
  } catch {
    /* laat staan */
  }
  const n = naam.toLowerCase();
  if (/formulier|aanvraag|aanmeld|machtiging|verklaring|opgave|toestemming/.test(n)) return 'formulier';
  if (/besluit|verordening|regeling|beschikking|reglement/.test(n)) return 'besluit';
  if (/folder|brochure|flyer|poster|infographic|kalender|kaart/.test(n)) return 'folder';
  if (/verslag|jaarrekening|jaarverslag|rapport|evaluatie|monitor|notulen|begroting/.test(n)) return 'verslag';
  if (/bekendmaking|publicatie|gemeentenieuws|nieuwsbrief|week\s?\d/.test(n)) return 'bekendmaking';
  if (/nota|beleid|visie|plan|programma|agenda|motivering|strategie/.test(n)) return 'nota';
  return 'overig';
}

export function kiesDocumenten(kandidaten: KandidaatInvoer[], config: ProfielConfig): GekozenDocument[] {
  const sleutel = orde(config.seed);
  const docs = kandidaten
    .filter((k) => k.soort === 'document' && k.status === 'kandidaat' && /\.pdf$/i.test(new URL(k.urlNorm).pathname))
    // Te groot om te meten, ook als de klant hem aandroeg. De CLI meldt welke er afvielen.
    .filter((k) => !(k.grootte && k.grootte > config.maxDocumentMB * 1024 * 1024))
    .sort((a, b) => sleutel(a.urlNorm).localeCompare(sleutel(b.urlNorm)));
  const uit: GekozenDocument[] = [];
  const gezien = new Set<string>();
  for (const k of docs.filter((d) => d.bronnen.includes('klant'))) {
    uit.push({ urlNorm: k.urlNorm, redenen: ['DOCUMENT_KLANT'], geschatteSoort: schatDocumentSoort(k.urlNorm) });
    gezien.add(k.urlNorm);
  }
  const perSoort = new Map<DocumentSoortSchatting, KandidaatInvoer[]>();
  for (const k of docs) {
    if (gezien.has(k.urlNorm)) continue;
    const s = schatDocumentSoort(k.urlNorm);
    if (!perSoort.has(s)) perSoort.set(s, []);
    perSoort.get(s)!.push(k);
  }
  const soorten = [...perSoort.keys()].sort();
  for (let i = 0; uit.length < config.documentBudget; i++) {
    let iets = false;
    for (const s of soorten) {
      const k = perSoort.get(s)![i];
      if (!k || uit.length >= config.documentBudget) continue;
      uit.push({ urlNorm: k.urlNorm, redenen: ['DOCUMENT_SOORT'], geschatteSoort: s });
      iets = true;
    }
    if (!iets) break;
  }
  return uit;
}
