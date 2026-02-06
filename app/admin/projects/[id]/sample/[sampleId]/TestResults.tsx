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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {result.testName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {result.testId}
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
                      {result.found && details && (
                        <button
                          onClick={() => setExpandedTestId(isExpanded ? null : result.id)}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {isExpanded ? 'Verberg details' : 'Bekijk details'}
                        </button>
                      )}
                    </td>
                  </tr>
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
    </div>
  );
}
