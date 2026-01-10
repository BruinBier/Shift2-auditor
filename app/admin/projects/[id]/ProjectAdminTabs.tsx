'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProjectDetails from './tabs/ProjectDetails';
import SampleItems from './tabs/SampleItems';
import ScopeManagement from './tabs/ScopeManagement';
import CriteriaAssessments from './tabs/CriteriaAssessments';
import FindingsManagement from './tabs/FindingsManagement';

interface ProjectAdminTabsProps {
  project: any;
  allCriteria: any[];
}

export default function ProjectAdminTabs({ project, allCriteria }: ProjectAdminTabsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'scope' | 'sample' | 'findings' | 'conclusion' | 'finalize'>('details');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo and navigation */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2 Logo"
                className="h-8 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>

            {/* Navigation menu in header */}
            <nav className="flex gap-8 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
              <Link
                href="/admin/beheer"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Beheer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-grow">
          {/* Title section */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-8 py-6">
              {/* Tabs */}
              <nav className="flex gap-8 border-b border-gray-200 items-center mb-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'details'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('scope')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'scope'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  1. Scope
                </button>
                <button
                  onClick={() => setActiveTab('sample')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'sample'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  2. Steekproef ({project.sampleItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('findings')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'findings'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  3. Bevindingen ({project.findings.length})
                </button>
                <button
                  onClick={() => setActiveTab('conclusion')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'conclusion'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  4. Conclusie
                </button>
                <button
                  onClick={() => setActiveTab('finalize')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'finalize'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  5. Valideren
                </button>
                  <Link
                      href={`/report/${project.id}`}
                      target="_blank"
                      className="ml-auto px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#6b2d8f', marginBottom: '8px' }}
                  >
                      Bekijk het rapport
                  </Link>

              </nav>

              {/* Project title with badges */}
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                  SHP-3
                </span>
                <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  {project.status}
                </span>
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="px-8 py-8 flex-grow">
            {activeTab === 'details' && <ProjectDetails project={project} />}
            {activeTab === 'scope' && <ScopeManagement project={project} />}
            {activeTab === 'sample' && <SampleItems project={project} />}
            {activeTab === 'findings' && <FindingsManagement project={project} allCriteria={allCriteria} />}
            {activeTab === 'conclusion' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-xl font-bold mb-4">Conclusie</h2>
                <p className="text-gray-600">Conclusie sectie - Nog te implementeren</p>
              </div>
            )}
            {activeTab === 'finalize' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-xl font-bold mb-4">Onderzoek Valideren</h2>
                <p className="text-gray-600">Valideren sectie - Nog te implementeren</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Same as Report */}
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
