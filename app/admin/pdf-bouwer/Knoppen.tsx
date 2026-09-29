'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NieuwDocumentKnop() {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);

  async function maak() {
    setBezig(true);
    const res = await fetch('/api/pdf-bouwer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ titel: 'Nieuw document' }),
    });
    if (res.ok) {
      const doc = await res.json();
      router.push(`/admin/pdf-bouwer/${doc.id}`);
    } else {
      setBezig(false);
      alert('Het document kon niet worden aangemaakt.');
    }
  }

  return (
    <button
      type="button"
      onClick={maak}
      disabled={bezig}
      className="shrink-0 bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-60"
    >
      + Nieuw document
    </button>
  );
}

export function VerwijderKnop({ id, titel }: { id: string; titel: string }) {
  const router = useRouter();

  async function verwijder() {
    if (!confirm(`"${titel}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    await fetch(`/api/pdf-bouwer/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={verwijder}
      className="text-sm text-red-700 hover:underline"
      aria-label={`${titel} verwijderen`}
    >
      Verwijderen
    </button>
  );
}
