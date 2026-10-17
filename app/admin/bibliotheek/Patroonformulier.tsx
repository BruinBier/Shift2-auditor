'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HERKOMST_LABEL, OORDEEL_LABEL, VERSIE_LABEL } from '@/lib/bibliotheek/weergave';

export type PatroonVelden = {
  id: string;
  titel: string;
  omschrijving: string;
  criteria: string[];
  oordeel: string;
  onderbouwing: string;
  technieken: string[];
  herkomst: string;
  wcag: string[];
  standaardTekst: string;
  advies: string;
  tags: string[];
  status: string;
  vastgesteldDoor: string | null;
  vastgesteldOp: string | null;
};

const LEEG: PatroonVelden = {
  id: '',
  titel: '',
  omschrijving: '',
  criteria: [],
  oordeel: 'twijfel',
  onderbouwing: '',
  technieken: [],
  herkomst: 'content',
  wcag: ['wcag_2_1', 'wcag_2_2'],
  standaardTekst: '',
  advies: '',
  tags: [],
  status: 'concept',
  vastgesteldDoor: null,
  vastgesteldOp: null,
};

const invoer = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm';
const label = 'block text-sm font-medium text-gray-800 mb-1';
const hulp = 'text-xs text-gray-600 mt-1';

/** Oordeel-tabblad van een patroon, en het formulier voor een nieuw patroon. */
export default function Patroonformulier({
  patroon,
  criteria,
}: {
  patroon?: PatroonVelden;
  criteria: { code: string; titleNl: string }[];
}) {
  const router = useRouter();
  const nieuw = !patroon;
  const [v, setV] = useState({
    ...(patroon ?? LEEG),
    criteriaTekst: (patroon ?? LEEG).criteria.join(', '),
    techniekenTekst: (patroon ?? LEEG).technieken.join(', '),
    tagsTekst: (patroon ?? LEEG).tags.join(', '),
  });
  const [fouten, setFouten] = useState<string[]>([]);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState('');
  const [vaststeller, setVaststeller] = useState('Frits');
  const dialoog = useRef<HTMLDialogElement>(null);
  const foutRef = useRef<HTMLDivElement>(null);

  const zet = (veld: string, waarde: unknown) => setV((o) => ({ ...o, [veld]: waarde }));

  async function bewaar(extra: { status?: string; vastgesteldDoor?: string | null } = {}) {
    setBezig(true);
    setFouten([]);
    setMelding('');
    const body = {
      titel: v.titel,
      omschrijving: v.omschrijving,
      criteria: v.criteriaTekst,
      oordeel: v.oordeel,
      onderbouwing: v.onderbouwing,
      technieken: v.techniekenTekst,
      herkomst: v.herkomst,
      wcag: v.wcag,
      standaardTekst: v.standaardTekst,
      advies: v.advies,
      tags: v.tagsTekst,
      status: extra.status ?? v.status,
      vastgesteldDoor: extra.vastgesteldDoor !== undefined ? extra.vastgesteldDoor : v.vastgesteldDoor,
    };
    const res = await fetch(nieuw ? '/api/bibliotheek/patronen' : `/api/bibliotheek/patronen/${encodeURIComponent(v.id)}`, {
      method: nieuw ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    const antwoord = await res.json().catch(() => ({}));
    setBezig(false);
    if (!res.ok) {
      setFouten(antwoord.fouten ?? ['Opslaan is mislukt.']);
      requestAnimationFrame(() => foutRef.current?.focus());
      return false;
    }
    if (nieuw) {
      router.push(`/admin/bibliotheek/${encodeURIComponent(antwoord.id)}?tab=casussen`);
      return true;
    }
    setV((o) => ({
      ...o,
      status: antwoord.status,
      vastgesteldDoor: antwoord.vastgesteldDoor,
      vastgesteldOp: antwoord.vastgesteldOp,
    }));
    setMelding('Opgeslagen.');
    router.refresh();
    return true;
  }

  async function stelVast() {
    const ok = await bewaar({ status: 'vastgesteld', vastgesteldDoor: vaststeller.trim() });
    if (ok) dialoog.current?.close();
  }

  const criteriumTitels = v.criteriaTekst
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const gevonden = criteria.find((k) => k.code === c);
      return gevonden ? `${c} ${gevonden.titleNl}` : `${c} (onbekend)`;
    });

  return (
    <form
      className="bg-white rounded-lg border border-gray-200 p-6 grid gap-5 max-w-4xl"
      onSubmit={(e) => {
        e.preventDefault();
        bewaar();
      }}
    >
      {fouten.length > 0 && (
        <div ref={foutRef} tabIndex={-1} role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">Niet opgeslagen:</p>
          <ul className="list-disc pl-5">
            {fouten.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {!nieuw && (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm flex flex-wrap items-center gap-3">
          {v.status === 'vastgesteld' ? (
            <>
              <span>
                Vastgesteld door <strong>{v.vastgesteldDoor}</strong>
                {v.vastgesteldOp && <> op {new Date(v.vastgesteldOp).toLocaleDateString('nl-NL')}</>}.
              </span>
              <button type="button" className="text-shift2-primary underline" disabled={bezig}
                onClick={() => bewaar({ status: 'concept', vastgesteldDoor: null })}>
                Terug naar concept
              </button>
            </>
          ) : (
            <>
              <span>Concept: nog niet bruikbaar in een audit.</span>
              <button type="button" className="rounded-md border border-shift2-primary px-3 py-1 text-shift2-primary"
                disabled={bezig} onClick={() => dialoog.current?.showModal()}>
                Vaststellen…
              </button>
            </>
          )}
        </div>
      )}

      <div>
        <label htmlFor="titel" className={label}>Titel</label>
        <input id="titel" className={invoer} value={v.titel} onChange={(e) => zet('titel', e.target.value)} required />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="criteria" className={label}>Criteria</label>
          <input id="criteria" className={invoer} value={v.criteriaTekst}
            onChange={(e) => zet('criteriaTekst', e.target.value)} aria-describedby="criteria-hulp" />
          <p id="criteria-hulp" className={hulp}>
            Met komma&apos;s, bijvoorbeeld 1.3.1, 4.1.2.{' '}
            {criteriumTitels.length > 0 && criteriumTitels.join(' · ')}
          </p>
        </div>
        <div>
          <label htmlFor="oordeel" className={label}>Oordeel</label>
          <select id="oordeel" className={invoer} value={v.oordeel} onChange={(e) => zet('oordeel', e.target.value)}>
            {Object.entries(OORDEEL_LABEL).map(([w, l]) => (
              <option key={w} value={w}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="herkomst" className={label}>Herkomst</label>
          <select id="herkomst" className={invoer} value={v.herkomst} onChange={(e) => zet('herkomst', e.target.value)}>
            {Object.entries(HERKOMST_LABEL).map(([w, l]) => (
              <option key={w} value={w}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={label}>Geldt voor WCAG</legend>
        <div className="flex gap-5">
          {Object.entries(VERSIE_LABEL).map(([w, l]) => (
            <label key={w} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={v.wcag.includes(w)}
                onChange={(e) => zet('wcag', e.target.checked ? [...v.wcag, w] : v.wcag.filter((x) => x !== w))} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <Tekstvak id="onderbouwing" titel="Onderbouwing" waarde={v.onderbouwing} zet={(x) => zet('onderbouwing', x)} rijen={4} />
      <Tekstvak id="omschrijving" titel="Omschrijving" waarde={v.omschrijving} zet={(x) => zet('omschrijving', x)} rijen={3} />
      <Tekstvak id="standaardTekst" titel="Standaardtekst (auditbevinding)" waarde={v.standaardTekst}
        zet={(x) => zet('standaardTekst', x)} rijen={4}
        hulpTekst="Volgens writing/FRITS-WRITING-GUIDE.md. Wordt pas in fase 2 in audits gebruikt." />
      <Tekstvak id="advies" titel="Advies" waarde={v.advies} zet={(x) => zet('advies', x)} rijen={3} />

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="technieken" className={label}>Technieken en failures</label>
          <input id="technieken" className={invoer} value={v.techniekenTekst}
            onChange={(e) => zet('techniekenTekst', e.target.value)} aria-describedby="technieken-hulp" />
          <p id="technieken-hulp" className={hulp}>Met komma&apos;s, bijvoorbeeld F91, H51</p>
        </div>
        <div>
          <label htmlFor="tags" className={label}>Tags</label>
          <input id="tags" className={invoer} value={v.tagsTekst}
            onChange={(e) => zet('tagsTekst', e.target.value)} aria-describedby="tags-hulp" />
          <p id="tags-hulp" className={hulp}>Onderwerpen met komma&apos;s, geen templatenamen</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={bezig}
          className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-60">
          {nieuw ? 'Patroon aanmaken' : 'Opslaan'}
        </button>
        <p role="status" className="text-sm text-green-800">{melding}</p>
      </div>

      {!nieuw && (
        <dialog ref={dialoog} aria-labelledby="vaststellen-titel" className="rounded-lg p-6 max-w-lg backdrop:bg-black/40">
          <h2 id="vaststellen-titel" className="text-lg font-semibold mb-3">Patroon vaststellen</h2>
          <p className="text-sm mb-3">
            Vastgesteld wordt het officiële Shift2-oordeel: <strong>{OORDEEL_LABEL[v.oordeel]}</strong> op{' '}
            {v.criteriaTekst || 'geen criterium'}. Vanaf fase 2 komt het met één klik in audits.
          </p>
          <p className="text-sm mb-4">
            Controleer eerst of het niet botst met het regelbestand van dit criterium in{' '}
            <code>wcag-regels/</code>. Dat bestand is leidend.
          </p>
          <label htmlFor="vaststeller" className={label}>Wie stelt dit vast?</label>
          <input id="vaststeller" className={`${invoer} mb-4`} value={vaststeller}
            onChange={(e) => setVaststeller(e.target.value)} />
          {fouten.length > 0 && (
            <ul role="alert" className="mb-4 list-disc pl-5 text-sm text-red-900">
              {fouten.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" className="px-3 py-2 text-sm" onClick={() => dialoog.current?.close()}>
              Annuleren
            </button>
            <button type="button" disabled={bezig} onClick={stelVast}
              className="bg-shift2-primary text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60">
              Vaststellen
            </button>
          </div>
        </dialog>
      )}
    </form>
  );
}

function Tekstvak({
  id,
  titel,
  waarde,
  zet,
  rijen,
  hulpTekst,
}: {
  id: string;
  titel: string;
  waarde: string;
  zet: (v: string) => void;
  rijen: number;
  hulpTekst?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>{titel}</label>
      <textarea id={id} className={invoer} rows={rijen} value={waarde} onChange={(e) => zet(e.target.value)}
        aria-describedby={hulpTekst ? `${id}-hulp` : undefined} />
      {hulpTekst && <p id={`${id}-hulp`} className={hulp}>{hulpTekst}</p>}
    </div>
  );
}
