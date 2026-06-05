'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TussencheckProps {
  project: any;
}

type Phase = 'nulmeting' | 'tussencheck' | 'herinspectie' | 'afgerond';

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  resolved: 'Opgelost',
  published: 'Gepubliceerd',
};

const PHASE_LABEL: Record<Phase, string> = {
  nulmeting: 'Nulmeting',
  tussencheck: 'Tussencheck',
  herinspectie: 'Herinspectie',
  afgerond: 'Afgerond',
};

export default function Tussencheck({ project }: TussencheckProps) {
  const router = useRouter();
  const phase: Phase = project.checkPhase ?? 'nulmeting';

  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'reviewed' | 'unreviewed' | 'opmerking'>('all');
  const [groupBy, setGroupBy] = useState<'criterium' | 'impact'>('criterium');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const findings = useMemo(() => {
    const list = (project.findings ?? []) as any[];
    // Sort same way as the report's Bevindingen tab:
    //   1) real findings (impact != null) before opmerkingen (impact == null)
    //   2) within each group, by sortOrder (then findingCode as tie-breaker)
    return list.slice().sort((a, b) => {
      const aIsOpmerking = a.impact == null ? 1 : 0;
      const bIsOpmerking = b.impact == null ? 1 : 0;
      if (aIsOpmerking !== bIsOpmerking) return aIsOpmerking - bIsOpmerking;
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so !== 0) return so;
      return (a.findingCode || '').localeCompare(b.findingCode || '', 'nl', { numeric: true });
    });
  }, [project.findings]);

  // Voortgangs-tellers
  const realFindings = findings.filter((f) => f.impact != null);
  const opmerkingen = findings.filter((f) => f.impact == null);
  const reviewedCount = findings.filter((f) => f.interimReviewed).length;
  const realResolvedCount = realFindings.filter((f) => f.status === 'resolved').length;
  const realOpenCount = realFindings.filter((f) => f.status === 'open').length;

  // Filtering
  const visibleFindings = findings.filter((f) => {
    switch (filter) {
      case 'all':
        return true;
      case 'open':
        return f.impact != null && f.status === 'open';
      case 'resolved':
        return f.impact != null && f.status === 'resolved';
      case 'reviewed':
        return f.interimReviewed;
      case 'unreviewed':
        return !f.interimReviewed;
      case 'opmerking':
        return f.impact == null;
      default:
        return true;
    }
  });

  // Groepering — rapport-stijl bij groupBy=criterium:
  //   Section "Bevindingen" (echte bevindingen, criteria op WCAG-code)
  //   Section "Opmerkingen" (opmerkingen, criteria op WCAG-code)
  // Findings binnen criterium op sortOrder (zoals het rapport).
  type Section = { sectionTitle: string | null; groups: [string, any[]][] };

  const compareWcagCodes = (a: string, b: string) => {
    const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
    const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (d !== 0) return d;
    }
    return 0;
  };

  const sortByCriterium = (groups: Map<string, any[]>): [string, any[]][] => {
    const entries = Array.from(groups.entries());
    entries.sort((a, b) => {
      const codeA = a[0].split(' ')[0];
      const codeB = b[0].split(' ')[0];
      return compareWcagCodes(codeA, codeB);
    });
    return entries;
  };

  const sections: Section[] = useMemo(() => {
    if (groupBy === 'impact') {
      const groups = new Map<string, any[]>();
      for (const f of visibleFindings) {
        const key = f.impact ?? 'opmerking';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(f);
      }
      return [{ sectionTitle: null, groups: Array.from(groups.entries()) }];
    }

    // groupBy === 'criterium' → rapport-stijl in twee secties
    const bevindingen = new Map<string, any[]>();
    const opmerkingen = new Map<string, any[]>();

    for (const f of visibleFindings) {
      const key = `${f.wcagCriterion?.code ?? '?'} — ${f.wcagCriterion?.title ?? ''}`;
      const target = f.impact == null ? opmerkingen : bevindingen;
      if (!target.has(key)) target.set(key, []);
      target.get(key)!.push(f);
    }

    const result: Section[] = [];
    if (bevindingen.size > 0) {
      result.push({ sectionTitle: 'Bevindingen', groups: sortByCriterium(bevindingen) });
    }
    if (opmerkingen.size > 0) {
      result.push({ sectionTitle: 'Opmerkingen', groups: sortByCriterium(opmerkingen) });
    }
    return result;
  }, [visibleFindings, groupBy]);

  const updateFinding = async (findingId: string, body: any) => {
    setBusyId(findingId);
    try {
      const res = await fetch(`/api/projects/${project.id}/findings/${findingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Wijziging mislukt');
      }
      router.refresh();
    } catch (e: any) {
      alert('Fout bij opslaan: ' + e.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleReviewed = (f: any) => {
    updateFinding(f.id, { interimReviewed: !f.interimReviewed });
  };

  const toggleResolved = (f: any) => {
    const next = f.status === 'resolved' ? 'open' : 'resolved';
    updateFinding(f.id, { status: next });
  };

  if (phase !== 'tussencheck' && phase !== 'herinspectie') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">Tussencheck nog niet actief</h2>
        <p className="text-sm text-yellow-800">
          De tussencheck-tab is alleen beschikbaar als het project in fase{' '}
          <strong>tussencheck</strong> of <strong>herinspectie</strong> staat. Dit project staat momenteel in
          fase <strong>{PHASE_LABEL[phase]}</strong>.
        </p>
      </div>
    );
  }

  const startedAt = project.checkPhaseStartedAt
    ? new Date(project.checkPhaseStartedAt).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const reviewedPct = findings.length > 0 ? Math.round((reviewedCount / findings.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {phase === 'tussencheck' ? 'Tussencheck' : 'Herinspectie'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Loop de bevindingen langs en markeer per bevinding of die opgelost is. De status van het
              criterium wordt automatisch bijgewerkt zodra alle bevindingen van dat criterium opgelost zijn.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Fase gestart op {startedAt}
              {project.interimCheckLabel ? ` — ${project.interimCheckLabel}` : ''}
            </p>
            <div className="mt-3">
              <a
                href={`/api/projects/${project.id}/voortgang-export`}
                download
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Exporteer voortgangsoverzicht (DOCX)
              </a>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[280px]">
            <div className="text-sm text-gray-700">
              <strong>{reviewedCount}</strong> van {findings.length} bevindingen nagelopen ({reviewedPct}%)
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-shift2-primary transition-all"
                style={{ width: `${reviewedPct}%`, backgroundColor: '#6b2d8f' }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Echte bevindingen: <strong>{realResolvedCount}</strong> opgelost,{' '}
              <strong>{realOpenCount}</strong> open
              {opmerkingen.length > 0 && (
                <> · Opmerkingen: <strong>{opmerkingen.length}</strong></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="all">Alles ({findings.length})</option>
            <option value="open">Nog open ({realOpenCount})</option>
            <option value="resolved">Opgelost ({realResolvedCount})</option>
            <option value="reviewed">Nagelopen ({reviewedCount})</option>
            <option value="unreviewed">Niet nagelopen ({findings.length - reviewedCount})</option>
            <option value="opmerking">Opmerkingen ({opmerkingen.length})</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Groeperen op:</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="criterium">Criterium</option>
            <option value="impact">Impact</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {visibleFindings.length} van {findings.length} bevindingen zichtbaar
        </div>
      </div>

      {/* Findings per groep */}
      {sections.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          Geen bevindingen die aan dit filter voldoen.
        </div>
      ) : (
        sections.map((section, sIdx) => (
          <div key={section.sectionTitle ?? `sec-${sIdx}`} className="space-y-4">
            {section.sectionTitle && (
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2 pb-2 border-b border-gray-300">
                {section.sectionTitle}
              </h2>
            )}
            {section.groups.map(([groupKey, items]) => (
              <div key={groupKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">{groupKey}</h3>
              <p className="text-xs text-gray-500">{items.length} bevinding{items.length !== 1 ? 'en' : ''}</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2 w-16">Code</th>
                  <th className="px-4 py-2 w-20">Criterium</th>
                  <th className="px-4 py-2 w-20">Impact</th>
                  <th className="px-4 py-2">Beschrijving</th>
                  <th className="px-4 py-2 w-28 text-center">Nagelopen</th>
                  <th className="px-4 py-2 w-28 text-center">Opgelost</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((f) => {
                  const isOpmerking = f.impact == null;
                  const isBusy = busyId === f.id;
                  return (
                    <tr key={f.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{f.findingCode}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{f.wcagCriterion?.code ?? '?'}</td>
                      <td className="px-4 py-3 text-xs">
                        {isOpmerking ? (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">opmerking</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded">{f.impact}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div
                          className={`cursor-pointer ${expandedIds.has(f.id) ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}
                          onClick={() => toggleExpanded(f.id)}
                          title={expandedIds.has(f.id) ? 'Klik om in te klappen' : 'Klik om volledig te tonen'}
                        >
                          {f.description}
                        </div>
                        {f.discoveredInPhase && f.discoveredInPhase !== 'nulmeting' && (
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            Nieuw in {f.discoveredInPhase}
                          </span>
                        )}
                        {f.occurrences && f.occurrences.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {f.occurrences.map((occ: any) => {
                              const item = occ.sampleItem;
                              if (!item) return null;
                              const label = (item.title || item.url || 'Sample').slice(0, 40);
                              const url = item.url;
                              const isPdf = item.sampleType === 'pdf';
                              return url ? (
                                <a
                                  key={occ.id}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={url}
                                  className={`sample-badge inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${
                                    isPdf
                                      ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
                                      : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                                  }`}
                                >
                                  {isPdf ? '📄' : '🔗'} {label}
                                </a>
                              ) : (
                                <span
                                  key={occ.id}
                                  title={item.title || ''}
                                  className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-700"
                                >
                                  📄 {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!f.interimReviewed}
                          disabled={isBusy}
                          onChange={() => toggleReviewed(f)}
                          className="w-4 h-4 cursor-pointer accent-purple-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOpmerking ? (
                          <span className="text-gray-300 text-xs">n.v.t.</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={f.status === 'resolved'}
                            disabled={isBusy}
                            onChange={() => toggleResolved(f)}
                            className="w-4 h-4 cursor-pointer accent-green-600"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={`/admin/projects/${project.id}/findings/${f.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open bevinding in nieuw tabblad"
                          className="sample-badge text-xs text-purple-700 hover:underline whitespace-nowrap"
                        >
                          Bekijk →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
