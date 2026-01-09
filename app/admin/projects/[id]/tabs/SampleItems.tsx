'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

export default function SampleItems({ project }: { project: any }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<'structured' | 'random' | 'pdf'>('structured');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    sampleType: 'structured' as 'structured' | 'random' | 'pdf',
  });
  const [sampleInfo, setSampleInfo] = useState(project.sampleInfo || '');
  const [showSampleInfoModal, setShowSampleInfoModal] = useState(false);
  const [tempSampleInfo, setTempSampleInfo] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Debug: log all sample items to see their sampleType values
  useEffect(() => {
    console.log('All sample items:', project.sampleItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      sampleType: item.sampleType,
      sampleTypeType: typeof item.sampleType
    })));
  }, [project.sampleItems]);

  const items = project.sampleItems.filter((item: any) => item.sampleType === activeType);

  // Close context menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId &&
          !target.closest('.sample-context-menu') &&
          !target.closest('.sample-menu-button')) {
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

  // Add title attribute to all links in HTML
  const addTitleToLinks = (html: string) => {
    if (!html) return html;
    return html.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attrs) => {
        if (!/title=/i.test(attrs)) {
          return `<a ${attrs} title="opent in nieuw venster">`;
        }
        return match;
      }
    );
  };

  const openItemModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        title: item.title,
        url: item.url || '',
        description: item.description || '',
        sampleType: item.sampleType || activeType
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        sampleType: activeType
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', url: '', description: '', sampleType: activeType });
  };

  const handleSubmit = async (e: React.FormEvent, andNew: boolean = false) => {
    e.preventDefault();

    if (editingId) {
      // Update existing item
      const response = await fetch(`/api/sample-items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newType = formData.sampleType;
        closeModal();
        router.refresh();

        // Switch to the new tab after a short delay to allow refresh to complete
        if (newType !== activeType) {
          setTimeout(() => {
            setActiveType(newType);
          }, 100);
        }
      } else {
        alert('Fout bij bijwerken van item');
      }
    } else {
      // Create new item
      const response = await fetch(`/api/projects/${project.id}/sample-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sampleType: formData.sampleType,
          orderIndex: items.length + 1,
        }),
      });

      if (response.ok) {
        const newType = formData.sampleType;

        if (andNew) {
          // Reset form but keep modal open
          setFormData({
            title: '',
            url: '',
            description: '',
            sampleType: formData.sampleType
          });
        } else {
          closeModal();
        }
        router.refresh();

        // Switch to the new tab after a short delay to allow refresh to complete
        if (newType !== activeType) {
          setTimeout(() => {
            setActiveType(newType);
          }, 100);
        }
      } else {
        alert('Fout bij toevoegen van item');
      }
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    const response = await fetch(`/api/sample-items/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setOpenMenuId(null);
      router.refresh();
    } else {
      alert('Fout bij verwijderen van item');
    }
  };

  const openSampleInfoModal = () => {
    setTempSampleInfo(sampleInfo);
    setShowSampleInfoModal(true);
  };

  const closeSampleInfoModal = () => {
    setShowSampleInfoModal(false);
    setTempSampleInfo('');
  };

  const saveSampleInfoModal = async () => {
    setSampleInfo(tempSampleInfo);
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleInfo: tempSampleInfo }),
    });
    router.refresh();
    closeSampleInfoModal();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        button.sample-add-button,
        button.sample-add-button[class] {
          background-color: white !important;
        }
        button.sample-add-button:hover,
        button.sample-add-button[class]:hover {
          background-color: #F9FAFB !important;
        }
        button.sample-menu-button,
        button.sample-menu-button[class] {
          background-color: transparent !important;
        }
        button.sample-menu-button:hover,
        button.sample-menu-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        .sample-context-menu,
        div.sample-context-menu[class] {
          background-color: white !important;
        }
        button.sample-menu-item,
        button.sample-menu-item[class] {
          background-color: transparent !important;
        }
        button.sample-menu-item:hover,
        button.sample-menu-item[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-menu-item-delete,
        button.sample-menu-item-delete[class] {
          background-color: transparent !important;
        }
        button.sample-menu-item-delete:hover,
        button.sample-menu-item-delete[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-modal-close,
        button.sample-modal-close[class] {
          background-color: transparent !important;
        }
        button.sample-modal-close:hover,
        button.sample-modal-close[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-info-button,
        button.sample-info-button[class] {
          background-color: transparent !important;
        }
        button.sample-info-button:hover,
        button.sample-info-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-tab-button.active,
        button.sample-tab-button.active[class] {
          background-color: transparent !important;
        }
        button.sample-tab-button,
        button.sample-tab-button[class] {
          background-color: transparent !important;
        }
        .prose ul,
        .prose ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .prose ul {
          list-style-type: disc;
        }
        .prose ol {
          list-style-type: decimal;
        }
        .prose li {
          margin: 0.25rem 0;
        }
        .prose li p {
          margin: 0;
        }
        .prose a,
        .prose a.external-link {
          color: #6b2d8f !important;
          text-decoration: underline !important;
          transition: opacity 0.2s ease;
        }
        .prose a:hover,
        .prose a.external-link:hover {
          opacity: 0.7;
        }
        .prose a::after,
        .prose a.external-link::after {
          content: '';
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-left: 4px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b2d8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'%3E%3C/path%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cline x1='10' y1='14' x2='21' y2='3'%3E%3C/line%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-size: contain;
          vertical-align: middle;
        }
      `}} />

      <div className="grid grid-cols-3 gap-6">
        {/* Left column - Sample items list */}
        <div className="col-span-2 space-y-8">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Steekproef</h3>
              </div>

              {/* Type tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveType('structured')}
                  className={`sample-tab-button px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeType === 'structured'
                      ? 'active text-white'
                      : 'text-gray-700'
                  }`}
                  style={activeType === 'structured' ? { backgroundColor: '#6b2d8f' } : {}}
                >
                  Gestructureerd ({project.sampleItems.filter((i: any) => i.sampleType === 'structured').length})
                </button>
                <button
                  onClick={() => setActiveType('random')}
                  className={`sample-tab-button px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeType === 'random'
                      ? 'active text-white'
                      : 'text-gray-700'
                  }`}
                  style={activeType === 'random' ? { backgroundColor: '#6b2d8f' } : {}}
                >
                  Willekeurig ({project.sampleItems.filter((i: any) => i.sampleType === 'random').length})
                </button>
                <button
                  onClick={() => setActiveType('pdf')}
                  className={`sample-tab-button px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeType === 'pdf'
                      ? 'active text-white'
                      : 'text-gray-700'
                  }`}
                  style={activeType === 'pdf' ? { backgroundColor: '#6b2d8f' } : {}}
                >
                  PDF ({project.sampleItems.filter((i: any) => i.sampleType === 'pdf').length})
                </button>
                <button
                  onClick={() => openItemModal()}
                  className="sample-add-button ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    border: '1px solid #79e792',
                    color: '#1f0036'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.0" />
                  </svg>
                  Nieuwe pagina
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Nog geen {activeType === 'structured' ? 'gestructureerde' : activeType === 'random' ? 'willekeurige' : 'PDF'} steekproefitems toegevoegd.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="pb-3 px-6 text-left text-xs font-medium text-gray-500 uppercase">Pagina</th>
                    <th className="pb-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{item.title}</div>
                          {item.url && (
                            <div className="text-sm text-gray-500">{item.url}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 relative justify-end">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="sample-menu-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {openMenuId === item.id && (
                            <div className="sample-context-menu absolute right-0 top-8 z-10 w-56 rounded-lg shadow-lg border border-gray-200 py-1">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openItemModal(item);
                                }}
                                className="sample-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Bewerken
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDelete(item.id);
                                }}
                                className="sample-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3"
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

        {/* Right sidebar - Sample info */}
        <div className="space-y-6">
          {/* Stap 2 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Stap 2. Steekproef</h3>
            <p className="text-sm text-gray-600">
              Selecteer pagina's voor het onderzoek. Zorg dat de selectie representatief is voor de te onderzoeken website of app.
            </p>
          </div>

          {/* Overige steekproef informatie */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overige steekproef informatie</h3>
              <div className="flex gap-2">
                <button
                  onClick={openSampleInfoModal}
                  className="sample-info-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-full min-h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
              {sampleInfo ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: addTitleToLinks(sampleInfo) }}
                />
              ) : (
                <span className="text-gray-400">Vul hier aanvullende steekproef informatie in...</span>
              )}
            </div>
          </div>

          {/* Statistieken */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Statistieken</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gestructureerde steekproef</span>
                <span className="font-medium">{project.sampleItems.filter((i: any) => i.sampleType === 'structured').length} pagina's</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Willekeurige steekproef</span>
                <span className="font-medium">{project.sampleItems.filter((i: any) => i.sampleType === 'random').length} pagina's</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PDF steekproef</span>
                <span className="font-medium">{project.sampleItems.filter((i: any) => i.sampleType === 'pdf').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Steekproef bewerken</h3>
              <button
                onClick={closeModal}
                className="sample-modal-close text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="p-6 flex-1 overflow-auto">
                <div className="space-y-4">
                  {/* Locatie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Locatie
                    </label>
                    <input
                      type="url"
                      required={formData.sampleType !== 'pdf'}
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                      placeholder="https://mijn.hhnk.nl/authenticate"
                    />
                  </div>

                  {/* Titel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                        placeholder="Pre-loginpagina"
                      />
                      <button
                        type="button"
                        className="sample-info-button px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Titel ophalen
                      </button>
                    </div>
                  </div>

                  {/* Beschrijving */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving
                    </label>
                    <RichTextEditor
                      content={formData.description}
                      onChange={(content) => setFormData({ ...formData, description: content })}
                    />
                    <p className="mt-1 text-xs text-gray-500">Bijvoorbeeld beschrijving van proces of andere details van de pagina.</p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.sampleType}
                      onChange={(e) => setFormData({ ...formData, sampleType: e.target.value as 'structured' | 'random' | 'pdf' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                    >
                      <option value="structured">Gestructureerde steekproef</option>
                      <option value="random">Willekeurige steekproef</option>
                      <option value="pdf">PDF steekproef</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#6b2d8f' }}
                  >
                    Opslaan
                  </button>
                  {!editingId && (
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e as any, true)}
                      className="sample-add-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                      style={{
                        border: '1px solid #79e792',
                        color: '#1f0036'
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Opslaan en nieuw
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sample Info Modal */}
      {showSampleInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Overige steekproef informatie</h3>
              <button
                onClick={closeSampleInfoModal}
                className="sample-modal-close text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
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
                <RichTextEditor
                  content={tempSampleInfo}
                  onChange={setTempSampleInfo}
                />
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={saveSampleInfoModal}
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
    </>
  );
}
