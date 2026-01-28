'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Steekproef({ project }: { project: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'structured' | 'random' | 'pdf'>('structured');

  const structuredItems = project.sampleItems.filter(
    (item: any) => item.sampleType === 'structured'
  );
  const randomItems = project.sampleItems.filter((item: any) => item.sampleType === 'random');
  const pdfItems = project.sampleItems.filter((item: any) => item.sampleType === 'pdf');

  const renderSampleList = (items: any[], type: string) => {
    if (items.length === 0) {
      return (
        <p className="text-gray-500">Geen {type} steekproefitems gevonden.</p>
      );
    }

    return (
      <div className="divide-y divide-gray-200">
        {items.map((item: any, index: number) => (
          <div key={item.id} className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-gray-900 mb-1">{item.title}</h3>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all block"
                  >
                    {item.url}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-gray-900 font-medium text-sm min-w-[1.5rem] text-center">
                  {item._count && item._count.occurrences > 0 ? item._count.occurrences : ''}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Open in nieuw venster"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <Link
                  href={`/admin/projects/${project.id}/sample/${item.id}?returnTo=report`}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Bekijk bevindingen van deze pagina"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">
          WCAG 2.2 AA – aanvullend deelonderzoek content – mijn.hhnk.nl
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Rapport digitale toegankelijkheid
        </h1>
      </div>

      {/* White box with all content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header section */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Steekproef</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument{' '}
            <a
              href="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              WCAG-EM
            </a>
            .
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="px-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveSubTab('structured')}
                className={`pt-2 pb-4 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSubTab === 'structured'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gestructureerde steekproef ({structuredItems.length})
              </button>
              <button
                onClick={() => setActiveSubTab('random')}
                className={`pt-2 pb-4 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSubTab === 'random'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Willekeurige steekproef ({randomItems.length})
              </button>
              <button
                onClick={() => setActiveSubTab('pdf')}
                className={`pt-2 pb-4 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSubTab === 'pdf'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                PDF steekproef ({pdfItems.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        {activeSubTab === 'structured' && renderSampleList(structuredItems, 'gestructureerde')}
        {activeSubTab === 'random' && renderSampleList(randomItems, 'willekeurige')}
        {activeSubTab === 'pdf' && renderSampleList(pdfItems, 'PDF')}
      </div>
    </div>
  );
}
