'use client';

/**
 * Waarnemingen: noteren wat je ziet, zonder er meteen een bevinding van te maken.
 *
 * De onderzoeker is hier de spotter. Je schrijft in één zin wat je opviel; welk
 * succescriterium het raakt, of het een afkeuring of een opmerking is en hoe de
 * tekst moet luiden, is werk dat later gebeurt. Zie CONTEXT.md.
 *
 * Zolang de uitwerking nog niet is gebouwd, is dit een notitieblok dat niets
 * verliest — beter dan een losse gedachte die verdwijnt zodra je doorklikt.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  projectId: string;
  samples: { id: string; title: string }[];
  waarnemingen: any[];
  /** Vooraf gekozen pagina, als je vanuit een vraag op de stapel komt. */
  standaardSampleId?: string | null;
  opgeslagen?: () => void;
}

const STATUS_LABEL: Record<string, { tekst: string; klasse: string }> = {
  open: { tekst: 'Nog uit te werken', klasse: 'bg-amber-100 text-amber-800' },
  uitgewerkt: { tekst: 'Uitgewerkt', klasse: 'bg-green-100 text-green-800' },
  vervallen: { tekst: 'Vervallen', klasse: 'bg-gray-100 text-gray-500 line-through' },
};

export default function Waarnemingen({
  projectId,
  samples,
  waarnemingen,
  standaardSampleId,
  opgeslagen,
}: Props) {
  const router = useRouter();
  const [tekst, setTekst] = useState('');
  const [sampleId, setSampleId] = useState(standaardSampleId || '');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const bewaar = async () => {
    if (!tekst.trim()) return;
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/waarnemingen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tekst, sampleItemId: sampleId || null }),
      });
      if (!res.ok) {
        const f = await res.json().catch(() => ({}));
        throw new Error(f.error || 'Opslaan mislukt');
      }
      setTekst('');
      router.refresh();
      opgeslagen?.();
    } catch (e: any) {
      setFout(e.message);
    } finally {
      setBezig(false);
    }
  };

  const verwijder = async (id: string) => {
    setBezig(true);
    try {
      await fetch(`/api/projects/${projectId}/waarnemingen/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBezig(false);
    }
  };

  const open = waarnemingen.filter((w) => w.status === 'open');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <label className="mb-1 block text-sm font-medium text-gray-800">
          Wat viel je op?
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Eén of twee zinnen is genoeg. Het criterium, de ernst en de nette formulering komen
          later — dit is een notitie, nog geen bevinding.
        </p>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 p-2 text-sm"
          placeholder="Bijvoorbeeld: de filterknop op de zoekpagina lijkt niet met het toetsenbord te bedienen"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Geen pagina gekozen</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={bewaar}
            disabled={bezig || !tekst.trim()}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
          >
            Waarneming bewaren
          </button>
        </div>

        {fout && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>}
      </div>

      {waarnemingen.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-gray-600">
            <strong className="text-gray-900">{open.length}</strong> van {waarnemingen.length}{' '}
            {waarnemingen.length === 1 ? 'waarneming' : 'waarnemingen'} nog uit te werken
          </p>
          <ul className="space-y-2">
            {waarnemingen.map((w) => {
              const label = STATUS_LABEL[w.status] ?? STATUS_LABEL.open;
              return (
                <li key={w.id} className="rounded border border-gray-200 bg-white p-3 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-2 py-0.5 font-medium ${label.klasse}`}>
                      {label.tekst}
                    </span>
                    {w.sampleItem && (
                      <span className="text-gray-500">{w.sampleItem.title}</span>
                    )}
                    {w.finding?.findingCode && (
                      <span className="font-mono text-gray-700">
                        → {w.finding.findingCode}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {new Date(w.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-gray-800">{w.tekst}</p>
                  {w.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => verwijder(w.id)}
                      disabled={bezig}
                      className="mt-2 text-xs text-gray-400 underline hover:text-gray-600"
                    >
                      Verwijderen
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {open.length > 0 && (
        <p className="rounded border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Het uitwerken tot voorstellen is nog niet gebouwd. Deze notities blijven staan tot dat
          er is; ze raken niet kwijt.
        </p>
      )}
    </div>
  );
}
