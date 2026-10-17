/**
 * Van seed-bibliotheek.json naar rijen voor de database, zonder database.
 *
 * Alles wat fout kan gaan wordt hier gecontroleerd, vóór er iets wordt
 * geschreven: verwijzingen tussen patronen, casussen, bronnen en oefensets,
 * criteria tegen `wcag_criteria` (besluit 5), en de afbeeldingen. Het script
 * scripts/seed-bibliotheek.ts schrijft alleen als `fouten` leeg is.
 *
 * De oordelen in de seed zijn voorstellen en worden letterlijk overgenomen
 * (OPDRACHT-FASE-1.md). Hier wordt alleen de vorm omgezet: 'geen-afkeur' wordt
 * de enumwaarde `geen_afkeur`, '2.0 en 2.1' wordt een lijst, een data-URI
 * wordt bytes.
 */
import type {
  BronStatus,
  Herkomst,
  Oordeel,
  Overeenstemming,
  PatroonStatus,
  Rapportvorm,
  WcagVersie,
} from '@prisma/client';
import {
  berekenOvereenstemming,
  type OordeelWaarde,
  type OvereenstemmingWaarde,
} from './overeenstemming';

// --- De vorm van het seedbestand ------------------------------------------

export type SeedPatroon = {
  id: string;
  titel: string;
  omschrijving: string;
  criteria: string[];
  oordeel: OordeelWaarde;
  onderbouwing: string;
  technieken: string[];
  herkomst: string;
  wcag: string[];
  standaardTekst: string;
  advies: string;
  tags: string[];
  status: string;
  vastgesteldDoor?: string;
  vastgesteldOp?: string;
  /** Afgeleid uit de casussen; vervalt bij import. */
  casussen?: string[];
};

export type SeedCasus = {
  id: string;
  patroonId: string;
  titel: string;
  html: string;
  css?: string | null;
  js?: string | null;
  correcteCode: string;
  uitleg: string;
  isValkuil: boolean;
  oefenset: string[];
  volgorde: number;
};

export type SeedOefenset = { id: string; titel: string; paginaCss: string };

export type SeedAuditor = {
  id: string;
  naam: string;
  rapportvorm: string;
  rapportOverzicht?: string;
};

export type SeedBron = {
  id: string;
  organisatie: string;
  onderdeel: string;
  auditorId: string | null;
  auditorZeker?: boolean;
  type: string;
  wcag: string | null;
  datum: string | null;
  url: string;
  bestand?: string;
  hoofdsite: boolean;
  cms?: string;
  vertrouwelijk: boolean;
  status: string;
};

export type SeedRapportBevinding = {
  id: string;
  bronId: string;
  patroonId: string;
  casusId?: string | null;
  rapportCriteria: string[];
  rapportOordeel: OordeelWaarde;
  rapportSamenvatting?: string;
  shift2Samenvatting?: string;
  citaat: string;
  pagina?: string;
  overeenstemming: OvereenstemmingWaarde;
  toelichting?: string;
};

export type Seed = {
  versie: number;
  auditors: SeedAuditor[];
  patronen: SeedPatroon[];
  casussen: SeedCasus[];
  oefensets: SeedOefenset[];
  /** Bestandsnaam → data-URI. */
  afbeeldingen: Record<string, string>;
  bronnen: SeedBron[];
  rapportBevindingen: SeedRapportBevinding[];
};

/** Wat fase 1 verwacht (SPEC.md, acceptatiecriteria). */
export const VERWACHTE_AANTALLEN = {
  patronen: 69,
  casussen: 78,
  auditors: 5,
  bronnen: 84,
  rapportBevindingen: 30,
  oefensets: 5,
  afbeeldingen: 21,
} as const;

// --- Omzetten naar enumwaarden --------------------------------------------

const OORDELEN: Record<string, Oordeel> = {
  afkeur: 'afkeur',
  'geen-afkeur': 'geen_afkeur',
  advies: 'advies',
  twijfel: 'twijfel',
};

const HERKOMSTEN: Record<string, Herkomst> = {
  template: 'template',
  content: 'content',
  configuratie: 'configuratie',
  extern: 'extern',
};

const VERSIES: Record<string, WcagVersie> = {
  '2.0': 'wcag_2_0',
  '2.1': 'wcag_2_1',
  '2.2': 'wcag_2_2',
};

