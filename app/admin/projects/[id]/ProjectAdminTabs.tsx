'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProjectDetails from './tabs/ProjectDetails';
import SampleItems from './tabs/SampleItems';
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
      {/* Header - Same as Report */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/shift2-logo.svg"
                alt="Shift2 Logo"
                className="h-8 w-auto"
              />
            </div>
            <Link
              href={`/report/${project.id}`}
              target="_blank"
              className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              Bekijk rapport
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        {/* Title section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <div className="mb-6">
              <Link href="/admin" className="text-sm text-shift2-primary hover:underline mb-2 inline-block">
                ← Terug naar dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">{project.subject} - {project.standard} {project.level}</p>
            </div>

            {/* Tabs */}
            <nav className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('scope')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'scope'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              1. Scope
            </button>
            <button
              onClick={() => setActiveTab('sample')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sample'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              2. Steekproef ({project.sampleItems.length})
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'findings'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              3. Bevindingen ({project.findings.length})
            </button>
            <button
              onClick={() => setActiveTab('conclusion')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'conclusion'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              4. Conclusie
            </button>
            <button
              onClick={() => setActiveTab('finalize')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'finalize'
                  ? 'border-shift2-primary text-shift2-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              5. Voltooien
            </button>
            <Link
              href={`/report/${project.id}`}
              target="_blank"
              className="ml-auto px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              Bekijk het rapport
            </Link>
          </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-[1400px] mx-auto py-8 flex-grow">
          {activeTab === 'details' && <ProjectDetails project={project} />}
          {activeTab === 'scope' && <CriteriaAssessments project={project} allCriteria={allCriteria} />}
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
              <h2 className="text-xl font-bold mb-4">Onderzoek Voltooien</h2>
              <p className="text-gray-600">Voltooien sectie - Nog te implementeren</p>
            </div>
          )}
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
                Wij maken zaken met de overheid eenvoudig, met digitale toegankelijkheid als vast onderdeel van onse dienstverlening.
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
