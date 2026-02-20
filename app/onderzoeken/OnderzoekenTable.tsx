'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  kenmerk?: string;
  title: string;
  subject: string;
  standard: string;
  level: string;
  researchType: string;
  version: number;
  language: string;
  status: string;
  researcherName: string | null;
  controllerName: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  reportDate: string;
  auditedByOrg: string;
  plannedTime: string | null;
  researchStartedOn: string | null;
  description: string | null;
  isAnonymous: boolean;
  isPrivate: boolean;
  clientProjectId: string | null;
  commissionedBy: string | null;
  clientProject?: any;
}

interface Props {
  projects: Project[];
}

export default function OnderzoekenTable({ projects }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateStart');
  const [showFilters, setShowFilters] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [showBevindingenMenu, setShowBevindingenMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    auditedByOrg: '',
    commissionedBy: '',
    clientProjectId: '',
    version: '1',
    language: 'Nederlands',
    researchType: '',
    standard: 'WCAG 2.2',
    level: 'AA',
    status: 'In uitvoering',
    researcherName: '',
    controllerName: '',
    plannedTime: '',
    dateStart: '',
    dateEnd: '',
    researchStartedOn: '',
    reportDate: '',
    description: '',
    isAnonymous: false,
    isPrivate: false,
  });
  const [showAnonymousTooltip, setShowAnonymousTooltip] = useState(false);
  const [showPrivateTooltip, setShowPrivateTooltip] = useState(false);
  const [filters, setFilters] = useState({
    opdrachtgever: '',
    project: '',
    status: '',
    taal: '',
    onderzoeker: '',
    controleur: '',
    onderzoekstype: '',
  });
  const [availableResearchTypes, setAvailableResearchTypes] = useState<string[]>([]);
  const [availableOpdrachtgevers, setAvailableOpdrachtgevers] = useState<Array<{ id: string; kenmerk: string; naam: string }>>([]);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [filteredClientProjects, setFilteredClientProjects] = useState<any[]>([]);
  const itemsPerPage = 20;

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

  // Close filter popup on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilters &&
          !target.closest('.filter-popup') &&
          !target.closest('.filters-button')) {
        setShowFilters(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFilters) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showFilters]);

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

  // Close Bevindingen menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showBevindingenMenu &&
          !target.closest('.bevindingen-menu') &&
          !target.closest('.bevindingen-button')) {
        setShowBevindingenMenu(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showBevindingenMenu) {
        setShowBevindingenMenu(false);
      }
    };

    if (showBevindingenMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showBevindingenMenu]);

  // Close tooltips when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tooltip-container')) {
        setShowAnonymousTooltip(false);
        setShowPrivateTooltip(false);
      }
    };

    if (showAnonymousTooltip || showPrivateTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnonymousTooltip, showPrivateTooltip]);

  // Load research types from database
  useEffect(() => {
    const fetchResearchTypes = async () => {
      try {
        const response = await fetch('/api/research-types');
        if (response.ok) {
          const data = await response.json();
          const names = data.map((rt: any) => rt.name);
          setAvailableResearchTypes(names);
        }
      } catch (error) {
        console.error('Error loading research types:', error);
      }
    };

    fetchResearchTypes();
  }, []);

  // Load opdrachtgevers from database
  useEffect(() => {
    const fetchOpdrachtgevers = async () => {
      try {
        const response = await fetch('/api/opdrachtgevers');
        if (response.ok) {
          const data = await response.json();
          setAvailableOpdrachtgevers(data.map((o: any) => ({ id: o.id, kenmerk: o.kenmerk, naam: o.naam })));
        }
      } catch (error) {
        console.error('Error loading opdrachtgevers:', error);
      }
    };

    fetchOpdrachtgevers();
  }, []);

  // Load client projects from database
  useEffect(() => {
    const fetchClientProjects = async () => {
      try {
        const response = await fetch('/api/client-projects');
        if (response.ok) {
          const data = await response.json();
          setClientProjects(data);
        }
      } catch (error) {
        console.error('Error loading client projects:', error);
      }
    };

    fetchClientProjects();
  }, []);

  // Filter client projects based on opdrachtgever
  useEffect(() => {
    if (formData.auditedByOrg) {
      const filtered = clientProjects.filter(
        (project) => project.opdrachtgever.naam === formData.auditedByOrg
      );
      setFilteredClientProjects(filtered);
    } else {
      setFilteredClientProjects([]);
    }
  }, [formData.auditedByOrg, clientProjects]);

  // Auto-fill fields when research type is selected
  useEffect(() => {
    const fetchResearchTypeData = async () => {
      if (formData.researchType && !editingProject) {
        try {
          const response = await fetch(`/api/research-types/${encodeURIComponent(formData.researchType)}`);
          if (response.ok) {
            const researchType = await response.json();
            setFormData(prev => ({
              ...prev,
              standard: researchType.version || prev.standard,
              level: researchType.level || prev.level,
              description: researchType.description || prev.description,
            }));
          }
        } catch (error) {
          console.error('Error fetching research type:', error);
        }
      }
    };

    fetchResearchTypeData();
  }, [formData.researchType, editingProject]);

  const openEditModal = (project: Project) => {
    setEditingProject(project);

    // Format dates for input fields
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const formatDateTimeForInput = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };

    setFormData({
      title: project.title,
      auditedByOrg: project.auditedByOrg || '',
      commissionedBy: project.commissionedBy || '',
      clientProjectId: project.clientProjectId || '',
      version: String(project.version),
      language: project.language,
      researchType: project.researchType,
      standard: project.standard,
      level: project.level,
      status: project.status,
      researcherName: project.researcherName || '',
      controllerName: project.controllerName || '',
      plannedTime: project.plannedTime || '',
      dateStart: formatDateForInput(project.dateStart),
      dateEnd: formatDateForInput(project.dateEnd),
      researchStartedOn: formatDateForInput(project.researchStartedOn),
      reportDate: formatDateTimeForInput(project.reportDate),
      description: project.description || '',
      isAnonymous: project.isAnonymous,
      isPrivate: project.isPrivate,
    });

    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
    setFormData({
      title: '',
      auditedByOrg: '',
      commissionedBy: '',
      clientProjectId: '',
      version: '1',
      language: 'Nederlands',
      researchType: '',
      standard: 'WCAG 2.2',
      level: 'AA',
      status: 'In uitvoering',
      researcherName: '',
      controllerName: '',
      plannedTime: '',
      dateStart: '',
      dateEnd: '',
      researchStartedOn: '',
      reportDate: '',
      description: '',
      isAnonymous: false,
      isPrivate: false,
    });
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      auditedByOrg: '',
      commissionedBy: '',
      clientProjectId: '',
      version: '1',
      language: 'Nederlands',
      researchType: 'Volledig onderzoek',
      standard: 'WCAG 2.2',
      level: 'AA',
      status: 'In uitvoering',
      researcherName: '',
      controllerName: '',
      plannedTime: '',
      dateStart: '',
      dateEnd: '',
      researchStartedOn: '',
      reportDate: '',
      description: '',
      isAnonymous: false,
      isPrivate: false,
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      auditedByOrg: '',
      commissionedBy: '',
      clientProjectId: '',
      version: '1',
      language: 'Nederlands',
      researchType: '',
      standard: 'WCAG 2.2',
      level: 'AA',
      status: 'In uitvoering',
      researcherName: '',
      controllerName: '',
      plannedTime: '',
      dateStart: '',
      dateEnd: '',
      researchStartedOn: '',
      reportDate: '',
      description: '',
      isAnonymous: false,
      isPrivate: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProject) return;

    const payload = {
      ...formData,
      version: parseFloat(formData.version) || 1.0,
      dateStart: formData.dateStart ? new Date(formData.dateStart).toISOString() : null,
      dateEnd: formData.dateEnd ? new Date(formData.dateEnd).toISOString() : null,
      researchStartedOn: formData.researchStartedOn ? new Date(formData.researchStartedOn).toISOString() : null,
      reportDate: formData.reportDate ? new Date(formData.reportDate).toISOString() : new Date().toISOString(),
    };

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        closeEditModal();
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Er is een fout opgetreden: ${error.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Er is een fout opgetreden bij het bijwerken van het onderzoek.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      version: parseFloat(formData.version) || 1.0,
      dateStart: formData.dateStart ? new Date(formData.dateStart).toISOString() : null,
      dateEnd: formData.dateEnd ? new Date(formData.dateEnd).toISOString() : null,
      researchStartedOn: formData.researchStartedOn ? new Date(formData.researchStartedOn).toISOString() : null,
      reportDate: formData.reportDate ? new Date(formData.reportDate).toISOString() : new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        closeCreateModal();
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Er is een fout opgetreden: ${error.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Er is een fout opgetreden bij het aanmaken van het onderzoek.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit onderzoek wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Er is een fout opgetreden bij het verwijderen van het onderzoek.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Er is een fout opgetreden bij het verwijderen van het onderzoek.');
    }
  };

  const handleCopy = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit onderzoek wilt kopiëren? Dit kan even duren.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}/copy`, {
        method: 'POST',
      });

      if (response.ok) {
        const newProject = await response.json();
        alert('Het onderzoek is succesvol gekopieerd!');
        router.refresh();
        // Optionally navigate to the new project
        // router.push(`/admin/projects/${newProject.id}`);
      } else {
        const error = await response.json();
        alert(`Er is een fout opgetreden bij het kopiëren van het onderzoek: ${error.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error copying project:', error);
      alert('Er is een fout opgetreden bij het kopiëren van het onderzoek.');
    }
  };

  // Get kenmerk from database (or generate fallback)
  const getKenmerk = (project: Project) => {
    // Use the kenmerk from the database if it exists
    if (project.kenmerk) {
      return project.kenmerk;
    }

    // Fallback: generate kenmerk if not in database (for old projects)
    const opdrachtgever = availableOpdrachtgevers.find(o => o.naam === project.auditedByOrg);
    const kenmerk = opdrachtgever?.kenmerk || 'SHP';

    const projectsFromSameOrg = projects
      .filter(p => p.auditedByOrg === project.auditedByOrg)
      .sort((a, b) => {
        const dateA = new Date(a.reportDate).getTime();
        const dateB = new Date(b.reportDate).getTime();
        return dateA - dateB;
      });

    const projectIndex = projectsFromSameOrg.findIndex(p => p.id === project.id);
    return `${kenmerk}-${String(projectIndex + 1).padStart(2, '0')}`;
  };

  // Filter and search projects
  const filteredProjects = projects.filter((project) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      project.title.toLowerCase().includes(searchLower) ||
      project.subject.toLowerCase().includes(searchLower) ||
      project.researcherName?.toLowerCase().includes(searchLower) ||
      project.controllerName?.toLowerCase().includes(searchLower)
    );

    // Apply filters
    const matchesOpdrachtgever = !filters.opdrachtgever || project.auditedByOrg === filters.opdrachtgever;
    const matchesProject = !filters.project || project.clientProject?.name === filters.project;
    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesTaal = !filters.taal || project.language === filters.taal;
    const matchesOnderzoeker = !filters.onderzoeker || project.researcherName === filters.onderzoeker;
    const matchesControleur = !filters.controleur || project.controllerName === filters.controleur;
    const matchesOnderzoekstype = !filters.onderzoekstype ||
      `${project.standard} ${project.level} - ${project.researchType}` === filters.onderzoekstype;

    return matchesSearch && matchesOpdrachtgever && matchesProject && matchesStatus &&
           matchesTaal && matchesOnderzoeker && matchesControleur && matchesOnderzoekstype;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'dateStart') {
      const dateA = a.dateStart ? new Date(a.dateStart).getTime() : 0;
      const dateB = b.dateStart ? new Date(b.dateStart).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
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
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    console.log('Beheer button clicked, current state:', showBeheerMenu);
                    setShowBeheerMenu(!showBeheerMenu);
                    console.log('New state should be:', !showBeheerMenu);
                  }}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">
              Onderzoeken ({projects.length})
            </h1>
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
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
            Nieuw onderzoek
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="dateStart">Startdatum</option>
              <option value="title">Titel</option>
              <option value="status">Status</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filters-button flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>

            {/* Filter Popup */}
            {showFilters && (
              <div className="filter-popup absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-6 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setFilters({
                      opdrachtgever: '',
                      project: '',
                      status: '',
                      taal: '',
                      onderzoeker: '',
                      controleur: '',
                      onderzoekstype: '',
                    })}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reset filters
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Opdrachtgever */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opdrachtgever</label>
                    <select
                      value={filters.opdrachtgever}
                      onChange={(e) => setFilters({ ...filters, opdrachtgever: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                    >
                      <option value="">Alle</option>
                      {Array.from(new Set(projects.map(p => p.auditedByOrg))).map(org => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select
                      value={filters.project}
                      onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                    >
                      <option value="">Alle</option>
                      {Array.from(new Set(projects.filter(p => p.clientProject?.name).map(p => p.clientProject.name))).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                      >
                        <option value="">Alle</option>
                        {Array.from(new Set(projects.map(p => p.status))).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* Taal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Taal</label>
                      <select
                        value={filters.taal}
                        onChange={(e) => setFilters({ ...filters, taal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                      >
                        <option value="">Alle</option>
                        {Array.from(new Set(projects.map(p => p.language))).map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Onderzoeker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Onderzoeker</label>
                      <select
                        value={filters.onderzoeker}
                        onChange={(e) => setFilters({ ...filters, onderzoeker: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                      >
                        <option value="">Alle</option>
                        {Array.from(new Set(projects.filter(p => p.researcherName).map(p => p.researcherName!))).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Controleur */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Controleur</label>
                      <select
                        value={filters.controleur}
                        onChange={(e) => setFilters({ ...filters, controleur: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                      >
                        <option value="">Alle</option>
                        {Array.from(new Set(projects.filter(p => p.controllerName).map(p => p.controllerName!))).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Onderzoekstype */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Onderzoekstype</label>
                    <select
                      value={filters.onderzoekstype}
                      onChange={(e) => setFilters({ ...filters, onderzoekstype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary"
                    >
                      <option value="">Alle</option>
                      {Array.from(new Set(projects.map(p => `${p.standard} ${p.level} - ${p.researchType}`))).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-6 px-4 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Filters toepassen
                </button>
              </div>
            )}
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

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kenmerk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Onderzoekstype</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Onderzoeker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Controleur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Startdatum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProjects.map((project, index) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{getKenmerk(project)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 whitespace-nowrap">
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{Number(project.version).toFixed(1)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.language}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {project.researchType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.researcherName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.controllerName || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {project.dateStart ? format(new Date(project.dateStart), 'd MMM yyyy', { locale: nl }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {project.dateEnd ? format(new Date(project.dateEnd), 'd MMM yyyy', { locale: nl }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
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
                          <div className="project-context-menu absolute right-0 top-8 z-50 w-56 rounded-lg shadow-lg border border-gray-200 py-1 bg-white">
                            <button
                              onClick={() => openEditModal(project)}
                              className="project-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 hover:bg-gray-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bewerken
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleCopy(project.id);
                              }}
                              className="project-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 hover:bg-gray-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Kopieer onderzoek
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(project.id);
                              }}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <span className="px-4 py-1 text-sm">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-12 text-center border border-gray-300 rounded"
                min={1}
                max={totalPages}
              />
              <span className="ml-2">van {totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
          <div className="relative">
            <select
              value={itemsPerPage}
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value={20}>20 items per pagina</option>
              <option value={50}>50 items per pagina</option>
              <option value={100}>100 items per pagina</option>
            </select>
            <svg
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Onderzoek bewerken</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Titel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel <span className="text-gray-400">vereist</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                {/* Opdrachtgever */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opdrachtgever <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.auditedByOrg}
                    onChange={(e) => {
                      const newOpdrachtgever = e.target.value;
                      // If changing opdrachtgever, clear clientProjectId if it doesn't match
                      const currentClientProject = clientProjects.find(p => p.id === formData.clientProjectId);
                      const shouldClearProject = currentClientProject && currentClientProject.opdrachtgever.naam !== newOpdrachtgever;

                      setFormData({
                        ...formData,
                        auditedByOrg: newOpdrachtgever,
                        clientProjectId: shouldClearProject ? '' : formData.clientProjectId,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {availableOpdrachtgevers.map((opdrachtgever) => (
                      <option key={opdrachtgever.id} value={opdrachtgever.naam}>
                        {opdrachtgever.kenmerk} - {opdrachtgever.naam}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taal
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    >
                      <option value="Nederlands">Nederlands</option>
                      <option value="Engels">Engels</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versie
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>
                </div>

                {/* Onderzoekstype (dropdown with research types from localStorage) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onderzoekstype <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.researchType}
                    onChange={(e) => setFormData({ ...formData, researchType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {availableResearchTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="Gepland">Gepland</option>
                    <option value="In uitvoering">In uitvoering</option>
                    <option value="Controle">Controle</option>
                    <option value="In de wacht">In de wacht</option>
                    <option value="Gereed">Gereed</option>
                  </select>
                </div>

                {/* Project selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.clientProjectId}
                    onChange={(e) => {
                      const selectedProject = clientProjects.find(p => p.id === e.target.value);
                      setFormData({
                        ...formData,
                        clientProjectId: e.target.value,
                        commissionedBy: selectedProject?.opdrachtgever.naam || formData.auditedByOrg
                      });
                    }}
                    disabled={!formData.auditedByOrg}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Geen project</option>
                    {formData.auditedByOrg && clientProjects
                      .filter(p => p.opdrachtgever.naam === formData.auditedByOrg)
                      .map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                  {!formData.auditedByOrg && (
                    <p className="mt-1 text-xs text-gray-500">Selecteer eerst een opdrachtgever</p>
                  )}
                </div>

                {/* Onderzoeker and Controleur */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Onderzoeker <span className="text-gray-400">vereist</span>
                    </label>
                    <select
                      required
                      value={formData.researcherName}
                      onChange={(e) => setFormData({ ...formData, researcherName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    >
                      <option value="">Selecteer...</option>
                      <option value="frits Karskens">frits Karskens</option>
                      <option value="Frits Karskens">Frits Karskens</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Controleur <span className="text-gray-400">vereist</span>
                    </label>
                    <select
                      required
                      value={formData.controllerName}
                      onChange={(e) => setFormData({ ...formData, controllerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    >
                      <option value="">Selecteer...</option>
                      <option value="frits Karskens">frits Karskens</option>
                      <option value="Frits Karskens">Frits Karskens</option>
                    </select>
                  </div>
                </div>

                {/* Geplande tijd */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geplande tijd
                  </label>
                  <input
                    type="text"
                    value={formData.plannedTime}
                    onChange={(e) => setFormData({ ...formData, plannedTime: e.target.value })}
                    placeholder="bijv. 40 uur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                {/* Startdatum and Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Startdatum <span className="text-gray-400">vereist</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateStart}
                      onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline <span className="text-gray-400">vereist</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateEnd}
                      onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>
                </div>

                {/* Onderzoek gestart op and Rapportdatum */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Onderzoek gestart op
                    </label>
                    <input
                      type="date"
                      value={formData.researchStartedOn}
                      onChange={(e) => setFormData({ ...formData, researchStartedOn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rapportdatum
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.reportDate}
                      onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>
                </div>

                {/* Beschrijving */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-8">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Anoniem</span>
                    <div className="relative tooltip-container">
                      <button
                        type="button"
                        onClick={() => setShowAnonymousTooltip(!showAnonymousTooltip)}
                        className="tooltip-button text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {showAnonymousTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                          <div className="text-xs text-gray-700">
                            Zet 'Anoniem' aan als het project gevoelige data bevat. URL's uit je steekproef en scope worden verborgen in het publieke rapport.
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-8 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Privé</span>
                    <div className="relative tooltip-container">
                      <button
                        type="button"
                        onClick={() => setShowPrivateTooltip(!showPrivateTooltip)}
                        className="tooltip-button text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {showPrivateTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                          <div className="text-xs text-gray-700">
                            Zet 'Privé' aan om dit onderzoek af te schermen met een wachtwoord.
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-8 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full px-6 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f' }}
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Nieuw onderzoek</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="space-y-6">
                {/* Titel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel <span className="text-gray-400">vereist</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                {/* Opdrachtgever */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opdrachtgever <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.auditedByOrg}
                    onChange={(e) => {
                      const newOpdrachtgever = e.target.value;
                      // If changing opdrachtgever, clear clientProjectId if it doesn't match
                      const currentClientProject = clientProjects.find(p => p.id === formData.clientProjectId);
                      const shouldClearProject = currentClientProject && currentClientProject.opdrachtgever.naam !== newOpdrachtgever;

                      setFormData({
                        ...formData,
                        auditedByOrg: newOpdrachtgever,
                        clientProjectId: shouldClearProject ? '' : formData.clientProjectId,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {availableOpdrachtgevers.map((opdrachtgever) => (
                      <option key={opdrachtgever.id} value={opdrachtgever.naam}>
                        {opdrachtgever.kenmerk} - {opdrachtgever.naam}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taal and Versie */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taal
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    >
                      <option value="Nederlands">Nederlands</option>
                      <option value="Engels">Engels</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versie
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>
                </div>

                {/* Onderzoekstype (dynamically loaded from database) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onderzoekstype <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.researchType}
                    onChange={(e) => setFormData({ ...formData, researchType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {availableResearchTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="Gepland">Gepland</option>
                    <option value="In uitvoering">In uitvoering</option>
                    <option value="Controle">Controle</option>
                    <option value="In de wacht">In de wacht</option>
                    <option value="Gereed">Gereed</option>
                  </select>
                </div>

                {/* Project selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.clientProjectId}
                    onChange={(e) => {
                      const selectedProject = clientProjects.find(p => p.id === e.target.value);
                      setFormData({
                        ...formData,
                        clientProjectId: e.target.value,
                        commissionedBy: selectedProject?.opdrachtgever.naam || formData.auditedByOrg
                      });
                    }}
                    disabled={!formData.auditedByOrg}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Geen project</option>
                    {formData.auditedByOrg && clientProjects
                      .filter(p => p.opdrachtgever.naam === formData.auditedByOrg)
                      .map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                  {!formData.auditedByOrg && (
                    <p className="mt-1 text-xs text-gray-500">Selecteer eerst een opdrachtgever</p>
                  )}
                </div>

                {/* Onderzoeker and Controleur */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Onderzoeker <span className="text-gray-400">vereist</span>
                    </label>
                    <select
                      required
                      value={formData.researcherName}
                      onChange={(e) => setFormData({ ...formData, researcherName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    >
                      <option value="">Selecteer...</option>
                      <option value="frits Karskens">frits Karskens</option>
                      <option value="Frits Karskens">Frits Karskens</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Controleur <span className="text-gray-400">vereist</span>
                    </label>
                    <select
                      required
                      value={formData.controllerName}
                      onChange={(e) => setFormData({ ...formData, controllerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    >
                      <option value="">Selecteer...</option>
                      <option value="frits Karskens">frits Karskens</option>
                      <option value="Frits Karskens">Frits Karskens</option>
                    </select>
                  </div>
                </div>

                {/* Geplande tijd */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geplande tijd
                  </label>
                  <input
                    type="text"
                    value={formData.plannedTime}
                    onChange={(e) => setFormData({ ...formData, plannedTime: e.target.value })}
                    placeholder="bijv. 40 uur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                {/* Startdatum and Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Startdatum <span className="text-gray-400">vereist</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateStart}
                      onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline <span className="text-gray-400">vereist</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateEnd}
                      onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>
                </div>

                {/* Onderzoek gestart op and Rapportdatum */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Onderzoek gestart op
                    </label>
                    <input
                      type="date"
                      value={formData.researchStartedOn}
                      onChange={(e) => setFormData({ ...formData, researchStartedOn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rapportdatum
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.reportDate}
                      onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>
                </div>

                {/* Beschrijving */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-8">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Anoniem</span>
                    <div className="relative tooltip-container">
                      <button
                        type="button"
                        onClick={() => setShowAnonymousTooltip(!showAnonymousTooltip)}
                        className="tooltip-button text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {showAnonymousTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                          <div className="text-xs text-gray-700">
                            Zet 'Anoniem' aan als het project gevoelige data bevat. URL's uit je steekproef en scope worden verborgen in het publieke rapport.
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-8 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Privé</span>
                    <div className="relative tooltip-container">
                      <button
                        type="button"
                        onClick={() => setShowPrivateTooltip(!showPrivateTooltip)}
                        className="tooltip-button text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {showPrivateTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                          <div className="text-xs text-gray-700">
                            Zet 'Privé' aan om dit onderzoek af te schermen met een wachtwoord.
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-8 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full px-6 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f' }}
                >
                  Aanmaken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
