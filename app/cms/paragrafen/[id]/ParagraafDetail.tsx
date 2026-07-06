'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';

type Screenshot = {
  id: string;
  path: string;
  caption: string | null;
  alt: string | null;
  order: number;
};

type Helptekst = {
  id: string;
  elementType: string;
  title: string;
  helpText: string;
  wcagCriteria: string | null;
  order: number;
  screenshots: Screenshot[];
};

type Paragraph = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  helpteksten: Helptekst[];
};

export default function ParagraafDetail({ paragraph }: { paragraph: Paragraph }) {
  const router = useRouter();
  const [editingMeta, setEditingMeta] = useState(false);
  const [name, setName] = useState(paragraph.name);
  const [description, setDescription] = useState(paragraph.description || '');
  const [order, setOrder] = useState(paragraph.order);

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingHelptextId, setEditingHelptextId] = useState<string | null>(null);

  async function saveMeta() {
    await fetch(`/api/cms/paragrafen/${paragraph.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, order }),
    });
    setEditingMeta(false);
    router.refresh();
  }

  async function deleteParagraph() {
    if (!confirm(`Weet je zeker dat je "${paragraph.name}" wilt verwijderen? Alle bijbehorende helpteksten gaan ook weg.`)) return;
    await fetch(`/api/cms/paragrafen/${paragraph.id}`, { method: 'DELETE' });
    router.push('/cms/paragrafen');
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {editingMeta ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-semibold border-b border-gray-300 focus:outline-none focus:border-shift2-primary"
          />
        ) : (
          <h1 className="text-2xl font-semibold text-gray-900">{paragraph.name}</h1>
        )}
        <div className="flex gap-2">
          {editingMeta ? (
            <>
              <button
                onClick={saveMeta}
                className="bg-shift2-primary text-white px-3 py-1.5 rounded text-sm hover:opacity-90"
              >
                Opslaan
              </button>
              <button
                onClick={() => {
                  setEditingMeta(false);
                  setName(paragraph.name);
                  setDescription(paragraph.description || '');
                  setOrder(paragraph.order);
                }}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
              >
                Annuleren
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditingMeta(true)}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
              >
                Bewerken
              </button>
              <button
                onClick={deleteParagraph}
                className="bg-red-50 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-100"
              >
                Verwijderen
              </button>
            </>
          )}
        </div>
      </div>

      {editingMeta ? (
        <div className="bg-white border border-gray-200 rounded p-4 mb-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Volgorde</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      ) : (
        paragraph.description && (
          <p className="text-sm text-gray-600 mb-6">{paragraph.description}</p>
        )
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Helpteksten</h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-shift2-primary text-white px-3 py-1.5 rounded text-sm hover:opacity-90"
        >
          + Nieuwe helptekst
        </button>
      </div>

      {showNewForm && (
        <HelptextForm
          paragraphId={paragraph.id}
          paragraphSlug={paragraph.slug}
          onClose={() => setShowNewForm(false)}
          onSaved={() => {
            setShowNewForm(false);
            router.refresh();
          }}
        />
      )}

      {paragraph.helpteksten.length === 0 && !showNewForm ? (
        <div className="bg-white border border-gray-200 rounded p-8 text-center text-sm text-gray-500">
          Nog geen helpteksten voor dit paragraaf-type.
        </div>
      ) : (
        <div className="space-y-3">
          {paragraph.helpteksten.map((h) => (
            <HelptextCard
              key={h.id}
              helptekst={h}
              paragraphId={paragraph.id}
              paragraphSlug={paragraph.slug}
              isEditing={editingHelptextId === h.id}
              onEdit={() => setEditingHelptextId(h.id)}
              onClose={() => setEditingHelptextId(null)}
              onSaved={() => {
                setEditingHelptextId(null);
                router.refresh();
              }}
              onDeleted={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HelptextCard({
  helptekst,
  paragraphId,
  paragraphSlug,
  isEditing,
  onEdit,
  onClose,
  onSaved,
  onDeleted,
}: {
  helptekst: Helptekst;
  paragraphId: string;
  paragraphSlug: string;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  async function deleteHelptext() {
    if (!confirm(`Helptekst "${helptekst.title}" verwijderen?`)) return;
    await fetch(`/api/cms/paragrafen/${paragraphId}/helpteksten/${helptekst.id}`, {
      method: 'DELETE',
    });
    onDeleted();
  }

  if (isEditing) {
    return (
      <HelptextForm
        paragraphId={paragraphId}
        paragraphSlug={paragraphSlug}
        existing={helptekst}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  const html = marked.parse(helptekst.helpText) as string;

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
            {helptekst.elementType}
          </div>
          <h3 className="text-base font-semibold text-gray-900">{helptekst.title}</h3>
          {helptekst.wcagCriteria && (
            <div className="text-xs text-gray-500 mt-0.5">WCAG: {helptekst.wcagCriteria}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Bewerken
          </button>
          <button
            onClick={deleteHelptext}
            className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
          >
            Verwijderen
          </button>
        </div>
      </div>
      <div
        className="prose prose-sm max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {helptekst.screenshots.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {helptekst.screenshots.map((s) => (
            <figure key={s.id} className="border border-gray-200 rounded overflow-hidden bg-gray-50">
              <a href={s.path} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.path}
                  alt={s.alt || s.caption || ''}
                  className="w-full h-auto block"
                />
              </a>
              {s.caption && (
                <figcaption className="text-xs text-gray-600 px-3 py-2 border-t border-gray-200 bg-white">
                  {s.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

function HelptextForm({
  paragraphId,
  paragraphSlug,
  existing,
  onClose,
  onSaved,
}: {
  paragraphId: string;
  paragraphSlug: string;
  existing?: Helptekst;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [elementType, setElementType] = useState(existing?.elementType || '');
  const [title, setTitle] = useState(existing?.title || '');
  const [helpText, setHelpText] = useState(existing?.helpText || '');
  const [wcagCriteria, setWcagCriteria] = useState(existing?.wcagCriteria || '');
  const [order, setOrder] = useState(existing?.order ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>(existing?.screenshots ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function saveMeta() {
    setSubmitting(true);
    setError(null);

    let helptextId = existing?.id;

    if (existing) {
      const res = await fetch(`/api/cms/paragrafen/${paragraphId}/helpteksten/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementType, title, helpText, wcagCriteria, order }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Opslaan mislukt');
        setSubmitting(false);
        return;
      }
    } else {
      const res = await fetch(`/api/cms/paragrafen/${paragraphId}/helpteksten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementType, title, helpText, wcagCriteria, order }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Aanmaken mislukt');
        setSubmitting(false);
        return;
      }
      const created = await res.json();
      helptextId = created.id;
    }

    if (!helptextId) {
      setError('Helptekst-id ontbreekt');
      setSubmitting(false);
      return;
    }

    onSaved();
  }

  async function uploadScreenshot(file: File) {
    if (!existing) {
      setUploadError('Sla de helptekst eerst op voor je screenshots toevoegt.');
      return;
    }
    setUploadError(null);
    setUploading(true);

    const slugForSubdir = `${paragraphSlug || 'paragraaf'}/${(existing.elementType || 'element')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'element'}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subdir', slugForSubdir);

    const uploadRes = await fetch('/api/cms/upload', { method: 'POST', body: formData });
    if (!uploadRes.ok) {
      const data = await uploadRes.json().catch(() => ({}));
      setUploadError(data.error || 'Upload mislukt');
      setUploading(false);
      return;
    }
    const { path: publicPath } = await uploadRes.json();

    const createRes = await fetch(
      `/api/cms/paragrafen/${paragraphId}/helpteksten/${existing.id}/screenshots`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: publicPath, order: screenshots.length }),
      }
    );
    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      setUploadError(data.error || 'Koppelen mislukt');
      setUploading(false);
      return;
    }
    const created: Screenshot = await createRes.json();
    setScreenshots([...screenshots, created]);
    setUploading(false);
  }

  async function updateScreenshot(s: Screenshot, patch: Partial<Screenshot>) {
    const res = await fetch(
      `/api/cms/paragrafen/${paragraphId}/helpteksten/${existing!.id}/screenshots/${s.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) return;
    const updated = await res.json();
    setScreenshots(screenshots.map((x) => (x.id === s.id ? updated : x)));
  }

  async function deleteScreenshot(s: Screenshot) {
    if (!confirm('Screenshot verwijderen?')) return;
    const res = await fetch(
      `/api/cms/paragrafen/${paragraphId}/helpteksten/${existing!.id}/screenshots/${s.id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return;
    setScreenshots(screenshots.filter((x) => x.id !== s.id));
  }

  return (
    <div className="bg-white border border-shift2-primary rounded p-4 space-y-3">
      <h3 className="text-base font-semibold text-gray-900">
        {existing ? 'Helptekst bewerken' : 'Nieuwe helptekst'}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Element-type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={elementType}
            onChange={(e) => setElementType(e.target.value)}
            placeholder="Bijv. Afbeelding, Video, Link"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">WCAG-criteria</label>
          <input
            type="text"
            value={wcagCriteria}
            onChange={(e) => setWcagCriteria(e.target.value)}
            placeholder="Bijv. 1.1.1, 1.3.1"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. Afbeelding binnen Tekst-paragraaf"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Helptekst (markdown) <span className="text-red-500">*</span>
        </label>
        <textarea
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          rows={14}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Volgorde</label>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {existing && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-800">Screenshots</label>
            <label className="cursor-pointer bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200">
              {uploading ? 'Uploaden...' : '+ Upload screenshot'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadScreenshot(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-2 py-1 rounded text-xs mb-2">
              {uploadError}
            </div>
          )}
          {screenshots.length === 0 ? (
            <p className="text-xs text-gray-500">Nog geen screenshots gekoppeld.</p>
          ) : (
            <div className="space-y-2">
              {screenshots.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded p-2 flex gap-3 items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.path} alt={s.alt || ''} className="w-32 h-auto border border-gray-200 rounded" />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      defaultValue={s.caption || ''}
                      placeholder="Bijschrift"
                      onBlur={(e) => {
                        if (e.target.value !== (s.caption || '')) {
                          updateScreenshot(s, { caption: e.target.value });
                        }
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      defaultValue={s.alt || ''}
                      placeholder="Alt-tekst (voor toegankelijkheid)"
                      onBlur={(e) => {
                        if (e.target.value !== (s.alt || '')) {
                          updateScreenshot(s, { alt: e.target.value });
                        }
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-mono truncate">{s.path}</span>
                      <button
                        onClick={() => deleteScreenshot(s)}
                        className="ml-auto bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!existing && (
        <p className="text-xs text-gray-500 italic">
          Sla de helptekst eerst op om screenshots te kunnen koppelen.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={saveMeta}
          disabled={submitting}
          className="bg-shift2-primary text-white px-3 py-1.5 rounded text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Bezig...' : 'Opslaan'}
        </button>
        <button
          onClick={onClose}
          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
        >
          {existing ? 'Sluiten' : 'Annuleren'}
        </button>
      </div>
    </div>
  );
}
