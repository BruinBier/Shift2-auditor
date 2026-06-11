'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  projectId: string;
}

type Status = 'idle' | 'unsafe' | 'running' | 'done' | 'error';

interface SampleProgress {
  id: string;
  title: string;
  url: string | null;
  status: 'pending' | 'running' | 'done' | 'skipped' | 'error';
  testsFound?: number;
  error?: string;
}

export default function CrawlAllButton({ projectId }: Props) {
  const router = useRouter();
  const [auditSessionRunning, setAuditSessionRunning] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<SampleProgress[]>([]);

  // Pollen of audit-sessie draait
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/audit-session/status', { cache: 'no-store' });
        const data = await res.json();
        setAuditSessionRunning(data.running);
      } catch {
        setAuditSessionRunning(false);
      }
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  async function startCrawl() {
    if (!auditSessionRunning) return;
    setModalOpen(true);
    setStatus('running');

    // Haal sample-items op
    let samples: any[] = [];
    try {
      const res = await fetch(`/api/projects/${projectId}/sample-items`, { cache: 'no-store' });
      samples = await res.json();
    } catch (err: any) {
      setStatus('error');
      return;
    }

    const initial: SampleProgress[] = samples.map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
      status: s.url ? 'pending' : 'skipped',
    }));
    setProgress(initial);

    // Loop door samples, één voor één
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      if (!sample.url) continue;

      setProgress((prev) =>
        prev.map((p) => (p.id === sample.id ? { ...p, status: 'running' } : p)),
      );

      try {
        const res = await fetch(`/api/sample-items/${sample.id}/crawler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withBrowser: true }),
        });
        const data = await res.json();
        if (res.ok) {
          setProgress((prev) =>
            prev.map((p) =>
              p.id === sample.id ? { ...p, status: 'done', testsFound: data.testsFound } : p,
            ),
          );
        } else {
          setProgress((prev) =>
            prev.map((p) =>
              p.id === sample.id ? { ...p, status: 'error', error: data.error || 'Onbekende fout' } : p,
            ),
          );
        }
      } catch (err: any) {
        setProgress((prev) =>
          prev.map((p) =>
            p.id === sample.id ? { ...p, status: 'error', error: err.message || 'Netwerkfout' } : p,
          ),
        );
      }
    }

    setStatus('done');
  }

  function closeModal() {
    setModalOpen(false);
    setProgress([]);
    setStatus('idle');
    router.refresh();
  }

  const disabled = !auditSessionRunning;
  const tooltip = disabled
    ? 'Start eerst de audit-sessie (knop links bovenin) zodat de crawler de ingelogde Chrome gebruikt.'
    : 'Voer alle automatische tests uit op de sample-items van dit project.';

  return (
    <>
      <button
        onClick={startCrawl}
        disabled={disabled}
        title={tooltip}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          disabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        Crawler-tests draaien
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {status === 'running'
                  ? 'Crawler-tests draaien...'
                  : status === 'done'
                  ? 'Klaar'
                  : 'Crawler-tests'}
              </h3>
              {status !== 'running' && (
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <ProgressSummary progress={progress} />

            <div className="overflow-y-auto flex-grow border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="px-3 py-2 w-8">Status</th>
                    <th className="px-3 py-2">Sample</th>
                    <th className="px-3 py-2 text-right w-24">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        {p.status === 'pending' && <span className="text-gray-400">○</span>}
                        {p.status === 'running' && (
                          <span className="text-blue-600 animate-pulse">●</span>
                        )}
                        {p.status === 'done' && <span className="text-green-600">✓</span>}
                        {p.status === 'skipped' && (
                          <span className="text-gray-400" title="Geen URL">—</span>
                        )}
                        {p.status === 'error' && (
                          <span className="text-red-600" title={p.error}>
                            ✗
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-gray-900">{p.title}</div>
                        {p.url && <div className="text-xs text-gray-500 truncate max-w-md">{p.url}</div>}
                        {p.error && <div className="text-xs text-red-600">{p.error}</div>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.testsFound !== undefined ? (
                          <span className={p.testsFound > 0 ? 'text-red-700 font-medium' : 'text-green-600'}>
                            {p.testsFound}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {status === 'done' && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800 text-sm"
                >
                  Sluiten en resultaten bekijken
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ProgressSummary({ progress }: { progress: SampleProgress[] }) {
  const done = progress.filter((p) => p.status === 'done').length;
  const skipped = progress.filter((p) => p.status === 'skipped').length;
  const errors = progress.filter((p) => p.status === 'error').length;
  const running = progress.filter((p) => p.status === 'running').length;
  const pending = progress.filter((p) => p.status === 'pending').length;
  const total = progress.length;
  const processed = done + skipped + errors;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span>
          {processed} van {total} verwerkt
          {running > 0 && ` · 1 actief`}
          {pending > 0 && ` · ${pending} wachtend`}
          {errors > 0 && ` · ${errors} fout`}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
