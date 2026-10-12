'use client';

import { useState } from 'react';

/**
 * Knop "Vertaal naar Engels" met de Engelse titel en beschrijving eronder.
 *
 * Vertaalt wat er opgeslagen is, niet wat er in het formulier staat: de route leest het
 * issue uit de database. Daarom staat de knop uit zolang er niet-opgeslagen wijzigingen
 * in titel of beschrijving zijn. De vertaling wordt bewaard bij het issue.
 */
export default function EngelseVersie({
  id,
  titleEn,
  descriptionEn,
  vertaaldOp,
  nietOpgeslagen,
  urlEn,
  onUrlEn,
}: {
  id: string;
  titleEn: string | null;
  descriptionEn: string | null;
  vertaaldOp: string | null;
  nietOpgeslagen: boolean;
  /** Hoort bij het formulier en wordt met Opslaan bewaard, niet met de vertaalknop. */
  urlEn: string;
  onUrlEn: (waarde: string) => void;
}) {
  const [titel, setTitel] = useState(titleEn);
  const [beschrijving, setBeschrijving] = useState(descriptionEn);
  const [op, setOp] = useState(vertaaldOp);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const vertaalNu = async () => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(`/api/technical-issues/${id}/vertaal`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vertalen mislukt');
      setTitel(data.titleEn);
      setBeschrijving(data.descriptionEn);
      setOp(data.vertaaldOp);
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'Vertalen mislukt');
    } finally {
      setBezig(false);
    }
  };

  const heeftVertaling = !!(titel || beschrijving);

  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={vertaalNu}
          disabled={bezig || nietOpgeslagen}
          className="rounded-md border border-shift2-primary px-3 py-1.5 text-sm font-medium text-shift2-primary hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bezig ? 'Bezig met vertalen…' : heeftVertaling ? 'Opnieuw vertalen naar Engels' : 'Vertaal naar Engels'}
        </button>
        {nietOpgeslagen && (
          <span className="text-xs text-gray-600">Sla eerst op; de knop vertaalt de opgeslagen tekst.</span>
        )}
        {op && !nietOpgeslagen && (
          <span className="text-xs text-gray-600">
            Vertaald op {new Date(op).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        )}
      </div>

      {fout && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {fout}
        </p>
      )}

      {heeftVertaling && (
        <div lang="en" className="mt-3 space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Title (English)</p>
            <p className="rounded border border-gray-200 bg-white px-3 py-2 text-sm">{titel}</p>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Description (English)</p>
            <p className="whitespace-pre-wrap rounded border border-gray-200 bg-white px-3 py-2 font-mono text-sm">
              {beschrijving}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3">
        <label htmlFor="issue-url-en" className="mb-1 block text-sm font-medium text-gray-700">
          URL (English)
        </label>
        <input
          id="issue-url-en"
          type="url"
          value={urlEn}
          onChange={(e) => onUrlEn(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary"
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
