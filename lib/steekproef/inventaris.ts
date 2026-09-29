import { createHash } from 'node:crypto';
import { leesSitemaps } from '@/lib/crawler/sitemap';
import { AANWIJZINGEN_VERSIE, leesPagina, type Aanwijzingen } from './aanwijzingen';
import { maakVingerafdruk, VINGERAFDRUK_VERSIE, type Vingerafdruk } from './vingerafdruk';
import {
  NORMALISATIE_VERSIE,
  hoofddomein,
  normaliseer,
  sitecontextVoor,
  uitgeslotenDoor,
  uitsluitregel,
  wwwVariant,
  type DocumentSoort,
  type Sitecontext,
  type Uitsluitregel,
} from './urls';

/**
 * Kandidateninventarisatie voor de steekproef (steekproefselectie v2, fase 1).
 *
 * Doel: voor dezelfde site en dezelfde scope steeds dezelfde pool. Daarom:
 *   - de sitemap wordt HELEMAAL gelezen, niet gespreid bemonsterd;
 *   - er wordt per diepte in zijn geheel opgehaald, zodat de volgorde van de
 *     antwoorden niet uitmaakt voor wat er gevonden wordt;
 *   - alles wordt aan het eind op `urlNorm` gesorteerd.
 *
 * Wat NIET gebeurt: een browser, JavaScript, een keuze. De aanwijzingen per pagina zijn
 * indicatief en sturen in deze fase de steekproef niet.
 */

export const INVENTARIS_VERSIE = 2; // 2: een uitsluitregel met query raakt alleen die variant

export type Bron = 'scope' | 'sitemap' | 'klant' | 'link' | 'doorverwijzing';
const BRONVOLGORDE: Bron[] = ['klant', 'scope', 'sitemap', 'link', 'doorverwijzing'];

export type Status = 'kandidaat' | 'uitgesloten' | 'dubbel' | 'niet_opgehaald';

export interface Kandidaat {
  urlNorm: string;
  soort: 'html' | 'document';
  documentSoort: DocumentSoort | null;
  bronnen: Bron[];
  status: Status;
  reden: string | null;
  dubbelVan: string | null;
  httpStatus: number | null;
  contentType: string | null;
  eindUrl: string | null;
  titel: string | null;
  canonical: string | null;
  taal: string | null;
  noindex: boolean;
  grootte: number | null;
  aanwijzingen: Aanwijzingen | null;
  /** Structuurvingerafdruk voor de sjabloonclusters (fase 3, schaduwfunctie). */
  vingerafdruk: Vingerafdruk | null;
  /** Op welke pagina's deze link stond (hooguit drie, gesorteerd). */
  gevondenOp: string[];
  /** De spellingen die tot deze kandidaat zijn samengevoegd (hooguit vijf). */
  varianten: string[];
  /** Wat de normalisatie eraan deed, per spelling. Voor de rapportage. */
  ingrepen: string[];
  diepte: number;
  waarschuwing: string | null;
}

export interface InventarisInvoer {
  startUrl: string;
  scopeUrls: { url: string; inScope: boolean }[];
  klantUrls: string[];
  buitenScopeUrls: string[];
}

export interface InventarisOpties {
  gelijktijdig?: number;
  timeoutMs?: number;
  maxPaginas?: number;
  maxDocumenten?: number;
  userAgent?: string;
  voortgang?: (bericht: string) => void;
}

export interface InventarisResultaat {
  versies: { inventaris: number; normalisatie: number; aanwijzingen: number; vingerafdruk: number };
  startUrl: string;
  canonHost: string;
  aliassen: string[];
  linkDiepte: number;
  sitemap: Awaited<ReturnType<typeof leesSitemaps>> & { aantalUrls: number };
  uitsluitregels: Uitsluitregel[];
  kandidaten: Kandidaat[];
  /** Links naar andere sites, per host. Geen kandidaat en niet uitgesloten: gewoon extern. */
  externeHosts: Record<string, number>;
  /** Ruwe spellingen die zijn tegengekomen, vóór normalisatie. */
  ruwGevonden: number;
  poolHash: string;
  kandidatenHash: string;
  canonicalGenegeerd: string | null;
  gestartOp: string;
  klaarOp: string;
}

