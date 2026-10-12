'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TECHNICAL_ISSUE_STATUSSEN, statusKleur } from '@/lib/technical-issue-status';

/**
 * Status wijzigen en verwijderen, rechtstreeks in de lijst.
 *
 * Kon eerst alleen via de detailpagina (het bewerkformulier), dus voor elk issue dat je
 * wilde afsluiten een pagina heen en terug.
 */
export function IssueStatus({
  id,
  status,
  titel,
  aantalGekoppeld = 0,
}: {
  id: string;
  status: string;
  titel: string;
  aantalGekoppeld?: number;
}) {
  const router = useRouter();
  const [waarde, setWaarde] = useState(status);
  const [bezig, setBezig] = useState(false);

  const wijzig = async (nieuw: string) => {
    const oud = waarde;
    // Gekoppelde issues gaan alleen mee als je daar ja op zegt.
    const label = TECHNICAL_ISSUE_STATUSSEN.find((s) => s.waarde === nieuw)?.label ?? nieuw;
    const ookGekoppeld =
      aantalGekoppeld > 0 &&
      confirm(
        `Ook ${aantalGekoppeld === 1 ? 'het gekoppelde issue' : `de ${aantalGekoppeld} gekoppelde issues`} op "${label}" zetten?

OK: ja, ook ${aantalGekoppeld === 1 ? 'dat issue' : 'die issues'}. Annuleren: alleen dit issue.`
      );
    setWaarde(nieuw);
    setBezig(true);
    try {
      const res = await fetch(`/api/technical-issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ status: nieuw, ookGekoppeld }),
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
      className={`rounded border px-2 py-0.5 text-xs font-medium ${statusKleur(waarde)}`}
    >
      {TECHNICAL_ISSUE_STATUSSEN.map((s) => (
        <option key={s.waarde} value={s.waarde}>
          {s.label}
        </option>
      ))}
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
