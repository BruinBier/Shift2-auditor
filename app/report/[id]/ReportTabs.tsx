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
  const [isDownloading, setIsDownloading] = useState(false);
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

  // De PDF wordt server-side gemaakt en duurt een paar seconden. Daarom niet
  // gewoon een link: de knop houdt zichtbaar dat er iets gebeurt.
  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/reports/${project.id}/accessible-pdf`);
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error || `Server gaf status ${response.status}`);
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'rapport.pdf';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('PDF-download mislukt:', error);
      alert(`Het maken van de PDF is niet gelukt.\n\n${error?.message ?? ''}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide all navigation in PDF */
          header, nav, footer {
            display: none !important;
          }
          /* Hide specific navigation elements */
          .print-hide {
            display: none !important;
          }
          /* Ensure main content takes full width */
          .min-h-screen {
            min-height: auto !important;
          }
          /* Remove padding/margins for print */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />
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
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors border disabled:opacity-60 disabled:cursor-wait"
                  style={{ borderColor: '#6b2d8f', color: '#6b2d8f', marginBottom: '8px' }}
                >
                  {isDownloading ? 'PDF wordt gemaakt…' : 'Download PDF'}
                </button>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
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
    </>
  );
}