const STANDAARD: Required<Omit<InventarisOpties, 'voortgang'>> = {
  gelijktijdig: 6,
  timeoutMs: 20000,
  maxPaginas: 3000,
  maxDocumenten: 1500,
  userAgent: 'Mozilla/5.0 (compatible; Shift2-Auditor/1.0; toegankelijkheidsonderzoek)',
};

// ---------------------------------------------------------------------------
// Ophalen
// ---------------------------------------------------------------------------

interface Antwoord {
  status: number;
  eindUrl: string;
  contentType: string;
  tekst: string;
  grootte: number | null;
}

/**
 * Cookies per host, voor de duur van één inventarisatie.
 *
 * SIMsite-formulieren (`/form/...`) verwijzen zonder cookie naar zichzelf door om er een
 * te zetten. `fetch` met `redirect: 'follow'` stuurt die cookie niet terug, draait twintig
 * trage rondjes en loopt dan in een time-out. Op 28 september 2026 waren dat alle 55
 * time-outs op leudal.nl en alle 40 op heuvelrug.nl, waaronder het contactformulier dat de
 * klant zelf aandroeg. Daarom volgen we doorverwijzingen zelf, met de cookie erbij.
 */
type Cookiejar = Map<string, Map<string, string>>;

function onthoudCookies(jar: Cookiejar, host: string, r: Response) {
  const regels: string[] = (r.headers as any).getSetCookie?.() ?? [];
  if (!regels.length) return false;
  let bak = jar.get(host);
  if (!bak) jar.set(host, (bak = new Map()));
  let nieuw = false;
  for (const regel of regels) {
    const [paar] = regel.split(';');
    const i = paar.indexOf('=');
    if (i <= 0) continue;
    const naam = paar.slice(0, i).trim();
    const waarde = paar.slice(i + 1).trim();
    if (bak.get(naam) !== waarde) nieuw = true;
    bak.set(naam, waarde);
  }
  return nieuw;
}

const MAX_DOORVERWIJZINGEN = 10;

async function haal(
  url: string,
  o: typeof STANDAARD,
  methode: 'GET' | 'HEAD' = 'GET',
  jar: Cookiejar = new Map(),
): Promise<Antwoord | { fout: string }> {
  for (let poging = 0; poging < 2; poging++) {
    const ac = new AbortController();
    const klok = setTimeout(() => ac.abort(), o.timeoutMs);
    try {
      let huidig = url;
      const bezocht = new Map<string, number>();
      for (let stap = 0; ; stap++) {
        const host = new URL(huidig).hostname;
        const koek = jar.get(host);
        const r = await fetch(huidig, {
          method: methode,
          redirect: 'manual',
          signal: ac.signal,
          headers: {
            'User-Agent': o.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ...(koek?.size ? { Cookie: [...koek].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
          },
        });
        const nieuweKoek = onthoudCookies(jar, host, r);
        const doel = r.headers.get('location');
        if (r.status >= 300 && r.status < 400 && doel) {
          await r.body?.cancel().catch(() => {});
          const volgende = new URL(doel, huidig).toString();
          const keer = (bezocht.get(volgende) || 0) + 1;
          bezocht.set(volgende, keer);
          // Terug naar een adres waar we al waren, zonder dat er een cookie bij kwam: een lus.
          if ((keer > 1 && !nieuweKoek) || keer > 3 || stap >= MAX_DOORVERWIJZINGEN) return { fout: 'doorverwijzingslus' };
          huidig = volgende;
          continue;
        }
        const contentType = r.headers.get('content-type') || '';
        const lengte = r.headers.get('content-length');
        const isTekst = methode === 'GET' && /(html|xml|text\/plain)/i.test(contentType);
        const tekst = isTekst ? await r.text() : '';
        if (!isTekst && methode === 'GET') await r.body?.cancel().catch(() => {});
        if ((r.status >= 500 || r.status === 429) && poging === 0) break;
        return { status: r.status, eindUrl: huidig, contentType, tekst, grootte: lengte ? Number(lengte) : null };
      }
      await new Promise((z) => setTimeout(z, 1500));
    } catch (e: any) {
      const oorzaak = String(e?.cause?.message || e?.message || e);
      if (poging === 0) {
        await new Promise((z) => setTimeout(z, 1500));
        continue;
      }
      return { fout: e?.name === 'AbortError' ? 'time-out' : `netwerkfout: ${oorzaak.slice(0, 120)}` };
    } finally {
      clearTimeout(klok);
    }
  }
  return { fout: 'server bleef een fout geven' };
}

async function metGelijktijdig<T>(items: T[], n: number, werk: (x: T) => Promise<void>) {
  let i = 0;
  const lopers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const mijn = items[i++];
      await werk(mijn);
    }
  });
  await Promise.all(lopers);
}

