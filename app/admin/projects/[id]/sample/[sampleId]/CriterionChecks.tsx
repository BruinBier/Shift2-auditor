'use client';

import { useState } from 'react';

type Check = {
  code: string;
  titel: string;
  status: string;
  reden: string | null;
  bron: string;
  akkoord: string | null;
  checkedAt: string;
};

const LABELS: Record<string, { tekst: string; kleur: string }> = {
  voldoet: { tekst: 'Voldoet', kleur: 'bg-green-100 text-green-800' },
  afgekeurd: { tekst: 'Afgekeurd', kleur: 'bg-red-100 text-red-800' },
  opmerking: { tekst: 'Opmerking', kleur: 'bg-blue-100 text-blue-800' },
  niet_aanwezig: { tekst: 'Niet aanwezig', kleur: 'bg-gray-100 text-gray-700' },
  niet_te_bepalen: { tekst: 'Niet te bepalen', kleur: 'bg-amber-100 text-amber-800' },
};

const AKKOORD_LABELS: Record<string, { tekst: string; kleur: string }> = {
  voorgesteld: { tekst: 'wacht op akkoord', kleur: 'bg-amber-100 text-amber-800' },
  akkoord: { tekst: 'akkoord', kleur: 'bg-green-100 text-green-800' },
  afgewezen: { tekst: 'afgewezen', kleur: 'bg-gray-100 text-gray-700' },
};

export default function CriterionChecks({
  checks,
  totaalCriteria,
}: {
  checks: Check[];
  totaalCriteria: number;
}) {
  const [open, setOpen] = useState(false);

  if (!checks.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Beoordeling per succescriterium</h2>
        <p className="text-sm text-gray-500">
          Dit steekproefitem is nog niet beoordeeld. Draai de audit-workflow en schrijf de
          beoordelingen weg met <code className="text-xs">npm run cli -- save-sample-checks</code>.
        </p>
      </div>
    );
  }

  const tel = (s: string) => checks.filter((c) => c.status === s).length;
  const openstaand = checks.filter((c) => c.status === 'niet_te_bepalen');
  const wachtOpAkkoord = checks.filter((c) => c.akkoord === 'voorgesteld');
  const compleet = totaalCriteria > 0 && checks.length >= totaalCriteria;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Beoordeling per succescriterium</h2>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            compleet ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {checks.length} van {totaalCriteria || checks.length} beoordeeld
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['afgekeurd', 'opmerking', 'voldoet', 'niet_aanwezig', 'niet_te_bepalen'] as const).map((s) => {
          const n = tel(s);
          if (!n) return null;
          return (
            <span key={s} className={`px-2 py-1 rounded text-xs font-medium ${LABELS[s].kleur}`}>
              {LABELS[s].tekst}: {n}
            </span>
          );
        })}
      </div>

      {wachtOpAkkoord.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
          <strong>{wachtOpAkkoord.length}</strong>{' '}
          {wachtOpAkkoord.length === 1 ? 'voorstel wacht' : 'voorstellen wachten'} op je akkoord:{' '}
          {wachtOpAkkoord.map((c) => c.code).join(', ')}
        </div>
      )}

      {openstaand.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
          <p className="text-sm font-medium text-amber-900 mb-2">
            {openstaand.length} {openstaand.length === 1 ? 'openstaande vraag' : 'openstaande vragen'}
          </p>
          <ul className="space-y-2">
            {openstaand.map((c) => (
              <li key={c.code} className="text-sm text-amber-900">
                <span className="font-medium">{c.code}</span> {c.titel}
                {c.reden && <p className="text-xs text-amber-800 mt-0.5">{c.reden}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-blue-600 hover:underline"
        aria-expanded={open}
      >
        {open ? 'Verberg alle criteria' : `Toon alle ${checks.length} criteria`}
      </button>

      {open && (
        <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
          {checks.map((c) => {
            const label = LABELS[c.status] ?? { tekst: c.status, kleur: 'bg-gray-100 text-gray-700' };
            const akkoord = c.akkoord ? AKKOORD_LABELS[c.akkoord] : null;
            return (
              <li key={c.code} className="py-3">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-sm text-gray-900 w-16 shrink-0">{c.code}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-900">{c.titel}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${label.kleur}`}>
                        {label.tekst}
                      </span>
                      {akkoord && (
                        <span className={`px-2 py-0.5 rounded text-xs ${akkoord.kleur}`}>
                          {akkoord.tekst}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">via {c.bron}</span>
                    </div>
                    {c.reden && <p className="text-sm text-gray-600 mt-1">{c.reden}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
