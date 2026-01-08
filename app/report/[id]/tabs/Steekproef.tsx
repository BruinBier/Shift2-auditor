'use client';

import { useState } from 'react';

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
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Geen {type} steekproefitems gevonden.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
                {item._count && item._count.occurrences > 0 && (
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {item._count.occurrences} bevinding{item._count.occurrences !== 1 ? 'en' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is
          bepaald staat voorgeschreven in het evaluatiedocument{' '}
          <a
            href="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline hover:text-blue-800"
          >
            WCAG-EM
          </a>
          .
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveSubTab('structured')}
            className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
              activeSubTab === 'structured'
                ? 'border-shift2-primary text-shift2-primary'
                : 'border-transparent text-gray-500 tab-hover'
            }`}
          >
            Gestructureerde steekproef ({structuredItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab('random')}
            className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
              activeSubTab === 'random'
                ? 'border-shift2-primary text-shift2-primary'
                : 'border-transparent text-gray-500 tab-hover'
            }`}
          >
            Willekeurige steekproef ({randomItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pdf')}
            className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
              activeSubTab === 'pdf'
                ? 'border-shift2-primary text-shift2-primary'
                : 'border-transparent text-gray-500 tab-hover'
            }`}
          >
            PDF steekproef ({pdfItems.length})
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeSubTab === 'structured' && (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestructureerde steekproef</h2>
            <p className="text-sm text-gray-600">
              Lever tekstalternatieven voor alle niet-tekstuele content, zodat die veranderd kan worden in andere vormen die mensen nodig hebben, zoals grote letters, braille, spraak, symbolen of eenvoudige taal.
            </p>
          </div>
          {renderSampleList(structuredItems, 'gestructureerde')}
        </div>
      )}

      {activeSubTab === 'random' && (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Willekeurige steekproef</h2>
            <p className="text-sm text-gray-600">
              Deze pagina's zijn willekeurig geselecteerd uit de volledige website om een representatieve steekproef te vormen.
            </p>
          </div>
          {renderSampleList(randomItems, 'willekeurige')}
        </div>
      )}

      {activeSubTab === 'pdf' && (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF steekproef</h2>
            <p className="text-sm text-gray-600">
              PDF-documenten die zijn onderzocht op toegankelijkheid volgens de WCAG-normen.
            </p>
          </div>
          {renderSampleList(pdfItems, 'PDF')}
        </div>
      )}
    </div>
  );
}
