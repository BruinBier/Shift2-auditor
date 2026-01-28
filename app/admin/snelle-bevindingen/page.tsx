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

interface QuickFinding {
  id: string;
  title: string;
  description: string;
  advice: string;
  criterionCode: string;
  keywords: string | null;
  crawler: boolean;
  status: 'open' | 'published' | 'resolved' | null;
  impact: 'klein' | 'matig' | 'serieus' | 'kritiek' | 'onbekend' | null;
  responsibility: 'redacteur' | 'ontwikkelaar' | 'ontwerper' | 'onbekend' | null;
  createdAt: string;
  updatedAt: string;
}

interface WCAGCriterion {
  id: string;
  code: string;
  titleNl: string;
  level: string;
}

export default function SnelleBevindingen() {
  const [quickFindings, setQuickFindings] = useState<QuickFinding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<QuickFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'criterionCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wcagCriteria, setWcagCriteria] = useState<WCAGCriterion[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    criterionCode: '',
    keywords: '',
    concept: false,
    description: '',
    status: 'open',
    responsibility: 'onbekend',
    impact: 'onbekend',
    advice: '',
    crawler: false,
  });

  useEffect(() => {
    setMounted(true);
    fetchQuickFindings();
    fetchWcagCriteria();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [quickFindings, searchQuery, sortBy, sortOrder, filterStatus, filterImpact]);

  const fetchWcagCriteria = async () => {
    try {
      const response = await fetch('/api/wcag-criteria');
      if (response.ok) {
        const data = await response.json();
        // Filter to only show A and AA level criteria
        const aAndAACriteria = data.filter((criterion: WCAGCriterion) =>
          criterion.level === 'A' || criterion.level === 'AA'
        );
        setWcagCriteria(aAndAACriteria);
      }
    } catch (error) {
      console.error('Error fetching WCAG criteria:', error);
    }
  };

  const fetchQuickFindings = async () => {
    try {
      const response = await fetch('/api/quick-findings');
      if (response.ok) {
        const data = await response.json();
        setQuickFindings(data);
      }
    } catch (error) {
      console.error('Error fetching quick findings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...quickFindings];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.criterionCode.toLowerCase().includes(query)
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'criterionCode':
          aValue = a.criterionCode;
          bValue = b.criterionCode;
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

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Onbekend';
    switch (status) {
      case 'open': return 'Open';
      case 'published': return 'Gepubliceerd';
      case 'resolved': return 'Opgelost';
      default: return status;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
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

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/quick-findings/${editingId}` : '/api/quick-findings';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedFinding = await response.json();

        if (editingId) {
          // Update existing finding
          setQuickFindings(quickFindings.map(f => f.id === editingId ? savedFinding : f));
        } else {
          // Add new finding
          setQuickFindings([...quickFindings, savedFinding]);
        }

        setShowCreateModal(false);
        setEditingId(null);
        setFormData({
          title: '',
          criterionCode: '',
          keywords: '',
          concept: false,
          description: '',
          status: 'open',
          responsibility: 'onbekend',
          impact: 'onbekend',
          advice: '',
          crawler: false,
        });
      } else {
        const action = editingId ? 'bijwerken' : 'aanmaken';
        alert(`Er is een fout opgetreden bij het ${action} van de snelle bevinding.`);
      }
    } catch (error) {
      console.error('Error saving quick finding:', error);
      const action = editingId ? 'bijwerken' : 'aanmaken';
      alert(`Er is een fout opgetreden bij het ${action} van de snelle bevinding.`);
    }
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      criterionCode: '',
      keywords: '',
      concept: false,
      description: '',
      status: 'open',
      responsibility: 'onbekend',
      impact: 'onbekend',
      advice: '',
      crawler: false,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (finding: QuickFinding) => {
    setEditingId(finding.id);
    setFormData({
      title: finding.title,
      criterionCode: finding.criterionCode,
      keywords: finding.keywords || '',
      concept: false, // Not in QuickFinding interface
      description: finding.description,
      status: finding.status || 'open',
      responsibility: finding.responsibility || 'onbekend',
      impact: finding.impact || 'onbekend',
      advice: finding.advice,
      crawler: finding.crawler,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze snelle bevinding wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/quick-findings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuickFindings(quickFindings.filter(f => f.id !== id));
      } else {
        alert('Er is een fout opgetreden bij het verwijderen van de snelle bevinding.');
      }
    } catch (error) {
      console.error('Error deleting quick finding:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de snelle bevinding.');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      criterionCode: '',
      keywords: '',
      concept: false,
      description: '',
      status: 'open',
      responsibility: 'onbekend',
      impact: 'onbekend',
      advice: '',
      crawler: false,
    });
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Snelle bevindingen ({filteredFindings.length})
        </h1>
        <button
          onClick={handleOpenModal}
          className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Nieuwe snelle bevinding
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Volgorde</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="title-asc">Titel (A-Z)</option>
              <option value="title-desc">Titel (Z-A)</option>
              <option value="createdAt-desc">Datum aangemaakt</option>
              <option value="createdAt-asc">Datum aangemaakt (oudste eerst)</option>
              <option value="criterionCode-asc">Succescriterium (laag-hoog)</option>
              <option value="criterionCode-desc">Succescriterium (hoog-laag)</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-md text-sm transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filters {(filterStatus !== 'all' || filterImpact !== 'all') && '(actief)'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterImpact('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Filters wissen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschrijving
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trefwoorden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Succescriterium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Crawler
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentFindings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Geen snelle bevindingen gevonden.
                  </td>
                </tr>
              ) : (
                currentFindings.map((finding) => (
                  <tr key={finding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{finding.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md">
                        {stripHtml(finding.description)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {finding.keywords || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{finding.criterionCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(finding.status)}`}>
                        {getStatusLabel(finding.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {finding.crawler && (
                        <svg className="w-5 h-5 mx-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(finding)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Bewerken"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(finding.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Verwijderen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Snelle bevinding bewerken' : 'Nieuwe snelle bevinding'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Titel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel <span className="text-red-500">vereist</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Criterium */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criterium <span className="text-red-500">vereist</span>
                </label>
                <select
                  required
                  value={formData.criterionCode}
                  onChange={(e) => setFormData({ ...formData, criterionCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecteer een criterium</option>
                  {wcagCriteria.map((criterion) => (
                    <option key={criterion.id} value={criterion.code}>
                      {criterion.code} - {criterion.titleNl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trefwoorden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trefwoorden
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="Scheid keywords met een komma en een spatie"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Concept Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="concept"
                  checked={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="concept" className="text-sm text-gray-700">
                  Concept
                </label>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  title="Dit is een concept bevinding"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Beschrijving */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving <span className="text-red-500">vereist</span>
                </label>
                {mounted && (
                  <MdEditor
                    modelValue={formData.description}
                    onChange={(content) => setFormData({ ...formData, description: content })}
                    language="en-US"
                    theme="light"
                    previewTheme="default"
                    codeTheme="github"
                    showCodeRowNumber={true}
                    toolbars={[
                      'bold',
                      'underline',
                      'italic',
                      '-',
                      'title',
                      'strikeThrough',
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
                      'pageFullscreen',
                      'fullscreen',
                      'preview',
                      'catalog',
                    ]}
                    style={{ height: '300px' }}
                  />
                )}
              </div>

              {/* Advies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advies <span className="text-red-500">vereist</span>
                </label>
                {mounted && (
                  <MdEditor
                    modelValue={formData.advice}
                    onChange={(content) => setFormData({ ...formData, advice: content })}
                    language="en-US"
                    theme="light"
                    previewTheme="default"
                    codeTheme="github"
                    showCodeRowNumber={true}
                    toolbars={[
                      'bold',
                      'underline',
                      'italic',
                      '-',
                      'title',
                      'strikeThrough',
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
                      'pageFullscreen',
                      'fullscreen',
                      'preview',
                      'catalog',
                    ]}
                    style={{ height: '300px' }}
                  />
                )}
              </div>

              {/* Status, Verantwoordelijkheid, Impact */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-600">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Afgekeurd</option>
                    <option value="resolved">Opmerking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verantwoordelijkheid <span className="text-red-600">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.responsibility}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="onbekend">Onbekend</option>
                    <option value="redacteur">Redacteur</option>
                    <option value="ontwikkelaar">Ontwikkelaar</option>
                    <option value="ontwerper">Ontwerper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impact <span className="text-red-600">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="onbekend">Onbekend</option>
                    <option value="klein">Klein</option>
                    <option value="matig">Matig</option>
                    <option value="serieus">Serieus</option>
                    <option value="kritiek">Kritiek</option>
                  </select>
                </div>
              </div>

              {/* Toggle Switches: Concept, Opgelost, Gecontroleerd */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        checked={formData.concept}
                        onChange={(e) => setFormData({ ...formData, concept: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Concept</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Opgelost</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Gecontroleerd</span>
                  </label>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-start gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="modal-save-button px-6 py-2 bg-[#1f0036] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Opslaan
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Opslaan en nieuw
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Opslaan en dupliceren
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}