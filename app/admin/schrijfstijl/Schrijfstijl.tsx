'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Analyse } from '@/lib/schrijfstijl/correcties';
import type { Wijziging } from '@/lib/schrijfstijl/gids';

interface Correctie {
  id: string;
  bron: string;
  criteriumCode: string | null;
  status: string;
  origineelDescription: string;
  origineelAdvice: string;
  bewerktDescription: string;
  bewerktAdvice: string;
  analyse: Analyse | null;
  ingediendOp: string;
  finding: { id: string; findingCode: string; projectId: string; project: { kenmerk: string | null } } | null;
}

const datum = (s: string) =>
  new Date(s).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Herkomst({ c }: { c: Correctie }) {
  return (
    <span className="text-xs text-gray-600">
      {c.bron === 'test' ? (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900">test</span>
      ) : c.finding ? (
        <a className="underline" href={`/admin/projects/${c.finding.projectId}/findings/${c.finding.id}`}>
          {c.finding.project.kenmerk ?? 'project'} {c.finding.findingCode}
        </a>
      ) : (
        'bevinding verwijderd'
      )}
      {c.criteriumCode && <> · SC {c.criteriumCode}</>} · {datum(c.ingediendOp)}
    </span>
  );
}

function Regeltekst({ label, tekst, kleur }: { label: string; tekst: string; kleur: 'oud' | 'nieuw' }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-700">{label}</p>
      <pre
        className={`whitespace-pre-wrap rounded border p-3 font-sans text-sm leading-relaxed ${
          kleur === 'oud' ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        {tekst}
      </pre>
    </div>
  );
}

function Wijzigingen({ a }: { a: Analyse }) {
  return (
    <ul className="space-y-2">
      {a.wijzigingen.map((w, i) => (
        <li key={i} className="rounded border border-gray-200 bg-gray-50 p-2 text-sm">
          <span
            className={`mr-2 rounded px-1.5 py-0.5 text-xs font-medium ${
              w.soort === 'schrijf' ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {w.soort === 'schrijf' ? 'schrijfcorrectie' : 'inhoudelijke correctie'}
          </span>
          <span className="line-through decoration-red-400">{w.origineel}</span>
          <span className="mx-1" aria-hidden="true">→</span>
          <span className="sr-only">wordt</span>
          <span>{w.bewerkt}</span>
          {w.uitleg && <p className="mt-1 text-xs text-gray-600">{w.uitleg}</p>}
        </li>
      ))}
    </ul>
  );
}

const UITKOMST: Record<string, string> = {
  nieuw: 'A. Nieuwe regel',
  verbeteren: 'B. Bestaande regel verbeteren',
  geen: 'C. Geen wijziging',
};

