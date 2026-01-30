'use client';

import { useState } from 'react';

interface UrlWithStats {
  id: string;
  url: string;
  title: string | null;
  crawledAt: Date | null;
  foundCount: number;
  impactScore: number;
  status: 'not-crawled' | 'clean' | 'issues-found';
  tags: string[];
  totalTags: number;
}

interface Props {
  projectId: string;
  urls: UrlWithStats[];
}

export default function CrawlerOverviewClient({ projectId, urls }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-crawled' | 'clean' | 'issues-found'>('all');

  // Filter URLs based on status
  const filteredUrls = urls.filter(url => {
    if (statusFilter === 'all') return true;
    return url.status === statusFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUrls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUrls = filteredUrls.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: typeof statusFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: UrlWithStats['status'], foundCount: number) => {
    switch (status) {
      case 'not-crawled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
            Niet gecrawld
          </span>
        );
      case 'clean':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Afgerond
          </span>
        );
      case 'issues-found':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            {foundCount} gevonden
          </span>
        );
    }
  };

  const getImpactBadge = (score: number) => {
    if (score === 0) {
      return <span className="text-gray-400">-</span>;
    } else if (score <= 3) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          Laag
        </span>
      );
    } else if (score <= 7) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
          Middel
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          Hoog
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alle ({urls.length})
              </button>
              <button
                onClick={() => handleFilterChange('not-crawled')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === 'not-crawled'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Niet gecrawld ({urls.filter(u => u.status === 'not-crawled').length})
              </button>
              <button
                onClick={() => handleFilterChange('clean')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === 'clean'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Geen problemen ({urls.filter(u => u.status === 'clean').length})
              </button>
              <button
                onClick={() => handleFilterChange('issues-found')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  statusFilter === 'issues-found'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Met problemen ({urls.filter(u => u.status === 'issues-found').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per pagina:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-gray-900">{urls.length}</div>
            <div className="text-sm text-gray-600">Totaal URLs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {urls.filter(u => u.status === 'clean').length}
            </div>
            <div className="text-sm text-gray-600">Geen problemen</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {urls.filter(u => u.status === 'issues-found').length}
            </div>
            <div className="text-sm text-gray-600">Met problemen</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {urls.filter(u => u.status === 'not-crawled').length}
            </div>
            <div className="text-sm text-gray-600">Niet gecrawld</div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crawlertags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
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
                  <tr key={urlData.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {urlData.title || 'Geen titel'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-md">
                          {urlData.url}
                        </div>
                        {urlData.crawledAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            Gecrawld: {new Date(urlData.crawledAt).toLocaleString('nl-NL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {urlData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {urlData.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {urlData.totalTags > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              +{urlData.totalTags - 3} meer
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(urlData.status, urlData.foundCount)}
                    </td>
                    <td className="px-6 py-4">
                      {getImpactBadge(urlData.impactScore)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/admin/projects/${projectId}/scope/${urlData.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Details →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Pagina {currentPage} van {totalPages} ({filteredUrls.length} resultaten)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Vorige
                </button>

                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Volgende
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}