'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  type Blok,
  type Bloksoort,
  type Kopniveau,
  type Melding,
  type PdfDocument,
  LETTERTYPEN,
  controleer,
  nieuwBlok,
  tagVan,
} from '@/lib/pdf-bouwer/model';
import { documentHtml } from '@/lib/pdf-bouwer/html';

/**
 * De PDF-bouwer: blokken links, het document zoals het in de PDF komt rechts.
 *
 * Elke wijziging wordt na een korte pauze bewaard. Het voorbeeld is dezelfde HTML die
 * Chrome afdrukt, dus wat rechts staat is wat er in de PDF komt; alleen de paginagrenzen
 * vallen in de PDF op hun eigen plek.
 */

const SOORTEN: Array<{ soort: Bloksoort; label: string }> = [
  { soort: 'kop', label: 'Kop' },
  { soort: 'alinea', label: 'Alinea' },
  { soort: 'lijst', label: 'Lijst' },
  { soort: 'afbeelding', label: 'Afbeelding' },
  { soort: 'tabel', label: 'Tabel' },
  { soort: 'paginaeinde', label: 'Pagina-einde' },
];

const MAX_AFBEELDING = 8 * 1024 * 1024;

const invoer =
  'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-shift2-primary';
const knopKlein =
  'text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40';

type Opslagstatus = 'opgeslagen' | 'wijzigingen' | 'bezig' | 'fout';

