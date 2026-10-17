import { OORDEEL_LABEL, OVEREENSTEMMING_LABEL } from '@/lib/bibliotheek/weergave';

export type RapportRij = {
  id: string;
  auditor: string;
  auditorZeker: boolean;
  /** null bij een vertrouwelijke bron: de naam komt hier nooit. */
  organisatie: string | null;
  rapportCriteria: string[];
  rapportOordeel: string;
  overeenstemming: string;
  handmatig: boolean;
  citaat: string;
  casusId: string | null;
};

const OVEREENSTEMMING_KLEUR: Record<string, string> = {
  eens: 'text-green-800',
  ander_criterium: 'text-amber-900',
  te_streng: 'text-red-800',
  te_soepel: 'text-red-800',
};

export default function InRapporten({ rapporten }: { rapporten: RapportRij[] }) {
  if (rapporten.length === 0) {
    return (
      <p className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        Dit patroon is nog in geen enkel rapport gevonden.
      </p>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-left text-xs text-gray-600 uppercase tracking-wider">
            <th scope="col" className="px-4 py-3">Auditor</th>
            <th scope="col" className="px-4 py-3">Organisatie</th>
            <th scope="col" className="px-4 py-3">Rapportcriterium</th>
            <th scope="col" className="px-4 py-3">Rapportoordeel</th>
            <th scope="col" className="px-4 py-3">Overeenstemming</th>
            <th scope="col" className="px-4 py-3">Citaat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rapporten.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 align-top">
                {r.auditor}
                {!r.auditorZeker && <span className="block text-xs text-gray-500">afgeleid uit bestandsnaam</span>}
              </td>
              <td className="px-4 py-3 align-top">{r.organisatie ?? <span className="text-gray-500">vertrouwelijk</span>}</td>
              <td className="px-4 py-3 align-top whitespace-nowrap">{r.rapportCriteria.join(', ')}</td>
              <td className="px-4 py-3 align-top">{OORDEEL_LABEL[r.rapportOordeel]}</td>
              <td className={`px-4 py-3 align-top font-semibold ${OVEREENSTEMMING_KLEUR[r.overeenstemming]}`}>
                {OVEREENSTEMMING_LABEL[r.overeenstemming]}
                {r.handmatig && <span className="block text-xs font-normal text-gray-500">met de hand gezet</span>}
              </td>
              <td className="px-4 py-3 align-top text-gray-700">
                {r.citaat || <span className="text-gray-500">nog geen citaat</span>}
                {r.casusId && <span className="block text-xs text-gray-500 font-mono">casus {r.casusId}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
