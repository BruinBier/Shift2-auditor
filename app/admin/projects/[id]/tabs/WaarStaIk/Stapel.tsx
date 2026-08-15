'use client';

/**
 * De taakstapel: één ding tegelijk. Beantwoordt "wat doe ik nu", niet "hoe staat
 * het ervoor" — daarvoor is de matrix.
 *
 * De stapel wordt altijd gevoed door een focus uit de matrix: een rij (criterium
 * over alle pagina's), een kolom (één pagina) of één cel.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Cel, Stand, Voorstel } from './gegevens';

type Taak =
  | { soort: 'vraag'; cel: Cel }
  | { soort: 'oordeel'; cel: Cel }
  | { soort: 'voorstel'; voorstel: Voorstel };

const OORDEEL_KLEUR: Record<string, string> = {
  voldoet: 'bg-green-100 text-green-800',
  afgekeurd: 'bg-red-100 text-red-800',
  opmerking: 'bg-amber-100 text-amber-800',
  niet_aanwezig: 'bg-gray-100 text-gray-600',
};

/** De statussen waar de onderzoeker een oordeel naartoe kan bijstellen. */
const OMZETBAAR: { waarde: 'voldoet' | 'afgekeurd' | 'opmerking' | 'niet_aanwezig' | 'niet_te_bepalen'; label: string }[] = [
  { waarde: 'voldoet', label: 'Voldoet' },
  { waarde: 'afgekeurd', label: 'Afgekeurd' },
  { waarde: 'opmerking', label: 'Opmerking' },
  { waarde: 'niet_aanwezig', label: 'Niet aanwezig' },
  { waarde: 'niet_te_bepalen', label: 'Moet ik zelf kijken' },
];

const IMPACT_KLEUR: Record<string, string> = {
  klein: 'bg-gray-100 text-gray-700',
  matig: 'bg-yellow-100 text-yellow-800',
  serieus: 'bg-orange-100 text-orange-800',
  kritiek: 'bg-red-100 text-red-800',
  onbekend: 'bg-gray-100 text-gray-700',
};

