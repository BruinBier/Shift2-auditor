'use client';

/**
 * "Waar sta ik" — de stand van het onderzoek.
 *
 * Twee samenwerkende weergaven, zoals vastgelegd in
 * docs/adr/0001-akkoord-als-poort.md:
 *
 *   de matrix is de kaart  — sample x criterium, waar staat wat open
 *   de stapel is het werk  — één ding tegelijk, gevoed vanuit de matrix
 *
 * De keuze staat in de URL (`?focus=rij:1.4.3`), zodat een werklijst te bewaren
 * en te delen is.
 */

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { bouwStand } from './gegevens';
import Matrix from './Matrix';
import Stapel from './Stapel';
import Waarnemingen from './Waarnemingen';
import type { Kaarttekst } from '@/lib/criterium-kaarttekst';

export default function WaarStaIk({
  project,
  allCriteria,
  kaartteksten = {},
}: {
  project: any;
  allCriteria: any[];
  kaartteksten?: Record<string, Kaarttekst>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stand = useMemo(() => bouwStand(project, allCriteria), [project, allCriteria]);
  const focus = searchParams.get('focus');
  const weergave = searchParams.get('weergave');

  /** Lag de matrix achter ons toen deze kaart openging? Zie terugNaarMatrix. */
  const kwamVanDeMatrix = useRef(false);
  useEffect(() => {
    if (!focus) kwamVanDeMatrix.current = true;
  }, [focus]);

  const waarnemingen: any[] = project?.waarnemingen ?? [];
  const openWaarnemingen = waarnemingen.filter((w) => w.status === 'open').length;

  /**
   * push en geen replace: het openen van een kaart of van "Ik zie iets" is een stap
   * die je wilt kunnen terugnemen. Met replace zag de browserhistorie er niets van,
   * en bracht de terugknop je van de kaart naar de pagina waar je vandaan kwam --
   * langs de matrix heen, terwijl je die terug wilde.
   *
   * De terugweg blijft dus ook via de terugknop lopen, naast de knop "Terug naar de
   * matrix" op de kaart zelf.
   */
  const zetWeergave = (nieuw: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nieuw) params.set('weergave', nieuw);
    else params.delete('weergave');
    params.delete('focus');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const zetFocus = (nieuw: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nieuw) params.set('focus', nieuw);
    else params.delete('focus');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /**
   * "Terug naar de matrix" doet hetzelfde als de terugknop van de browser, dus laat het
   * ook dezelfde stap zijn. Zou dit een nieuwe stap pushen, dan bracht de terugknop je
   * daarna weer op de kaart die je net dichtdeed.
   *
   * Alleen als er echt iets terug te gaan is: kom je hier binnen op een adres met een
   * `focus` erin -- een gedeelde werklijst, een bladwijzer -- dan ligt de matrix niet
   * achter je en moet het adres gewoon opgeschoond worden.
   */
  const terugNaarMatrix = () => {
    if (kwamVanDeMatrix.current) router.back();
    else zetFocus(null);
  };

  const { totalen } = stand;
  const teDoen = totalen.openVragen + totalen.voorstellen;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
        <span>
          <strong className="text-gray-900">{totalen.samplesNagekeken}</strong> van{' '}
          {totalen.samples} pagina&apos;s nagekeken
        </span>
        <span>
          <strong className="text-gray-900">{totalen.openVragen}</strong> vragen open in de browser
        </span>
        <span>
          <strong className="text-gray-900">{totalen.voorstellen}</strong> voorstellen wachten op
          akkoord
        </span>
        <span>
          <strong className="text-gray-900">{totalen.teBeoordelen}</strong> oordelen nog niet
          bevestigd
        </span>
        {totalen.onbeoordeeld > 0 && (
          <span className="text-gray-500">
            {totalen.onbeoordeeld} combinaties nog niet beoordeeld
          </span>
        )}
        <button
          type="button"
          onClick={() => zetWeergave(weergave === 'waarnemingen' ? null : 'waarnemingen')}
          className={`ml-auto rounded px-3 py-1.5 text-sm font-medium ${
            weergave === 'waarnemingen'
              ? 'bg-gray-900 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {weergave === 'waarnemingen' ? 'Terug naar de matrix' : 'Ik zie iets'}
          {openWaarnemingen > 0 && weergave !== 'waarnemingen' && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">
              {openWaarnemingen}
            </span>
          )}
        </button>
      </div>

      {totalen.onbeoordeeld === totalen.samples * totalen.criteria && (
        <div className="mb-4 rounded border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Er zijn nog geen sampleoordelen voor dit project. Draai de{' '}
          <code className="rounded bg-white/70 px-1">audit-samples</code>-workflow om de matrix te
          vullen.
        </div>
      )}

      {weergave === 'waarnemingen' ? (
        <Waarnemingen
          projectId={project.id}
          samples={stand.samples}
          waarnemingen={waarnemingen}
          standaardSampleId={searchParams.get('sample')}
        />
      ) : focus ? (
        <Stapel
          stand={stand}
          focus={focus}
          terug={terugNaarMatrix}
          projectId={project.id}
          kaartteksten={kaartteksten}
        />
      ) : (
        <>
          {teDoen > 0 && (
            <p className="mb-4 text-sm text-gray-500">
              Klik op een criterium om dat over alle pagina&apos;s af te lopen, op een pagina om
              die af te werken, of op een vakje om meteen die ene kaart te openen.
            </p>
          )}
          <Matrix stand={stand} openStapel={zetFocus} />
        </>
      )}
    </div>
  );
}
