'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Kandidaten voor de steekproef (experimenteel) -- steekproefselectie v2, fase 1.
 *
 * Laat zien welke pagina's en documenten er op de site gevonden zijn, uit welke bron, en
 * wat er is uitgesloten of samengevoegd en waarom. Alleen lezen: dit paneel kiest niets
 * en verandert niets aan de steekproef. De aanwijzingen (formulier, tabel, video, iframe)
 * komen uit opgehaalde HTML zonder browser en zijn indicatief.
 */

type Status = 'kandidaat' | 'uitgesloten' | 'dubbel' | 'niet_opgehaald';

interface Run {
  id: string;
  status: 'bezig' | 'klaar' | 'mislukt';
  startUrl: string;
  canonHost: string | null;
  samenvatting: any;
  poolHash: string | null;
  fout: string | null;
  gestartOp: string;
  klaarOp: string | null;
  gelijkAanVorige: { vorigeId: string; pool: boolean; kandidaten: boolean; zelfdeVersies: boolean } | null;
}

interface Kandidaat {
  urlNorm: string;
  soort: 'html' | 'document';
  documentSoort: string | null;
  bronnen: string[];
  status: Status;
  reden: string | null;
  dubbelVan: string | null;
  httpStatus: number | null;
  titel: string | null;
  aanwijzingen: any;
  varianten: string[];
  waarschuwing: string | null;
}

const BRONNAAM: Record<string, string> = {
  klant: 'klant',
  scope: 'scope',
  sitemap: 'sitemap',
  link: 'link',
  doorverwijzing: 'doorverwijzing',
};

const pad = (u: string) => {
  try {
    const x = new URL(u);
    return decodeURIComponent(x.pathname + x.search);
  } catch {
    return u;
  }
};
const kort = (u: string, host: string | null) => {
  try {
    const x = new URL(u);
    return x.hostname === host ? pad(u) : decodeURIComponent(x.hostname + x.pathname);
  } catch {
    return u;
  }
};

