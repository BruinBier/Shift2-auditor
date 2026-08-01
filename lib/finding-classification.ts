/**
 * Bevinding of opmerking?
 *
 * Dit is een oordeel van de onderzoeker, geen eigenschap die uit de techniek volgt:
 * WCAG zijn minimale richtlijnen, dus soms is iets geen echte WCAG-fout maar wel
 * het benoemen waard. Dat oordeel wordt vastgelegd in het impact-veld:
 *
 *   impact gezet -> echte bevinding (afkeuring)
 *   impact leeg  -> opmerking
 *
 * Bij een opmerking blijven impact en verantwoordelijkheid allebei leeg.
 *
 * Het oplossen van een opmerking staat los van de vraag of de site voldoet:
 * een openstaande opmerking maakt een criterium niet "failed". Alleen echte
 * bevindingen tellen mee voor de conclusie.
 */

export type FindingLike = {
  impact?: string | null;
  status?: string | null;
};

/** Een opmerking: wel gemeld, maar geen afkeuring. */
export function isOpmerking(f: FindingLike): boolean {
  return f.impact == null;
}

/** Een echte bevinding: door de onderzoeker afgekeurd. */
export function isBevinding(f: FindingLike): boolean {
  return f.impact != null;
}

/** Een bevinding die nog openstaat. Telt mee voor de conclusie. */
export function isOpenBevinding(f: FindingLike): boolean {
  return isBevinding(f) && (f.status === 'open' || f.status === 'published');
}

/** Een bevinding die is opgelost (herinspectie). */
export function isOpgelosteBevinding(f: FindingLike): boolean {
  return isBevinding(f) && f.status === 'resolved';
}

/**
 * Het label zoals de lezer het ziet:
 *
 *   afkeuring die nog openstaat -> "Afgekeurd"
 *   afkeuring die is opgelost   -> "Opgelost"
 *   opmerking                   -> "Opmerking"
 *
 * Een opgeloste afkeuring is geen opmerking: die had wél impact.
 */
export function findingLabel(f: FindingLike): 'Afgekeurd' | 'Opgelost' | 'Opmerking' {
  if (isOpmerking(f)) return 'Opmerking';
  return f.status === 'resolved' ? 'Opgelost' : 'Afgekeurd';
}

/** Tailwind-klassen die bij het label horen. */
export function findingLabelClass(f: FindingLike): string {
  switch (findingLabel(f)) {
    case 'Afgekeurd':
      return 'bg-red-100 text-red-800';
    case 'Opgelost':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
