/**
 * De stand van een onderzoek, afgeleid uit wat er in de database staat.
 *
 * Twee vragen worden hier beantwoord, en het onderscheid is wezenlijk:
 *
 *   "waar sta ik"  — het oordeel per sample per criterium (sample_criterion_checks)
 *   "wat doe ik nu" — de criteria die nog een browsertest vergen, plus de
 *                     voorstellen die op akkoord wachten
 *
 * Zie docs/adr/0001-akkoord-als-poort.md en CONTEXT.md.
 */

export type SampleOordeel =
  | 'voldoet'
  | 'afgekeurd'
  | 'opmerking'
  | 'niet_aanwezig'
  | 'niet_te_bepalen';

export type CriteriumOordeel = 'failed' | 'passed' | 'not_present' | 'not_tested';

export interface Sample {
  id: string;
  title: string;
  type: string;
  /** Leeg bij een PDF-sample. Gaat mee in het besprekingsblok. */
  url: string | null;
}

export interface Criterion {
  /** Het interne id, nodig om een bevinding aan dit criterium te hangen. */
  id: string;
  code: string;
  titleNl: string;
  level: string;
}

export interface Bevinding {
  id: string;
  findingCode: string | null;
  description: string;
  advice: string;
  impact: string | null;
  type: string;
  status: string;
}

/**
 * Hoe een oordeel in de database is beland — niet waarop het rust.
 *
 * De ruwe waarden zijn `workflow`, `gesprek` en `handmatig`. Kaal weergegeven als "via
 * gesprek", pal naast het oordeel, leest dat als de grond ervan: alsof er iets besloten is
 * door erover te praten, terwijl er browsermetingen onder staan. Waar het oordeel op rust
 * staat in de verantwoording; dit veld zegt alleen langs welke weg het is vastgelegd.
 */
export const HERKOMST: Record<string, string> = {
  workflow: 'vastgelegd door de workflow',
  gesprek: 'vastgelegd in een gesprek',
  handmatig: 'met de hand ingevoerd',
};

/**
 * Eén meting uit het logboek van de audit-CLI, zoals de kaart hem toont.
 *
 * De vorm staat in `lib/verantwoording.ts`, want twee wegen schrijven hem: `koppel-logboek`
 * en de meetknop op de kaart. Wat de een wegschrijft moet de ander kunnen lezen.
 */
import type { Meting } from '@/lib/verantwoording';
import { isSitebreed } from '@/lib/metingen';
export type { Meting };

/** Eén punt uit Shift2_Bewijsvoering.md, en of de onderbouwing eraan voldoet. */
export interface ControlePunt {
  punt: string;
  uitkomst: 'ja' | 'nee' | 'nvt';
  toelichting?: string | null;
}

export interface Controle {
  bevestigd?: boolean | null;
  punten?: ControlePunt[];
}

/** Eén variant van een onderdeel: wat er stond, en waar de onderzoeker het zag. */
export interface ZelfGevondenVariant {
  wat: string;
  waar: string;
}

/** Een onderdeel dat de onderzoeker zelf vond. Zie de route zelf-gevonden. */
export interface ZelfGevonden {
  id: string;
  omschrijving: string;
  varianten: ZelfGevondenVariant[];
  notitie?: string;
  toegevoegdOp?: string;
  /** Hoort deze aantekening bij een gemeten onderdeel? Dan de sleutel daarvan. */
  overOnderdeel?: string;
  /** `agent` is een lezing van de assistent: geen meting, en geen oordeel. */
  door?: 'agent' | 'onderzoeker';
  /** Wat de onderzoeker ermee deed. Afwijzen wist niet, maar merkt aan. */
  status?: 'open' | 'overgenomen' | 'afgewezen';
  reactie?: string;
}

/**
 * De uitkomst van één deelgebied binnen een criterium.
 *
 * `nvt` is hier het punt van de hele lijst: "geen tabellen op deze pagina" is iets anders
 * dan "niet naar tabellen gekeken", en dat verschil was tot nu toe nergens vast te leggen.
 */
