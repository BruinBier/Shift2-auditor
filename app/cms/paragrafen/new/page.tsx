'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

export default function NewParagraafPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/cms/paragrafen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, order }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Aanmaken mislukt');
      setSubmitting(false);
      return;
    }

    const created = await res.json();
    router.push(`/cms/paragrafen/${created.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-8 py-8">
        <div className="text-xs text-gray-500 mb-1">
          <Link href="/cms" className="hover:underline">
            CMS
          </Link>{' '}
          /{' '}
          <Link href="/cms/paragrafen" className="hover:underline">
            Paragrafen
          </Link>{' '}
          / Nieuw
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nieuw paragraaf-type</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naam <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Tekst, Accordeon, Video"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volgorde</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Bezig...' : 'Aanmaken'}
            </button>
            <Link
              href="/cms/paragrafen"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Annuleren
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
