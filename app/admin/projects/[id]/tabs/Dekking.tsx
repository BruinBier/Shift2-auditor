'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Overzicht per succescriterium, met de dekkingscontrole eronder.
 *
 * De hoofdvraag is: wat leverde elk criterium op? Die stel je bij elke audit, en hij werd
 * nergens beantwoord — het tabblad Criteria toont wel de status per criterium, maar niet de
 * bevindingen eronder.
 *
 * De controlevraag "is er nergens overgeslagen" staat onderaan. Die stel je zelden, maar als
 * er een gat is, is dat nergens anders zichtbaar: een overgeslagen criterium levert geen
 * bevinding op en valt dus niet op in enig ander overzicht.
 */

type Bevinding = {
  id: string;
  code: string;
  type: string;
  status: string;
  impact: string | null;
  responsibility: string | null;
  description: string;
  samples: string[];
};

type Vraag = { sample: string; sampleId: string; vraag: string | null };

type CriteriumRij = {
  criterionId: string;
  code: string;
  titel: string;
  niveau: string;
  projectStatus: string | null;
  bevindingen: Bevinding[];
  opmerkingen: Bevinding[];
  beoordeeld: number;
  verwacht: number;
  telling: Record<string, number>;
  vragen: Vraag[];
};

type Gat = { sample: string; sampleId: string; code: string; titel?: string };
type SampleRij = {
  sampleId: string;
  titel: string;
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
    bevindingen: number;
    opmerkingen: number;
  };
  dekkingCompleet: boolean;
  perCriterium: CriteriumRij[];
  perSample: SampleRij[];
  ontbrekend: Gat[];
  zonderOnderbouwing: Gat[];
  openVragen: (Gat & { vraag: string | null })[];
};

const STATUS_LABEL: Record<string, { tekst: string; kleur: string }> = {
  failed: { tekst: 'Afgekeurd', kleur: 'bg-red-100 text-red-800' },
  passed: { tekst: 'Voldoet', kleur: 'bg-green-100 text-green-800' },
  not_present: { tekst: 'Niet aanwezig', kleur: 'bg-gray-100 text-gray-700' },
  unknown: { tekst: 'Onbekend', kleur: 'bg-amber-100 text-amber-800' },
  not_tested: { tekst: 'Niet getoetst', kleur: 'bg-blue-100 text-blue-800' },
};

