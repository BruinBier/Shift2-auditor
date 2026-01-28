'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('../../../admin/projects/[id]/tabs/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

interface ClientProject {
  id: string;
  name: string;
  details: string | null;
  opdrachtgever: {
    id: string;
    naam: string;
  };
}

interface Opdrachtgever {
  id: string;
  kenmerk: string;
  naam: string;
  contactnaam: string;
  contactEmail: string;
}

export default function OpdrachtgeverDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [opdrachtgever, setOpdrachtgever] = useState<Opdrachtgever | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ClientProject | null>(null);
  const [availableOpdrachtgevers, setAvailableOpdrachtgevers] = useState<Array<{ id: string; kenmerk: string; naam: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    opdrachtgeverId: '',
    details: '',
  });
  const [showOpdrachtgeverEditModal, setShowOpdrachtgeverEditModal] = useState(false);
  const [opdrachtgeverFormData, setOpdrachtgeverFormData] = useState({
    kenmerk: '',
    naam: '',
    contactnaam: '',
    contactEmail: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch opdrachtgever details
        const opdResponse = await fetch(`/api/opdrachtgevers/${id}`);
        if (opdResponse.ok) {
          const opdData = await opdResponse.json();
          setOpdrachtgever(opdData);
        }

        // Fetch all opdrachtgevers for dropdown
        const allOpdResponse = await fetch('/api/opdrachtgevers');
        if (allOpdResponse.ok) {
          const allOpdData = await allOpdResponse.json();
          setAvailableOpdrachtgevers(allOpdData);
        }

        // Fetch client projects for this opdrachtgever
        const projResponse = await fetch('/api/client-projects');
        if (projResponse.ok) {
          const projData = await projResponse.json();
          const filteredProjects = projData.filter((p: ClientProject) => p.opdrachtgever.id === id);
          setProjects(filteredProjects);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Close menus on Escape key or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setOpenProjectMenuId(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close menus if click is outside any menu
      if (!target.closest('.menu-container')) {
        setShowMenu(false);
        setOpenProjectMenuId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Pagination
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  const openEditModal = (project: ClientProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      opdrachtgeverId: project.opdrachtgever.id,
      details: project.details || '',
    });
    setShowEditModal(true);
    setOpenProjectMenuId(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
    setFormData({
      name: '',
      opdrachtgeverId: '',
      details: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.details || formData.details.trim() === '' || formData.details === '<p></p>') {
      alert('Projectdetails is verplicht');
      return;
    }

    try {
      if (editingProject) {
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

  const openEditOpdrachtgeverModal = () => {
    if (opdrachtgever) {
      setOpdrachtgeverFormData({
        kenmerk: opdrachtgever.kenmerk,
        naam: opdrachtgever.naam,
        contactnaam: opdrachtgever.contactnaam,
        contactEmail: opdrachtgever.contactEmail,
      });
      setShowOpdrachtgeverEditModal(true);
      setShowMenu(false);
    }
  };

  const closeOpdrachtgeverModal = () => {
    setShowOpdrachtgeverEditModal(false);
    setOpdrachtgeverFormData({
      kenmerk: '',
      naam: '',
      contactnaam: '',
      contactEmail: '',
    });
  };

  const handleOpdrachtgeverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/opdrachtgevers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opdrachtgeverFormData),
      });

      if (response.ok) {
        const updatedOpdrachtgever = await response.json();
        setOpdrachtgever(updatedOpdrachtgever);
        closeOpdrachtgeverModal();
      } else {
        alert('Fout bij het updaten van de opdrachtgever');
      }
    } catch (error) {
      console.error('Error saving opdrachtgever:', error);
      alert('Fout bij het opslaan van de opdrachtgever');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!opdrachtgever) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Opdrachtgever niet gevonden</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Title with menu */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">{opdrachtgever.naam}</h1>
            <div className="relative menu-container">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={openEditOpdrachtgeverModal}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Bewerken
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Verwijderen
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="mb-8 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Kenmerk</div>
              <div className="text-sm text-gray-900">{opdrachtgever.kenmerk}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Contactnaam</div>
              <div className="text-sm text-gray-900">{opdrachtgever.contactnaam}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Contact e-mail</div>
              <div className="text-sm text-gray-900">{opdrachtgever.contactEmail || '-'}</div>
            </div>
          </div>

          {/* Projects section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Projecten ({projects.length})
            </h2>

            {projects.length > 0 ? (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projectdetails</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opdrachtgever</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{project.name}</td>
                        <td className="px-4 py-3 text-sm">
                          {project.details ? (
                            (() => {
                              // Strip HTML tags and get clean URL
                              const cleanUrl = project.details.replace(/<[^>]*>/g, '').trim();
                              return (
                                <a
                                  href={cleanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {cleanUrl}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              );
                            })()
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{project.opdrachtgever.naam}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                            <div className="relative menu-container">
                              <button
                                onClick={() => setOpenProjectMenuId(openProjectMenuId === project.id ? null : project.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              {openProjectMenuId === project.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  <button
                                    onClick={() => openEditModal(project)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Bewerken
                                  </button>
                                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
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

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    <div className="px-3 py-1 border border-gray-300 rounded bg-white">
                      {currentPage}
                    </div>
                    <span className="text-sm text-gray-600">van {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »
                    </button>
                  </div>

                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10 items per pagina</option>
                    <option value={20}>20 items per pagina</option>
                    <option value={50}>50 items per pagina</option>
                    <option value={100}>100 items per pagina</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Geen projecten gevonden voor deze opdrachtgever
              </div>
            )}
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
                Project bewerken
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

      {/* Edit Opdrachtgever Modal */}
      {showOpdrachtgeverEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Opdrachtgever bewerken
              </h2>
              <button
                onClick={closeOpdrachtgeverModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleOpdrachtgeverSubmit} className="p-6 space-y-6">
              {/* Kenmerk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kenmerk <span className="text-gray-400">vereist</span>
                </label>
                <input
                  type="text"
                  required
                  value={opdrachtgeverFormData.kenmerk}
                  onChange={(e) => setOpdrachtgeverFormData({ ...opdrachtgeverFormData, kenmerk: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  placeholder="bijv. ABC"
                />
              </div>

              {/* Naam */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam opdrachtgever <span className="text-gray-400">vereist</span>
                </label>
                <input
                  type="text"
                  required
                  value={opdrachtgeverFormData.naam}
                  onChange={(e) => setOpdrachtgeverFormData({ ...opdrachtgeverFormData, naam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  placeholder="bijv. Gemeente Amsterdam"
                />
              </div>

              {/* Contactnaam */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contactnaam
                </label>
                <input
                  type="text"
                  value={opdrachtgeverFormData.contactnaam}
                  onChange={(e) => setOpdrachtgeverFormData({ ...opdrachtgeverFormData, contactnaam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  placeholder="bijv. Jan Janssen"
                />
              </div>

              {/* Contact e-mail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact e-mail
                </label>
                <input
                  type="email"
                  value={opdrachtgeverFormData.contactEmail}
                  onChange={(e) => setOpdrachtgeverFormData({ ...opdrachtgeverFormData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  placeholder="bijv. contact@gemeente.nl"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeOpdrachtgeverModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}