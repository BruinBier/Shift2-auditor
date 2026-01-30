'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { marked } from 'marked';
import 'md-editor-rt/lib/style.css';

// Configure marked to preserve line breaks
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true,    // GitHub Flavored Markdown
});

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

interface ScopePage {
  id: string;
  url: string;
  title: string;
  crawlerType?: string;
  inScope: boolean;
  crawledAt?: Date | null;
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
  const [crawlingUrlId, setCrawlingUrlId] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Haal scope URLs op uit project data
  const scopePages: ScopePage[] = project.scopeUrls || [];
  const inScopePages = scopePages.filter(p => p.inScope);
  const outScopePages = scopePages.filter(p => !p.inScope);

  // Add title attribute to all links in HTML
  const addTitleToLinks = (html: string) => {
    if (!html) return html;
    return html.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attrs) => {
        // Only add title if it doesn't already exist
        if (!/title=/i.test(attrs)) {
          return `<a ${attrs} title="opent in nieuw venster">`;
        }
        return match;
      }
    );
  };

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

  const handleCrawlerInit = async (urlId: string) => {
    if (!confirm('Weet je zeker dat je de crawler voor deze URL wilt starten?')) {
      return;
    }

    setOpenMenuId(null);
    setCrawlingUrlId(urlId);

    try {
      const response = await fetch(`/api/projects/${project.id}/scope-urls/${urlId}/crawler`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Crawler succesvol uitgevoerd!\n\n` +
              `Tests uitgevoerd: ${data.testsRun}\n` +
              `Tests gevonden: ${data.testsFound}\n\n` +
              `Je kunt de resultaten bekijken op de detail pagina.`);
        router.refresh();
      } else {
        alert(`Er ging iets mis bij het starten van de crawler: ${data.error}`);
      }
    } catch (error) {
      console.error('Error initiating crawler:', error);
      alert('Er ging iets mis bij het starten van de crawler.');
    } finally {
      setCrawlingUrlId(null);
    }
  };

  const handleSiteDiscovery = async () => {
    if (inScopePages.length === 0) {
      alert('Voeg eerst minimaal één URL toe aan de scope.');
      return;
    }

    // Use the first in-scope URL as the starting point
    const startUrl = inScopePages[0];

    const confirmMessage = `Site Crawler starten vanaf:\n${startUrl.url}\n\n` +
                          `Dit zal:\n` +
                          `- Alle pagina's op de website ontdekken\n` +
                          `- Nieuwe pagina's toevoegen aan de scope\n` +
                          `- Optioneel alle gevonden pagina's direct crawlen\n\n` +
                          `Wil je de gevonden pagina's direct crawlen?\n` +
                          `(OK = Ja, crawl direct  |  Annuleren = Nee, alleen ontdekken)`;

    const shouldCrawl = confirm(confirmMessage);
    if (shouldCrawl === null) {
      return; // User cancelled
    }

    setIsDiscovering(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/scope-urls/${startUrl.id}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxDepth: 2,
          maxPages: 100,
          crawlPages: shouldCrawl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const summary = `Site discovery succesvol!\n\n` +
                       `Totaal gevonden: ${data.discovered.total} pagina's\n` +
                       `Interne pagina's: ${data.discovered.internal}\n` +
                       `Nieuwe pagina's toegevoegd: ${data.discovered.new}\n` +
                       `Bestaande pagina's: ${data.discovered.existing}\n` +
                       (shouldCrawl ? `\nGecrawlde pagina's: ${data.crawled}` : '');

        alert(summary);
        router.refresh();
      } else {
        alert(`Er ging iets mis bij site discovery: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during site discovery:', error);
      alert('Er ging iets mis bij het ontdekken van de site.');
    } finally {
      setIsDiscovering(false);
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
        button.scope-menu-button[class],
        a.scope-link-button,
        a.scope-link-button[class] {
          background-color: transparent !important;
        }
        button.scope-menu-button:hover,
        button.scope-menu-button[class]:hover,
        a.scope-link-button:hover,
        a.scope-link-button[class]:hover {
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
        .prose p {
          margin: 1rem 0;
        }
        .prose p:first-child {
          margin-top: 0;
        }
        .prose p:last-child {
          margin-bottom: 0;
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
      {/* Left column - Scope lists */}
      <div className="col-span-2 space-y-8">
        {/* Binnen scope sectie */}
        <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Binnen scope</h3>
            <div className="flex items-center gap-2">
              <a
                href={`/admin/projects/${project.id}/crawler-overview`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  border: '1px solid #6b2d8f',
                  color: '#6b2d8f',
                  backgroundColor: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Crawler Overzicht
              </a>
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
        </div>

        {/* Site Crawler Section */}
        {inScopePages.length > 0 && (
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-blue-900">Site Crawler</h4>
                </div>
                <p className="text-sm text-blue-800">
                  Ontdek automatisch alle pagina's op de website vanaf de eerste URL in scope.
                  De crawler zal alle interne links volgen en nieuwe pagina's toevoegen aan de scope.
                </p>
              </div>
              <button
                onClick={handleSiteDiscovery}
                disabled={isDiscovering}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                <svg className={`w-4 h-4 ${isDiscovering ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isDiscovering ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  )}
                </svg>
                {isDiscovering ? 'Bezig met ontdekken...' : 'Start Site Crawler'}
              </button>
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
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{page.url}</span>
                          {page.crawledAt && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Gecrawld
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{page.title}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 relative justify-end">
                        {/* Pijl naar rechts - link naar detail pagina */}
                        <a
                          href={`/admin/projects/${project.id}/scope/${page.id}`}
                          className="scope-link-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          title="Bekijk details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </a>

                        {/* 3-puntjes menu */}
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
                              onClick={() => handleCrawlerInit(page.id)}
                              disabled={crawlingUrlId === page.id}
                              className="scope-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              {crawlingUrlId === page.id ? 'Crawler draait...' : 'Crawler initialiseren'}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                  placeholder="Pagina titel"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {}}
                  className="px-4 py-2 bg-shift2-primary text-white rounded-lg hover:bg-shift2-primary/90"
                >
                  Toevoegen
                </button>
                <button
                  onClick={() => {}}
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
                        {/* 3-puntjes menu */}
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
          <div className="w-full min-h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
            {scopeInfo ? (
              <div
                className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                dangerouslySetInnerHTML={{ __html: addTitleToLinks(marked.parse(scopeInfo) as string) }}
              />
            ) : (
              <span className="text-gray-400">Vul hier aanvullende scope informatie in...</span>
            )}
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
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
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

            <div className="p-6 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving
                </label>
                <MdEditor
                  modelValue={tempScopeInfo}
                  onChange={setTempScopeInfo}
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
                  style={{ height: '400px' }}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={saveScopeInfoModal}
                className="modal-save-button w-full px-4 py-2 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