const PATROONSTATUSSEN: Record<string, PatroonStatus> = {
  concept: 'concept',
  vastgesteld: 'vastgesteld',
};

const BRONSTATUSSEN: Record<string, BronStatus> = {
  gevonden: 'gevonden',
  gedownload: 'gedownload',
  verwerkt: 'verwerkt',
};

const RAPPORTVORMEN: Record<string, Rapportvorm> = { pdf: 'pdf', online: 'online' };

const OVEREENSTEMMINGEN: Record<string, Overeenstemming> = {
  eens: 'eens',
  'ander-criterium': 'ander_criterium',
  'te-streng': 'te_streng',
  'te-soepel': 'te_soepel',
};

/** '2.0 en 2.1' → ['2.0', '2.1']; null → []. */
export function leesVersies(tekst: string | null): string[] {
  if (!tekst) return [];
  return tekst.match(/2\.[012]/g) ?? [];
}

/** Een data-URI als bytes, met het MIME-type uit de URI zelf. */
export function leesDataUri(uri: string): { mimeType: string; data: Buffer } | null {
  const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(uri);
  if (!m) return null;
  const [, mimeType, base64, inhoud] = m;
  const data = base64
    ? Buffer.from(inhoud, 'base64')
    : Buffer.from(decodeURIComponent(inhoud), 'utf8');
  return { mimeType, data };
}

/**
 * Bestandsnamen waar casus-HTML of -CSS naar verwijst (src, href, url()).
 * Ankers, volledige URL's en data-URI's tellen niet mee.
 */
export function verwijzingenInCasus(casus: Pick<SeedCasus, 'html' | 'css'>): string[] {
  const tekst = casus.html + '\n' + (casus.css ?? '');
  const namen: string[] = [];
  const patroon = /(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)["']?\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = patroon.exec(tekst)) !== null) {
    const waarde = (m[1] ?? m[2]).trim();
    if (!waarde || waarde.startsWith('#')) continue;
    if (/^(?:[a-z]+:|\/\/)/i.test(waarde)) continue;
    if (!namen.includes(waarde)) namen.push(waarde);
  }
  return namen;
}

// --- Voorbereiden ---------------------------------------------------------

export type Voorbereid = {
  fouten: string[];
  waarschuwingen: string[];
  aantallen: Record<keyof typeof VERWACHTE_AANTALLEN, number>;
  rijen: {
    auditors: {
      id: string;
      naam: string;
      rapportvorm: Rapportvorm;
      rapportOverzicht: string | null;
    }[];
    oefensets: { id: string; titel: string; paginaCss: string }[];
    patronen: {
      id: string;
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
      vastgesteldOp: Date | null;
    }[];
    casussen: {
      id: string;
      patroonId: string;
      titel: string;
      html: string;
      css: string | null;
      js: string | null;
      correcteCode: string;
      uitleg: string;
      isValkuil: boolean;
      oefensets: string[];
      volgorde: number;
    }[];
    bronnen: {
      id: string;
      organisatie: string;
      onderdeel: string;
      auditorId: string | null;
      auditorZeker: boolean;
      type: string;
      wcag: WcagVersie[];
      datum: string | null;
      url: string;
      bestand: string | null;
      hoofdsite: boolean;
      cms: string | null;
      vertrouwelijk: boolean;
      status: BronStatus;
    }[];
    rapportBevindingen: {
      id: string;
      bronId: string;
      patroonId: string;
      casusId: string | null;
      rapportCriteria: string[];
      rapportOordeel: Oordeel;
      rapportSamenvatting: string | null;
      shift2Samenvatting: string | null;
      citaat: string;
      pagina: string | null;
      overeenstemming: Overeenstemming;
      overeenstemmingHandmatig: boolean;
      toelichting: string | null;
    }[];
    afbeeldingen: { naam: string; mimeType: string; data: Buffer }[];
  };
};

/**
 * @param bekendeCriteria de codes uit `wcag_criteria` ('1.3.1', ...)
 */