function Voorstel({ c }: { c: Correctie }) {
  const router = useRouter();
  const a = c.analyse!;
  const [tekst, setTekst] = useState(a.voorstel?.nieuweTekst ?? '');
  const [bevestigen, setBevestigen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const samenvoegen = a.uitkomst === 'verbeteren' && a.regelIds.length > 1;
  const knop =
    a.uitkomst === 'nieuw' ? 'Toevoegen aan Writing Guide' : samenvoegen ? 'Regels samenvoegen' : 'Bestaande regel aanpassen';

  const beslis = async (actie: 'toevoegen' | 'niet_toevoegen') => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(`/api/schrijfstijl/correcties/${c.id}/beslissing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ actie, nieuweTekst: tekst }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Er ging iets mis');
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Er ging iets mis');
      setBezig(false);
    }
  };

  const oude = a.regelIds.map((id) => ({ id, tekst: a.oudeTeksten?.[id] ?? '' }));

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">
          {UITKOMST[a.uitkomst]}
          {samenvoegen && ' (samenvoegen)'}
          {a.regelIds.length > 0 && <span className="font-normal text-gray-600"> · {a.regelIds.join(', ')}</span>}
        </h3>
        <Herkomst c={c} />
      </div>

      <h4 className="mt-4 text-sm font-semibold text-gray-800">Wat je veranderde</h4>
      <div className="mt-2">
        <Wijzigingen a={a} />
      </div>
      {a.waaromBeter && (
        <>
          <h4 className="mt-4 text-sm font-semibold text-gray-800">Waarom jouw versie beter past</h4>
          <p className="mt-1 text-sm text-gray-800">{a.waaromBeter}</p>
        </>
      )}
      <p className="mt-3 text-sm text-gray-700">{a.toelichting}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {oude.length > 0 ? (
          <div className="space-y-3">
            {oude.map((o) => (
              <Regeltekst key={o.id} label={`Oude regel ${o.id}`} tekst={o.tekst} kleur="oud" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Komt onder het kopje <strong>{a.voorstel?.sectie}</strong>.
          </p>
        )}
        <div>
          <label htmlFor={`tekst-${c.id}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700">
            Nieuwe regel (je kunt hem nog bijschaven)
          </label>
          <textarea
            id={`tekst-${c.id}`}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value);
              setBevestigen(false);
            }}
            rows={Math.min(14, Math.max(5, tekst.split('\n').length + 1))}
            className="w-full rounded border border-emerald-300 p-3 text-sm leading-relaxed"
          />
          {a.voorstel?.reden && <p className="mt-1 text-xs text-gray-600">Reden: {a.voorstel.reden}</p>}
        </div>
      </div>

      {bevestigen && (
        <div className="mt-4 rounded-lg border-2 border-emerald-600 bg-white p-4" role="region" aria-label="Controleer de wijziging">
          <p className="text-sm font-semibold text-gray-900">
            Dit verandert er in writing/FRITS-WRITING-GUIDE.md:
          </p>
          <div className="mt-3 space-y-3">
            {oude.map((o) => (
              <Regeltekst key={o.id} label={`OUDE REGEL (${o.id})`} tekst={o.tekst} kleur="oud" />
            ))}
            <Regeltekst label={`NIEUWE REGEL${oude.length ? ` (${oude[0].id})` : ''}`} tekst={tekst} kleur="nieuw" />
          </div>
          {samenvoegen && (
            <p className="mt-2 text-xs text-gray-700">
              {a.regelIds.slice(1).join(', ')} verdwijnt; de nieuwe tekst staat op de plek van {a.regelIds[0]}.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={bezig || !tekst.trim()}
              onClick={() => beslis('toevoegen')}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {bezig ? 'Bezig...' : 'Bevestigen en opslaan'}
            </button>
            <button
              type="button"
              onClick={() => setBevestigen(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Terug
            </button>
          </div>
        </div>
      )}

      {fout && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{fout}</p>}

      {!bevestigen && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={bezig || !tekst.trim()}
            onClick={() => setBevestigen(true)}
            className="rounded-lg bg-[#1f0036] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {knop}
          </button>
          <button
            type="button"
            disabled={bezig}
            onClick={() => beslis('niet_toevoegen')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Niet toevoegen
          </button>
        </div>
      )}
    </article>
  );
}

function Geschiedenis({ items }: { items: Wijziging[] }) {
  const router = useRouter();
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState<string | null>(null);
  const teruggedraaid = new Set(items.map((w) => w.terugdraaiingVan).filter(Boolean));

  const draaiTerug = async (w: Wijziging) => {
    if (!confirm('Deze wijziging terugdraaien? De regel krijgt weer zijn vorige tekst.')) return;
    setBezig(w.id);
    setFout(null);
    try {
      const res = await fetch(`/api/schrijfstijl/geschiedenis/${w.id}/terugdraaien`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Er ging iets mis');
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Er ging iets mis');
    } finally {
      setBezig(null);
    }
  };

  if (items.length === 0) {
    return <p className="text-sm text-gray-600">Nog geen wijzigingen via deze pagina.</p>;
  }

  const SOORT: Record<string, string> = {
    nieuw: 'Nieuwe regel',
    aanpassen: 'Regel aangepast',
    samenvoegen: 'Regels samengevoegd',
    terugdraaien: 'Teruggedraaid',
  };

  return (
    <div className="space-y-3">
      {fout && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{fout}</p>}
      {items.map((w) => (
        <details key={w.id} className="rounded-lg border border-gray-200 bg-white">
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
            <span className="font-medium text-gray-900">{SOORT[w.soort]}</span>
            <span className="text-gray-700">
              {w.nieuw?.id ?? w.oud[0]?.id}
              {w.criterium && <> · uit SC {w.criterium}</>}
            </span>
            <span className="text-gray-500">{datum(w.tijdstip)}</span>
            {teruggedraaid.has(w.id) && <span className="text-xs text-gray-500">(teruggedraaid)</span>}
          </summary>
          <div className="space-y-3 border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-800">Reden: {w.reden}</p>
            {w.oud.map((o) => (
              <Regeltekst key={o.id} label={`Oude tekst ${o.id}`} tekst={o.tekst} kleur="oud" />
            ))}
            {w.nieuw && <Regeltekst label={`Nieuwe tekst ${w.nieuw.id}`} tekst={w.nieuw.tekst} kleur="nieuw" />}
            {w.soort !== 'terugdraaien' && !teruggedraaid.has(w.id) && (
              <button
                type="button"
                disabled={bezig === w.id}
                onClick={() => draaiTerug(w)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {bezig === w.id ? 'Bezig...' : 'Terugdraaien'}
              </button>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

export default function Schrijfstijl({
  correcties,
  regelAantal,
  geschiedenis,
}: {
  correcties: Correctie[];
  regelAantal: number;
  geschiedenis: Wijziging[];
}) {
  const voorstellen = correcties.filter((c) => c.status === 'voorstel' && c.analyse);
  const wachtend = correcties.filter((c) => c.status === 'te_analyseren');
  const geen = correcties.filter((c) => c.status === 'geen_wijziging');
  const afgewezen = correcties.filter((c) => c.status === 'niet_toegevoegd');

  return (
    <div className="mt-6 space-y-10">
      <p className="text-sm text-gray-600">De schrijfgids telt nu {regelAantal} regels.</p>

      <section aria-labelledby="kop-voorstellen">
        <h2 id="kop-voorstellen" className="text-lg font-semibold text-gray-900">
          Voorgestelde schrijfregels ({voorstellen.length})
        </h2>
        <div className="mt-3 space-y-4">
          {voorstellen.length === 0 ? (
            <p className="text-sm text-gray-600">Er staat niets klaar om te beoordelen.</p>
          ) : (
            voorstellen.map((c) => <Voorstel key={c.id} c={c} />)
          )}
        </div>
      </section>

      <section aria-labelledby="kop-wachtend">
        <h2 id="kop-wachtend" className="text-lg font-semibold text-gray-900">
          Wacht op Claude ({wachtend.length})
        </h2>
        {wachtend.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">Geen correcties op de lijst.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-700">
              Zeg in Claude Code: <strong>&quot;leer van mijn correcties&quot;</strong>.
            </p>
            <ul className="mt-2 space-y-1">
              {wachtend.map((c) => (
                <li key={c.id}>
                  <Herkomst c={c} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="kop-geen">
        <h2 id="kop-geen" className="text-lg font-semibold text-gray-900">
          Geen nieuwe regel nodig ({geen.length})
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Deze correcties vielen al onder een bestaande regel, of gingen alleen over de feiten van die ene
          bevinding.
        </p>
        <div className="mt-3 space-y-2">
          {geen.slice(0, 20).map((c) => (
            <details key={c.id} className="rounded-lg border border-gray-200 bg-white">
              <summary className="cursor-pointer px-4 py-2">
                <Herkomst c={c} />
                {c.analyse?.regelIds?.length ? (
                  <span className="ml-2 text-xs text-gray-700">valt onder {c.analyse.regelIds.join(', ')}</span>
                ) : null}
              </summary>
              {c.analyse && (
                <div className="space-y-3 border-t border-gray-100 px-4 py-3">
                  <Wijzigingen a={c.analyse} />
                  <p className="text-sm text-gray-700">{c.analyse.toelichting}</p>
                </div>
              )}
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="kop-geschiedenis">
        <h2 id="kop-geschiedenis" className="text-lg font-semibold text-gray-900">
          Geschiedenis van de schrijfgids
        </h2>
        <p className="mt-1 mb-3 text-sm text-gray-600">
          Alleen wijzigingen via deze pagina. Wat je met de hand in het bestand verandert, staat in git.
        </p>
        <Geschiedenis items={geschiedenis} />
      </section>

      {afgewezen.length > 0 && (
        <section aria-labelledby="kop-afgewezen">
          <h2 id="kop-afgewezen" className="text-lg font-semibold text-gray-900">
            Niet toegevoegd ({afgewezen.length})
          </h2>
          <ul className="mt-2 space-y-1">
            {afgewezen.slice(0, 20).map((c) => (
              <li key={c.id} className="text-sm">
                <Herkomst c={c} />
                {c.analyse?.voorstel?.nieuweTekst && (
                  <span className="ml-2 text-gray-700">{c.analyse.voorstel.nieuweTekst.split('\n')[0].slice(0, 120)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="kop-test" className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 id="kop-test" className="text-lg font-semibold text-gray-900">
          Testmodus
        </h2>
        <p className="mt-2 text-sm text-gray-800">
          Testen zonder auditgegevens te wijzigen gaat in Claude Code. Zeg: <strong>&quot;test de
          schrijfstijl&quot;</strong>, plak een ruwe bevinding en noem het criterium. Je ziet daar achter
          elkaar: de ruwe input, de bevinding die Claude schrijft, jouw correctie en de analyse. Het
          voorstel dat eruit komt verschijnt hierboven met het label <em>test</em>, en werkt verder precies
          zoals een echte correctie.
        </p>
      </section>
    </div>
  );
}
