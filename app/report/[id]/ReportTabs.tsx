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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cardan-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CA</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">CARDAN</span>
              </div>
              <span className="text-gray-400">auditor</span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Bekijk onderzoek
            </button>
          </div>
        </div>
      </header>

      {/* Title section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              {project.standard} {project.level} – {project.researchType} – {project.subject}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rapport digitale toegankelijkheid
            </h1>
          </div>

          {/* Tabs */}
          <nav className="flex gap-8 border-b border-gray-200 no-print">
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-cardan-primary text-cardan-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Over dit onderzoek
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'results'
                  ? 'border-cardan-primary text-cardan-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resultaten
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'findings'
                  ? 'border-cardan-primary text-cardan-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bevindingen
            </button>
            <button
              onClick={() => setActiveTab('sample')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sample'
                  ? 'border-cardan-primary text-cardan-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Steekproef
            </button>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'about' && <OverDitOnderzoek project={project} />}
        {activeTab === 'results' && <Resultaten project={project} />}
        {activeTab === 'findings' && <Bevindingen project={project} />}
        {activeTab === 'sample' && <Steekproef project={project} />}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-cardan-primary rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">CA</span>
                </div>
                <span className="font-semibold text-gray-900">CARDAN</span>
                <span className="text-gray-500 text-sm">auditor</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dit onderzoek naar digitale toegankelijkheid is uitgevoerd door {project.auditedByOrg} met Cardan Auditor - dé slimme oplossing voor het onderzoeken en verbeteren van websites, apps en andere digitale kanalen.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Onderzoek uitgevoerd door:
              </div>
              <div className="text-sm text-gray-600">
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
