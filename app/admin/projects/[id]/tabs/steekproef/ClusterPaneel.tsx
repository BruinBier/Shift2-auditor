'use client';

import { useEffect, useState } from 'react';

/**
 * Sjablonen / clusters (experimenteel) -- steekproefselectie v2, fase 3.
 *
 * Groepen pagina's met dezelfde technische opbouw. SCHADUWFUNCTIE: deze clusters hebben
 * geen invloed op de profielkeuze, het budget of de steekproef. De representant is alleen
 * een ingang om een cluster te bekijken; hij wordt nergens automatisch gekozen.
 */

const DREMPELS = [0.7, 0.75, 0.8, 0.85, 0.9];

const pad = (u: string) => {
  try {
    const x = new URL(u);
    return decodeURIComponent(x.pathname + x.search);
  } catch {
    return u;
  }
};

export default function ClusterPaneel({ projectId }: { projectId: string }) {
  const [drempel, setDrempel] = useState(0.8);
  const [data, setData] = useState<any | null | undefined>(undefined);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    let weg = false;
    (async () => {
      setFout(null);
      const r = await fetch(`/api/projects/${projectId}/steekproef/clusters?drempel=${drempel}`);
      const d = await r.json().catch(() => null);
      if (weg) return;
      if (!r.ok) {
        setData(null);
        setFout(d?.error || null);
        return;
      }
      setData(d);
    })();
    return () => {
      weg = true;
    };
  }, [projectId, drempel]);

  if (data === undefined) return null;
  const groot = (data?.clusters || []).filter((c: any) => c.leden.length > 1);
  const los = (data?.clusters || []).filter((c: any) => c.leden.length === 1);

  return (
    <section aria-labelledby="clusters-kop" className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 id="clusters-kop" className="text-lg font-semibold">
        Sjablonen / clusters <span className="text-sm font-normal text-gray-500">(experimenteel)</span>
      </h3>
      <p className="text-sm text-gray-700 mt-1 mb-3 max-w-3xl">
        <strong>Deze clusters hebben nog geen invloed op de steekproef.</strong> Pagina&apos;s met dezelfde technische opbouw
        (inhoudstype en componenten volgens het CMS, opbouw van de hoofdinhoud, sjabloonkoppen), zonder naar de tekst te kijken.
        Wat een redacteur in een tekstblok zet telt niet mee.
      </p>

      {fout && <p className="text-sm text-gray-500">{fout}</p>}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label htmlFor="cluster-drempel" className="text-sm font-medium">
              Drempel
            </label>
            <select
              id="cluster-drempel"
              value={drempel}
              onChange={(e) => setDrempel(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {DREMPELS.map((t) => (
                <option key={t} value={t}>
                  {t.toFixed(2)}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">
              {data.paginas} pagina&apos;s · {data.clusters.length} clusters, waarvan {los.length} met één pagina
            </span>
          </div>

          <table className="text-sm mb-4">
            <caption className="text-left text-gray-600 mb-1">Per drempel</caption>
            <thead>
              <tr className="text-left text-gray-500">
                <th scope="col" className="pr-4 font-medium">Drempel</th>
                <th scope="col" className="pr-4 font-medium">Clusters</th>
                <th scope="col" className="pr-4 font-medium">Met één pagina</th>
                <th scope="col" className="pr-4 font-medium">Grootste</th>
                <th scope="col" className="font-medium">Andere groep dan bij {drempel.toFixed(2)}</th>
              </tr>
            </thead>
            <tbody>
              {data.perDrempel.map((d: any) => (
                <tr key={d.drempel} className={d.drempel === drempel ? 'font-semibold' : ''}>
                  <td className="pr-4">{d.drempel.toFixed(2)}</td>
                  <td className="pr-4">{d.clusters}</td>
                  <td className="pr-4">{d.singletons}</td>
                  <td className="pr-4">{d.grootste.join(', ')}</td>
                  <td>{d.verschuivingTovGekozen} pagina&apos;s</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-gray-100">
            {groot.map((c: any) => (
              <li key={c.naam} className="py-2">
                <details>
                  <summary className="cursor-pointer text-sm">
                    <strong>Sjabloon {c.naam}</strong> · {c.leden.length} pagina&apos;s · overeenkomst {c.minimaal}–{c.gemiddeld} ·{' '}
                    representant <span className="text-gray-700">{pad(c.representant)}</span>
                    <span className="text-gray-500">
                      {' '}
                      · {c.inhoudstype ?? 'geen CMS-data'}
                      {c.componenten ? ` · ${c.componenten}` : ''}
                    </span>
                  </summary>
                  {c.gedeeld.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1 ml-4 break-all">Gedeeld: {c.gedeeld.join(' · ')}</p>
                  )}
                  <ul className="mt-1 ml-4 max-h-64 overflow-auto text-sm">
                    {c.leden.map((l: any) => (
                      <li key={l.urlNorm}>
                        <a href={l.urlNorm} target="_blank" rel="noreferrer" className="text-[#6b2d8f] underline break-all">
                          {pad(l.urlNorm)}
                        </a>
                        {(l.video || l.kaart) && (
                          <span className="text-gray-500"> · {[l.video && 'video', l.kaart && 'kaart'].filter(Boolean).join(', ')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>

          {los.length > 0 && (
            <details className="border-t border-gray-200 py-2 mt-2">
              <summary className="cursor-pointer text-sm font-medium">Pagina&apos;s zonder gelijke ({los.length})</summary>
              <ul className="mt-2 max-h-64 overflow-auto text-sm columns-1 md:columns-2">
                {los.map((c: any) => (
                  <li key={c.naam}>
                    <a href={c.representant} target="_blank" rel="noreferrer" className="text-[#6b2d8f] underline break-all">
                      {pad(c.representant)}
                    </a>
                    <span className="text-gray-500"> · {c.inhoudstype ?? 'geen CMS-data'}</span>
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
