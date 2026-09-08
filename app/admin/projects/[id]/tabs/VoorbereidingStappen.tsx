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
  /**
   * Dicht zodra alles af is, maar wel zichtbaar.
   *
   * Dit blok verdween eerst helemaal zodra de planning akkoord was. Twee dingen
   * gingen daar mis. Het lijkt op een fout -- je klikt "planning akkoord" en er
   * valt een gat in de kolom. En het klopte niet: de laatste twee stappen (de
   * uitnodiging en het adviesgesprek) komen pas ná de oplevering, dus bij een
   * onderzoek met hertest stonden er nog open stappen die je niet meer zag.
   *
   * Nu blijft de kop staan met "8 van 10", en klap je hem open als je wilt zien
   * wat er nog is.
   */
  const [open, setOpen] = useState<boolean | null>(null);
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

  /** De eerste regel uit het scopeveld: de site waar het onderzoek over gaat. */
  const site = scopeUrl.split('\n')[0]?.replace(/^[-*•]\s*/, '').trim() || '[website]';

  // Standaardtekst voor de planningsmail. De alinea over het vervolgoverleg
  // hoort bij een onderzoek met hertest; zonder hertest valt die weg.
  const planningsmail = (() => {
    const start = project.dateStart ? new Date(project.dateStart) : null;
    const eind = project.dateEnd ? new Date(project.dateEnd) : null;
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

  const isHerinspectie = Boolean(project.parentProjectId);

  // Het adviesgesprek hoort bij de nulmeting: de mail meldt dat die is afgerond, verwijst
  // naar het rapport en vraagt om een afspraak om de bevindingen door te nemen. Dat gesprek
  // gaat vooraf aan het herstel, niet erna -- en de planningsmail kondigt het ook zo aan.
  //
  // Na de herinspectie is er geen gesprek maar een melding dat het onderzoek klaar is.
  const heeftAdviesgesprek = Boolean(project.hasReinspection) && !isHerinspectie;

  // Een nulmeting zónder hertest eindigt ook met zo'n melding. De planningsmail heeft
  // geen overleg beloofd, dus er komt geen adviesgesprek -- maar de klant moet wel horen
  // dat het rapport er is. Zonder deze stap stond er bij zo'n onderzoek (HAR-02, een
  // nulmeting door Cardan) helemaal niets na de oplevering.
  const heeftOpleveringsmail = isHerinspectie || !project.hasReinspection;

  const adviesuitnodiging = [
    `Dag ${contactnaam || '[naam]'},`,
    '',
    `De nulmeting van het toegankelijkheidsonderzoek voor ${site} is inmiddels afgerond.`,
    '',
    'Het volledige onderzoeksrapport is te vinden op:',
    '[link naar het rapport]',
    '',
    'Ik plan graag een sessie met je in om de bevindingen en geconstateerde issues door te nemen.',
    '',
    'Laat me even weten wanneer het jou schikt, dan zorg ik dat het overleg wordt ingepland.',
  ].join('\n');

  // Na de herinspectie, of na een nulmeting zonder hertest: geen uitnodiging maar een
  // melding. Het onderzoek is klaar, hier is het rapport, laat het weten als je de issues
  // nog wilt bespreken. Het "Proficiat" hoort bij de hertest: daar is iets hersteld. Na
  // een nulmeting is het percentage een vertrekpunt, geen prestatie.
  const opleveringsmail = [
    `Dag ${contactnaam || '[naam]'},`,
    '',
    isHerinspectie
      ? `Het heronderzoek toegankelijkheid voor ${site} is afgerond.`
      : `De nulmeting van het toegankelijkheidsonderzoek voor ${site} is afgerond.`,
    '',
    isHerinspectie
      ? 'De website is op dit moment voor [percentage]% toegankelijk. Proficiat!'
      : 'De website is op dit moment voor [percentage]% toegankelijk.',
    '',
    'De resultaten van dit onderzoek zijn direct beschikbaar via onderstaande URL:',
    '[link naar het rapport]',
    '',
    'Laat het gerust weten als je de issues nog kort samen wilt bespreken. Ik hoor graag van je.',
  ].join('\n');

  // Welke stap welke mailtekst heeft. Een stap die er niet in staat krijgt geen
  // kopieerknop -- dat is het verschil tussen "hier gaat een mail uit" en "dit vink je af".
  const MAILS: Record<string, { knop: string; tekst: string }> = {
    invitationSent: { knop: 'Kopieer uitnodiging', tekst: uitnodiging },
    planningSent: { knop: 'Kopieer planningsmail', tekst: planningsmail },
    adviceCallInvited: { knop: 'Kopieer uitnodiging adviesgesprek', tekst: adviesuitnodiging },
    reportSentAt: { knop: 'Kopieer opleveringsmail', tekst: opleveringsmail },
  };

  const kopieer = async (tekst: string, welke: string) => {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(welke);
      setTimeout(() => setGekopieerd(null), 2000);
    } catch {
      alert('Kopiëren is niet gelukt. Selecteer de tekst en kopieer met Ctrl+C.');
    }
  };

  // Voert een ander bureau het onderzoek uit, dan loopt de voorbereiding anders: er is
  // geen scopegesprek en geen scope om in te vullen, want dat doet het bureau. Wat er
  // overblijft is de planning regelen -- verzoek indienen, wachten op een datum, en die
  // doorgeven aan de klant. Dezelfde velden, andere namen en drie stappen minder.
  const viaBureau = Boolean(project.isExternalProject);
  const bureau = project.externalBureau || 'het bureau';

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
      label: viaBureau ? `Planningsverzoek ingediend bij ${bureau}` : 'Uitnodiging verstuurd',
      klaar: Boolean(project.invitationSent),
      datum: project.invitationSent,
      handmatig: true,
    },
    // Scopegesprek, transcript en scope vallen weg bij een extern bureau: dat bepaalt de
    // scope zelf en voert het gesprek met de klant. Wat er voor ons overblijft is de
    // planning regelen -- verzoek indienen, wachten op een datum, die doorgeven aan de klant.
    ...(viaBureau
      ? []
      : [
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
        ]),
    {
      // Bij een extern bureau is er geen deadline: dat bureau levert op zijn eigen
      // moment op. Een startdatum is dan de hele planning.
      key: 'planning',
      label: 'Planning bepaald',
      klaar: Boolean(project.dateStart && (viaBureau || project.dateEnd)),
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
    // Het adviesgesprek hoort bij een onderzoek met hertest, en de planningsmail belooft
    // het daar ook: "na afronding van de nulmeting ontvang je van mij een uitnodiging voor
    // een overleg". Zonder hertest staat die alinea er niet in en is er niets te bespreken
    // voor een herstelronde die niet komt.
    //
    // Deze twee stappen volgen niet meteen op het akkoord: daartussen wordt het onderzoek
    // uitgevoerd en het rapport opgeleverd. Pas dan is er iets te bespreken.
    ...(heeftAdviesgesprek
      ? [
          {
            key: 'adviceCallInvited',
            label: 'Uitnodiging adviesgesprek verstuurd',
            klaar: Boolean(project.adviceCallInvited),
            datum: project.adviceCallInvited,
            handmatig: true,
            naOplevering: true,
          },
          {
            key: 'adviceCallHeld',
            label: 'Adviesgesprek gevoerd',
            klaar: Boolean(project.adviceCallHeld),
            datum: project.adviceCallHeld,
            handmatig: true,
            naOplevering: true,
          },
        ]
      : []),
    // Na de hertest, of na een nulmeting zonder hertest, gaat er geen uitnodiging uit
    // maar een melding dat het onderzoek klaar is. Dat is het laatste wat er naar de
    // klant gaat.
    ...(heeftOpleveringsmail
      ? [
          {
            key: 'reportSentAt',
            label: 'Rapport opgeleverd',
            klaar: Boolean(project.reportSentAt),
            datum: project.reportSentAt,
            handmatig: true,
            naOplevering: true,
          },
        ]
      : []),
  ].filter((s) => {
    // Een herinspectie erft de voorbereiding van de nulmeting: daar is de uitnodiging
    // verstuurd, het scopegesprek gevoerd, de scope bepaald en de planningsmail afgestemd.
    // De hertest hoeft dat niet over te doen -- in de praktijk blijven die velden er leeg
    // (bij twintig herinspecties is er één met een uitnodiging), en het dashboard slaat het
    // planningsakkoord er ook al over. Wat blijft is de eigen periode en de oplevering.
    if (!isHerinspectie) return true;
    return !['invitationSent', 'scopeCallHeld', 'transcript', 'scope', 'planningSent', 'planningApproved'].includes(s.key);
  });

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

  // Niet aangeraakt? Dan dicht als alles af is, open als er nog iets te doen valt.
  const allesAf = gedaan === stappen.length;
  const uitgeklapt = open === null ? !allesAf : open;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(!uitgeklapt)}
        aria-expanded={uitgeklapt}
        className="w-full p-4 border-b border-gray-200 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Voorbereiding</h3>
        </div>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          {gedaan} van {stappen.length}
          <svg
            className={`w-4 h-4 transition-transform ${uitgeklapt ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`p-4 ${uitgeklapt ? '' : 'hidden'}`}>
        <ol className="space-y-2">
          {stappen.map((s, i) => (
            <li
              key={s.key}
              className={`flex items-start gap-2 ${
                // De laatste twee stappen volgen niet meteen op het akkoord: daartussen
                // wordt het onderzoek uitgevoerd en het rapport opgeleverd. Zonder deze
                // scheiding leest de lijst alsof het gesprek er direct achteraan komt.
                s.naOplevering && !stappen[i - 1]?.naOplevering
                  ? 'mt-3 pt-3 border-t border-gray-100 relative'
                  : ''
              }`}
            >
              {s.naOplevering && !stappen[i - 1]?.naOplevering && (
                <span className="absolute -top-0.5 left-6 text-[10px] uppercase tracking-wide text-gray-400">
                  na de oplevering
                </span>
              )}
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
                {!s.klaar && MAILS[s.key] && (
                  <div className="mt-1 mb-1">
                    <button
                      type="button"
                      onClick={() => kopieer(MAILS[s.key].tekst, s.key)}
                      className="text-xs text-shift2-primary hover:underline"
                    >
                      {gekopieerd === s.key ? 'Gekopieerd' : MAILS[s.key].knop}
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
                        {MAILS[s.key].tekst}
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
