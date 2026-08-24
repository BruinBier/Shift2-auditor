'use client';

import { useState } from 'react';
import {
  CEL_KLEUR,
  HERKOMST,
  ONBEOORDEELD_LABEL,
  OORDEEL_LABEL,
  STATUS_LABEL,
  celLabel,
  type Cel,
  type CriteriumOordeel,
  type SampleOordeel,
  type Stand,
} from './gegevens';
import { isSitebreed } from '@/lib/metingen';

/**
 * De legenda voert dezelfde woorden als de zweefteksten en het paneel, doordat
 * ze alle vier uit STATUS_LABEL komen. Stond die lijst hier apart, dan drijft hij af:
 * zo heette één toestand hier "Jij moet kijken" en in het paneel "Niet te bepalen".
 */
const LEGENDA: { sleutel: string; label: string }[] = [
  ...(Object.keys(STATUS_LABEL) as SampleOordeel[]).map((s) => ({
    sleutel: s as string,
    label: STATUS_LABEL[s],
  })),
  { sleutel: 'onbeoordeeld', label: ONBEOORDEELD_LABEL },
];

/**
 * Het oordeel over de hele website in de kleuren van de legenda hierboven. Geen nieuwe
 * kleurtaal: een afgekeurd criterium krijgt hetzelfde rood als een afgekeurde pagina, en
 * "nog niet getoetst" hetzelfde gestippelde vakje als "nog niet beoordeeld" — het is
 * tweemaal hetzelfde: er ligt nog geen uitspraak.
 */
