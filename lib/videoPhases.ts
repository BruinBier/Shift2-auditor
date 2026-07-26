// Gedeelde constanten voor de Video A2-gemeenten-omgeving.
// Gebruikt door zowel de API-routes als de UI, zodat de vaste fasen en gemeenten
// maar op één plek gedefinieerd staan.

export const VIDEO_PHASES = [
  'voorbereiden',
  'ondertiteling',
  'audiodescriptie',
  'transcript',
  'publiceren',
] as const;

export type VideoPhaseKey = (typeof VIDEO_PHASES)[number];

export const PHASE_LABELS: Record<VideoPhaseKey, string> = {
  voorbereiden: 'Voorbereiden',
  ondertiteling: 'Ondertiteling',
  audiodescriptie: 'Audiodescriptie',
  transcript: 'Transcript',
  publiceren: 'Publiceren',
};

export const GEMEENTEN = ['cranendonck', 'heeze_leende', 'valkenswaard'] as const;

export type GemeenteKey = (typeof GEMEENTEN)[number];

export const GEMEENTE_LABELS: Record<GemeenteKey, string> = {
  cranendonck: 'Cranendonck',
  heeze_leende: 'Heeze-Leende',
  valkenswaard: 'Valkenswaard',
};

export function isGemeente(v: unknown): v is GemeenteKey {
  return typeof v === 'string' && (GEMEENTEN as readonly string[]).includes(v);
}
