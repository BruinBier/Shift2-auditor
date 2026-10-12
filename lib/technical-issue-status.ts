/**
 * De statussen van een technisch issue, in de volgorde waarin een issue ze doorloopt.
 *
 * Eén lijst voor de keuzelijst in de tabel, het formulier en de API-controle. De
 * databasewaarden staan in het enum `TechnicalIssueStatus` (prisma/schema.prisma);
 * `resolved` heet zo om historische redenen.
 */
export const TECHNICAL_ISSUE_STATUSSEN = [
  { waarde: 'open', label: 'Open', kleur: 'border-yellow-300 bg-yellow-100 text-yellow-900' },
  { waarde: 'ingediend', label: 'Ingediend', kleur: 'border-blue-300 bg-blue-100 text-blue-900' },
  { waarde: 'in_behandeling', label: 'In behandeling', kleur: 'border-purple-300 bg-purple-100 text-purple-900' },
  { waarde: 'resolved', label: 'Opgelost', kleur: 'border-green-300 bg-green-100 text-green-900' },
] as const;

export type TechnicalIssueStatusWaarde = (typeof TECHNICAL_ISSUE_STATUSSEN)[number]['waarde'];

export function isTechnicalIssueStatus(waarde: unknown): waarde is TechnicalIssueStatusWaarde {
  return TECHNICAL_ISSUE_STATUSSEN.some((s) => s.waarde === waarde);
}

export function statusKleur(waarde: string): string {
  return TECHNICAL_ISSUE_STATUSSEN.find((s) => s.waarde === waarde)?.kleur ?? TECHNICAL_ISSUE_STATUSSEN[0].kleur;
}
