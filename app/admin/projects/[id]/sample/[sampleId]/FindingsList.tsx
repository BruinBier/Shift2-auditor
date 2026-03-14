'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FindingsListProps {
  findings: any[];
  projectId: string;
  sampleId: string;
}

export default function FindingsList({ findings, projectId, sampleId }: FindingsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const totalPages = Math.ceil(findings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFindings = findings.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage(Math.min(currentPage + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(Math.max(currentPage - 1, 1));

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  if (findings.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Nog geen bevindingen voor dit project
      </div>
    );
  }

  // Calculate finding indices per criterion for display
  const findingIndicesMap = new Map<string, Map<string, number>>();
  findings.forEach((f: any) => {
    if (!findingIndicesMap.has(f.wcagCriterionId)) {
      findingIndicesMap.set(f.wcagCriterionId, new Map());
    }
    const criterionMap = findingIndicesMap.get(f.wcagCriterionId)!;
    criterionMap.set(f.id, criterionMap.size + 1);
  });

  return (
    <>
      <div className="divide-y divide-gray-200">
        {currentFindings.map((finding: any) => {
          // Check if this finding has an occurrence on this sample item
          const hasOccurrenceOnThisPage = finding.occurrences.some((occ: any) => occ.sampleItemId === sampleId);

          // Get finding index for this criterion
          const findingIndex = findingIndicesMap.get(finding.wcagCriterionId)?.get(finding.id) || 1;

          return (
            <div key={finding.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Bevinding {findingIndex} (SC {finding.wcagCriterion.code})
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      finding.status === 'open'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {finding.status === 'open' ? 'Afgekeurd' : 'Opmerking'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {finding.wcagCriterion.code} - {finding.wcagCriterion.titleNl}
                    </span>
                    {hasOccurrenceOnThisPage && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Op deze pagina
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Beschrijving</h4>
                      <div
                        className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                        dangerouslySetInnerHTML={{ __html: finding.description }}
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Advies</h4>
                      <div
                        className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                        dangerouslySetInnerHTML={{ __html: finding.advice }}
                      />
                    </div>

                    {/* Afbeeldingen section */}
                    {finding.evidence && (() => {
                      try {
                        const evidenceData = JSON.parse(finding.evidence);
                        if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                          return (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Afbeeldingen</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {evidenceData.map((item: any, index: number) => (
                                  <div key={index} className="space-y-1">
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                      {item.type?.startsWith('image/') ? (
                                        <img
                                          src={item.url}
                                          alt={item.caption || `Screenshot ${index + 1}`}
                                          className="w-full h-auto"
                                        />
                                      ) : (
                                        <div className="p-4 text-center">
                                          <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:underline text-sm"
                                          >
                                            {item.caption || 'Bestand bekijken'}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 text-center">{item.caption || 'Screenshot'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}

                    {finding.occurrences.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Voorkomt op {finding.occurrences.length} {finding.occurrences.length === 1 ? 'pagina' : "pagina's"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {finding.occurrences.slice(0, 3).map((occ: any) => (
                            <Link
                              key={occ.id}
                              href={`/admin/projects/${projectId}/sample/${occ.sampleItemId}`}
                              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            >
                              {occ.sampleItem.title}
                            </Link>
                          ))}
                          {finding.occurrences.length > 3 && (
                            <span className="text-xs px-2 py-1 text-gray-500">
                              +{finding.occurrences.length - 3} meer
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/admin/projects/${projectId}?tab=bevindingen&finding=${finding.id}`}
                  className="ml-4 text-sm text-purple-700 hover:text-purple-900"
                >
                  Bekijk bevinding →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {findings.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          {/* Left side - pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={handlePageInputChange}
              className="w-12 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-600">van {totalPages}</span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right side - items per page dropdown */}
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={5}>5 items per pagina</option>
            <option value={10}>10 items per pagina</option>
            <option value={20}>20 items per pagina</option>
            <option value={50}>50 items per pagina</option>
          </select>
        </div>
      )}
    </>
  );
}