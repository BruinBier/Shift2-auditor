'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface QuickFinding {
  id: string;
  title: string;
  description: string;
  advice: string;
  criterionCode: string;
  impact: string;
  responsibility: string;
}

interface AffectedUrl {
  id: string;
  url: string;
  title: string | null;
  crawledAt: Date | null;
  result: {
    count: number;
    details: string | null;
  };
}

interface Props {
  projectId: string;
  testId: string;
  testName: string;
  onClose: () => void;
}

export default function CreateFindingFromCrawlerModal({ projectId, testId, testName, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [quickFinding, setQuickFinding] = useState<QuickFinding | null>(null);
  const [affectedUrls, setAffectedUrls] = useState<AffectedUrl[]>([]);
  const [selectedUrlIds, setSelectedUrlIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [testId, projectId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load QuickFinding template
      const qfResponse = await fetch(`/api/quick-findings/by-test/${testId}`);
      if (!qfResponse.ok) {
        if (qfResponse.status === 404) {
          setError('Deze crawler test heeft geen gekoppelde bevinding template.');
        } else {
          throw new Error('Failed to load QuickFinding');
        }
        setLoading(false);
        return;
      }
      const qfData = await qfResponse.json();
      setQuickFinding(qfData);

      // Load affected URLs
      const urlsResponse = await fetch(`/api/projects/${projectId}/crawler-tests/${testId}/affected-urls`);
      if (!urlsResponse.ok) {
        throw new Error('Failed to load affected URLs');
      }
      const urlsData = await urlsResponse.json();
      setAffectedUrls(urlsData);

      // Select all URLs by default
      setSelectedUrlIds(new Set(urlsData.map((url: AffectedUrl) => url.id)));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Er ging iets mis bij het laden van de gegevens.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUrl = (urlId: string) => {
    const newSelected = new Set(selectedUrlIds);
    if (newSelected.has(urlId)) {
      newSelected.delete(urlId);
    } else {
      newSelected.add(urlId);
    }
    setSelectedUrlIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedUrlIds.size === affectedUrls.length) {
      setSelectedUrlIds(new Set());
    } else {
      setSelectedUrlIds(new Set(affectedUrls.map(url => url.id)));
    }
  };

  const handleCreate = async () => {
    if (!quickFinding || selectedUrlIds.size === 0) return;

    setCreating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/findings/from-crawler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickFindingId: quickFinding.id,
          scopeUrlIds: Array.from(selectedUrlIds),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create finding');
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      router.refresh();
      onClose();
    } catch (err) {
      console.error('Error creating finding:', err);
      alert('❌ Er ging iets mis bij het aanmaken van de bevinding.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nieuwe bevinding van crawler test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={creating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-600">Laden...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Test Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Crawler test</h3>
                <p className="text-sm text-gray-900">{testName}</p>
              </div>

              {/* QuickFinding Template */}
              {quickFinding && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-purple-900">{quickFinding.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-white rounded">
                          {quickFinding.criterionCode}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white rounded capitalize">
                          {quickFinding.impact}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white rounded capitalize">
                          {quickFinding.responsibility}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-900 space-y-2">
                    <div>
                      <strong>Beschrijving:</strong>
                      <p className="mt-1">{quickFinding.description}</p>
                    </div>
                    <div>
                      <strong>Advies:</strong>
                      <p className="mt-1">{quickFinding.advice}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Affected URLs (Steekproef) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Steekproef ({affectedUrls.length} {affectedUrls.length === 1 ? 'pagina' : 'pagina\'s'})
                  </h3>
                  <button
                    onClick={toggleAll}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    {selectedUrlIds.size === affectedUrls.length ? 'Deselecteer alles' : 'Selecteer alles'}
                  </button>
                </div>

                {affectedUrls.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">
                      Geen pagina's gevonden waar deze test problemen detecteerde.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                    {affectedUrls.map((urlData) => (
                      <label
                        key={urlData.id}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUrlIds.has(urlData.id)}
                          onChange={() => toggleUrl(urlData.id)}
                          className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {urlData.title || urlData.url}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{urlData.url}</p>
                          {urlData.result.count > 0 && (
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                              {urlData.result.count} {urlData.result.count === 1 ? 'probleem' : 'problemen'}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Info text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ De geselecteerde pagina's worden toegevoegd aan de bevinding. Je kunt de bevinding later nog aanpassen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && quickFinding && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedUrlIds.size} {selectedUrlIds.size === 1 ? 'pagina' : 'pagina\'s'} geselecteerd
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={creating}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || selectedUrlIds.size === 0}
                className="px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bevinding aanmaken...
                  </>
                ) : (
                  'Bevinding aanmaken'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}