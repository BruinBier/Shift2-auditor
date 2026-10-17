/**
 * Controle van wat de schermen opsturen, vóór het de database in gaat. Los van
 * de routes zodat het te testen is.
 *
 * Criteria worden gecontroleerd tegen `wcag_criteria` (besluit 5); een
 * onbekende code wordt geweigerd met de code erbij.
 */
import type { Herkomst, Oordeel, PatroonStatus, WcagVersie } from '@prisma/client';

const OORDELEN: Oordeel[] = ['afkeur', 'geen_afkeur', 'advies', 'twijfel'];
const HERKOMSTEN: Herkomst[] = ['template', 'content', 'configuratie', 'extern'];
const VERSIES: WcagVersie[] = ['wcag_2_0', 'wcag_2_1', 'wcag_2_2'];
const STATUSSEN: PatroonStatus[] = ['concept', 'vastgesteld'];

type Ruw = Record<string, unknown>;

function tekst(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Een lijst uit een array of uit tekst met komma's of regels. */
export function lijst(v: unknown): string[] {
  const ruw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\n]/) : [];
  const uit: string[] = [];
  for (const x of ruw) {
    const s = String(x).trim();
    if (s && !uit.includes(s)) uit.push(s);
  }
  return uit;
}

export type PatroonData = {
  titel: string;
  omschrijving: string;
  criteria: string[];
  oordeel: Oordeel;
  onderbouwing: string;
  technieken: string[];
  herkomst: Herkomst;
  wcag: WcagVersie[];
  standaardTekst: string;
  advies: string;
  tags: string[];
  status: PatroonStatus;
  vastgesteldDoor: string | null;
};

export function controleerPatroon(
  ruw: Ruw,
  bekendeCriteria: Set<string>,
): { fouten: string[]; data: PatroonData } {
  const fouten: string[] = [];
  const titel = tekst(ruw.titel).trim();
  if (!titel) fouten.push('Titel is verplicht.');

  const criteria = lijst(ruw.criteria);
  if (criteria.length === 0) fouten.push('Minstens één criterium is verplicht.');
  for (const c of criteria) {
    if (!bekendeCriteria.has(c)) fouten.push(`Criterium ${c} staat niet in de lijst van WCAG-criteria.`);
  }

  const oordeel = tekst(ruw.oordeel) as Oordeel;
  if (!OORDELEN.includes(oordeel)) fouten.push('Kies een oordeel.');
  const herkomst = tekst(ruw.herkomst) as Herkomst;
  if (!HERKOMSTEN.includes(herkomst)) fouten.push('Kies een herkomst.');

  const wcag = lijst(ruw.wcag) as WcagVersie[];
  if (wcag.length === 0) fouten.push('Kies minstens één WCAG-versie.');
  for (const v of wcag) if (!VERSIES.includes(v)) fouten.push(`Onbekende WCAG-versie ${v}.`);

  const status = (tekst(ruw.status) || 'concept') as PatroonStatus;
  if (!STATUSSEN.includes(status)) fouten.push(`Onbekende status ${status}.`);
  const vastgesteldDoor = tekst(ruw.vastgesteldDoor).trim() || null;
  if (status === 'vastgesteld') {
    if (!vastgesteldDoor) fouten.push('Vul in wie het patroon vaststelt.');
    if (oordeel === 'twijfel') fouten.push('Een patroon met oordeel twijfel kan niet vastgesteld worden.');
  }

  return {
    fouten,
    data: {
      titel,
      omschrijving: tekst(ruw.omschrijving),
      criteria,
      oordeel,
      onderbouwing: tekst(ruw.onderbouwing),
      technieken: lijst(ruw.technieken),
      herkomst,
      wcag,
      standaardTekst: tekst(ruw.standaardTekst),
      advies: tekst(ruw.advies),
      tags: lijst(ruw.tags).map((t) => t.toLowerCase()),
      status,
      vastgesteldDoor: status === 'vastgesteld' ? vastgesteldDoor : null,
    },
  };
}

/** 'P-131-rijkop-als-td' uit criterium en titel. */
export function patroonId(criteria: string[], titel: string, bestaand: Set<string>): string {
  const sc = (criteria[0] ?? '').replace(/\./g, '');
  const slug = titel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '');
  const basis = `P-${sc}-${slug || 'patroon'}`;
  let id = basis;
  for (let n = 2; bestaand.has(id); n++) id = `${basis}-${n}`;
  return id;
}

export type CasusData = {
  titel: string;
  html: string;
  css: string | null;
  js: string | null;
  correcteCode: string;
  uitleg: string;
  isValkuil: boolean;
  categorie: string | null;
  oefensets: string[];
  volgorde: number;
};

export function controleerCasus(ruw: Ruw, bekendeOefensets: Set<string>): { fouten: string[]; data: CasusData } {
  const fouten: string[] = [];
  const titel = tekst(ruw.titel).trim();
  if (!titel) fouten.push('Titel is verplicht.');
  const html = tekst(ruw.html);
  if (!html.trim()) fouten.push('Het testgebied (HTML) is leeg.');
  const oefensets = lijst(ruw.oefensets);
  for (const s of oefensets) if (!bekendeOefensets.has(s)) fouten.push(`Oefenset ${s} bestaat niet.`);
  const volgorde = Number(ruw.volgorde ?? 0);
  if (!Number.isInteger(volgorde)) fouten.push('Volgorde moet een heel getal zijn.');
  return {
    fouten,
    data: {
      titel,
      html,
      css: tekst(ruw.css).trim() ? tekst(ruw.css) : null,
      js: tekst(ruw.js).trim() ? tekst(ruw.js) : null,
      correcteCode: tekst(ruw.correcteCode),
      uitleg: tekst(ruw.uitleg),
      isValkuil: ruw.isValkuil === true,
      categorie: tekst(ruw.categorie).trim() || null,
      oefensets,
      volgorde: Number.isInteger(volgorde) ? volgorde : 0,
    },
  };
}

/** Een nieuw casus-id: '<oefenset>-N1', of 'C-N1' zonder oefenset. */
export function casusId(oefensets: string[], bestaand: Set<string>): string {
  const prefix = oefensets[0] ?? 'C';
  let n = 1;
  while (bestaand.has(`${prefix}-N${n}`)) n++;
  return `${prefix}-N${n}`;
}