// ---------------------------------------------------------------------------
// De inventarisatie
// ---------------------------------------------------------------------------

export async function inventariseer(invoer: InventarisInvoer, opties: InventarisOpties = {}): Promise<InventarisResultaat> {
  const o = { ...STANDAARD, ...opties };
  const meld = opties.voortgang || (() => {});
  const gestartOp = new Date().toISOString();
  const jar: Cookiejar = new Map();

  // 1. Welke host is de site, en is www / zonder www dezelfde site? Alleen als de ene
  //    aantoonbaar naar de andere doorverwijst.
  const startAntw = await haal(invoer.startUrl, o, 'GET', jar);
  const startHost = new URL(invoer.startUrl).hostname.toLowerCase();
  const canonHost = 'fout' in startAntw ? startHost : new URL(startAntw.eindUrl).hostname.toLowerCase();
  const aliassen = new Set<string>();
  if (startHost !== canonHost) aliassen.add(startHost);
  const variant = wwwVariant(canonHost);
  const variantAntw = await haal(`https://${variant}/`, o, 'HEAD', jar);
  if (!('fout' in variantAntw) && new URL(variantAntw.eindUrl).hostname.toLowerCase() === canonHost) aliassen.add(variant);
  const ctx: Sitecontext = sitecontextVoor(`https://${canonHost}/`, [...aliassen]);
  meld(`Site: ${canonHost}${aliassen.size ? ` (ook: ${[...aliassen].join(', ')})` : ''}`);

  const siteHosts = new Set<string>([canonHost]);
  for (const s of invoer.scopeUrls) {
    if (!s.inScope) continue;
    const n = normaliseer(s.url, s.url, ctx);
    if (n) siteHosts.add(new URL(n.urlNorm).hostname);
  }
  const verwant = hoofddomein(canonHost);

  // 2. Uitsluitregels: het planningveld plus de buiten-scope-URL's uit het tabblad Scope.
  const regels: Uitsluitregel[] = [];
  for (const ruw of [...invoer.buitenScopeUrls, ...invoer.scopeUrls.filter((s) => !s.inScope).map((s) => s.url)]) {
    const r = uitsluitregel(ruw, ctx);
    if (r && !regels.some((x) => x.host === r.host && x.pad === r.pad && x.query === r.query)) regels.push(r);
  }

  // 3. Het register.
  const reg = new Map<string, Kandidaat>();
  const ruw = new Set<string>();
  const externeHosts: Record<string, number> = {};
  const klantNorm = new Set<string>();

  const nieuw = (urlNorm: string, soort: Kandidaat['soort'], documentSoort: DocumentSoort | null, diepte: number): Kandidaat => ({
    urlNorm,
    soort,
    documentSoort,
    bronnen: [],
    status: 'kandidaat',
    reden: null,
    dubbelVan: null,
    httpStatus: null,
    contentType: null,
    eindUrl: null,
    titel: null,
    canonical: null,
    taal: null,
    noindex: false,
    grootte: null,
    aanwijzingen: null,
    vingerafdruk: null,
    gevondenOp: [],
    varianten: [],
    ingrepen: [],
    diepte,
    waarschuwing: null,
  });

  const registreer = (href: string, basis: string, bron: Bron, diepte: number, gevondenOp?: string): Kandidaat | null => {
    let abs: string;
    try {
      abs = new URL(href, basis).toString();
    } catch {
      return null;
    }
    const n = normaliseer(abs, basis, ctx);
    if (!n) return null;
    const host = new URL(n.urlNorm).hostname;

    // Een pagina op een andere site is geen kandidaat. Alleen verwante subdomeinen
    // (mijn.heuvelrug.nl naast www.heuvelrug.nl) komen in beeld, als uitgesloten, zodat
    // te zien is dat ze er zijn. De rest telt alleen mee in `externeHosts`.
    const isKlant = bron === 'klant';
    // Uitzondering: wat in de scope uitdrukkelijk buiten scope staat, blijft zichtbaar, ook
    // op een ander domein (www.samenopdeheuvelrug.nl bij UTHEU-01).
    if (n.soort === 'html' && !siteHosts.has(host) && !isKlant) {
      if (hoofddomein(host) !== verwant && !uitgeslotenDoor(n.urlNorm, regels)) {
        externeHosts[host] = (externeHosts[host] || 0) + 1;
        return null;
      }
    }

    ruw.add(abs.split('#')[0]);
    let k = reg.get(n.urlNorm);
    if (!k) {
      k = nieuw(n.urlNorm, n.soort, n.documentSoort, diepte);
      reg.set(n.urlNorm, k);
      if (n.soort === 'html' && !siteHosts.has(host) && !isKlant) {
        k.status = 'uitgesloten';
        k.reden = `ander subdomein (${host})`;
      }
    }
    if (!k.bronnen.includes(bron)) k.bronnen.push(bron);
    if (isKlant) klantNorm.add(n.urlNorm);
    k.diepte = Math.min(k.diepte, diepte);
    const spelling = abs.split('#')[0];
    if (spelling !== n.urlNorm && !k.varianten.includes(spelling)) k.varianten.push(spelling);
    for (const ing of n.ingrepen) if (!k.ingrepen.includes(ing)) k.ingrepen.push(ing);
    if (gevondenOp && !k.gevondenOp.includes(gevondenOp)) k.gevondenOp.push(gevondenOp);
    return k;
  };

  // 4. Zaaien: scope, klant, sitemap. Allemaal diepte 0.
  registreer(invoer.startUrl, invoer.startUrl, 'scope', 0);
  for (const s of invoer.scopeUrls) if (s.inScope) registreer(s.url, s.url, 'scope', 0);
  for (const u of invoer.klantUrls) registreer(u, u, 'klant', 0);

  const sm = await leesSitemaps(`https://${canonHost}/`, async (url) => {
    const r = await haal(url, o, 'GET', jar);
    return 'fout' in r ? r : { status: r.status, tekst: r.tekst, contentType: r.contentType };
  });
  for (const u of sm.urls) registreer(u, u, 'sitemap', 0);
  meld(`Sitemap: ${sm.urls.length} adressen uit ${sm.gelezen.filter((g) => g.aantal).length} sitemap(s).`);

  // Zonder sitemap moeten de links het werk doen: twee niveaus diep. Met sitemap is één
  // niveau genoeg om wat de sitemap mist (vaak de klantpagina's en formulieren) te vinden.
  const linkDiepte = sm.urls.length ? 1 : 2;

  // 5. Pagina's ophalen, diepte voor diepte.
  const opgehaald = new Set<string>();
  let aantalOpgehaald = 0;
  for (let d = 0; d <= linkDiepte; d++) {
    const teDoen = [...reg.values()]
      .filter((k) => k.soort === 'html' && k.status === 'kandidaat' && k.diepte === d && !opgehaald.has(k.urlNorm))
      .sort((a, b) => a.urlNorm.localeCompare(b.urlNorm));
    const ruimte = Math.max(0, o.maxPaginas - aantalOpgehaald);
    for (const k of teDoen.slice(ruimte)) {
      k.status = 'niet_opgehaald';
      k.reden = `limiet van ${o.maxPaginas} pagina's bereikt`;
    }
    const nu = teDoen.slice(0, ruimte);
    meld(`Diepte ${d}: ${nu.length} pagina's ophalen.`);
    await metGelijktijdig(nu, o.gelijktijdig, async (k) => {
      opgehaald.add(k.urlNorm);
      aantalOpgehaald++;
      const a = await haal(k.urlNorm, o, 'GET', jar);
      if ('fout' in a) {
        k.status = 'niet_opgehaald';
        k.reden = a.fout;
        return;
      }
      k.httpStatus = a.status;
      k.contentType = a.contentType.split(';')[0].trim() || null;
      k.eindUrl = a.eindUrl;
      k.grootte = a.grootte;
      if (a.status >= 400) {
        k.status = 'niet_opgehaald';
        k.reden = `HTTP ${a.status}`;
        return;
      }
      if (/pdf|msword|officedocument|opendocument|rtf/i.test(a.contentType)) {
        k.soort = 'document';
        k.documentSoort = k.documentSoort || (/pdf/i.test(a.contentType) ? 'pdf' : null);
        return;
      }
      if (!/html/i.test(a.contentType)) {
        k.status = 'uitgesloten';
        k.reden = `geen pagina (${k.contentType || 'onbekend type'})`;
        return;
      }
      const lez = leesPagina(a.tekst, a.eindUrl);
      k.titel = lez.titel;
      k.canonical = lez.canonical;
      k.taal = lez.taal;
      k.noindex = lez.noindex;
      k.aanwijzingen = lez.aanwijzingen;
      k.vingerafdruk = maakVingerafdruk(a.tekst);
      for (const link of lez.links) {
        const n = normaliseer(link, a.eindUrl, ctx);
        if (!n) continue;
        // Documenten altijd; pagina's alleen binnen de ophaaldiepte.
        if (n.soort === 'document' || d + 1 <= linkDiepte) registreer(link, a.eindUrl, 'link', d + 1, k.urlNorm);
      }
    });
  }

  // 6. Doorverwijzingen samenvoegen: /home die naar / gaat, http die naar https gaat.
  const volg = (u: string) => {
    let k = reg.get(u);
    const gezien = new Set<string>();
    while (k && k.dubbelVan && !gezien.has(k.urlNorm)) {
      gezien.add(k.urlNorm);
      k = reg.get(k.dubbelVan);
    }
    return k;
  };
  const voegSamen = (van: Kandidaat, naar: Kandidaat, reden: string) => {
    van.status = 'dubbel';
    van.dubbelVan = naar.urlNorm;
    van.reden = reden;
    for (const b of van.bronnen) if (!naar.bronnen.includes(b)) naar.bronnen.push(b);
    if (!naar.varianten.includes(van.urlNorm)) naar.varianten.push(van.urlNorm);
    if (klantNorm.has(van.urlNorm)) klantNorm.add(naar.urlNorm);
  };

  for (const k of [...reg.values()].sort((a, b) => a.urlNorm.localeCompare(b.urlNorm))) {
    if (!k.eindUrl || k.status === 'niet_opgehaald') continue;
    const eind = normaliseer(k.eindUrl, k.eindUrl, ctx);
    if (!eind || eind.urlNorm === k.urlNorm) continue;
    const eindHost = new URL(eind.urlNorm).hostname;
    if (!siteHosts.has(eindHost) && eind.soort === 'html') {
      if (klantNorm.has(k.urlNorm)) {
        k.waarschuwing = `verwijst door naar een ander domein (${eindHost})`;
      } else {
        k.status = 'uitgesloten';
        k.reden = `doorverwijzing naar ander domein (${eindHost})`;
      }
      continue;
    }
    const doel: Kandidaat = reg.get(eind.urlNorm) ?? {
      ...k,
      urlNorm: eind.urlNorm,
      bronnen: ['doorverwijzing'],
      varianten: [],
      gevondenOp: [],
      ingrepen: [],
      dubbelVan: null,
      reden: null,
      waarschuwing: null,
    };
    reg.set(eind.urlNorm, doel);
    voegSamen(k, doel, 'doorverwijzing');
  }

  // 7. Canonicals. Een CMS dat op elke pagina dezelfde canonical zet (vaak de homepage)
  //    zou alles tot één pagina samenvoegen; dan negeren we ze allemaal.
  const htmlOk = [...reg.values()].filter((k) => k.soort === 'html' && k.status === 'kandidaat');
  const perCanonical = new Map<string, number>();
  for (const k of htmlOk) {
    if (!k.canonical) continue;
    const c = normaliseer(k.canonical, k.canonical, ctx);
    if (c && c.urlNorm !== k.urlNorm) perCanonical.set(c.urlNorm, (perCanonical.get(c.urlNorm) || 0) + 1);
  }
  const drempel = Math.max(3, Math.floor(htmlOk.length / 2));
  const verdacht = [...perCanonical.entries()].find(([, n]) => n > drempel);
  const canonicalGenegeerd = verdacht ? `${verdacht[1]} pagina's wijzen dezelfde canonical aan (${verdacht[0]}); canonicals niet gebruikt` : null;
  if (!verdacht) {
    for (const k of htmlOk.sort((a, b) => a.urlNorm.localeCompare(b.urlNorm))) {
      if (!k.canonical || k.status !== 'kandidaat') continue;
      const c = normaliseer(k.canonical, k.canonical, ctx);
      if (!c || c.urlNorm === k.urlNorm) continue;
      const doel = volg(c.urlNorm);
      // Alleen samenvoegen met een pagina die zelf in de pool staat en bestaat.
      if (doel && doel !== k && doel.status === 'kandidaat' && doel.soort === 'html') voegSamen(k, doel, 'canonical');
    }
  }

  // 8. Uitsluitregels toepassen. Een klantpagina gaat voor: die blijft, met een waarschuwing.
  for (const k of reg.values()) {
    if (k.status === 'dubbel') continue;
    const regel = uitgeslotenDoor(k.urlNorm, regels);
    if (!regel) continue;
    if (klantNorm.has(k.urlNorm)) {
      k.waarschuwing = `door de klant aangedragen, maar valt onder buiten scope (${regel.bron})`;
      continue;
    }
    k.status = 'uitgesloten';
    k.reden = `buiten scope (${regel.bron})`;
  }

  // 9. Documenten: alleen de kop ophalen. Of het een PDF is en of hij bestaat.
  const docs = [...reg.values()]
    .filter((k) => k.soort === 'document' && k.status === 'kandidaat' && k.httpStatus == null)
    .sort((a, b) => a.urlNorm.localeCompare(b.urlNorm));
  for (const k of docs.slice(o.maxDocumenten)) {
    k.status = 'niet_opgehaald';
    k.reden = `limiet van ${o.maxDocumenten} documenten bereikt`;
  }
  meld(`Documenten: ${Math.min(docs.length, o.maxDocumenten)} controleren.`);
  await metGelijktijdig(docs.slice(0, o.maxDocumenten), o.gelijktijdig, async (k) => {
    let a = await haal(k.urlNorm, o, 'HEAD', jar);
    if (!('fout' in a) && (a.status === 405 || a.status === 403)) a = await haal(k.urlNorm, o, 'GET', jar);
    if ('fout' in a) {
      k.status = 'niet_opgehaald';
      k.reden = a.fout;
      return;
    }
    k.httpStatus = a.status;
    k.contentType = a.contentType.split(';')[0].trim() || null;
    k.eindUrl = a.eindUrl;
    k.grootte = a.grootte;
    if (a.status >= 400) {
      k.status = 'niet_opgehaald';
      k.reden = `HTTP ${a.status}`;
    }
  });

  // Klantpagina's blijven in de pool, ook als ophalen mislukte: die gaan sowieso mee.
  for (const u of klantNorm) {
    const k = reg.get(u);
    if (!k || k.status !== 'niet_opgehaald') continue;
    k.waarschuwing = `door de klant aangedragen, maar niet op te halen: ${k.reden}`;
    k.status = 'kandidaat';
    k.reden = null;
  }

  // 10. Vaste volgorde, en een vingerafdruk van de pool.
  const kandidaten = [...reg.values()]
    .map((k) => ({
      ...k,
      // Een keten (oud adres -> nieuw adres?origin=oud -> canonical) wijst naar het eindpunt.
      dubbelVan: k.dubbelVan ? volg(k.dubbelVan)?.urlNorm ?? k.dubbelVan : null,
      bronnen: BRONVOLGORDE.filter((b) => k.bronnen.includes(b)),
      gevondenOp: [...k.gevondenOp].sort().slice(0, 3),
      varianten: [...new Set(k.varianten)].sort().slice(0, 5),
      ingrepen: [...k.ingrepen].sort(),
    }))
    .sort((a, b) => a.urlNorm.localeCompare(b.urlNorm));

  const hash = (regels: string[]) => createHash('sha256').update(regels.join('\n')).digest('hex').slice(0, 16);
  const poolHash = hash(kandidaten.map((k) => `${k.urlNorm}\t${k.soort}\t${k.status}\t${k.dubbelVan || ''}`));
  const kandidatenHash = hash(kandidaten.filter((k) => k.status === 'kandidaat').map((k) => k.urlNorm));

  return {
    versies: { inventaris: INVENTARIS_VERSIE, normalisatie: NORMALISATIE_VERSIE, aanwijzingen: AANWIJZINGEN_VERSIE, vingerafdruk: VINGERAFDRUK_VERSIE },
    startUrl: invoer.startUrl,
    canonHost,
    aliassen: [...aliassen].sort(),
    linkDiepte,
    sitemap: { ...sm, urls: [], aantalUrls: sm.urls.length },
    uitsluitregels: regels,
    kandidaten,
    externeHosts: Object.fromEntries(Object.entries(externeHosts).sort(([a], [b]) => a.localeCompare(b))),
    ruwGevonden: ruw.size,
    poolHash,
    kandidatenHash,
    canonicalGenegeerd,
    gestartOp,
    klaarOp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Samenvatting: de getallen waar de onderzoeker naar kijkt.
// ---------------------------------------------------------------------------

export interface InventarisSamenvatting {
  ruwGevonden: number;
  uniek: number;
  perStatus: Record<Status, number>;
  perBron: Record<Bron, number>;
  uitgeslotenPerReden: Record<string, number>;
  dubbelPerReden: Record<string, number>;
  nietOpgehaaldPerReden: Record<string, number>;
  documenten: { totaal: number; kandidaat: number; perSoort: Record<string, number>; perHost: Record<string, number> };
  htmlKandidaten: number;
  aanwijzingen: { formulier: number; tabel: number; video: number; kaart: number; iframe: number; documentlinks: number };
  /** Hoeveel van die aanwijzingen er ALLEEN uit de meegestuurde paginadata kwamen (fase 2a). */
  alleenUitPaginadata: { video: number; kaart: number; iframe: number };
  klantpaginas: { url: string; urlNorm: string | null; status: Status | 'ontbreekt'; waarschuwing: string | null }[];
  poolHash: string;
  kandidatenHash: string;
}

export function vatSamen(r: InventarisResultaat, klantUrls: string[]): InventarisSamenvatting {
  const tel = (m: Record<string, number>, k: string) => (m[k] = (m[k] || 0) + 1);
  const groep = (reden: string | null) => (reden || 'onbekend').replace(/\s*\(.*\)$/, '');
  const perStatus = { kandidaat: 0, uitgesloten: 0, dubbel: 0, niet_opgehaald: 0 } as Record<Status, number>;
  const perBron = { klant: 0, scope: 0, sitemap: 0, link: 0, doorverwijzing: 0 } as Record<Bron, number>;
  const uitgesloten: Record<string, number> = {};
  const dubbel: Record<string, number> = {};
  const niet: Record<string, number> = {};
  const perSoort: Record<string, number> = {};
  const perHost: Record<string, number> = {};
  let docTotaal = 0;
  let docKandidaat = 0;
  const aw = { formulier: 0, tabel: 0, video: 0, kaart: 0, iframe: 0, documentlinks: 0 };
  const pd = { video: 0, kaart: 0, iframe: 0 };
  let htmlKandidaten = 0;

  for (const k of r.kandidaten) {
    perStatus[k.status]++;
    for (const b of k.bronnen) perBron[b]++;
    if (k.status === 'uitgesloten') tel(uitgesloten, groep(k.reden));
    if (k.status === 'dubbel') tel(dubbel, k.reden || 'onbekend');
    if (k.status === 'niet_opgehaald') tel(niet, groep(k.reden));
    if (k.soort === 'document' && k.status !== 'dubbel') {
      docTotaal++;
      if (k.status === 'kandidaat') {
        docKandidaat++;
        tel(perSoort, k.documentSoort || 'onbekend');
        tel(perHost, new URL(k.urlNorm).hostname);
      }
    }
    if (k.soort === 'html' && k.status === 'kandidaat') {
      htmlKandidaten++;
      const a = k.aanwijzingen;
      if (a) {
        if (a.formulieren > 0) aw.formulier++;
        if (a.tabellen > 0) aw.tabel++;
        const p = a.paginadata;
        if (a.video > 0 || (p?.video || 0) > 0) aw.video++;
        if ((p?.kaart || 0) > 0) aw.kaart++;
        if (a.iframes > 0 || (p?.iframe || 0) > 0) aw.iframe++;
        if (!(a.video > 0) && (p?.video || 0) > 0) pd.video++;
        if ((p?.kaart || 0) > 0) pd.kaart++;
        if (!(a.iframes > 0) && (p?.iframe || 0) > 0) pd.iframe++;
        if (a.documentlinks > 0) aw.documentlinks++;
      }
    }
  }

  const ctx = sitecontextVoor(`https://${r.canonHost}/`, r.aliassen);
  const perNorm = new Map(r.kandidaten.map((k) => [k.urlNorm, k]));
  const klantpaginas = klantUrls.map((u) => {
    const n = normaliseer(u, u, ctx);
    let k = n ? perNorm.get(n.urlNorm) : undefined;
    while (k && k.status === 'dubbel' && k.dubbelVan) k = perNorm.get(k.dubbelVan);
    return { url: u, urlNorm: k?.urlNorm ?? n?.urlNorm ?? null, status: (k?.status ?? 'ontbreekt') as Status | 'ontbreekt', waarschuwing: k?.waarschuwing ?? null };
  });

  return {
    ruwGevonden: r.ruwGevonden,
    uniek: r.kandidaten.length,
    perStatus,
    perBron,
    uitgeslotenPerReden: uitgesloten,
    dubbelPerReden: dubbel,
    nietOpgehaaldPerReden: niet,
    documenten: { totaal: docTotaal, kandidaat: docKandidaat, perSoort, perHost },
    htmlKandidaten,
    aanwijzingen: aw,
    alleenUitPaginadata: pd,
    klantpaginas,
    poolHash: r.poolHash,
    kandidatenHash: r.kandidatenHash,
  };
}
