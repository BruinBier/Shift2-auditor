'use client';

/**
 * Exporteren naar en importeren uit Excel, voor de klantprojecten.
 *
 * Importeren gaat in twee stappen: eerst controleert de server het bestand en
 * laat zien wat er zou veranderen, pas na "Import doorvoeren" gebeurt het. Zie
 * lib/projecten-excel.ts voor de regels.
 */
import { useEffect, useRef, useState } from 'react';
import type { Controle, Melding } from '@/lib/projecten-excel';

type Fase =
  | { soort: 'leeg' }
  | { soort: 'bezig'; tekst: string }
  | { soort: 'fout'; tekst: string }
  | { soort: 'controle'; controle: Controle }
  | { soort: 'klaar'; aangemaakt: number; bijgewerkt: number };

function meldingTekst(m: Melding) {
  const plek = [m.regel ? `Regel ${m.regel}` : null, m.kolom ? `kolom "${m.kolom}"` : null].filter(Boolean).join(', ');
  return plek ? `${plek}: ${m.bericht}` : m.bericht;
}

function leeg(waarde: string | null) {
  return waarde === null || waarde === '' ? <em className="text-gray-500">(leeg)</em> : waarde;
}

export default function ProjectenExcel({ onGeimporteerd }: { onGeimporteerd: () => void }) {
  const dialoog = useRef<HTMLDialogElement>(null);
  const bestandInvoer = useRef<HTMLInputElement>(null);
  const uploadKnop = useRef<HTMLButtonElement>(null);
  const resultaat = useRef<HTMLDivElement>(null);
  const [bestand, setBestand] = useState<File | null>(null);
  const [fase, setFase] = useState<Fase>({ soort: 'leeg' });
  const [exportStatus, setExportStatus] = useState('');
  const [exporteren, setExporteren] = useState(false);

  // Na elke uitkomst de focus erop, zodat toetsenbord en schermlezer bij het resultaat beginnen.
  const focusResultaat = () => setTimeout(() => resultaat.current?.focus(), 0);

  async function exporteer() {
    setExporteren(true);
    setExportStatus('Het Excelbestand wordt gemaakt…');
    try {
      const res = await fetch('/api/client-projects/excel');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'De export is mislukt.');
      }
      const blob = await res.blob();
      const naam = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? 'shift2-projecten.xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = naam;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportStatus(`${naam} is gedownload.`);
    } catch (e) {
      setExportStatus(e instanceof Error ? e.message : 'De export is mislukt.');
    } finally {
      setExporteren(false);
    }
  }

  async function controleerBestand(gekozen: File) {
    setBestand(gekozen);
    setFase({ soort: 'bezig', tekst: `${gekozen.name} wordt gecontroleerd…` });
    dialoog.current?.showModal();
    try {
      const form = new FormData();
      form.append('bestand', gekozen);
      const res = await fetch('/api/client-projects/excel/controle', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Het bestand kon niet worden gecontroleerd.');
      setFase({ soort: 'controle', controle: data as Controle });
    } catch (e) {
      setFase({ soort: 'fout', tekst: e instanceof Error ? e.message : 'Het bestand kon niet worden gecontroleerd.' });
    }
    focusResultaat();
  }

  async function doorvoeren(controle: Controle) {
    if (!bestand) return;
    setFase({ soort: 'bezig', tekst: 'De import wordt doorgevoerd…' });
    try {
      const form = new FormData();
      form.append('bestand', bestand);
      form.append('vingerafdruk', controle.vingerafdruk);
      const res = await fetch('/api/client-projects/excel/toepassen', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        // Is het overzicht intussen veranderd, laat dan het nieuwe zien in plaats van alleen een fout.
        if (data.controle) {
          setFase({ soort: 'controle', controle: { ...data.controle, fouten: [{ bericht: data.error }, ...data.controle.fouten] } });
        } else {
          setFase({ soort: 'fout', tekst: data.error || 'De import is mislukt. Er is niets gewijzigd.' });
        }
      } else {
        setFase({ soort: 'klaar', aangemaakt: data.aangemaakt, bijgewerkt: data.bijgewerkt });
        onGeimporteerd();
      }
    } catch {
      setFase({ soort: 'fout', tekst: 'De import is mislukt. Er is niets gewijzigd.' });
    }
    focusResultaat();
  }

  function sluit() {
    dialoog.current?.close();
  }

  // Het native close-event: komt ook bij Escape, en React 18 geeft onClose op een
  // dialog niet betrouwbaar door. De focus gaat terug naar de knop waarmee het begon,
  // na het eigen focusherstel van de browser.
  useEffect(() => {
    const d = dialoog.current;
    if (!d) return;
    const naSluiten = () => {
      setFase({ soort: 'leeg' });
      setBestand(null);
      if (bestandInvoer.current) bestandInvoer.current.value = '';
      setTimeout(() => uploadKnop.current?.focus(), 0);
    };
    d.addEventListener('close', naSluiten);
    return () => d.removeEventListener('close', naSluiten);
  }, []);

  const knop =
    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shift2-primary disabled:opacity-60';

  return (
    <>
      <button type="button" onClick={exporteer} disabled={exporteren} className={knop}>
        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exporteren naar Excel
      </button>
      <button type="button" ref={uploadKnop} onClick={() => bestandInvoer.current?.click()} className={knop}>
        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Excel uploaden
      </button>
      <input
        ref={bestandInvoer}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) controleerBestand(f);
        }}
      />
      <p role="status" className="sr-only">
        {exportStatus}
      </p>

      <dialog
        ref={dialoog}
        aria-labelledby="excel-import-titel"
        className="w-[calc(100%-2rem)] max-w-4xl rounded-lg p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div>
            <h2 id="excel-import-titel" className="text-lg font-semibold text-gray-900">
              Excel-import controleren
            </h2>
            {bestand && <p className="text-sm text-gray-600">{bestand.name}</p>}
          </div>
          <button
            type="button"
            onClick={sluit}
            className="rounded p-1 text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-shift2-primary"
          >
            <span className="sr-only">Sluiten</span>
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref={resultaat} tabIndex={-1} className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6 focus:outline-none">
          {fase.soort === 'bezig' && (
            <p role="status" className="text-sm text-gray-700">
              {fase.tekst}
            </p>
          )}
          {fase.soort === 'fout' && (
            <div role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              {fase.tekst}
            </div>
          )}
          {fase.soort === 'klaar' && (
            <div role="status" className="rounded border border-green-300 bg-green-50 p-4 text-sm text-green-900">
              De import is doorgevoerd: {fase.aangemaakt} {fase.aangemaakt === 1 ? 'project' : 'projecten'} aangemaakt,{' '}
              {fase.bijgewerkt} bijgewerkt.
            </div>
          )}
          {fase.soort === 'controle' && <Overzicht controle={fase.controle} />}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {fase.soort === 'controle' && (
            <ImportKnop controle={fase.controle} onBevestig={() => doorvoeren(fase.controle)} />
          )}
          <button type="button" onClick={sluit} className={knop}>
            {fase.soort === 'klaar' ? 'Sluiten' : 'Annuleren'}
          </button>
        </div>
      </dialog>
    </>
  );
}