export default function KandidatenPaneel({ projectId }: { projectId: string }) {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [kandidaten, setKandidaten] = useState<Kandidaat[] | null>(null);
  const [bezigMetStarten, setBezigMetStarten] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  const laad = useCallback(async () => {
    const r = await fetch(`/api/projects/${projectId}/steekproef/inventaris`);
    if (!r.ok) return;
    const lijst: Run[] = await r.json();
    setRuns(lijst);
    const laatste = lijst.find((x) => x.status === 'klaar');
    if (laatste) {
      const d = await fetch(`/api/projects/${projectId}/steekproef/inventaris/${laatste.id}`);
      if (d.ok) setKandidaten((await d.json()).kandidaten);
    } else {
      setKandidaten(null);
    }
  }, [projectId]);

  useEffect(() => {
    laad();
  }, [laad]);

  // Zolang er een inventarisatie loopt, elke vier seconden kijken.
  const loopt = runs?.some((r) => r.status === 'bezig');
  useEffect(() => {
    if (!loopt) return;
    const t = setInterval(laad, 4000);
    return () => clearInterval(t);
  }, [loopt, laad]);

  const start = async () => {
    setBezigMetStarten(true);
    setMelding(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/steekproef/inventaris`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) setMelding(d.error || 'Starten mislukte.');
      await laad();
    } finally {
      setBezigMetStarten(false);
    }
  };

  const laatste = runs?.find((x) => x.status !== 'bezig') ?? null;
  const s = laatste?.status === 'klaar' ? laatste.samenvatting : null;
  const host = laatste?.canonHost ?? null;
  const perStatus = (st: Status) => (kandidaten ?? []).filter((k) => k.status === st);
  const htmlKandidaten = (kandidaten ?? []).filter((k) => k.status === 'kandidaat' && k.soort === 'html');
  const documenten = (kandidaten ?? []).filter((k) => k.status === 'kandidaat' && k.soort === 'document');

  return (
    <section aria-labelledby="kandidaten-kop" className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h3 id="kandidaten-kop" className="text-lg font-semibold">
            Kandidaten voor de steekproef <span className="text-sm font-normal text-gray-500">(experimenteel)</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">
            Alle pagina&apos;s en documenten die op de site gevonden zijn, uit de scope, de sitemap, de door de klant
            aangedragen pagina&apos;s en de links op die pagina&apos;s. Dit kiest nog niets: de steekproef blijft komen
            uit de workflow. Formulier, tabel, video en iframe zijn aanwijzingen uit de HTML zonder browser.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={bezigMetStarten || !!loopt}
          className="shrink-0 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loopt ? 'Inventarisatie loopt…' : laatste ? 'Opnieuw inventariseren' : 'Inventariseren'}
        </button>
      </div>

      {melding && (
        <p role="alert" className="text-sm text-red-700 mb-3">
          {melding}
        </p>
      )}
      {loopt && (
        <p role="status" className="text-sm text-gray-600 mb-3">
          De inventarisatie loopt. Een grote site duurt een minuut of twee.
        </p>
      )}
      {runs && !laatste && !loopt && <p className="text-sm text-gray-500">Nog niet geïnventariseerd.</p>}
      {laatste?.status === 'mislukt' && (
        <p role="alert" className="text-sm text-red-700">
          De laatste inventarisatie mislukte: {laatste.fout}
        </p>
      )}

      {s && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {host} · {new Date(laatste!.klaarOp || laatste!.gestartOp).toLocaleString('nl-NL')} · pool{' '}
            <code className="text-xs">{laatste!.poolHash}</code>
            {laatste!.gelijkAanVorige &&
              (laatste!.gelijkAanVorige.pool ? (
                <span className="ml-2 text-green-800">gelijk aan de vorige inventarisatie</span>
              ) : (
                <span className="ml-2 text-amber-800">
                  anders dan de vorige inventarisatie{!laatste!.gelijkAanVorige.zelfdeVersies && ' (andere versie van de regels)'}
                </span>
              ))}
          </p>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              ['Gevonden adressen', s.ruwGevonden],
              ['Uniek na normalisatie', s.uniek],
              ['Kandidaat-pagina’s', s.htmlKandidaten],
              ['Kandidaat-documenten', s.documenten.kandidaat],
              ['Uitgesloten', s.perStatus.uitgesloten],
              ['Samengevoegd (dubbel)', s.perStatus.dubbel],
              ['Niet op te halen', s.perStatus.niet_opgehaald],
              ['Uit de sitemap', s.perBron.sitemap],
            ].map(([label, waarde]) => (
              <div key={label as string} className="border border-gray-200 rounded p-3">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-lg font-semibold">{waarde as number}</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm text-gray-700 mb-1">
            <strong>Aanwijzingen</strong> (indicatief, op {s.htmlKandidaten} pagina&apos;s): formulier {s.aanwijzingen.formulier},
            tabel {s.aanwijzingen.tabel}, video {s.aanwijzingen.video}, kaart {s.aanwijzingen.kaart ?? 0}, iframe {s.aanwijzingen.iframe},
            documentlinks {s.aanwijzingen.documentlinks}.
            {s.alleenUitPaginadata &&
              ` Alleen uit de meegestuurde paginadata: video ${s.alleenUitPaginadata.video}, kaart ${s.alleenUitPaginadata.kaart}, iframe ${s.alleenUitPaginadata.iframe}.`}
          </p>
          <p className="text-sm text-gray-700 mb-4">
            <strong>Door de klant aangedragen:</strong>{' '}
            {s.klantpaginas.length === 0
              ? 'geen.'
              : s.klantpaginas
                  .map((k: any) => `${kort(k.url, host)}: ${k.status === 'kandidaat' ? 'in de pool' : k.status}${k.waarschuwing ? ` (${k.waarschuwing})` : ''}`)
                  .join(' · ')}
          </p>

          <Lijst titel={`Uitgesloten (${perStatus('uitgesloten').length})`} items={perStatus('uitgesloten')} host={host} toon={(k) => k.reden} />
          <Lijst
            titel={`Samengevoegd (${perStatus('dubbel').length})`}
            items={perStatus('dubbel')}
            host={host}
            toon={(k) => `${k.reden} → ${kort(k.dubbelVan || '', host)}`}
          />
          <Lijst titel={`Niet op te halen (${perStatus('niet_opgehaald').length})`} items={perStatus('niet_opgehaald')} host={host} toon={(k) => k.reden} />
          <Lijst
            titel={`Documenten (${documenten.length})`}
            items={documenten}
            host={host}
            toon={(k) => `${(k.documentSoort || '').toUpperCase()}${k.bronnen.includes('klant') ? ' · klant' : ''}`}
          />
          <Lijst
            titel={`Pagina's (${htmlKandidaten.length})`}
            items={htmlKandidaten}
            host={host}
            toon={(k) => {
              const a = k.aanwijzingen || {};
              const kenmerk = [
                a.formulieren ? 'formulier' : null,
                a.tabellen ? 'tabel' : null,
                a.video ? 'video' : null,
                a.iframes ? 'iframe' : null,
                a.documentlinks ? `${a.documentlinks} documentlinks` : null,
              ].filter(Boolean);
              return [k.bronnen.map((b) => BRONNAAM[b] || b).join(', '), ...kenmerk, k.waarschuwing].filter(Boolean).join(' · ');
            }}
          />
        </>
      )}
    </section>
  );
}

function Lijst({
  titel,
  items,
  host,
  toon,
}: {
  titel: string;
  items: Kandidaat[];
  host: string | null;
  toon: (k: Kandidaat) => string | null;
}) {
  if (!items.length) return null;
  return (
    <details className="border-t border-gray-200 py-2">
      <summary className="cursor-pointer text-sm font-medium py-1">{titel}</summary>
      <ul className="mt-2 max-h-96 overflow-auto text-sm divide-y divide-gray-100">
        {items.map((k) => (
          <li key={k.urlNorm} className="py-1.5 flex flex-wrap gap-x-3">
            <a href={k.urlNorm} target="_blank" rel="noreferrer" className="text-[#6b2d8f] underline break-all">
              {k.titel || kort(k.urlNorm, host)}
            </a>
            {k.titel && <span className="text-gray-500 break-all">{kort(k.urlNorm, host)}</span>}
            <span className="text-gray-600">{toon(k)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
