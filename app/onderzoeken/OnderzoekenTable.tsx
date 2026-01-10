'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
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
}

interface Props {
  projects: Project[];
}

export default function OnderzoekenTable({ projects }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateStart');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  // Generate kenmerk (identifier) from index
  const getKenmerk = (index: number) => `SHP-${index + 1}`;

  // Filter and search projects
  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.subject.toLowerCase().includes(searchLower) ||
      project.researcherName?.toLowerCase().includes(searchLower) ||
      project.controllerName?.toLowerCase().includes(searchLower)
    );
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
      <style jsx>{`
        button.project-menu-button,
        button.project-menu-button[class] {
          background-color: transparent !important;
        }
        button.project-menu-button:hover,
        button.project-menu-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        .project-context-menu,
        div.project-context-menu[class] {
          background-color: white !important;
        }
        button.project-menu-item,
        button.project-menu-item[class],
        a.project-menu-item,
        a.project-menu-item[class] {
          background-color: transparent !important;
        }
        button.project-menu-item:hover,
        button.project-menu-item[class]:hover,
        a.project-menu-item:hover,
        a.project-menu-item[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.project-menu-item-delete,
        button.project-menu-item-delete[class] {
          background-color: transparent !important;
        }
        button.project-menu-item-delete:hover,
        button.project-menu-item-delete[class]:hover {
          background-color: #F3F4F6 !important;
        }
      `}</style>
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
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
              <Link
                href="/admin/beheer"
                className="flex items-center gap-2 text-white hover:text-gray-300"
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
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: '#79e792',
              color: '#1f0036'
            }}
          >
            Nieuw onderzoek
          </Link>
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

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
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{getKenmerk(startIndex + index)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.version}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.language}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {project.standard} {project.level} – {project.researchType}
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
                            <Link
                              href={`/admin/projects/${project.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="project-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 hover:bg-gray-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bewerken
                            </Link>
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
    </div>
  );
}
