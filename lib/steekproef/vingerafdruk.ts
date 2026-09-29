import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';

/**
 * Structuurvingerafdruk van een pagina (steekproefselectie v2, fase 3).
 *
 * SCHADUWFUNCTIE. De vingerafdruk en de clusters die eruit volgen hebben nog geen enkele
 * invloed op de profielkeuze, het budget of de steekproef. Ze zijn er om te beoordelen of
 * technische sjablonen inhoudelijk bruikbaar zijn.
 *
 * Drie delen, alle drie zonder tekstinhoud:
 *
 *   1. cms  -- wat het CMS zelf over het sjabloon meestuurt. Bij SIMsite (Next.js) staat in
 *              `__NEXT_DATA__` het inhoudstype (`nodeContext.entityBundle`: page, news,
 *              overview_page, ...), de componenten in volgorde (`fieldParagraphs`:
 *              text, dynamic_map, columns, ...) en welke structurele velden gevuld zijn
 *              (intro, afbeelding, sidebar). Types en aanwezigheid, nooit de waarde.
 *   2. dom  -- de opbouw van `main`: per element tag, rol en betekenisvolle klassen, als
 *              paden van drie niveaus. Gelijke broers en zussen tellen één keer (twaalf
 *              li's zijn er één), ids, hashes, nummers en utility-klassen vallen weg.
 *   3. kop  -- de volgorde van kopniveaus, met herhaling samengevoegd.
 *
 * Wat er NIET in zit: tekst, URL's, video-id's (hetzelfde filmpje maakt geen hetzelfde
 * sjabloon), aantallen herhaalde onderdelen.
 *
 * Wijzig je de regels, verhoog dan VINGERAFDRUK_VERSIE.
 */

export const VINGERAFDRUK_VERSIE = 1;

export interface Vingerafdruk {
  versie: number;
  /** Het inhoudstype volgens het CMS, of null als de pagina dat niet meestuurt. */
  inhoudstype: string | null;
  /** Kenmerken uit de CMS-data (`type:`, `comp:`, `volg:`, `veld:`, `opmaak:`). Leesbaar. */
  cms: string[];
  /** Componentvolgorde, leesbaar, voor de weergave: "text > dynamic_map". */
  componenten: string | null;
  /** DOM-paden van drie niveaus binnen main, als korte hash. */
  dom: string[];
  /** De directe onderdelen van main, leesbaar, voor de weergave. */
  skelet: string[];
  /** Kopniveaus in volgorde, als paren ("h1>h2"). */
  kop: string[];
  /** Waar de DOM-opbouw vandaan komt. */
  bereik: 'main' | 'body' | 'geen';
}

// ---------------------------------------------------------------------------
// Klassen normaliseren
// ---------------------------------------------------------------------------

/** Utility-klassen (Tailwind, Bootstrap-rasters, marges) zeggen niets over het sjabloon. */
const UTILITY = /^(col|row|mt|mb|ml|mr|mx|my|pt|pb|pl|pr|px|py|p|m|w|h|d|flex|grid|gap|text|bg|font|align|justify|order|offset|sr|visually|hidden|show|is|has|js)(-|$)/i;

/**
 * Een CSS-moduleklasse bevat een hash: `ParagraphList-module-scss-module__1h4Lfq__items`.
 * Die maken we `ParagraphList__items`. Wat daarna nog cijfers of een hash bevat, gaat weg.
 */
export function normaliseerKlasse(c: string): string | null {
  let k = c.trim();
  if (!k) return null;
  const module = k.match(/^([A-Za-z][\w]*)-module-scss-module__[\w-]+?__([\w-]+)$/);
  if (module) k = `${module[1]}__${module[2]}`;
  if (/\d/.test(k)) return null;
  if (k.length > 40) return null;
  if (UTILITY.test(k)) return null;
  return k;
}

const TEKSTNIVEAU = new Set(['b', 'strong', 'i', 'em', 'span', 'br', 'small', 'sup', 'sub', 'abbr', 'mark', 'u', 's', 'wbr', 'code', 'q', 'cite', 'time']);
const SLA_OVER = new Set(['script', 'style', 'noscript', 'template', 'link', 'meta', 'svg', 'path', 'g', 'defs', 'use', 'source']);

const kortHash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 10);

/**
 * Een redactioneel tekstveld: wat erin staat (koppen, lijsten, tabellen, een ingesloten
 * video) heeft de redacteur geschreven, niet het sjabloon. Het veld zelf telt mee als
 * onderdeel, de binnenkant niet. Zonder deze regel splitsten de productpagina's van
 * leudal.nl (allemaal `pdc_item | text`) in vier clusters, alleen omdat de ene redacteur
 * een h3 onder een h2 zette en de andere niet.
 *
 * SIMsite: `div.ParagraphText__paragraphText.text-container`. De andere namen zijn gangbaar
 * bij andere CMS'en; uitbreiden na waarneming.
 */
const REDACTIONEEL = /(^|[\s_])(text-container|paragraphText|rich-?text|richtext|wysiwyg|html-?body|HTMLBody__htmlBody|field--name-body|prose|cke_editable|editor-content)($|[\s_])/i;
const isRedactioneel = (klasse: string | undefined) => !!klasse && REDACTIONEEL.test(klasse);

function signatuur($: cheerio.CheerioAPI, el: any): string {
  const tag = (el.tagName || el.name || '').toLowerCase();
  const rol = $(el).attr('role');
  const klassen = ($(el).attr('class') || '')
    .split(/\s+/)
    .map(normaliseerKlasse)
    .filter(Boolean)
    .sort()
    .slice(0, 3);
  return `${tag}${rol ? `[${rol}]` : ''}${klassen.length ? '.' + klassen.join('.') : ''}`;
}

