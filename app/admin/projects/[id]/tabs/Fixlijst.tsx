'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  project: any;
}

const IMPACT_LABEL: Record<string, string> = {
  klein: 'Klein',
  matig: 'Matig',
  serieus: 'Serieus',
  kritiek: 'Kritiek',
  onbekend: 'Onbekend',
};

const IMPACT_COLOR: Record<string, string> = {
  klein: 'bg-yellow-100 text-yellow-800',
  matig: 'bg-orange-100 text-orange-800',
  serieus: 'bg-red-100 text-red-800',
  kritiek: 'bg-red-200 text-red-900',
  onbekend: 'bg-gray-100 text-gray-800',
};

function statusLabel(s: string): string {
  if (s === 'open') return 'Afgekeurd';
  if (s === 'resolved') return 'Opmerking';
  if (s === 'published') return 'Gepubliceerd';
  return s;
}

function statusBadge(s: string): string {
  if (s === 'open') return 'bg-red-100 text-red-800';
  if (s === 'resolved') return 'bg-blue-100 text-blue-800';
  if (s === 'published') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + '…';
}

export default function Fixlijst({ project }: Props) {
  const router = useRouter();
  const findings: any[] = project.findings ?? [];
  const assessments: any[] = project.criterionAssessments ?? [];
  const advices: any[] = project.advices ?? [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [scFilter, setScFilter] = useState<string | null>(null);

  // Advice form state
  const [showAdviceForm, setShowAdviceForm] = useState(false);
  const [editingAdviceId, setEditingAdviceId] = useState<string | null>(null);
  const [adviceTitle, setAdviceTitle] = useState('');
  const [adviceText, setAdviceText] = useState('');
  const [adviceReason, setAdviceReason] = useState('');
  const [adviceWcag, setAdviceWcag] = useState('');
  const [adviceSaving, setAdviceSaving] = useState(false);
  const [expandedAdvices, setExpandedAdvices] = useState<Set<string>>(new Set());

  const resetAdviceForm = () => {
    setShowAdviceForm(false);
    setEditingAdviceId(null);
    setAdviceTitle('');
    setAdviceText('');
    setAdviceReason('');
    setAdviceWcag('');
  };

  const startEditAdvice = (advice: any) => {
    setEditingAdviceId(advice.id);
    setAdviceTitle(advice.title);
    setAdviceText(advice.adviceText);
    setAdviceReason(advice.reasonText);
    setAdviceWcag(advice.wcagCriterion?.code ?? '');
    setShowAdviceForm(true);
  };

  const saveAdvice = async () => {
    if (!adviceTitle.trim() || !adviceText.trim() || !adviceReason.trim()) {
      alert('Vul titel, advies en reden in.');
      return;
    }
    setAdviceSaving(true);
    try {
      // Resolve wcag code -> id if given
      let wcagCriterionId: string | null = null;
      const code = adviceWcag.trim();
      if (code) {
        const res = await fetch('/api/wcag-criteria');
        if (res.ok) {
          const crits: any[] = await res.json();
          const match = crits.find((c) => c.code === code);
          if (!match) {
            alert(`WCAG-criterium "${code}" niet gevonden.`);
            setAdviceSaving(false);
            return;
          }
          wcagCriterionId = match.id;
        }
      }

      const url = editingAdviceId
        ? `/api/projects/${project.id}/advices/${editingAdviceId}`
        : `/api/projects/${project.id}/advices`;
      const res = await fetch(url, {
        method: editingAdviceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adviceTitle,
          adviceText,
          reasonText: adviceReason,
          wcagCriterionId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      resetAdviceForm();
      router.refresh();
    } catch (e: any) {
      alert('Opslaan mislukt: ' + e.message);
    } finally {
      setAdviceSaving(false);
    }
  };

  const deleteAdvice = async (id: string) => {
    if (!confirm('Advies verwijderen?')) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/advices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e: any) {
      alert('Verwijderen mislukt: ' + e.message);
    }
  };

  const toggleAdviceExpanded = (id: string) => {
    setExpandedAdvices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Only findings that are actually logged (open or resolved)
  const relevant = useMemo(
    () => findings.filter((f) => f.status === 'open' || f.status === 'resolved'),
    [findings]
  );

  const filtered = useMemo(
    () => (scFilter ? relevant.filter((f) => f.wcagCriterion?.code === scFilter) : relevant),
    [relevant, scFilter]
  );

  // Group: open first, then resolved
  const openFindings = filtered.filter((f) => f.status === 'open');
  const opmerkingen = filtered.filter((f) => f.status === 'resolved');

  // Right column: SCs tested (assessments with status != not_tested)
  const testedSCs = useMemo(() => {
    const map = new Map<
      string,
      { code: string; title: string; status: string; issueCount: number }
    >();
    for (const a of assessments) {
      if (!a.wcagCriterion) continue;
      if (a.status === 'not_tested') continue;
      map.set(a.wcagCriterion.code, {
        code: a.wcagCriterion.code,
        title: a.wcagCriterion.titleNl || '',
        status: a.status,
        issueCount: 0,
      });
    }
    // Count issues per SC (open + resolved)
    for (const f of relevant) {
      const code = f.wcagCriterion?.code;
      if (!code) continue;
      const cur = map.get(code);
      if (cur) cur.issueCount++;
    }
    return Array.from(map.values()).sort((a, b) => {
      const ap = a.code.split('.').map(Number);
      const bp = b.code.split('.').map(Number);
      for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
        const av = ap[i] ?? 0;
        const bv = bp[i] ?? 0;
        if (av !== bv) return av - bv;
      }
      return 0;
    });
  }, [assessments, relevant]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFindingRow = (f: any) => {
    const isOpen = expanded.has(f.id);
    const occs = f.occurrences ?? [];
    const pageCount = occs.length;
    return (
      <div key={f.id} className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleExpanded(f.id)}
          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <span className="text-xs font-mono text-gray-500 w-14 shrink-0">{f.findingCode}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${statusBadge(f.status)}`}>
            {statusLabel(f.status)}
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono shrink-0">
            {f.wcagCriterion?.code}
          </span>
          {f.impact && f.status === 'open' && (
            <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${IMPACT_COLOR[f.impact] ?? IMPACT_COLOR.onbekend}`}>
              {IMPACT_LABEL[f.impact] ?? f.impact}
            </span>
          )}
          <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
            {truncate((f.description ?? '').replace(/\s+/g, ' '), 120)}
          </span>
          <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">
            {pageCount} pagina{pageCount === 1 ? '' : "'s"}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {isOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 bg-gray-50">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Beschrijving</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{f.description}</div>
            </div>
            {f.advice && (
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Advies</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{f.advice}</div>
              </div>
            )}
            {occs.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Pagina{occs.length === 1 ? '' : "'s"}
                </div>
                <ul className="text-sm space-y-0.5">
                  {occs.map((o: any) => (
                    <li key={o.id}>
                      {o.sampleItem?.url ? (
                        <a
                          href={o.sampleItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-shift2-primary hover:underline"
                          style={{ color: '#6b2d8f' }}
                        >
                          {o.sampleItem.title || o.sampleItem.url}
                        </a>
                      ) : (
                        <span className="text-gray-500">(geen URL)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-1">
              <Link
                href={`/admin/projects/${project.id}/findings/${f.id}`}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-white transition-colors inline-block"
              >
                Bewerken
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-8">
      {/* Left: findings list */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Fixlijst</h2>
          <p className="text-sm text-gray-600">
            Uitsluitend de daadwerkelijk vastgelegde issues en opmerkingen voor dit project.
          </p>
        </div>

        {scFilter && (
          <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 flex items-center justify-between">
            <span>
              Gefilterd op SC <span className="font-mono">{scFilter}</span>
            </span>
            <button onClick={() => setScFilter(null)} className="text-xs underline text-gray-600 hover:text-gray-900">
              Filter opheffen
            </button>
          </div>
        )}

        {openFindings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Afgekeurd <span className="text-gray-500 font-normal">({openFindings.length})</span>
            </h3>
            <div className="space-y-2">{openFindings.map(renderFindingRow)}</div>
          </div>
        )}

        {opmerkingen.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Opmerkingen <span className="text-gray-500 font-normal">({opmerkingen.length})</span>
            </h3>
            <div className="space-y-2">{opmerkingen.map(renderFindingRow)}</div>
          </div>
        )}

        {relevant.length === 0 && (
          <div className="text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            Nog geen bevindingen vastgelegd. Zodra je een pagina afhandelt en er wat mis is, verschijnt de bevinding hier.
          </div>
        )}

        {/* Advices section */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Adviezen <span className="text-gray-500 font-normal">({advices.length})</span>
            </h3>
            {!showAdviceForm && (
              <button
                onClick={() => setShowAdviceForm(true)}
                className="text-xs px-3 py-1.5 rounded text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                + Advies toevoegen
              </button>
            )}
          </div>

          <p className="text-xs text-gray-600 mb-3">
            Algemene adviezen die los staan van een specifieke pagina — richtlijnen voor redacteur of
            ontwikkelaar.
          </p>

          {showAdviceForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Titel <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={adviceTitle}
                  onChange={(e) => setAdviceTitle(e.target.value)}
                  placeholder='Bijv. "Label telefoonnummers en e-mailadressen"'
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Advies <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={adviceText}
                  onChange={(e) => setAdviceText(e.target.value)}
                  rows={4}
                  placeholder="Wat moet er gebeuren?"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Waarom <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={adviceReason}
                  onChange={(e) => setAdviceReason(e.target.value)}
                  rows={4}
                  placeholder="Waarom is dit belangrijk?"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  WCAG-criterium (optioneel)
                </label>
                <input
                  type="text"
                  value={adviceWcag}
                  onChange={(e) => setAdviceWcag(e.target.value)}
                  placeholder='Bijv. "2.4.4"'
                  className="w-40 text-sm px-3 py-2 border border-gray-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-shift2-primary"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveAdvice}
                  disabled={adviceSaving}
                  className="text-sm px-4 py-2 rounded text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#6b2d8f' }}
                >
                  {adviceSaving ? 'Bezig...' : editingAdviceId ? 'Opslaan' : 'Toevoegen'}
                </button>
                <button
                  onClick={resetAdviceForm}
                  disabled={adviceSaving}
                  className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuleer
                </button>
              </div>
            </div>
          )}

          {advices.length > 0 && (
            <div className="space-y-2">
              {advices.map((a) => {
                const isOpen = expandedAdvices.has(a.id);
                return (
                  <div key={a.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleAdviceExpanded(a.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-purple-100 text-purple-800 shrink-0">
                        Advies
                      </span>
                      {a.wcagCriterion && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono shrink-0">
                          {a.wcagCriterion.code}
                        </span>
                      )}
                      <span className="text-sm text-gray-800 flex-1 min-w-0 truncate font-medium">
                        {a.title}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 bg-gray-50">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                            Advies
                          </div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">{a.adviceText}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                            Waarom
                          </div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">{a.reasonText}</div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => startEditAdvice(a)}
                            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-white transition-colors"
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={() => deleteAdvice(a.id)}
                            className="text-xs px-3 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {advices.length === 0 && !showAdviceForm && (
            <div className="text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              Nog geen adviezen. Klik op "Advies toevoegen" om er een aan te maken.
            </div>
          )}
        </div>
      </div>

      {/* Right: tested SCs */}
      <aside>
        <div className="sticky top-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Getest op</h3>
            <p className="text-xs text-gray-600">
              Criteria die op ten minste één pagina beoordeeld zijn.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {testedSCs.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">Nog geen criteria beoordeeld.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {testedSCs.map((sc) => {
                  const isActive = scFilter === sc.code;
                  return (
                    <li key={sc.code}>
                      <button
                        onClick={() => setScFilter(isActive ? null : sc.code)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                          isActive ? 'bg-yellow-50' : ''
                        }`}
                        title={isActive ? 'Klik om filter op te heffen' : `Filter op ${sc.code}`}
                      >
                        <span className="font-mono text-xs text-gray-600 w-14 shrink-0">{sc.code}</span>
                        <span className="text-xs text-gray-800 flex-1 min-w-0 truncate">{sc.title}</span>
                        {sc.issueCount > 0 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                              sc.issueCount > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {sc.issueCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {testedSCs.length} criteri{testedSCs.length === 1 ? 'um' : 'a'} beoordeeld • {relevant.length} bevinding
            {relevant.length === 1 ? '' : 'en'} vastgelegd
          </div>
        </div>
      </aside>
    </div>
  );
}
