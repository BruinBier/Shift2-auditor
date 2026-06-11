'use client';

import { useRouter } from 'next/navigation';
import { useState, Fragment } from 'react';
import { formatMultipleSameLinksReport } from '@/lib/formatter/multiple-same-links-formatter';
import { formatLinkMissingHrefReport } from '@/lib/formatter/link-missing-href-formatter';
import { formatImgMissingAltReport } from '@/lib/formatter/img-missing-alt-formatter';
import { formatImgAltTooShortReport } from '@/lib/formatter/img-alt-too-short-formatter';
import { formatElementsStyledWithStrongOrEm } from '@/lib/formatter/elements-styled-strong-em-formatter';
import { formatStrongFourWords } from '@/lib/formatter/strong-four-words-formatter';

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
  sampleItemId: string;
  crawlerResults: CrawlerResult[];
  crawledAt: Date | null;
  url: string | null;
}

export default function TestResults({ projectId, sampleItemId, crawlerResults, crawledAt, url }: Props) {
  const router = useRouter();
  const [showAllTests, setShowAllTests] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTests, setSelectedTests] = useState<CrawlerResult[]>([]);
  const [isCreatingFindings, setIsCreatingFindings] = useState(false);

  const foundResults = crawlerResults.filter(r => r.found);
  const displayResults = showAllTests ? crawlerResults : foundResults;

  const handleRunTests = async () => {
    if (!url) {
      alert('Dit sample item heeft geen URL om te testen');
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(`/api/sample-items/${sampleItemId}/crawler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withBrowser: true }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Tests succesvol uitgevoerd!\n\n` +
              `Tests gedraaid: ${data.testsRun}\n` +
              `Issues gevonden: ${data.testsFound}\n\n` +
              `De resultaten worden nu getoond.`);
        router.refresh();
      } else {
        alert(`❌ Er ging iets mis: ${data.error}`);
      }
    } catch (error) {
      console.error('Error running tests:', error);
      alert('❌ Er ging iets mis bij het draaien van de tests.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateFindingsFromAllTests = () => {
    if (foundResults.length === 0) {
      alert('Geen test resultaten gevonden om bevindingen van te maken.');
      return;
    }
    setSelectedTests(foundResults);
    setShowModal(true);
  };

  const handleCreateFindingFromTest = (test: CrawlerResult) => {
    setSelectedTests([test]);
    setShowModal(true);
  };

  // Function to get test category badge
  const getTestCategory = (testName: string) => {
    if (testName.includes('Missing') || testName.includes('Empty')) {
      return { label: 'Accessibility', color: 'bg-red-100 text-red-800' };
    }
    if (testName.includes('Form') || testName.includes('Button')) {
      return { label: 'Forms', color: 'bg-blue-100 text-blue-800' };
    }
    if (testName.includes('Video') || testName.includes('Audio') || testName.includes('Media')) {
      return { label: 'Media', color: 'bg-purple-100 text-purple-800' };
    }
    if (testName.includes('Link')) {
      return { label: 'Links', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'General', color: 'bg-gray-100 text-gray-800' };
  };

  // Function to get impact level
  const getImpact = (testName: string) => {
    if (testName.includes('Missing Alt') || testName.includes('Missing Label') || testName.includes('Lang Attribute')) {
      return { label: 'Critical', color: 'bg-red-100 text-red-800' };
    }
    if (testName.includes('Empty') || testName.includes('Duplicate')) {
      return { label: 'Serious', color: 'bg-orange-100 text-orange-800' };
    }
    if (testName.includes('Form') || testName.includes('Button')) {
      return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Minor', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Tests ({crawlerResults.length})
            </h2>
            {crawledAt && (
              <p className="text-xs text-gray-500 mt-1">
                Laatst gedraaid: {new Date(crawledAt).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {foundResults.length > 0 && (
              <button
                onClick={handleCreateFindingsFromAllTests}
                disabled={isCreatingFindings}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Maak bevindingen ({foundResults.length})
              </button>
            )}
            <button
              onClick={handleRunTests}
              disabled={isRunning || !url}
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
                  Run Tests
                </>
              )}
            </button>
            <div className="relative">
              <select
                value={showAllTests ? 'all' : 'found'}
                onChange={(e) => setShowAllTests(e.target.value === 'all')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none pr-10"
              >
                <option value="all">Toon alle tests ({crawlerResults.length})</option>
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
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aantal
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
                  {crawlerResults.length === 0
                    ? 'Nog geen tests gedraaid. Klik op "Run Tests" om te beginnen.'
                    : 'Geen resultaten gevonden'}
                </td>
              </tr>
            ) : (
              displayResults.map((result) => {
                const isExpanded = expandedTestId === result.id;
                const category = getTestCategory(result.testName);
                const impact = getImpact(result.testName);

                let details = null;
                try {
                  details = result.details ? JSON.parse(result.details) : null;
                } catch (e) {
                  console.error('Failed to parse details:', e);
                }

                return (
                  <Fragment key={result.id}>
                    <tr
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {result.testName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {result.testId}
                            </div>
                          </div>
                        </div>
                      </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                        {category.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {result.found ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Gevonden
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Niet gevonden
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {result.count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {result.found && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${impact.color}`}>
                          {impact.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {result.found && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateFindingFromTest(result);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
                          title="Bevinding maken van deze test"
                        >
                          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded details row */}
                  {isExpanded && details && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm space-y-3">
                          <div className="flex items-center justify-between gap-2 text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Test Details</span>
                            </div>
                            <button
                              onClick={() => setExpandedTestId(null)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Sluit
                            </button>
                          </div>

                          {/* Render raw test details JSON */}
                          <div className="bg-white rounded border border-gray-200 p-4 relative mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Raw Test Data:</h4>
                            <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap select-text">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>

                          {/* Render formatted report for specific tests */}
                          {result.testName === 'PageContainsMultipleSameLinksTest' && details?.issues && (
                            <div className="bg-blue-50 rounded border border-blue-200 p-4 relative">
                              <h4 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Geformatteerde Rapportage:
                              </h4>
                              <div className="space-y-6">
                                {formatMultipleSameLinksReport(details).map((report, idx) => (
                                  <div key={idx} className="space-y-3 bg-white rounded border border-blue-100 p-4">
                                    {idx > 0 && <div className="border-t border-gray-200 pt-4 -mt-4 mb-4"></div>}

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.bevinding}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Details:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.details}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.advies}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Render formatted report for LinkMissingHrefTest */}
                          {result.testName === 'LinkMissingHrefTest' && details?.issues && (
                            <div className="bg-red-50 rounded border border-red-200 p-4 relative">
                              <h4 className="text-sm font-semibold text-red-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Geformatteerde Rapportage (Kritiek):
                              </h4>
                              <div className="space-y-6">
                                {formatLinkMissingHrefReport(details).map((report, idx) => (
                                  <div key={idx} className="space-y-3 bg-white rounded border border-red-100 p-4">
                                    {idx > 0 && <div className="border-t border-gray-200 pt-4 -mt-4 mb-4"></div>}

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.bevinding}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Details:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.details}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.advies}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Render formatted report for ImgMissingAltTest */}
                          {result.testName === 'ImgMissingAltTest' && details?.images && (
                            <div className="bg-red-50 rounded border border-red-200 p-4 relative">
                              <h4 className="text-sm font-semibold text-red-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Geformatteerde Rapportage (Kritiek - WCAG 1.1.1):
                              </h4>
                              <div className="space-y-6">
                                {formatImgMissingAltReport(details).map((report, idx) => (
                                  <div key={idx} className="space-y-3 bg-white rounded border border-red-100 p-4">
                                    {idx > 0 && <div className="border-t border-gray-200 pt-4 -mt-4 mb-4"></div>}

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.bevinding}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Details:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.details}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.advies}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Render formatted report for ImgAltTooShortTest */}
                          {result.testName === 'ImgAltTooShortTest' && details?.images && (
                            <div className="bg-orange-50 rounded border border-orange-200 p-4 relative">
                              <h4 className="text-sm font-semibold text-orange-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Geformatteerde Rapportage (Serieus - WCAG 1.1.1):
                              </h4>
                              <div className="space-y-6">
                                {formatImgAltTooShortReport(details).map((report, idx) => (
                                  <div key={idx} className="space-y-3 bg-white rounded border border-orange-100 p-4">
                                    {idx > 0 && <div className="border-t border-gray-200 pt-4 -mt-4 mb-4"></div>}

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Bevinding:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.bevinding}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Details:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.details}</p>
                                    </div>

                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h5>
                                      <p className="text-sm text-gray-700 select-text">{report.advies}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Render formatted report for StrongHasMoreThanFourWordsTest */}
                          {result.testName === 'StrongHasMoreThanFourWordsTest' && details?.issues && (
                            <div className="bg-amber-50 rounded border border-amber-200 p-4 relative">
                              <h4 className="text-sm font-semibold text-amber-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Geformatteerde Rapportage (Kwaliteit / Premium):
                              </h4>
                              <div className="bg-white rounded border border-amber-100 p-4">
                                <div className="space-y-4">
                                  {(() => {
                                    const formatted = formatStrongFourWords(details);
                                    return (
                                      <>
                                        <div>
                                          <h5 className="text-sm font-semibold text-gray-900 mb-2">Samenvatting:</h5>
                                          <pre className="text-sm text-gray-700 whitespace-pre-wrap select-text">{formatted.summary}</pre>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Details per locatie:</h5>
                                          <div className="space-y-3">
                                            {Array.from(formatted.issuesByLocation.entries()).map(([location, issues]) => (
                                              <div key={location} className="bg-gray-50 rounded p-3">
                                                <div className="font-medium text-sm text-gray-900 mb-2">📍 {location}</div>
                                                <div className="space-y-2">
                                                  {issues.map((issue, idx) => (
                                                    <div key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-amber-300">
                                                      <div><strong>&lt;strong&gt;</strong> - {issue.wordCount} woorden (max 4)</div>
                                                      <div className="text-xs text-gray-600 mt-1">{issue.textSnippet}</div>
                                                      <div className="text-xs text-amber-700 mt-1 italic">{issue.reason}</div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                          <h5 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h5>
                                          <p className="text-sm text-gray-700 select-text">
                                            Het <code>&lt;strong&gt;</code> element is bedoeld voor <strong>korte semantische nadruk</strong> van maximaal 4 woorden.
                                            Voor langere tekstfragmenten dient u CSS classes te gebruiken voor visuele opmaak, of de tekst op te splitsen in meerdere kortere
                                            benadrukkingen met normale tekst ertussen.
                                          </p>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Render formatted report for ElementsStyledWithStrongOrEmTest */}
                          {result.testName === 'ElementsStyledWithStrongOrEmTest' && details?.issues && (
                            <div className="bg-purple-50 rounded border border-purple-200 p-4 relative">
                              <h4 className="text-sm font-semibold text-purple-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                Geformatteerde Rapportage (Semantiek / Structuur):
                              </h4>
                              <div className="bg-white rounded border border-purple-100 p-4">
                                <div className="space-y-4">
                                  {(() => {
                                    const formatted = formatElementsStyledWithStrongOrEm(details);
                                    return (
                                      <>
                                        <div>
                                          <h5 className="text-sm font-semibold text-gray-900 mb-2">Samenvatting:</h5>
                                          <pre className="text-sm text-gray-700 whitespace-pre-wrap select-text">{formatted.summary}</pre>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Details per locatie:</h5>
                                          <div className="space-y-3">
                                            {Array.from(formatted.issuesByLocation.entries()).map(([location, issues]) => (
                                              <div key={location} className="bg-gray-50 rounded p-3">
                                                <div className="font-medium text-sm text-gray-900 mb-2">📍 {location}</div>
                                                <div className="space-y-2">
                                                  {issues.map((issue, idx) => (
                                                    <div key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-purple-300">
                                                      <div><strong>&lt;{issue.tagName.toLowerCase()}&gt;</strong> - {issue.wordCount} woorden</div>
                                                      <div className="text-xs text-gray-600 mt-1">{issue.textSnippet}</div>
                                                      <div className="text-xs text-purple-700 mt-1 italic">{issue.reason}</div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                          <h5 className="text-sm font-semibold text-gray-900 mb-2">Advies:</h5>
                                          <p className="text-sm text-gray-700 select-text">
                                            De <code>&lt;strong&gt;</code> en <code>&lt;em&gt;</code> elementen moeten gebruikt worden voor
                                            <strong> semantische nadruk</strong> van enkele woorden of korte zinsdelen, niet voor het stylen
                                            van grote tekstblokken. Gebruik CSS classes voor visuele styling van langere tekstsecties.
                                          </p>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {crawledAt && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Totaal: {crawlerResults.length} tests • Gevonden: {foundResults.length} resultaten
        </div>
      )}

      {/* Modal for creating findings */}
      {showModal && (
        <CreateFindingModal
          sampleItemId={sampleItemId}
          tests={selectedTests}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

interface CreateFindingModalProps {
  sampleItemId: string;
  tests: CrawlerResult[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateFindingModal({ sampleItemId, tests, onClose, onSuccess }: CreateFindingModalProps) {
  const [useAI, setUseAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const testIds = tests.map(t => t.testId);
      const response = await fetch(`/api/sample-items/${sampleItemId}/create-findings-from-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testIds,
          useAI,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      // Show detailed result
      let message = `✅ ${data.message}\n\nGecreëerde bevindingen: ${data.created}`;

      if (data.errors && data.errors.length > 0) {
        message += '\n\n❌ Fouten:\n';
        data.errors.forEach((err: any) => {
          message += `\n- ${err.testName}: ${err.error}`;
        });
      }

      alert(message);
      onSuccess();
    } catch (err) {
      console.error('Error creating findings:', err);
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Bevindingen maken van {tests.length} test{tests.length > 1 ? 's' : ''}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Tests list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Geselecteerde tests:</h3>
            <div className="space-y-2">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{test.testName}</span>
                  <span className="text-gray-400">({test.count} gevonden)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Choice between QuickFinding and AI */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Hoe wil je de bevindingen genereren?</h3>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${!useAI ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="generation-method"
                  checked={!useAI}
                  onChange={() => setUseAI(false)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">QuickFinding template gebruiken</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Gebruik bestaande bevindingen templates. Sneller maar werkt alleen voor tests met een template.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${useAI ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="generation-method"
                  checked={useAI}
                  onChange={() => setUseAI(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">AI genereren (GPT-4o-mini)</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Laat AI een unieke beschrijving en advies schrijven op basis van de test details. Langzamer maar werkt altijd.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Bevindingen maken...' : 'Maak bevindingen'}
          </button>
        </div>
      </div>
    </div>
  );
}
