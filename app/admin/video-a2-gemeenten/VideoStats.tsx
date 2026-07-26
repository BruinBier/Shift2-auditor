'use client';

import { useMemo } from 'react';
import { fmtSeconds, fmtMinSec } from '@/lib/formatTime';
import { VIDEO_PHASES, PHASE_LABELS } from '@/lib/videoPhases';
import type { Video } from './types';

interface Props {
  videos: Video[];
  /** Live-tik (ms) zodat de totalen meelopen met een lopende timer. */
  nowTick: number;
}

// Verstreken seconden voor een fase, inclusief eventueel lopende timer.
function phaseSeconds(seconds: number, timerStartedAt: string | null, now: number): number {
  if (!timerStartedAt) return seconds;
  return seconds + Math.max(0, Math.round((now - new Date(timerStartedAt).getTime()) / 1000));
}

export default function VideoStats({ videos, nowTick }: Props) {
  const stats = useMemo(() => {
    const now = nowTick;
    let totalSeconds = 0;
    const perPhase = new Map<string, number>();
    for (const p of VIDEO_PHASES) perPhase.set(p, 0);

    for (const v of videos) {
      for (const ph of v.phases) {
        const s = phaseSeconds(ph.seconds, ph.timerStartedAt, now);
        totalSeconds += s;
        perPhase.set(ph.phase, (perPhase.get(ph.phase) ?? 0) + s);
      }
    }

    // Een video is afgehandeld als elke fase 'klaar' of 'nvt' (niet van toepassing) is.
    const isDone = (v: Video) =>
      v.phases.length > 0 && v.phases.every((p) => p.status === 'klaar' || p.status === 'nvt');

    const total = videos.length;
    const done = videos.filter(isDone).length;
    const remaining = total - done;
    const pct = total > 0 ? (done / total) * 100 : 0;

    const avgSecPerVideo = total > 0 ? totalSeconds / total : null;
    // Resttijd: gemiddelde tijd van afgeronde video's × resterende video's.
    const doneVideos = videos.filter(isDone);
    const doneSeconds = doneVideos.reduce(
      (a, v) => a + v.phases.reduce((b, p) => b + phaseSeconds(p.seconds, p.timerStartedAt, now), 0),
      0
    );
    const avgDone = doneVideos.length > 0 ? doneSeconds / doneVideos.length : avgSecPerVideo;
    const etaSeconds = avgDone !== null ? avgDone * remaining : null;

    const maxPhase = Math.max(1, ...Array.from(perPhase.values()));

    return { totalSeconds, total, done, remaining, pct, avgSecPerVideo, etaSeconds, perPhase, maxPhase };
  }, [videos, nowTick]);

  return (
    <div className="space-y-6">
      {/* Voortgangsbalk video's klaar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-semibold text-gray-900">{stats.done}</span>
            <span className="text-lg text-gray-500"> / {stats.total}</span>
            <span className="ml-2 text-sm text-gray-600">video's klaar</span>
          </div>
          <div className="text-sm text-gray-600">{stats.pct.toFixed(1)}%</div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${stats.pct}%`, backgroundColor: '#6b2d8f' }} />
        </div>
        <div className="mt-3 text-sm text-gray-600">Nog {stats.remaining} te gaan</div>
      </div>

      {/* Kerncijfers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tijd besteed</div>
          <div className="text-2xl font-semibold text-gray-900">{fmtSeconds(stats.totalSeconds)}</div>
          <div className="text-xs text-gray-500 mt-1">
            over {stats.total} video{stats.total === 1 ? '' : "'s"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Gemiddeld per video</div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.avgSecPerVideo !== null ? fmtMinSec(stats.avgSecPerVideo) : '–'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.total > 0 ? `op basis van ${stats.total} video's` : 'nog geen data'}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Geschatte resttijd</div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.etaSeconds !== null ? fmtSeconds(stats.etaSeconds) : '–'}
          </div>
          <div className="text-xs text-gray-500 mt-1">bij huidig tempo × {stats.remaining} video's</div>
        </div>
      </div>

      {/* Tijd per fase */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tijd per fase</h3>
        <div className="space-y-2">
          {VIDEO_PHASES.map((phase) => {
            const sec = stats.perPhase.get(phase) ?? 0;
            const p = (sec / stats.maxPhase) * 100;
            return (
              <div key={phase} className="grid grid-cols-[140px_1fr_90px] items-center gap-3">
                <div className="text-sm text-gray-700 truncate">{PHASE_LABELS[phase]}</div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full" style={{ width: `${p}%`, backgroundColor: '#6b2d8f' }} />
                </div>
                <div className="text-xs text-gray-600 text-right tabular-nums">{fmtSeconds(sec)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
