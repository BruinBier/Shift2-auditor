'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateFindingFromCrawlerModal from '../../components/CreateFindingFromCrawlerModal';

interface CrawlerResult {
  id: string;
  testId: string;
  testName: string;
  found: boolean;
  count: number;
  details: string | null;
  createdAt: Date;
}

interface Props {
  projectId: string;
  scopeUrlId: string;
  crawlerResults: CrawlerResult[];
  crawledAt: Date | null;
  url: string;
}

export default function CrawlerResults({ projectId, scopeUrlId, crawlerResults, crawledAt, url }: Props) {
  const router = useRouter();
  const [showAllTests, setShowAllTests] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<CrawlerResult | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const foundResults = crawlerResults.filter(r => r.found);
  const displayResults = showAllTests ? crawlerResults : foundResults;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/scope-urls/${scopeUrlId}/crawler`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Crawler succesvol uitgevoerd!\n\n` +
              `Tests gedraaid: ${data.testsRun}\n` +
              `Issues gevonden: ${data.testsFound}\n\n` +
              `De resultaten worden nu getoond.`);
        router.refresh();
      } else {
        alert(`❌ Er ging iets mis: ${data.error}`);
      }
    } catch (error) {
      console.error('Error running crawler:', error);
      alert('❌ Er ging iets mis bij het draaien van de tests.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Crawler tests ({crawlerResults.length})
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Tests draaien...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Run Tests (42)
                </>
              )}
            </button>
            <div className="relative">
              <select
                value={showAllTests ? 'all' : 'found'}
                onChange={(e) => setShowAllTests(e.target.value === 'all')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none pr-10"
              >
                <option value="all">Toon alle tests</option>
                <option value="found">Toon alleen resultaten ({foundResults.length})</option>
              </select>
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Beschrijving
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Labels
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resultaten
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  Geen resultaten gevonden
                </td>
              </tr>
            ) : (
              displayResults.map((result) => {
                const isExpanded = expandedTestId === result.id;
                let details = null;
                try {
                  details = result.details ? JSON.parse(result.details) : null;
                } catch (e) {
                  console.error('Failed to parse details:', e);
                }

                return (
                  <>
                    <tr
                      key={result.id}
                      className={`${result.found ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => result.found && setExpandedTestId(isExpanded ? null : result.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {result.found && (
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          <div className="text-sm text-gray-900">
                            {result.testName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Afgerond
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {result.found ? (
                          <span className="text-sm font-medium text-gray-900">{result.count}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.found ? (
                          <span className="text-sm font-medium text-gray-900">{result.count}</span>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.found ? (
                          <span className="text-sm font-medium text-gray-900">{result.count}</span>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {result.found && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTest(result);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
                            title="Snelle bevinding aanmaken"
                          >
                            <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded details row for PageContainsMultipleSameLinksTest */}
                    {isExpanded && result.testId === '6' && details && details.issues && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm space-y-3">
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Details: Verschillende linkteksten naar dezelfde URL</span>
                            </div>

                            {details.issues.map((issue: any, idx: number) => (
                              <div key={idx} className="border-l-4 border-purple-400 pl-4 py-2">
                                <div className="font-medium text-gray-900 mb-1">
                                  {idx + 1}. URL: <span className="text-purple-600">{issue.url}</span>
                                </div>
                                <div className="text-gray-600 text-xs mb-2">
                                  {issue.linkCount} links → {issue.uniqueTexts.length} verschillende teksten
                                </div>
                                <div className="space-y-1">
                                  {Object.entries(issue.contexts).map(([context, texts]: [string, any]) => (
                                    <div key={context} className="flex gap-2 text-xs">
                                      <span className="font-medium text-gray-700 capitalize min-w-[80px]">{context}:</span>
                                      <span className="text-gray-600">
                                        {texts.map((t: any) => `"${t.text}" (${t.count}×)`).join(', ')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                              Classificatie: {details.classification || 'kwaliteit/opmerking'} •
                              Links geanalyseerd: {details.totalLinksAnalyzed || 'onbekend'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Generic expanded details for other tests */}
                    {isExpanded && result.testId !== '6' && details && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm">
                            <div className="font-medium text-gray-700 mb-2">Test Details:</div>
                            <pre className="text-xs text-gray-600 overflow-auto max-h-96 bg-white p-3 rounded border border-gray-200">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && selectedTest && (
        <CreateFindingFromCrawlerModal
          projectId={projectId}
          testId={selectedTest.testId}
          testName={selectedTest.testName}
          onClose={() => {
            setShowModal(false);
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
}