// ---------------------------------------------------------------------------
// CMS-data (SIMsite / Next.js)
// ---------------------------------------------------------------------------

function leesCms($: cheerio.CheerioAPI): { inhoudstype: string | null; cms: string[]; componenten: string | null } {
  const leeg = { inhoudstype: null, cms: [] as string[], componenten: null };
  const ruw = $('script#__NEXT_DATA__').html();
  if (!ruw) return leeg;
  let node: any;
  try {
    node = JSON.parse(ruw)?.props?.pageProps?.contentDetails?.data?.route?.nodeContext;
  } catch {
    return leeg;
  }
  if (!node) return leeg;
  const type = node.entityBundle || node.__typename || null;
  const cms = new Set<string>();
  if (type) cms.add(`type:${type}`);

  // Structurele velden: alleen of ze gevuld zijn. Een intro of een afbeelding bovenaan
  // verandert de opbouw van de pagina; wat erin staat niet.
  for (const veld of ['fieldIntroduction', 'fieldImage', 'fieldHero', 'fieldTopImage', 'fieldHeader']) {
    const v = node[veld];
    if (v && !(Array.isArray(v) && !v.length)) cms.add(`veld:${veld}${v.entity?.entityBundle ? '=' + v.entity.entityBundle : ''}`);
  }
  if (Array.isArray(node.fieldSidebar) && node.fieldSidebar.length) cms.add('veld:sidebar');
  if (node.fieldSidebarLocation) cms.add(`opmaak:sidebar=${node.fieldSidebarLocation}`);

  // Componenten in volgorde. Gelijke opeenvolgende componenten tellen één keer:
  // vier tekstblokken achter elkaar zijn hetzelfde sjabloon als twee.
  const bundels: string[] = [];
  for (const p of node.fieldParagraphs || []) {
    const e = p?.entity || p;
    const b = e?.entityBundle || e?.__typename;
    if (!b) continue;
    if (bundels[bundels.length - 1] !== b) bundels.push(b);
    cms.add(`comp:${b}`);
    // Een lay-outkeuze van het component (drie kolommen, zonder afbeelding) is sjabloon.
    if (typeof e.fieldLayout === 'string' && !/\d{3,}/.test(e.fieldLayout)) cms.add(`opmaak:${b}=${e.fieldLayout}`);
  }
  const volg = ['^', ...bundels, '$'];
  for (let i = 0; i < volg.length - 1; i++) cms.add(`volg:${volg[i]}>${volg[i + 1]}`);
  return { inhoudstype: type, cms: [...cms].sort(), componenten: bundels.join(' > ') || null };
}

// ---------------------------------------------------------------------------
// De vingerafdruk
// ---------------------------------------------------------------------------

export function maakVingerafdruk(html: string): Vingerafdruk {
  const $ = cheerio.load(html);
  const { inhoudstype, cms, componenten } = leesCms($);

  let wortel = $('main').first();
  let bereik: Vingerafdruk['bereik'] = 'main';
  if (!wortel.length) wortel = $('[role=main]').first();
  if (!wortel.length) {
    wortel = $('#main-content').first();
  }
  if (!wortel.length) {
    bereik = 'body';
    const b = $('body').clone();
    b.find('header, footer, nav, [role=banner], [role=contentinfo], [role=navigation]').remove();
    wortel = b;
  }
  if (!wortel.length) bereik = 'geen';

  // Paden van drie niveaus: ouder > kind > kleinkind. Gelijke broers en zussen één keer.
  const paden = new Set<string>();
  const skelet: string[] = [];
  const loop = (el: any, voorouders: string[], diepte: number) => {
    if (diepte > 10) return;
    const gezien = new Set<string>();
    for (const kind of $(el).children().toArray()) {
      const tag = ((kind as any).tagName || '').toLowerCase();
      if (SLA_OVER.has(tag)) continue;
      // Tekstopmaak binnen een alinea is inhoud, geen opbouw.
      if (TEKSTNIVEAU.has(tag)) continue;
      const sig = signatuur($, kind);
      if (gezien.has(sig)) continue;
      gezien.add(sig);
      if (diepte === 0) skelet.push(sig);
      const redactioneel = isRedactioneel($(kind).attr('class'));
      const eigenSig = redactioneel ? `${sig}{tekst}` : sig;
      const keten = [...voorouders, eigenSig].slice(-3);
      if (keten.length === 3) paden.add(keten.join(' > '));
      else if (diepte <= 1) paden.add(keten.join(' > '));
      // Niet afdalen in een redactioneel tekstveld: dat is inhoud.
      if (!redactioneel) loop(kind, [...voorouders, eigenSig], diepte + 1);
    }
  };
  if (bereik !== 'geen') loop(wortel.get(0), [], 0);

  // Kopniveaus in volgorde, herhaling samengevoegd, als paren.
  const niveaus: string[] = [];
  wortel.find('h1, h2, h3, h4, h5, h6').each((_, h) => {
    // Koppen in een redactioneel tekstveld zijn inhoud; alleen sjabloonkoppen tellen.
    if ($(h).parents().toArray().some((p) => isRedactioneel($(p).attr('class')))) return;
    const n = ((h as any).tagName || '').toLowerCase();
    if (niveaus[niveaus.length - 1] !== n) niveaus.push(n);
  });
  const kv = ['^', ...niveaus];
  const kop: string[] = [];
  for (let i = 0; i < kv.length - 1; i++) kop.push(`${kv[i]}>${kv[i + 1]}`);

  return {
    versie: VINGERAFDRUK_VERSIE,
    inhoudstype,
    cms,
    componenten,
    dom: [...paden].map(kortHash).sort(),
    skelet: skelet.slice(0, 20),
    kop: [...new Set(kop)].sort(),
    bereik,
  };
}
