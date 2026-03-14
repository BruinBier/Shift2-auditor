'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UrlWithStats {
  id: string;
  url: string;
  title: string | null;
  crawledAt: Date | null;
  foundCount: number;
  impactScore: number;
}

interface Props {
  projectId: string;
  urls: UrlWithStats[];
}

export default function CrawlerOverviewResults({ projectId, urls }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pages' | 'documents'>('pages');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sampleItemUrls, setSampleItemUrls] = useState<Set<string>>(new Set());
  const [addingToSample, setAddingToSample] = useState<string | null>(null);

  // Fetch existing sample items on mount
  useEffect(() => {
    fetchSampleItems();
  }, [projectId]);

  const fetchSampleItems = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sample-items`);
      if (response.ok) {
        const items = await response.json();
        const urls = new Set<string>(items.map((item: any) => item.url).filter(Boolean));
        setSampleItemUrls(urls);
      }
    } catch (error) {
      console.error('Error fetching sample items:', error);
    }
  };

  const addToSample = async (urlData: UrlWithStats) => {
    setAddingToSample(urlData.id);

    try {
      // Get the highest order index
      const response = await fetch(`/api/projects/${projectId}/sample-items`);
      const items = await response.json();
      const maxOrderIndex = items.reduce((max: number, item: any) =>
        Math.max(max, item.orderIndex || 0), 0);

      // Create sample item
      const createResponse = await fetch(`/api/projects/${projectId}/sample-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleType: 'structured',
          title: urlData.title || urlData.url,
          url: urlData.url,
          description: `Toegevoegd vanuit crawler (Impact: ${urlData.impactScore})`,
          orderIndex: maxOrderIndex + 1,
          makeScreenshot: false,
        }),
      });

      if (!createResponse.ok) {
        alert('Er ging iets mis bij het toevoegen aan steekproef.');
        return;
      }

      // Automatically create findings for this URL's crawler results
      const findingsResponse = await fetch(
        `/api/projects/${projectId}/scope-urls/${urlData.id}/auto-create-findings`,
        { method: 'POST' }
      );

      if (findingsResponse.ok) {
        const findingsData = await findingsResponse.json();

        // Update local state
        setSampleItemUrls(prev => new Set(prev).add(urlData.url));

        // Show success message
        let message = '✅ Pagina toegevoegd aan steekproef';
        if (findingsData.findingsCreated > 0 || findingsData.findingsUpdated > 0) {
          message += `\n\n📋 ${findingsData.message}`;
        } else if (findingsData.findingsCreated === 0) {
          message += '\n\nℹ️ Geen bevinding templates beschikbaar voor de gevonden issues.';
        }

        alert(message);
        router.refresh();
      } else {
        // Sample item was created but findings failed
        setSampleItemUrls(prev => new Set(prev).add(urlData.url));
        alert('✅ Pagina toegevoegd aan steekproef\n\n⚠️ Fout bij automatisch aanmaken van bevindingen.');
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding to sample:', error);
      alert('Er ging iets mis bij het toevoegen aan steekproef.');
    } finally {
      setAddingToSample(null);
    }
  };

  const totalPages = Math.ceil(urls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUrls = urls.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Web crawler resultaten</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pages'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pagina's ({urls.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            PDF documenten (0)
          </button>
        </div>
      </div>

      {/* Table */}
      {activeTab === 'pages' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  crawlertags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">

                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUrls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Geen resultaten gevonden
                  </td>
                </tr>
              ) : (
                currentUrls.map((urlData) => (
                  <tr key={urlData.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {sampleItemUrls.has(urlData.url) ? (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToSample(urlData)}
                            disabled={addingToSample === urlData.id}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center mt-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Toevoegen aan steekproef"
                          >
                            {addingToSample === urlData.id ? (
                              <svg className="w-4 h-4 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {urlData.title || 'Geen titel'}
                          </div>
                          <div className="text-xs text-blue-600 underline hover:text-blue-800">
                            {urlData.url}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">-</span>
                    </td>
                    <td className="px-6 py-4">
                      {urlData.crawledAt && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Afgerond
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {urlData.impactScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/projects/${projectId}/scope/${urlData.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">Geen PDF documenten gevonden</p>
        </div>
      )}

      {/* Pagination */}
      {urls.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 px-2">
              <button
                className="px-3 py-1 text-sm bg-gray-900 text-white rounded"
              >
                {currentPage}
              </button>
              <span className="text-sm text-gray-600">van {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{itemsPerPage} items per pagina</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
