import type { VideoPhaseKey, GemeenteKey } from '@/lib/videoPhases';

export type PhaseStatus = 'todo' | 'bezig' | 'klaar' | 'nvt';

export interface VideoPhase {
  id: string;
  phase: VideoPhaseKey;
  status: PhaseStatus;
  seconds: number;
  timerStartedAt: string | null;
  sortOrder: number;
}

export interface Video {
  id: string;
  gemeente: GemeenteKey;
  titel: string;
  url: string;
  notities: string | null;
  sortOrder: number;
  phases: VideoPhase[];
}
