/**
 * Overeenstemming tussen wat een extern rapport over een patroon zei en het
 * Shift2-oordeel over dat patroon. De rekenregel staat in
 * docs/bibliotheek/SPEC.md (Datamodel, Regels); dit is de enige plek in de
 * code waar hij staat.
 *
 * Alleen `afkeur` telt als afkeur. `advies` en `geen-afkeur` zijn allebei geen
 * afkeur (besluit 6), en `twijfel` ook niet: een patroon zonder oordeel kan
 * een rapport niet te streng of te soepel noemen.
 */

export type OordeelWaarde = 'afkeur' | 'geen-afkeur' | 'advies' | 'twijfel';

export type OvereenstemmingWaarde =
  | 'eens'
  | 'ander-criterium'
  | 'te-streng'
  | 'te-soepel';

export function berekenOvereenstemming(
  rapport: { oordeel: OordeelWaarde; criteria: string[] },
  patroon: { oordeel: OordeelWaarde; criteria: string[] },
): OvereenstemmingWaarde {
  const rapportAfkeur = rapport.oordeel === 'afkeur';
  const patroonAfkeur = patroon.oordeel === 'afkeur';

  if (rapportAfkeur && patroonAfkeur) {
    const binnen = rapport.criteria.every((c) => patroon.criteria.includes(c));
    return binnen ? 'eens' : 'ander-criterium';
  }
  if (rapportAfkeur) return 'te-streng';
  if (patroonAfkeur) return 'te-soepel';
  return 'eens';
}
