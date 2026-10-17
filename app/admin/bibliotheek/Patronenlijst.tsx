'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { HERKOMST_LABEL, OORDEEL_LABEL, OORDEEL_PILL, STATUS_LABEL } from '@/lib/bibliotheek/weergave';

export type PatroonRij = {
  id: string;
  titel: string;
  criteria: string[];
  oordeel: string;
  herkomst: string;
  tags: string[];
  status: string;
  aantalCasussen: number;
  aantalRapportbevindingen: number;
  wijktAf: boolean;
  /** Titel, onderbouwing, standaardtekst en casus-HTML, in kleine letters. */
  zoektekst: string;
};

/** Sorteert '1.4.10' na '1.4.3'. */
function criteriumVolgorde(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

const veld = 'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm';

export default function Patronenlijst({ patronen }: { patronen: PatroonRij[] }) {
  const [zoek, setZoek] = useState('');
  const [criterium, setCriterium] = useState('');
  const [oordeel, setOordeel] = useState('');
  const [herkomst, setHerkomst] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState('');
  const [wijktAf, setWijktAf] = useState(false);

  const criteria = useMemo(
    () => Array.from(new Set(patronen.flatMap((p) => p.criteria))).sort(criteriumVolgorde),
    [patronen],
  );
  const tags = useMemo(() => Array.from(new Set(patronen.flatMap((p) => p.tags))).sort(), [patronen]);

  const zichtbaar = useMemo(() => {
    const z = zoek.trim().toLowerCase();
    return patronen
      .filter(
        (p) =>
          (!z || p.zoektekst.includes(z)) &&
          (!criterium || p.criteria.includes(criterium)) &&
          (!oordeel || p.oordeel === oordeel) &&
          (!herkomst || p.herkomst === herkomst) &&
          (!tag || p.tags.includes(tag)) &&
          (!status || p.status === status) &&
          (!wijktAf || p.wijktAf),
      )
      .sort(
        (a, b) =>
          b.aantalRapportbevindingen - a.aantalRapportbevindingen ||
          criteriumVolgorde(a.criteria[0] ?? '', b.criteria[0] ?? '') ||
          a.titel.localeCompare(b.titel, 'nl'),
      );
  }, [patronen, zoek, criterium, oordeel, herkomst, tag, status, wijktAf]);

  const filtersActief = zoek || criterium || oordeel || herkomst || tag || status || wijktAf;

  function wisFilters() {
    setZoek('');
    setCriterium('');
    setOordeel('');
    setHerkomst('');
    setTag('');
    setStatus('');
    setWijktAf(false);
  }

  return (
    <div>
      <form
        role="search"
        aria-label="Patronen filteren"
        className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap items-end gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="zoek" className="text-xs font-medium text-gray-700">
            Zoeken
          </label>
          <input
            id="zoek"
            type="search"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className={`${veld} w-64`}
            aria-describedby="zoek-uitleg"
          />
          <span id="zoek-uitleg" className="text-xs text-gray-500">
            In titel, onderbouwing, standaardtekst en casuscode
          </span>
        </div>
        <Keuze id="f-criterium" label="Criterium" waarde={criterium} zet={setCriterium}
          opties={criteria.map((c) => [c, c])} />
        <Keuze id="f-oordeel" label="Oordeel" waarde={oordeel} zet={setOordeel}
          opties={Object.entries(OORDEEL_LABEL)} />
        <Keuze id="f-herkomst" label="Herkomst" waarde={herkomst} zet={setHerkomst}
          opties={Object.entries(HERKOMST_LABEL)} />
        <Keuze id="f-tag" label="Tag" waarde={tag} zet={setTag} opties={tags.map((t) => [t, t])} />
        <Keuze id="f-status" label="Status" waarde={status} zet={setStatus}
          opties={Object.entries(STATUS_LABEL)} />
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-1.5">
          <input type="checkbox" checked={wijktAf} onChange={(e) => setWijktAf(e.target.checked)} />
          Wijkt af bij minstens één auditor
        </label>
        {filtersActief && (
          <button type="button" onClick={wisFilters} className="text-sm text-shift2-primary underline pb-1.5">
            Filters wissen
          </button>
        )}
      </form>

      <p className="text-sm text-gray-600 mb-2" aria-live="polite">
        {zichtbaar.length === patronen.length
          ? `${patronen.length} patronen`
          : `${zichtbaar.length} van ${patronen.length} patronen`}
        , gesorteerd op aantal rapportbevindingen
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs text-gray-600 uppercase tracking-wider">
              <th scope="col" className="px-4 py-3">Patroon</th>
              <th scope="col" className="px-4 py-3">Criteria</th>
              <th scope="col" className="px-4 py-3">Oordeel</th>
              <th scope="col" className="px-4 py-3">Herkomst</th>
              <th scope="col" className="px-4 py-3 text-right">Casussen</th>
              <th scope="col" className="px-4 py-3 text-right">In rapporten</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {zichtbaar.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/bibliotheek/${encodeURIComponent(p.id)}`}
                    className="text-shift2-primary hover:underline font-medium">
                    {p.titel}
                  </Link>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{p.id}</div>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">{p.criteria.join(', ')}</td>
                <td className="px-4 py-3 align-top">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${OORDEEL_PILL[p.oordeel]}`}>
                    {OORDEEL_LABEL[p.oordeel]}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">{HERKOMST_LABEL[p.herkomst]}</td>
                <td className="px-4 py-3 align-top text-right tabular-nums">{p.aantalCasussen}</td>
                <td className="px-4 py-3 align-top text-right tabular-nums">
                  {p.aantalRapportbevindingen}
                  {p.wijktAf && <span className="block text-xs text-amber-800">wijkt af</span>}
                </td>
                <td className="px-4 py-3 align-top">{STATUS_LABEL[p.status]}</td>
              </tr>
            ))}
            {zichtbaar.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Geen patronen bij deze filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Keuze({
  id,
  label,
  waarde,
  zet,
  opties,
}: {
  id: string;
  label: string;
  waarde: string;
  zet: (v: string) => void;
  opties: [string, string][];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-700">
        {label}
      </label>
      <select id={id} value={waarde} onChange={(e) => zet(e.target.value)} className={veld}>
        <option value="">Alle</option>
        {opties.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
