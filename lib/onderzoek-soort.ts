/**
 * Wat voor onderzoek dit is, voor het rapport: een nulmeting of een heronderzoek.
 *
 * Een heronderzoek loopt de issues uit een eerder onderzoek na; opgeloste punten
 * verdwijnen uit het rapport. Er zijn twee soorten, met hetzelfde gedrag en een
 * andere naam:
 *
 *   herinspectie        -- vanuit een nulmeting in de tool aangemaakt (parentProjectId),
 *                          in het rapport "heronderzoek".
 *   aanvullend onderzoek -- het eerdere onderzoek staat niet in de tool (vaak van
 *                          Cardan), of er zit te veel tijd tussen om het een
 *                          herinspectie te noemen. In het rapport "aanvullend onderzoek".
 *
 * Deze toets stond eerder vier keer los in de rapportcode (report-data.ts,
 * twee keer in generate-report-html.ts, OverDitOnderzoek.tsx). Het rapport op het
 * scherm en de Word/PDF-versie horen woordelijk gelijk te zijn; zet een wijziging
 * dus hier en niet op één van die plekken.
 */

export type OnderzoekSoortInvoer = {
  checkPhase?: string | null;
  parentProjectId?: string | null;
  aanvullendOnderzoek?: boolean | null;
  /** Bij een aanvullend onderzoek: wanneer het vorige onderzoek was ("februari 2026"). */
  eerderOnderzoekPeriode?: string | null;
};

/**
 * Of het rapport zich als heronderzoek gedraagt.
 *
 * Niet alleen op de lopende fase: na afronden staat checkPhase op 'afgerond', en
 * een afgeronde nulmeting heeft die ook. Een kindproject en een aanvullend
 * onderzoek blijven daarom een heronderzoek, ongeacht de fase.
 */
export function isHeronderzoek(p: OnderzoekSoortInvoer): boolean {
  return !!p.aanvullendOnderzoek || p.checkPhase === 'herinspectie' || !!p.parentProjectId;
}

export function isAanvullendOnderzoek(p: OnderzoekSoortInvoer): boolean {
  return !!p.aanvullendOnderzoek;
}

/**
 * Het woord voor het onderzoek, in twee vormen. "Aanvullend" verbuigt achter een
 * bepaald lidwoord of aanwijzend voornaamwoord: "een aanvullend onderzoek", maar
 * "dit aanvullende onderzoek".
 */
export function onderzoekWoord(
  p: OnderzoekSoortInvoer,
  vorm: 'onbepaald' | 'bepaald' = 'onbepaald',
): string {
  if (!isHeronderzoek(p)) return 'onderzoek';
  if (!isAanvullendOnderzoek(p)) return 'heronderzoek';
  return vorm === 'bepaald' ? 'aanvullende onderzoek' : 'aanvullend onderzoek';
}

/**
 * Vervangt "deelonderzoek" en "contentonderzoek" in een tekst die voor een
 * nulmeting is geschreven (onderzoekstype-teksten, de kop).
 *
 * "deelonderzoek techniek" en het meervoud blijven staan: dat is het andere
 * deelonderzoek en heet ook bij een heronderzoek zo.
 *
 * Een aanvullend onderzoek houdt de standaardtekst, zoals Cardan het doet: daar
 * heet het in kop, intro en afbakening gewoon "deelonderzoek". Dat het een vervolg
 * is, blijkt uit de samenvatting (lib/samenvatting.ts). Frits, 2026-10-01.
 */
export function naarHeronderzoek(tekst: string, p: OnderzoekSoortInvoer): string {
  if (!isHeronderzoek(p) || isAanvullendOnderzoek(p)) return tekst;
  return tekst
    .replace(/\bdeelonderzoek\b(?!\s+techniek)/gi, 'heronderzoek')
    .replace(/\bcontentonderzoek\b/gi, 'contentheronderzoek');
}

/**
 * Hoe het rapport naar het eerdere onderzoek verwijst: "bij de nulmeting waren
 * dat er nog 3". Bij een aanvullend onderzoek was dat eerdere onderzoek niet per
 * se een nulmeting, en vaak ook niet van ons.
 */
export function eerderOnderzoek(p: OnderzoekSoortInvoer): string {
  return isAanvullendOnderzoek(p) ? 'het eerdere onderzoek' : 'de nulmeting';
}

/**
 * Het label in de introzin: "WCAG 2.2 AA-contentonderzoek", bij een herinspectie
 * "…-contentheronderzoek", bij een aanvullend onderzoek "aanvullende WCAG 2.2
 * AA-contentonderzoek" (de zin luidt "de resultaten van het …").
 *
 * De introzin is de enige plek waar een aanvullend onderzoek zo heet: hij sluit aan
 * op de kop ("… aanvullend onderzoek content …"). De rest van het rapport houdt de
 * standaardtekst, zoals Cardan het doet. Frits, 2026-10-01.
 */
export function introLabel(standaard: string, niveau: string, p: OnderzoekSoortInvoer): string {
  if (isAanvullendOnderzoek(p)) return `aanvullende ${standaard} ${niveau}-contentonderzoek`;
  return `${standaard} ${niveau}-content${isHeronderzoek(p) ? 'her' : ''}onderzoek`;
}

/**
 * De introzin uit het onderzoekstype (reportIntroHeader), met hetzelfde label als
 * introLabel: het scherm gebruikt deze tekst, Word/PDF bouwt de zin met introLabel.
 */
export function naarIntrozin(tekst: string, p: OnderzoekSoortInvoer): string {
  if (!isAanvullendOnderzoek(p)) return naarHeronderzoek(tekst, p);
  return tekst.replace(
    /\b(het|dit)\s+(WCAG\s+[\d.]+\s+A{1,3}-contentonderzoek)\b/gi,
    (_m, lw: string, label: string) => `${lw} aanvullende ${label}`,
  );
}
