'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Bespreekpunten voor het klantgesprek, op het tabblad Details.
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
 * Het gespreksverslag maakt de onderzoeker buiten de tool, in een Claude Code-sessie, en
 * plakt hij hier; het komt als notitie bij het onderzoek. Hier zat een knop die het
 * transcript naar OpenAI stuurde, maar een gesprek met een klant gaat niet naar een
 * externe dienst omdat het verslag dan sneller klaar is. De werkwijze in
 * docs/werkwijze/gespreksverslag.md blijft gelden; die is nu een instructie voor wie het
 * verslag schrijft.
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
// dan vertel je na afloop wat er is besproken en maak je daar het verslag van.
const CHECKLIST = ['Teams-transcript aanzetten'];

export default function Bespreekpunten({
  projectId,
  onNotitie,
}: {
  projectId: string;
  /** Het verslag komt als notitie; de ouder zet hem in zijn lijst zodat hij meteen zichtbaar is. */
  onNotitie?: (notitie: any) => void;
}) {
  const [punten, setPunten] = useState<Bespreekpunt[]>([]);
  const [gekopieerd, setGekopieerd] = useState(false);
  const [verslagBezig, setVerslagBezig] = useState(false);
  const [verslagMelding, setVerslagMelding] = useState<string | null>(null);
  const [verslagOpen, setVerslagOpen] = useState(false);
  const [verslagTekst, setVerslagTekst] = useState('');
  const [geladen, setGeladen] = useState(false);
  const [nieuw, setNieuw] = useState('');
  const [bezig, setBezig] = useState<string | null>(null);
  const [uitkomstOpen, setUitkomstOpen] = useState<string | null>(null);
  const [uitkomstTekst, setUitkomstTekst] = useState('');
  const [afgehandeldOpen, setAfgehandeldOpen] = useState(false);

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
   * Het verslag komt van buiten: geplakt uit een Claude Code-sessie, of zelf geschreven.
   *
   * Hier stond een knop die het transcript naar OpenAI stuurde. Dat willen we niet meer:
   * een gesprek met een klant gaat niet naar een externe dienst omdat het verslag dan
   * sneller klaar is. De werkwijze in docs/werkwijze/gespreksverslag.md blijft gelden --
   * die is nu alleen een instructie voor wie het verslag maakt, niet meer voor een knop.
   */
  const bewaarVerslag = async () => {
    const tekst = verslagTekst.trim();
    if (!tekst) return;
    setVerslagBezig(true);
    setVerslagMelding(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ authorName: 'Gespreksverslag', content: tekst }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerslagMelding('Het bewaren van het verslag is niet gelukt.');
        return;
      }
      onNotitie?.(data);
      setVerslagTekst('');
      setVerslagOpen(false);
      setVerslagMelding('Het verslag staat bij Notities. Vink de punten hieronder zelf af met de uitkomst.');
    } catch {
      setVerslagMelding('Het bewaren van het verslag is niet gelukt.');
    } finally {
      setVerslagBezig(false);
    }
  };

  /**
   * De opdracht die de onderzoeker kopieert en met zijn transcript in een Claude Code-sessie
   * plakt. Het projectId staat erin, want daarmee zijn de bespreekpunten, de scopevelden en
   * de projectgegevens op te halen; zonder dat moet de sessie eerst gaan zoeken welk
   * onderzoek bedoeld wordt. De werkwijze staat in het doc en niet hier: twee plekken met
   * dezelfde regels lopen uit elkaar.
   */
  const opdracht = [
    'Maak een gespreksverslag van het transcript hieronder.',
    '',
    `Onderzoek: ${projectId}`,
    '',
    'Volg docs/werkwijze/gespreksverslag.md. Haal de open bespreekpunten en de',
    'projectgegevens zelf op met dat id. Leg de opties voor scope en steekproef aan mij',
    'voor voordat je iets wegschrijft.',
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

  const datum = (iso: string) => format(new Date(iso), 'd MMMM yyyy', { locale: nl });

  return (
    <div id="bespreekpunten" className="bg-white rounded-lg border border-gray-200 scroll-mt-4">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Bespreekpunten voor het klantgesprek</h3>
        </div>
        {open.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {open.length} open
          </span>
        )}
      </div>

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
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Te bespreken{geladen && open.length === 0 ? ': niets open' : ''}
          </h4>
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
                    <div className="text-xs text-gray-400">toegevoegd {datum(punt.createdAt)}</div>
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
              <strong className="font-medium">Gespreksverslag maken.</strong> Kopieer de
              opdracht hieronder, plak hem in een Claude Code-sessie en zet je transcript
              eronder. Je krijgt het verslag terug, plus de uitkomst per bespreekpunt.
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
              besproken; daar is net zo goed een verslag van te maken.
            </p>
          </div>
          {/* Het verslag maak je buiten de tool en plak je hier. Zie de uitleg hieronder. */}
          {verslagOpen ? (
            <div>
              <label htmlFor="verslag-plak" className="block text-sm font-medium text-gray-700 mb-1">
                Gespreksverslag
              </label>
              <textarea
                id="verslag-plak"
                rows={12}
                value={verslagTekst}
                onChange={(e) => setVerslagTekst(e.target.value)}
                autoFocus
                placeholder="Plak hier het gespreksverslag. Markdown mag: ## voor een kop, ** ** voor vet."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={bewaarVerslag}
                  disabled={verslagBezig || !verslagTekst.trim()}
                  className="px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verslagBezig ? 'Bewaren…' : 'Verslag bewaren'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerslagOpen(false);
                    setVerslagTekst('');
                  }}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm text-gray-700">
                <strong className="font-medium">Verslag terug?</strong> Plak het hier; het komt
                bij Notities te staan.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Vink de punten hieronder zelf af met de uitkomst: wat er met de klant is
                afgesproken, bepaal je zelf.
              </p>
              <button
                type="button"
                onClick={() => setVerslagOpen(true)}
                className="mt-2 px-3 py-2 text-sm font-medium text-shift2-primary border border-shift2-primary rounded-lg hover:bg-white"
              >
                Gespreksverslag plakken
              </button>
            </div>
          )}
          {verslagMelding && <p className="mt-2 text-sm text-gray-700">{verslagMelding}</p>}
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
    </div>
  );
}
