'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  project: any;
}

interface PagelogEntry {
  date: string;
  start: string;
  end: string;
  seconds: number;
  url: string;
}

const PAGELOG_START = '##PAGELOG##';
const PAGELOG_END = '##/PAGELOG##';
// Format: YYYY-MM-DD HH:MM:SS - HH:MM:SS URL
const PAGELOG_LINE = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2}):(\d{2})\s+(\S+)\s*$/;

function canonicalUrl(u: string | null | undefined): string {
  if (!u) return '';
  try {
    const p = new URL(u);
    const params = new URLSearchParams(p.search);
    params.delete('origin');
    let path = p.pathname.replace(/\/+$/, '');
    if (!path) path = '/';
    const qs = params.toString();
    return `${p.protocol}//${p.host.toLowerCase()}${path}${qs ? `?${qs}` : ''}`;
  } catch {
    return u.trim();
  }
}

function parsePagelog(notes: string | null | undefined): PagelogEntry[] {
  if (!notes) return [];
  const startIdx = notes.indexOf(PAGELOG_START);
  const endIdx = notes.indexOf(PAGELOG_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return [];
  const block = notes.slice(startIdx + PAGELOG_START.length, endIdx);
  const entries: PagelogEntry[] = [];
  for (const raw of block.split(/\r?\n/)) {
    const m = raw.match(PAGELOG_LINE);
    if (!m) continue;
    const [, date, sh, sm, ss, eh, em, es, url] = m;
    const startSec = parseInt(sh) * 3600 + parseInt(sm) * 60 + parseInt(ss);
    let endSec = parseInt(eh) * 3600 + parseInt(em) * 60 + parseInt(es);
    if (endSec < startSec) endSec += 24 * 3600;
    entries.push({
      date,
      start: `${sh}:${sm}:${ss}`,
      end: `${eh}:${em}:${es}`,
      seconds: endSec - startSec,
      url,
    });
  }
  return entries;
}

function fmtSeconds(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const totalMin = sec / 60;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin - h * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}u`;
  return `${h}u ${m}min`;
}

function fmtMinSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function shortUrl(u: string): string {
  try {
    const p = new URL(u);
    return p.pathname + (p.search || '');
  } catch {
    return u;
  }
}

export default function PagecheckProgress({ project }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const scopeUrls: any[] = project.scopeUrls ?? [];
  const sampleItems: any[] = project.sampleItems ?? [];

  const checkedUrlSet = useMemo(() => {
    const s = new Set<string>();
    for (const si of sampleItems) if (si.url) s.add(canonicalUrl(si.url));
    return s;
  }, [sampleItems]);

  const rows = useMemo(
    () => scopeUrls.map((u) => ({ ...u, canonical: canonicalUrl(u.url), done: checkedUrlSet.has(canonicalUrl(u.url)) })),
    [scopeUrls, checkedUrlSet]
  );

  const total = rows.length;
  const done = rows.filter((r) => r.done).length;
  const remaining = total - done;
  const pct = total > 0 ? (done / total) * 100 : 0;

  const entries = useMemo(() => parsePagelog(project.notes), [project.notes]);
  const totalSeconds = entries.reduce((a, e) => a + e.seconds, 0);
  const pagesInLog = entries.length;
  const avgSecPerPage = pagesInLog > 0 ? totalSeconds / pagesInLog : null;
  const etaSeconds = avgSecPerPage !== null ? avgSecPerPage * remaining : null;

  const byType = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const r of rows) {
      const t = r.note || '(onbekend)';
      const cur = map.get(t) || { total: 0, done: 0 };
      cur.total++;
      if (r.done) cur.done++;
      map.set(t, cur);
    }
    return Array.from(map.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  const recentPages = entries.slice().reverse().slice(0, 15);

  // Aggregate per date (for a session-summary block)
  const perDate = useMemo(() => {
    const m = new Map<string, { pages: number; seconds: number }>();
    for (const e of entries) {
      const cur = m.get(e.date) || { pages: 0, seconds: 0 };
      cur.pages++;
      cur.seconds += e.seconds;
      m.set(e.date, cur);
    }
    return Array.from(m.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 7);
  }, [entries]);

  const copyTemplateLine = async () => {
    const line = `YYYY-MM-DD HH:MM:SS - HH:MM:SS https://www.valkenswaard.nl/...`;
    await navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Voortgang pagina-check</h2>
        <p className="text-sm text-gray-600">
          Deze tab rekent live uit hoeveel scope-URL's al zijn afgehandeld. Een URL geldt als gecheckt zodra er in dit
          project een sample-item met dezelfde URL bestaat.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-semibold text-gray-900">{done}</span>
            <span className="text-lg text-gray-500"> / {total}</span>
            <span className="ml-2 text-sm text-gray-600">pagina's gecheckt</span>
          </div>
          <div className="text-sm text-gray-600">{pct.toFixed(1)}%</div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: '#6b2d8f' }} />
        </div>
        <div className="mt-3 text-sm text-gray-600">Nog {remaining} te gaan</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tijd besteed</div>
          <div className="text-2xl font-semibold text-gray-900">{fmtSeconds(totalSeconds)}</div>
          <div className="text-xs text-gray-500 mt-1">
            over {pagesInLog} pagina{pagesInLog === 1 ? '' : "'s"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Gemiddeld per pagina</div>
          <div className="text-2xl font-semibold text-gray-900">
            {avgSecPerPage !== null ? fmtMinSec(avgSecPerPage) : '–'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {pagesInLog > 0 ? `op basis van ${pagesInLog} pagina's` : 'nog geen data'}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Geschatte resttijd</div>
          <div className="text-2xl font-semibold text-gray-900">{etaSeconds !== null ? fmtSeconds(etaSeconds) : '–'}</div>
          <div className="text-xs text-gray-500 mt-1">bij huidig tempo × {remaining} pagina's</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Voortgang per inhoudstype</h3>
        <div className="space-y-2">
          {byType.map((b) => {
            const p = b.total > 0 ? (b.done / b.total) * 100 : 0;
            return (
              <div key={b.type} className="grid grid-cols-[160px_1fr_100px] items-center gap-3">
                <div className="text-sm text-gray-700 truncate" title={b.type}>{b.type}</div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full" style={{ width: `${p}%`, backgroundColor: '#6b2d8f' }} />
                </div>
                <div className="text-xs text-gray-600 text-right tabular-nums">
                  {b.done} / {b.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {perDate.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Per dag</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="py-2">Datum</th>
                <th className="py-2 text-right">Pagina's</th>
                <th className="py-2 text-right">Tijd</th>
                <th className="py-2 text-right">Min / pagina</th>
              </tr>
            </thead>
            <tbody>
              {perDate.map((d) => (
                <tr key={d.date} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 text-gray-800">{d.date}</td>
                  <td className="py-2 text-right text-gray-800 tabular-nums">{d.pages}</td>
                  <td className="py-2 text-right text-gray-800 tabular-nums">{fmtSeconds(d.seconds)}</td>
                  <td className="py-2 text-right text-gray-600 tabular-nums">
                    {d.pages > 0 ? fmtMinSec(d.seconds / d.pages) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Laatste pagina's</h3>
          <button
            onClick={copyTemplateLine}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Kopieer een leeg log-regelformaat"
          >
            {copied ? '✓ gekopieerd' : 'Kopieer log-regel'}
          </button>
        </div>
        {recentPages.length === 0 ? (
          <div className="text-sm text-gray-600">
            Nog geen pagina's geregistreerd. Log per pagina in het notities-veld van dit project, tussen{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">##PAGELOG##</code> en{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">##/PAGELOG##</code>.
            <br />
            Regelformaat: <code className="text-xs bg-gray-100 px-1 rounded">YYYY-MM-DD HH:MM:SS - HH:MM:SS https://...</code>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="py-2">Datum</th>
                <th className="py-2">Tijd</th>
                <th className="py-2 text-right">Duur</th>
                <th className="py-2">Pagina</th>
              </tr>
            </thead>
            <tbody>
              {recentPages.map((e, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 text-gray-800 whitespace-nowrap">{e.date}</td>
                  <td className="py-2 text-gray-600 whitespace-nowrap">{e.start} – {e.end}</td>
                  <td className="py-2 text-right text-gray-800 tabular-nums">{fmtMinSec(e.seconds)}</td>
                  <td className="py-2 text-gray-700 truncate" title={e.url}>{shortUrl(e.url)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
