'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Bespreekpunten voor het scopegesprek, op het tabblad Details.
 *
 * Een vraag die je de klant nog moet stellen stond tot nu toe in Projectdetails of in een
 * notitie, en geen van beide komt ergens als actie terug. Hier staat hij met een vinkje:
 * open punten tellen mee op het dashboard en in de onderzoekenlijst, afgevinkte punten
 * blijven staan met datum en uitkomst, zodat later terug te vinden is wat er wanneer
 * met de klant is afgestemd. Verwijderen kan daarom niet.
 *
 * Bovenaan een vaste checklist voor elk gesprek. Die vinkjes worden niet bewaard: ze zijn
 * per gesprek en staan weer leeg als je het blok opnieuw opent.
 *
 * Wat er met de klant is afgesproken staat hier, bij de punten zelf, en nergens anders.
 * Er stond een knop die het hele gespreksverslag als notitie bewaarde; die is op
 * 16 september 2026 weggehaald. Dat verslag herhaalde grotendeels de uitkomsten die hier
 * al stonden, en van twee plekken met dezelfde afspraken wordt er één niet meer gelezen.
 * De uitkomst bij het punt is de plek die je bij een volgend gesprek terugpakt.
 *
 * Eerder zat hier een knop die het transcript naar OpenAI stuurde; die ging weg omdat een
 * gesprek met een klant niet naar een externe dienst hoort. De werkwijze staat in
 * docs/werkwijze/gespreksverslag.md en is een instructie voor wie de uitkomsten opstelt.
 *
 * Het transcript zelf komt de tool niet meer in. Het ging hier in een veld, en een leeg
 * veld was daarmee een ontbrekende stap -- ook als er niets te plakken viel omdat het
 * Teams-transcript niet aanstond. Dat hield een onderzoek eindeloos op "transcript
 * toevoegen". Nu staat hier alleen de opdracht om te kopiëren; die plak je met het
 * transcript in de chat, en het transcript blijft waar het al was.
 *
 * De uitkomst per punt vult de onderzoeker zelf in.
 */

type Bespreekpunt = {
  id: string;
  tekst: string;
  besprokenOp: string | null;
  uitkomst: string | null;
  createdAt: string;
};

// Alleen wat je anders vergeet. "Open bespreekpunten doornemen" stond er ook, maar die
// staan direct hieronder; daar hoeft geen vinkje aan te herinneren.
//
// Het vinkje blijft een herinnering vooraf, maar is geen voorwaarde meer: vergeet je het,
// dan vertel je na afloop wat er is besproken en stel je daar de uitkomsten uit op.
const CHECKLIST = ['Teams-transcript aanzetten'];

