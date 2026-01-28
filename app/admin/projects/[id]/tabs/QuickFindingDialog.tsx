'use client';

import { useState } from 'react';

interface QuickFinding {
  id: string;
  title: string;
  description: string;
  advice: string;
  criterionCode: string;
  impact?: string;
  responsibility?: string;
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

  if (!isOpen) return null;

  // Filter quick findings for the selected criterion
  const criterionFindings = quickFindings.filter(
    f => f.criterionCode === selectedCriterionCode
  );

  // Further filter by search term
  const filteredFindings = criterionFindings.filter(finding =>
    finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (finding: QuickFinding) => {
    onSelect(finding);
    onClose();
  };

  // Function to render advice with code blocks and lists
  const renderAdvice = (advice: string) => {
    const lines = advice.split('\n');
    const elements: JSX.Element[] = [];
    let currentCodeBlock: string[] = [];
    let currentTextBlock: string[] = [];
    let currentListItems: string[] = [];
    let inCodeBlock = false;

    const flushCodeBlock = () => {
      if (currentCodeBlock.length > 0) {
        elements.push(
          <pre key={elements.length} className="bg-gray-900 text-white p-4 rounded-lg text-sm font-mono overflow-hidden">
            <code className="block whitespace-pre-wrap break-words">{currentCodeBlock.join('\n')}</code>
          </pre>
        );
        currentCodeBlock = [];
      }
    };

    const flushTextBlock = () => {
      if (currentTextBlock.length > 0) {
        const text = currentTextBlock.join('\n').trim();
        if (text) {
          elements.push(
            <p key={elements.length} className="text-sm text-gray-700">{text}</p>
          );
        }
        currentTextBlock = [];
      }
    };

    const flushListItems = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {currentListItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Check for markdown code fence (```html, ```)
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          // Start of code block
          flushTextBlock();
          flushListItems();
          inCodeBlock = true;
        }
        return; // Don't include the ``` markers
      }

      if (inCodeBlock) {
        // Inside a code block
        currentCodeBlock.push(line);
      } else if (trimmedLine === '') {
        // Empty line - flush current blocks
        flushTextBlock();
        flushListItems();
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        // Bullet point - flush text first, then add to list
        flushTextBlock();
        // Remove the bullet character and trim
        const itemText = trimmedLine.replace(/^[•\-]\s*/, '');
        currentListItems.push(itemText);
      } else {
        // Regular text - flush list first, then add to text
        flushListItems();
        currentTextBlock.push(line);
      }
    });

    // Flush any remaining blocks
    flushCodeBlock();
    flushTextBlock();
    flushListItems();

    return <div className="space-y-3">{elements}</div>;
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
                    {finding.impact && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        {finding.impact}
                      </span>
                    )}
                    {finding.responsibility && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {finding.responsibility}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{finding.description}</p>

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