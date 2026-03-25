'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('../../admin/projects/[id]/tabs/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

interface ClientProject {
  id: string;
  name: string;
  projectnummer: string | null;
  opdrachtgeverId: string;
  details: string;
  createdAt: string;
  updatedAt: string;
  opdrachtgever: {
    id: string;
    kenmerk: string;
    naam: string;
  };
  projects?: any[];
}

export default function ProjectenPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterBy, setFilterBy] = useState('Alle opdrachtgevers');
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ClientProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [availableOpdrachtgevers, setAvailableOpdrachtgevers] = useState<Array<{ id: string; kenmerk: string; naam: string }>>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMigrationButton, setShowMigrationButton] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    projectnummer: '',
    opdrachtgeverId: '',
    details: '',
  });

  // Set mounted state for client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch client projects and opdrachtgevers from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch opdrachtgevers
        const opdrachtgeversResponse = await fetch('/api/opdrachtgevers');
        if (opdrachtgeversResponse.ok) {
          const opdrachtgeversData = await opdrachtgeversResponse.json();
          setAvailableOpdrachtgevers(opdrachtgeversData.map((o: any) => ({
            id: o.id,
            kenmerk: o.kenmerk,
            naam: o.naam
          })));
        }

        // Fetch client projects
        const projectsResponse = await fetch('/api/client-projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }

        // Check if there are old localStorage projects to migrate
        const oldProjects = localStorage.getItem('projects');
        if (oldProjects && JSON.parse(oldProjects).length > 0) {
          setShowMigrationButton(true);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMigrateProjects = async () => {
    if (!confirm('Wil je de oude projecten uit localStorage naar de database migreren? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setIsMigrating(true);

    try {
      const oldProjectsStr = localStorage.getItem('projects');
      if (!oldProjectsStr) {
        alert('Geen oude projecten gevonden in localStorage');
        return;
      }

      const oldProjects = JSON.parse(oldProjectsStr);
      let migratedCount = 0;
      let errorCount = 0;

      for (const oldProject of oldProjects) {
        try {
          // Find or create opdrachtgever
          let opdrachtgever = availableOpdrachtgevers.find(o => o.naam === oldProject.client);

          if (!opdrachtgever && oldProject.client) {
            // Create new opdrachtgever
            const response = await fetch('/api/opdrachtgevers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                naam: oldProject.client,
                kenmerk: oldProject.client.substring(0, 3).toUpperCase(),
              }),
            });

            if (response.ok) {
              opdrachtgever = await response.json();
              if (opdrachtgever) {
                setAvailableOpdrachtgevers(prev => [...prev, opdrachtgever!]);
              }
            }
          }

          if (opdrachtgever) {
            // Create client project
            const response = await fetch('/api/client-projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: oldProject.name,
                opdrachtgeverId: opdrachtgever.id,
                details: oldProject.details || oldProject.notes || '',
              }),
            });

            if (response.ok) {
              migratedCount++;
            } else {
              console.error('Failed to migrate project:', oldProject.name);
              errorCount++;
            }
          } else {
            console.error('No opdrachtgever for project:', oldProject.name);
            errorCount++;
          }
        } catch (error) {
          console.error('Error migrating project:', oldProject.name, error);
          errorCount++;
        }
      }

      // Refresh projects list
      const projectsResponse = await fetch('/api/client-projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Clear localStorage
      localStorage.removeItem('projects');
      setShowMigrationButton(false);

      alert(`Migratie voltooid!\n\nSuccesvol gemigreerd: ${migratedCount}\nFouten: ${errorCount}`);
    } catch (error) {
      console.error('Migration error:', error);
      alert('Er is een fout opgetreden tijdens de migratie. Zie de console voor details.');
    } finally {
      setIsMigrating(false);
    }
  };

  // Get unique clients for filter
  const uniqueClients = ['Alle opdrachtgevers', ...Array.from(new Set(projects.map(p => p.opdrachtgever.naam)))];

  // Close Beheer menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showBeheerMenu &&
          !target.closest('.beheer-menu') &&
          !target.closest('.beheer-button')) {
        setShowBeheerMenu(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showBeheerMenu) {
        setShowBeheerMenu(false);
      }
    };

    if (showBeheerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showBeheerMenu]);

  // Close context menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId &&
          !target.closest('.project-context-menu') &&
          !target.closest('.project-menu-button')) {
        setOpenMenuId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenuId) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [openMenuId]);

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je dit project wilt verwijderen?')) {
      try {
        const response = await fetch(`/api/client-projects/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProjects(projects.filter(p => p.id !== id));
          setOpenMenuId(null);
        } else {
          alert('Fout bij het verwijderen van het project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Fout bij het verwijderen van het project');
      }
    }
  };

  const openEditModal = (project: ClientProject) => {
    setIsCreating(false);
    setEditingProject(project);
    setFormData({
      name: project.name,
      projectnummer: project.projectnummer || '',
      opdrachtgeverId: project.opdrachtgeverId,
      details: project.details || '',
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingProject(null);
    setFormData({
      name: '',
      projectnummer: '',
      opdrachtgeverId: '',
      details: '',
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
    setIsCreating(false);
    setFormData({
      name: '',
      projectnummer: '',
      opdrachtgeverId: '',
      details: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that projectdetails is not empty
    if (!formData.details || formData.details.trim() === '' || formData.details === '<p></p>') {
      alert('Projectdetails is verplicht');
      return;
    }

    try {
      if (isCreating) {
        // Create new project
        const response = await fetch('/api/client-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newProject = await response.json();
          setProjects([newProject, ...projects]);
          closeEditModal();
        } else {
          alert('Fout bij het aanmaken van het project');
        }
      } else if (editingProject) {
        // Update existing project
        const response = await fetch(`/api/client-projects/${editingProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updatedProject = await response.json();
          setProjects(projects.map(p =>
            p.id === editingProject.id ? updatedProject : p
          ));
          closeEditModal();
        } else {
          alert('Fout bij het updaten van het project');
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Fout bij het opslaan van het project');
    }
  };

  // Filter and search
  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      project.name.toLowerCase().includes(searchLower) ||
      project.opdrachtgever.naam.toLowerCase().includes(searchLower) ||
      (project.details && project.details.toLowerCase().includes(searchLower));

    const matchesFilter = filterBy === 'Alle opdrachtgevers' || project.opdrachtgever.naam === filterBy;

    return matchesSearch && matchesFilter;
  });

  // Sort
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'client':
        return a.opdrachtgever.naam.localeCompare(b.opdrachtgever.naam);
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .new-project-button,
        .new-project-button[class] {
          background-color: white !important;
          color: #1f0036 !important;
        }
        .new-project-button:hover,
        .new-project-button[class]:hover {
          background-color: #F9FAFB !important;
        }

        /* WYSIWYG Editor toolbar buttons */
        form button[type="button"],
        form button[type="button"][class] {
          background-color: transparent !important;
          color: #374151 !important;
        }
        form button[type="button"]:hover,
        form button[type="button"][class]:hover {
          background-color: #E5E7EB !important;
        }
      `}} />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h1 className="text-2xl font-semibold">
              Projecten {mounted && !loading && `(${sortedProjects.length})`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {showMigrationButton && (
              <button
                onClick={handleMigrateProjects}
                disabled={isMigrating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isMigrating ? 'Migreren...' : 'Oude projecten migreren'}
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                border: '1px solid #79e792'
              }}
            >
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              Nieuw project
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="block text-xs text-gray-600 mb-1">Volgorde</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-shift2-primary"
              >
                <option value="createdAt">Datum aangemaakt</option>
                <option value="updatedAt">Laatst gewijzigd</option>
                <option value="name">Naam</option>
                <option value="client">Naam opdrachtgever</option>
              </select>
            </div>

            <div className="w-48">
              <label className="block text-xs text-gray-600 mb-1">Filter</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-shift2-primary"
              >
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
              <div className="relative">
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
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projectnummer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projectdetails</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opdrachtgever</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Laden...
                  </td>
                </tr>
              ) : sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Geen projecten gevonden
                  </td>
                </tr>
              ) : (
                sortedProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.projectnummer || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: project.details || '' }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.opdrachtgever.naam}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {project.projects && project.projects.length > 0 && (
                          <Link href={`/admin/projects/${project.projects[0].id}`} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                            className="project-menu-button text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {openMenuId === project.id && (
                            <div className="project-context-menu absolute right-0 top-8 w-56 rounded-lg shadow-lg border border-gray-200 py-1 bg-white" style={{ zIndex: 9999 }}>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openEditModal(project);
                                }}
                                className="project-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Bewerken
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="project-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3 hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Verwijderen
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={20}>20 items per pagina</option>
              <option value={50}>50 items per pagina</option>
              <option value={100}>100 items per pagina</option>
            </select>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {isCreating ? 'Nieuw project' : 'Project bewerken'}
              </h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Project and Opdrachtgever in one row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project <span className="text-gray-400">vereist</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opdrachtgever <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.opdrachtgeverId}
                    onChange={(e) => setFormData({ ...formData, opdrachtgeverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {availableOpdrachtgevers.map((opdrachtgever) => (
                      <option key={opdrachtgever.id} value={opdrachtgever.id}>
                        {opdrachtgever.kenmerk} - {opdrachtgever.naam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Projectdetails with Tiptap Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projectdetails <span className="text-gray-400">vereist</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Alle details die de onderzoeker nodig heeft zoals URL-basis (URL), logingegevens en bijzonderheden.
                </p>
                <RichTextEditor
                  content={formData.details}
                  onChange={(content) => setFormData({ ...formData, details: content })}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-start pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}