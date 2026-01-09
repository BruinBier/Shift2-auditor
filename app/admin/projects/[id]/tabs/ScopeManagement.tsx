'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [showScopeInfoModal, setShowScopeInfoModal] = useState(false);
  const [tempScopeInfo, setTempScopeInfo] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoverInButton, setHoverInButton] = useState(false);
  const [hoverOutButton, setHoverOutButton] = useState(false);

  // Haal scope URLs op uit project data
  const scopePages: ScopePage[] = project.scopeUrls || [];
  const inScopePages = scopePages.filter(p => p.inScope);
  const outScopePages = scopePages.filter(p => !p.inScope);

  // Close context menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the context menu and the menu button
      if (openMenuId &&
          !target.closest('.scope-context-menu') &&
          !target.closest('.scope-menu-button')) {
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

  const openScopeInfoModal = () => {
    setTempScopeInfo(scopeInfo);
    setShowScopeInfoModal(true);
  };

  const closeScopeInfoModal = () => {
    setShowScopeInfoModal(false);
    setTempScopeInfo('');
  };

  const saveScopeInfoModal = async () => {
    setScopeInfo(tempScopeInfo);
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeInfo: tempScopeInfo }),
    });
    router.refresh();
    closeScopeInfoModal();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        button.scope-add-button,
        button.scope-add-button[class] {
          background-color: white !important;
        }
        button.scope-add-button:hover,
        button.scope-add-button[class]:hover {
          background-color: #F9FAFB !important;
        }
        button.scope-menu-button,
        button.scope-menu-button[class] {
          background-color: transparent !important;
        }
        button.scope-menu-button:hover,
        button.scope-menu-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        .scope-context-menu,
        div.scope-context-menu[class] {
          background-color: white !important;
        }
        button.scope-menu-item,
        button.scope-menu-item[class] {
          background-color: transparent !important;
        }
        button.scope-menu-item:hover,
        button.scope-menu-item[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.scope-menu-item-delete,
        button.scope-menu-item-delete[class] {
          background-color: transparent !important;
        }
        button.scope-menu-item-delete:hover,
        button.scope-menu-item-delete[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.scope-modal-close,
        button.scope-modal-close[class] {
          background-color: transparent !important;
        }
        button.scope-modal-close:hover,
        button.scope-modal-close[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.scope-info-button,
        button.scope-info-button[class] {
          background-color: transparent !important;
        }
        button.scope-info-button:hover,
        button.scope-info-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.toolbar-button,
        button.toolbar-button[class] {
          background-color: transparent !important;
        }
        button.toolbar-button:hover,
        button.toolbar-button[class]:hover {
          background-color: #E5E7EB !important;
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
                      <div className="flex items-center gap-2 relative justify-end">
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
                          <div className="scope-context-menu absolute right-0 top-8 z-10 w-56 rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                openModal('in', page);
                              }}
                              className="scope-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bewerken
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(page.id);
                              }}
                              className="scope-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3"
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
                      <div className="flex items-center gap-2 relative justify-end">
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
                          <div className="scope-context-menu absolute right-0 top-8 z-10 w-56 rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                openModal('out', page);
                              }}
                              className="scope-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bewerken
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(page.id);
                              }}
                              className="scope-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3"
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
              <button
                onClick={openScopeInfoModal}
                className="scope-info-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="w-full min-h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {scopeInfo || <span className="text-gray-400">Vul hier aanvullende scope informatie in...</span>}
          </div>
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
                className="scope-modal-close text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
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

      {/* Scope Info Modal */}
      {showScopeInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Overige scope informatie</h3>
              <button
                onClick={closeScopeInfoModal}
                className="scope-modal-close text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving
                </label>
                {/* Rich text editor toolbar */}
                <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center gap-1 border-b-0">
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    </svg>
                  </button>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Italic">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m2 2h6m-8 14h6" />
                    </svg>
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Bullet list">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Numbered list">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h12M9 12h12M9 19h12M3 5l1 1-1 1m1 4l1 1-1 1m1 4l1 1-1 1" />
                    </svg>
                  </button>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Quote">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Code">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Image">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Undo">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Redo">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                    </svg>
                  </button>
                  <div className="flex-1"></div>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Fullscreen">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  <button type="button" className="toolbar-button p-1.5 rounded" title="Preview">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={tempScopeInfo}
                  onChange={(e) => setTempScopeInfo(e.target.value)}
                  className="w-full h-96 px-3 py-2 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent text-sm font-mono resize-none"
                  placeholder="Vul hier aanvullende scope informatie in..."
                />
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={saveScopeInfoModal}
                  className="w-full px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f' }}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
