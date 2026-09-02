'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Routekaartje voor de voorbereiding van een onderzoek: van aanmaken tot een
 * akkoord op de planning.
 *
 * Stappen die uit een gevuld veld blijken vinkt de tool zelf af. De twee
 * stappen die buiten de tool gebeuren (mail versturen, gesprek voeren) zet je
 * met de hand aan.
 */
export default function VoorbereidingStappen({ project }: { project: any }) {
  const [bezig, setBezig] = useState<string | null>(null);
  const [gekopieerd, setGekopieerd] = useState<string | null>(null);

  const contact = project.clientProject?.opdrachtgever;
  const contactnaam = (contact?.contactnaam || '').split(' ')[0];
  const scopeUrl =
    project.scopeInScope?.trim() ||
    project.scopeUrls?.find((u: any) => u.inScope)?.url ||
    '';

  // Standaardtekst voor de uitnodiging. Wijkt de situatie af, dan pas je de
  // tekst aan in je mailprogramma voor je hem verstuurt.
  //
  // De openingszin hangt af van hoe de opdracht binnenkwam. Staat er een
  // accountmanager op, dan liep het via sales en is dat de aanleiding die de
  // klant herkent. Is dat veld leeg, dan heeft de onderzoeker er zelf over
  // gemaild -- en dan klopt "via onze salesafdeling" niet, want de klant heeft
  // die correspondentie zelf gevoerd.
  const viaSales = Boolean(project.accountmanager?.trim());
  const uitnodiging = [
    `Dag ${contactnaam || '[naam]'},`,
    '',
    viaSales
      ? `Via onze salesafdeling heb ik een aanvraag binnengekregen voor een toegankelijkheidsonderzoek voor ${scopeUrl || '[website]'}`
      : `Naar aanleiding van je akkoord kan het toegankelijkheidsonderzoek voor ${scopeUrl || '[website]'} van start.`,
    '',
    'Ik bespreek graag kort de scope en planning met je door: wat we wel en niet meenemen in het onderzoek, en wanneer we het kunnen inplannen.',
    '',
    'Laat je me weten wanneer het jou uitkomt om hierover kort te overleggen?',
  ].join('\n');

  const datumNl = (d: Date) =>
    format(d, d.getFullYear() === new Date().getFullYear() ? 'd MMMM' : 'd MMMM yyyy', {
      locale: nl,
    });

  /** ISO-weeknummer: de week waarin de hertest valt. */
  const weeknummer = (d: Date) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const jaarStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t.getTime() - jaarStart.getTime()) / 86400000 + 1) / 7);
  };

  // Standaardtekst voor de planningsmail. De alinea over het vervolgoverleg
  // hoort bij een onderzoek met hertest; zonder hertest valt die weg.
  const planningsmail = (() => {
    const start = project.dateStart ? new Date(project.dateStart) : null;
    const eind = project.dateEnd ? new Date(project.dateEnd) : null;
    const site = scopeUrl.split('\n')[0]?.replace(/^[-*•]\s*/, '').trim() || '[website]';
    const domein = site.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

    const klantpaginas = (project.sampleClientPages || '')
      .split('\n')
      .map((r: string) => r.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean);

    const regels: string[] = [
      `Dag ${contactnaam || '[naam]'},`,
      '',
      `Hierbij de planning voor het toegankelijkheidsonderzoek van ${domein}.`,
      '',
      start && eind
        ? `Het onderzoek (nulmeting) loopt van ${datumNl(start)} tot en met ${datumNl(eind)}.`
        : 'Het onderzoek (nulmeting) loopt van [startdatum] tot en met [deadline].',
      '',
      `De volgende website zal worden getoetst: ${site}`,
    ];

    if (klantpaginas.length) {
      regels.push('');
      regels.push("De volgende pagina's neem ik op jouw verzoek mee in de steekproef:");
      klantpaginas.forEach((p: string) => regels.push(p));
    }

    if (project.hasReinspection && eind && project.reinspectionWeeks) {
      const hertest = new Date(eind);
      hertest.setDate(hertest.getDate() + project.reinspectionWeeks * 7);
      regels.push('');
      regels.push(
        `De hertest staat gepland in week ${weeknummer(hertest)}, dat is in de week van ${datumNl(hertest)}.`
      );
      regels.push('');
      regels.push(
        'Na afronding van de nulmeting ontvang je van mij een uitnodiging voor een overleg. In dat gesprek nemen we de resultaten gezamenlijk door en bespreken we de vervolgstappen.'
      );
    }

    regels.push('');
    regels.push(
      'Zou je kunnen bevestigen of deze planning akkoord is? Bij akkoord plannen wij de werkzaamheden definitief in.'
    );
    regels.push('');
    regels.push('Heb je in de tussentijd nog vragen? Laat het gerust weten.');

    return regels.join('\n');
  })();

  const kopieer = async (tekst: string, welke: string) => {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(welke);
      setTimeout(() => setGekopieerd(null), 2000);
    } catch {
      alert('Kopiëren is niet gelukt. Selecteer de tekst en kopieer met Ctrl+C.');
    }
  };

  const stappen = [
    {
      key: 'aangemaakt',
      label: 'Onderzoek aangemaakt',
      klaar: true,
      datum: project.createdAt,
      handmatig: false,
    },
    {
      key: 'invitationSent',
      label: 'Uitnodiging verstuurd',
      klaar: Boolean(project.invitationSent),
      datum: project.invitationSent,
      handmatig: true,
    },
    {
      key: 'scopeCallHeld',
      label: 'Scopegesprek gevoerd',
      klaar: Boolean(project.scopeCallHeld),
      datum: project.scopeCallHeld,
      handmatig: true,
    },
    {
      key: 'transcript',
      label: 'Transcript toegevoegd',
      klaar: Boolean(project.scopeCallTranscript?.trim()),
      datum: null,
      handmatig: false,
    },
    {
      // De website staat er al vanaf de intake; de scope is pas af als na het
      // scopegesprek ook de overige informatie is ingevuld, met de wettelijke
      // uitzonderingen. "Buiten scope" telt niet mee: dat mag leeg blijven als
      // er niets specifieks is uitgesloten.
      key: 'scope',
      label: 'Scope ingevuld',
      klaar: Boolean(project.scopeInScope?.trim() && project.scopeInfo?.trim()),
      datum: null,
      handmatig: false,
    },
    {
      key: 'planning',
      label: 'Planning bepaald',
      klaar: Boolean(project.dateStart && project.dateEnd),
      datum: project.dateStart,
      handmatig: false,
    },
    {
      // Versturen doe je in je mailprogramma, dus hier zelf afvinken.
      key: 'planningSent',
      label: 'Planningsmail verstuurd',
      klaar: Boolean(project.planningSent),
      datum: project.planningSent,
      handmatig: true,
    },
    {
      // Het akkoord komt van de klant, dus ook dit vink je zelf af.
      key: 'planningApproved',
      label: 'Planning akkoord',
      klaar: Boolean(project.planningApproved),
      datum: project.planningApproved,
      handmatig: true,
    },
  ];

  const gedaan = stappen.filter((s) => s.klaar).length;

  const zetStap = async (key: string, aan: boolean) => {
    setBezig(key);
    try {
      // Met een akkoord op de planning is de voorbereiding klaar; het
      // onderzoek staat dan niet meer in de intakefase.
      const statusVolgt =
        key === 'planningApproved' && aan && project.status === 'Intake'
          ? { status: 'Gepland' }
          : {};

      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [key]: aan ? new Date().toISOString() : null,
          ...statusVolgt,
        }),
      });
      // Volledige herlaad: de projectpagina is een servercomponent, en
      // router.refresh() vernieuwt de doorgegeven project-props hier niet.
      if (res.ok) window.location.reload();
      else alert('Het bijwerken van de stap is niet gelukt.');
    } catch (error) {
      console.error('Error updating step:', error);
      alert('Het bijwerken van de stap is niet gelukt.');
    } finally {
      setBezig(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Voorbereiding</h3>
        </div>
        <span className="text-sm text-gray-500">{gedaan} van {stappen.length}</span>
      </div>
      <div className="p-4">
        <ol className="space-y-2">
          {stappen.map((s) => (
            <li key={s.key} className="flex items-start gap-2">
              <span
                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                  s.klaar ? 'bg-shift2-primary border-shift2-primary' : 'border-gray-300'
                }`}
                aria-hidden="true"
              >
                {s.klaar && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${s.klaar ? 'text-gray-900' : 'text-gray-500'}`}>
                  {s.label}
                </div>
                {s.klaar && s.datum && (
                  <div className="text-xs text-gray-400">
                    {format(new Date(s.datum), 'd MMMM yyyy', { locale: nl })}
                  </div>
                )}
                {/* Zolang een mail nog niet verstuurd is, staat de
                    standaardtekst klaar om naar het mailprogramma te kopiëren. */}
                {!s.klaar && (s.key === 'invitationSent' || s.key === 'planningSent') && (
                  <div className="mt-1 mb-1">
                    <button
                      type="button"
                      onClick={() =>
                        kopieer(
                          s.key === 'invitationSent' ? uitnodiging : planningsmail,
                          s.key
                        )
                      }
                      className="text-xs text-shift2-primary hover:underline"
                    >
                      {gekopieerd === s.key
                        ? 'Gekopieerd'
                        : s.key === 'invitationSent'
                          ? 'Kopieer uitnodiging'
                          : 'Kopieer planningsmail'}
                    </button>
                    {contact?.contactEmail && (
                      <div className="text-xs text-gray-400 mt-0.5 break-all">
                        {contact.contactEmail}
                      </div>
                    )}
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer">
                        Tekst bekijken
                      </summary>
                      <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded p-2">
                        {s.key === 'invitationSent' ? uitnodiging : planningsmail}
                      </pre>
                    </details>
                  </div>
                )}
                {s.handmatig && (
                  <button
                    type="button"
                    onClick={() => zetStap(s.key, !s.klaar)}
                    disabled={bezig === s.key}
                    className="text-xs text-shift2-primary hover:underline disabled:opacity-50"
                  >
                    {bezig === s.key ? 'Bezig...' : s.klaar ? 'Ongedaan maken' : 'Afvinken'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