export default function Stapel({
  stand,
  focus,
  terug,
  projectId,
}: {
  stand: Stand;
  focus: string;
  terug: () => void;
  projectId: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  /** Welke uitgang de onderzoeker heeft aangeklikt, zolang de reden nog ontbreekt. */
  const [uitgang, setUitgang] = useState<'afwijzen' | 'doorzetten' | 'corrigeren' | null>(null);
  const [reden, setReden] = useState('');

  /**
   * Het antwoord op een browservraag vastleggen.
   *
   * De workflow zet criteria die niet uit HTML te bepalen zijn op
   * 'niet_te_bepalen' met de vraag erbij. Tot nu toe was dat een leesscherm: je
   * ging kijken, en daarna stond de vraag er nog. Hier landt jouw antwoord, met
   * bron 'handmatig' — jij hebt gekeken, niet de agent.
   */
  /**
   * Schrijft een oordeel weg met een akkoord erop.
   *
   * `behoudReden` is voor het bevestigen van een bestaand oordeel: dan blijft de
   * onderbouwing van de auditor staan en zet jij er alleen je akkoord onder.
   * Bij een correctie of een antwoord op een vraag komt jouw eigen tekst erin.
   */
  const beantwoord = async (
    cel: Cel,
    status: 'voldoet' | 'afgekeurd' | 'opmerking' | 'niet_aanwezig' | 'niet_te_bepalen',
    opties: { behoudReden?: boolean; bron?: string } = {}
  ) => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/criterion-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bron: opties.bron ?? 'handmatig',
          checks: [
            {
              sampleItemId: cel.sampleId,
              criterionCode: cel.code,
              status,
              reden: opties.behoudReden
                ? cel.reden ?? null
                : reden.trim() || cel.reden || null,
              akkoord: 'akkoord',
            },
          ],
        }),
      });
      const uitkomst = await res.json().catch(() => ({}));
      if (!res.ok || uitkomst.geschreven !== 1) {
        throw new Error(uitkomst.fouten?.[0] || uitkomst.error || 'Opslaan mislukt');
      }
      setUitgang(null);
      setReden('');
      router.refresh();
    } catch (e: any) {
      setFout(e.message);
    } finally {
      setBezig(false);
    }
  };

  const beoordeel = async (findingId: string, actie: string, type?: string) => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/findings/${findingId}/beoordeling`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actie, type, reden: reden.trim() || undefined }),
        }
      );
      if (!res.ok) {
        const f = await res.json().catch(() => ({}));
        throw new Error(f.error || 'Beoordelen mislukt');
      }
      setUitgang(null);
      setReden('');
      // De stand komt uit een server component; die moet opnieuw geladen worden.
      router.refresh();
    } catch (e: any) {
      setFout(e.message);
    } finally {
      setBezig(false);
    }
  };

  const stapel: Taak[] = useMemo(() => {
    const [soort, a, b] = focus.split(':');

    const past = (c: { sampleId: string | null; code: string }) => {
      if (soort === 'rij') return c.code === a;
      if (soort === 'kolom') return c.sampleId === a;
      if (soort === 'cel') return c.sampleId === a && c.code === b;
      return true;
    };

    const vragen = stand.cellen.filter((c) => c.status === 'niet_te_bepalen' && past(c));
    const voorstellen = stand.voorstellen.filter(past);
    // Oordelen die de agent heeft geveld maar die nog geen akkoord hebben. Zonder
    // deze stap komt een agent-oordeel ongezien in het rapport terecht.
    const oordelen = stand.cellen.filter(
      (c) =>
        c.status !== null && c.status !== 'niet_te_bepalen' && c.akkoord !== 'akkoord' && past(c)
    );

    const alles: Taak[] = [
      ...oordelen.map((cel) => ({ soort: 'oordeel' as const, cel })),
      ...vragen.map((cel) => ({ soort: 'vraag' as const, cel })),
      ...voorstellen.map((voorstel) => ({ soort: 'voorstel' as const, voorstel })),
    ];

    // Op volgorde van succescriterium: 1.1.1, 1.2.1, 1.2.2, ... Zo loop je de
    // WCAG-lijst af zoals je hem kent, in plaats van per soort taak te springen.
    const codeVan = (t: Taak) => (t.soort === 'voorstel' ? t.voorstel.code : t.cel.code);
    const sampleVan = (t: Taak) => (t.soort === 'voorstel' ? t.voorstel.sampleId : t.cel.sampleId);
    const volgorde = new Map(stand.samples.map((s, i) => [s.id, i]));
    // Binnen dezelfde cel eerst het oordeel of de vraag, dan wat eruit voortkomt.
    const rang = { oordeel: 0, vraag: 0, voorstel: 1 } as const;

    return alles.sort((a, b) => {
      const ca = codeVan(a).split('.').map(Number);
      const cb = codeVan(b).split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        const verschil = (ca[i] ?? 0) - (cb[i] ?? 0);
        if (verschil !== 0) return verschil;
      }
      const sa = volgorde.get(sampleVan(a) ?? '') ?? 999;
      const sb = volgorde.get(sampleVan(b) ?? '') ?? 999;
      if (sa !== sb) return sa - sb;
      return rang[a.soort] - rang[b.soort];
    });
  }, [stand, focus]);

  const sampleTitel = (id: string | null) =>
    id ? stand.samples.find((s) => s.id === id)?.title ?? id : 'geen pagina';
  const critTitel = (code: string) => stand.criteria.find((c) => c.code === code)?.titleNl ?? '';

  const focusLabel = (() => {
    const [soort, a, b] = focus.split(':');
    if (soort === 'rij') return `${a} — ${critTitel(a)}, over alle pagina's`;
    if (soort === 'kolom') return sampleTitel(a);
    if (soort === 'cel') return `${b} op ${sampleTitel(a)}`;
    return focus;
  })();

  const positie = Math.min(index, Math.max(stapel.length - 1, 0));
  const huidig = stapel[positie];

  const balk = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white">
      <span>
        Werklijst: <strong>{focusLabel}</strong>
      </span>
      <button
        type="button"
        onClick={terug}
        className="rounded bg-white/15 px-2 py-1 text-xs hover:bg-white/25"
      >
        Terug naar de matrix
      </button>
    </div>
  );

  if (!huidig) {
    return (
      <div className="mx-auto max-w-2xl">
        {balk}
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-lg font-medium text-green-900">Hier ligt niets meer.</p>
          <p className="mt-1 text-sm text-green-700">
            Geen openstaande vragen en geen voorstellen binnen deze selectie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {balk}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {positie + 1} van <strong className="text-gray-900">{stapel.length}</strong>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={positie === 0}
            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
          >
            Vorige
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(stapel.length - 1, i + 1))}
            disabled={positie >= stapel.length - 1}
            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
          >
            Volgende
          </button>
        </div>
      </div>

      {huidig.soort === 'oordeel' ? (
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-900">
              Oordeel van de agent
            </span>
            <span
              className={`rounded px-2 py-0.5 font-medium ${
                OORDEEL_KLEUR[huidig.cel.status ?? ''] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {huidig.cel.status}
            </span>
            {huidig.cel.bron && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                via {huidig.cel.bron}
              </span>
            )}
          </div>

          <p className="mb-1 text-sm text-gray-500">
            {huidig.cel.code} — {critTitel(huidig.cel.code)} · {sampleTitel(huidig.cel.sampleId)}
          </p>
          <p className="mb-4 whitespace-pre-line leading-relaxed text-gray-900">
            {huidig.cel.reden ?? '(geen onderbouwing gegeven)'}
          </p>

          {huidig.cel.bevindingen.length > 0 && (
            <div className="mb-4 space-y-2">
              {huidig.cel.bevindingen.map((b) => (
                <div key={b.id} className="rounded bg-gray-50 p-3 text-sm">
                  <p className="mb-1 text-xs text-gray-500">
                    {b.findingCode} · {b.type}
                    {b.impact ? ` · ${b.impact}` : ''}
                  </p>
                  <p className="whitespace-pre-line text-gray-800">{b.description}</p>
                </div>
              ))}
            </div>
          )}

          {fout && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>}

          {uitgang === 'corrigeren' ? (
            <div className="rounded border border-gray-300 p-3">
              <p className="mb-2 text-sm font-medium text-gray-800">Wat moet het worden?</p>
              <textarea
                value={reden}
                onChange={(e) => setReden(e.target.value)}
                rows={2}
                className="mb-2 w-full rounded border border-gray-300 p-2 text-sm"
                placeholder="Toelichting (laat leeg om die van de agent te behouden)"
              />
              <div className="flex flex-wrap gap-2">
                {OMZETBAAR.filter((o) => o.waarde !== huidig.cel.status).map((o) => (
                  <button
                    key={o.waarde}
                    type="button"
                    disabled={bezig}
                    onClick={() => beantwoord(huidig.cel, o.waarde)}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setUitgang(null);
                    setReden('');
                  }}
                  className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={bezig}
                onClick={() => beantwoord(huidig.cel, huidig.cel.status as any, { behoudReden: true, bron: huidig.cel.bron ?? 'workflow' })}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                Klopt
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('corrigeren')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Klopt niet
              </button>
            </div>
          )}
        </div>
      ) : huidig.soort === 'voorstel' ? (
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-800">
              Wacht op akkoord
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
              {huidig.voorstel.type === 'opmerking' ? 'Opmerking' : 'Bevinding'}
            </span>
            {huidig.voorstel.impact && (
              <span
                className={`rounded px-2 py-0.5 ${
                  IMPACT_KLEUR[huidig.voorstel.impact] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {huidig.voorstel.impact}
              </span>
            )}
          </div>

          <p className="mb-1 text-sm text-gray-500">
            {huidig.voorstel.findingCode && (
              <span className="font-mono font-medium text-gray-900">
                {huidig.voorstel.findingCode} ·{' '}
              </span>
            )}
            {huidig.voorstel.code} — {critTitel(huidig.voorstel.code)} ·{' '}
            {sampleTitel(huidig.voorstel.sampleId)}
          </p>
          <p className="mb-4 whitespace-pre-line leading-relaxed text-gray-900">
            {huidig.voorstel.description}
          </p>
          {huidig.voorstel.advice && (
            <div className="rounded bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Advies
              </p>
              <p className="whitespace-pre-line leading-relaxed text-gray-800">
                {huidig.voorstel.advice}
              </p>
            </div>
          )}

          {fout && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>
          )}

          {uitgang ? (
            <div className="mt-4 rounded border border-gray-300 p-3">
              <label className="mb-1 block text-sm font-medium text-gray-800">
                {uitgang === 'afwijzen'
                  ? 'Waarom is dit geen bevinding?'
                  : 'Toelichting (mag leeg)'}
              </label>
              <p className="mb-2 text-xs text-gray-500">
                {uitgang === 'afwijzen'
                  ? 'Deze reden blijft bewaard, zodat een volgende auditronde dezelfde vondst niet opnieuw voorstelt.'
                  : 'Er wordt een technisch issue aangemaakt voor de leverancier en dit voorstel wordt afgewezen met een verwijzing daarheen. Die verwijzing vertelt het verhaal al, dus een toelichting hoeft alleen als je iets wilt vastleggen dat er niet in staat.'}
              </p>
              <textarea
                value={reden}
                onChange={(e) => setReden(e.target.value)}
                rows={3}
                autoFocus
                className="w-full rounded border border-gray-300 p-2 text-sm"
                placeholder={
                  uitgang === 'afwijzen'
                    ? 'Korte toelichting'
                    : 'Optioneel — laat leeg om alleen de verwijzing vast te leggen'
                }
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={bezig || (uitgang === 'afwijzen' && !reden.trim())}
                  onClick={() => beoordeel(huidig.voorstel.id, uitgang)}
                  className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {uitgang === 'afwijzen' ? 'Afwijzen' : 'Doorzetten naar techniek'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUitgang(null);
                    setReden('');
                  }}
                  className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Bevinding of opmerking is het oordeel van de onderzoeker. De
                  keuze van de agent staat vooraan; de andere ernaast, altijd —
                  je kunt vooraf niet weten welke hij verkeerd inschatte. */}
              {(huidig.voorstel.type === 'opmerking'
                ? ['opmerking', 'bevinding']
                : ['bevinding', 'opmerking']
              ).map((soort, i) => (
                <button
                  key={soort}
                  type="button"
                  disabled={bezig}
                  onClick={() => beoordeel(huidig.voorstel.id, 'akkoord', soort)}
                  className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                    i === 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'border border-green-600 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Akkoord als {soort}
                </button>
              ))}
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('afwijzen')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Afwijzen
              </button>
              <button
                type="button"
                disabled={bezig}
                onClick={() => setUitgang('doorzetten')}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Dit is techniek
              </button>

              {/* Het moment waarop je merkt dat de tekst niet deugt, is juist dit
                  moment. Eerst akkoord geven en daarna herstellen zou betekenen
                  dat je iets goedkeurt waarvan je weet dat het niet klopt. */}
              <a
                href={`/admin/projects/${projectId}/findings/${huidig.voorstel.id}`}
                className="rounded px-4 py-2 text-sm text-gray-500 underline hover:bg-gray-50"
              >
                Tekst aanpassen
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
              Jij moet kijken
            </span>
            {huidig.cel.bron && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                via {huidig.cel.bron}
              </span>
            )}
          </div>

          <p className="mb-1 text-sm text-gray-500">
            {huidig.cel.code} — {critTitel(huidig.cel.code)} · {sampleTitel(huidig.cel.sampleId)}
          </p>
          <p className="mb-4 leading-relaxed text-gray-900">
            {huidig.cel.reden ?? 'Dit criterium vergt een browsertest.'}
          </p>

          {fout && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">{fout}</p>}

          <label className="mb-1 block text-sm font-medium text-gray-800">
            Wat zag je? <span className="font-normal text-gray-500">(mag leeg)</span>
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Wordt bewaard bij het oordeel, zodat later terug te zien is waarop het berust.
          </p>
          <textarea
            value={reden}
            onChange={(e) => setReden(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded border border-gray-300 p-2 text-sm"
            placeholder="Bijvoorbeeld: met NVDA getest, de suggesties worden aangekondigd"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bezig}
              onClick={() => beantwoord(huidig.cel, 'voldoet')}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              In orde
            </button>
            <button
              type="button"
              disabled={bezig}
              onClick={() => beantwoord(huidig.cel, 'niet_aanwezig')}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Niet van toepassing
            </button>
            {/* Zag je wél iets, noteer het dan als waarneming: ruw, in je eigen
                woorden. De vraag blijft openstaan tot je hem beantwoordt — een
                afkeuring zonder onderbouwing is precies wat de poort voorkomt. */}
            <a
              href={`?tab=stand&weergave=waarnemingen&sample=${huidig.cel.sampleId}`}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Ik zie iets — noteren
            </a>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            De vraag blijft openstaan tot je hem beantwoordt. Schrijf je een bevinding, kom dan
            terug om hier vast te leggen wat je zag.
          </p>
        </div>
      )}
    </div>
  );
}
