'use client';

import { useEffect, useState } from 'react';

/**
 * Paginaprofielen (experimenteel) -- steekproefselectie v2, fase 2.
 *
 * Wat de browsermeting op een deel van de pool vond, per pagina met de reden waarom hij
 * gemeten is en de gebieden uit de dekkingslijst met bewijs. Alleen lezen: dit kiest niets.
 * De meting start in de CLI, want die gebruikt de auditsessie.
 */

const REDEN: Record<string, string> = {
  HOMEPAGE: 'homepage',
  KLANT: 'klant',
  VIDEO_AANWIJZING: 'video (statisch)',
  IFRAME_AANWIJZING: 'iframe (statisch)',
  FORMULIER_AANWIJZING: 'formulier (statisch)',
  TABEL_AANWIJZING: 'tabel (statisch)',
  DOCUMENTLINKS_AANWIJZING: 'documentlinks (statisch)',
  GESPREIDE_AANVULLING: 'gespreid',
  EXTRA_HANDMATIG: 'extra, handmatig',
  DOCUMENT_KLANT: 'klant',
  DOCUMENT_SOORT: 'spreiding over soort',
};

const pad = (u: string) => {
  try {
    const x = new URL(u);
    return decodeURIComponent(x.pathname + x.search);
  } catch {
    return u;
  }
};

export default function ProfielPaneel({ projectId }: { projectId: string }) {
  const [run, setRun] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/projects/${projectId}/steekproef/profielen`);
      if (!r.ok) return setRun(null);
      const lijst = await r.json();
      const laatste = lijst.find((x: any) => x.status === 'klaar') || lijst[0];
      if (!laatste) return setRun(null);
      const d = await fetch(`/api/projects/${projectId}/steekproef/profielen/${laatste.id}`);
      setRun(d.ok ? await d.json() : null);
    })();
  }, [projectId]);

  if (run === undefined) return null;
  const s = run?.samenvatting;
  const paginas = (run?.profielen || []).filter((p: any) => p.soort === 'html');
  const documenten = (run?.profielen || []).filter((p: any) => p.soort === 'document');

  return (
    <section aria-labelledby="profielen-kop" className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 id="profielen-kop" className="text-lg font-semibold">
        Paginaprofielen <span className="text-sm font-normal text-gray-500">(experimenteel)</span>
      </h3>
      <p className="text-sm text-gray-600 mt-1 mb-3 max-w-3xl">
        Wat de browser op een deel van de pagina&apos;s werkelijk aantrof, met bewijs. Een gebied dat hier niet staat, is
        niet door code gezien; dat is geen bewijs dat het er niet is. Meten gaat via{' '}
        <code className="text-xs">npm run cli -- steekproef-profiel {projectId}</code> met de auditsessie open.
      </p>

      {!run && <p className="text-sm text-gray-500">Nog niet gemeten.</p>}

      {run && s && (
        <>
          <p className="text-sm text-gray-600 mb-3">
            {new Date(run.klaarOp || run.gestartOp).toLocaleString('nl-NL')} · browser {run.browser === 'cdp' ? 'auditsessie' : run.browser} · budget{' '}
            {s.budget} van {s.htmlKandidaten} pagina&apos;s · {s.gemeten} gemeten{s.mislukt ? `, ${s.mislukt} mislukt` : ''} · {s.duurSeconden} s
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <strong>Waarom gemeten:</strong>{' '}
            {Object.entries(s.perReden)
              .map(([r, n]) => `${REDEN[r] || r} ${n}`)
              .join(' · ')}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <strong>Pagina&apos;s met</strong> formulier {s.paginasMet.formulier}, tabel {s.paginasMet.tabel}, video {s.paginasMet.video},
            iframe {s.paginasMet.iframe}, kaart {s.paginasMet.kaart ?? '?'}, documentlinks {s.paginasMet.documentlinks}.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            <strong>Browser vond wat statisch niet te zien was:</strong>{' '}
            {s.browserVondMeer.length
              ? s.browserVondMeer.map((v: any) => `${pad(v.urlNorm)} (${v.kenmerken.join(', ')}; ${v.laag === 'C' ? 'gespreid' : v.laag})`).join(' · ')
              : 'niets.'}
          </p>

          <details className="border-t border-gray-200 py-2">
            <summary className="cursor-pointer text-sm font-medium py-1">Gebieden gevonden door code</summary>
            <ul className="mt-2 text-sm">
              {Object.entries(s.paginasMetGebied).map(([g, n]) => (
                <li key={g}>
                  {g}: {n as number} pagina&apos;s
                </li>
              ))}
            </ul>
          </details>

          <details className="border-t border-gray-200 py-2">
            <summary className="cursor-pointer text-sm font-medium py-1">Pagina&apos;s ({paginas.length})</summary>
            <ul className="mt-2 max-h-[32rem] overflow-auto text-sm divide-y divide-gray-100">
              {paginas.map((p: any) => (
                <li key={p.id} className="py-2">
                  <a href={p.urlNorm} target="_blank" rel="noreferrer" className="text-[#6b2d8f] underline break-all">
                    {p.titel || pad(p.urlNorm)}
                  </a>{' '}
                  <span className="text-gray-500">{p.redenen.map((r: string) => REDEN[r] || r).join(', ')}</span>
                  {p.status !== 'gemeten' && <span className="text-red-700"> · {p.status}: {p.fout}</span>}
                  {p.omgeleid && <span className="text-amber-800"> · omgeleid naar {pad(p.eindUrl)}</span>}
                  {p.cookiescherm && <span className="text-amber-800"> · cookiescherm in beeld</span>}
                  {(p.gebieden || []).length > 0 && (
                    <ul className="ml-4 mt-1 text-gray-700">
                      {p.gebieden.map((g: any) => (
                        <li key={g.gebied}>
                          {g.gebied} {g.naam}
                          {g.bron === 'code-heuristiek' ? ' (afgeleid)' : ''}: <span className="text-gray-500 break-all">{g.bewijs}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </details>

          {documenten.length > 0 && (
            <details className="border-t border-gray-200 py-2">
              <summary className="cursor-pointer text-sm font-medium py-1">Documenten ({documenten.length})</summary>
              <ul className="mt-2 text-sm divide-y divide-gray-100">
                {documenten.map((d: any) => (
                  <li key={d.id} className="py-1.5">
                    <a href={d.urlNorm} target="_blank" rel="noreferrer" className="text-[#6b2d8f] underline break-all">
                      {d.document?.titel || pad(d.urlNorm)}
                    </a>{' '}
                    <span className="text-gray-500">
                      {d.redenen.map((r: string) => REDEN[r] || r).join(', ')} · geschat: {d.document?.geschatteSoort}
                      {d.status === 'gemeten'
                        ? ` · ${d.document?.paginas} blz. · ${d.document?.formuliervelden ? `${d.document.formuliervelden} formuliervelden` : 'geen formuliervelden'}`
                        : ` · ${d.status}: ${d.fout}`}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
