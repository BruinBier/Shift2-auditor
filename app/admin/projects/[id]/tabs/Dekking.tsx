'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Dekkingscontrole: is elk criterium op elk steekproefitem daadwerkelijk nagelopen?
 *
 * Waarom een eigen tabblad en niet iets in Finalize: alle andere overzichten tonen wat er
 * gevonden is. Een gat in de dekking is per definitie onzichtbaar in de uitkomst, dus daar
 * moet je apart naar kijken, vóór de statussen en de conclusie.
 */

type Gat = { sample: string; sampleId: string; code: string; titel?: string };
type OpenVraag = Gat & { vraag: string | null };
type SampleRij = {
  sampleId: string;
  titel: string;
  type: string;
  beoordeeld: number;
  verwacht: number;
  volledig: boolean;
  ontbrekendeCodes: string[];
};

type Dekking = {
  project: string;
  onderzoekstype: string | null;
  samenvatting: {
    samples: number;
    criteria: number;
    verwacht: number;
    geregistreerd: number;
    ontbrekend: number;
    zonderOnderbouwing: number;
    openVragen: number;
  };
  dekkingCompleet: boolean;
  perSample: SampleRij[];
  ontbrekend: Gat[];
  zonderOnderbouwing: Gat[];
  openVragen: OpenVraag[];
};

/** Groepeert gaten per criterium: dezelfde code komt vaak op veel samples terug. */
function perCode<T extends { code: string; sample: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const i of items) {
    const lijst = map.get(i.code) ?? [];
    lijst.push(i);
    map.set(i.code, lijst);
  }
  return Array.from(map.entries()).sort((a, b) => {
    const pa = a[0].split('.').map(Number);
    const pb = b[0].split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  });
}

