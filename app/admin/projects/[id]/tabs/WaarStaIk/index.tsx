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

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { bouwStand } from './gegevens';
import Matrix from './Matrix';
import Stapel from './Stapel';

export default function WaarStaIk({
  project,
  allCriteria,
}: {
  project: any;
  allCriteria: any[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stand = useMemo(() => bouwStand(project, allCriteria), [project, allCriteria]);
  const focus = searchParams.get('focus');

  const zetFocus = (nieuw: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nieuw) params.set('focus', nieuw);
    else params.delete('focus');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
        {totalen.onbeoordeeld > 0 && (
          <span className="text-gray-500">
            {totalen.onbeoordeeld} combinaties nog niet beoordeeld
          </span>
        )}
      </div>

      {totalen.onbeoordeeld === totalen.samples * totalen.criteria && (
        <div className="mb-4 rounded border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Er zijn nog geen sampleoordelen voor dit project. Draai de{' '}
          <code className="rounded bg-white/70 px-1">audit-samples</code>-workflow om de matrix te
          vullen.
        </div>
      )}

      {focus ? (
        <Stapel
          stand={stand}
          focus={focus}
          terug={() => zetFocus(null)}
          projectId={project.id}
        />
      ) : (
        <>
          {teDoen > 0 && (
            <p className="mb-4 text-sm text-gray-500">
              Klik op een criterium om dat over alle pagina&apos;s af te lopen, of op een pagina om
              die af te werken.
            </p>
          )}
          <Matrix stand={stand} openStapel={zetFocus} />
        </>
      )}
    </div>
  );
}
