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

type Vindplaats = { sampleItemId?: string | null; sampleItem?: { id?: string | null } | null };

/** Of de bevinding op alle pagina's van de steekproef staat (bij twee of meer pagina's). */
export function geldtVoorAllePaginas(
  occurrences: Vindplaats[] | null | undefined,
  aantalSamples: number,
): boolean {
  if (!occurrences || aantalSamples < 2) return false;
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
