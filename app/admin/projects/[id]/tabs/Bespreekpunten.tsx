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
 * Na het gesprek maakt de tool zelf het verslag: de knop "Maak gespreksverslag" stuurt het
 * transcript en de open punten naar de AI (zie docs/werkwijze/gespreksverslag.md). Het
 * verslag komt als notitie bij het onderzoek; de uitkomst per punt komt hier terug als
 * voorstel, dat de onderzoeker per punt overneemt. Pas dan is het punt afgevinkt.
 */

type Voorstel = { id: string; aanBodGekomen: boolean; uitkomst: string };

type Bespreekpunt = {
  id: string;
  tekst: string;
  besprokenOp: string | null;
  uitkomst: string | null;
  createdAt: string;
};

// Alleen wat je anders vergeet. "Open bespreekpunten doornemen" stond er ook, maar die
// staan direct hieronder; daar hoeft geen vinkje aan te herinneren.
const CHECKLIST = ['Teams-transcript aanzetten'];

export default function Bespreekpunten({
  projectId,
  heeftTranscript,
  onNotitie,
}: {
  projectId: string;
  /** Staat er een transcript bij het onderzoek? Zonder transcript valt er geen verslag te maken. */
  heeftTranscript: boolean;
  /** Het verslag komt als notitie; de ouder zet hem in zijn lijst zodat hij meteen zichtbaar is. */
  onNotitie?: (notitie: any) => void;
}) {
  const [punten, setPunten] = useState<Bespreekpunt[]>([]);
  const [verslagBezig, setVerslagBezig] = useState(false);
  const [verslagMelding, setVerslagMelding] = useState<string | null>(null);
  const [voorstellen, setVoorstellen] = useState<Record<string, Voorstel>>({});
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

  const maakVerslag = async () => {
    setVerslagBezig(true);
    setVerslagMelding(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/gespreksverslag`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerslagMelding(data.error || 'Het maken van het verslag is niet gelukt.');
        return;
      }
      onNotitie?.(data.notitie);
      const nieuw: Record<string, Voorstel> = {};
      for (const v of data.voorstellen ?? []) nieuw[v.id] = v;
      setVoorstellen(nieuw);
      setVerslagMelding('Het verslag staat bij Notities, met als auteur "AI-verslag, nog na te kijken". Lees het na; de uitkomsten hieronder zijn voorstellen.');
    } catch {
      setVerslagMelding('Het maken van het verslag is niet gelukt.');
    } finally {
      setVerslagBezig(false);
    }
  };

  /** Voorstel overnemen: uitkomst bewaren én afvinken, in één keer. */
  const neemOver = async (punt: Bespreekpunt) => {
    const v = voorstellen[punt.id];
    if (!v) return;
    await werkBij(punt.id, { besproken: true, uitkomst: v.uitkomst });
    setVoorstellen((rest) => {
      const { [punt.id]: _weg, ...over } = rest;
      return over;
    });
    setAfgehandeldOpen(true);
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
                    {voorstellen[punt.id] && (
                      <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-sm">
                        {voorstellen[punt.id].aanBodGekomen ? (
                          <>
                            <div className="text-xs font-medium text-amber-800 mb-1">Voorgestelde uitkomst uit het transcript</div>
                            <div className="whitespace-pre-wrap text-gray-900">{voorstellen[punt.id].uitkomst}</div>
                            <div className="mt-2 flex gap-3">
                              <button
                                type="button"
                                onClick={() => neemOver(punt)}
                                disabled={bezig === punt.id}
                                className="px-3 py-1 text-xs font-medium text-white bg-shift2-primary rounded hover:opacity-90 disabled:opacity-50"
                              >
                                Overnemen en afvinken
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setVoorstellen((rest) => {
                                    const { [punt.id]: _weg, ...over } = rest;
                                    return over;
                                  })
                                }
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Negeren
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-amber-800">Volgens het transcript niet aan bod gekomen; blijft open.</div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={voegToe} className="flex items-start gap-2 mb-3">
            <textarea
              value={nieuw}
              onChange={(e) => setNieuw(e.target.value)}
              rows={2}
              placeholder="Wat moet je de klant nog vragen of vertellen?"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
            />
            <button
              type="submit"
              disabled={!nieuw.trim() || bezig === 'nieuw'}
              className="px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Toevoegen
            </button>
          </form>
          {/* Na het gesprek. Zonder transcript is de knop uit, met uitleg in de title: de
              knop verbergen zou de stap zelf verbergen. */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={maakVerslag}
              disabled={!heeftTranscript || verslagBezig}
              title={heeftTranscript ? 'Maakt een kort verslag uit het transcript en stelt per punt de uitkomst voor' : 'Plak eerst het transcript van het gesprek, hierboven bij Transcript'}
              className="px-3 py-2 text-sm font-medium text-shift2-primary border border-shift2-primary rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verslagBezig ? 'Verslag wordt gemaakt…' : 'Maak gespreksverslag uit het transcript'}
            </button>
            {!heeftTranscript && <span className="text-xs text-gray-500">Plak eerst het transcript van het gesprek.</span>}
          </div>
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
