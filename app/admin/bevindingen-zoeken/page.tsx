'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

interface Finding {
  id: string;
  projectId: string;
  findingCode: string;
  wcagCriterionId: string;
  quickFindingId: string | null;
  status: 'open' | 'published' | 'resolved';
  impact: 'klein' | 'matig' | 'serieus' | 'kritiek' | 'onbekend' | null;
  responsibility: 'redacteur' | 'ontwikkelaar' | 'ontwerper' | 'onbekend' | null;
  description: string;
  advice: string;
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    title: string;
    subject: string;
  };
  wcagCriterion: {
    code: string;
    titleNl: string;
    level: string;
  };
}

interface Project {
  id: string;
  title: string;
}

export default function BevindingenZoeken() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<Finding[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'findingCode' | 'criterionCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [findings, searchQuery, sortBy, sortOrder, filterStatus, filterImpact, filterProject, filterLevel]);

  const fetchData = async () => {
    try {
      // Fetch all projects to get findings
      const projectsResponse = await fetch('/api/projects');
      if (!projectsResponse.ok) {
        console.error('Failed to fetch projects');
        setIsLoading(false);
        return;
      }

      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch findings from all projects
      const allFindings: Finding[] = [];
      for (const project of projectsData) {
        try {
          const findingsResponse = await fetch(`/api/projects/${project.id}/findings`);
          if (findingsResponse.ok) {
            const findingsData = await findingsResponse.json();
            allFindings.push(...findingsData);
          }
        } catch (error) {
          console.error(`Error fetching findings for project ${project.id}:`, error);
        }
      }

      setFindings(allFindings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...findings];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.description.toLowerCase().includes(query) ||
        f.advice.toLowerCase().includes(query) ||
        f.findingCode.toLowerCase().includes(query) ||
        f.wcagCriterion.code.toLowerCase().includes(query) ||
        f.wcagCriterion.titleNl.toLowerCase().includes(query) ||
        (f.project?.title || '').toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }

    // Apply impact filter
    if (filterImpact !== 'all') {
      filtered = filtered.filter(f => f.impact === filterImpact);
    }

    // Apply project filter
    if (filterProject !== 'all') {
      filtered = filtered.filter(f => f.projectId === filterProject);
    }

    // Apply level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(f => f.wcagCriterion.level === filterLevel);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'findingCode':
          aValue = a.findingCode;
          bValue = b.findingCode;
          break;
        case 'criterionCode':
          aValue = a.wcagCriterion.code;
          bValue = b.wcagCriterion.code;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredFindings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'published': return 'Gepubliceerd';
      case 'resolved': return 'Opgelost';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactLabel = (impact: string | null) => {
    if (!impact) return 'Onbekend';
    switch (impact) {
      case 'klein': return 'Klein';
      case 'matig': return 'Matig';
      case 'serieus': return 'Serieus';
      case 'kritiek': return 'Kritiek';
      case 'onbekend': return 'Onbekend';
      default: return impact;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'AA': return 'bg-blue-100 text-blue-800';
      case 'AAA': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
  };

  // Pagination
  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFindings = filteredFindings.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="p-8">
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Bevindingen zoeken ({filteredFindings.length})
          </h1>
          <p className="text-gray-600 mt-2">
            Zoek door alle bevindingen uit alle projecten
          </p>
        </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Sorteren op:</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">Datum aangemaakt (nieuwste eerst)</option>
              <option value="createdAt-asc">Datum aangemaakt (oudste eerst)</option>
              <option value="findingCode-asc">Bevindingscode (A-Z)</option>
              <option value="findingCode-desc">Bevindingscode (Z-A)</option>
              <option value="criterionCode-asc">Succescriterium (laag-hoog)</option>
              <option value="criterionCode-desc">Succescriterium (hoog-laag)</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-1.5 border rounded-md text-sm transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filters {(filterStatus !== 'all' || filterImpact !== 'all' || filterProject !== 'all' || filterLevel !== 'all') && '(actief)'}
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

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle</option>
                  <option value="open">Open</option>
                  <option value="published">Gepubliceerd</option>
                  <option value="resolved">Opgelost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Impact</label>
                <select
                  value={filterImpact}
                  onChange={(e) => setFilterImpact(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle</option>
                  <option value="klein">Klein</option>
                  <option value="matig">Matig</option>
                  <option value="serieus">Serieus</option>
                  <option value="kritiek">Kritiek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle projecten</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle niveaus</option>
                  <option value="A">A</option>
                  <option value="AA">AA</option>
                  <option value="AAA">AAA</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterImpact('all');
                  setFilterProject('all');
                  setFilterLevel('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Alle filters wissen
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschrijving
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Succescriterium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentFindings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Geen bevindingen gevonden.
                  </td>
                </tr>
              ) : (
                currentFindings.map((finding) => (
                  <tr key={finding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono font-medium text-gray-900">{finding.findingCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/projects/${finding.projectId}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {finding.project?.title || 'Onbekend project'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md">
                        {stripHtml(finding.description)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{finding.wcagCriterion.code}</div>
                      <div className="text-xs text-gray-500">{finding.wcagCriterion.titleNl}</div>
                      <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded ${getLevelColor(finding.wcagCriterion.level)}`}>
                        Niveau {finding.wcagCriterion.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(finding.status)}`}>
                        {getStatusLabel(finding.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{getImpactLabel(finding.impact)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/projects/${finding.projectId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Bekijken
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredFindings.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {startIndex + 1} - {Math.min(endIndex, filteredFindings.length)} van {filteredFindings.length}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 items per pagina</option>
                <option value={20}>20 items per pagina</option>
                <option value={50}>50 items per pagina</option>
                <option value={100}>100 items per pagina</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Vorige
              </button>
              <span className="text-sm text-gray-700">
                Pagina {currentPage} van {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Volgende
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}