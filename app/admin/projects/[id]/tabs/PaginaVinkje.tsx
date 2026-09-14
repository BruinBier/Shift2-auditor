'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Eén vaststelling van de onderzoeker over één pagina, met drie standen.
 *
 * Drie en niet twee, want leeg mag nooit als "nee" gelden. Een sample die met de
 * hand is ingevoerd en waar niemand iets heeft aangevinkt, moet de gewone audit
 * krijgen; anders sluit je tien criteria af door niets te doen.
 *
 *   null   niet vastgesteld  -- de agent beoordeelt zoals altijd
 *   true   staat erop        -- de agent beoordeelt zoals altijd
 *   false  staat er niet op  -- de criteria worden zonder agent afgesloten
 *
 * Alleen `false` verandert iets aan de audit. `true` en `null` doen hetzelfde;
 * het verschil is dat `true` vastlegt dát je gekeken hebt.
 *
 * Dit vinkje bepaalt het OORDEEL en niet het AKKOORD. De kaart in "Waar sta ik"
 * komt gewoon in de werklijst en wordt nooit automatisch op akkoord gezet.
 * Zie docs/plannen/meetdossier-per-pagina.md.
 */

type Stand = boolean | null;

const VOLGENDE: Record<string, Stand> = {
  null: true,
  true: false,
  false: null,
};

interface Props {
  sampleId: string;
  veld: 'heeftBewegendBeeld' | 'heeftFormulier';
  waarde: Stand;
  /** Wat er staat als het vinkje aan staat, voor de titel. Bijv. "bewegend beeld". */
  wat: string;
  /** Welke criteria vervallen als het uit staat. Bijv. "1.2.1 t/m 1.2.5 en 2.1.4". */
  criteria: string;
}

export function PaginaVinkje({ sampleId, veld, waarde, wat, criteria }: Props) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  // Meteen tonen wat je klikt; de server bevestigt daarna.
  const [getoond, setGetoond] = useState<Stand>(waarde);

  const zet = async () => {
    const nieuw = VOLGENDE[String(getoond)];
    const vorige = getoond;
    setGetoond(nieuw);
    setBezig(true);
    try {
      const res = await fetch(`/api/sample-items/${sampleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ [veld]: nieuw }),
      });
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      // Mislukt: terug naar wat er stond, anders toont het scherm iets dat niet
      // is opgeslagen en sluit de onderzoeker straks criteria af die openstaan.
      setGetoond(vorige);
    } finally {
      setBezig(false);
    }
  };

  const titel =
    getoond === null
      ? `Niet vastgesteld of hier ${wat} staat. Klik om vast te leggen dat het er wel is.`
      : getoond === true
        ? `Op deze pagina staat ${wat}. Klik om vast te leggen dat het er niet is.`
        : `Op deze pagina staat geen ${wat}; ${criteria} worden niet beoordeeld. Klik om dit terug te zetten op niet vastgesteld.`;

  const stijl =
    getoond === true
      ? 'border-gray-400 bg-white text-gray-700'
      : getoond === false
        ? 'border-amber-400 bg-amber-50 text-amber-800'
        : 'border-dashed border-gray-300 bg-white text-gray-400';

  return (
    <button
      type="button"
      onClick={zet}
      disabled={bezig}
      title={titel}
      aria-label={titel}
      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold transition-colors disabled:opacity-50 ${stijl}`}
    >
      {getoond === true ? '✓' : getoond === false ? '–' : ''}
      <span className="sr-only">
        {wat}: {getoond === null ? 'niet vastgesteld' : getoond ? 'aanwezig' : 'niet aanwezig'}
      </span>
    </button>
  );
}
