'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TEST_COVERAGE, ALL_AA_SCS, getTestsForSC, type TestCoverage } from '@/lib/wcag-coverage';

interface RichtlijnenProps {
  project: any;
  allCriteria: any[];
}

type StatusFilter = 'all' | 'covered' | 'uncovered' | 'has-findings' | 'has-issues';
type RespFilter = 'all' | 'content' | 'template' | 'ontwerp';

const PRINCIPLE_NAMES: Record<string, string> = {
  '1': '1. Waarneembaar',
  '2': '2. Bedienbaar',
  '3': '3. Begrijpelijk',
  '4': '4. Robuust',
};

export default function Richtlijnen({ project, allCriteria }: RichtlijnenProps) {
  // Default-filter: voor "Template-monitoring..." projecten begin met alleen template-tests.
  const defaultResp: RespFilter = project.title?.startsWith('Template-monitoring')
    ? 'template'
    : 'all';
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [respFilter, setRespFilter] = useState<RespFilter>(defaultResp);
  const [expandedSC, setExpandedSC] = useState<string | null>(null);

  // Hulpfunctie: matcht een test aan het responsibility-filter
  // 'mixed' tests verschijnen altijd (relevant voor zowel content als template)
  const matchesResp = (testResp: string): boolean => {
    if (respFilter === 'all') return true;
    if (testResp === 'mixed') return true;
    return testResp === respFilter;
  };

  // Index criteria by code
  const criteriaByCode = new Map<string, any>();
  for (const c of allCriteria) criteriaByCode.set(c.code, c);

  // Index assessments by SC code
  const assessmentByCode = new Map<string, string>();
  const explanationByCode = new Map<string, string>();
  for (const a of project.criterionAssessments || []) {
    if (a.wcagCriterion?.code && a.status) {
      assessmentByCode.set(a.wcagCriterion.code, a.status);
    }
    if (a.wcagCriterion?.code && a.explanation && a.explanation.trim()) {
      explanationByCode.set(a.wcagCriterion.code, a.explanation);
    }
  }

  // Index findings by SC code (count open vs resolved)
  const findingsByCode = new Map<string, { open: number; resolved: number; total: number }>();
  for (const f of project.findings || []) {
    const code = f.wcagCriterion?.code;
    if (!code) continue;
    if (!findingsByCode.has(code)) findingsByCode.set(code, { open: 0, resolved: 0, total: 0 });
    const counts = findingsByCode.get(code)!;
    counts.total++;
    if (f.status === 'resolved') counts.resolved++;
    else counts.open++;
  }

  // Aggregeer crawler-resultaten per SC via testName mapping
  // CrawlerResult.testName → SC's via TEST_COVERAGE
  const crawlerIssuesByCode = new Map<string, { count: number; samples: Set<string> }>();

  // Per testName: hoe vaak gedraaid, hoe vaak found, totaal voorvallen, op welke samples
  const testStatsByName = new Map<string, {
    runOn: Set<string>; // sample-ids waar de test gedraaid heeft
    foundOn: Set<string>; // sample-ids waar found=true
    totalCount: number; // som van counts (voorvallen)
    sampleTitles: Set<string>; // titels voor weergave
  }>();

  for (const sample of project.sampleItems || []) {
    for (const cr of sample.crawlerResults || []) {
      // Aggregatie per testName (ongeacht found)
      if (!testStatsByName.has(cr.testName)) {
        testStatsByName.set(cr.testName, {
          runOn: new Set(),
          foundOn: new Set(),
          totalCount: 0,
          sampleTitles: new Set(),
        });
      }
      const ts = testStatsByName.get(cr.testName)!;
      ts.runOn.add(sample.id);
      if (cr.found) {
        ts.foundOn.add(sample.id);
        ts.sampleTitles.add(sample.title || sample.id);
        ts.totalCount += cr.count || 1;
      }

      // Aggregatie per SC (alleen issues)
      const scs = TEST_COVERAGE.find((t) => t.testName === cr.testName)?.scs || [];
      if (!cr.found) continue;
      for (const sc of scs) {
        if (!crawlerIssuesByCode.has(sc)) crawlerIssuesByCode.set(sc, { count: 0, samples: new Set() });
        const entry = crawlerIssuesByCode.get(sc)!;
        entry.count += cr.count || 1;
        entry.samples.add(sample.title || sample.id);
      }
    }
  }

  // Bepaal status per SC voor visualisatie
  function getSCStatus(sc: string): {
    badge: 'passed' | 'failed' | 'not_present' | 'unknown' | 'not_tested' | 'no_assessment';
    label: string;
    color: string;
  } {
    const a = assessmentByCode.get(sc);
    switch (a) {
      case 'passed':
        return { badge: 'passed', label: 'Geslaagd', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'failed':
        return { badge: 'failed', label: 'Niet geslaagd', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'not_present':
        return { badge: 'not_present', label: 'Niet aanwezig', color: 'bg-gray-100 text-gray-700 border-gray-300' };
      case 'unknown':
        return { badge: 'unknown', label: 'Onbekend', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'not_tested':
        return { badge: 'not_tested', label: 'Niet getest', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      default:
        return { badge: 'no_assessment', label: 'Nog niet beoordeeld', color: 'bg-gray-50 text-gray-500 border-gray-200' };
    }
  }

  // Filter SC's
  const filteredSCs = ALL_AA_SCS.filter((sc) => {
    const hasTests = getTestsForSC(sc).length > 0;
    const findings = findingsByCode.get(sc);
    const crawlerIssues = crawlerIssuesByCode.get(sc);
    switch (filter) {
      case 'covered':
        return hasTests;
      case 'uncovered':
        return !hasTests;
      case 'has-findings':
        return (findings?.open || 0) > 0;
      case 'has-issues':
        return (crawlerIssues?.count || 0) > 0;
      default:
        return true;
    }
  });

  // Groepeer per principe
  const groupedByPrinciple = new Map<string, string[]>();
  for (const sc of filteredSCs) {
    const principle = sc.split('.')[0];
    if (!groupedByPrinciple.has(principle)) groupedByPrinciple.set(principle, []);
    groupedByPrinciple.get(principle)!.push(sc);
  }

  // Stats
  const totalSCs = ALL_AA_SCS.length;
  const coveredSCs = ALL_AA_SCS.filter((sc) => getTestsForSC(sc).length > 0).length;
  const scsWithFindings = ALL_AA_SCS.filter((sc) => (findingsByCode.get(sc)?.open || 0) > 0).length;
  const scsWithCrawlerIssues = ALL_AA_SCS.filter((sc) => (crawlerIssuesByCode.get(sc)?.count || 0) > 0).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Richtlijnen</h2>
        <p className="text-sm text-gray-600">
          Overzicht van alle WCAG 2.2 A + AA succescriteria met daarbij de beschikbare automatische tests,
          gevonden crawler-issues en gekoppelde bevindingen voor dit project.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Totaal SC's" value={totalSCs} color="gray" />
        <StatCard label="Automatisch dekkbaar" value={`${coveredSCs}/${totalSCs}`} color="blue" />
        <StatCard label="SC's met bevindingen" value={scsWithFindings} color="red" />
        <StatCard label="SC's met crawler-issues" value={scsWithCrawlerIssues} color="orange" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-2 pb-2">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle ({totalSCs})
        </FilterButton>
        <FilterButton active={filter === 'covered'} onClick={() => setFilter('covered')}>
          Met automatische tests ({coveredSCs})
        </FilterButton>
        <FilterButton active={filter === 'uncovered'} onClick={() => setFilter('uncovered')}>
          Alleen handmatig ({totalSCs - coveredSCs})
        </FilterButton>
        <FilterButton active={filter === 'has-findings'} onClick={() => setFilter('has-findings')}>
          Met bevindingen ({scsWithFindings})
        </FilterButton>
        <FilterButton active={filter === 'has-issues'} onClick={() => setFilter('has-issues')}>
          Met crawler-issues ({scsWithCrawlerIssues})
        </FilterButton>
      </div>

      {/* Responsibility-filter */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-4 items-center">
        <span className="text-xs uppercase tracking-wide text-gray-500 mr-2">Toon tests voor:</span>
        <FilterButton active={respFilter === 'all'} onClick={() => setRespFilter('all')}>
          Alles
        </FilterButton>
        <FilterButton active={respFilter === 'content'} onClick={() => setRespFilter('content')}>
          Content (redacteur)
        </FilterButton>
        <FilterButton active={respFilter === 'template'} onClick={() => setRespFilter('template')}>
          Template (ontwikkelaar)
        </FilterButton>
        <FilterButton active={respFilter === 'ontwerp'} onClick={() => setRespFilter('ontwerp')}>
          Ontwerp (ontwerper)
        </FilterButton>
        <span className="text-xs text-gray-400 italic ml-auto">
          "mixed"-tests verschijnen in elk filter
        </span>
      </div>

      {/* Grouped SC list */}
      {Array.from(groupedByPrinciple.entries()).map(([principle, scs]) => (
        <div key={principle} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            {PRINCIPLE_NAMES[principle] || `Principe ${principle}`}
          </h3>
          <div className="space-y-2">
            {scs.map((sc) => {
              const crit = criteriaByCode.get(sc);
              const status = getSCStatus(sc);
              const tests = getTestsForSC(sc).filter((t) => matchesResp(t.responsibility));
              const findings = findingsByCode.get(sc);
              const crawlerIssues = crawlerIssuesByCode.get(sc);
              const isExpanded = expandedSC === sc;

              return (
                <div key={sc} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSC(isExpanded ? null : sc)}
                    className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* SC code + name */}
                    <div className="flex-shrink-0 w-20 font-mono text-sm font-semibold text-gray-700">
                      {sc}
                    </div>
                    <div className="flex-shrink-0 w-12 text-xs text-gray-500">
                      {crit?.level || ''}
                    </div>
                    <div className="flex-grow text-sm text-gray-900 truncate">
                      {crit?.titleNl || crit?.title || '(geen titel)'}
                    </div>

                    {/* Test count badge */}
                    {tests.length > 0 ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {tests.length} test{tests.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        Handmatig
                      </span>
                    )}

                    {/* Crawler issues */}
                    {crawlerIssues && (
                      <span className="flex-shrink-0 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                        {crawlerIssues.count} crawler-voorval{crawlerIssues.count !== 1 ? 'len' : ''}
                      </span>
                    )}

                    {/* Findings */}
                    {findings && findings.open > 0 && (
                      <span className="flex-shrink-0 text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                        {findings.open} bevinding{findings.open !== 1 ? 'en' : ''}
                      </span>
                    )}

                    {/* Assessment status */}
                    <span
                      className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border ${status.color} font-medium`}
                    >
                      {status.label}
                    </span>

                    {/* Expand indicator */}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {sc} {crit?.titleNl || crit?.title || ''}
                        </h4>
                        {tests.length > 0 ? (
                          <div className="bg-white border border-gray-200 rounded overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                                  <th className="px-3 py-2 font-medium">Problemen</th>
                                  <th className="px-3 py-2 font-medium text-right w-24">Voorvallen</th>
                                  <th className="px-3 py-2 font-medium text-right w-32">Afgewezen voorvallen</th>
                                  <th className="px-3 py-2 font-medium text-right w-24">Pagina's</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tests.map((t) => {
                                  const stats = testStatsByName.get(t.testName);
                                  const ran = stats && stats.runOn.size > 0;
                                  const hasIssues = stats && stats.foundOn.size > 0;
                                  return (
                                    <tr key={t.testName} className="border-t border-gray-100 hover:bg-gray-50">
                                      <td className="px-3 py-2 flex items-center gap-2">
                                        {/* Status-icoon */}
                                        {!ran ? (
                                          <span className="text-gray-400" title="Nog niet getest">○</span>
                                        ) : hasIssues ? (
                                          <span className="text-red-600" title="Problemen gevonden">⚠</span>
                                        ) : (
                                          <span className="text-green-600" title="Geen problemen gevonden">✓</span>
                                        )}
                                        <Link
                                          href={`/admin/projects/${project.id}/test/${encodeURIComponent(t.testName)}`}
                                          className={
                                            hasIssues
                                              ? 'text-red-700 font-medium hover:underline'
                                              : 'text-gray-900 hover:underline'
                                          }
                                        >
                                          {t.titleNl}
                                        </Link>
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                                            t.source === 'browser'
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {t.source}
                                        </span>
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                                            t.responsibility === 'content'
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : t.responsibility === 'template'
                                                ? 'bg-amber-100 text-amber-800'
                                                : t.responsibility === 'ontwerp'
                                                  ? 'bg-sky-100 text-sky-700'
                                                  : 'bg-gray-200 text-gray-600'
                                          }`}
                                          title="Verantwoordelijkheid voor oplossen"
                                        >
                                          {t.responsibility}
                                        </span>
                                        {t.note && (
                                          <span className="text-xs text-gray-500 italic" title={t.note}>
                                            ({t.note})
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums">
                                        {hasIssues ? (
                                          <span className="text-red-700 font-medium">{stats!.totalCount.toLocaleString('nl-NL')}</span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums">
                                        <span className="text-gray-400">—</span>
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums">
                                        {hasIssues ? (
                                          <span className="text-red-700 font-medium">{stats!.foundOn.size}</span>
                                        ) : ran ? (
                                          <span className="text-gray-400">0</span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic bg-white border border-gray-200 rounded p-4">
                            Geen automatische tests beschikbaar — dit criterium vereist handmatige beoordeling.
                          </p>
                        )}
                      </div>

                      {/* Toelichting bij dit criterium */}
                      {explanationByCode.get(sc) && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded p-3">
                          <h4 className="text-xs uppercase tracking-wide font-semibold text-amber-800 mb-2">
                            Toelichting
                          </h4>
                          <p className="text-sm text-amber-900 whitespace-pre-wrap">
                            {explanationByCode.get(sc)}
                          </p>
                        </div>
                      )}

                      {/* Bevindingen samenvatting */}
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        <div>
                          <span className="text-xs uppercase tracking-wide text-gray-500">Bevindingen in dit project: </span>
                          {findings && findings.total > 0 ? (
                            <>
                              {findings.open} open · {findings.resolved} opmerking{findings.resolved !== 1 ? 'en' : ''}
                            </>
                          ) : (
                            <span className="italic text-gray-500">geen</span>
                          )}
                        </div>
                        {findings && findings.total > 0 && (
                          <Link
                            href={`/admin/projects/${project.id}?tab=bevindingen`}
                            className="text-xs text-purple-700 hover:underline"
                          >
                            Bekijk bevindingen →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredSCs.length === 0 && (
        <p className="text-center text-gray-500 py-8">Geen SC's voldoen aan dit filter.</p>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'gray' | 'blue' | 'red' | 'orange' }) {
  const colorMap = {
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <div className={`p-4 rounded-lg border ${colorMap[color]}`}>
      <div className="text-xs uppercase tracking-wide opacity-75 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-purple-700 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
