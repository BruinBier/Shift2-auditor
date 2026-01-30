'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CrawlerResult {
  id: string;
  testId: string;
  testName: string;
  found: boolean;
  count: number;
  details: string | null;
  createdAt: Date;
}

interface ParsedDetails {
  [key: string]: any;
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
  const [isCrawling, setIsCrawling] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const parseDetails = (details: string | null): ParsedDetails => {
    if (!details) return {};
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  };

  const handleCrawlerInit = async () => {
    if (!confirm(`Weet je zeker dat je de crawler wilt starten voor:\n${url}`)) {
      return;
    }

    setIsCrawling(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/scope-urls/${scopeUrlId}/crawler`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Crawler succesvol uitgevoerd!\n\n` +
              `Tests uitgevoerd: ${data.testsRun}\n` +
              `Tests gevonden: ${data.testsFound}\n\n` +
              `De resultaten zijn hieronder zichtbaar.`);
        router.refresh();
      } else {
        alert(`Er ging iets mis bij het starten van de crawler: ${data.error}`);
      }
    } catch (error) {
      console.error('Error initiating crawler:', error);
      alert('Er ging iets mis bij het starten van de crawler.');
    } finally {
      setIsCrawling(false);
    }
  };

  const foundResults = crawlerResults.filter(r => r.found);
  const notFoundResults = crawlerResults.filter(r => !r.found);

  return (
    <div className="space-y-6">
      {/* Crawler Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Crawler Status</h2>
            {crawledAt ? (
              <p className="text-sm text-gray-600">
                Laatst gecrawld: {new Date(crawledAt).toLocaleString('nl-NL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            ) : (
              <p className="text-sm text-gray-600">Deze URL is nog niet gecrawld</p>
            )}
          </div>
          <button
            onClick={handleCrawlerInit}
            disabled={isCrawling}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className={`w-4 h-4 text-white ${isCrawling ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCrawling ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                )}
              </svg>
            </div>
            {isCrawling ? 'Crawler draait...' : crawledAt ? 'Opnieuw crawlen' : 'Crawler initialiseren'}
          </button>
        </div>
      </div>

      {/* Crawler Results */}
      {crawlerResults.length > 0 && (
        <>
          {/* Tests Found */}
          {foundResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Gevonden elementen ({foundResults.length})
              </h2>
              <div className="space-y-3">
                {foundResults.map((result) => {
                  const details = parseDetails(result.details);
                  const isExpanded = expandedResults.has(result.id);

                  return (
                    <div key={result.id} className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{result.testName}</p>
                            <p className="text-sm text-gray-600">Test ID: {result.testId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            {result.count} gevonden
                          </span>
                          {result.details && (
                            <button
                              onClick={() => toggleExpanded(result.id)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-yellow-100 rounded transition-colors"
                              title={isExpanded ? 'Verberg details' : 'Toon details'}
                            >
                              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && result.details && (
                        <div className="px-4 pb-4 border-t border-yellow-200 bg-white">
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
                            <div className="bg-gray-50 rounded p-3 text-sm">
                              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800">
                                {JSON.stringify(details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Deze tests hebben elementen gevonden op de pagina.
                  Controleer of deze elementen toegankelijkheidsproblemen veroorzaken door
                  gekoppelde bevindingen te bekijken in het admin panel.
                </p>
              </div>
            </div>
          )}

          {/* Tests Not Found */}
          {notFoundResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Niet gevonden ({notFoundResults.length})
              </h2>
              <div className="space-y-2">
                {notFoundResults.map((result) => (
                  <div key={result.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{result.testName}</p>
                      <p className="text-xs text-gray-500">Test ID: {result.testId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}