/**
 * Wat het rapport bij een bevinding of opmerking laat zien, los van de tekst zelf.
 *
 * Staat een bevinding op elke pagina van de steekproef, dan is de lijst met URL's
 * alleen een herhaling van de steekproef: de beschrijving zegt al "op alle pagina's".
 * Bij MAAS-01 stond onder één opmerking een lijst van vijftien adressen. Frits,
 * 2026-10-01.
 *
 * Gebruikt door het rapport op het scherm (OverDitOnderzoek.tsx), het tabblad
 * Bevindingen en de generator voor HTML/Word/PDF.
 */

type Vindplaats = {
  sampleItemId?: string | null;
  sampleItem?: { id?: string | null } | null;
  context?: string | null;
};

/**
 * Wat er op déze pagina mis is, als dat bij de vindplaats is vastgelegd.
 *
 * Bij een pagecheck op alle pagina's (Valkenswaard, oktober 2026) is één bevinding per
 * patroon het rapport, maar de redacteur moet per pagina weten wát hij moet aanpassen:
 * welk e-mailadres, welke kop, welke afbeelding. Dat staat in `context`.
 */
export function vindplaatsToelichting(o: Vindplaats | null | undefined): string {
  return (o?.context || '').trim();
}

/**
 * Of de bevinding op alle pagina's van de steekproef staat (bij twee of meer pagina's).
 *
 * Heeft een vindplaats een eigen toelichting, dan is de lijst geen herhaling van de
 * steekproef meer en blijft hij staan.
 */
export function geldtVoorAllePaginas(
  occurrences: Vindplaats[] | null | undefined,
  aantalSamples: number,
): boolean {
  if (!occurrences || aantalSamples < 2) return false;
  if (occurrences.some((o) => vindplaatsToelichting(o))) return false;
  const ids = new Set(
    occurrences.map((o) => o.sampleItemId ?? o.sampleItem?.id).filter(Boolean),
  );
  return ids.size >= aantalSamples;
}

/** Of een tekstveld (markdown of HTML) iets bevat; "<p></p>" telt als leeg. */
export function heeftTekst(tekst: string | null | undefined): boolean {
  if (!tekst) return false;
  return tekst.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}
