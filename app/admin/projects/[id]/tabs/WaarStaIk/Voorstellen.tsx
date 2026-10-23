'use client';

/**
 * Elk voorstel één keer, met al zijn pagina's eronder.
 *
 * De matrix en de stapel tonen een voorstel op elke pagina waar het voorkomt. Bij een
 * steekproef van tien pagina's is dat precies goed: je werkt per pagina. Bij een
 * pagecheck op alle pagina's (Valkenswaard, oktober 2026: 51 voorstellen op 430 pagina's)
 * stond V001 er 87 keer, telde de kop "614 voorstellen" en was de matrix 430 kolommen
 * breed. Hier beoordeel je het voorstel zelf: één akkoord geldt voor alle pagina's.
 *
 * Akkoord en afwijzen lopen via dezelfde route als op de kaart
 * (`/findings/[id]/beoordeling`), zie docs/adr/0001-akkoord-als-poort.md.
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { vindplaatsToelichting } from '@/lib/vindplaatsen';

const EERSTE_PAGINAS = 8;

function vergelijkCode(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export default function Voorstellen({ project }: { project: any }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('');
  // Wat net is afgehandeld verdwijnt meteen, ook voordat de pagina opnieuw geladen is.
  const [afgehandeld, setAfgehandeld] = useState<Set<string>>(new Set());

  const voorstellen = useMemo(
    () =>
      (project.findings ?? [])
        .filter((f: any) => f.status === 'voorstel' && !afgehandeld.has(f.id))
        .sort(
          (a: any, b: any) =>
            vergelijkCode(a.wcagCriterion?.code ?? '', b.wcagCriterion?.code ?? '') ||
            (b.occurrences?.length ?? 0) - (a.occurrences?.length ?? 0)
        ),
    [project.findings, afgehandeld]
  );
  const criteria = useMemo<string[]>(
    () => Array.from(new Set<string>(voorstellen.map((f: any) => f.wcagCriterion?.code as string))).filter(Boolean),
    [voorstellen]
  );
  const zichtbaar = filter ? voorstellen.filter((f: any) => f.wcagCriterion?.code === filter) : voorstellen;

  if (voorstellen.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
        Er wachten geen voorstellen op akkoord.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor="voorstel-filter" className="text-gray-700">
          Criterium
        </label>
        <select
          id="voorstel-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1"
        >
          <option value="">Alle ({voorstellen.length})</option>
          {criteria.map((c) => (
            <option key={c} value={c}>
              {c} ({voorstellen.filter((f: any) => f.wcagCriterion?.code === c).length})
            </option>
          ))}
        </select>
      </div>
      <ul className="space-y-4">
        {zichtbaar.map((f: any) => (
          <li key={f.id}>
            <VoorstelKaart
              projectId={project.id}
              finding={f}
              klaar={() => {
                setAfgehandeld((s) => new Set(s).add(f.id));
                router.refresh();
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoorstelKaart({
  projectId,
  finding: f,
  klaar,
}: {
  projectId: string;
  finding: any;
  klaar: () => void;
}) {
  const [allePaginas, setAllePaginas] = useState(false);
  const [afwijzen, setAfwijzen] = useState(false);
  const [reden, setReden] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const occs: any[] = f.occurrences ?? [];
  const getoond = allePaginas ? occs : occs.slice(0, EERSTE_PAGINAS);
  const isOpmerking = f.type === 'opmerking' || f.impact == null;

  const beoordeel = async (actie: 'akkoord' | 'afwijzen') => {
    if (actie === 'afwijzen' && !reden.trim()) {
      setFout('Schrijf op waarom je dit voorstel afwijst. Zo stelt een volgende ronde het niet opnieuw voor.');
      return;
    }
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/findings/${f.id}/beoordeling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ actie, reden: actie === 'afwijzen' ? reden.trim() : undefined }),
      });
      if (!res.ok) {
        const u = await res.json().catch(() => ({}));
        throw new Error(u.error || 'Beoordelen mislukt');
      }
      klaar();
    } catch (e: any) {
      setFout(e.message);
      setBezig(false);
    }
  };

  return (
    <article className="rounded border border-gray-200 bg-white" aria-labelledby={`voorstel-${f.id}`}>
      <header className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        <h3 id={`voorstel-${f.id}`} className="text-base font-semibold text-gray-900">
          {f.findingCode} · {f.wcagCriterion?.code} {f.wcagCriterion?.titleNl}
        </h3>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {isOpmerking ? 'Opmerking' : 'Afkeuring'}
        </span>
        {!isOpmerking && f.impact && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Impact: {f.impact}</span>
        )}
        {!isOpmerking && f.responsibility && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{f.responsibility}</span>
        )}
        <span className="ml-auto text-sm text-gray-600">
          {occs.length} pagina{occs.length === 1 ? '' : "'s"}
        </span>
      </header>

      <div className="space-y-3 px-4 py-3 text-sm text-gray-800">
        <p className="whitespace-pre-line">{f.description}</p>
        {f.advice && (
          <div>
            <h4 className="font-medium text-gray-900">Advies</h4>
            <p className="whitespace-pre-line">{f.advice}</p>
          </div>
        )}

        {occs.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900">Waar</h4>
            <ul className="mt-1 space-y-1.5">
              {getoond.map((o: any) => (
                <li key={o.id}>
                  {o.sampleItem?.url ? (
                    <a
                      href={o.sampleItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-blue-700 underline hover:text-blue-900"
                    >
                      {o.sampleItem.title || o.sampleItem.url}
                    </a>
                  ) : (
                    <span className="text-gray-500">{o.sampleItem?.title || '(geen URL)'}</span>
                  )}
                  {vindplaatsToelichting(o) && <div className="text-gray-600">{vindplaatsToelichting(o)}</div>}
                </li>
              ))}
            </ul>
            {occs.length > EERSTE_PAGINAS && (
              <button
                type="button"
                onClick={() => setAllePaginas((x) => !x)}
                className="mt-2 text-sm text-blue-700 underline hover:text-blue-900"
              >
                {allePaginas ? 'Toon minder' : `Toon alle ${occs.length} pagina's`}
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 px-4 py-3">
        {afwijzen && (
          <div className="mb-3">
            <label htmlFor={`reden-${f.id}`} className="block text-sm font-medium text-gray-900">
              Waarom wijs je dit voorstel af?
            </label>
            <textarea
              id={`reden-${f.id}`}
              value={reden}
              onChange={(e) => setReden(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        )}
        {fout && (
          <p role="alert" className="mb-2 text-sm text-red-700">
            {fout}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {!afwijzen ? (
            <>
              <button
                type="button"
                disabled={bezig}
                onClick={() => beoordeel('akkoord')}
                className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                Akkoord
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => setAfwijzen(true)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Afwijzen
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={bezig}
                onClick={() => beoordeel('afwijzen')}
                className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                Afwijzen
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => {
                  setAfwijzen(false);
                  setFout(null);
                }}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Annuleren
              </button>
            </>
          )}
          <Link
            href={`/admin/projects/${projectId}/findings/${f.id}`}
            className="ml-auto text-sm text-blue-700 underline hover:text-blue-900"
          >
            Tekst aanpassen
          </Link>
        </div>
      </footer>
    </article>
  );
}
