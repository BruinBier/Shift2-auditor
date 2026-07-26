'use client';

import { useState } from 'react';

// Naslag: de vaste werkwijze per video. Uitklapbaar zodat het geen ruimte inneemt
// als je het niet nodig hebt.
export default function Werkwijze() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">Werkwijze per video</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 text-sm text-gray-700 space-y-4">
          <ol className="list-decimal list-outside ml-5 space-y-3">
            <li>
              <strong>URL uit de lijst.</strong> Pak de YouTube-link uit de kolom{' '}
              <em>Url alias</em> in de Excel.
            </li>
            <li>
              <strong>Video downloaden</strong> met 4K Video Downloader.
            </li>
            <li>
              <strong>Ondertiteling checken</strong> — is die er, en is die ingebrand of een apart
              spoor?
              <div className="mt-1 pl-3 border-l-2 border-red-200 text-gray-600">
                Ingebrand <strong>met fouten</strong>: stopt hier, de video moet terug naar de maker
                (op de terug-naar-videomaker-lijst). Ingebrand <strong>zonder fouten</strong>: akkoord,
                geen actie nodig. Apart spoor: door naar de volgende stap.
              </div>
            </li>
            <li>
              <strong>Ondertiteling checken op fouten</strong> — CC aanzetten en meelezen. Let op:
              verkeerd verstane woorden, ontbrekende interpunctie, geen sprekersaanduiding, geen{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">[muziek]</code>/geluidsaanduidingen.
              Corrigeren doe je in YouTube (gemeente-account).
              <div className="mt-1 pl-3 border-l-2 border-purple-200 text-gray-600">
                Claude helpt: plak de ondertiteling-tekst in de chat, Claude levert een gecorrigeerde
                versie die je overneemt in YouTube Studio.
              </div>
            </li>
            <li>
              <strong>Premiere Pro klaarzetten</strong> — nieuw project, video importeren in het mapje{' '}
              <em>video A2-gemeenten</em>, op de tijdlijn plaatsen, video unlinken van het geluid.
            </li>
            <li>
              <strong>Audiodescriptie — momenten markeren.</strong> Loop de video door en noteer de
              timestamp op elk moment waar tekst in beeld staat die niet hoorbaar is.
            </li>
            <li>
              <strong>Audiodescriptie-spoor maken.</strong>
              <div className="mt-1 pl-3 border-l-2 border-gray-200 text-gray-600 space-y-1">
                <div>
                  <span className="font-medium text-gray-700">Voldoende stille ruimte:</span> teksten
                  in Narakeet zetten, mp3 downloaden en op de stille momenten in Premiere inmonteren.
                  Claude helpt de beschrijvende teksten per timestamp formuleren.
                </div>
                <div>
                  <span className="font-medium text-gray-700">Onvoldoende ruimte:</span> de
                  niet-hoorbare tekst gaat in plaats daarvan in het transcript (stap 8).
                </div>
              </div>
            </li>
            <li>
              <strong>Transcript.</strong> Kopieer de (aangepaste) ondertiteling uit YouTube en plak
              die in de chat, Claude maakt er het transcript van (timestamps worden weggelaten in het
              eindproduct).
            </li>
            <li>
              <strong>Plaatsen in het CMS</strong> — video op de pagina, en de tekstversie
              (transcript) erbij via een accordeon.
            </li>
            <li>
              <strong>Eindcontrole op de pagina:</strong>
              <ul className="list-disc list-outside ml-5 mt-1 space-y-0.5 text-gray-600">
                <li>
                  1.1.1 — controleer het <code className="text-xs bg-gray-100 px-1 rounded">aria-label</code>{' '}
                  van de video: "YouTube video: [onderwerp]"
                </li>
                <li>Ondertiteling klopt</li>
                <li>Audiodescriptie zit in het audiospoor</li>
                <li>Transcript / tekstversie klopt</li>
              </ul>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
