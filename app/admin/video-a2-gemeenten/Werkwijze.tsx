'use client';

import { useState, type ReactNode } from 'react';

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
          <p className="text-gray-600">
            Claude doet het analyseren, schrijven, inspreken en monteren met de scripts in{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">scripts/video-*.py</code>. Jij
            downloadt, leest na, luistert na en publiceert. Premiere en Narakeet zijn niet meer nodig.
          </p>

          <Fase titel="Voorbereiden">
            <Stap wie="jij">
              <strong>Video downloaden</strong> in YouTube Studio (⋮ &gt; Downloaden, gemeente-account)
              naar <em>Downloads\video A2-gemeenten\&lt;videonaam&gt;\</em>. De link staat in de kolom{' '}
              <em>URL-alias</em> van de Excel.
            </Stap>
            <Stap wie="claude">
              <strong>Analyse</strong>: spraakherkenning, de ruimtes tussen de gesproken zinnen, scènes
              en overzichtsvellen met één beeldje per seconde. Eerst zonder, dan nog eens mét de namen
              uit de naambalkjes als hint.
            </Stap>
          </Fase>

          <Fase titel="Ondertiteling">
            <Stap wie="claude">
              <strong>Bestaande ondertiteling bekijken</strong>: is die er, ingebrand of een apart spoor?
              <div className="mt-1 pl-3 border-l-2 border-red-200 text-gray-600">
                Ingebrand <strong>met fouten</strong>: stopt hier, de video gaat terug naar de maker.
                Ingebrand <strong>zonder fouten</strong>: akkoord, geen actie.
              </div>
            </Stap>
            <Stap wie="claude">
              <strong>ondertiteling.srt maken</strong> en melden op welke plekken het twijfelt.
            </Stap>
            <Stap wie="jij">
              Die plekken naluisteren en de <strong>.srt uploaden</strong> in YouTube Studio, in plaats
              van het automatische spoor.
            </Stap>
          </Fase>

          <Fase titel="Audiodescriptie">
            <Stap wie="claude">
              <strong>Zinnen voorstellen</strong> voor tekst in beeld die niet hoorbaar is, per ruimte
              tussen de gesproken zinnen. Wat niet past, gaat naar het transcript.
            </Stap>
            <Stap wie="jij">
              <strong>Zinnen nalezen.</strong> Het belangrijkste controlemoment.
            </Stap>
            <Stap wie="claude">
              <strong>Inspreken</strong> met Maarten (Azure), controleren dat geen zin over een spreker
              valt, en <strong>inmengen</strong>: de muziek gaat zachter onder de stem.
            </Stap>
            <Stap wie="jij">
              <strong>Eindvideo naluisteren.</strong>
            </Stap>
          </Fase>

          <Fase titel="Transcript">
            <Stap wie="claude">
              <strong>transcript.html maken</strong>: openingsalinea, beeldteksten, beeldbeschrijvingen
              en de gesproken tekst per spreker, zonder tijdstippen.
            </Stap>
            <Stap wie="jij">
              <strong>Transcript nalezen.</strong>
            </Stap>
          </Fase>

          <Fase titel="Publiceren">
            <Stap wie="jij">
              <strong>Video met audiodescriptie uploaden</strong> in YouTube Studio, en in het{' '}
              <strong>CMS</strong> plaatsen met het transcript in een accordeon.
            </Stap>
            <Stap wie="claude">
              <strong>Eindcontrole op de pagina:</strong>
              <ul className="list-disc list-outside ml-5 mt-1 space-y-0.5 text-gray-600">
                <li>
                  1.1.1: het <code className="text-xs bg-gray-100 px-1 rounded">aria-label</code> van de
                  video is "YouTube video: [onderwerp]"
                </li>
                <li>Ondertiteling klopt</li>
                <li>Audiodescriptie zit in het audiospoor</li>
                <li>Transcript klopt</li>
              </ul>
            </Stap>
          </Fase>
        </div>
      )}
    </div>
  );
}

function Fase({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{titel}</h3>
      <div role="list" className="space-y-2">{children}</div>
    </div>
  );
}

function Stap({ wie, children }: { wie: 'jij' | 'claude'; children: ReactNode }) {
  return (
    <div role="listitem" className="flex gap-2">
      <span
        className={`shrink-0 mt-0.5 h-fit text-[11px] font-medium px-1.5 py-0.5 rounded ${
          wie === 'jij' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
        }`}
      >
        {wie === 'jij' ? 'Jij' : 'Claude'}
      </span>
      <div>{children}</div>
    </div>
  );
}
