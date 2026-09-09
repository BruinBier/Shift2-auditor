'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { isExternBureau } from '@/lib/onderzoekers';

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
  /**
   * Aangepaste mailteksten, per stap. De standaardtekst is een vertrekpunt; wat je hier
   * typt gaat mee met het kopieer-icoontje. Niet opgeslagen: na verversen staat de
   * standaardtekst er weer, en dat is de bedoeling -- de mail zelf leeft in je
   * mailprogramma, niet hier.
   */
  const [bewerkt, setBewerkt] = useState<Record<string, string>>({});

  // De contactpersoon van het project gaat vóór die van de opdrachtgever:
  // per project kan het iemand anders zijn dan wie de organisatie opgaf.
  const contact =
    project.clientProject?.contactnaam || project.clientProject?.contactEmail
      ? project.clientProject
      : project.clientProject?.opdrachtgever;
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

  /** De maandag van de week waarin een datum valt. */
  const maandagVan = (d: Date) => {
    const m = new Date(d);
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    return m;
  };

  /**
   * Zo geeft een extern bureau (Cardan) een planning door: geen periode met een
   * deadline, maar de week waarin het werk begint, met datum en weeknummer.
   * Bijvoorbeeld "start in de week van 21-09-2026 (week 39)".
   */
  const startInWeek = (d: Date) =>
    `start in de week van ${format(maandagVan(d), 'dd-MM-yyyy')} (week ${weeknummer(d)})`;

  // Bij een extern bureau plant dat bureau; wij geven de startweek door in plaats
  // van een looptijd tot een deadline. Zelfde afleiding als op de detailpagina.
  const extern = Boolean(project.isExternalProject) || isExternBureau(project.researcherName);

  /** De eerste regel uit het scopeveld: de site waar het onderzoek over gaat. */
  const site = scopeUrl.split('\n')[0]?.replace(/^[-*•]\s*/, '').trim() || '[website]';
  /** Dezelfde site zonder protocol en "www.": zo staat hij in een onderwerpregel. */
  const domein = site.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

  // Standaardtekst voor de planningsmail. De alinea over het vervolgoverleg
  // hoort bij een onderzoek met hertest; zonder hertest valt die weg.
  const planningsmail = (() => {
    const start = project.dateStart ? new Date(project.dateStart) : null;
    const eind = project.dateEnd ? new Date(project.dateEnd) : null;

    const alsBullets = (veld: string | null | undefined) =>
      (veld || '')
        .split('\n')
        .map((r: string) => r.trim().replace(/^[-*•]\s*/, ''))
        .filter(Boolean);
    const klantpaginas = alsBullets(project.sampleClientPages);
    // Wat in het scopegesprek is uitgesloten hoort in de mail: de klant bevestigt de
    // planning en de afbakening in één keer. De detailpagina belooft al dat dit veld in
    // de mail komt; tot nu toe stond het alleen daar.
    const buitenScope = alsBullets(project.scopeOutOfScope);

    const regels: string[] = [
      `Dag ${contactnaam || '[naam]'},`,
      '',
      `Hierbij de planning voor het toegankelijkheidsonderzoek van ${domein}.`,
      '',
      // Wat er wél is staat erin; alleen wat ontbreekt blijft een invulveld. Eerder
      // verdween de ingevulde startdatum zodra de deadline nog leeg was.
      extern
        ? `Het onderzoek (nulmeting): ${start ? startInWeek(start) : 'start in de week van [startdatum]'}.`
        : `Het onderzoek (nulmeting) loopt van ${start ? datumNl(start) : '[startdatum]'} tot en met ${eind ? datumNl(eind) : '[deadline]'}.`,
      '',
      `De volgende website zal worden getoetst: ${site}`,
    ];

    if (buitenScope.length) {
      regels.push('');
      regels.push('Buiten het onderzoek vallen:');
      buitenScope.forEach((b: string) => regels.push(`- ${b}`));
    }

    if (klantpaginas.length) {
      regels.push('');
      regels.push("De volgende pagina's neem ik op jouw verzoek mee in de steekproef:");
      klantpaginas.forEach((p: string) => regels.push(p));
    }

    // Een nulmeting met hertest zegt dat ook als de datum nog niet vast te rekenen is.
    // Eerder viel de hele alinea weg zodra de deadline ontbrak, en dan las de mail als
    // een nulmeting zónder hertest. Een vaste datum (bij een extern bureau) gaat voor;
    // anders deadline plus weken; en zonder deadline alleen het aantal weken.
    if (project.hasReinspection) {
      let hertest: Date | null = null;
      if (project.reinspectionDate) {
        hertest = new Date(project.reinspectionDate);
      } else if (eind && project.reinspectionWeeks) {
        hertest = new Date(eind);
        hertest.setDate(hertest.getDate() + project.reinspectionWeeks * 7);
      }
      regels.push('');
      regels.push(
        extern
          ? `De herinspectie: ${hertest ? startInWeek(hertest) : 'start in de week van [datum herinspectie]'}.`
          : hertest
            ? `De hertest staat gepland in week ${weeknummer(hertest)}, dat is in de week van ${datumNl(hertest)}.`
            : `De hertest volgt ${project.reinspectionWeeks || '[aantal]'} weken na de deadline van de nulmeting.`
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

  // Voert een ander bureau het onderzoek uit, dan loopt de voorbereiding anders: er is
  // geen scopegesprek en geen scope om in te vullen, want dat doet het bureau. Wat er
  // overblijft is de planning regelen -- verzoek indienen, wachten op een datum, en die
  // doorgeven aan de klant. Dezelfde velden, andere namen en drie stappen minder.
  const viaBureau = Boolean(project.isExternalProject);
  const bureau = project.externalBureau || 'het bureau';

  // Welke stap welke mailtekst heeft. Een stap die er niet in staat krijgt geen
  // kopieerknop -- dat is het verschil tussen "hier gaat een mail uit" en "dit vink je af".
  //
  // Het onderwerp staat er los bij, want dat plak je in een ander veld dan de tekst. Bij
  // een extern bureau gaat de eerste stap niet naar de klant maar naar het bureau; daar
  // hoort geen onderwerp voor een afstemmingsmail bij.
  const MAILS: Record<string, { knop: string; naam: string; tekst: string; onderwerp?: string }> = {
    invitationSent: {
      knop: 'Kopieer uitnodiging',
      naam: 'uitnodiging',
      tekst: uitnodiging,
      onderwerp: viaBureau ? undefined : `Afstemming scope en planning toegankelijkheidsonderzoek ${domein}`,
    },
    planningSent: {
      knop: 'Kopieer planningsmail',
      naam: 'planningsmail',
      tekst: planningsmail,
      onderwerp: `Planning toegankelijkheidsonderzoek ${domein}`,
    },
    adviceCallInvited: {
      knop: 'Kopieer uitnodiging adviesgesprek',
      naam: 'uitnodiging adviesgesprek',
      tekst: adviesuitnodiging,
      onderwerp: `Adviesgesprek toegankelijkheidsonderzoek ${domein}`,
    },
    reportSentAt: {
      knop: 'Kopieer opleveringsmail',
      naam: 'opleveringsmail',
      tekst: opleveringsmail,
      onderwerp: `Rapport toegankelijkheidsonderzoek ${domein}`,
    },
  };

  /**
   * Kopieerknop als icoontje. De naam staat in title en aria-label; na een klik is het
   * twee seconden een groen vinkje. Geen knoptekst: naast een onderwerpregel of een
   * mailtekst is een woord als "Kopieer uitnodiging" meer regel dan knop.
   */
  const KopieerIcoon = ({ tekst, welke, naam }: { tekst: string; welke: string; naam: string }) => {
    const klaar = gekopieerd === welke;
    return (
      <button
        type="button"
        onClick={() => kopieer(tekst, welke)}
        title={klaar ? 'Gekopieerd' : naam}
        aria-label={klaar ? 'Gekopieerd' : naam}
        className="flex-shrink-0 text-gray-400 hover:text-shift2-primary"
      >
        {klaar ? (
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    );
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
            // De klant heeft een datum doorgegeven. Pas dan stopt het dashboard met
            // rappelleren; de dag zelf komt in het datumveld eronder.
            key: 'scopeCallPlanned',
            label: 'Scopegesprek gepland',
            klaar: Boolean(project.scopeCallPlanned),
            datum: project.scopeCallPlanned,
            handmatig: true,
            datumVeld: 'scopeCallDate',
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
            // De klant heeft gereageerd en er staat een datum. Pas dan stopt het
            // dashboard met rappelleren.
            key: 'adviceCallAccepted',
            label: 'Uitnodiging adviesgesprek geaccepteerd',
            klaar: Boolean(project.adviceCallAccepted),
            datum: project.adviceCallAccepted,
            handmatig: true,
            naOplevering: true,
            datumVeld: 'adviceCallDate',
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
    return !['invitationSent', 'scopeCallPlanned', 'scopeCallHeld', 'transcript', 'scope', 'planningSent', 'planningApproved'].includes(s.key);
  });

  const gedaan = stappen.filter((s) => s.klaar).length;

  /**
   * De dag van een gesprek, als losse datum bij de stap die zegt dat het gepland is
   * (`datumVeld` op de stap: scopeCallDate of adviceCallDate). Een leeg veld wist de
   * datum weer. Zelfde herlaad als bij een stap: de pagina is een servercomponent.
   */
  const zetGespreksdatum = async (veld: string, waarde: string) => {
    setBezig(veld);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [veld]: waarde ? new Date(waarde).toISOString() : null }),
      });
      if (res.ok) window.location.reload();
      else alert('Het opslaan van de gespreksdatum is niet gelukt.');
    } catch (error) {
      console.error('Error saving call date:', error);
      alert('Het opslaan van de gespreksdatum is niet gelukt.');
    } finally {
      setBezig(null);
    }
  };
  const gespreksdatum = (veld: string) =>
    project[veld] ? format(new Date(project[veld]), 'yyyy-MM-dd') : '';

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
                    {MAILS[s.key].onderwerp && (
                      <div className="text-xs text-gray-500 mb-0.5 flex items-center justify-between gap-1">
                        <span>
                          <span className="text-gray-400">Onderwerp:</span> {MAILS[s.key].onderwerp}
                        </span>
                        <KopieerIcoon
                          tekst={MAILS[s.key].onderwerp!}
                          welke={`${s.key}-onderwerp`}
                          naam="Kopieer onderwerp"
                        />
                      </div>
                    )}
                    {/* Icoontjes rechts uitgelijnd, onder elkaar, ongeacht de lengte van de regel. */}
                    <div className="text-xs text-gray-500 flex items-center justify-between gap-1">
                      <span>
                        <span className="text-gray-400">Tekst:</span> {MAILS[s.key].naam}
                      </span>
                      <KopieerIcoon tekst={bewerkt[s.key] ?? MAILS[s.key].tekst} welke={s.key} naam={MAILS[s.key].knop} />
                    </div>
                    {contact?.contactEmail && (
                      <div className="text-xs text-gray-400 mt-0.5 break-all">
                        {contact.contactEmail}
                      </div>
                    )}
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer">
                        {bewerkt[s.key] !== undefined ? 'Tekst aangepast' : 'Tekst bekijken en aanpassen'}
                      </summary>
                      <textarea
                        value={bewerkt[s.key] ?? MAILS[s.key].tekst}
                        onChange={(e) => setBewerkt({ ...bewerkt, [s.key]: e.target.value })}
                        rows={Math.min(24, (bewerkt[s.key] ?? MAILS[s.key].tekst).split('\n').length + 1)}
                        className="mt-1 w-full text-xs text-gray-700 font-sans bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      />
                      {bewerkt[s.key] !== undefined && (
                        <button
                          type="button"
                          onClick={() => {
                            const rest = { ...bewerkt };
                            delete rest[s.key];
                            setBewerkt(rest);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                        >
                          Standaardtekst terugzetten
                        </button>
                      )}
                    </details>
                  </div>
                )}
                {/* Bij een gepland gesprek hoort een dag: die staat in de reactie van
                    de klant en het dashboard rekent ermee. */}
                {s.datumVeld && s.klaar && (
                  <label className="mt-1 mb-1 flex items-center gap-2 text-xs text-gray-500">
                    Gesprek op
                    <input
                      type="date"
                      defaultValue={gespreksdatum(s.datumVeld)}
                      disabled={bezig === s.datumVeld}
                      onChange={(e) => zetGespreksdatum(s.datumVeld!, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary disabled:opacity-50"
                    />
                  </label>
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
