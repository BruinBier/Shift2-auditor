/**
 * Namen en kleuren van de bibliotheekwaarden op het scherm. De waarden zelf
 * zijn de enumwaarden uit de database (`geen_afkeur`, `ander_criterium`).
 */

export const OORDEEL_LABEL: Record<string, string> = {
  afkeur: 'Afkeur',
  geen_afkeur: 'Geen afkeur',
  advies: 'Advies',
  twijfel: 'Twijfel',
};

/** Tailwind-klassen voor de oordeel-pill; tekst en achtergrond halen 4,5:1. */
export const OORDEEL_PILL: Record<string, string> = {
  afkeur: 'bg-red-50 text-red-800 border-red-200',
  geen_afkeur: 'bg-green-50 text-green-800 border-green-200',
  advies: 'bg-blue-50 text-blue-800 border-blue-200',
  twijfel: 'bg-amber-50 text-amber-900 border-amber-200',
};

export const HERKOMST_LABEL: Record<string, string> = {
  template: 'Template',
  content: 'Content',
  configuratie: 'Configuratie',
  extern: 'Extern',
};

export const STATUS_LABEL: Record<string, string> = {
  concept: 'Concept',
  vastgesteld: 'Vastgesteld',
};

export const OVEREENSTEMMING_LABEL: Record<string, string> = {
  eens: 'Eens',
  ander_criterium: 'Ander criterium',
  te_streng: 'Te streng',
  te_soepel: 'Te soepel',
};

export const VERSIE_LABEL: Record<string, string> = {
  wcag_2_0: '2.0',
  wcag_2_1: '2.1',
  wcag_2_2: '2.2',
};