export default function Bouwer({ initieel }: { initieel: PdfDocument }) {
  const [doc, setDoc] = useState<PdfDocument>(initieel);
  const [status, setStatus] = useState<Opslagstatus>('opgeslagen');
  const [pdfBezig, setPdfBezig] = useState(false);
  const [pdfFout, setPdfFout] = useState<string | null>(null);
  const eersteRender = useRef(true);

  // ── Automatisch bewaren ──
  useEffect(() => {
    if (eersteRender.current) {
      eersteRender.current = false;
      return;
    }
    setStatus('wijzigingen');
    const t = setTimeout(async () => {
      setStatus('bezig');
      try {
        const res = await fetch(`/api/pdf-bouwer/${doc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(doc),
        });
        setStatus(res.ok ? 'opgeslagen' : 'fout');
      } catch {
        setStatus('fout');
      }
    }, 700);
    return () => clearTimeout(t);
  }, [doc]);

  // Niet weggaan met onbewaarde wijzigingen.
  useEffect(() => {
    const waarschuw = (e: BeforeUnloadEvent) => {
      if (status === 'wijzigingen' || status === 'bezig') e.preventDefault();
    };
    window.addEventListener('beforeunload', waarschuw);
    return () => window.removeEventListener('beforeunload', waarschuw);
  }, [status]);

  // ── Voorbeeld, iets vertraagd zodat het niet bij elke toets opnieuw laadt ──
  const [voorbeeld, setVoorbeeld] = useState(() => documentHtml(initieel, { voorbeeld: true }));
  useEffect(() => {
    const t = setTimeout(() => setVoorbeeld(documentHtml(doc, { voorbeeld: true })), 350);
    return () => clearTimeout(t);
  }, [doc]);

  const meldingen = useMemo(() => controleer(doc), [doc]);
  const fouten = meldingen.filter((m) => m.ernst === 'fout');

  // ── Bewerkingen ──
  const zet = (wijziging: Partial<PdfDocument>) => setDoc((d) => ({ ...d, ...wijziging }));
  const zetBlok = (id: string, wijziging: Partial<Blok>) =>
    setDoc((d) => ({
      ...d,
      blokken: d.blokken.map((b) => (b.id === id ? ({ ...b, ...wijziging } as Blok) : b)),
    }));
  const voegToe = (soort: Bloksoort, naIndex: number) =>
    setDoc((d) => {
      const blokken = [...d.blokken];
      blokken.splice(naIndex + 1, 0, nieuwBlok(soort));
      return { ...d, blokken };
    });
  const verplaats = (index: number, richting: -1 | 1) =>
    setDoc((d) => {
      const blokken = [...d.blokken];
      const doel = index + richting;
      if (doel < 0 || doel >= blokken.length) return d;
      [blokken[index], blokken[doel]] = [blokken[doel], blokken[index]];
      return { ...d, blokken };
    });
  const verwijder = (id: string) =>
    setDoc((d) => ({ ...d, blokken: d.blokken.filter((b) => b.id !== id) }));

  async function downloadPdf() {
    setPdfFout(null);
    setPdfBezig(true);
    try {
      // Eerst bewaren, zodat de server de laatste versie afdrukt.
      await fetch(`/api/pdf-bouwer/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(doc),
      });
      setStatus('opgeslagen');
      const res = await fetch(`/api/pdf-bouwer/${doc.id}/pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setPdfFout(body.error || `De PDF kon niet worden gemaakt (${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.titel.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfBezig(false);
    }
  }

  const statustekst: Record<Opslagstatus, string> = {
    opgeslagen: 'Opgeslagen',
    wijzigingen: 'Wijzigingen…',
    bezig: 'Opslaan…',
    fout: 'Opslaan mislukt',
  };

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/pdf-bouwer" className="text-sm text-shift2-primary hover:underline">
            ← Alle documenten
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{doc.titel || 'Zonder titel'}</h1>
          <span
            role="status"
            className={`text-xs ${status === 'fout' ? 'text-red-700 font-medium' : 'text-gray-500'}`}
          >
            {statustekst[status]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {fouten.length > 0 && (
            <span className="text-sm text-red-700">
              {fouten.length} {fouten.length === 1 ? 'fout' : 'fouten'} op te lossen
            </span>
          )}
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBezig || fouten.length > 0}
            className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium disabled:opacity-50"
          >
            {pdfBezig ? 'PDF maken…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {pdfFout && (
        <p role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2 rounded">
          {pdfFout}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── Links: instellingen en blokken ── */}
        <div className="space-y-4">
          <section aria-labelledby="kop-instellingen" className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 id="kop-instellingen" className="font-semibold text-gray-900 mb-3">
              Document
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-sm">
                <span className="block text-gray-700 mb-1">Titel (komt in de documenteigenschappen)</span>
                <input className={invoer} value={doc.titel} onChange={(e) => zet({ titel: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Taal</span>
                <input className={invoer} value={doc.taal} onChange={(e) => zet({ taal: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Lettertype</span>
                <select
                  className={invoer}
                  value={doc.lettertype}
                  onChange={(e) => zet({ lettertype: e.target.value as PdfDocument['lettertype'] })}
                >
                  {LETTERTYPEN.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Tekstgrootte (punten)</span>
                <input
                  type="number"
                  min={9}
                  max={16}
                  step={0.5}
                  className={invoer}
                  value={doc.tekstgrootte}
                  onChange={(e) => zet({ tekstgrootte: Number(e.target.value) || 11 })}
                />
              </label>
              <label className="text-sm flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={doc.paginanummers}
                  onChange={(e) => zet({ paginanummers: e.target.checked })}
                />
                Paginanummers onderaan
              </label>
            </div>
            <DocumentMeldingen meldingen={meldingen.filter((m) => m.blokId === null)} />
          </section>

          <section aria-labelledby="kop-blokken">
            <h2 id="kop-blokken" className="sr-only">
              Blokken
            </h2>
            <Toevoegen onKies={(s) => voegToe(s, -1)} label="Bovenaan toevoegen" />
            <ol className="space-y-3 mt-3">
              {doc.blokken.map((b, i) => (
                <li key={b.id}>
                  <BlokKaart
                    blok={b}
                    nummer={i + 1}
                    meldingen={meldingen.filter((m) => m.blokId === b.id)}
                    eerste={i === 0}
                    laatste={i === doc.blokken.length - 1}
                    onWijzig={(w) => zetBlok(b.id, w)}
                    onOmhoog={() => verplaats(i, -1)}
                    onOmlaag={() => verplaats(i, 1)}
                    onVerwijder={() => verwijder(b.id)}
                  />
                  <div className="mt-2">
                    <Toevoegen onKies={(s) => voegToe(s, i)} label={`Toevoegen na blok ${i + 1}`} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ── Rechts: het voorbeeld ── */}
        <section aria-labelledby="kop-voorbeeld" className="xl:sticky xl:top-4">
          <h2 id="kop-voorbeeld" className="font-semibold text-gray-900 mb-2">
            Voorbeeld
          </h2>
          <iframe
            title="Voorbeeld van het document"
            srcDoc={voorbeeld}
            className="w-full h-[calc(100vh-8rem)] min-h-[500px] border border-gray-300 rounded-lg bg-gray-200"
          />
        </section>
      </div>
    </main>
  );
}

function DocumentMeldingen({ meldingen }: { meldingen: Melding[] }) {
  if (meldingen.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1">
      {meldingen.map((m, i) => (
        <li
          key={i}
          className={`text-sm px-3 py-1.5 rounded ${
            m.ernst === 'fout' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'
          }`}
        >
          <span className="font-medium">{m.ernst === 'fout' ? 'Fout: ' : 'Let op: '}</span>
          {m.tekst}
        </li>
      ))}
    </ul>
  );
}

function Toevoegen({ onKies, label }: { onKies: (s: Bloksoort) => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="text-xs text-gray-500 mr-1">+</span>
      {SOORTEN.map((s) => (
        <button key={s.soort} type="button" className={knopKlein} onClick={() => onKies(s.soort)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

function BlokKaart({
  blok,
  nummer,
  meldingen,
  eerste,
  laatste,
  onWijzig,
  onOmhoog,
  onOmlaag,
  onVerwijder,
}: {
  blok: Blok;
  nummer: number;
  meldingen: Melding[];
  eerste: boolean;
  laatste: boolean;
  onWijzig: (w: Partial<Blok>) => void;
  onOmhoog: () => void;
  onOmlaag: () => void;
  onVerwijder: () => void;
}) {
  const naam = SOORTEN.find((s) => s.soort === blok.soort)?.label ?? blok.soort;
  const heeftFout = meldingen.some((m) => m.ernst === 'fout');
  return (
    <div
      className={`bg-white border rounded-lg p-4 ${heeftFout ? 'border-red-300' : 'border-gray-200'}`}
      aria-label={`Blok ${nummer}: ${naam}`}
      role="group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 tabular-nums">{nummer}</span>
          <span className="text-sm font-medium text-gray-800">{naam}</span>
          <span className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded" title="Tag in de PDF">
            {tagVan(blok)}
          </span>
        </div>
        <div className="flex gap-1">
          <button type="button" className={knopKlein} onClick={onOmhoog} disabled={eerste} aria-label={`Blok ${nummer} omhoog`}>
            ↑
          </button>
          <button type="button" className={knopKlein} onClick={onOmlaag} disabled={laatste} aria-label={`Blok ${nummer} omlaag`}>
            ↓
          </button>
          <button
            type="button"
            className={`${knopKlein} text-red-700`}
            onClick={onVerwijder}
            aria-label={`Blok ${nummer} verwijderen`}
          >
            Verwijderen
          </button>
        </div>
      </div>

      <BlokInvoer blok={blok} onWijzig={onWijzig} />
      <DocumentMeldingen meldingen={meldingen} />
    </div>
  );
}

const OPMAAKHULP = 'Opmaak: **vet**, *cursief*, [linktekst](https://adres). Een lege regel begint een nieuwe alinea.';

function BlokInvoer({ blok, onWijzig }: { blok: Blok; onWijzig: (w: Partial<Blok>) => void }) {
  switch (blok.soort) {
    case 'kop':
      return (
        <div className="flex gap-2">
          <label className="text-sm">
            <span className="sr-only">Kopniveau</span>
            <select
              className={invoer}
              value={blok.niveau}
              onChange={(e) => onWijzig({ niveau: Number(e.target.value) as Kopniveau })}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  Kop {n}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-1">
            <span className="sr-only">Tekst van de kop</span>
            <input className={invoer} value={blok.tekst} onChange={(e) => onWijzig({ tekst: e.target.value })} />
          </label>
        </div>
      );

    case 'alinea':
      return (
        <label className="text-sm block">
          <span className="sr-only">Tekst van de alinea</span>
          <textarea
            className={`${invoer} min-h-[90px]`}
            value={blok.tekst}
            onChange={(e) => onWijzig({ tekst: e.target.value })}
          />
          <span className="block text-xs text-gray-500 mt-1">{OPMAAKHULP}</span>
        </label>
      );

    case 'lijst':
      return (
        <div className="space-y-2">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={blok.genummerd}
              onChange={(e) => onWijzig({ genummerd: e.target.checked })}
            />
            Genummerde lijst
          </label>
          <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Items, één per regel</span>
            <textarea
              className={`${invoer} min-h-[90px]`}
              value={blok.items.join('\n')}
              onChange={(e) => onWijzig({ items: e.target.value.split('\n') })}
            />
          </label>
        </div>
      );

    case 'afbeelding':
      return <AfbeeldingInvoer blok={blok} onWijzig={onWijzig} />;

    case 'tabel':
      return <TabelInvoer blok={blok} onWijzig={onWijzig} />;

    case 'paginaeinde':
      return <p className="text-sm text-gray-600">Wat hierna komt, begint op een nieuwe pagina.</p>;
  }
}

function AfbeeldingInvoer({
  blok,
  onWijzig,
}: {
  blok: Extract<Blok, { soort: 'afbeelding' }>;
  onWijzig: (w: Partial<Blok>) => void;
}) {
  const [fout, setFout] = useState<string | null>(null);

  function kies(bestand: File | undefined) {
    setFout(null);
    if (!bestand) return;
    if (!bestand.type.startsWith('image/')) {
      setFout('Dit is geen afbeelding.');
      return;
    }
    if (bestand.size > MAX_AFBEELDING) {
      setFout(`De afbeelding is ${(bestand.size / 1024 / 1024).toFixed(1)} MB; maximaal 8 MB.`);
      return;
    }
    const lezer = new FileReader();
    lezer.onload = () => onWijzig({ bron: String(lezer.result) });
    lezer.readAsDataURL(bestand);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {blok.bron ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={blok.bron} alt="" className="w-32 h-24 object-contain border border-gray-200 rounded bg-gray-50" />
        ) : (
          <div className="w-32 h-24 border border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center text-xs text-gray-400">
            geen afbeelding
          </div>
        )}
        <div className="flex-1 space-y-2">
          <label className="text-sm block">
            <span className="block text-gray-700 mb-1">{blok.bron ? 'Andere afbeelding kiezen' : 'Afbeelding kiezen'}</span>
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={(e) => kies(e.target.files?.[0])} className="text-sm" />
          </label>
          {fout && <p role="alert" className="text-sm text-red-700">{fout}</p>}
          <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Breedte: {blok.breedte}% van de tekstbreedte</span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={blok.breedte}
              onChange={(e) => onWijzig({ breedte: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        </div>
      </div>

      <label className="text-sm flex items-center gap-2">
        <input type="checkbox" checked={blok.decoratief} onChange={(e) => onWijzig({ decoratief: e.target.checked })} />
        Decoratief (geen informatie; wordt een artefact en niet voorgelezen)
      </label>

      {!blok.decoratief && (
        <label className="text-sm block">
          <span className="block text-gray-700 mb-1">
            Tekstalternatief (kort) <span className="text-gray-400">{blok.alt.trim().length} tekens</span>
          </span>
          <input className={invoer} value={blok.alt} onChange={(e) => onWijzig({ alt: e.target.value })} />
        </label>
      )}

      <label className="text-sm block">
        <span className="block text-gray-700 mb-1">Bijschrift (zichtbaar, optioneel)</span>
        <input className={invoer} value={blok.bijschrift} onChange={(e) => onWijzig({ bijschrift: e.target.value })} />
      </label>

      <label className="text-sm block">
        <span className="block text-gray-700 mb-1">
          Uitgebreide beschrijving (zichtbare tekst onder de afbeelding, optioneel)
        </span>
        <textarea
          className={`${invoer} min-h-[90px]`}
          value={blok.beschrijving}
          onChange={(e) => onWijzig({ beschrijving: e.target.value })}
        />
        <span className="block text-xs text-gray-500 mt-1">{OPMAAKHULP}</span>
      </label>
    </div>
  );
}

function TabelInvoer({
  blok,
  onWijzig,
}: {
  blok: Extract<Blok, { soort: 'tabel' }>;
  onWijzig: (w: Partial<Blok>) => void;
}) {
  const kolommen = blok.rijen[0]?.length ?? 0;
  const zetCel = (r: number, k: number, waarde: string) =>
    onWijzig({ rijen: blok.rijen.map((rij, ri) => (ri === r ? rij.map((c, ki) => (ki === k ? waarde : c)) : rij)) });

  return (
    <div className="space-y-3">
      <label className="text-sm block">
        <span className="block text-gray-700 mb-1">Bijschrift van de tabel (optioneel)</span>
        <input className={invoer} value={blok.bijschrift} onChange={(e) => onWijzig({ bijschrift: e.target.value })} />
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={blok.kopRij} onChange={(e) => onWijzig({ kopRij: e.target.checked })} />
          Eerste rij is koprij
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={blok.kopKolom} onChange={(e) => onWijzig({ kopKolom: e.target.checked })} />
          Eerste kolom bevat rijkoppen
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {blok.rijen.map((rij, r) => (
              <tr key={r}>
                {rij.map((cel, k) => {
                  const isKop = (blok.kopRij && r === 0) || (blok.kopKolom && k === 0);
                  return (
                    <td key={k} className="p-0.5">
                      <input
                        className={`${invoer} min-w-[110px] ${isKop ? 'bg-gray-100 font-semibold' : ''}`}
                        value={cel}
                        aria-label={`Rij ${r + 1}, kolom ${k + 1}${isKop ? ' (kopcel)' : ''}`}
                        onChange={(e) => zetCel(r, k, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={knopKlein}
          onClick={() => onWijzig({ rijen: [...blok.rijen, Array(kolommen).fill('')] })}
        >
          + Rij
        </button>
        <button
          type="button"
          className={knopKlein}
          disabled={blok.rijen.length <= 1}
          onClick={() => onWijzig({ rijen: blok.rijen.slice(0, -1) })}
        >
          − Laatste rij
        </button>
        <button
          type="button"
          className={knopKlein}
          onClick={() => onWijzig({ rijen: blok.rijen.map((rij) => [...rij, '']) })}
        >
          + Kolom
        </button>
        <button
          type="button"
          className={knopKlein}
          disabled={kolommen <= 1}
          onClick={() => onWijzig({ rijen: blok.rijen.map((rij) => rij.slice(0, -1)) })}
        >
          − Laatste kolom
        </button>
      </div>
    </div>
  );
}
