/**
 * Bevinding of opmerking?
 *
 * Dit is een oordeel van de onderzoeker, geen eigenschap die uit de techniek volgt:
 * WCAG zijn minimale richtlijnen, dus soms is iets geen echte WCAG-fout maar wel
 * het benoemen waard. Dat oordeel staat in het veld `type`.
 *
 * Bij een opmerking blijven impact en verantwoordelijkheid leeg. `impact` gaat
 * dus alleen over de ernst van een afkeuring, niet over de vraag of iets er een is.
 *
 * Het oplossen van een opmerking staat los van de vraag of de site voldoet:
 * een openstaande opmerking maakt een criterium niet "failed". Alleen echte
 * bevindingen tellen mee voor de conclusie.
 */

export type FindingLike = {
  type?: string | null;
  impact?: string | null;
  status?: string | null;
  interimReviewed?: boolean | null;
};

/**
 * Een opmerking: wel gemeld, maar geen afkeuring.
 *
 * De kolom `type` is NOT NULL, dus hij ontbreekt alleen als een query het veld
 * niet meelaadt (een `select` zonder `type`). Dan valt dit terug op de oude
 * regel — dezelfde uitkomst, maar het wijst op een query die `type` mist.
 */
export function isOpmerking(f: FindingLike): boolean {
  if (f.type != null) return f.type === 'opmerking';
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[finding-classification] finding zonder `type` geclassificeerd via impact; ' +
        'voeg `type` toe aan de select van deze query.'
    );
  }
  return f.impact == null;
}

/** Een echte bevinding: door de onderzoeker afgekeurd. */
export function isBevinding(f: FindingLike): boolean {
  return !isOpmerking(f);
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
 * Een opmerking die de onderzoeker in de tussenfase heeft nagelopen en
 * opgelost bevonden.
 *
 * Let op de eis `interimReviewed`. Er zijn twee soorten onderzoek:
 *
 *   1. alleen een nulmeting  — bevindingen en opmerkingen worden opgeschreven,
 *      daarna stopt het. Opmerkingen worden daar met status 'resolved'
 *      opgeslagen; dat zegt niets over opgelost zijn, want er is geen vervolg.
 *   2. nulmeting + herinspectie — een proces. In de tussenfase noteert de
 *      onderzoeker wat de klant heeft opgelost en vinkt dat af.
 *
 * Bij het aanmaken van een vervolgproject worden findings gekopieerd, inclusief
 * die betekenisloze 'resolved'. Alleen `interimReviewed` onderscheidt "ik heb
 * dit gecontroleerd en het is opgelost" van "dit is meegekopieerd".
 */
export function isOpgelosteOpmerking(f: FindingLike): boolean {
  return isOpmerking(f) && f.status === 'resolved' && f.interimReviewed === true;
}

/**
 * Hoort dit punt nog in het rapport?
 *
 * Weg zijn: opgeloste afkeuringen, en opmerkingen die in de tussenfase zijn
 * nagelopen en opgelost bevonden.
 */
export function hoortInRapport(f: FindingLike): boolean {
  return !isOpgelosteBevinding(f) && !isOpgelosteOpmerking(f);
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