/** Eén criterium met zijn bevindingen. Uitgeklapt zodra er iets te zien is. */
function CriteriumBlok({ rij, projectId }: { rij: CriteriumRij; projectId: string }) {
  const heeftInhoud = rij.bevindingen.length > 0 || rij.opmerkingen.length > 0 || rij.vragen.length > 0;
  const [open, setOpen] = useState(false);
  const label = rij.projectStatus ? STATUS_LABEL[rij.projectStatus] : null;

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span className="font-mono text-sm text-gray-900 w-14 shrink-0 pt-0.5">{rij.code}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-900">{rij.titel}</span>
            <span className="text-xs text-gray-400">niveau {rij.niveau}</span>
            {label && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${label.kleur}`}>
                {label.tekst}
              </span>
            )}
            {rij.bevindingen.length > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                {rij.bevindingen.length}{' '}
                {rij.bevindingen.length === 1 ? 'bevinding' : 'bevindingen'}
              </span>
            )}
            {rij.opmerkingen.length > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {rij.opmerkingen.length}{' '}
                {rij.opmerkingen.length === 1 ? 'opmerking' : 'opmerkingen'}
              </span>
            )}
            {rij.vragen.length > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                {rij.vragen.length} {rij.vragen.length === 1 ? 'vraag' : 'vragen'}
              </span>
            )}
            {!heeftInhoud && <span className="text-xs text-gray-400">niets gevonden</span>}
          </div>

          <p className="text-xs text-gray-400 mt-0.5">
            {rij.beoordeeld} van {rij.verwacht} steekproefitems beoordeeld
            {rij.telling.afgekeurd > 0 && ` · ${rij.telling.afgekeurd}× afgekeurd`}
            {rij.telling.voldoet > 0 && ` · ${rij.telling.voldoet}× voldoet`}
            {rij.telling.niet_aanwezig > 0 && ` · ${rij.telling.niet_aanwezig}× niet aanwezig`}
          </p>

          {heeftInhoud && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="text-xs text-blue-600 hover:underline mt-1"
              aria-expanded={open}
            >
              {open ? 'Verberg' : 'Toon'}
            </button>
          )}

          {open && (
            <div className="mt-2 space-y-2">
              {[...rij.bevindingen, ...rij.opmerkingen].map((f) => (
                <div
                  key={f.id}
                  className={`rounded border p-3 ${
                    f.type === 'bevinding' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/admin/projects/${projectId}/findings/${f.id}`}
                      className="font-mono text-xs font-medium text-gray-900 hover:underline"
                    >
                      {f.code}
                    </a>
                    <span className="text-xs text-gray-600">
                      {f.type === 'bevinding' ? 'bevinding' : 'opmerking'}
                    </span>
                    {f.impact && <span className="text-xs text-gray-600">impact {f.impact}</span>}
                    {f.responsibility && (
                      <span className="text-xs text-gray-600">{f.responsibility}</span>
                    )}
                    {f.status === 'resolved' && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                        opgelost
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{f.description}</p>
                  {f.samples.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Op: {f.samples.join(', ')}</p>
                  )}
                </div>
              ))}

              {rij.vragen.map((v, i) => (
                <div
                  key={`${v.sampleId}-${i}`}
                  className="rounded border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="text-xs font-medium text-amber-900">Vraag · {v.sample}</p>
                  {v.vraag && <p className="text-sm text-amber-900 mt-1">{v.vraag}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/** Eén soort gat in de dekking. */
function GatBlok({
  titel,
  uitleg,
  items,
}: {
  titel: string;
  uitleg: string;
  items: Gat[];
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-red-900">
            {titel}: {items.length}
          </h3>
          <p className="text-sm text-red-800 mt-0.5">{uitleg}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm text-red-900 underline shrink-0"
          aria-expanded={open}
        >
          {open ? 'Verberg' : 'Toon'}
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-1 text-sm text-red-800">
          {items.map((g, i) => (
            <li key={`${g.sampleId}-${i}`}>
              <span className="font-mono">{g.code}</span> · {g.sample}
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
  const [alleenMetInhoud, setAlleenMetInhoud] = useState(false);

  const ophalen = useCallback(async () => {
    setLaden(true);
    setFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/dekking`);
      const json = await res.json();
      if (!res.ok) {
        setFout(json.error ?? 'Kon het overzicht niet ophalen');
        setData(null);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setFout(e?.message ?? 'Kon het overzicht niet ophalen');
    } finally {
      setLaden(false);
    }
  }, [projectId]);

  useEffect(() => {
    ophalen();
  }, [ophalen]);

  if (laden) return <p className="text-sm text-gray-500">Overzicht wordt opgebouwd...</p>;

  if (fout) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Per succescriterium</h2>
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

  const zichtbaar = alleenMetInhoud
    ? data.perCriterium.filter(
        (c) => c.bevindingen.length || c.opmerkingen.length || c.vragen.length,
      )
    : data.perCriterium;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Per succescriterium</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Wat elk criterium heeft opgeleverd: de bevindingen, de opmerkingen en de vragen die
              nog openstaan. Onderaan staat of er ergens is overgeslagen.
            </p>
          </div>
          <button type="button" onClick={ophalen} className="text-sm text-blue-600 hover:underline shrink-0">
            Vernieuwen
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1.5 rounded text-sm font-medium bg-red-100 text-red-800">
            {s.bevindingen} {s.bevindingen === 1 ? 'bevinding' : 'bevindingen'}
          </span>
          <span className="px-3 py-1.5 rounded text-sm font-medium bg-blue-100 text-blue-800">
            {s.opmerkingen} {s.opmerkingen === 1 ? 'opmerking' : 'opmerkingen'}
          </span>
          {s.openVragen > 0 && (
            <span className="px-3 py-1.5 rounded text-sm font-medium bg-amber-100 text-amber-800">
              {s.openVragen} {s.openVragen === 1 ? 'open vraag' : 'open vragen'}
            </span>
          )}
          <span className="text-sm text-gray-600">
            {s.criteria} criteria · {s.samples} steekproefitems
          </span>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={alleenMetInhoud}
            onChange={(e) => setAlleenMetInhoud(e.target.checked)}
            className="rounded border-gray-300"
          />
          Alleen criteria met bevindingen, opmerkingen of vragen
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {zichtbaar.length === 0 ? (
          <p className="text-sm text-gray-500">Geen criteria om te tonen.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {zichtbaar.map((rij) => (
              <CriteriumBlok key={rij.criterionId} rij={rij} projectId={projectId} />
            ))}
          </ul>
        )}
      </div>

      {/* Dekkingscontrole. Staat onderaan omdat je hem zelden nodig hebt, maar hij moet er
          zijn: een overgeslagen criterium levert geen bevinding op en is nergens anders te zien. */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Dekkingscontrole</h2>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Is elk criterium op elk steekproefitem daadwerkelijk nagelopen? Een overgeslagen
          criterium levert geen bevinding op en valt daarom nergens anders op.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
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
          {data.onderzoekstype && <span className="text-sm text-gray-400">{data.onderzoekstype}</span>}
        </div>

        {nietsGeregistreerd ? (
          <p className="mt-3 text-sm text-gray-600">
            Er is nog niets per steekproefitem vastgelegd. Dit vult zich zodra de audit-workflow is
            gedraaid.
          </p>
        ) : data.dekkingCompleet ? (
          <p className="mt-3 text-sm text-green-800">
            Elk criterium is op elk steekproefitem beoordeeld, en elke goedkeuring is onderbouwd.
          </p>
        ) : (
          <p className="mt-3 text-sm text-red-800">
            De dekking is niet compleet. Los dit op voordat je de conclusie schrijft.
          </p>
        )}

        {!nietsGeregistreerd && (
          <div className="mt-4 space-y-3">
            <GatBlok
              titel="Niet beoordeeld"
              uitleg="Er is geen beoordeling vastgelegd. Deze criteria zijn overgeslagen."
              items={data.ontbrekend}
            />
            <GatBlok
              titel="Goedgekeurd zonder onderbouwing"
              uitleg="Status 'voldoet' zonder toelichting. Een afkeuring komt in het rapport en wordt gelezen; een goedkeuring levert geen tekst op. Zonder toelichting is niet te zien waarop het oordeel stoelt."
              items={data.zonderOnderbouwing}
            />
          </div>
        )}

        {data.perSample.length > 0 && (
          <div className="mt-4">
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
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {data.perSample.map((r) => (
                  <li key={r.sampleId} className="py-2 flex items-start justify-between gap-4">
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
    </div>
  );
}
