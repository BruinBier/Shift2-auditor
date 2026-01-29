'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';

interface QuickFinding {
  id: string;
  title: string;
  description: string;
  advice: string;
  criterionCode: string;
  status?: string;
  impact?: string;
  responsibility?: string;
  createdAt?: string;
}

interface QuickFindingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (finding: QuickFinding) => void;
  criterionCode: string;
  quickFindings: QuickFinding[];
  allCriteria: any[];
  onCriterionChange?: (criterionId: string, criterionCode: string) => void;
}

export default function QuickFindingDialog({
  isOpen,
  onClose,
  onSelect,
  criterionCode,
  quickFindings,
  allCriteria,
  onCriterionChange
}: QuickFindingDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCriterionCode, setSelectedCriterionCode] = useState(criterionCode);

  // Configure marked to add target="_blank" to all links
  useEffect(() => {
    const renderer = new marked.Renderer();
    const originalLink = renderer.link.bind(renderer);

    renderer.link = (href: string, title: string | null | undefined, text: string) => {
      const html = originalLink(href, title, text);
      return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" title="opent in nieuw venster" ');
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true
    });
  }, []);

  if (!isOpen) return null;

  // Filter quick findings for the selected criterion
  const criterionFindings = quickFindings.filter(
    f => f.criterionCode === selectedCriterionCode
  );

  // Further filter by search term
  const searchFiltered = criterionFindings.filter(finding =>
    finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by createdAt (oldest first) - same as on the main page
  const filteredFindings = [...searchFiltered].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const handleSelect = (finding: QuickFinding) => {
    onSelect(finding);
    onClose();
  };

  // Function to render advice with proper markdown formatting (including inline code)
  const renderAdvice = (advice: string) => {
    try {
      const html = marked(advice);
      return <div className="krafters-markdown-preview finding-description space-y-3 text-sm" dangerouslySetInnerHTML={{ __html: html as string }} />;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return <div className="text-sm text-gray-700">{advice}</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Kies een snelle bevinding</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Criterium
              </label>
              <select
                value={selectedCriterionCode}
                onChange={(e) => setSelectedCriterionCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {allCriteria.map((criterion: any) => (
                  <option key={criterion.id} value={criterion.code}>
                    {criterion.code} {criterion.titleNl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoeken
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Zoeken..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-600 mb-4">
            Resultaten ({filteredFindings.length})
          </p>

          {filteredFindings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Geen snelle bevindingen gevonden voor dit criterium.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 flex-1">{finding.title}</h3>
                    <button
                      onClick={() => handleSelect(finding)}
                      className="bevinding-koppelen-button ml-4 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-white border border-green-500 rounded hover:!bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex-shrink-0"
                    >
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      Bevinding koppelen
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {finding.criterionCode}
                    </span>
                    {finding.status && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        finding.status === 'open' ? 'bg-red-100 text-red-800' :
                        finding.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {finding.status === 'open' ? 'Afgekeurd' :
                         finding.status === 'resolved' ? 'Opmerking' :
                         'Gepubliceerd'}
                      </span>
                    )}
                    {finding.impact && finding.impact !== 'onbekend' && (
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 border"
                        style={{
                          borderColor: finding.impact === 'klein' ? '#d1d5db' :
                                      finding.impact === 'matig' ? '#d4a574' :
                                      finding.impact === 'serieus' ? '#ffa64d' :
                                      '#ffb3b3',
                          color: finding.impact === 'klein' ? '#000000' :
                                 finding.impact === 'matig' ? '#8b4513' :
                                 finding.impact === 'serieus' ? '#994d00' :
                                 '#bb2525'
                        }}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          style={{
                            color: finding.impact === 'klein' ? '#000000' :
                                   finding.impact === 'matig' ? '#8b4513' :
                                   finding.impact === 'serieus' ? '#994d00' :
                                   '#bb2525'
                          }}
                        >
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        {finding.impact}
                      </span>
                    )}
                    {finding.responsibility && finding.responsibility !== 'onbekend' && (
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded border bg-white"
                        style={{
                          borderColor: '#d1d5db',
                          color: '#000000'
                        }}
                      >
                        {finding.responsibility}
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    {renderAdvice(finding.description)}
                  </div>

                  {finding.advice && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-3">Advies:</p>
                      {renderAdvice(finding.advice)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}