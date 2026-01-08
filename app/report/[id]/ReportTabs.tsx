'use client';

import { useState } from 'react';
import OverDitOnderzoek from './tabs/OverDitOnderzoek';
import Resultaten from './tabs/Resultaten';
import Bevindingen from './tabs/Bevindingen';
import Steekproef from './tabs/Steekproef';

interface ReportTabsProps {
  project: any;
}

export default function ReportTabs({ project }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'results' | 'findings' | 'sample'>('about');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 no-print" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/shift2-logo.svg"
                alt="Shift2 Logo"
                className="h-8 w-auto"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              Download rapport
            </button>
          </div>
        </div>
      </header>

      {/* Title section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              {project.standard} {project.level} – {project.researchType} – {project.subject}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rapport digitale toegankelijkheid
            </h1>
          </div>

          {/* Tabs */}
          <nav className="flex gap-8 border-b border-gray-200 no-print items-center">
            <button
              onClick={() => setActiveTab('about')}
              className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                activeTab === 'about'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 tab-hover'
              }`}
            >
              Over dit onderzoek
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                activeTab === 'results'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 tab-hover'
              }`}
            >
              Resultaten
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                activeTab === 'findings'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 tab-hover'
              }`}
            >
              Bevindingen
            </button>
            <button
              onClick={() => setActiveTab('sample')}
              className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                activeTab === 'sample'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 tab-hover'
              }`}
            >
              Steekproef
            </button>
            <a
              href={`/admin/projects/${project.id}`}
              className="ml-auto px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              Bekijk het onderzoek
            </a>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-grow">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {activeTab === 'about' && <OverDitOnderzoek project={project} />}
          {activeTab === 'results' && <Resultaten project={project} />}
          {activeTab === 'findings' && <Bevindingen project={project} />}
          {activeTab === 'sample' && <Steekproef project={project} />}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/shift2-logo.svg"
                  alt="Shift2 Logo"
                  className="h-6 w-auto"
                />
              </div>
              <p className="text-sm text-white leading-relaxed">
                Wij maken zaken met de overheid eenvoudig, met digitale toegankelijkheid als vast onderdeel van onze dienstverlening.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white mb-2">
                Onderzoek uitgevoerd door:
              </div>
              <div className="text-sm text-white">
                <div>{project.auditedByOrg}</div>
                {project.researcherName && <div>{project.researcherName}</div>}
                {project.commissionedBy && <div>In opdracht van {project.commissionedBy}</div>}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