export interface GebiedUitkomst {
  /** Moet woordelijk gelijk zijn aan een regel onder `### Deelgebieden` in het regelbestand. */
  gebied: string;
  /**
   * `opmerking` is geen lichte fout maar een andere soort: er gaat niets verloren, er wordt
   * alleen een verband beweerd dat er niet is. Zo'n gebied laat het criterium niet zakken.
   */
  uitkomst: 'ok' | 'nvt' | 'fout' | 'opmerking';
  /** Kort, één zin: wat er stond. Bij `fout` en `opmerking` hoort er een bevinding bij. */
  toelichting?: string;
  /**
   * De bevindingen die bij dit gebied horen, als findingCode ("B001").
   *
   * Zonder deze koppeling staat een gebied op `fout` los van de bevinding die erover gaat, en
   * moet de onderzoeker zelf verbinden wat bij elkaar hoort. Op 2026-08-31 stonden er op de
   * 1.1.1-kaart van Home twee gebieden op `fout` met één bevinding, en of er iets ontbrak was
   * alleen met terugzoeken vast te stellen.
   *
   * Leeg bij oordelen van vóór die datum; de kaart toont de bevindingen dan los eronder.
   */
  bevindingen?: string[];
  /**
   * Waar op de pagina het probleem zit, als CSS-selector per bevinding-id.
   *
   * De knop "Laat het me zien in de browser" bij die bevinding zet er dan een kader omheen,
   * in plaats van de pagina te tonen met kaders om alles wat onder het criterium valt.
   */
  aanwijzingen?: Record<string, string>;
}

export interface Cel {
  sampleId: string;
  code: string;
  /** Leeg als dit sample nooit op dit criterium is beoordeeld. */
  status: SampleOordeel | null;
  reden?: string | null;
  bron?: string | null;
  akkoord?: string | null;
  /**
   * De metingen waarop dit oordeel rust, uit het logboek van de CLI. Leeg betekent
   * dat er geen meting aan te pas kwam — bij een oordeel uit een gesprek hoort hier
   * niets te staan, en dat is informatie.
   */
  verantwoording?: Meting[] | null;
  /**
   * Onderdelen die de onderzoeker zélf vond, naast wat de meting vond.
   *
   * Een meting vindt niet alles: iets dat pas na een klik verschijnt, een pagina buiten
   * de steekproef, of twee elementen die de sleutel niet koppelt. Die staan op de kaart
   * in dezelfde lijst, met erbij wie wat vond.
   */
  zelfGevonden?: ZelfGevonden[] | null;
  /** Of de onderbouwing standhoudt, per punt uit de bewijsvoeringsregels. */
  controle?: Controle | null;
  /**
   * Wat er per deelgebied is nagelopen, bij een criterium dat uit meerdere vragen bestaat.
   *
   * De gebieden zelf staan in het regelbestand (`### Deelgebieden`); hier staat alleen de
   * uitkomst. Zo is te zien wát er is nagekeken en niet alleen wat er gevonden is — bij
   * BEV-03 ging de onderbouwing van 1.3.1 alleen over koppen en bleef een `em`-afkeuring
   * op dezelfde pagina onopgemerkt.
   */
  gebieden?: GebiedUitkomst[] | null;
  /** De akkoord bevonden bevindingen op deze combinatie. */
  bevindingen: Bevinding[];
}

export interface Voorstel extends Bevinding {
  code: string;
  sampleId: string | null;
}

export interface Stand {
  samples: Sample[];
  criteria: Criterion[];
  cellen: Cel[];
  voorstellen: Voorstel[];
  celVoor(sampleId: string, code: string): Cel | undefined;
  openVragenVoorSample(sampleId: string): Cel[];
  /**
   * Oordelen die nog geen akkoord van de onderzoeker hebben.
   *
   * De poort gold tot nu toe alleen voor bevindingen. Het oordeel zelf — dat een
   * criterium op een pagina voldoet, is afgekeurd of niet aanwezig is — kwam
   * rechtstreeks van de agent in de database zonder dat iemand ernaar keek.
   * Zie de kolom `akkoord` op sample_criterion_checks.
   */
  teBeoordelenVoorSample(sampleId: string): Cel[];
  voorstellenVoorSample(sampleId: string): Voorstel[];
  werkVoorRij(code: string): number;
  werkVoorKolom(sampleId: string): number;
  isNagekeken(sampleId: string): boolean;
  criteriumOordeel(code: string): CriteriumOordeel;
  totalen: {
    samples: number;
    samplesNagekeken: number;
    criteria: number;
    openVragen: number;
    teBeoordelen: number;
    voorstellen: number;
    /** Combinaties die nog helemaal geen oordeel hebben. */
    onbeoordeeld: number;
  };
}

/** Statussen waarmee een bevinding meetelt: alles voorbij de poort. */
const TELT_MEE = new Set(['open', 'published']);

