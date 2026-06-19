'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Criterion {
  id: string;
  code: string;
  titleNl: string;
  level: string;
}

export interface TechnicalIssueFormValues {
  id?: string;
  title: string;
  description: string;
  request: string | null;
  wcagCriterionId: string | null;
  impact: string | null;
  supplier: string | null;
  status: 'open' | 'resolved';
  githubIssueUrl: string | null;
}

interface Props {
  initial?: TechnicalIssueFormValues;
  criteria: Criterion[];
  mode: 'create' | 'edit';
}

const IMPACTS = ['klein', 'matig', 'serieus', 'kritiek', 'onbekend'];

export default function TechnicalIssueForm({ initial, criteria, mode }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [request, setRequest] = useState(initial?.request || '');
  const [wcagCriterionId, setWcagCriterionId] = useState(initial?.wcagCriterionId || '');
  const [impact, setImpact] = useState(initial?.impact || '');
  const [supplier, setSupplier] = useState(initial?.supplier || '');
  const [status, setStatus] = useState<'open' | 'resolved'>(initial?.status || 'open');
  const [githubIssueUrl, setGithubIssueUrl] = useState(initial?.githubIssueUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      request: request.trim() || null,
      wcagCriterionId: wcagCriterionId || null,
      impact: impact || null,
      supplier: supplier.trim() || null,
      status,
      githubIssueUrl: githubIssueUrl.trim() || null,
    };

    if (!payload.title || !payload.description) {
      setError('Titel en beschrijving zijn verplicht.');
      setSaving(false);
      return;
    }

    try {
      const url = mode === 'create' ? '/api/technical-issues' : `/api/technical-issues/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const saved = await res.json();
      router.push(`/technische-issues/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial?.id) return;
    if (!confirm('Weet je zeker dat je dit issue wilt verwijderen?')) return;
    const res = await fetch(`/api/technical-issues/${initial.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/technische-issues');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary"
          placeholder="bv. SIMsite: interactieve kaart zonder naam/rol"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Beschrijving van het probleem <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary font-mono"
          placeholder="Markdown ondersteund. Beschrijf het probleem en de impact voor gebruikers. Voorbeeld-URLs ook hier opnemen."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verzoek <span className="text-gray-400 font-normal">(optioneel)</span>
        </label>
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary font-mono"
          placeholder="Wat is het verzoek aan het ontwikkelteam / de leverancier? Markdown ondersteund."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leverancier</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="bv. SIMsite"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WCAG-criterium</label>
          <select
            value={wcagCriterionId}
            onChange={(e) => setWcagCriterionId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">— geen —</option>
            {criteria.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} ({c.level}) — {c.titleNl}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">— geen —</option>
            {IMPACTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'open' | 'resolved')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="resolved">Opgelost</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub-issue URL</label>
          <input
            type="url"
            value={githubIssueUrl}
            onChange={(e) => setGithubIssueUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Verwijderen
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/technische-issues"
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-shift2-primary text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Bezig...' : mode === 'create' ? 'Aanmaken' : 'Opslaan'}
          </button>
        </div>
      </div>
    </form>
  );
}
