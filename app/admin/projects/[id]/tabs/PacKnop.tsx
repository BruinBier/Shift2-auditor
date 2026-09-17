'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * De PAC-uitvoer van een PDF-sample, als knopje op de steekproefrij.
 *
 * Het stond eerst alleen op de sample-detailpagina, twee klikken verderop. Maar het
 * tags-vinkje staat hier, en dat is precies het moment waarop de vraag opkomt: heeft dit
 * document tags, en zo ja, wat zegt PAC over de kwaliteit ervan.
 *
 * MEERVOUD, want één afdruk was te weinig. De werkafspraak in `Shift2_Werkwijze_PDF.md`
 * vraagt om het Summary report plus een Detailed report per tabblad met Failed of Warning.
 * Het Summary geeft alleen tellingen ("158 fout") en daaruit volgt geen bevinding: 158
 * ontbrekende tekstalternatieven vragen een ander advies dan 158 verkeerd getagde
 * decoratieve afbeeldingen.
 *
 * PLAKKEN is de hoofdweg, niet de bestandskiezer. PAC toont zijn uitkomst op het scherm;
 * die eerst opslaan als bestand en dan opzoeken in een kiezer zijn twee stappen per afdruk,
 * elke keer opnieuw. Met het knipprogramma zit de afdruk al op het klembord.
 */

export interface PacRapportItem {
  id: string;
  filePath: string;
  fileType: string;
  fileName: string;
  label: string | null;
  createdAt: string | Date;
}

interface Props {
  sampleId: string;
  sampleTitel?: string;
  rapporten: PacRapportItem[];
}

