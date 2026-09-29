import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEKKING_VERSIE, herkenGebieden, type GebiedTreffer } from './dekking';
import { PROFIELKEUZE_VERSIE, type Reden } from './profielkeuze';

/**
 * Paginaprofielen (steekproefselectie v2, fase 2): hulpfuncties rond de browsermeting.
 *
 * De meting zelf staat in `profiel-meting.browser.js` en draait in de pagina. De CLI
 * (`npm run cli -- steekproef-profiel`) opent de pagina's in de auditsessie en slaat de
 * uitkomst op. Hier: het script inlezen, de gebieden erbij zoeken, en samenvatten.
 *
 * Meten, niet kiezen. Niets hier bepaalt de steekproef.
 */

/** Verhoog bij elke wijziging aan wat er gemeten wordt (profiel-meting.browser.js). */
export const PROFIEL_VERSIE = 2; // 2: geen kaartjes in uitklapblokken, geen galerij in een overzicht, geen banner als foto in tekst

export const PROFIEL_VERSIES = {
  profiel: PROFIEL_VERSIE,
  dekking: DEKKING_VERSIE,
  profielkeuze: PROFIELKEUZE_VERSIE,
};

export function leesMeetscript(): string {
  return readFileSync(join(process.cwd(), 'lib', 'steekproef', 'profiel-meting.browser.js'), 'utf8')
    .replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '')
    .trim();
}

export interface PaginaMeting {
  url: string;
  titel: string;
  bereik: 'main' | 'body';
  htmlTaal: string | null;
  gehydrateerd: boolean;
  cookiescherm: { tekst: string; dekking: number } | null;
  kenmerken: any;
}

export function gebiedenVoor(m: PaginaMeting): GebiedTreffer[] {
  return herkenGebieden(m.kenmerken, { htmlTaal: m.htmlTaal });
}

/** De vier kenmerken waar het stop/go-criterium over gaat, plus iframe en documentlinks. */
export interface Kerntelling {
  formulier: number;
  tabel: number;
  video: number;
  iframe: number;
  /** Kaart in een iframe of kaartcomponent, ook achter een toestemmingsscherm (G29). */
  kaart: number;
  documentlinks: number;
}

export function kerntellingGemeten(k: any): Kerntelling {
  return {
    formulier: (k?.aantalFormulieren || 0) + (k?.iframeSoorten?.formulier || 0),
    tabel: k?.aantalTabellen || 0,
    video: k?.aantalVideos || 0,
    iframe: k?.aantalIframes || 0,
    kaart: (k?.iframeSoorten?.kaart || 0) + (k?.kaartenZonderIframe?.length || 0) || (k?.geblokkeerd || []).filter((g: any) => g.soort === 'kaart').length,
    documentlinks: k?.aantalDocumentlinks || 0,
  };
}

export function kerntellingStatisch(a: any): Kerntelling {
  return {
    formulier: a?.formulieren || 0,
    tabel: a?.tabellen || 0,
    // Statisch = de HTML-telling plus de meegestuurde paginadata (fase 2a).
    video: (a?.video || 0) + (a?.paginadata?.video || 0),
    iframe: (a?.iframes || 0) + (a?.paginadata?.iframe || 0),
    kaart:
      (a?.paginadata?.kaart || 0) +
      (a?.iframeDomeinen || []).filter((d: string) => /(^|\.)(maps\.google\.[a-z.]+|openstreetmap\.org|arcgis\.com|mapbox\.com|smartmap\.nl|pdok\.nl|kaartviewer\.nl)$/i.test(d)).length,
    documentlinks: a?.documentlinks || 0,
  };
}

/**
 * Wat de browser vond en de statische inventarisatie niet: per kenmerk "statisch 0,
 * gemeten > 0". Precies de vraag of de gespreide laag iets oplevert.
 */
export function browserVondMeer(statisch: Kerntelling, gemeten: Kerntelling): (keyof Kerntelling)[] {
  return (Object.keys(gemeten) as (keyof Kerntelling)[]).filter((k) => statisch[k] === 0 && gemeten[k] > 0);
}

export interface ProfielSamenvatting {
  htmlKandidaten: number;
  budget: number;
  gepland: number;
  gemeten: number;
  mislukt: number;
  perReden: Record<string, number>;
  perLaag: Record<string, number>;
  paginasMet: Kerntelling;
  paginasMetGebied: Record<string, number>;
  browserVondMeer: { urlNorm: string; laag: string; redenen: Reden[]; kenmerken: string[] }[];
  cookiescherm: number;
  documenten: { gepland: number; gemeten: number; metFormuliervelden: number; perGeschatteSoort: Record<string, number> };
  duurSeconden: number | null;
}

export function vatProfielenSamen(
  profielen: {
    urlNorm: string;
    soort: string;
    status: string;
    laag: string | null;
    redenen: string[];
    statisch: any;
    kenmerken: any;
    gebieden: any;
    document: any;
    cookiescherm: any;
  }[],
  uitleg: { htmlKandidaten?: number; budget?: number } = {},
  duurSeconden: number | null = null,
): ProfielSamenvatting {
  const html = profielen.filter((p) => p.soort === 'html');
  const docs = profielen.filter((p) => p.soort === 'document');
  const perReden: Record<string, number> = {};
  const perLaag: Record<string, number> = {};
  const paginasMet: Kerntelling = { formulier: 0, tabel: 0, video: 0, iframe: 0, kaart: 0, documentlinks: 0 };
  const paginasMetGebied: Record<string, number> = {};
  const vondMeer: ProfielSamenvatting['browserVondMeer'] = [];
  for (const p of html) {
    for (const r of p.redenen) perReden[r] = (perReden[r] || 0) + 1;
    perLaag[p.laag || '?'] = (perLaag[p.laag || '?'] || 0) + 1;
    if (p.status !== 'gemeten') continue;
    const g = kerntellingGemeten(p.kenmerken);
    for (const k of Object.keys(g) as (keyof Kerntelling)[]) if (g[k] > 0) paginasMet[k]++;
    for (const t of (p.gebieden || []) as GebiedTreffer[]) paginasMetGebied[`${t.gebied} ${t.naam}`] = (paginasMetGebied[`${t.gebied} ${t.naam}`] || 0) + 1;
    const meer = browserVondMeer(kerntellingStatisch(p.statisch), g);
    if (meer.length) vondMeer.push({ urlNorm: p.urlNorm, laag: p.laag || '?', redenen: p.redenen as Reden[], kenmerken: meer });
  }
  const perSoort: Record<string, number> = {};
  for (const d of docs) perSoort[d.document?.geschatteSoort || '?'] = (perSoort[d.document?.geschatteSoort || '?'] || 0) + 1;
  return {
    htmlKandidaten: uitleg.htmlKandidaten ?? 0,
    budget: uitleg.budget ?? 0,
    gepland: html.length,
    gemeten: html.filter((p) => p.status === 'gemeten').length,
    mislukt: html.filter((p) => p.status === 'mislukt').length,
    perReden,
    perLaag,
    paginasMet,
    paginasMetGebied: Object.fromEntries(Object.entries(paginasMetGebied).sort(([a], [b]) => a.localeCompare(b))),
    browserVondMeer: vondMeer,
    cookiescherm: html.filter((p) => p.cookiescherm).length,
    documenten: {
      gepland: docs.length,
      gemeten: docs.filter((d) => d.status === 'gemeten').length,
      metFormuliervelden: docs.filter((d) => (d.document?.formuliervelden || 0) > 0).length,
      perGeschatteSoort: perSoort,
    },
    duurSeconden,
  };
}