function ImportKnop({ controle, onBevestig }: { controle: Controle; onBevestig: () => void }) {
  const aantal = controle.nieuw.length + controle.gewijzigd.length;
  if (controle.fouten.length > 0) {
    return <p className="mr-auto text-sm text-red-800">Los eerst de fouten op in Excel en upload het bestand opnieuw.</p>;
  }
  if (aantal === 0) {
    return <p className="mr-auto text-sm text-gray-700">Er is niets te wijzigen.</p>;
  }
  const delen = [
    controle.nieuw.length ? `${controle.nieuw.length} aanmaken` : null,
    controle.gewijzigd.length ? `${controle.gewijzigd.length} bijwerken` : null,
  ].filter(Boolean);
  return (
    <button
      type="button"
      onClick={onBevestig}
      className="rounded-lg bg-shift2-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shift2-primary"
    >
      Import doorvoeren: {delen.join(' en ')}
    </button>
  );
}

function Overzicht({ controle }: { controle: Controle }) {
  const { nieuw, gewijzigd, ongewijzigd, nietInBestand, fouten, waarschuwingen } = controle;
  const th = 'px-3 py-2 text-left font-medium text-gray-700';
  const td = 'px-3 py-2 align-top';

  return (
    <div className="space-y-6 text-sm text-gray-900">
      {fouten.length > 0 && (
        <section role="alert" aria-labelledby="excel-fouten" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
          <h3 id="excel-fouten" className="font-semibold">
            {fouten.length === 1 ? '1 fout' : `${fouten.length} fouten`}: er wordt niets doorgevoerd
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {fouten.map((m, i) => (
              <li key={i}>{meldingTekst(m)}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="excel-samenvatting">
        <h3 id="excel-samenvatting" className="sr-only">
          Samenvatting
        </h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Nieuw', nieuw.length],
            ['Gewijzigd', gewijzigd.length],
            ['Ongewijzigd', ongewijzigd.length],
            ['Fouten', fouten.length],
          ].map(([label, n]) => (
            <div key={label} className="rounded border border-gray-200 p-3">
              <dt className="text-gray-600">{label}</dt>
              <dd className="text-xl font-semibold">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      {waarschuwingen.length > 0 && (
        <section aria-labelledby="excel-waarschuwingen" className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <h3 id="excel-waarschuwingen" className="font-semibold">
            Let op ({waarschuwingen.length})
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {waarschuwingen.map((m, i) => (
              <li key={i}>{meldingTekst(m)}</li>
            ))}
          </ul>
        </section>
      )}

      {nieuw.length > 0 && (
        <section aria-labelledby="excel-nieuw">
          <h3 id="excel-nieuw" className="mb-2 font-semibold">
            Nieuwe projecten ({nieuw.length})
          </h3>
          <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={th}>Regel</th>
                <th scope="col" className={th}>Projectnaam</th>
                <th scope="col" className={th}>Opdrachtgever</th>
                <th scope="col" className={th}>CRM-nummer</th>
              </tr>
            </thead>
            <tbody>
              {nieuw.map(n => (
                <tr key={n.regel} className="border-t border-gray-200">
                  <td className={td}>{n.regel}</td>
                  <td className={td}>{n.name}</td>
                  <td className={td}>{n.opdrachtgeverKenmerk}</td>
                  <td className={td}>{leeg(n.projectnummer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {gewijzigd.length > 0 && (
        <section aria-labelledby="excel-gewijzigd">
          <h3 id="excel-gewijzigd" className="mb-2 font-semibold">
            Gewijzigde projecten ({gewijzigd.length})
          </h3>
          <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={th}>Regel</th>
                <th scope="col" className={th}>Project</th>
                <th scope="col" className={th}>Veld</th>
                <th scope="col" className={th}>Was</th>
                <th scope="col" className={th}>Wordt</th>
              </tr>
            </thead>
            <tbody>
              {gewijzigd.flatMap(g =>
                g.wijzigingen.map((w, i) => (
                  <tr key={`${g.id}-${w.veld}`} className="border-t border-gray-200">
                    <td className={td}>{g.regel}</td>
                    <td className={td}>{i === 0 ? g.name : <span className="sr-only">{g.name}</span>}</td>
                    <td className={td}>{w.label}</td>
                    <td className={td}>{leeg(w.oud)}</td>
                    <td className={`${td} font-medium`}>{leeg(w.nieuw)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {ongewijzigd.length > 0 && (
        <details className="rounded border border-gray-200 p-3">
          <summary className="cursor-pointer font-semibold">Ongewijzigde projecten ({ongewijzigd.length})</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {ongewijzigd.map(o => (
              <li key={o.id}>
                Regel {o.regel}: {o.name}
              </li>
            ))}
          </ul>
        </details>
      )}

      {nietInBestand.length > 0 && (
        <details className="rounded border border-gray-200 p-3">
          <summary className="cursor-pointer font-semibold">
            Niet in het bestand ({nietInBestand.length}): deze blijven bestaan
          </summary>
          <p className="mt-2 text-gray-700">
            Een project dat niet in het bestand staat, wordt niet verwijderd of gewijzigd.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {nietInBestand.map(o => (
              <li key={o.id}>{o.name}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