export function PacKnop({ sampleId, sampleTitel, rapporten }: Props) {
  const router = useRouter();
  const invoer = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [zojuist, setZojuist] = useState<string | null>(null);

  const aantal = rapporten.length;

  const stuur = async (file: File) => {
    setBezig(true);
    setFout(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`/api/sample-items/${sampleId}/pac-rapport`, {
        method: 'POST',
        body,
      });
      if (!res.ok) {
        const f = await res.json().catch(() => ({}));
        throw new Error(f.error || `Opslaan mislukte (${res.status})`);
      }
      const nieuw = await res.json();
      // Het venster blijft open: je plakt er meestal meteen nog een. Dichtklappen na elke
      // afdruk zou betekenen dat je voor het tweede detailscherm opnieuw moet klikken.
      setZojuist(nieuw.id);
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Opslaan mislukte');
    } finally {
      setBezig(false);
      if (invoer.current) invoer.current.value = '';
    }
  };

  const zetLabel = async (rapportId: string, label: string) => {
    try {
      await fetch(`/api/sample-items/${sampleId}/pac-rapport`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ rapportId, label }),
      });
      router.refresh();
    } catch {
      setFout('Label opslaan mislukte');
    }
  };

  const verwijder = async (rapportId: string) => {
    setBezig(true);
    setFout(null);
    try {
      const res = await fetch(
        `/api/sample-items/${sampleId}/pac-rapport?rapportId=${rapportId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`Verwijderen mislukte (${res.status})`);
      router.refresh();
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Verwijderen mislukte');
    } finally {
      setBezig(false);
    }
  };

  /**
   * Plakken vangen we op het document op, niet op een tekstvak.
   *
   * Een afbeelding op het klembord komt binnen als `clipboardData.files`. Zat die vangst op
   * een invoerveld, dan moest je daar eerst in klikken -- en dat is precies de extra stap
   * die dit moet weghalen. Zolang het venster open staat, is Ctrl+V genoeg.
   *
   * Behalve als je in een labelveld staat te typen: daar hoort Ctrl+V gewoon tekst te
   * plakken.
   */
  useEffect(() => {
    if (!open) return;
    const opPlak = (e: ClipboardEvent) => {
      const doel = e.target as HTMLElement | null;
      if (doel && (doel.tagName === 'INPUT' || doel.tagName === 'TEXTAREA')) return;
      const items = Array.from(e.clipboardData?.files ?? []);
      const bestand = items.find(
        (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      if (!bestand) return;
      e.preventDefault();
      stuur(bestand);
    };
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('paste', opPlak);
    document.addEventListener('keydown', opToets);
    return () => {
      document.removeEventListener('paste', opPlak);
      document.removeEventListener('keydown', opToets);
    };
  }, [open, sampleId]);

  const titel = aantal
    ? `${aantal} PAC-${aantal === 1 ? 'afdruk' : 'afdrukken'}. Klik om te bekijken of er een toe te voegen.`
    : 'Nog geen PAC-uitvoer. Zonder dit blijven de criteria die van de tagkwaliteit afhangen op "niet te bepalen" staan.';

  return (
    <>
      <input
        ref={invoer}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) stuur(f);
        }}
      />

      <button
        type="button"
        onClick={() => {
          setFout(null);
          setZojuist(null);
          setOpen(true);
        }}
        title={titel}
        aria-label={titel}
        className={`inline-flex h-6 items-center justify-center gap-1 rounded border px-1.5 text-[10px] font-semibold ${
          aantal
            ? 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100'
            : 'border-dashed border-gray-300 bg-white text-gray-400 hover:border-gray-400 hover:text-gray-600'
        }`}
      >
        PAC
        {aantal > 0 && <span className="tabular-nums">{aantal}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">PAC-uitvoer</h2>
            {sampleTitel && <p className="mt-0.5 text-sm text-gray-500">{sampleTitel}</p>}

            {/* Het plakvlak staat BOVEN de lijst: plakken is wat je hier komt doen, en bij
                vijf afdrukken zou het anders onder de vouw verdwijnen. */}
            <div
              className={`mt-4 rounded border-2 border-dashed border-gray-300 bg-gray-50 text-center ${
                aantal ? 'p-4' : 'p-8'
              }`}
            >
              {bezig ? (
                <p className="text-sm text-gray-600">Bezig met opslaan…</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    Druk op Ctrl+V om een schermafdruk te plakken
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Plak er gerust meer achter elkaar. Of{' '}
                    <button
                      type="button"
                      onClick={() => invoer.current?.click()}
                      className="underline hover:text-gray-700"
                    >
                      kies een bestand
                    </button>{' '}
                    — een afbeelding of het PDF-rapport van PAC.
                  </p>
                </>
              )}
            </div>

            {fout && (
              <p className="mt-3 rounded bg-red-50 px-2 py-1 text-xs text-red-800">{fout}</p>
            )}

            {aantal === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Nog niets opgeslagen. De werkafspraak vraagt om het Summary report en om een
                detailscherm van elk tabblad met Failed of Warning.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {rapporten.map((r) => {
                  const isPdf =
                    r.fileType === 'application/pdf' || /\.pdf($|\?)/i.test(r.filePath);
                  return (
                    <li
                      key={r.id}
                      className={`rounded border p-3 ${
                        zojuist === r.id ? 'border-green-400 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {/* Het label is vrije tekst: PAC's tabbladen verschillen per versie,
                            en een agent moet kunnen lezen wát hij voor zich heeft. */}
                        <input
                          type="text"
                          defaultValue={r.label ?? ''}
                          placeholder="Welk scherm is dit? Bijv. Summary"
                          onBlur={(e) => {
                            if ((e.target.value.trim() || null) !== r.label) {
                              zetLabel(r.id, e.target.value);
                            }
                          }}
                          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                        <button
                          type="button"
                          onClick={() => verwijder(r.id)}
                          disabled={bezig}
                          className="rounded px-2 py-1 text-xs text-gray-500 underline hover:bg-gray-50 disabled:opacity-50"
                        >
                          Verwijderen
                        </button>
                      </div>

                      {isPdf ? (
                        <a
                          href={r.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded border border-gray-200 bg-gray-50 p-4 text-center text-sm text-blue-600 underline"
                        >
                          {r.fileName} — openen in een nieuw tabblad
                        </a>
                      ) : (
                        <a
                          href={r.filePath}
                          target="_blank"
                          rel="noreferrer"
                          title="Openen op ware grootte"
                        >
                          {/* Geen next/image: door de onderzoeker geupload, afmetingen onbekend. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.filePath}
                            alt={`PAC-uitvoer${r.label ? `: ${r.label}` : ''} van ${sampleTitel ?? 'dit document'}`}
                            className="max-h-[50vh] w-full rounded border border-gray-200 bg-white object-contain"
                          />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
