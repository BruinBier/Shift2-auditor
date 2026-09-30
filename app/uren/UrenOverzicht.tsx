'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Project = {
  id: string;
  kenmerk: string | null;
  title: string;
  version: number;
  checkPhase: string;
  parentProjectId: string | null;
};
type Regel = {
  id: string;
  projectId: string | null;
  datum: string; // YYYY-MM-DD
  uren: number;
  omschrijving: string | null;
  project: Project | null;
};
type Periode = 'deze-week' | 'vorige-week' | 'deze-maand' | 'vorige-maand' | 'alles';

const PERIODES: { waarde: Periode; label: string }[] = [
  { waarde: 'deze-week', label: 'Deze week' },
  { waarde: 'vorige-week', label: 'Vorige week' },
  { waarde: 'deze-maand', label: 'Deze maand' },
  { waarde: 'vorige-maand', label: 'Vorige maand' },
  { waarde: 'alles', label: 'Alles' },
];

function isoDatum(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dag}`;
}

/** Van en tot en met, als YYYY-MM-DD; een week begint op maandag. */
function periodeGrenzen(periode: Periode): [string, string] | null {
  const nu = new Date();
  if (periode === 'alles') return null;
  if (periode === 'deze-week' || periode === 'vorige-week') {
    const maandag = new Date(nu);
    maandag.setDate(nu.getDate() - ((nu.getDay() + 6) % 7) - (periode === 'vorige-week' ? 7 : 0));
    const zondag = new Date(maandag);
    zondag.setDate(maandag.getDate() + 6);
    return [isoDatum(maandag), isoDatum(zondag)];
  }
  const verschuiving = periode === 'vorige-maand' ? -1 : 0;
  const eerste = new Date(nu.getFullYear(), nu.getMonth() + verschuiving, 1);
  const laatste = new Date(nu.getFullYear(), nu.getMonth() + verschuiving + 1, 0);
  return [isoDatum(eerste), isoDatum(laatste)];
}

/** Nulmeting en herinspectie delen kenmerk en titel; versie en fase maken ze uit elkaar. */
function fase(p: Project): string {
  if (!p.parentProjectId) return 'nulmeting';
  return p.checkPhase === 'tussencheck' ? 'tussencheck' : 'herinspectie';
}

function projectNaam(p: Project | null): string {
  if (!p) return 'Overig';
  const versie = `v${p.version.toFixed(1).replace('.', ',')} ${fase(p)}`;
  return [p.kenmerk, versie, p.title].filter(Boolean).join(' · ');
}

function toonUren(uren: number): string {
  return uren.toLocaleString('nl-NL', { maximumFractionDigits: 2 });
}

function toonDatum(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const LEEG = { projectId: '', datum: '', uren: '', omschrijving: '' };

export default function UrenOverzicht({
  projecten,
  beginRegels,
}: {
  projecten: Project[];
  beginRegels: Regel[];
}) {
  const [regels, setRegels] = useState<Regel[]>(beginRegels);
  const [nieuw, setNieuw] = useState({ ...LEEG, datum: isoDatum(new Date()) });
  const [bewerkId, setBewerkId] = useState<string | null>(null);
  const [bewerk, setBewerk] = useState(LEEG);
  const [zoek, setZoek] = useState('');
  const [periode, setPeriode] = useState<Periode>('alles');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const gefilterd = useMemo(() => {
    const grenzen = periodeGrenzen(periode);
    const termen = zoek.toLowerCase().split(/\s+/).filter(Boolean);
    return regels.filter((r) => {
      if (grenzen && (r.datum < grenzen[0] || r.datum > grenzen[1])) return false;
      const tekst = `${projectNaam(r.project)} ${r.omschrijving ?? ''}`.toLowerCase();
      return termen.every((t) => tekst.includes(t));
    });
  }, [regels, zoek, periode]);

  const totaal = gefilterd.reduce((som, r) => som + r.uren, 0);

  const perProject = useMemo(() => {
    const som = new Map<string, { naam: string; uren: number }>();
    for (const r of gefilterd) {
      const sleutel = r.projectId ?? '';
      const huidig = som.get(sleutel) ?? { naam: projectNaam(r.project), uren: 0 };
      huidig.uren += r.uren;
      som.set(sleutel, huidig);
    }
    return Array.from(som.values()).sort((a, b) => b.uren - a.uren);
  }, [gefilterd]);

  async function opslaan(url: string, method: 'POST' | 'PUT', invoer: typeof LEEG): Promise<Regel | null> {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(invoer),
      });
      const data = await res.json();
      if (!res.ok) {
        setFout(data.error || 'Opslaan mislukt');
        return null;
      }
      return { ...data, datum: String(data.datum).slice(0, 10) };
    } catch {
      setFout('Opslaan mislukt');
      return null;
    } finally {
      setBezig(false);
    }
  }

  function sorteer(lijst: Regel[]): Regel[] {
    return [...lijst].sort((a, b) => b.datum.localeCompare(a.datum));
  }

  async function voegToe(e: React.FormEvent) {
    e.preventDefault();
    const regel = await opslaan('/api/uren', 'POST', nieuw);
    if (!regel) return;
    setRegels((oud) => sorteer([regel, ...oud]));
    // Onderzoek en datum blijven staan: vaak schrijf je meer regels op dezelfde dag.
    setNieuw({ ...nieuw, uren: '', omschrijving: '' });
  }

  function begin(r: Regel) {
    setBewerkId(r.id);
    setBewerk({
      projectId: r.projectId ?? '',
      datum: r.datum,
      uren: String(r.uren).replace('.', ','),
      omschrijving: r.omschrijving ?? '',
    });
  }

  async function bewaar(id: string) {
    const regel = await opslaan(`/api/uren/${id}`, 'PUT', bewerk);
    if (!regel) return;
    setRegels((oud) => sorteer(oud.map((r) => (r.id === id ? regel : r))));
    setBewerkId(null);
  }

  async function verwijder(r: Regel) {
    if (!confirm(`${toonUren(r.uren)} uur op ${toonDatum(r.datum)} verwijderen?`)) return;
    const res = await fetch(`/api/uren/${r.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setFout('Verwijderen mislukt');
      return;
    }
    setRegels((oud) => oud.filter((x) => x.id !== r.id));
  }

  const projectKeuze = (waarde: string, onChange: (v: string) => void, id: string, label?: string) => (
    <select
      id={id}
      aria-label={label}
      value={waarde}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
    >
      <option value="">Overig (geen onderzoek)</option>
      {projecten.map((p) => (
        <option key={p.id} value={p.id}>
          {projectNaam(p)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={voegToe} className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Geschreven uren toevoegen</h2>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_10rem_6rem_2fr_auto] gap-3 items-end">
          <div>
            <label htmlFor="nieuw-project" className="block text-xs font-medium text-gray-700 mb-1">
              Onderzoek
            </label>
            {projectKeuze(nieuw.projectId, (v) => setNieuw({ ...nieuw, projectId: v }), 'nieuw-project')}
          </div>
          <div>
            <label htmlFor="nieuw-datum" className="block text-xs font-medium text-gray-700 mb-1">
              Datum
            </label>
            <input
              id="nieuw-datum"
              type="date"
              required
              value={nieuw.datum}
              onChange={(e) => setNieuw({ ...nieuw, datum: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nieuw-uren" className="block text-xs font-medium text-gray-700 mb-1">
              Uren
            </label>
            <input
              id="nieuw-uren"
              inputMode="decimal"
              required
              placeholder="4,5"
              value={nieuw.uren}
              onChange={(e) => setNieuw({ ...nieuw, uren: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nieuw-omschrijving" className="block text-xs font-medium text-gray-700 mb-1">
              Omschrijving
            </label>
            <input
              id="nieuw-omschrijving"
              placeholder="Bijvoorbeeld: nulmeting, rapport, gesprek klant"
              value={nieuw.omschrijving}
              onChange={(e) => setNieuw({ ...nieuw, omschrijving: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={bezig}
            className="bg-shift2-primary text-white px-4 py-1.5 rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-50"
          >
            Toevoegen
          </button>
        </div>
        {fout && (
          <p role="alert" className="text-sm text-red-700 mt-2">
            {fout}
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[16rem]">
          <label htmlFor="zoek" className="block text-xs font-medium text-gray-700 mb-1">
            Zoeken
          </label>
          <input
            id="zoek"
            type="search"
            placeholder="Kenmerk, website of omschrijving, bijvoorbeeld WAAL"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <fieldset>
          <legend className="block text-xs font-medium text-gray-700 mb-1">Periode</legend>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            {PERIODES.map((p) => (
              <button
                key={p.waarde}
                type="button"
                aria-pressed={periode === p.waarde}
                onClick={() => setPeriode(p.waarde)}
                className={`px-3 py-1.5 text-sm border-l first:border-l-0 border-gray-300 ${
                  periode === p.waarde ? 'bg-shift2-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-gray-700" aria-live="polite">
          <span className="font-semibold text-gray-900">{toonUren(totaal)} uur</span> in {gefilterd.length}{' '}
          {gefilterd.length === 1 ? 'regel' : 'regels'}
        </p>
      </div>

      {perProject.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Per onderzoek</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
            {perProject.map((p) => (
              <li key={p.naam} className="flex justify-between gap-4">
                <span className="text-gray-700 truncate">{p.naam}</span>
                <span className="font-medium text-gray-900 tabular-nums">{toonUren(p.uren)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {gefilterd.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          {regels.length === 0 ? 'Nog geen uren vastgelegd.' : 'Geen uren in deze selectie.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Onderzoek</th>
                <th className="px-4 py-3 text-right">Uren</th>
                <th className="px-4 py-3">Omschrijving</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gefilterd.map((r) =>
                bewerkId === r.id ? (
                  <tr key={r.id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        aria-label="Datum"
                        value={bewerk.datum}
                        onChange={(e) => setBewerk({ ...bewerk, datum: e.target.value })}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {projectKeuze(
                        bewerk.projectId,
                        (v) => setBewerk({ ...bewerk, projectId: v }),
                        `bewerk-project-${r.id}`,
                        'Onderzoek',
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        inputMode="decimal"
                        aria-label="Uren"
                        value={bewerk.uren}
                        onChange={(e) => setBewerk({ ...bewerk, uren: e.target.value })}
                        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        aria-label="Omschrijving"
                        value={bewerk.omschrijving}
                        onChange={(e) => setBewerk({ ...bewerk, omschrijving: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right space-x-3">
                      <button
                        type="button"
                        disabled={bezig}
                        onClick={() => bewaar(r.id)}
                        className="text-shift2-primary hover:underline font-medium"
                      >
                        Opslaan
                      </button>
                      <button type="button" onClick={() => setBewerkId(null)} className="text-gray-600 hover:underline">
                        Annuleren
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{toonDatum(r.datum)}</td>
                    <td className="px-4 py-3">
                      {r.project ? (
                        <Link href={`/admin/projects/${r.project.id}`} className="text-shift2-primary hover:underline">
                          {projectNaam(r.project)}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Overig</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">{toonUren(r.uren)}</td>
                    <td className="px-4 py-3 text-gray-700">{r.omschrijving || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-3">
                      <button type="button" onClick={() => begin(r)} className="text-shift2-primary hover:underline">
                        Wijzigen<span className="sr-only"> ({toonDatum(r.datum)})</span>
                      </button>
                      <button type="button" onClick={() => verwijder(r)} className="text-red-700 hover:underline">
                        Verwijderen<span className="sr-only"> ({toonDatum(r.datum)})</span>
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
