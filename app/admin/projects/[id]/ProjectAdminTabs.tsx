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
  const [activeTab, setActiveTab] = useState<'details' | 'sample' | 'criteria' | 'findings'>('details');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link href="/admin" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                ← Terug naar dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">{project.subject} - {project.standard} {project.level}</p>
            </div>
            <Link
              href={`/report/${project.id}`}
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Bekijk Rapport →
            </Link>
          </div>

          {/* Tabs */}
          <nav className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Project Details
            </button>
            <button
              onClick={() => setActiveTab('sample')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sample'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Steekproef ({project.sampleItems.length})
            </button>
            <button
              onClick={() => setActiveTab('criteria')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'criteria'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Criteria Beoordelen ({project.criterionAssessments.length}/{allCriteria.length})
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'findings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bevindingen ({project.findings.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'details' && <ProjectDetails project={project} />}
        {activeTab === 'sample' && <SampleItems project={project} />}
        {activeTab === 'criteria' && <CriteriaAssessments project={project} allCriteria={allCriteria} />}
        {activeTab === 'findings' && <FindingsManagement project={project} allCriteria={allCriteria} />}
      </div>
    </div>
  );
}
