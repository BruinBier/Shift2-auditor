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
  /**
   * Bij een aanvullend onderzoek: welk onderzoek eraan voorafging, als vrije tekst die
   * zo in de zin past ("de nulmeting en de herinspectie (27 november 2025)"). Heet in
   * de database nog "periode"; het veld is ruimer geworden.
   */
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

/**
 * De afbakening van een aanvullend onderzoek. Wat er beoordeeld is, volgt uit wat er
 * in het vorige onderzoek openstond, niet uit wat er in het CMS zit: dat vorige
 * onderzoek (vaak van Cardan) trok die grens niet, en zijn openstaande punten kunnen
 * ook techniek zijn. "Uitsluitend content via het CMS" en "beide deelonderzoeken
 * vormen samen de volledige beoordeling" beloven dan iets wat dit onderzoek niet doet.
 * Frits, 2026-10-01.
 *
 * Eén bron voor het scherm (naarAanvullendAfbakening, op de markdown van het
 * onderzoekstype) en Word/PDF (generate-report-html.ts).
 */
export function aanvullendAfbakeningZin(p: OnderzoekSoortInvoer): string {
  return `Dit aanvullende onderzoek heeft betrekking op de punten die na ${vorigOnderzoek(p)} nog openstonden. Daarbij is nagegaan of deze zijn opgelost.`;
}

/**
 * Hoe het rapport het voorafgaande onderzoek noemt: wat de onderzoeker op Details
 * invulde ("de nulmeting en de herinspectie (27 november 2025)"), anders "het vorige
 * onderzoek". Niet elk aanvullend onderzoek komt na een herinspectie, dus dat staat
 * niet vast in de tekst. Frits, 2026-10-01.
 */
export function vorigOnderzoek(p: OnderzoekSoortInvoer): string {
  return p.eerderOnderzoekPeriode?.trim() || 'het vorige onderzoek';
}

const CMS_ZIN = /Dit deelonderzoek heeft uitsluitend betrekking op de content van de website die door de organisatie via het CMS kan worden ingevoerd of aangepast\./;
const TECHNIEK_WORDEN = /(succescriteria )worden beoordeeld in het afzonderlijke deelonderzoek techniek/;
const TECHNISCHE_BASIS = / Zij gaan over de technische basis van de website\./;
const BEIDE_ZIN = /\n?[^\S\n]*Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website\.[^\S\n]*\n?/;

/** Past de afbakening in de markdown van het onderzoekstype aan; zie aanvullendAfbakeningZin. */
export function naarAanvullendAfbakening(tekst: string, p: OnderzoekSoortInvoer): string {
  if (!isAanvullendOnderzoek(p)) return tekst;
  return tekst
    .replace(CMS_ZIN, aanvullendAfbakeningZin(p))
    .replace(BEIDE_ZIN, '\n')
    // Het deelonderzoek techniek ligt bij een aanvullend onderzoek al achter ons.
    .replace(TECHNIEK_WORDEN, '$1zijn beoordeeld in het afzonderlijke deelonderzoek techniek')
    .replace(TECHNISCHE_BASIS, '');
}

/**
 * De technieken van een aanvullend onderzoek: JavaScript en WAI-ARIA horen erbij.
 *
 * Een contentonderzoek noemt alleen wat de redacteur via het CMS gebruikt (DOM, HTML,
 * CSS, SVG, PDF). Een aanvullend onderzoek beoordeelt de punten die na het vorige
 * onderzoek openstonden, en dat onderzoek (vaak van Cardan) noemt de technieken waar
 * de website op leunt -- ook JavaScript en WAI-ARIA. Bij MAAS-01 ging het om een
 * dialoogvenster met role="alert". Frits, 2026-10-01.
 *
 * Voegt alleen toe wat ontbreekt; wat er al staat blijft staan.
 */
export const AANVULLENDE_TECHNIEKEN = ['JavaScript', 'WAI-ARIA'];

export function techniekenVoorAanvullend(huidig: string[]): string[] {
  const lijst = huidig.length ? [...huidig] : ['DOM', 'HTML', 'CSS'];
  for (const t of AANVULLENDE_TECHNIEKEN) if (!lijst.includes(t)) lijst.push(t);
  return lijst;
}
