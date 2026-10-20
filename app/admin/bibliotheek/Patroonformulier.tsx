'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { herkenSituaties, herkenTechnieken, SITUATIES } from '@/lib/bibliotheek/technieken';
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

export type Voorbeeld = { id: string; titel: string; html: string; correcteCode: string };

const invoer = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm';
const label = 'block text-sm font-medium text-gray-800 mb-1';
const hulp = 'text-xs text-gray-600 mt-1';

/** Oordeel-tabblad van een patroon, en het formulier voor een nieuw patroon. */
export default function Patroonformulier({
  patroon,
  criteria,
  voorbeelden = [],
}: {
  patroon?: PatroonVelden;
  criteria: { code: string; titleNl: string }[];
  voorbeelden?: Voorbeeld[];
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

      <Tekstvak id="onderbouwing" titel="Onderbouwing (waarom het een afkeuring is)" waarde={v.onderbouwing} zet={(x) => zet('onderbouwing', x)} rijen={4} />
      <Tekstvak id="omschrijving" titel="Omschrijving (wat het patroon is)" waarde={v.omschrijving} zet={(x) => zet('omschrijving', x)} rijen={3} />
      {voorbeelden.length > 0 && <VoorbeeldCode voorbeelden={voorbeelden} />}
      {v.criteriaTekst.split(/[,\s]+/).includes('1.1.1') && <WaarKanAlt />}
      {/\bF72\b/.test(v.techniekenTekst) && <WatIsAsciiArt />}
      {/\bG143\b/.test(v.techniekenTekst) && <WatIsCaptcha />}
      {/\bG100\b/.test(v.techniekenTekst) && <WatIsZintuiglijk />}
      {/\bC7\b/.test(v.techniekenTekst) && <WatZijnSpanEnDiv />}
      <Tekstvak id="standaardTekst" titel="Standaardtekst (auditbevinding)" waarde={v.standaardTekst}
        zet={(x) => zet('standaardTekst', x)} rijen={4}
        hulpTekst="Volgens writing/FRITS-WRITING-GUIDE.md. Wordt pas in fase 2 in audits gebruikt." />
      <Tekstvak id="advies" titel="Advies (wat de redacteur moet doen)" waarde={v.advies} zet={(x) => zet('advies', x)} rijen={3} />

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="technieken" className={label}>Technieken en failures</label>
          <input id="technieken" className={invoer} value={v.techniekenTekst}
            onChange={(e) => zet('techniekenTekst', e.target.value)} aria-describedby="technieken-hulp" />
          <p id="technieken-hulp" className={hulp}>Met komma&apos;s, bijvoorbeeld F91, H51</p>
          {herkenTechnieken(v.techniekenTekst).length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-800" aria-label="Uitleg bij de technieken">
              {herkenTechnieken(v.techniekenTekst).map((t) => (
                <li key={t.code}>
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-800 underline">
                    {t.code}<span className="sr-only"> (opent in nieuw tabblad)</span>
                  </a>
                  {' '}<span className="text-gray-600">({t.soort})</span>{': '}{t.uitleg}
                </li>
              ))}
            </ul>
          )}
          {v.criteriaTekst.split(/[,\s]+/).includes('1.1.1') && (
          <details open className="mt-3 text-sm text-gray-800">
            <summary className="cursor-pointer font-semibold">Situaties van W3C bij 1.1.1</summary>
            <p className={hulp}>
              W3C verdeelt de technieken voor 1.1.1 in situaties. &quot;Situatie A&quot; in het veld verwijst hiernaar.
              {herkenSituaties(v.techniekenTekst).length > 0 &&
                ` Genoemd bij dit patroon: ${herkenSituaties(v.techniekenTekst).map((x) => x.letter).join(', ')}.`}
            </p>
            <table className="mt-2 w-full border-collapse text-left">
              <caption className="sr-only">Situaties A tot en met F bij succescriterium 1.1.1</caption>
              <thead>
                <tr className="border-b border-gray-300">
                  <th scope="col" className="py-1 pr-2">Situatie</th>
                  <th scope="col" className="py-1 pr-2">Wanneer</th>
                  <th scope="col" className="py-1">Techniek</th>
                </tr>
              </thead>
              <tbody>
                {SITUATIES.map((x) => {
                  const genoemd = herkenSituaties(v.techniekenTekst).some((g) => g.letter === x.letter);
                  return (
                    <tr key={x.letter} className={`border-b border-gray-200 align-top ${genoemd ? 'bg-yellow-50 font-semibold' : ''}`}>
                      <th scope="row" className="py-1 pr-2">{x.letter}</th>
                      <td className="py-1 pr-2">{x.wanneer}</td>
                      <td className="py-1">{x.techniek}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </details>
          )}
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
  const delen = titel.match(/^(.*?)( \(.*\))?$/);
  const naam = delen?.[1] ?? titel;
  const toelichting = delen?.[2];
  return (
    <div>
      <label htmlFor={id} className={label}>
        {naam}{toelichting && <span className="font-normal text-gray-600">{toelichting}</span>}
      </label>
      <textarea id={id} className={invoer} rows={rijen} value={waarde} onChange={(e) => zet(e.target.value)}
        aria-describedby={hulpTekst ? `${id}-hulp` : undefined} />
      {hulpTekst && <p id={`${id}-hulp`} className={hulp}>{hulpTekst}</p>}
    </div>
  );
}

/** De code van de casussen, om te lezen onder de omschrijving. Bewerken gaat op het tabblad Casussen. */
function VoorbeeldCode({ voorbeelden }: { voorbeelden: Voorbeeld[] }) {
  const [eerste, ...rest] = voorbeelden;
  return (
    <div className="space-y-3">
      <Casuscode voorbeeld={eerste} />
      {rest.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-800">
            Nog {rest.length} {rest.length === 1 ? 'casus' : 'casussen'}
          </summary>
          <div className="mt-3 space-y-4">
            {rest.map((c) => <Casuscode key={c.id} voorbeeld={c} />)}
          </div>
        </details>
      )}
    </div>
  );
}

function Casuscode({ voorbeeld }: { voorbeeld: Voorbeeld }) {
  const blok = 'overflow-x-auto rounded-md border border-gray-300 bg-gray-50 p-3 text-xs';
  return (
    <section aria-label={`Code van casus ${voorbeeld.id}`}>
      <p className="text-sm font-medium text-gray-800">
        Voorbeeld uit casus {voorbeeld.id}
        <span className="font-normal text-gray-600"> ({voorbeeld.titel})</span>
      </p>
      <p className={hulp}>{voorbeeld.correcteCode.trim() !== '' ? 'Fout' : 'Code (zonder fout)'}</p>
      <pre className={blok}><code>{voorbeeld.html}</code></pre>
      {voorbeeld.correcteCode.trim() !== '' && (
        <>
          <p className={hulp}>Goed</p>
          <pre className={blok}><code>{voorbeeld.correcteCode}</code></pre>
        </>
      )}
    </section>
  );
}

const ALT_REGELS: { element: string; kan: boolean; uitleg: string }[] = [
  { element: '<img>', kan: true, uitleg: 'Het alt-attribuut is het tekstalternatief van de afbeelding.' },
  { element: '<input type="image">', kan: true, uitleg: 'Een knop die uit een afbeelding bestaat. Het alt-attribuut is de naam van de knop.' },
  { element: '<area>', kan: true, uitleg: 'Een klikbaar gebied in een afbeeldingskaart. Het alt-attribuut is de naam van de link.' },
  { element: '<svg>', kan: false, uitleg: 'Geen alt. Gebruik role="img" met een aria-label of een title, of aria-hidden="true" bij versiering.' },
  { element: 'Tekstveld, keuzelijst, selectievakje', kan: false, uitleg: 'Geen alt. De naam komt van een label-element of een aria-label.' },
  { element: '<button>', kan: false, uitleg: 'Geen alt op de knop. De naam komt uit de tekst in de knop. Staat er een img in de knop, dan heeft die img het alt-attribuut.' },
];

/** Vaste uitleg bij patronen over 1.1.1: op welke elementen werkt het alt-attribuut wel en niet. */
function WaarKanAlt() {
  return (
    <details open className="text-sm text-gray-800">
      <summary className="cursor-pointer font-semibold">Waar kan het alt-attribuut wel en niet?</summary>
      <table className="mt-2 w-full border-collapse text-left">
        <caption className="sr-only">Elementen waarop het alt-attribuut wel of niet werkt</caption>
        <thead>
          <tr className="border-b border-gray-300">
            <th scope="col" className="py-1 pr-2">Element</th>
            <th scope="col" className="py-1 pr-2">Alt</th>
            <th scope="col" className="py-1">Uitleg</th>
          </tr>
        </thead>
        <tbody>
          {ALT_REGELS.map((r) => (
            <tr key={r.element} className="border-b border-gray-200 align-top">
              <th scope="row" className="py-1 pr-2 font-mono text-xs font-semibold">{r.element}</th>
              <td className="py-1 pr-2">{r.kan ? 'Kan' : 'Kan niet'}</td>
              <td className="py-1">{r.uitleg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

const ASCII_VOORBEELD = `   Stadhuis
      |
      |  200 m
      v
 Parkeergarage`;

/** Vaste uitleg bij patronen met F72: wat ASCII-art is en waarom een schermlezer er niets aan heeft. */
function WatIsAsciiArt() {
  return (
    <details open className="text-sm text-gray-800">
      <summary className="cursor-pointer font-semibold">Wat is ASCII-art?</summary>
      <div className="mt-2 space-y-2">
        <p>
          Een tekening die is gemaakt met letters, cijfers en leestekens van het toetsenbord. Er is geen
          afbeeldingsbestand: je ziet de tekening doordat de tekens op een bepaalde manier onder elkaar staan.
        </p>
        <p className={hulp}>Voorbeeld: een route van het stadhuis naar de parkeergarage.</p>
        <pre className="overflow-x-auto rounded-md border border-gray-300 bg-gray-50 p-3 text-xs"><code>{ASCII_VOORBEELD}</code></pre>
        <p>
          <span className="font-semibold">Wat ziet een kijker?</span> Een pijl naar beneden, van het stadhuis naar
          de parkeergarage.
        </p>
        <p>
          <span className="font-semibold">Wat hoort een schermlezer?</span> &quot;Stadhuis, streepje, streepje,
          200 m, v, Parkeergarage&quot;. De losse tekens, en niet wat de tekening betekent.
        </p>
        <p>
          <span className="font-semibold">Waarom is dat een fout?</span> Bij een afbeelding kun je een alt opgeven.
          Bij ASCII-art is er alleen tekst op de pagina, dus er is geen plek voor een tekstalternatief. W3C noemt dit
          fout F72.
        </p>
      </div>
    </details>
  );
}

/** Vaste uitleg bij patronen met G143: wat een CAPTCHA is en wat 1.1.1 ervan vraagt. */
function WatIsCaptcha() {
  return (
    <details open className="text-sm text-gray-800">
      <summary className="cursor-pointer font-semibold">Wat is een CAPTCHA?</summary>
      <div className="mt-2 space-y-2">
        <p>
          Een controle die nagaat of de bezoeker een mens is en geen programma. Meestal moet de bezoeker de tekens
          uit een vervormde afbeelding overtypen, of plaatjes aanwijzen.
        </p>
        <p className={hulp}>Voorbeeld: een afbeelding met een code en een invoerveld.</p>
        <pre className="overflow-x-auto rounded-md border border-gray-300 bg-gray-50 p-3 text-xs"><code>{`<img src="captcha.php" alt="captcha">
<label for="code">Code</label>
<input type="text" id="code">`}</code></pre>
        <p>
          <span className="font-semibold">Waarom is dit lastig?</span> De afbeelding is bedoeld om niet door een
          programma gelezen te worden. Daardoor kan ook een schermlezer hem niet lezen. Wie niet kan zien, komt het
          formulier niet door.
        </p>
        <p>
          <span className="font-semibold">Wat vraagt 1.1.1?</span> Twee dingen samen. Het tekstalternatief noemt het
          doel, en niet de inhoud van de afbeelding (G143). En er is een alternatieve vorm voor een andere zintuiglijke
          waarneming, zoals een audiocode (G144).
        </p>
      </div>
    </details>
  );
}

/** Vaste uitleg bij patronen met G100: wat zintuiglijke inhoud is (W3C Situatie D bij 1.1.1). */
function WatIsZintuiglijk() {
  return (
    <details open className="text-sm text-gray-800">
      <summary className="cursor-pointer font-semibold">Wat is zintuiglijke inhoud?</summary>
      <div className="mt-2 space-y-2">
        <p>
          Inhoud die bedoeld is om te zien, te horen of te ervaren, en die niet volledig in woorden te vangen is.
          W3C noemt dit &quot;Situatie D&quot; bij 1.1.1.
        </p>
        <ul className="list-disc pl-5">
          <li>Een kunstwerk, zoals een schilderij of een foto die als kunst wordt getoond.</li>
          <li>Tijdgebonden media, zoals een geluidsfragment of een video.</li>
          <li>Een toets of oefening die niet zou werken als je hem in tekst zet, zoals een gehoortest.</li>
        </ul>
        <p>
          <span className="font-semibold">Wat is het verschil met versiering?</span> Versiering mag een lege alt
          krijgen, want er gaat niets verloren. Zintuiglijke inhoud is er om beleefd te worden, dus een lege alt laat
          de gebruiker het werk missen.
        </p>
        <p>
          <span className="font-semibold">Wat vraagt 1.1.1?</span> Minimaal een beschrijvende naam, zoals de titel en
          de maker (G100). Een uitgebreidere beschrijving is een aanvulling waar dat kan.
        </p>
      </div>
    </details>
  );
}

/** Vaste uitleg bij patronen met C7: wat een span en een div zijn en waarom ze geen aria-label kunnen dragen. */
function WatZijnSpanEnDiv() {
  return (
    <details open className="text-sm text-gray-800">
      <summary className="cursor-pointer font-semibold">Wat zijn een span en een div?</summary>
      <div className="mt-2 space-y-2">
        <p>
          Twee neutrale bouwstenen van een webpagina. Ze hebben geen betekenis: ze dienen om een stuk pagina te
          groeperen of op te maken.
        </p>
        <ul className="list-disc pl-5">
          <li><span className="font-mono text-xs font-semibold">&lt;span&gt;</span>: een stukje binnen een regel tekst, bijvoorbeeld om één woord een kleur te geven of een pictogram neer te zetten.</li>
          <li><span className="font-mono text-xs font-semibold">&lt;div&gt;</span>: een blok op een eigen regel, bijvoorbeeld om een groep onderdelen bij elkaar te houden.</li>
        </ul>
        <p className={hulp}>Voorbeeld uit casus SWK-S2: een span met een pictogram en een aria-label.</p>
        <pre className="overflow-x-auto rounded-md border border-gray-300 bg-gray-50 p-3 text-xs"><code>{`<a href="#">Bekijk de afvalkalender<span class="ext-icon" aria-label="Externe link"></span></a>`}</code></pre>
        <p>
          <span className="font-semibold">Wat is een rol?</span> Een rol zegt wat iets is, zoals knop, link of
          afbeelding. Een schermlezer kondigt het element daarmee aan. Een span en een div hebben geen rol, in
          ARIA heten ze &quot;generiek&quot;.
        </p>
        <p>
          <span className="font-semibold">Waarom werkt het aria-label dan niet?</span> Een aria-label is een naam voor
          iets met een rol. ARIA staat het niet toe op een element zonder rol. Browsers en schermlezers negeren het
          daarom vaak, en de informatie gaat verloren.
        </p>
        <p className="font-semibold">Zo lees je het voorbeeld Goed</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li><span className="font-mono text-xs font-semibold">&lt;a href=&quot;https://...&quot;&gt;</span>: de link.</li>
          <li>&quot;Bekijk de afvalkalender&quot;: de zichtbare tekst van de link.</li>
          <li>
            <span className="font-mono text-xs font-semibold">aria-hidden=&quot;true&quot;</span> op het pictogram:
            schermlezers slaan het over. Je ziet het pictogram nog wel.
          </li>
          <li>
            <span className="font-mono text-xs font-semibold">visually-hidden</span> op de tekst &quot;(externe
            website)&quot;: de tekst is niet te zien, maar een schermlezer leest hem wel voor.
          </li>
        </ol>
        <p>
          <span className="font-semibold">Wat ziet een kijker?</span> &quot;Bekijk de afvalkalender&quot; met een
          pijltje erachter.
        </p>
        <p>
          <span className="font-semibold">Wat hoort een schermlezer?</span> &quot;Bekijk de afvalkalender, externe
          website&quot;. Het pictogram wordt overgeslagen en de informatie komt uit de verborgen tekst.
        </p>
        <p className={hulp}>
          &quot;visually-hidden&quot; is de naam van een stukje opmaak (CSS) dat tekst onzichtbaar maakt voor ogen
          maar niet voor schermlezers. Dat is W3C-techniek C7.
        </p>
      </div>
    </details>
  );
}
