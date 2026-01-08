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
  const [showInScopeForm, setShowInScopeForm] = useState(false);
  const [showOutScopeForm, setShowOutScopeForm] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    crawlerType: 'Productieomgeving',
  });

  // Haal scope URLs op uit project data
  const scopePages: ScopePage[] = project.scopeUrls || [];
  const inScopePages = scopePages.filter(p => p.inScope);
  const outScopePages = scopePages.filter(p => !p.inScope);

  const handleSubmit = async (inScope: boolean) => {
    // API call om pagina toe te voegen
    const response = await fetch(`/api/projects/${project.id}/scope-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        inScope,
      }),
    });

    if (response.ok) {
      setFormData({ url: '', title: '', crawlerType: 'Productieomgeving' });
      setShowInScopeForm(false);
      setShowOutScopeForm(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Binnen scope sectie */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Binnen scope</h3>
            <button
              onClick={() => setShowInScopeForm(!showInScopeForm)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              URL toevoegen
            </button>
          </div>
        </div>

        {showInScopeForm && (
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
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Crawler</th>
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
                    <td className="py-4 text-sm text-gray-600">{page.crawlerType}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
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
              onClick={() => setShowOutScopeForm(!showOutScopeForm)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              URL toevoegen
            </button>
          </div>
        </div>

        {showOutScopeForm && (
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
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Crawler</th>
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
                    <td className="py-4 text-sm text-gray-600">{page.crawlerType}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
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
  );
}
