'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  casusDocument,
  dedent,
  feedbackTekst,
  HOOGTE_BERICHT,
  HOOGTE_VRAAG,
  juistAntwoord,
  korteId,
  pillTekst,
  type Antwoord,
} from '@/lib/bibliotheek/oefenen';
import type { OordeelWaarde } from '@/lib/bibliotheek/overeenstemming';

export type OefenCasus = {
  id: string;
  titel: string;
  html: string;
  css: string | null;
  js: string | null;
  correcteCode: string;
  uitleg: string;
  isValkuil: boolean;
  oordeel: OordeelWaarde;
  criteria: string[];
  technieken: string[];
  voorlopig: boolean;
  rapporten: { id: string; rapport: string; ons: string }[];
};

type Props = {
  set: { id: string; titel: string; basisCss: string };
  casussen: OefenCasus[];
  buitenBeschouwing: number;
};

/** Antwoorden staan in fase 1 in de eigen browser (besluit 11). */
function opslagSleutel(set: string) {
  return `oefenen-${set}-v1`;
}

function leesAntwoorden(set: string): Record<string, Antwoord> {
  try {
    const ruw = JSON.parse(localStorage.getItem(opslagSleutel(set)) || '{}');
    return ruw && typeof ruw === 'object' && !Array.isArray(ruw) ? ruw : {};
  } catch {
    return {};
  }
}