export function bouwStand(project: any, allCriteria: any[]): Stand {
  const samples: Sample[] = (project?.sampleItems ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    type: s.sampleType,
    url: s.url ?? null,
  }));

  const criteria: Criterion[] = (allCriteria ?? []).map((c: any) => ({
    id: c.id,
    code: c.code,
    titleNl: c.titleNl ?? c.code,
    level: c.level,
  }));

  const codeVanId = new Map<string, string>(
    (allCriteria ?? []).map((c: any) => [c.id, c.code])
  );

  const alleFindings: any[] = project?.findings ?? [];

  const naarBevinding = (f: any): Bevinding => ({
    id: f.id,
    findingCode: f.findingCode ?? null,
    description: f.description ?? '',
    advice: f.advice ?? '',
    impact: f.impact ?? null,
    type: f.type ?? 'bevinding',
    status: f.status ?? 'open',
  });

  const samplesVan = (f: any): string[] =>
    (f.occurrences ?? []).map((o: any) => o.sampleItemId ?? o.sampleItem?.id).filter(Boolean);

  // Voorstellen: alles wat nog voor de poort staat.
  const voorstellen: Voorstel[] = alleFindings
    .filter((f) => f.status === 'voorstel')
    .flatMap((f): Voorstel[] => {
      const ids = samplesVan(f);
      const code = f.wcagCriterion?.code ?? codeVanId.get(f.wcagCriterionId) ?? '?';
      // Een voorstel zonder sample-koppeling verdwijnt niet: het krijgt sampleId
      // null en blijft zo zichtbaar in de stapel.
      if (!ids.length) return [{ ...naarBevinding(f), code, sampleId: null }];
      return ids.map((sampleId: string) => ({ ...naarBevinding(f), code, sampleId }));
    });

  // Akkoord bevonden bevindingen, per sample en criterium.
  const bevindingIndex = new Map<string, Bevinding[]>();
  for (const f of alleFindings) {
    if (!TELT_MEE.has(f.status)) continue;
    const code = f.wcagCriterion?.code ?? codeVanId.get(f.wcagCriterionId);
    if (!code) continue;
    for (const sampleId of samplesVan(f)) {
      const sleutel = `${sampleId}|${code}`;
      const lijst = bevindingIndex.get(sleutel);
      if (lijst) lijst.push(naarBevinding(f));
      else bevindingIndex.set(sleutel, [naarBevinding(f)]);
    }
  }

  // De opgeslagen sampleoordelen, op code in plaats van id.
  const checkIndex = new Map<string, any>();
  for (const s of project?.sampleItems ?? []) {
    for (const c of s.criterionChecks ?? []) {
      const code = codeVanId.get(c.wcagCriterionId);
      if (!code) continue;
      checkIndex.set(`${s.id}|${code}`, c);
    }
  }

  const cellen: Cel[] = [];
  for (const sample of samples) {
    for (const crit of criteria) {
      const sleutel = `${sample.id}|${crit.code}`;
      const check = checkIndex.get(sleutel);
      cellen.push({
        sampleId: sample.id,
        code: crit.code,
        status: (check?.status as SampleOordeel) ?? null,
        reden: check?.reden ?? null,
        bron: check?.bron ?? null,
        akkoord: check?.akkoord ?? null,
        // Komen als JSON uit de database. Een array met metingen respectievelijk een
        // object met punten; alles anders negeren we, zodat een oude of half
        // geschreven waarde de kaart niet sloopt.
        verantwoording: Array.isArray(check?.verantwoording) ? check.verantwoording : null,
        zelfGevonden: Array.isArray(check?.zelfGevonden) ? check.zelfGevonden : null,
        gebieden: Array.isArray(check?.gebieden) ? check.gebieden : null,
        controle:
          check?.controle && typeof check.controle === 'object' && !Array.isArray(check.controle)
            ? check.controle
            : null,
        bevindingen: bevindingIndex.get(sleutel) ?? [],
      });
    }
  }

  const celVoor = (sampleId: string, code: string) =>
    cellen.find((c) => c.sampleId === sampleId && c.code === code);

  /**
   * Een sitebreed criterium hoort niet in de werklijst van één pagina.
   *
   * 3.2.4 wordt op het homepage-sample vastgelegd, maar het gaat over de hele set. Stond
   * het in de kolom van Home, dan vraagt de stapel daar een oordeel over zestien pagina’s
   * terwijl je bezig bent één pagina af te werken. Het is te bereiken via het vakje in de
   * kolom "alle pagina’s" in de matrix, en dat is de enige plek waar het thuishoort.
   */
  const perPagina = (c: Cel) => !isSitebreed(c.code);

  const openVragenVoorSample = (sampleId: string) =>
    cellen.filter(
      (c) => c.sampleId === sampleId && c.status === 'niet_te_bepalen' && perPagina(c)
    );

  // Beoordeeld maar nog niet bevestigd. Een openstaande vraag telt hier niet mee:
  // die staat al als vraag op de stapel en heeft nog geen oordeel om te bevestigen.
  const teBeoordelen = (c: Cel) =>
    c.status !== null && c.status !== 'niet_te_bepalen' && c.akkoord !== 'akkoord';

  const teBeoordelenVoorSample = (sampleId: string) =>
    cellen.filter((c) => c.sampleId === sampleId && teBeoordelen(c) && perPagina(c));

  const voorstellenVoorSample = (sampleId: string) =>
    voorstellen.filter((v) => v.sampleId === sampleId);

  const werkVoorRij = (code: string) =>
    cellen.filter((c) => c.code === code && (c.status === 'niet_te_bepalen' || teBeoordelen(c)))
      .length + voorstellen.filter((v) => v.code === code).length;

  const werkVoorKolom = (sampleId: string) =>
    openVragenVoorSample(sampleId).length +
    teBeoordelenVoorSample(sampleId).length +
    voorstellenVoorSample(sampleId).length;

  const isNagekeken = (sampleId: string) =>
    werkVoorKolom(sampleId) === 0 &&
    !cellen.some((c) => c.sampleId === sampleId && c.status === null && perPagina(c));

  /**
   * Volledigheid wordt per criterium gemeten, niet per sample: of dit criterium
   * rond is volgt uit zijn eigen rij, niet uit de vraag of die pagina's op andere
   * criteria al klaar zijn. Zie de ADR — de eerste formulering hield 27 van de 33
   * criteria onnodig op 'not_tested'.
   */
  const criteriumOordeel = (code: string): CriteriumOordeel => {
    const rij = cellen.filter((c) => c.code === code);
    if (!rij.length) return 'not_tested';
    if (rij.some((c) => c.bevindingen.some((b) => b.type === 'bevinding'))) return 'failed';

    const nogOpen =
      rij.some((c) => c.status === 'niet_te_bepalen' || c.status === null) ||
      voorstellen.some((v) => v.code === code);
    if (nogOpen) return 'not_tested';

    if (rij.every((c) => c.status === 'niet_aanwezig')) return 'not_present';
    return 'passed';
  };

  return {
    samples,
    criteria,
    cellen,
    voorstellen,
    celVoor,
    openVragenVoorSample,
    teBeoordelenVoorSample,
    voorstellenVoorSample,
    werkVoorRij,
    werkVoorKolom,
    isNagekeken,
    criteriumOordeel,
    totalen: {
      samples: samples.length,
      samplesNagekeken: samples.filter((s) => isNagekeken(s.id)).length,
      criteria: criteria.length,
      openVragen: cellen.filter((c) => c.status === 'niet_te_bepalen').length,
      teBeoordelen: cellen.filter(teBeoordelen).length,
      voorstellen: voorstellen.length,
      onbeoordeeld: cellen.filter((c) => c.status === null).length,
    },
  };
}

