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
 */

type Bespreekpunt = {
  id: string;
  tekst: string;
  besprokenOp: string | null;
  uitkomst: string | null;
  createdAt: string;
};

const CHECKLIST = ['Teams-transcript aanzetten', 'Open bespreekpunten doornemen'];

export default function Bespreekpunten({ projectId }: { projectId: string }) {
  const [punten, setPunten] = useState<Bespreekpunt[]>([]);
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

  const datum = (iso: string) => format(new Date(iso), 'd MMMM yyyy', { locale: nl });

  return (
    <div className="bg-white rounded-lg border border-gray-200">
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
          <form onSubmit={voegToe} className="flex items-start gap-2">
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
