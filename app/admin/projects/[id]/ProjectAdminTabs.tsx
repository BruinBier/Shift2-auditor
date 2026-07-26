'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ProjectDetails from './tabs/ProjectDetails';
import SampleItems from './tabs/SampleItems';
import ScopeManagement from './tabs/ScopeManagement';
import CriteriaAssessments from './tabs/CriteriaAssessments';
import FindingsManagement from './tabs/FindingsManagement';
import Conclusion from './tabs/Conclusion';
import Finalize from './tabs/Finalize';
import Tussencheck from './tabs/Tussencheck';
import Richtlijnen from './tabs/Richtlijnen';
import PagecheckProgress from './tabs/PagecheckProgress';
import Fixlijst from './tabs/Fixlijst';
import CrawlAllButton from './CrawlAllButton';
import AuditSessionIndicator from '@/app/components/AuditSessionIndicator';

interface ProjectAdminTabsProps {
  project: any;
  allCriteria: any[];
  relatedProjects?: any[];
  researchTypeExplanations?: any[];
}

export default function ProjectAdminTabs({ project, allCriteria, relatedProjects = [], researchTypeExplanations = [] }: ProjectAdminTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'scope' | 'sample' | 'findings' | 'conclusion' | 'finalize' | 'tussencheck' | 'richtlijnen' | 'progress' | 'fixlijst'>('details');
  const showProgressTab = (project.scopeUrls?.length ?? 0) > 100;
  const showFixlijstTab = showProgressTab;
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [showBevindingenMenu, setShowBevindingenMenu] = useState(false);
  const [isFinalizingProject, setIsFinalizingProject] = useState(false);
  const [showFinalizedModal, setShowFinalizedModal] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [showCreateReinspectionModal, setShowCreateReinspectionModal] = useState(false);
  const [isCreatingReinspection, setIsCreatingReinspection] = useState(false);

  const checkPhase: 'nulmeting' | 'tussencheck' | 'herinspectie' | 'afgerond' =
    project.checkPhase ?? 'nulmeting';
  const tussencheckActive = checkPhase === 'tussencheck' || checkPhase === 'herinspectie';

  // A nulmeting that is afgerond ("Gereed") but has no child project yet
  // can be turned into a herinspection on demand.
  const canCreateReinspection =
    project.status === 'Gereed' &&
    !project.parentProjectId &&
    (project.childProjects?.length ?? 0) === 0;

  const handleCreateReinspection = async (startPhase: 'tussencheck' | 'herinspectie') => {
    if (isCreatingReinspection) return;
    setIsCreatingReinspection(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/create-reinspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkPhase: startPhase }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Aanmaken mislukt');
      }
      const data = await res.json();
      setShowCreateReinspectionModal(false);
      // Navigate to the new child project
      router.push(`/admin/projects/${data.project.id}?tab=tussencheck`);
    } catch (e: any) {
      alert('Fout bij aanmaken herinspectie: ' + e.message);
    } finally {
      setIsCreatingReinspection(false);
    }
  };

  const getPhaseColor = (p: string) => {
    switch (p) {
      case 'nulmeting':
        return 'bg-gray-100 text-gray-800';
      case 'tussencheck':
        return 'bg-purple-100 text-purple-800';
      case 'herinspectie':
        return 'bg-blue-100 text-blue-800';
      case 'afgerond':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePhaseChange = async (target: 'tussencheck' | 'herinspectie' | 'afgerond') => {
    if (isChangingPhase) return;
    const messages: Record<typeof target, string> = {
      tussencheck:
        'Tussencheck starten? Je kunt vanaf nu bevindingen aanvinken als opgelost en het criterium wordt automatisch bijgewerkt.',
      herinspectie:
        'Tussencheck afronden en herinspectie starten? Al je werk uit de tussencheck (vinkjes en notities) blijft bewaard.',
      afgerond: 'Project afronden? Je kunt daarna geen bevindingen meer wijzigen.',
    };
    if (!confirm(messages[target])) return;

    setIsChangingPhase(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkPhase: target }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Wijziging mislukt');
      }
      router.refresh();
    } catch (e: any) {
      alert('Fout bij faseovergang: ' + e.message);
    } finally {
      setIsChangingPhase(false);
    }
  };

  // Get status color based on status value
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Gepland':
        return 'bg-gray-100 text-gray-800';
      case 'In uitvoering':
        return 'bg-orange-100 text-orange-800';
      case 'Controle':
        return 'bg-blue-100 text-blue-800';
      case 'In de wacht':
        return 'bg-yellow-100 text-yellow-800';
      case 'Gereed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to handle button click
  const handleFinalizeButtonClick = () => {
    if (project.status === 'Gereed') {
      // Show modal when project is already finalized
      setShowFinalizedModal(true);
    } else {
      // Finalize the project
      handleFinalizeProject();
    }
  };

  // Function to finalize the project
  const handleFinalizeProject = async () => {
    if (isFinalizingProject) return;

    const confirmed = confirm('Weet je zeker dat je het onderzoek wilt afronden? De status wordt gewijzigd naar "Gereed".');
    if (!confirmed) return;

    setIsFinalizingProject(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/finalize`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to finalize project');
      }

      const data = await response.json();

      alert('Onderzoek succesvol afgerond!');
      router.refresh();
    } catch (error) {
      console.error('Error finalizing project:', error);
      alert('Er is een fout opgetreden bij het afronden van het onderzoek. Probeer het opnieuw.');
    } finally {
      setIsFinalizingProject(false);
    }
  };

  // Function to reactivate project (set back to "In uitvoering")
  const handleReactivateProject = async () => {
    if (isReactivating) return;

    setIsReactivating(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In uitvoering' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate project');
      }

      setShowFinalizedModal(false);
      alert('Project status is teruggezet naar "In uitvoering".');
      router.refresh();
    } catch (error) {
      console.error('Error reactivating project:', error);
      alert('Er is een fout opgetreden bij het terugzetten van de status. Probeer het opnieuw.');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleTabChange = (tab: 'details' | 'scope' | 'sample' | 'findings' | 'conclusion' | 'finalize' | 'tussencheck' | 'richtlijnen' | 'progress' | 'fixlijst') => {
    const tabParam = tab === 'details' ? '' :
                     tab === 'scope' ? 'scope' :
                     tab === 'sample' ? 'steekproef' :
                     tab === 'findings' ? 'bevindingen' :
                     tab === 'conclusion' ? 'conclusie' :
                     tab === 'tussencheck' ? 'tussencheck' :
                     tab === 'richtlijnen' ? 'richtlijnen' :
                     tab === 'progress' ? 'voortgang' :
                     tab === 'fixlijst' ? 'fixlijst' : 'voltooien';

    const url = tabParam ? `/admin/projects/${project.id}?tab=${tabParam}` : `/admin/projects/${project.id}`;
    router.push(url);
  };

  // Read tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'steekproef') {
      setActiveTab('sample');
    } else if (tab === 'scope') {
      setActiveTab('scope');
    } else if (tab === 'bevindingen') {
      setActiveTab('findings');
    } else if (tab === 'conclusie') {
      setActiveTab('conclusion');
    } else if (tab === 'voltooien') {
      setActiveTab('finalize');
    } else if (tab === 'tussencheck') {
      setActiveTab('tussencheck');
    } else if (tab === 'richtlijnen') {
      setActiveTab('richtlijnen');
    } else if (tab === 'voortgang') {
      setActiveTab('progress');
    } else if (tab === 'fixlijst') {
      setActiveTab('fixlijst');
    } else {
      setActiveTab('details');
    }
  }, [searchParams]);

  // Close menus on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBeheerMenu(false);
        setShowBevindingenMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showBeheerMenu && !target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
      if (showBevindingenMenu && !target.closest('.bevindingen-button') && !target.closest('.bevindingen-menu')) {
        setShowBevindingenMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu, showBevindingenMenu]);

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
            <nav className="flex gap-8 text-sm items-center">
              <AuditSessionIndicator />
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
              <div className="relative">
                <button
                  onClick={() => setShowBevindingenMenu(!showBevindingenMenu)}
                  className="bevindingen-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Bevindingen
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Bevindingen Dropdown Menu */}
                {showBevindingenMenu && (
                  <div className="bevindingen-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/bevindingen-zoeken"
                      onClick={() => setShowBevindingenMenu(false)}
                      className="bevindingen-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Bevindingen zoeken
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/snelle-bevindingen"
                      onClick={() => setShowBevindingenMenu(false)}
                      className="bevindingen-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Snelle bevindingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowBeheerMenu(!showBeheerMenu)}
                  className="beheer-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Beheer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Beheer Dropdown Menu */}
                {showBeheerMenu && (
                  <div className="beheer-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/onderzoekstypen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Onderzoekstypen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/projecten"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Projecten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/opdrachtgevers"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Opdrachtgevers
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/crawler-tests"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Crawler tests
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/beoordelingen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Beoordelingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/team"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Team
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/video-a2-gemeenten"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Video A2-gemeenten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
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
                  onClick={() => project.status !== 'Gereed' && handleTabChange('details')}
                  disabled={project.status === 'Gereed'}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    project.status === 'Gereed'
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : activeTab === 'details'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => project.status !== 'Gereed' && handleTabChange('scope')}
                  disabled={project.status === 'Gereed'}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    project.status === 'Gereed'
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : activeTab === 'scope'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  1. Scope
                </button>
                <button
                  onClick={() => project.status !== 'Gereed' && handleTabChange('sample')}
                  disabled={project.status === 'Gereed'}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    project.status === 'Gereed'
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : activeTab === 'sample'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  2. Steekproef
                </button>
                {showFixlijstTab && (
                  <button
                    onClick={() => handleTabChange('fixlijst')}
                    className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                      activeTab === 'fixlijst'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                    }`}
                  >
                    Fixlijst
                  </button>
                )}
                {!showFixlijstTab && (
                  <button
                    onClick={() => project.status !== 'Gereed' && handleTabChange('findings')}
                    disabled={project.status === 'Gereed'}
                    className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                      project.status === 'Gereed'
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : activeTab === 'findings'
                          ? 'border-shift2-primary text-shift2-primary'
                          : 'border-transparent text-gray-500 tab-hover'
                    }`}
                  >
                    3. Bevindingen
                  </button>
                )}
                <button
                  onClick={() => project.status !== 'Gereed' && handleTabChange('conclusion')}
                  disabled={project.status === 'Gereed'}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    project.status === 'Gereed'
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : activeTab === 'conclusion'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  4. Conclusie
                </button>
                <button
                  onClick={() => handleTabChange('finalize')}
                  className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    activeTab === 'finalize'
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-500 tab-hover'
                  }`}
                >
                  5. Voltooien
                </button>
                {tussencheckActive && (
                  <button
                    onClick={() => handleTabChange('tussencheck')}
                    className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                      activeTab === 'tussencheck'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                    }`}
                  >
                    {checkPhase === 'tussencheck' ? 'Tussencheck' : 'Herinspectie'}
                  </button>
                )}
                {!showFixlijstTab && (
                  <button
                    onClick={() => handleTabChange('richtlijnen')}
                    className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                      activeTab === 'richtlijnen'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                    }`}
                  >
                    Richtlijnen
                  </button>
                )}
                {showProgressTab && (
                  <button
                    onClick={() => handleTabChange('progress')}
                    className={`pt-2 pb-6 px-3 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                      activeTab === 'progress'
                        ? 'border-shift2-primary text-shift2-primary'
                        : 'border-transparent text-gray-500 tab-hover'
                    }`}
                  >
                    Voortgang
                  </button>
                )}
                  <div className="ml-auto flex gap-2" style={{ marginBottom: '8px' }}>
                    {activeTab === 'finalize' && (
                      <button
                        onClick={handleFinalizeButtonClick}
                        disabled={isFinalizingProject}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                          project.status === 'Gereed'
                            ? 'bg-green-700 text-white'
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }`}
                      >
                        {project.status === 'Gereed' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isFinalizingProject
                          ? 'Bezig met afronden...'
                          : project.status === 'Gereed'
                            ? 'Onderzoek afgerond'
                            : 'Onderzoek afronden'
                        }
                      </button>
                    )}
                    <CrawlAllButton projectId={project.id} />
                    <Link
                      href={`/report/${project.id}`}
                      className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#6b2d8f' }}
                    >
                      Bekijk het rapport
                    </Link>
                  </div>

              </nav>

              {/* Project title with badges */}
              <div className="flex items-center gap-3 mt-2">
                {project.kenmerk && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                    {project.kenmerk}
                  </span>
                )}
                <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getPhaseColor(checkPhase)}`}
                  title="Fase van het onderzoek"
                >
                  Fase: {checkPhase}
                </span>
                {checkPhase === 'tussencheck' && (
                  <button
                    onClick={() => handlePhaseChange('herinspectie')}
                    disabled={isChangingPhase}
                    className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                  >
                    Tussencheck afronden, start herinspectie
                  </button>
                )}
                {checkPhase === 'herinspectie' && (
                  <button
                    onClick={() => handlePhaseChange('afgerond')}
                    disabled={isChangingPhase}
                    className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                  >
                    Herinspectie afronden
                  </button>
                )}
                {canCreateReinspection && (
                  <button
                    onClick={() => setShowCreateReinspectionModal(true)}
                    className="px-3 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
                  >
                    Herinspectie aanmaken
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="px-8 py-8 flex-grow">
            {activeTab === 'details' && <ProjectDetails project={project} relatedProjects={relatedProjects} />}
            {activeTab === 'scope' && <ScopeManagement project={project} />}
            {activeTab === 'sample' && <SampleItems project={project} />}
            {activeTab === 'findings' && <FindingsManagement project={project} allCriteria={allCriteria} researchTypeExplanations={researchTypeExplanations} />}
            {activeTab === 'conclusion' && <Conclusion project={project} />}
            {activeTab === 'finalize' && <Finalize project={project} allCriteria={allCriteria} />}
            {activeTab === 'tussencheck' && <Tussencheck project={project} />}
            {activeTab === 'richtlijnen' && <Richtlijnen project={project} allCriteria={allCriteria} />}
            {activeTab === 'progress' && <PagecheckProgress project={project} />}
            {activeTab === 'fixlijst' && <Fixlijst project={project} />}
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

      {/* Finalized Project Modal */}
      {showFinalizedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            {/* Close button (X) */}
            <button
              onClick={() => setShowFinalizedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Onderzoek afgerond</h3>

            <p className="text-sm text-gray-700 mb-6">
              Dit onderzoek is afgerond. Je kunt geen wijzigingen meer maken. Als je iets wilt aanpassen, moet je eerst de status terug in uitvoering zetten.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleReactivateProject}
                disabled={isReactivating}
                className="flex items-center gap-2 px-4 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {isReactivating ? 'Bezig...' : 'Zet terug in uitvoering'}
              </button>
              <Link
                href={`/report/${project.id}`}
                className="flex items-center gap-2 px-4 py-1.5 text-white rounded transition-colors hover:opacity-90 text-sm"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                Bekijk rapport
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Create Reinspection Modal */}
      {showCreateReinspectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => !isCreatingReinspection && setShowCreateReinspectionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Herinspectie aanmaken</h3>
            <p className="text-sm text-gray-700 mb-6">
              Er wordt een nieuw v1.1-project aangemaakt met een kopie van de scope, steekproef en
              bevindingen. Hoe wil je beginnen?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleCreateReinspection('tussencheck')}
                disabled={isCreatingReinspection}
                className="w-full text-left p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-gray-900">Begin met tussencheck</div>
                <div className="text-xs text-gray-600 mt-1">
                  Voor een tussentijds overleg met de klant. Je kunt bevindingen aanvinken als
                  opgelost zonder dat het rapport definitief is.
                </div>
              </button>
              <button
                onClick={() => handleCreateReinspection('herinspectie')}
                disabled={isCreatingReinspection}
                className="w-full text-left p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-gray-900">Begin direct met herinspectie</div>
                <div className="text-xs text-gray-600 mt-1">
                  Definitieve herinspectie. Beoordeel elke bevinding eenmalig en rond af.
                </div>
              </button>
            </div>

            {isCreatingReinspection && (
              <p className="text-xs text-gray-500 mt-4 text-center">Bezig met aanmaken...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