export const OORDEEL_LABEL: Record<CriteriumOordeel, { tekst: string; klasse: string }> = {
  failed: { tekst: 'Voldoet niet', klasse: 'bg-red-100 text-red-800' },
  passed: { tekst: 'Voldoet', klasse: 'bg-green-100 text-green-800' },
  not_present: { tekst: 'Niet aanwezig', klasse: 'bg-gray-100 text-gray-600' },
  not_tested: { tekst: 'Nog niet getoetst', klasse: 'bg-blue-100 text-blue-800' },
};

/**
 * De woorden waarmee een celstatus in beeld komt. Eén lijst, want dezelfde toestand
 * heette in de legenda van de matrix "Jij moet kijken" en drie regels verderop, in de
 * zweeftekst en het paneel, "Niet te bepalen". Twee namen voor één ding laten een lezer
 * zoeken naar een verschil dat er niet is.
 *
 * Het is "Jij moet kijken" geworden en niet andersom: dit is geen eindoordeel maar een
 * taak die openstaat, en zo staat het ook op de kaarten in de stapel.
 */
export const STATUS_LABEL: Record<SampleOordeel, string> = {
  voldoet: 'Voldoet',
  afgekeurd: 'Afgekeurd',
  opmerking: 'Opmerking',
  niet_aanwezig: 'Niet aanwezig',
  niet_te_bepalen: 'Jij moet kijken',
};

/** Nooit beoordeeld is geen status maar de afwezigheid ervan, en heeft toch een woord nodig. */
export const ONBEOORDEELD_LABEL = 'Nog niet beoordeeld';

/** Het woord bij een cel, ook als er nooit een oordeel is geweest. */
export function celLabel(status: SampleOordeel | null): string {
  return status ? STATUS_LABEL[status] : ONBEOORDEELD_LABEL;
}

/** Kleur per celstatus. `null` — nooit beoordeeld — krijgt bewust een eigen kleur. */
export const CEL_KLEUR: Record<string, string> = {
  voldoet: 'bg-green-500',
  afgekeurd: 'bg-red-500',
  opmerking: 'bg-amber-400',
  niet_aanwezig: 'bg-gray-200',
  niet_te_bepalen: 'bg-blue-500',
  onbeoordeeld: 'bg-gray-50 border border-dashed border-gray-300',
};
