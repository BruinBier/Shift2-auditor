'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import dynamic from 'next/dynamic';
import 'md-editor-rt/lib/style.css';

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

interface ResearchType {
  id: string;
  name: string;
  version: string;
  level: string;
  type: string;
  description: string;
  reportIntro?: string;
  reportIntroPdf?: string;
  selectedCriteria?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function OnderzoekstypenPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [reportTab, setReportTab] = useState('rapport-inleiding');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<ResearchType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: 'WCAG 2.2',
    level: 'AA',
    type: 'website',
    reportIntro: '',
    reportIntroPdf: '',
    selectedCriteria: [] as string[],
  });
  const [wcagCriteria, setWcagCriteria] = useState<any[]>([]);

  // Default research types
  const defaultResearchTypes: ResearchType[] = [
    {
      id: '1',
      name: 'WCAG 2.2 AA onderzoek',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      description: 'Volledig onderzoek op 55 succescriteria, conform WCAG 2.2.',
      selectedCriteria: [],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-03-20'),
    },
    {
      id: '2',
      name: 'WCAG 2.2 AA deelonderzoek content',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      description: 'Deelonderzoek content, conform WCAG-EM. Dit onderzoek bevat 33 succescriteria die betrekking hebben op de content van de website.',
      selectedCriteria: [],
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-04-15'),
    },
    {
      id: '3',
      name: 'Trial onderzoek',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      description: 'Proef-onderzoek om de functionaliteiten van Cardan Auditor te ervaren',
      selectedCriteria: [],
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-05-12'),
    },
    {
      id: '4',
      name: 'WCAG 2.2 AA – aanvullend deelonderzoek content',
      version: '',
      level: 'AA',
      type: 'website',
      description: 'Aanvullend deelonderzoek gericht op klantspecifieke content binnen de Mijn-omgeving. Dit onderzoekstype wordt gebruikt als aanvulling op een eerder volledig WCAG 2.2 AA-onderzoek van de standaard PIP-omgeving en heeft een afgebakende scope.',
      selectedCriteria: [],
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-06-08'),
    },
  ];

  // Load research types from database
  const [researchTypes, setResearchTypes] = useState<ResearchType[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set mounted state for client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load research types from database
  useEffect(() => {
    const fetchResearchTypes = async () => {
      try {
        const response = await fetch('/api/research-types');
        if (response.ok) {
          const data = await response.json();
          setResearchTypes(data.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            selectedCriteria: t.selectedCriteria || [],
          })));
        }
      } catch (error) {
        console.error('Error fetching research types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResearchTypes();
  }, []);

  // Load WCAG criteria from API
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const response = await fetch('/api/wcag-criteria');
        if (response.ok) {
          const data = await response.json();
          setWcagCriteria(data);
        }
      } catch (error) {
        console.error('Error fetching WCAG criteria:', error);
      }
    };

    fetchCriteria();
  }, []);

  // Close Beheer menu and context menus on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (showBeheerMenu &&
          !target.closest('.beheer-menu') &&
          !target.closest('.beheer-button')) {
        setShowBeheerMenu(false);
      }

      if (openMenuId && !target.closest('.context-menu') && !target.closest('.menu-button')) {
        setOpenMenuId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showBeheerMenu) setShowBeheerMenu(false);
        if (openMenuId) setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showBeheerMenu, openMenuId]);

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je dit onderzoekstype wilt verwijderen?')) {
      try {
        const response = await fetch(`/api/research-types/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setResearchTypes(researchTypes.filter(type => type.id !== id));
          console.log('Research type deleted:', id);
        } else {
          alert('Er is een fout opgetreden bij het verwijderen van het onderzoekstype.');
        }
      } catch (error) {
        console.error('Error deleting research type:', error);
        alert('Er is een fout opgetreden bij het verwijderen van het onderzoekstype.');
      }
      setOpenMenuId(null);
    }
  };

  const openEditModal = (type: ResearchType) => {
    setIsCreating(false);
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description,
      version: type.version,
      level: type.level,
      type: type.type,
      reportIntro: type.reportIntro || '',
      reportIntroPdf: type.reportIntroPdf || '',
      selectedCriteria: type.selectedCriteria || []
    });
    setShowCreateModal(true);
    setOpenMenuId(null);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      reportIntro: '',
      reportIntroPdf: '',
      selectedCriteria: []
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingType(null);
    setIsCreating(false);
    setActiveTab('details');
    setReportTab('rapport-inleiding');
    setFormData({
      name: '',
      description: '',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      reportIntro: '',
      reportIntroPdf: '',
      selectedCriteria: []
    });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isCreating) {
        // Create new research type
        const response = await fetch('/api/research-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            version: formData.version,
            level: formData.level,
            type: formData.type,
            description: formData.description,
            reportIntro: formData.reportIntro,
            reportIntroPdf: formData.reportIntroPdf,
            selectedCriteria: formData.selectedCriteria,
          }),
        });

        if (response.ok) {
          const newResearchType = await response.json();
          setResearchTypes([...researchTypes, {
            ...newResearchType,
            createdAt: new Date(newResearchType.createdAt),
            updatedAt: new Date(newResearchType.updatedAt),
            selectedCriteria: newResearchType.selectedCriteria || [],
          }]);
        } else {
          alert('Er is een fout opgetreden bij het aanmaken van het onderzoekstype.');
          return;
        }
      } else if (editingType) {
        // Update existing research type
        console.log('Updating research type:', editingType.id, formData);
        const response = await fetch(`/api/research-types/${editingType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            version: formData.version,
            level: formData.level,
            type: formData.type,
            description: formData.description,
            reportIntro: formData.reportIntro,
            reportIntroPdf: formData.reportIntroPdf,
            selectedCriteria: formData.selectedCriteria,
          }),
        });

        console.log('Response status:', response.status, response.ok);

        if (response.ok) {
          const updatedResearchType = await response.json();
          console.log('Updated research type:', updatedResearchType);

          // Close modal and reload page to show updated data
          closeModal();
          window.location.reload();
          return;
        } else {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          alert(`Er is een fout opgetreden bij het bijwerken van het onderzoekstype: ${errorData.error || 'Onbekende fout'}`);
          return;
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Er is een fout opgetreden bij het opslaan van het onderzoekstype.');
    }
  };

  // Filter and search
  const filteredTypes = researchTypes.filter((type) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      type.name.toLowerCase().includes(searchLower) ||
      type.description.toLowerCase().includes(searchLower) ||
      type.version.toLowerCase().includes(searchLower)
    );
  });

  // Sort
  const sortedTypes = [...filteredTypes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'createdAt':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'updatedAt':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'version':
        return a.version.localeCompare(b.version);
      case 'level':
        return a.level.localeCompare(b.level);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Navigation */}
      <header className="bg-shift2-primary text-white">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2"
                className="h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <nav className="flex gap-8 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
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
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Header with title and button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h1 className="text-2xl font-semibold">Onderzoekstypen ({sortedTypes.length})</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Nieuw onderzoekstype
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-shift2-primary"
              >
                <option value="name">Naam</option>
                <option value="createdAt">Datum aangemaakt</option>
                <option value="updatedAt">Laatst gewijzigd</option>
                <option value="version">WCAG versie</option>
                <option value="level">Conformiteitsniveau</option>
                <option value="type">Content type</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="zoeken"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-1.5 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{type.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{type.version}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{type.level}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {type.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{type.description}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === type.id ? null : type.id)}
                      className="menu-button text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>

                    {/* Context Menu */}
                    {openMenuId === type.id && (
                      <div
                        className="context-menu absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                        style={{ zIndex: 9999 }}
                      >
                        <button
                          onClick={() => openEditModal(type)}
                          className="sample-menu-item flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="sample-menu-item-delete flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Verwijderen
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &laquo;
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &lsaquo;
            </button>
            <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm">1</span>
            <span className="text-sm text-gray-600">van 1</span>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &rsaquo;
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &raquo;
            </button>
          </div>
          <div>
            <select className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>20 items per pagina</option>
              <option>50 items per pagina</option>
              <option>100 items per pagina</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {isCreating ? 'Nieuw onderzoekstype' : 'Onderzoekstype bewerken'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('succescriteria')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'succescriteria'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Succescriteria
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {activeTab === 'details' && (
                <>
                  {/* Naam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam <span className="text-gray-400">vereist</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  {/* Beschrijving */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving <span className="text-gray-400">vereist</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  {/* WCAG versie, Conformiteitsniveau, Content type */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WCAG versie</label>
                      <select
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      >
                        <option value="WCAG 2.2">WCAG 2.2</option>
                        <option value="WCAG 2.1">WCAG 2.1</option>
                        <option value="WCAG 2.0">WCAG 2.0</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conformiteitsniveau</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      >
                        <option value="A">A</option>
                        <option value="AA">AA</option>
                        <option value="AAA">AAA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      >
                        <option value="website">Website</option>
                        <option value="app">App</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                  </div>

                  {/* Report Sub-tabs */}
                  <div className="border-b border-gray-200 -mx-6 px-6">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setReportTab('rapport-inleiding')}
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                          reportTab === 'rapport-inleiding'
                            ? 'border-shift2-primary text-shift2-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Rapport inleiding
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportTab('rapport-inleiding-pdf')}
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                          reportTab === 'rapport-inleiding-pdf'
                            ? 'border-shift2-primary text-shift2-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Rapport inleiding PDF
                      </button>
                    </div>
                  </div>

                  {/* Markdown Editor */}
                  <div>
                    {mounted && (
                      <MdEditor
                        key={reportTab}
                        modelValue={reportTab === 'rapport-inleiding' ? formData.reportIntro : formData.reportIntroPdf}
                        onChange={(content) => setFormData({
                          ...formData,
                          [reportTab === 'rapport-inleiding' ? 'reportIntro' : 'reportIntroPdf']: content
                        })}
                        language="en-US"
                        theme="light"
                        previewTheme="default"
                        codeTheme="github"
                        showCodeRowNumber={true}
                        toolbars={[
                          'bold',
                          'underline',
                          'italic',
                          'strikeThrough',
                          '-',
                          'title',
                          'sub',
                          'sup',
                          'quote',
                          'unorderedList',
                          'orderedList',
                          '-',
                          'codeRow',
                          'code',
                          'link',
                          'image',
                          'table',
                          '-',
                          'revoke',
                          'next',
                          '=',
                          'previewOnly',
                          'htmlPreview',
                          'catalog',
                        ]}
                      />
                    )}
                  </div>

                  {/* Opslaan button */}
                  <div className="flex justify-start pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Opslaan
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'succescriteria' && (
                <>
                  {/* Telling van geselecteerde criteria */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Geselecteerde criteria</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          {formData.selectedCriteria.length} van {wcagCriteria.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Percentage</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          {wcagCriteria.length > 0 ? Math.round((formData.selectedCriteria.length / wcagCriteria.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Selecteer succescriteria</h3>
                    {wcagCriteria.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Laden...
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto border border-gray-300 rounded-md">
                        <div className="divide-y divide-gray-200">
                          {wcagCriteria.map((criterion) => {
                            const isSelected = formData.selectedCriteria.includes(criterion.id);
                            return (
                              <label
                                key={criterion.id}
                                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        selectedCriteria: [...formData.selectedCriteria, criterion.id],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        selectedCriteria: formData.selectedCriteria.filter((id) => id !== criterion.id),
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-shift2-primary border-gray-300 rounded focus:ring-shift2-primary"
                                />
                                <span className="ml-3 text-sm text-gray-700 flex-1">{criterion.code} - {criterion.titleNl}</span>
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                  {criterion.level}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opslaan button */}
                  <div className="flex justify-start pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Opslaan
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
