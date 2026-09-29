/**
 * Een correctie van Frits en de analyse die Claude Code ervan maakt.
 *
 * De levensloop van een Schrijfcorrectie:
 *
 *   te_analyseren   -> Frits klikte "Leer van mijn correctie"; wacht op Claude Code
 *   geen_wijziging  -> analyse: valt onder een bestaande regel, of was inhoudelijk
 *   voorstel        -> analyse: een nieuwe of betere regel; wacht op Frits
 *   toegevoegd      -> Frits koos "Toevoegen" of "Bestaande regel aanpassen"; gids gewijzigd
 *   niet_toegevoegd -> Frits koos "Niet toevoegen"
 *
 * Het formaat van de analyse staat voor Claude beschreven in writing/FRITS-WRITING-WORKFLOW.md,
 * stap 6. Wat daar staat en wat hier gecontroleerd wordt, horen gelijk te blijven.
 */

export const CORRECTIE_STATUSSEN = [
  'te_analyseren',
  'geen_wijziging',
  'voorstel',
  'toegevoegd',
  'niet_toegevoegd',
] as const;
export type CorrectieStatus = (typeof CORRECTIE_STATUSSEN)[number];

export interface Analyse {
  wijzigingen: { origineel: string; bewerkt: string; soort: 'schrijf' | 'inhoud'; uitleg: string }[];
  waaromBeter?: string;
  uitkomst: 'geen' | 'verbeteren' | 'nieuw';
  regelIds: string[];
  toelichting: string;
  voorstel?: { sectie?: string; nieuweTekst: string; reden: string };
  /**
   * De tekst van de regels in `regelIds` op het moment van de analyse. Vult de server zelf
   * in; zo ziet Frits bij het beslissen wat er vervangen wordt, en weigert het toepassen
   * als de regel intussen met de hand is veranderd.
   */
  oudeTeksten?: Record<string, string>;
}

/** Controleert een analyse zoals Claude Code hem aanlevert. Geeft een foutmelding of null. */
export function controleerAnalyse(a: any, bekendeIds: Set<string>, secties: string[]): string | null {
  if (!a || typeof a !== 'object') return 'De analyse is geen object.';
  if (!Array.isArray(a.wijzigingen) || a.wijzigingen.length === 0) {
    return 'wijzigingen ontbreekt of is leeg: zet elke wijziging los op een rij.';
  }
  for (const w of a.wijzigingen) {
    if (w?.soort !== 'schrijf' && w?.soort !== 'inhoud') {
      return "Elke wijziging heeft soort 'schrijf' of 'inhoud'.";
    }
  }
  if (!['geen', 'verbeteren', 'nieuw'].includes(a.uitkomst)) {
    return "uitkomst is 'geen', 'verbeteren' of 'nieuw'.";
  }
  if (!Array.isArray(a.regelIds)) return 'regelIds is een lijst (mag leeg zijn bij nieuw).';
  const onbekend = a.regelIds.filter((id: string) => !bekendeIds.has(id));
  if (onbekend.length) return `Deze regel-id's staan niet in de gids: ${onbekend.join(', ')}.`;
  if (typeof a.toelichting !== 'string' || !a.toelichting.trim()) return 'toelichting ontbreekt.';

  const alleenInhoud = a.wijzigingen.every((w: any) => w.soort === 'inhoud');
  if (alleenInhoud && a.uitkomst !== 'geen') {
    return 'Alleen inhoudelijke wijzigingen leveren nooit een schrijfregel op; uitkomst moet geen zijn.';
  }

  if (a.uitkomst === 'geen') {
    if (a.voorstel) return 'Bij uitkomst geen hoort geen voorstel.';
    return null;
  }
  if (!a.voorstel?.nieuweTekst?.trim()) return 'voorstel.nieuweTekst ontbreekt.';
  if (!a.voorstel?.reden?.trim()) return 'voorstel.reden ontbreekt.';
  if (a.uitkomst === 'verbeteren' && a.regelIds.length === 0) {
    return "Bij verbeteren staat in regelIds welke regel(s) vervangen worden.";
  }
  if (a.uitkomst === 'nieuw') {
    if (!a.voorstel.sectie || !secties.includes(a.voorstel.sectie)) {
      return `voorstel.sectie moet een bestaand kopje zijn. Kies uit: ${secties.join(' | ')}`;
    }
  }
  return null;
}