const OORDEEL_KLEUR: Record<CriteriumOordeel, string> = {
  failed: CEL_KLEUR.afgekeurd,
  passed: CEL_KLEUR.voldoet,
  not_present: CEL_KLEUR.niet_aanwezig,
  not_tested: CEL_KLEUR.onbeoordeeld,
};

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
              {/* De laatste kolom draagt de criteria waarvan het oordeel over de héle
                  set gaat. Zie lib/metingen.ts. Geen knop: de kolom staat voor de
                  steekproef als geheel, niet voor een pagina die je kunt afwerken.

                  sticky right-0, spiegelbeeld van de criteriumkolom links: anders moet
                  je langs twintig paginakolommen slepen om het enige vakje te zien dat
                  er op zo'n rij staat.

                  De schaduw is een inset en geen border, want op een border-collapse-
                  tabel schuiven randen van een vastgezette cel in Chrome gewoon mee weg.
                  Hij heeft dezelfde kleur als de rijlijnen (gray-100). Met gray-200 was
                  dit de enige donkerdere lijn in het raster, en dan leest hij als de rand
                  van een apart paneel: de kolom leek naast de tabel te staan in plaats
                  van erin. */}
              <th
                className="sticky right-0 z-10 bg-gray-50 px-1 py-2 align-bottom font-normal text-gray-700"
                style={{ boxShadow: 'inset 1px 0 0 0 #f3f4f6' }}
              >
                <span
                  className="mx-auto block max-h-40 overflow-hidden whitespace-nowrap text-xs font-medium"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  alle pagina&apos;s
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {stand.criteria.map((crit) => {
              const oordeelCode = stand.criteriumOordeel(crit.code);
              const oordeel = OORDEEL_LABEL[oordeelCode];
              const werk = stand.werkVoorRij(crit.code);
              const sitebreed = isSitebreed(crit.code);
              /*
               * Welk vakje draagt het sitebrede oordeel? Niet "dat van Home": die afspraak
               * staat in een opmerking en wordt nergens afgedwongen, dus een steekproef
               * zonder homepage breekt hem. We zoeken het vakje met een écht oordeel —
               * alles behalve "niet aanwezig", want dat is precies wat de andere pagina's
               * dragen.
               */
              const rijCellen = sitebreed
                ? (stand.samples
                    .map((s) => stand.celVoor(s.id, crit.code))
                    .filter(Boolean) as Cel[])
                : [];
              const beoordeeld = rijCellen.filter((c) => c.status !== null);
              const dragers = beoordeeld.filter((c) => c.status !== 'niet_aanwezig');
              /*
               * Twee dragers is een fout in de gegevens, geen randgeval om stilletjes op te
               * lossen. En geen enkele drager betekent dat de hele rij op "niet aanwezig"
               * staat — dan levert criteriumOordeel `not_present`, en dat telt in het
               * rapport mee als geslaagd. Zeg het dus, in plaats van een grijs vakje te
               * tonen dat eruitziet alsof er niets aan de hand is.
               */
              const siteWaarschuwing =
                dragers.length > 1
                  ? `op ${dragers.length} pagina's vastgelegd`
                  : dragers.length === 0 && beoordeeld.length > 0
                    ? 'geen pagina draagt dit oordeel'
                    : null;
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
                  {/* Een sitebreed criterium hoort niet in de paginakolommen: aan één
                      pagina is 3.2.4 niet vast te stellen, dus een vakje per pagina zou
                      een oordeel tonen dat niemand geveld heeft. Zie lib/metingen.ts. Het
                      vakje staat in de laatste kolom, "alle pagina's". */}
                  {stand.samples.map((s) => {
                    // Een leeg vakje leest in dit raster als "onbekend", en dat is precies
                    // het tegenovergestelde van wat hier aan de hand is: er ligt wél een
                    // oordeel, alleen niet over deze pagina. Een streepje zegt "hier niet
                    // beoordeeld" en houdt de rij herkenbaar als een rij met inhoud.
                    //
                    // aria-hidden: twintig keer "niet hier beoordeeld" voorlezen is ruis.
                    // Wat er te weten valt staat in de kolom "alle pagina's", waar de
                    // sr-only tekst het oordeel voluit noemt.
                    if (sitebreed) {
                      return (
                        <td key={s.id} className="px-1 py-1.5">
                          <span
                            aria-hidden="true"
                            title={`${s.title} — hier niet beoordeeld; ${crit.code} geldt voor alle pagina's samen`}
                            className="mx-auto block h-5 w-5 select-none text-center text-sm leading-5 text-gray-400"
                          >
                            –
                          </span>
                        </td>
                      );
                    }
                    const cel = stand.celVoor(s.id, crit.code);
                    if (!cel) return <td key={s.id} />;
                    const sleutel = cel.status ?? 'onbeoordeeld';
                    const actief =
                      gekozen?.sampleId === cel.sampleId && gekozen?.code === cel.code;
                    const label = celLabel(cel.status);
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
                  {/* De kolom "alle pagina's": het oordeel over de héle website, bij élk
                      criterium. Het verschil tussen 1.1.1 en 3.2.4 zit niet hier maar in de
                      paginakolommen — bij 1.1.1 is elke pagina afzonderlijk getoetst en
                      volgt dit oordeel daaruit, bij 3.2.4 zijn de pagina's als geheel
                      beoordeeld en staan daar streepjes.

                      Dezelfde kleuren als de legenda, geen nieuwe kleurtaal erbij.

                      Klikken opent het criterium in de stapel, net als klikken op de naam
                      links: dit vakje gaat over de hele rij en niet over één pagina, dus
                      het paneel van één cel zou hier het verkeerde openen.

                      Een oranje rand betekent dat er iets mis is met de drager van een
                      sitebreed oordeel — zie hierboven. */}
                  <td
                    className="sticky right-0 z-10 bg-white px-1 py-1.5"
                    style={{ boxShadow: 'inset 1px 0 0 0 #f3f4f6' }}
                  >
                    <button
                      type="button"
                      onClick={() => openStapel(`rij:${crit.code}`)}
                      title={`alle pagina's — ${oordeel.tekst}${
                        siteWaarschuwing ? ` — ${siteWaarschuwing}` : ''
                      }`}
                      className={`block h-5 w-5 rounded-sm ${OORDEEL_KLEUR[oordeelCode]} ${
                        siteWaarschuwing ? 'ring-2 ring-amber-500 ring-offset-1' : ''
                      }`}
                    >
                      <span className="sr-only">
                        alle pagina&apos;s — {oordeel.tekst}
                        {siteWaarschuwing ? ` — ${siteWaarschuwing}` : ''}
                      </span>
                    </button>
                  </td>
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
                {isSitebreed(gekozen.code) ? 'hele website' : sampleTitel(gekozen.sampleId)} ·{' '}
                {celLabel(gekozen.status)}
                {gekozen.bron && ` · ${HERKOMST[gekozen.bron] ?? gekozen.bron}`}
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

          {/* Alleen als er op DIT vakje werk ligt. Eerder keek dit naar de hele
              kolom, waardoor de knop ook verscheen bij een criterium dat allang
              was afgehandeld — dan suggereert hij werk dat er niet is. */}
          {(gekozen.status === 'niet_te_bepalen' ||
            stand.voorstellen.some(
              (v) => v.sampleId === gekozen.sampleId && v.code === gekozen.code,
            )) && (
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

          {/* De onderbouwing van de auditor, niet de rapporttekst. Die staat
              hieronder bij de bevinding. Zonder dit onderscheid lijkt het alsof
              dit de tekst is die de opdrachtgever straks leest. */}
          {gekozen.status !== 'niet_te_bepalen' && gekozen.reden && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Onderbouwing van het oordeel
              </p>
              <p className="whitespace-pre-line text-sm text-gray-700">{gekozen.reden}</p>
            </div>
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