export default function Oefenpagina({ set, casussen, buitenBeschouwing }: Props) {
  const [antwoorden, setAntwoorden] = useState<Record<string, Antwoord>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [hoogtes, setHoogtes] = useState<Record<string, number>>({});
  const frames = useRef<Record<string, HTMLIFrameElement | null>>({});

  useEffect(() => {
    setAntwoorden(leesAntwoorden(set.id));
  }, [set.id]);

  function bewaar(nieuw: Record<string, Antwoord>) {
    setAntwoorden(nieuw);
    try {
      localStorage.setItem(opslagSleutel(set.id), JSON.stringify(nieuw));
    } catch {
      // Geen opslag (privévenster): de oefening werkt, alleen onthoudt hij niets.
    }
  }

  // Het testgebied stuurt zijn hoogte; alleen berichten van onze eigen iframes tellen.
  useEffect(() => {
    function ontvang(e: MessageEvent) {
      const d = e.data;
      if (!d || d.type !== HOOGTE_BERICHT || typeof d.id !== 'string') return;
      if (frames.current[d.id]?.contentWindow !== e.source) return;
      const h = Number(d.hoogte);
      if (Number.isFinite(h) && h > 0) setHoogtes((oud) => (oud[d.id] === h ? oud : { ...oud, [d.id]: h }));
    }
    window.addEventListener('message', ontvang);
    // Wat de iframes stuurden vóór deze luisteraar er was, is weg: vraag het opnieuw.
    for (const f of Object.values(frames.current)) {
      f?.contentWindow?.postMessage({ type: HOOGTE_VRAAG }, '*');
    }
    return () => window.removeEventListener('message', ontvang);
  }, []);

  const groepen = useMemo(() => {
    const gewoon = casussen.filter((c) => !c.isValkuil);
    const valkuilen = casussen.filter((c) => c.isValkuil);
    return [
      { id: 'casussen', titel: 'Casussen', casussen: gewoon },
      { id: 'valkuilen', titel: 'Valkuilen', casussen: valkuilen },
    ].filter((g) => g.casussen.length > 0);
  }, [casussen]);

  const beoordeeld = casussen.filter((c) => antwoorden[c.id]).length;
  const goed = casussen.filter((c) => antwoorden[c.id] && antwoorden[c.id] === juistAntwoord(c.oordeel)).length;
  const voorlopig = casussen.filter((c) => c.voorlopig).length;
  const allesOpen = casussen.length > 0 && casussen.every((c) => open[c.id]);

  const kies = useCallback(
    (casusId: string, antwoord: Antwoord) => {
      bewaar({ ...antwoorden, [casusId]: antwoord });
      setOpen((o) => ({ ...o, [casusId]: true }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [antwoorden],
  );

  function wissen() {
    bewaar({});
    setOpen({});
  }

  function alleBevindingen() {
    const doel = !allesOpen;
    setOpen(Object.fromEntries(casussen.map((c) => [c.id, doel])));
  }

  return (
    <div className="oefenpagina">
      <div className="wrap">
        <header className="intro">
          <p className="eyebrow">Shift2 · Oefenen</p>
          <h1>{set.titel}</h1>
          <p>
            Elk testgebied bevat echte, werkende code. Onderzoek het testgebied en de broncode, kies je
            oordeel en lees daarna de bevinding. Koppen binnen een testgebied horen bij de oefening, niet
            bij deze pagina.
          </p>
          {voorlopig > 0 && (
            <p className="note">
              {voorlopig === casussen.length
                ? 'Alle oordelen op deze pagina zijn nog voorlopig.'
                : `${voorlopig} van de ${casussen.length} oordelen zijn nog voorlopig.`}{' '}
              Ze zijn nog niet vastgesteld en kunnen veranderen.
            </p>
          )}
          {buitenBeschouwing > 0 && (
            <p className="note">
              {buitenBeschouwing === 1
                ? 'Eén casus staat niet op deze pagina: het oordeel erover is nog in twijfel.'
                : `${buitenBeschouwing} casussen staan niet op deze pagina: het oordeel erover is nog in twijfel.`}
            </p>
          )}
          <div className="toolbar">
            <span className="score" aria-live="polite">
              {beoordeeld} van {casussen.length} beoordeeld · {goed} goed
            </span>
            <button className="btn" type="button" onClick={alleBevindingen}>
              {allesOpen ? 'Alle bevindingen sluiten' : 'Alle bevindingen openen'}
            </button>
            <button className="btn" type="button" onClick={wissen}>
              Antwoorden wissen
            </button>
          </div>
          {groepen.length > 1 && (
            <nav aria-label="Categorieën">
              <ul className="cats">
                {groepen.map((g) => (
                  <li key={g.id}>
                    <a href={`#${g.id}`}>{g.titel}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        <main className="wrap inner">
          {groepen.map((g) => (
            <section key={g.id} className="cat" id={g.id} aria-labelledby={`h-${g.id}`}>
              <h2 id={`h-${g.id}`}>{g.titel}</h2>
              {g.casussen.map((c) => (
                <Casuskaart
                  key={c.id}
                  casus={c}
                  setId={set.id}
                  basisCss={set.basisCss}
                  antwoord={antwoorden[c.id]}
                  open={!!open[c.id]}
                  hoogte={hoogtes[c.id]}
                  frameRef={(el) => {
                    frames.current[c.id] = el;
                  }}
                  onKies={(a) => kies(c.id, a)}
                  onToggle={(v) => setOpen((o) => (o[c.id] === v ? o : { ...o, [c.id]: v }))}
                />
              ))}
            </section>
          ))}
          {casussen.length === 0 && <p>Deze oefenset heeft nog geen casussen.</p>}
        </main>
      </div>
    </div>
  );
}

function Casuskaart({
  casus,
  setId,
  basisCss,
  antwoord,
  open,
  hoogte,
  frameRef,
  onKies,
  onToggle,
}: {
  casus: OefenCasus;
  setId: string;
  basisCss: string;
  antwoord?: Antwoord;
  open: boolean;
  hoogte?: number;
  frameRef: (el: HTMLIFrameElement | null) => void;
  onKies: (a: Antwoord) => void;
  onToggle: (open: boolean) => void;
}) {
  const kort = korteId(casus.id, setId);
  const doc = useMemo(
    () => casusDocument({ casusId: casus.id, html: casus.html, css: casus.css, js: casus.js, basisCss }),
    [casus.id, casus.html, casus.css, casus.js, basisCss],
  );
  const feedback = antwoord ? feedbackTekst(casus.oordeel, casus.criteria, antwoord) : null;
  const pill = pillTekst(casus.oordeel, casus.criteria);
  const correct = dedent(casus.correcteCode);

  return (
    <article className={`case${feedback ? (feedback.goed ? ' right' : ' wrong') : ''}`} id={casus.id}>
      <div className="case-head">
        <span className="case-id">{kort}</span>
        <p className="case-title">{casus.titel}</p>
      </div>

      <p className="spec-label">Testgebied</p>
      <div className="specimen-frame">
        <iframe
          ref={frameRef}
          title={`Testgebied ${kort}`}
          sandbox="allow-scripts"
          srcDoc={doc}
          style={{ height: hoogte ? `${hoogte}px` : '8rem' }}
        />
      </div>

      <details className="src" open>
        <summary>Broncode testgebied</summary>
        <pre>
          <code>{dedent([casus.html, casus.css ? `<style>\n${casus.css}\n</style>` : '', casus.js ? `<script>\n${casus.js}\n</script>` : ''].filter(Boolean).join('\n'))}</code>
        </pre>
      </details>

      <fieldset className="judge">
        <legend>Jouw oordeel {kort}</legend>
        {(
          [
            ['afkeur', 'Afkeur'],
            ['geen-afkeur', 'Geen afkeur'],
          ] as const
        ).map(([waarde, label]) => (
          <label key={waarde}>
            <input
              type="radio"
              name={`oordeel-${casus.id}`}
              value={waarde}
              checked={antwoord === waarde}
              onChange={() => onKies(waarde)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p role="status" className={`feedback${feedback ? (feedback.goed ? ' ok' : ' nok') : ''}`}>
        {feedback?.tekst ?? ''}
      </p>

      <details
        className="finding-box"
        open={open}
        onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary>Bevinding</summary>
        <div className="finding">
          <p className="pills">
            <span className={`verdict ${casus.oordeel === 'afkeur' ? 'fail' : 'pass'}`}>{pill}</span>
            {casus.voorlopig && <span className="voorlopig">voorlopig oordeel</span>}
          </p>
          {casus.rapporten.map((r) => (
            <dl key={r.id} className="rapport">
              <div>
                <dt>Rapport</dt>
                <dd>{r.rapport}</dd>
              </div>
              <div>
                <dt>Ons oordeel</dt>
                <dd>{r.ons}</dd>
              </div>
            </dl>
          ))}
          {casus.uitleg && <p>{casus.uitleg}</p>}
          {casus.technieken.length > 0 && <p className="ref">{casus.technieken.join(' · ')}</p>}
          {correct ? (
            <div className="code-block">
              <p className="code-label good">{casus.oordeel === 'afkeur' ? 'Correct' : 'Beter (advies)'}</p>
              <pre>
                <code>{correct}</code>
              </pre>
            </div>
          ) : (
            <p className="ref">De code is in orde zoals hij is.</p>
          )}
        </div>
      </details>
    </article>
  );
}
