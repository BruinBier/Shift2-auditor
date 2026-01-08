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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link href="/admin" className="text-sm text-shift2-primary hover:underline mb-2 inline-block">
                ← Terug naar dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">{project.subject} - {project.standard} {project.level}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Toggle switch */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Bekijk rapport</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                </label>
              </div>
              <Link
                href={`/report/${project.id}`}
                target="_blank"
                className="px-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                Bekijk rapport →
              </Link>
            </div>
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
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
  );
}
