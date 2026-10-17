'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { casusDocument, HOOGTE_BERICHT, HOOGTE_VRAAG } from '@/lib/bibliotheek/oefenen';
import type { Melding } from '@/lib/bibliotheek/klantdata';

const Codeveld = dynamic(() => import('./Codeveld'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-500">Editor laden…</p>,
});

export type CasusVelden = {
  id: string;
  titel: string;
  html: string;
  css: string;
  js: string;
  correcteCode: string;
  uitleg: string;
  isValkuil: boolean;
  categorie: string;
  oefensets: string[];
  volgorde: number;
};

const invoer = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm';
const label = 'block text-sm font-medium text-gray-800 mb-1';

/** Vertraagt een waarde, zodat het voorbeeld niet bij elke toetsaanslag herlaadt. */
function useVertraagd<T>(waarde: T, ms: number): T {
  const [v, setV] = useState(waarde);
  useEffect(() => {
    const t = setTimeout(() => setV(waarde), ms);
    return () => clearTimeout(t);
  }, [waarde, ms]);
  return v;
}

export default function Casuseditor({
  patroonId,
  casus,
  oefensets,
  categorieen,
  onKlaar,
  onAnnuleer,
}: {
  patroonId: string;
  casus: CasusVelden;
  oefensets: { id: string; titel: string; paginaCss: string }[];
  /** Bestaande categorieën, als suggestie. */
  categorieen: string[];
  onKlaar: () => void;
  onAnnuleer: () => void;
}) {
  const nieuw = !casus.id;
  const [v, setV] = useState(casus);
  const [fouten, setFouten] = useState<string[]>([]);
  const [meldingen, setMeldingen] = useState<Melding[] | null>(null);
  const [bezig, setBezig] = useState(false);
  const [upload, setUpload] = useState<{ tekst: string; fout: boolean } | null>(null);
  const [hoogte, setHoogte] = useState(120);
  const frame = useRef<HTMLIFrameElement>(null);
  const waarschuwingRef = useRef<HTMLDivElement>(null);
  const foutRef = useRef<HTMLDivElement>(null);
  const prefix = nieuw ? 'nieuw' : v.id;

  const zet = <K extends keyof CasusVelden>(veld: K, waarde: CasusVelden[K]) => setV((o) => ({ ...o, [veld]: waarde }));

  const basisCss = oefensets.find((s) => s.id === v.oefensets[0])?.paginaCss ?? '';
  const code = useVertraagd({ html: v.html, css: v.css, js: v.js }, 400);
  const voorbeeldId = `editor-${prefix}`;
  const doc = useMemo(
    () => casusDocument({ casusId: voorbeeldId, html: code.html, css: code.css, js: code.js, basisCss }),
    [voorbeeldId, code, basisCss],
  );

  useEffect(() => {
    function ontvang(e: MessageEvent) {
      if (e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === HOOGTE_BERICHT && Number(e.data.hoogte) > 0) setHoogte(Number(e.data.hoogte));
    }
    window.addEventListener('message', ontvang);
    frame.current?.contentWindow?.postMessage({ type: HOOGTE_VRAAG }, '*');
    return () => window.removeEventListener('message', ontvang);
  }, []);

  async function opslaan(ondanksWaarschuwing: boolean) {
    setFouten([]);
    setBezig(true);
    if (!ondanksWaarschuwing) {
      const res = await fetch('/api/bibliotheek/klantdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ tekst: [v.html, v.css, v.js, v.correcteCode].join('\n') }),
      });
      const { meldingen: gevonden } = await res.json().catch(() => ({ meldingen: [] }));
      if (gevonden?.length > 0) {
        setMeldingen(gevonden);
        setBezig(false);
        requestAnimationFrame(() => waarschuwingRef.current?.focus());
        return;
      }
    }
    setMeldingen(null);
    const res = await fetch(nieuw ? '/api/bibliotheek/casussen' : `/api/bibliotheek/casussen/${encodeURIComponent(v.id)}`, {
      method: nieuw ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ...v, patroonId }),
    });
    const antwoord = await res.json().catch(() => ({}));
    setBezig(false);
    if (!res.ok) {
      setFouten(antwoord.fouten ?? ['Opslaan is mislukt.']);
      requestAnimationFrame(() => foutRef.current?.focus());
      return;
    }
    onKlaar();
  }

  async function verwijder() {
    if (!window.confirm(`Casus ${v.id} verwijderen? Dit kan niet ongedaan worden.`)) return;
    setBezig(true);
    const res = await fetch(`/api/bibliotheek/casussen/${encodeURIComponent(v.id)}`, { method: 'DELETE' });
    setBezig(false);
    if (res.ok) onKlaar();
    else setFouten(['Verwijderen is mislukt.']);
  }

  async function uploaden(bestand: File) {
    const form = new FormData();
    form.append('bestand', bestand);
    const res = await fetch('/api/bibliotheek/afbeelding', { method: 'POST', body: form });
    const antwoord = await res.json().catch(() => ({}));
    if (res.ok) {
      setUpload({ tekst: `Geüpload. Gebruik in de HTML: <img src="${antwoord.naam}" alt="">`, fout: false });
    } else {
      setUpload({ tekst: (antwoord.fouten ?? ['Uploaden is mislukt.']).join(' '), fout: true });
    }
  }

  return (
    <form
      className="grid gap-4"
      aria-label={nieuw ? 'Nieuwe casus' : `Casus ${v.id}`}
      onSubmit={(e) => {
        e.preventDefault();
        opslaan(false);
      }}
    >
      <h2 className="text-lg font-semibold">{nieuw ? 'Nieuwe casus' : `Casus ${v.id} bewerken`}</h2>

      {fouten.length > 0 && (
        <div ref={foutRef} tabIndex={-1} role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <ul className="list-disc pl-5">
            {fouten.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] items-end">
        <div>
          <label htmlFor={`${prefix}-titel`} className={label}>Titel</label>
          <input id={`${prefix}-titel`} className={invoer} value={v.titel} onChange={(e) => zet('titel', e.target.value)} required />
        </div>
        <div>
          <label htmlFor={`${prefix}-volgorde`} className={label}>Volgorde</label>
          <input id={`${prefix}-volgorde`} type="number" className={`${invoer} w-24`} value={v.volgorde}
            onChange={(e) => zet('volgorde', Number(e.target.value))} />
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" checked={v.isValkuil} onChange={(e) => zet('isValkuil', e.target.checked)} />
          Valkuil
        </label>
      </div>

      <div>
        <label htmlFor={`${prefix}-categorie`} className={label}>Categorie in de oefenmodus</label>
        <input id={`${prefix}-categorie`} className={invoer} value={v.categorie} list={`${prefix}-categorieen`}
          onChange={(e) => zet('categorie', e.target.value)} aria-describedby={`${prefix}-categorie-hulp`} />
        <datalist id={`${prefix}-categorieen`}>
          {categorieen.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p id={`${prefix}-categorie-hulp`} className="text-xs text-gray-600 mt-1">
          De kop waaronder de casus staat, bijvoorbeeld Koppen of Valkuilen. Leeg is Overig.
        </p>
      </div>

      <fieldset>
        <legend className={label}>Oefensets</legend>
        <div className="flex flex-wrap gap-4">
          {oefensets.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={v.oefensets.includes(s.id)}
                onChange={(e) =>
                  zet('oefensets', e.target.checked ? [...v.oefensets, s.id] : v.oefensets.filter((x) => x !== s.id))
                } />
              {s.titel}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 min-w-0">
          <Codeveld id={`${prefix}-html`} label="HTML (testgebied)" taal="html" waarde={v.html} zet={(x) => zet('html', x)} hoogte="14rem" />
          <Codeveld id={`${prefix}-css`} label="CSS" taal="css" waarde={v.css} zet={(x) => zet('css', x)} hoogte="7rem" />
          <Codeveld id={`${prefix}-js`} label="JavaScript" taal="js" waarde={v.js} zet={(x) => zet('js', x)} hoogte="7rem" />
        </div>
        <div className="min-w-0">
          <p className={label} id={`${prefix}-voorbeeld-label`}>Live voorbeeld</p>
          <div className="rounded-md border-2 border-dashed border-gray-300 bg-white overflow-hidden">
            <iframe
              ref={frame}
              title="Live voorbeeld van het testgebied"
              sandbox="allow-scripts"
              srcDoc={doc}
              className="block w-full border-0"
              style={{ height: `${hoogte}px` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Afgeschermd: de code in het voorbeeld kan niets van de app lezen. Basisstijl uit de eerste oefenset.
          </p>

          <div className="mt-4">
            <label htmlFor={`${prefix}-upload`} className={label}>Afbeelding uploaden</label>
            <input id={`${prefix}-upload`} type="file" accept="image/*" className="text-sm"
              onChange={(e) => e.target.files?.[0] && uploaden(e.target.files[0])} />
            <p role="status" className={`text-xs mt-1 ${upload?.fout ? 'text-red-800' : 'text-gray-700'}`}>
              {upload?.tekst ?? ''}
            </p>
          </div>
        </div>
      </div>

      <Codeveld id={`${prefix}-correct`} label="Correcte code (leeg = de code is in orde)" taal="html"
        waarde={v.correcteCode} zet={(x) => zet('correcteCode', x)} hoogte="9rem" />

      <div>
        <label htmlFor={`${prefix}-uitleg`} className={label}>Uitleg</label>
        <textarea id={`${prefix}-uitleg`} rows={3} className={invoer} value={v.uitleg} onChange={(e) => zet('uitleg', e.target.value)} />
      </div>

      {meldingen && (
        <div ref={waarschuwingRef} tabIndex={-1} role="alert"
          className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-semibold">Dit lijkt op klantdata:</p>
          <ul className="list-disc pl-5 my-2">
            {meldingen.map((m) => (
              <li key={`${m.soort}-${m.tekst}`}>
                <code>{m.tekst}</code>: {m.uitleg}
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button type="button" disabled={bezig} onClick={() => opslaan(true)}
              className="rounded-md border border-amber-700 px-3 py-1 font-medium">
              Toch opslaan
            </button>
            <button type="button" onClick={() => setMeldingen(null)} className="underline">
              Terug naar de code
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={bezig}
          className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-60">
          {nieuw ? 'Casus aanmaken' : 'Opslaan'}
        </button>
        <button type="button" onClick={onAnnuleer} className="text-sm underline">Annuleren</button>
        {!nieuw && (
          <button type="button" onClick={verwijder} disabled={bezig} className="ml-auto text-sm text-red-800 underline">
            Casus verwijderen
          </button>
        )}
      </div>
    </form>
  );
}
