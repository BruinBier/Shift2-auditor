'use client';

import { useState } from 'react';
import {
  CEL_KLEUR,
  OORDEEL_LABEL,
  STATUS_LABEL,
  type Cel,
  type Stand,
} from './gegevens';

const LEGENDA: { sleutel: string; label: string }[] = [
  { sleutel: 'voldoet', label: 'Voldoet' },
  { sleutel: 'afgekeurd', label: 'Afgekeurd' },
  { sleutel: 'opmerking', label: 'Opmerking' },
  { sleutel: 'niet_aanwezig', label: 'Niet aanwezig' },
  { sleutel: 'niet_te_bepalen', label: 'Jij moet kijken' },
  { sleutel: 'onbeoordeeld', label: 'Nog niet beoordeeld' },
];

export default function Matrix({
  stand,
  openStapel,
}: {
  stand: Stand;
  openStapel: (focus: string) => void;
}) {
  const [gekozen, setGekozen] = useState<Cel | null>(null);

  const critTitel = (code: string) => stand.criteria.find((c) => c.code === code)?.titleNl ?? '';
  const sampleTitel = (id: string) => stand.samples.find((s) => s.id === id)?.title ?? id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        {LEGENDA.map((l) => (
          <span key={l.sleutel} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${CEL_KLEUR[l.sleutel]}`} />
            {l.label}
          </span>
        ))}
      </div>

      {/* max-w-full: zonder die grens groeit het kader mee met de tabel en gaat de
          hele pagina horizontaal schuiven in plaats van alleen de matrix. */}
      <div className="max-w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-700">
                Criterium
              </th>
              <th className="bg-gray-50 px-2 py-2 text-left font-medium text-gray-700">Oordeel</th>
              {stand.samples.map((s) => {
                const werk = stand.werkVoorKolom(s.id);
                return (
                  <th
                    key={s.id}
                    className="bg-gray-50 px-1 py-2 align-bottom font-normal text-gray-600"
                  >
                    <button
                      type="button"
                      onClick={() => openStapel(`kolom:${s.id}`)}
                      title={
                        werk
                          ? `${s.title} — ${werk} openstaande taken. Klik om deze pagina af te werken.`
                          : `${s.title} — niets meer te doen.`
                      }
                      className="block rounded hover:bg-gray-200"
                    >
                      {/* writing-mode in plaats van rotate: een transform blijft buiten
                          de schuifbreedte van het kader en laat de pagina schuiven. */}
                      <span
                        className="mx-auto block max-h-40 overflow-hidden whitespace-nowrap text-xs"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {s.title}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {stand.criteria.map((crit) => {
              const oordeel = OORDEEL_LABEL[stand.criteriumOordeel(crit.code)];
              const werk = stand.werkVoorRij(crit.code);
              return (
                <tr key={crit.code} className="border-t border-gray-100 hover:bg-gray-50">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1.5 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => openStapel(`rij:${crit.code}`)}
                      title={
                        werk
                          ? `${werk} openstaande taken op dit criterium. Klik om ze over alle pagina's af te werken.`
                          : `${crit.code} — niets meer te doen.`
                      }
                      className="group flex items-center gap-2 rounded text-left hover:underline"
                    >
                      <span>
                        <span className="font-medium text-gray-900">{crit.code}</span>{' '}
                        <span className="text-gray-500">{crit.titleNl}</span>
                      </span>
                      {werk > 0 && (
                        <span className="rounded bg-gray-100 px-1.5 text-xs text-gray-600 group-hover:bg-gray-900 group-hover:text-white">
                          {werk}
                        </span>
                      )}
                    </button>
                  </th>
                  <td className="px-2 py-1.5">
                    <span
                      className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${oordeel.klasse}`}
                    >
                      {oordeel.tekst}
                    </span>
                  </td>
                  {stand.samples.map((s) => {
                    const cel = stand.celVoor(s.id, crit.code);
                    if (!cel) return <td key={s.id} />;
                    const sleutel = cel.status ?? 'onbeoordeeld';
                    const actief =
                      gekozen?.sampleId === cel.sampleId && gekozen?.code === cel.code;
                    const label = cel.status ? STATUS_LABEL[cel.status] : 'Nog niet beoordeeld';
                    return (
                      <td key={s.id} className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => setGekozen(actief ? null : cel)}
                          title={`${s.title} — ${label}`}
                          className={`block h-5 w-5 rounded-sm ${CEL_KLEUR[sleutel]} ${
                            actief ? 'ring-2 ring-gray-900 ring-offset-1' : ''
                          }`}
                        >
                          <span className="sr-only">
                            {s.title} — {label}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vast in beeld: de tabel is ruim duizend pixels hoog, dus een paneel
          eronder valt buiten het scherm en lijkt de klik niets te doen. */}
      {gekozen && (
        <div className="fixed bottom-6 right-6 z-40 max-h-[70vh] w-[28rem] max-w-[calc(100vw-3rem)] overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                {gekozen.code} — {critTitel(gekozen.code)}
              </p>
              <p className="text-sm text-gray-500">
                {sampleTitel(gekozen.sampleId)} ·{' '}
                {gekozen.status ? STATUS_LABEL[gekozen.status] : 'Nog niet beoordeeld'}
                {gekozen.bron && ` · via ${gekozen.bron}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGekozen(null)}
              className="shrink-0 text-sm text-gray-400 hover:text-gray-600"
            >
              Sluiten
            </button>
          </div>

          {stand.werkVoorKolom(gekozen.sampleId) > 0 && (
            <button
              type="button"
              onClick={() => openStapel(`cel:${gekozen.sampleId}:${gekozen.code}`)}
              className="mb-3 w-full rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Afwerken in de stapel
            </button>
          )}

          {gekozen.status === 'niet_te_bepalen' && gekozen.reden && (
            <div className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-900">
              <p className="mb-1 font-medium">Te beantwoorden in de browser</p>
              <p>{gekozen.reden}</p>
            </div>
          )}

          {gekozen.status !== 'niet_te_bepalen' && gekozen.reden && (
            <p className="mb-3 text-sm text-gray-700">{gekozen.reden}</p>
          )}

          {gekozen.status === null && (
            <p className="mb-3 text-sm text-gray-500">
              Dit criterium is op deze pagina nog niet beoordeeld.
            </p>
          )}

          {gekozen.bevindingen.length > 0 && (
            <div className="space-y-2">
              {gekozen.bevindingen.length > 1 && (
                <p className="text-xs text-gray-500">
                  {gekozen.bevindingen.length} bevindingen op deze pagina
                </p>
              )}
              {gekozen.bevindingen.map((b) => (
                <div
                  key={b.id}
                  className={`rounded p-3 text-sm ${
                    b.type === 'opmerking' ? 'bg-amber-50 text-amber-950' : 'bg-red-50 text-red-950'
                  }`}
                >
                  <p className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                    {b.findingCode && (
                      <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono font-medium">
                        {b.findingCode}
                      </span>
                    )}
                    <span className="rounded bg-white/70 px-1.5 py-0.5">
                      {b.type === 'opmerking' ? 'Opmerking' : 'Bevinding'}
                    </span>
                    {b.impact && <span className="rounded bg-white/70 px-1.5 py-0.5">{b.impact}</span>}
                  </p>
                  <p className="whitespace-pre-line leading-relaxed">{b.description}</p>
                  {b.advice && (
                    <div className="mt-2 border-t border-black/10 pt-2">
                      <p className="mb-0.5 text-xs font-medium opacity-70">Advies</p>
                      <p className="whitespace-pre-line leading-relaxed">{b.advice}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
