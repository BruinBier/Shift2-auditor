'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Navigation from '@/app/components/Navigation';
import { fmtMinSec } from '@/lib/formatTime';
import { GEMEENTEN, GEMEENTE_LABELS, PHASE_LABELS } from '@/lib/videoPhases';
import VideoStats from './VideoStats';
import Werkwijze from './Werkwijze';
import type { Video, VideoPhase, PhaseStatus } from './types';

const STATUS_BADGE: Record<PhaseStatus, string> = {
  todo: 'bg-gray-100 text-gray-600',
  bezig: 'bg-blue-100 text-blue-800',
  klaar: 'bg-green-100 text-green-800',
  nvt: 'bg-amber-100 text-amber-800',
};

const STATUS_LABEL: Record<PhaseStatus, string> = {
  todo: 'Te doen',
  bezig: 'Bezig',
  klaar: 'Klaar',
  nvt: 'N.v.t.',
};

export default function VideoA2GemeentenPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gemeenteFilter, setGemeenteFilter] = useState<string>('');

  // Live-tik voor de lopende timer.
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Modals
  const [showNew, setShowNew] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const runningPhaseId = useMemo(() => {
    for (const v of videos) for (const p of v.phases) if (p.timerStartedAt) return p.id;
    return null;
  }, [videos]);

  const fetchVideos = async () => {
    const res = await fetch('/api/videos');
    if (res.ok) setVideos(await res.json());
  };

  useEffect(() => {
    fetchVideos().finally(() => setIsLoading(false));
  }, []);

  // Alleen tikken als er een timer loopt.
  useEffect(() => {
    if (!runningPhaseId) return;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [runningPhaseId]);

  // Video (velden zoals notities) in de lokale state vervangen, fasen behouden.
  const applyVideo = (updated: Video) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...v, ...updated, phases: v.phases } : v))
    );
  };

  // Fase in de lokale state vervangen.
  const applyPhase = (updated: VideoPhase | null) => {
    if (!updated) return;
    setVideos((prev) =>
      prev.map((v) => ({
        ...v,
        phases: v.phases.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
      }))
    );
  };

  const startTimer = async (phaseId: string) => {
    // Optimistic: stop de lopende (in UI) en start deze.
    setVideos((prev) =>
      prev.map((v) => ({
        ...v,
        phases: v.phases.map((p) => {
          if (p.id === phaseId) {
            return { ...p, timerStartedAt: new Date().toISOString(), status: 'bezig' as PhaseStatus };
          }
          if (p.timerStartedAt) {
            const elapsed = Math.max(0, Math.round((Date.now() - new Date(p.timerStartedAt).getTime()) / 1000));
            return { ...p, seconds: p.seconds + elapsed, timerStartedAt: null };
          }
          return p;
        }),
      }))
    );
    try {
      const res = await fetch(`/api/video-phases/${phaseId}/timer`, { method: 'POST' });
      if (res.status === 409) {
        await fetchVideos();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { started, stopped } = await res.json();
      applyPhase(stopped);
      applyPhase(started);
    } catch (e) {
      await fetchVideos(); // reconcilieer bij fout
    }
  };

  const stopTimer = async (phaseId: string) => {
    setVideos((prev) =>
      prev.map((v) => ({
        ...v,
        phases: v.phases.map((p) => {
          if (p.id !== phaseId || !p.timerStartedAt) return p;
          const elapsed = Math.max(0, Math.round((Date.now() - new Date(p.timerStartedAt).getTime()) / 1000));
          return { ...p, seconds: p.seconds + elapsed, timerStartedAt: null };
        }),
      }))
    );
    try {
      const res = await fetch(`/api/video-phases/${phaseId}/timer`, { method: 'DELETE' });
      if (res.ok) applyPhase(await res.json());
    } catch {
      await fetchVideos();
    }
  };

  const setPhaseStatus = async (phaseId: string, status: PhaseStatus) => {
    applyPhase({ id: phaseId, status } as VideoPhase);
    try {
      const res = await fetch(`/api/video-phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) applyPhase(await res.json());
    } catch {
      await fetchVideos();
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze video wilt verwijderen?')) return;
    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const filtered = gemeenteFilter ? videos.filter((v) => v.gemeente === gemeenteFilter) : videos;

  const liveSeconds = (p: VideoPhase): number => {
    if (!p.timerStartedAt) return p.seconds;
    return p.seconds + Math.max(0, Math.round((nowTick - new Date(p.timerStartedAt).getTime()) / 1000));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-8">
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
        {/* Kop */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video A2-gemeenten ({videos.length})</h1>
            <p className="text-sm text-gray-600 mt-1">
              Video's toegankelijk maken en per fase de bestede tijd bijhouden met een timer.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              Excel importeren
            </button>
            <button
              onClick={() => setShowBulk(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              Bulk toevoegen
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              Nieuwe video
            </button>
          </div>
        </div>

        {/* Werkwijze-naslag */}
        <Werkwijze />

        {/* Statistiek */}
        <VideoStats videos={videos} nowTick={nowTick} />

        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Gemeente:</label>
          <select
            value={gemeenteFilter}
            onChange={(e) => setGemeenteFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Alle</option>
            {GEMEENTEN.map((g) => (
              <option key={g} value={g}>
                {GEMEENTE_LABELS[g]}
              </option>
            ))}
          </select>
        </div>

        {/* Video-lijst */}
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg p-10 text-center">
            Nog geen video's. Voeg er een toe via "Nieuwe video", "Bulk toevoegen" of "Excel importeren".
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((v) => (
              <div key={v.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
                        {GEMEENTE_LABELS[v.gemeente]}
                      </span>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:underline truncate"
                        style={{ color: '#6b2d8f' }}
                        title={v.url}
                      >
                        {v.titel}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteVideo(v.id)}
                    className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors shrink-0"
                  >
                    Verwijderen
                  </button>
                </div>

                {/* Fase-cellen */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {v.phases.map((p) => {
                    const running = !!p.timerStartedAt;
                    return (
                      <div
                        key={p.id}
                        className={`border rounded-lg p-3 ${running ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">{PHASE_LABELS[p.phase]}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_BADGE[p.status]}`}>
                            {STATUS_LABEL[p.status]}
                          </span>
                        </div>
                        <div className="text-lg font-semibold tabular-nums text-gray-900 mb-2">
                          {fmtMinSec(liveSeconds(p))}
                        </div>
                        <div className="flex items-center gap-1">
                          {running ? (
                            <button
                              onClick={() => stopTimer(p.id)}
                              className="flex-1 text-xs px-2 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              ⏹ Stop
                            </button>
                          ) : (
                            <button
                              onClick={() => startTimer(p.id)}
                              className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              ▶ Start
                            </button>
                          )}
                          <select
                            value={p.status}
                            onChange={(e) => setPhaseStatus(p.id, e.target.value as PhaseStatus)}
                            className="text-xs border border-gray-300 rounded px-1 py-1.5"
                            title="Status"
                          >
                            <option value="todo">Te doen</option>
                            <option value="bezig">Bezig</option>
                            <option value="klaar">Klaar</option>
                            <option value="nvt">N.v.t.</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notities */}
                <VideoNotes video={v} onSaved={applyVideo} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && <NewVideoModal onClose={() => setShowNew(false)} onCreated={fetchVideos} />}
      {showBulk && <BulkModal onClose={() => setShowBulk(false)} onDone={fetchVideos} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={fetchVideos} />}
    </div>
  );
}

/* ---------- Notities per video ---------- */

function VideoNotes({ video, onSaved }: { video: Video; onSaved: (v: Video) => void }) {
  const [open, setOpen] = useState(!!video.notities);
  const [text, setText] = useState(video.notities ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  const dirty = (text.trim() || '') !== (video.notities?.trim() || '');

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notities: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      onSaved(await res.json());
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2000);
    } catch (e: any) {
      alert('Opslaan mislukt: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Notities{!open && video.notities ? ' (ingevuld)' : ''}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded font-mono"
            placeholder="Aantekeningen bij deze video, bijv. gemaakte ondertiteling-correcties…"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="text-xs px-3 py-1.5 rounded text-white hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              {saving ? 'Bezig…' : 'Notitie opslaan'}
            </button>
            {savedAt && <span className="text-xs text-green-700">✓ opgeslagen</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modals ---------- */

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function GemeenteSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
    >
      <option value="">Kies een gemeente…</option>
      {GEMEENTEN.map((g) => (
        <option key={g} value={g}>
          {GEMEENTE_LABELS[g]}
        </option>
      ))}
    </select>
  );
}

function NewVideoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [gemeente, setGemeente] = useState('');
  const [titel, setTitel] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!gemeente || !titel.trim() || !url.trim()) {
      alert('Kies een gemeente en vul titel en URL in.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemeente, titel, url }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      onCreated();
      onClose();
    } catch (e: any) {
      alert('Opslaan mislukt: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Nieuwe video" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gemeente</label>
          <GemeenteSelect value={gemeente} onChange={setGemeente} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
          <input
            type="text"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
            placeholder="Bijv. Energiefestival Heeze-Leende 2025"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">YouTube-URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
            placeholder="https://youtu.be/…"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="text-sm px-4 py-2 rounded text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#6b2d8f' }}
          >
            {saving ? 'Bezig…' : 'Toevoegen'}
          </button>
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Annuleer
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function BulkModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [gemeente, setGemeente] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!gemeente || !text.trim()) {
      alert('Kies een gemeente en plak minstens één URL.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/videos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemeente, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      alert(`${data.created} video's toegevoegd${data.skipped ? `, ${data.skipped} overgeslagen (dubbel)` : ''}.`);
      onDone();
      onClose();
    } catch (e: any) {
      alert('Mislukt: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Bulk toevoegen" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gemeente</label>
          <GemeenteSelect value={gemeente} onChange={setGemeente} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">YouTube-URL's (één per regel)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded font-mono"
            placeholder={'https://youtu.be/…\nhttps://youtu.be/…'}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="text-sm px-4 py-2 rounded text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#6b2d8f' }}
          >
            {saving ? 'Bezig…' : 'Toevoegen'}
          </button>
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Annuleer
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [gemeente, setGemeente] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      alert('Kies een .xlsx-bestand.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (gemeente) fd.append('gemeente', gemeente);
      const res = await fetch('/api/videos/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      alert(`${data.created} video's geïmporteerd${data.skipped ? `, ${data.skipped} overgeslagen (dubbel)` : ''}.`);
      onDone();
      onClose();
    } catch (e: any) {
      alert('Import mislukt: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Excel importeren" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-gray-600">
          Upload een .xlsx met een kolom <strong>"URL-alias"</strong> (of "Url alias"). De titel komt
          uit de kolom <strong>"Medianaam"</strong>. Heeft het bestand een <strong>"Gemeente"</strong>-kolom
          (zoals het A2-overzicht), dan wordt de gemeente per rij daaruit gehaald en hoef je hieronder niets
          te kiezen. Zo niet, kies dan een gemeente voor alle rijen.
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Gemeente <span className="text-gray-400">(alleen nodig zonder Gemeente-kolom)</span>
          </label>
          <GemeenteSelect value={gemeente} onChange={setGemeente} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Bestand (.xlsx)</label>
          <input ref={fileRef} type="file" accept=".xlsx" className="w-full text-sm" />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="text-sm px-4 py-2 rounded text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#6b2d8f' }}
          >
            {saving ? 'Bezig…' : 'Importeren'}
          </button>
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Annuleer
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
