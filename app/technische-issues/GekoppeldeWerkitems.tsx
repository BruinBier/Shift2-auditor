'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TECHNICAL_ISSUE_STATUSSEN, statusKleur } from '@/lib/technical-issue-status';
import { tiCode } from '@/lib/technical-issue-code';

interface Item {
  id: string;
  nummer: number;
  title: string;
  status: string;
  supplier: string | null;
}

const label = (status: string) => TECHNICAL_ISSUE_STATUSSEN.find((s) => s.waarde === status)?.label ?? status;

/**
 * "Gekoppelde werkitems": andere technische issues die bij dit issue horen.
 *
 * Koppelen en ontkoppelen wordt meteen opgeslagen, los van de knop Opslaan van het
 * formulier. Een koppeling geldt twee kanten op (zie de route).
 */
export default function GekoppeldeWerkitems({ id }: { id: string }) {
  const [gekoppeld, setGekoppeld] = useState<Item[]>([]);
  const [alle, setAlle] = useState<Item[]>([]);
  const [zoek, setZoek] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/technical-issues/${id}/koppelingen`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setGekoppeld(d))
      .catch(() => setFout('Gekoppelde werkitems konden niet worden geladen.'));
    fetch('/api/technical-issues')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setAlle(d))
      .catch(() => {});
  }, [id]);

  const kandidaten = useMemo(() => {
    const term = zoek.trim().toLowerCase();
    if (!term) return [];
    const al = new Set(gekoppeld.map((g) => g.id));
    return alle
      .filter((i) => i.id !== id && !al.has(i.id))
      .filter((i) => `${tiCode(i.nummer)} ${i.nummer} ${i.title} ${i.supplier ?? ''}`.toLowerCase().includes(term))
      .slice(0, 8);
  }, [zoek, alle, gekoppeld, id]);

  const wijzig = async (methode: 'POST' | 'DELETE', anderId: string) => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(
        methode === 'POST'
          ? `/api/technical-issues/${id}/koppelingen`
          : `/api/technical-issues/${id}/koppelingen?ander=${encodeURIComponent(anderId)}`,
        {
          method: methode,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: methode === 'POST' ? JSON.stringify({ anderId }) : undefined,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Opslaan mislukt');
      setGekoppeld(data);
      if (methode === 'POST') setZoek('');
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div>
      <p id="werkitems-kop" className="block text-sm font-medium text-gray-700 mb-1">
        Gekoppelde werkitems
      </p>

      {gekoppeld.length > 0 ? (
        <ul aria-labelledby="werkitems-kop" className="mb-2 space-y-1">
          {gekoppeld.map((g) => (
            <li key={g.id} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 shrink-0 rounded border px-1.5 text-xs ${statusKleur(g.status)}`}>
                {label(g.status)}
              </span>
              <Link href={`/technische-issues/${g.id}`} className="flex-1 text-shift2-primary hover:underline">
                <span className="font-mono font-medium">{tiCode(g.nummer)}</span> {g.title}
              </Link>
              <button
                type="button"
                onClick={() => wijzig('DELETE', g.id)}
                disabled={bezig}
                aria-label={`Koppeling met ${g.title} weghalen`}
                className="shrink-0 rounded px-1 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-sm text-gray-500">Nog geen gekoppelde werkitems.</p>
      )}

      <label htmlFor="werkitem-zoek" className="sr-only">
        Issue zoeken om te koppelen
      </label>
      <input
        id="werkitem-zoek"
        type="search"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        placeholder="Zoek op nummer, titel of leverancier…"
        autoComplete="off"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
      {kandidaten.length > 0 && (
        <ul className="mt-1 max-h-60 overflow-auto rounded border border-gray-200 bg-white shadow-sm">
          {kandidaten.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => wijzig('POST', k.id)}
                disabled={bezig}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="font-mono text-gray-500">{tiCode(k.nummer)}</span> {k.title}
                {k.supplier && <span className="text-gray-500"> · {k.supplier}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {zoek.trim() && kandidaten.length === 0 && (
        <p className="mt-1 text-xs text-gray-500">Geen issue gevonden.</p>
      )}

      {fout && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {fout}
        </p>
      )}
    </div>
  );
}