export function bereidSeedVoor(seed: Seed, bekendeCriteria: Set<string>): Voorbereid {
  const fouten: string[] = [];
  const waarschuwingen: string[] = [];

  /** Zoekt een enumwaarde op; een onbekende waarde is een fout. */
  function enumWaarde<T>(tabel: Record<string, T>, waarde: string, waar: string): T {
    const uit = tabel[waarde];
    if (uit === undefined) fouten.push(`${waar}: onbekende waarde "${waarde}"`);
    return uit;
  }

  function dubbeleIds(soort: string, ids: string[]) {
    const gezien = new Set<string>();
    for (const id of ids) {
      if (gezien.has(id)) fouten.push(`${soort}: id "${id}" komt twee keer voor`);
      gezien.add(id);
    }
  }

  dubbeleIds('patroon', seed.patronen.map((p) => p.id));
  dubbeleIds('casus', seed.casussen.map((c) => c.id));
  dubbeleIds('oefenset', seed.oefensets.map((o) => o.id));
  dubbeleIds('auditor', seed.auditors.map((a) => a.id));
  dubbeleIds('bron', seed.bronnen.map((b) => b.id));
  dubbeleIds('rapportbevinding', seed.rapportBevindingen.map((r) => r.id));

  const patroonIds = new Map(seed.patronen.map((p) => [p.id, p]));
  const casusIds = new Set(seed.casussen.map((c) => c.id));
  const oefensetIds = new Set(seed.oefensets.map((o) => o.id));
  const auditorIds = new Set(seed.auditors.map((a) => a.id));
  const bronIds = new Set(seed.bronnen.map((b) => b.id));

  const auditors = seed.auditors.map((a) => ({
    id: a.id,
    naam: a.naam,
    rapportvorm: enumWaarde(RAPPORTVORMEN, a.rapportvorm, `auditor ${a.id}`),
    rapportOverzicht: a.rapportOverzicht ?? null,
  }));

  const oefensets = seed.oefensets.map((o) => ({
    id: o.id,
    titel: o.titel,
    paginaCss: o.paginaCss ?? '',
  }));

  const patronen = seed.patronen.map((p) => {
    const waar = `patroon ${p.id}`;
    if (p.criteria.length === 0) fouten.push(`${waar}: geen criteria`);
    for (const code of p.criteria) {
      if (!bekendeCriteria.has(code)) {
        fouten.push(`${waar}: criterium ${code} staat niet in wcag_criteria`);
      }
    }
    return {
      id: p.id,
      titel: p.titel,
      omschrijving: p.omschrijving ?? '',
      criteria: p.criteria,
      oordeel: enumWaarde(OORDELEN, p.oordeel, waar),
      onderbouwing: p.onderbouwing ?? '',
      technieken: p.technieken ?? [],
      herkomst: enumWaarde(HERKOMSTEN, p.herkomst, waar),
      wcag: p.wcag.map((v) => enumWaarde(VERSIES, v, waar)),
      standaardTekst: p.standaardTekst ?? '',
      advies: p.advies ?? '',
      tags: p.tags ?? [],
      status: enumWaarde(PATROONSTATUSSEN, p.status, waar),
      vastgesteldDoor: p.vastgesteldDoor ?? null,
      vastgesteldOp: p.vastgesteldOp ? new Date(p.vastgesteldOp) : null,
    };
  });

  const casussen = seed.casussen.map((c) => {
    const waar = `casus ${c.id}`;
    if (!patroonIds.has(c.patroonId)) fouten.push(`${waar}: patroon ${c.patroonId} bestaat niet`);
    if (c.oefenset.length === 0) waarschuwingen.push(`${waar}: zit in geen enkele oefenset`);
    for (const set of c.oefenset) {
      if (!oefensetIds.has(set)) fouten.push(`${waar}: oefenset ${set} bestaat niet`);
    }
    for (const naam of verwijzingenInCasus(c)) {
      if (!(naam in seed.afbeeldingen)) {
        waarschuwingen.push(`${waar}: verwijst naar "${naam}", die niet bij de afbeeldingen staat`);
      }
    }
    return {
      id: c.id,
      patroonId: c.patroonId,
      titel: c.titel,
      html: c.html,
      css: c.css ?? null,
      js: c.js ?? null,
      correcteCode: c.correcteCode ?? '',
      uitleg: c.uitleg ?? '',
      isValkuil: c.isValkuil,
      oefensets: c.oefenset,
      volgorde: c.volgorde,
    };
  });

  // De afgeleide lijst `patronen[].casussen` vervalt, maar moet wel kloppen.
  for (const p of seed.patronen) {
    for (const casusId of p.casussen ?? []) {
      if (!casusIds.has(casusId)) {
        fouten.push(`patroon ${p.id}: noemt casus ${casusId}, die niet bestaat`);
      }
    }
  }

  const bronnen = seed.bronnen.map((b) => {
    const waar = `bron ${b.id}`;
    if (b.auditorId && !auditorIds.has(b.auditorId)) {
      fouten.push(`${waar}: auditor ${b.auditorId} bestaat niet`);
    }
    return {
      id: b.id,
      organisatie: b.organisatie,
      onderdeel: b.onderdeel ?? '',
      auditorId: b.auditorId,
      auditorZeker: b.auditorZeker ?? true,
      type: b.type ?? '',
      wcag: leesVersies(b.wcag).map((v) => enumWaarde(VERSIES, v, waar)),
      datum: b.datum,
      url: b.url ?? '',
      bestand: b.bestand ?? null,
      hoofdsite: b.hoofdsite,
      cms: b.cms ?? null,
      vertrouwelijk: b.vertrouwelijk,
      status: enumWaarde(BRONSTATUSSEN, b.status, waar),
    };
  });

  const rapportBevindingen = seed.rapportBevindingen.map((r) => {
    const waar = `rapportbevinding ${r.id}`;
    const patroon = patroonIds.get(r.patroonId);
    if (!bronIds.has(r.bronId)) fouten.push(`${waar}: bron ${r.bronId} bestaat niet`);
    if (!patroon) fouten.push(`${waar}: patroon ${r.patroonId} bestaat niet`);
    if (r.casusId && !casusIds.has(r.casusId)) {
      fouten.push(`${waar}: casus ${r.casusId} bestaat niet`);
    }
    // Een rapport mag een code buiten 2.2 noemen (besluit 5); melden, niet weigeren.
    for (const code of r.rapportCriteria) {
      if (!bekendeCriteria.has(code)) {
        waarschuwingen.push(`${waar}: rapportcriterium ${code} staat niet in wcag_criteria`);
      }
    }

    // De seed geeft de overeenstemming mee. Wijkt die af van de rekenregel,
    // dan blijft de seedwaarde staan en geldt hij als handmatig gezet.
    let handmatig = false;
    if (patroon) {
      const berekend = berekenOvereenstemming(
        { oordeel: r.rapportOordeel, criteria: r.rapportCriteria },
        { oordeel: patroon.oordeel, criteria: patroon.criteria },
      );
      if (berekend !== r.overeenstemming) {
        handmatig = true;
        waarschuwingen.push(
          `${waar}: overeenstemming "${r.overeenstemming}" in de seed, rekenregel geeft "${berekend}"; seedwaarde blijft, als handmatig`,
        );
      }
    }

    return {
      id: r.id,
      bronId: r.bronId,
      patroonId: r.patroonId,
      casusId: r.casusId ?? null,
      rapportCriteria: r.rapportCriteria,
      rapportOordeel: enumWaarde(OORDELEN, r.rapportOordeel, waar),
      rapportSamenvatting: r.rapportSamenvatting ?? null,
      shift2Samenvatting: r.shift2Samenvatting ?? null,
      citaat: r.citaat ?? '',
      pagina: r.pagina ?? null,
      overeenstemming: enumWaarde(OVEREENSTEMMINGEN, r.overeenstemming, waar),
      overeenstemmingHandmatig: handmatig,
      toelichting: r.toelichting ?? null,
    };
  });

  const afbeeldingen: Voorbereid['rijen']['afbeeldingen'] = [];
  for (const [naam, uri] of Object.entries(seed.afbeeldingen)) {
    const gelezen = leesDataUri(uri);
    if (!gelezen) {
      fouten.push(`afbeelding ${naam}: geen geldige data-URI`);
      continue;
    }
    afbeeldingen.push({ naam, ...gelezen });
  }

  const aantallen = {
    patronen: patronen.length,
    casussen: casussen.length,
    auditors: auditors.length,
    bronnen: bronnen.length,
    rapportBevindingen: rapportBevindingen.length,
    oefensets: oefensets.length,
    afbeeldingen: afbeeldingen.length,
  };
  for (const [soort, verwacht] of Object.entries(VERWACHTE_AANTALLEN)) {
    const echt = aantallen[soort as keyof typeof aantallen];
    if (echt !== verwacht) waarschuwingen.push(`${soort}: ${echt}, verwacht ${verwacht}`);
  }

  return {
    fouten,
    waarschuwingen,
    aantallen,
    rijen: { auditors, oefensets, patronen, casussen, bronnen, rapportBevindingen, afbeeldingen },
  };
}
