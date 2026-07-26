// Tijd-weergavehelpers, geëxtraheerd uit PagecheckProgress.tsx zodat de Video-statistiek
// dezelfde opmaak gebruikt.

/** Bijv. 45s, 12min, 2u, 1u 30min */
export function fmtSeconds(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const totalMin = sec / 60;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin - h * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}u`;
  return `${h}u ${m}min`;
}

/** Bijv. 4m 05s */
export function fmtMinSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