function Blok({
  titel,
  uitleg,
  items,
  kleur,
  toonVraag = false,
}: {
  titel: string;
  uitleg: string;
  items: (Gat | OpenVraag)[];
  kleur: 'rood' | 'amber';
  toonVraag?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  const stijl =
    kleur === 'rood'
      ? { rand: 'border-red-200', vlak: 'bg-red-50', tekst: 'text-red-900', zacht: 'text-red-800' }
      : { rand: 'border-amber-200', vlak: 'bg-amber-50', tekst: 'text-amber-900', zacht: 'text-amber-800' };

  const groepen = perCode(items as Gat[]);

  return (
    <div className={`rounded-lg border ${stijl.rand} ${stijl.vlak} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-semibold ${stijl.tekst}`}>
            {titel}: {items.length}
          </h3>
          <p className={`text-sm ${stijl.zacht} mt-0.5`}>{uitleg}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`text-sm ${stijl.tekst} underline shrink-0`}
          aria-expanded={open}
        >
          {open ? 'Verberg' : 'Toon'}
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-3">
          {groepen.map(([code, lijst]) => (
            <li key={code}>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={`font-mono text-sm font-medium ${stijl.tekst}`}>{code}</span>
                <span className={`text-xs ${stijl.zacht}`}>
                  {lijst.length} {lijst.length === 1 ? 'steekproefitem' : 'steekproefitems'}
                </span>
              </div>
              <ul className={`mt-1 ml-4 space-y-1 text-sm ${stijl.zacht}`}>
                {lijst.map((g: Gat, i: number) => (
                  <li key={`${g.sampleId}-${i}`}>
                    {g.titel ? `${g.sample}` : g.sample}
                    {toonVraag && (g as OpenVraag).vraag && (
                      <p className="text-xs mt-0.5 opacity-90">{(g as OpenVraag).vraag}</p>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dekking({ projectId }: { projectId: string }) {
  const [data, setData] = useState<Dekking | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [laden, setLaden] = useState(true);
  const [toonSamples, setToonSamples] = useState(false);

  const ophalen = useCallback(async () => {
    setLaden(true);
    setFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/dekking`);
      const json = await res.json();
      if (!res.ok) {
        setFout(json.error ?? 'Kon de dekking niet ophalen');
        setData(null);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setFout(e?.message ?? 'Kon de dekking niet ophalen');
    } finally {
      setLaden(false);
    }
  }, [projectId]);

  useEffect(() => {
    ophalen();
  }, [ophalen]);

  if (laden) {
    return <p className="text-sm text-gray-500">Dekking wordt berekend...</p>;
  }

  if (fout) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Dekkingscontrole</h2>
        <p className="text-sm text-gray-600">{fout}</p>
        <button type="button" onClick={ophalen} className="mt-3 text-sm text-blue-600 hover:underline">
          Opnieuw proberen
        </button>
      </div>
    );
  }

  if (!data) return null;

  const s = data.samenvatting;
  const nietsGeregistreerd = s.geregistreerd === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dekkingscontrole</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Elk ander overzicht toont wat er gevonden is. Hier zie je wat er niet gedaan is: een
              overgeslagen criterium levert geen bevinding op en valt daarom nergens anders op.
            </p>
          </div>
          <button type="button" onClick={ophalen} className="text-sm text-blue-600 hover:underline shrink-0">
            Vernieuwen
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              nietsGeregistreerd
                ? 'bg-gray-100 text-gray-700'
                : data.dekkingCompleet
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {s.geregistreerd} van {s.verwacht} beoordeeld
          </span>
          <span className="text-sm text-gray-600">
            {s.samples} {s.samples === 1 ? 'steekproefitem' : 'steekproefitems'} × {s.criteria} criteria
          </span>
          {data.onderzoekstype && (
            <span className="text-sm text-gray-400">{data.onderzoekstype}</span>
          )}
        </div>

        {nietsGeregistreerd ? (
          <p className="mt-4 text-sm text-gray-600">
            Er is nog niets beoordeeld. De dekking vult zich zodra de audit per steekproefitem is
            gedraaid.
          </p>
        ) : data.dekkingCompleet ? (
          <p className="mt-4 text-sm text-green-800">
            Elk criterium is op elk steekproefitem beoordeeld, en elke goedkeuring is onderbouwd.
            {s.openVragen > 0 && ' Er staan nog wel vragen open (zie hieronder).'}
          </p>
        ) : (
          <p className="mt-4 text-sm text-red-800">
            De dekking is niet compleet. Los dit op voordat je de statussen vaststelt en de
            conclusie schrijft.
          </p>
        )}
      </div>

      {/* Bij een audit die nog moet beginnen is elk criterium "ontbrekend". Dat is geen
          bevinding maar de normale beginstand, dus dan geen alarmerend rood blok. */}
      {!nietsGeregistreerd && (
        <Blok
          titel="Niet beoordeeld"
          uitleg="Er is geen beoordeling vastgelegd. Deze criteria zijn overgeslagen."
          items={data.ontbrekend}
          kleur="rood"
        />
      )}

      <Blok
        titel="Goedgekeurd zonder onderbouwing"
        uitleg="Status 'voldoet' zonder toelichting. Een afkeuring komt in het rapport en wordt gelezen; een goedkeuring levert geen tekst op. Zonder toelichting is niet te zien waarop het oordeel stoelt."
        items={data.zonderOnderbouwing}
        kleur="rood"
      />

      <Blok
        titel="Openstaande vragen"
        uitleg="Niet te bepalen zonder antwoord van de onderzoeker. Deze blokkeren het afronden niet, maar horen wel beantwoord te worden."
        items={data.openVragen}
        kleur="amber"
        toonVraag
      />

      {data.perSample.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <button
            type="button"
            onClick={() => setToonSamples(!toonSamples)}
            className="text-sm text-blue-600 hover:underline"
            aria-expanded={toonSamples}
          >
            {toonSamples
              ? 'Verberg dekking per steekproefitem'
              : `Toon dekking per steekproefitem (${data.perSample.length})`}
          </button>

          {toonSamples && (
            <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
              {data.perSample.map((r) => (
                <li key={r.sampleId} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <a
                      href={`/admin/projects/${projectId}/sample/${r.sampleId}`}
                      className="text-sm text-gray-900 hover:underline"
                    >
                      {r.titel}
                    </a>
                    {r.ontbrekendeCodes.length > 0 && (
                      <p className="text-xs text-red-800 mt-0.5">
                        Mist: {r.ontbrekendeCodes.join(', ')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                      r.volledig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {r.beoordeeld}/{r.verwacht}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
