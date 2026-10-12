'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Status wijzigen en verwijderen, rechtstreeks in de lijst.
 *
 * Kon eerst alleen via de detailpagina (het bewerkformulier), dus voor elk issue dat je
 * wilde afsluiten een pagina heen en terug.
 */
export function IssueStatus({ id, status, titel }: { id: string; status: string; titel: string }) {
  const router = useRouter();
  const [waarde, setWaarde] = useState(status);
  const [bezig, setBezig] = useState(false);

  const wijzig = async (nieuw: string) => {
    const oud = waarde;
    setWaarde(nieuw);
    setBezig(true);
    try {
      const res = await fetch(`/api/technical-issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ status: nieuw }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setWaarde(oud);
      alert('De status kon niet worden opgeslagen.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <select
      aria-label={`Status van ${titel}`}
      value={waarde}
      disabled={bezig}
      onChange={(e) => wijzig(e.target.value)}
      className={`rounded border px-2 py-0.5 text-xs font-medium ${
        waarde === 'open'
          ? 'border-yellow-300 bg-yellow-100 text-yellow-900'
          : 'border-green-300 bg-green-100 text-green-900'
      }`}
    >
      <option value="open">Open</option>
      <option value="resolved">Opgelost</option>
    </select>
  );
}

export function IssueVerwijderen({ id, titel }: { id: string; titel: string }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);

  const verwijder = async () => {
    if (!confirm(`"${titel}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    setBezig(true);
    try {
      const res = await fetch(`/api/technical-issues/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('Het issue kon niet worden verwijderd.');
      setBezig(false);
    }
  };

  return (
    <button
      type="button"
      onClick={verwijder}
      disabled={bezig}
      aria-label={`${titel} verwijderen`}
      className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 hover:underline disabled:opacity-50"
    >
      Verwijderen
    </button>
  );
}
