'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SampleItems({ project }: { project: any }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<'structured' | 'random' | 'pdf'>('structured');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    sampleType: 'structured' as 'structured' | 'random' | 'pdf',
  });

  const items = project.sampleItems.filter((item: any) => item.sampleType === activeType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(`/api/projects/${project.id}/sample-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        sampleType: activeType,
        orderIndex: items.length + 1,
      }),
    });

    if (response.ok) {
      setFormData({ title: '', url: '', sampleType: activeType });
      setShowForm(false);
      router.refresh();
    } else {
      alert('Fout bij toevoegen van steekproefitem');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    const response = await fetch(`/api/sample-items/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.refresh();
    } else {
      alert('Fout bij verwijderen van item');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Steekproef beheren</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annuleren' : '+ Item toevoegen'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nieuw steekproefitem</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Bijv. Homepage"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL {activeType !== 'pdf' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={activeType !== 'pdf'}
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.hhnk.nl/"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Toevoegen
            </button>
          </form>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveType('structured')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeType === 'structured'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Gestructureerd ({project.sampleItems.filter((i: any) => i.sampleType === 'structured').length})
        </button>
        <button
          onClick={() => setActiveType('random')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeType === 'random'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Willekeurig ({project.sampleItems.filter((i: any) => i.sampleType === 'random').length})
        </button>
        <button
          onClick={() => setActiveType('pdf')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeType === 'pdf'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          PDF ({project.sampleItems.filter((i: any) => i.sampleType === 'pdf').length})
        </button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nog geen {activeType} steekproefitems toegevoegd.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
