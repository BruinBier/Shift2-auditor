'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Wat er met de klant is afgesproken, op het tabblad Details.
 *
 * Dit is iets anders dan een bespreekpunt, en stond er tot 16 september 2026 wel in
 * dezelfde lijst. Een bespreekpunt is een vraag die je nog moet stéllen; een afspraak is
 * het antwoord waar iemand mee aan de slag gaat: de video wordt aangepast, de geteste
 * pagina's blijven staan tot de hertest, de verklaring wordt vervangen. Op één hoop
 * telde het dashboard lopende afspraken mee als openstaande vragen, en dan lijkt een
 * onderzoek waarin alles loopt zoals afgesproken een onderzoek met achterstallige vragen.
 *
 * Verwijderen kan zolang een afspraak loopt. Is hij nagekomen, dan blijft hij staan: dan
 * legt hij vast wat er is afgesproken én wat ervan kwam.
 */

type Afspraak = {
  id: string;
  tekst: string;
  wie: string | null;
  uiterlijk: string | null;
  afgesprokenOp: string;
  nagekomenOp: string | null;
  uitkomst: string | null;
};

export default function Klantafspraken({ projectId }: { projectId: string }) {
  const [afspraken, setAfspraken] = useState<Afspraak[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [nieuw, setNieuw] = useState('');
  const [nieuwWie, setNieuwWie] = useState('');
  const [nieuwUiterlijk, setNieuwUiterlijk] = useState('');
  const [bezig, setBezig] = useState<string | null>(null);
  const [uitkomstOpen, setUitkomstOpen] = useState<string | null>(null);
  const [uitkomstTekst, setUitkomstTekst] = useState('');
  const [afgerondOpen, setAfgerondOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/klantafspraken`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lijst) => setAfspraken(Array.isArray(lijst) ? lijst : []))
      .catch(() => setAfspraken([]))
      .finally(() => setGeladen(true));
  }, [projectId]);

  const lopend = afspraken.filter((a) => !a.nagekomenOp);
  const afgerond = afspraken.filter((a) => a.nagekomenOp);

  const werkBij = async (id: string, body: Record<string, unknown>) => {
    setBezig(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/klantafspraken/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        alert('Het bijwerken van de afspraak is niet gelukt.');
        return;
      }
      const afspraak: Afspraak = await res.json();
      setAfspraken((lijst) => lijst.map((a) => (a.id === afspraak.id ? afspraak : a)));
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
      const res = await fetch(`/api/projects/${projectId}/klantafspraken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          tekst,
          wie: nieuwWie || null,
          uiterlijk: nieuwUiterlijk || null,
        }),
      });
      if (!res.ok) {
        alert('Het toevoegen van de afspraak is niet gelukt.');
        return;
      }
      const afspraak: Afspraak = await res.json();
      setAfspraken((lijst) => [...lijst, afspraak]);
      setNieuw('');
      setNieuwWie('');
      setNieuwUiterlijk('');
    } finally {
      setBezig(null);
    }
  };

  const verwijder = async (afspraak: Afspraak) => {
    setBezig(afspraak.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/klantafspraken/${afspraak.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Het verwijderen van de afspraak is niet gelukt.');
        return;
      }
      setAfspraken((lijst) => lijst.filter((a) => a.id !== afspraak.id));
    } finally {
      setBezig(null);
    }
  };

  const vinkAf = async (afspraak: Afspraak) => {
    await werkBij(afspraak.id, { nagekomen: true });
    setUitkomstOpen(afspraak.id);
    setUitkomstTekst(afspraak.uitkomst || '');
    setAfgerondOpen(true);
  };

  const bewaarUitkomst = async (id: string) => {
    await werkBij(id, { uitkomst: uitkomstTekst });
    setUitkomstOpen(null);
  };

  const datum = (iso: string) => format(new Date(iso), 'd MMMM yyyy', { locale: nl });

  /** Verloopt binnen een week, of is al verlopen? Dan verdient het de aandacht. */
  const dringend = (iso: string | null) => {
    if (!iso) return false;
    const dagen = (new Date(iso).getTime() - Date.now()) / 86400000;
    return dagen < 7;
  };

  return (
    <div id="klantafspraken" className="bg-white rounded-lg border border-gray-200 scroll-mt-4">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Afgesproken met de klant</h3>
        </div>
        {lopend.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {lopend.length} {lopend.length === 1 ? 'loopt' : 'lopen'}
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Loopt nog{geladen && lopend.length === 0 ? ': niets' : ''}
          </h4>
          {lopend.length > 0 && (
            <ul className="space-y-2 mb-3">
              {lopend.map((afspraak) => (
                <li key={afspraak.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={bezig === afspraak.id}
                    onChange={() => vinkAf(afspraak)}
                    aria-label={`Nagekomen: ${afspraak.tekst}`}
                    className="mt-1 rounded border-gray-300 text-shift2-primary focus:ring-shift2-primary"
                  />
                  <div className="flex-1 text-sm text-gray-900">
                    <div className="whitespace-pre-wrap">{afspraak.tekst}</div>
                    <div className="text-xs text-gray-400">
                      {afspraak.wie && <span className="text-gray-500">{afspraak.wie}</span>}
                      {afspraak.wie && ' · '}
                      {afspraak.uiterlijk ? (
                        <span className={dringend(afspraak.uiterlijk) ? 'text-amber-700 font-medium' : ''}>
                          uiterlijk {datum(afspraak.uiterlijk)}
                        </span>
                      ) : (
                        <>afgesproken {datum(afspraak.afgesprokenOp)}</>
                      )}
                      {' · '}
                      <button
                        type="button"
                        onClick={() => verwijder(afspraak)}
                        disabled={bezig === afspraak.id}
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

          <form onSubmit={voegToe}>
            <label htmlFor="nieuwe-afspraak" className="block text-sm font-medium text-gray-700 mb-1">
              Nieuwe afspraak
            </label>
            <textarea
              id="nieuwe-afspraak"
              value={nieuw}
              onChange={(e) => setNieuw(e.target.value)}
              rows={2}
              placeholder="Bijvoorbeeld: De video wordt opnieuw ingesproken met de beeldtekst erbij."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
            />
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="afspraak-wie" className="block text-xs font-medium text-gray-500 mb-1">
                  Bij wie ligt het?
                </label>
                <input
                  id="afspraak-wie"
                  type="text"
                  value={nieuwWie}
                  onChange={(e) => setNieuwWie(e.target.value)}
                  placeholder="klant"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>
              <div>
                <label htmlFor="afspraak-uiterlijk" className="block text-xs font-medium text-gray-500 mb-1">
                  Uiterlijk
                </label>
                <input
                  id="afspraak-uiterlijk"
                  type="date"
                  value={nieuwUiterlijk}
                  onChange={(e) => setNieuwUiterlijk(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>
              <button
                type="submit"
                disabled={!nieuw.trim() || bezig === 'nieuw'}
                className="px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                Afspraak toevoegen
              </button>
            </div>
          </form>
        </div>

        {afgerond.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setAfgerondOpen(!afgerondOpen)}
              aria-expanded={afgerondOpen}
              className="text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-900"
            >
              <span className="mr-1 inline-block text-gray-400">{afgerondOpen ? '▾' : '▸'}</span>
              Nagekomen ({afgerond.length})
            </button>
            {afgerondOpen && (
              <ul className="mt-2 space-y-3">
                {afgerond.map((afspraak) => (
                  <li key={afspraak.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked
                      disabled={bezig === afspraak.id}
                      onChange={() => werkBij(afspraak.id, { nagekomen: false })}
                      aria-label={`Weer openzetten: ${afspraak.tekst}`}
                      className="mt-1 rounded border-gray-300 text-shift2-primary focus:ring-shift2-primary"
                    />
                    <div className="flex-1 text-sm">
                      <div className="text-gray-500 line-through whitespace-pre-wrap">{afspraak.tekst}</div>
                      <div className="text-xs text-gray-400">nagekomen {datum(afspraak.nagekomenOp!)}</div>
                      {uitkomstOpen === afspraak.id ? (
                        <div className="mt-2 flex items-start gap-2">
                          <textarea
                            value={uitkomstTekst}
                            onChange={(e) => setUitkomstTekst(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder="Wat is ervan gekomen?"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                          />
                          <button
                            type="button"
                            onClick={() => bewaarUitkomst(afspraak.id)}
                            disabled={bezig === afspraak.id}
                            className="px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 disabled:opacity-50"
                          >
                            Bewaren
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1">
                          {afspraak.uitkomst && (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">{afspraak.uitkomst}</div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setUitkomstOpen(afspraak.id);
                              setUitkomstTekst(afspraak.uitkomst || '');
                            }}
                            className="text-xs text-shift2-primary hover:underline"
                          >
                            {afspraak.uitkomst ? 'wijzigen' : 'uitkomst toevoegen'}
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
