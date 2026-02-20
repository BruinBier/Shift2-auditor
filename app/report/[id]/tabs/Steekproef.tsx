'use client';

import { useState } from 'react';
import Link from 'next/link';
import { marked } from 'marked';

export default function Steekproef({ project }: { project: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'structured' | 'random' | 'pdf'>('structured');

  // Convert markdown to HTML
  const convertMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    try {
      // Check if the content is already HTML (contains HTML tags)
      if (/<\/?[a-z][\s\S]*>/i.test(markdown)) {
        return markdown;
      }
      // Convert markdown to HTML
      return marked.parse(markdown) as string;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      return markdown;
    }
  };

  // Add title attribute to all links in HTML
  const addTitleToLinks = (html: string) => {
    if (!html) return html;
    return html.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attrs) => {
        if (!/title=/i.test(attrs)) {
          return `<a ${attrs} title="opent in nieuw venster">`;
        }
        return match;
      }
    );
  };

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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .prose a,
        .prose a.external-link {
          color: #6b2d8f !important;
          text-decoration: underline !important;
          transition: opacity 0.2s ease;
        }
        .prose a:hover,
        .prose a.external-link:hover {
          opacity: 0.7;
        }
        .prose a::after,
        .prose a.external-link::after {
          content: '';
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-left: 4px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b2d8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'%3E%3C/path%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cline x1='10' y1='14' x2='21' y2='3'%3E%3C/line%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-size: contain;
          vertical-align: middle;
        }
        .prose ul,
        .prose ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .prose ul {
          list-style-type: disc;
        }
        .prose ol {
          list-style-type: decimal;
        }
        .prose li {
          margin: 0.25rem 0;
        }
        .prose li p {
          margin: 0;
        }
      `}} />

      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">
            {project.title}
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

          {/* Overige steekproef informatie - Show if exists */}
          {project.sampleInfo && (
            <div className="px-6 pb-6">
              <div
                className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                dangerouslySetInnerHTML={{ __html: addTitleToLinks(project.sampleInfo) }}
              />
            </div>
          )}

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
    </>
  );
}
