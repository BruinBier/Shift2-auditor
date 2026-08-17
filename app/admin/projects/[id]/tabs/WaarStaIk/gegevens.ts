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

/** Eén meting uit het logboek van de audit-CLI, zoals de kaart hem toont. */
export interface Meting {
  commando: string;
  argumenten?: Record<string, string>;
  url?: string | null;
  tijd?: string;
  browser?: string | null;
  artefact?: string | null;
  uitkomst?: Record<string, unknown>;
}

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
  /** Of de onderbouwing standhoudt, per punt uit de bewijsvoeringsregels. */
  controle?: Controle | null;
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

  const openVragenVoorSample = (sampleId: string) =>
    cellen.filter((c) => c.sampleId === sampleId && c.status === 'niet_te_bepalen');

  // Beoordeeld maar nog niet bevestigd. Een openstaande vraag telt hier niet mee:
  // die staat al als vraag op de stapel en heeft nog geen oordeel om te bevestigen.
  const teBeoordelen = (c: Cel) =>
    c.status !== null && c.status !== 'niet_te_bepalen' && c.akkoord !== 'akkoord';

  const teBeoordelenVoorSample = (sampleId: string) =>
    cellen.filter((c) => c.sampleId === sampleId && teBeoordelen(c));

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
    !cellen.some((c) => c.sampleId === sampleId && c.status === null);

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

export const STATUS_LABEL: Record<SampleOordeel, string> = {
  voldoet: 'Voldoet',
  afgekeurd: 'Afgekeurd',
  opmerking: 'Opmerking',
  niet_aanwezig: 'Niet aanwezig',
  niet_te_bepalen: 'Niet te bepalen',
};

/** Kleur per celstatus. `null` — nooit beoordeeld — krijgt bewust een eigen kleur. */
export const CEL_KLEUR: Record<string, string> = {
  voldoet: 'bg-green-500',
  afgekeurd: 'bg-red-500',
  opmerking: 'bg-amber-400',
  niet_aanwezig: 'bg-gray-200',
  niet_te_bepalen: 'bg-blue-500',
  onbeoordeeld: 'bg-gray-50 border border-dashed border-gray-300',
};
