'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScopePage {
  id: string;
  url: string;
  title: string;
  crawlerType?: string;
  inScope: boolean;
}

export default function ScopeManagement({ project }: { project: any }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    description: '',
  });
  const [scopeInfo, setScopeInfo] = useState(project.scopeInfo || '');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoverInButton, setHoverInButton] = useState(false);
  const [hoverOutButton, setHoverOutButton] = useState(false);

  // Haal scope URLs op uit project data
  const scopePages: ScopePage[] = project.scopeUrls || [];
  const inScopePages = scopePages.filter(p => p.inScope);
  const outScopePages = scopePages.filter(p => !p.inScope);

  const openModal = (type: 'in' | 'out', page?: ScopePage) => {
    setModalType(type);
    if (page) {
      setEditingId(page.id);
      setFormData({ url: page.url, description: page.title || '' });
    } else {
      setEditingId(null);
      setFormData({ url: '', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ url: '', description: '' });
  };

  const handleDelete = async (urlId: string) => {
    if (!confirm('Weet je zeker dat je deze URL wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/scope-urls/${urlId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Er ging iets mis bij het verwijderen.');
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
      alert('Er ging iets mis bij het verwijderen.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      url: formData.url,
      title: formData.description,
      crawlerType: 'Productieomgeving',
      inScope: modalType === 'in',
    };

    console.log(editingId ? 'Updating' : 'Creating', 'scope URL:', payload);

    try {
      const url = editingId
        ? `/api/projects/${project.id}/scope-urls/${editingId}`
        : `/api/projects/${project.id}/scope-urls`;

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response:', { status: response.status, data });

      if (response.ok) {
        console.log('URL successfully', editingId ? 'updated' : 'added');
        closeModal();
        router.refresh();
      } else {
        console.error('Error:', data);
        alert(`Er ging iets mis: ${data.details || data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Er ging iets mis.');
    }
  };

  const handleScopeInfoSave = async () => {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeInfo }),
    });
    router.refresh();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .scope-add-button {
          background-color: white !important;
        }
        .scope-add-button:hover {
          background-color: #F9FAFB !important;
        }
        .scope-menu-button {
          background-color: transparent !important;
        }
        .scope-menu-button:hover {
          background-color: #F3F4F6 !important;
        }
      `}} />
      <div className="grid grid-cols-3 gap-6">
      {/* Left column - Scope lists */}
      <div className="col-span-2 space-y-8">
        {/* Binnen scope sectie */}
        <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Binnen scope</h3>
            <button
              onClick={() => openModal('in')}
              onMouseEnter={() => setHoverInButton(true)}
              onMouseLeave={() => setHoverInButton(false)}
              className="scope-add-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                border: '1px solid #79e792',
                color: '#1f0036'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.0" />
              </svg>
              URL toevoegen
            </button>
          </div>
        </div>

        {false && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                  placeholder="https://example.com/pagina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                  placeholder="Pagina titel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crawler type</label>
                <select
                  value={formData.crawlerType}
                  onChange={(e) => setFormData({ ...formData, crawlerType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                >
                  <option>Productieomgeving</option>
                  <option>Pre-loginpagina</option>
                  <option>Test omgeving</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 bg-shift2-primary text-white rounded-lg hover:bg-shift2-primary/90"
                >
                  Toevoegen
                </button>
                <button
                  onClick={() => setShowInScopeForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {inScopePages.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Geen pagina's.</p>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Pagina</th>
                  <th className="pb-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inScopePages.map((page) => (
                  <tr key={page.id}>
                    <td className="py-4">
                      <div>
                        <div className="font-medium text-gray-900">{page.url}</div>
                        <div className="text-sm text-gray-500">{page.title}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 relative">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === page.id ? null : page.id)}
                          className="scope-menu-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Context menu */}
                        {openMenuId === page.id && (
                          <div className="absolute right-0 top-8 z-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                openModal('in', page);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bewerken
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                alert('Crawler initialiseren - nog te implementeren');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Crawler initialiseren
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(page.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Verwijderen
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Buiten scope sectie */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Buiten scope</h3>
            <button
              onClick={() => openModal('out')}
              onMouseEnter={() => setHoverOutButton(true)}
              onMouseLeave={() => setHoverOutButton(false)}
              className="scope-add-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                border: '1px solid #79e792',
                color: '#1f0036'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              URL toevoegen
            </button>
          </div>
        </div>

        {false && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                  placeholder="https://example.com/pagina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                  placeholder="Pagina titel"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit(false)}
                  className="px-4 py-2 bg-shift2-primary text-white rounded-lg hover:bg-shift2-primary/90"
                >
                  Toevoegen
                </button>
                <button
                  onClick={() => setShowOutScopeForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {outScopePages.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Geen pagina's.</p>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Pagina</th>
                  <th className="pb-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {outScopePages.map((page) => (
                  <tr key={page.id}>
                    <td className="py-4">
                      <div>
                        <div className="font-medium text-gray-900">{page.url}</div>
                        <div className="text-sm text-gray-500">{page.title}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 relative">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === page.id ? null : page.id)}
                          className="scope-menu-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Context menu */}
                        {openMenuId === page.id && (
                          <div className="absolute right-0 top-8 z-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                openModal('out', page);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bewerken
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                alert('Crawler initialiseren - nog te implementeren');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Crawler initialiseren
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(page.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Verwijderen
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>

      {/* Right sidebar - Scope info */}
      <div className="space-y-6">
        {/* Stap 1 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Stap 1. Scope</h3>
          <p className="text-sm text-gray-600">
            Definieer de scope van het onderzoek. Idealiter wordt dit gedaan in samenwerking met de opdrachtgever.
          </p>
        </div>

        {/* Overige scope informatie */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overige scope informatie</h3>
            <div className="flex gap-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          <textarea
            value={scopeInfo}
            onChange={(e) => setScopeInfo(e.target.value)}
            onBlur={handleScopeInfoSave}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent text-sm"
            placeholder="Vul hier aanvullende scope informatie in..."
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{editingId ? 'URL bewerken' : 'URL toevoegen'}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL <span className="text-red-500">vereist</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                    rows={4}
                    placeholder="Voeg een beschrijving toe..."
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f' }}
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