export default function Bespreekpunten({
  projectId,
  scopeCallHeld,
}: {
  projectId: string;
  /** Wanneer het scopegesprek is gevoerd; leeg als het nog moet komen. */
  scopeCallHeld?: Date | string | null;
}) {
  const [punten, setPunten] = useState<Bespreekpunt[]>([]);
  const [gekopieerd, setGekopieerd] = useState(false);
  const [geladen, setGeladen] = useState(false);
  const [nieuw, setNieuw] = useState('');
  const [bezig, setBezig] = useState<string | null>(null);
  const [uitkomstOpen, setUitkomstOpen] = useState<string | null>(null);
  const [uitkomstTekst, setUitkomstTekst] = useState('');
  const [afgehandeldOpen, setAfgehandeldOpen] = useState(false);
  /**
   * Is het gesprek gevoerd en staat er niets meer open, dan klapt het blok dicht tot één
   * regel. Anders staat er een invulveld voor een gesprek dat geweest is, met een kopje
   * "Te bespreken: niets open" erboven.
   *
   * Uitklappen kan altijd: er komt een tussencheck, en soms een tweede gesprek.
   */
  const [blokOpen, setBlokOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/bespreekpunten`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lijst) => setPunten(Array.isArray(lijst) ? lijst : []))
      .catch(() => setPunten([]))
      .finally(() => setGeladen(true));
  }, [projectId]);

  // Komt de bezoeker via de link op het dashboard (#bespreekpunten), zet het blok dan in
  // beeld nadat de lijst er staat. De browser springt bij het laden al naar het anker,
  // maar de notities en de gerelateerde onderzoeken erboven laden daarna nog in en
  // duwen het blok weer uit beeld.
  useEffect(() => {
    if (geladen && window.location.hash === '#bespreekpunten') {
      document.getElementById('bespreekpunten')?.scrollIntoView({ block: 'start' });
    }
  }, [geladen]);

  const open = punten.filter((p) => !p.besprokenOp);
  const afgehandeld = punten.filter((p) => p.besprokenOp);

  const werkBij = async (id: string, body: Record<string, unknown>) => {
    setBezig(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/bespreekpunten/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        alert('Het bijwerken van het bespreekpunt is niet gelukt.');
        return;
      }
      const punt: Bespreekpunt = await res.json();
      setPunten((lijst) => lijst.map((p) => (p.id === punt.id ? punt : p)));
    } finally {
      setBezig(null);
    }
  };

  /**
   * Een open punt weghalen. Alleen open: de route weigert een afgevinkt punt, want dat
   * legt vast wat er met de klant is afgestemd.
   *
   * Voor een punt dat er niet had moeten staan -- verkeerd geformuleerd, dubbel, of door
   * een agent aangemaakt zonder dat erom gevraagd was. Bevestigen hoeft niet: een open
   * punt is een aantekening vooraf, en opnieuw typen kost één regel.
   */
  const verwijder = async (punt: Bespreekpunt) => {
    setBezig(punt.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/bespreekpunten/${punt.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Het verwijderen van het bespreekpunt is niet gelukt.');
        return;
      }
      setPunten((lijst) => lijst.filter((p) => p.id !== punt.id));
    } finally {
      setBezig(null);
    }
  };

  const voegToe = async (e: React.FormEvent) => {
    e.preventDefault();
    const tekst = nieuw.trim();
    if (!tekst) return;
    setBezig('nieuw');
    try {
      const res = await fetch(`/api/projects/${projectId}/bespreekpunten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tekst }),
      });
      if (!res.ok) {
        alert('Het toevoegen van het bespreekpunt is niet gelukt.');
        return;
      }
      const punt: Bespreekpunt = await res.json();
      setPunten((lijst) => [...lijst, punt]);
      setNieuw('');
    } finally {
      setBezig(null);
    }
  };

  /**
   * Afvinken gaat in twee stappen: eerst het vinkje, dan een veld voor de uitkomst dat
   * openklapt. De uitkomst is niet verplicht -- soms is het antwoord "komt nog" -- maar
   * het veld staat er wel meteen, want na het gesprek is het moment om het op te
   * schrijven, niet een week later.
   */
  const vinkAf = async (punt: Bespreekpunt) => {
    await werkBij(punt.id, { besproken: true });
    setUitkomstOpen(punt.id);
    setUitkomstTekst(punt.uitkomst ?? '');
    setAfgehandeldOpen(true);
  };

  const bewaarUitkomst = async (id: string) => {
    await werkBij(id, { uitkomst: uitkomstTekst });
    setUitkomstOpen(null);
  };

  /**
   * De opdracht die de onderzoeker kopieert en met zijn transcript in een Claude Code-sessie
   * plakt. Het projectId staat erin, want daarmee zijn de bespreekpunten, de scopevelden en
   * de projectgegevens op te halen; zonder dat moet de sessie eerst gaan zoeken welk
   * onderzoek bedoeld wordt. De werkwijze staat in het doc en niet hier: twee plekken met
   * dezelfde regels lopen uit elkaar.
   *
   * Wat eruit komt staat in de chat: de uitkomst per punt, en de afspraken die uit het
   * gesprek volgen. Die schaaf je daar bij en plak je zelf -- de uitkomsten hieronder bij
   * het punt, de afspraken in het blok "Afgesproken met de klant". De sessie schrijft
   * niets weg, want wat er met de klant is afgesproken bepaal jij.
   */
  const opdracht = [
    'Verwerk het gesprek in het transcript hieronder.',
    '',
    `Onderzoek: ${projectId}`,
    '',
    'Volg docs/werkwijze/gespreksverslag.md. Haal de open bespreekpunten en de',
    'projectgegevens zelf op met dat id. Geef in de chat: de uitkomst per bespreekpunt,',
    'de afspraken die eruit komen (met bij wie het ligt en wanneer het af moet), en de',
    'opties voor scope en steekproef. Schrijf niets weg.',
    '',
    '--- transcript ---',
  ].join('\n');

  const kopieerOpdracht = async () => {
    try {
      await navigator.clipboard.writeText(opdracht);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 3000);
    } catch {
      // Kopiëren kan geweigerd worden (geen https, of de browser vraagt erom). Het blok
      // staat zichtbaar op het scherm, dus met de hand selecteren werkt dan nog.
      setGekopieerd(false);
      alert('Kopiëren is niet gelukt. Selecteer de tekst hierboven en kopieer hem met Ctrl+C.');
    }
  };

  const datum = (iso: string | Date) => format(new Date(iso), 'd MMMM yyyy', { locale: nl });

  // Klaar: het gesprek is gevoerd en er staat niets meer open. Dan is dit blok een
  // afgesloten hoofdstuk en hoeft het niet open te staan.
  const klaar = Boolean(scopeCallHeld) && geladen && open.length === 0;
  const toon = !klaar || blokOpen;

  return (
    <div id="bespreekpunten" className="bg-white rounded-lg border border-gray-200 scroll-mt-4">
      <div className={`p-4 flex items-center justify-between ${toon ? 'border-b border-gray-200' : ''}`}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {klaar ? (
            <button
              type="button"
              onClick={() => setBlokOpen(!blokOpen)}
              aria-expanded={blokOpen}
              className="flex items-baseline gap-2 text-left hover:underline"
            >
              <h3 className="font-semibold text-gray-900">Scopegesprek</h3>
              <span className="text-sm text-gray-500">
                gevoerd op {datum(scopeCallHeld!)}
              </span>
              <span aria-hidden="true" className="text-gray-400">{blokOpen ? '▾' : '▸'}</span>
            </button>
          ) : (
            <h3 className="font-semibold text-gray-900">Scopegesprek</h3>
          )}
        </div>
        {open.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {open.length} open
          </span>
        )}
      </div>

      {toon && (
      <div className="p-4 space-y-5">
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Voor elk gesprek</h4>
          <ul className="space-y-1">
            {CHECKLIST.map((item) => (
              <li key={item}>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded border-gray-300 text-shift2-primary focus:ring-shift2-primary" />
                  {item}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {/* Geen kopje boven de lijst: het formulier eronder zegt al waar deze lijst voor
              is, en dat er niets openstaat zie je aan de lege lijst. */}
          {open.length > 0 && (
            <ul className="space-y-2 mb-3">
              {open.map((punt) => (
                <li key={punt.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={bezig === punt.id}
                    onChange={() => vinkAf(punt)}
                    aria-label={`Afvinken: ${punt.tekst}`}
                    className="mt-1 rounded border-gray-300 text-shift2-primary focus:ring-shift2-primary"
                  />
                  <div className="flex-1 text-sm text-gray-900">
                    <div className="whitespace-pre-wrap">{punt.tekst}</div>
                    <div className="text-xs text-gray-400">
                      toegevoegd {datum(punt.createdAt)}
                      {' · '}
                      <button
                        type="button"
                        onClick={() => verwijder(punt)}
                        disabled={bezig === punt.id}
                        className="text-gray-400 hover:text-red-700 hover:underline disabled:opacity-50"
                      >
                        verwijderen
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* Het veld is voor een nieuw punt; zonder kop las het als een zoekveld of een
              notitieveld. De placeholder geeft een voorbeeld in plaats van een vraag. */}
          <form onSubmit={voegToe}>
            <label htmlFor="nieuw-bespreekpunt" className="block text-sm font-medium text-gray-700 mb-1">
              Nieuw bespreekpunt
            </label>
            <div className="flex items-start gap-2">
              <textarea
                id="nieuw-bespreekpunt"
                value={nieuw}
                onChange={(e) => setNieuw(e.target.value)}
                rows={2}
                placeholder="Bijvoorbeeld: Is er een testomgeving met DigiD-testaccounts, en wat is de URL?"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
              />
              <button
                type="submit"
                disabled={!nieuw.trim() || bezig === 'nieuw'}
                className="px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                Bespreekpunt toevoegen
              </button>
            </div>
          </form>
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Na het gesprek</h4>
          {/* Het transcript komt de tool niet in: je plakt het met deze opdracht in een
              Claude Code-sessie. Daarom staat hier geen veld meer voor, en blokkeert een
              vergeten Teams-transcript het onderzoek niet langer. */}
          <div className="mb-3 rounded-md bg-gray-50 border border-gray-200 p-3">
            <p className="text-sm text-gray-700">
              <strong className="font-medium">Gesprek verwerken.</strong> Kopieer de
              opdracht hieronder, plak hem in een Claude Code-sessie en zet je transcript
              eronder. Je krijgt de uitkomst per bespreekpunt terug, plus de afspraken die
              eruit komen. De uitkomsten plak je hieronder bij het punt, de afspraken in
              het blok Afgesproken met de klant.
            </p>
            <pre className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-700 whitespace-pre-wrap font-mono">
{opdracht}
            </pre>
            <button
              type="button"
              onClick={kopieerOpdracht}
              className="mt-2 px-3 py-2 text-sm font-medium text-shift2-primary border border-shift2-primary rounded-lg hover:bg-white"
            >
              {gekopieerd ? 'Gekopieerd' : 'Opdracht kopiëren'}
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Geen transcript, omdat het opnemen niet aanstond? Vertel in de sessie wat er is
              besproken; daar zijn de uitkomsten net zo goed uit op te stellen.
            </p>
          </div>
        </div>

        {afgehandeld.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setAfgehandeldOpen(!afgehandeldOpen)}
              aria-expanded={afgehandeldOpen}
              className="text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-900"
            >
              <span className="mr-1 inline-block text-gray-400">{afgehandeldOpen ? '▾' : '▸'}</span>
              Besproken ({afgehandeld.length})
            </button>
            {afgehandeldOpen && (
              <ul className="mt-2 space-y-3">
                {afgehandeld.map((punt) => (
                  <li key={punt.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked
                      disabled={bezig === punt.id}
                      onChange={() => werkBij(punt.id, { besproken: false })}
                      aria-label={`Weer openzetten: ${punt.tekst}`}
                      className="mt-1 rounded border-gray-300 text-shift2-primary focus:ring-shift2-primary"
                    />
                    <div className="flex-1 text-sm">
                      <div className="text-gray-500 line-through whitespace-pre-wrap">{punt.tekst}</div>
                      <div className="text-xs text-gray-400">besproken {datum(punt.besprokenOp!)}</div>
                      {uitkomstOpen === punt.id ? (
                        <div className="mt-2 flex items-start gap-2">
                          <textarea
                            value={uitkomstTekst}
                            onChange={(e) => setUitkomstTekst(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder="Wat is er afgesproken?"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                          />
                          <button
                            type="button"
                            onClick={() => bewaarUitkomst(punt.id)}
                            disabled={bezig === punt.id}
                            className="px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 disabled:opacity-50"
                          >
                            Bewaren
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 text-gray-900">
                          {punt.uitkomst ? (
                            <span className="whitespace-pre-wrap">{punt.uitkomst}</span>
                          ) : (
                            <span className="text-gray-400">geen uitkomst vastgelegd</span>
                          )}{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setUitkomstOpen(punt.id);
                              setUitkomstTekst(punt.uitkomst ?? '');
                            }}
                            className="text-xs text-shift2-primary hover:underline"
                          >
                            {punt.uitkomst ? 'wijzigen' : 'uitkomst toevoegen'}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
