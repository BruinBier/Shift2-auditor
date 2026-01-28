'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import OverDitOnderzoek from './tabs/OverDitOnderzoek';
import Resultaten from './tabs/Resultaten';
import Bevindingen from './tabs/Bevindingen';
import Steekproef from './tabs/Steekproef';
import Navigation from '@/app/components/Navigation';

interface ReportTabsProps {
  project: any;
}

export default function ReportTabs({ project }: ReportTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'about' | 'results' | 'findings' | 'sample'>('about');
  const [teamName, setTeamName] = useState('Shift2');
  const [aboutOrgText, setAboutOrgText] = useState('Wij maken zaken met de overheid eenvoudig, met digitale toegankelijkheid als vast onderdeel van onze dienstverlening.');

  useEffect(() => {
    // Set active tab based on URL parameter
    if (tabParam === 'sample' || tabParam === 'findings' || tabParam === 'results' || tabParam === 'about') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    // Get team info from localStorage
    if (typeof window !== 'undefined') {
      const savedTeamInfo = localStorage.getItem('teamInfo');
      if (savedTeamInfo) {
        const teamInfo = JSON.parse(savedTeamInfo);
        setTeamName(teamInfo.name || 'Shift2');
        setAboutOrgText(teamInfo.about || 'Wij maken zaken met de overheid eenvoudig, met digitale toegankelijkheid als vast onderdeel van onze dienstverlening.');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Navigation />

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-grow">
          {/* Title section */}
          <div>
            <div className="px-8 py-6">
              {/* Tabs */}
              <nav className="flex gap-8 border-b border-gray-200 items-center">
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
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="ml-auto px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f', marginBottom: '8px' }}
                >
                  Bekijk onderzoek
                </Link>
              </nav>
            </div>
          </div>

          {/* Tab content */}
          <div className="px-8 py-8 flex-grow">
            {activeTab === 'about' && <OverDitOnderzoek project={project} />}
            {activeTab === 'results' && <Resultaten project={project} />}
            {activeTab === 'findings' && <Bevindingen project={project} />}
            {activeTab === 'sample' && <Steekproef project={project} />}
          </div>
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
                {aboutOrgText}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white mb-2">
                Onderzoek uitgevoerd door:
              </div>
              <div className="text-sm text-white">
                <div>{teamName}</div>
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
