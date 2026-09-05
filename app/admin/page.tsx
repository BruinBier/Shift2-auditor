import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Navigation from '@/app/components/Navigation';
import DashboardRij, { type DashboardRegel } from './DashboardRij';

/**
 * Dashboard: waar sta ik vandaag.
 *
 * Vier blokken die elk een andere vraag beantwoorden: wat loopt er, waar ben
 * ik aan zet, waar wacht ik op een ander, en wat komt eraan. De volledige
 * lijst staat op /onderzoeken; hier staat alleen wat aandacht vraagt.
 *
 * De fijnmazige signalen (welke stap is de volgende) gelden alleen voor
 * onderzoeken die de intake-route zijn gegaan. Bij oudere projecten zijn die
 * stappen nooit doorlopen, dus die zouden anders allemaal als "nog te doen"
 * verschijnen terwijl er allang aan gewerkt is.
 */

const RAPPELTERMIJN_DAGEN = 14;



function dagenGeleden(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** "vandaag", "gisteren" of "3 dagen geleden" -- 0 en 1 dag lezen anders gek. */
function sinds(d: Date): string {
  const n = dagenGeleden(d);
  if (n <= 0) return 'vandaag';
  if (n === 1) return 'gisteren';
  return `${n} dagen geleden`;
}

function datumNl(d: Date): string {
  return format(d, 'd MMMM', { locale: nl });
}

/**
 * Eén blok met een gekleurde kop en de onderzoeken die erin vallen, als tabel.
 *
 * Zeven kolommen, want een regel moet twee vragen beantwoorden zonder doorklikken: waar
 * gaat dit over (opdrachtgever, website, ronde, uitvoerder) en wat moet ermee (actie). Het
 * CRM-nummer staat erbij omdat een ontbrekend nummer straks de planningsmail blokkeert.
 */
function Blok({
  titel,
  kleur,
  regels,
}: {
  titel: string;
  kleur: string;
  regels: DashboardRegel[];
}) {
  const kop = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide';
  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`px-5 py-3 flex items-baseline justify-between text-white ${kleur}`}>
        <h2 className="font-semibold">{titel}</h2>
        <span className="text-sm">{regels.length}</span>
      </div>
      <div className="overflow-x-auto">
        {/* Vaste kolombreedtes: zonder table-fixed rekt de browser de kolom met de
            langste inhoud op, en dan puilt de actietekst buiten beeld. */}
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={`${kop} w-52`}>Onderzoek</th>
              <th className={`${kop} w-44`}>Website</th>
              <th className={`${kop} w-40`}>Soort onderzoek</th>
              <th className={`${kop} w-24`}>Uitvoerder</th>
              <th className={`${kop} w-24`}>CRM</th>
              <th className={kop}>Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {regels.map((r) => (
              <DashboardRij key={r.id} regel={r} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminPage() {
  const projects = await prisma.project.findMany({
    /**
     * Een proeftuin hoort hier niet: dit scherm zegt wat er vandaag te doen is, en intern
     * testwerk staat niet op die lijst.
     *
     * Vooral de rappelbewaking hieronder maakt dat storend. Die kijkt of er veertien dagen
     * geen reactie of akkoord is geweest — bij een proeftuin is dat per definitie zo, dus
     * hij komt permanent in het rode blok "Actie nodig" te staan met "herinnering sturen".
     * Vier blokken, hun tellers en die bewaking komen allemaal uit deze ene query.
     */
    where: {
      isProeftuin: false,
      OR: [
        { status: { notIn: ['Gereed', 'Geannuleerd'] } },
        // Een opgeleverd onderzoek is nog niet uit beeld zolang er een mail openstaat.
        // "Gereed" gaat over het rapport, niet over de nazorg.
        //
        // Na een nulmeting met hertest is dat het adviesgesprek: de planningsmail beloofde
        // een overleg na afronding, en dat gaat vooraf aan het herstel. Na de hertest zelf
        // is er geen gesprek maar een melding dat het onderzoek klaar is.
        {
          status: 'Gereed',
          hasReinspection: true,
          parentProjectId: null,
          adviceCallHeld: null,
        },
        { status: 'Gereed', parentProjectId: { not: null }, reportSentAt: null },
      ],
    },
    orderBy: { dateStart: 'asc' },
    // Het CRM-nummer staat op het klantproject en niet op het onderzoek: het hoort bij de
    // opdracht, dus een tweede onderzoek op dezelfde site erft het. De routekaart hieronder
    // kijkt ernaar voordat de planningsmail uitgaat.
    include: { clientProject: { select: { projectnummer: true } } },
  });

  const loopt: DashboardRegel[] = [];
  const doorlopend: DashboardRegel[] = [];
  const actie: DashboardRegel[] = [];
  const wacht: DashboardRegel[] = [];
  const komtEraan: DashboardRegel[] = [];

  for (const p of projects) {
    // Nulmeting en herinspectie delen hetzelfde kenmerk; het versienummer
    // houdt ze uit elkaar.
    const isVervolg = Boolean(p.parentProjectId);
    // Dezelfde indeling als in de onderzoekenlijst: een aanvullende ronde
    // blijkt uit het onderzoekstype, een herinspectie uit de parent-relatie.
    // Bij een nulmeting telt of er een hertest bij hoort: dat bepaalt wat er na de
    // oplevering nog komt (een adviesgesprek) en of er later een tweede ronde volgt.
    // Zonder dat onderscheid zie je het pas als er twee regels met hetzelfde kenmerk staan.
    const ronde = /aanvullend/i.test(p.researchType || '')
      ? 'Aanvullend'
      : isVervolg
        ? 'Hertest'
        : p.hasReinspection
          ? 'Nulmeting, met hertest'
          : 'Nulmeting';
    const basis = {
      id: p.id,
      // Altijd het versienummer erbij, ook bij een nulmeting. Nulmeting en herinspectie
      // delen hetzelfde kenmerk, en sinds een opgeleverd onderzoek hier kan staan voor
      // het adviesgesprek, staan ze soms allebei in de lijst. Zonder versie zie je dan
      // twee keer "BEL-05" en is niet duidelijk welke regel welke is.
      kenmerk: `${p.kenmerk ?? '(geen kenmerk)'} v${Number(p.version).toFixed(1)}`,
      opdrachtgever: p.commissionedBy ?? '',
      // De titel is "website waalwijktaalrijk.nl"; in een kolom met de kop "Website" is
      // dat woord dubbel, en bij een PDF-onderzoek klopt het niet eens.
      website: p.title.replace(/^website\s+/i, ''),
      ronde,
      // Leeg betekent hier "wij doen het zelf". In een kolom "Uitvoerder" is een lege cel
      // dubbelzinnig, dus dan staat er Shift2.
      uitvoerder: p.externalBureau || 'Shift2',
      crmNummer: p.clientProject?.projectnummer ?? null,
    };

    if (p.isOngoing) {
      // Geen toelichting: dat het doorlopend is, zegt de kop van het blok al.
      // En doorlopend werk is geen nulmeting of herinspectie.
      doorlopend.push({ ...basis, toelichting: '', ronde: undefined });
      continue;
    }

    // Een opgeleverd onderzoek staat hier alleen nog voor de laatste mail: de query
    // hierboven laat er niets anders van door. Het rapport is af, dus dit is het enige
    // wat er nog te doen valt.
    if (p.status === 'Gereed') {
      if (isVervolg) {
        // Na de hertest: alleen het rapport opleveren, geen gesprek.
        actie.push({ ...basis, toelichting: 'rapport opleveren' });
      } else if (!p.adviceCallInvited) {
        actie.push({ ...basis, toelichting: 'uitnodiging adviesgesprek versturen' });
      } else {
        const dagen = dagenGeleden(p.adviceCallInvited);
        if (dagen >= RAPPELTERMIJN_DAGEN) {
          actie.push({ ...basis, toelichting: `${sinds(p.adviceCallInvited)} uitgenodigd voor het adviesgesprek` });
        } else {
          wacht.push({ ...basis, toelichting: `${sinds(p.adviceCallInvited)} uitgenodigd voor het adviesgesprek` });
        }
      }
      continue;
    }

    if (p.status === 'In de wacht') {
      wacht.push({
        ...basis,
        toelichting: p.cancellationReason?.split('\n')[0] ?? 'geen reden vastgelegd',
      });
      continue;
    }

    if (p.status === 'In uitvoering') {
      loopt.push({
        ...basis,
        toelichting: p.dateEnd ? `deadline ${datumNl(p.dateEnd)}` : 'geen deadline',
      });
      continue;
    }

    // Vanaf hier: Intake, Gepland of Controle. De volgende stap uit het
    // routekaartje bepaalt of jij aan zet bent of dat je wacht.
    //
    // Alleen onderzoeken die deze route volgen. Status "Intake" hoort daar
    // altijd bij, ook als er nog geen stap is gezet: dan is de uitnodiging
    // juist de eerste actie. Bij oudere projecten zijn de stappen nooit
    // doorlopen; die zouden anders allemaal als "nog te doen" verschijnen.
    const heeftIntakeRoute =
      p.status === 'Intake' ||
      Boolean(p.invitationSent || p.scopeCallHeld || p.scopeCallTranscript);

    if (heeftIntakeRoute) {
      // Voert een ander bureau het onderzoek uit, dan bepaalt dat bureau de scope en
      // voert het het gesprek met de klant. Wat wij doen is de planning regelen: het
      // verzoek indienen, wachten op een datum, die doorgeven. Scopegesprek, transcript
      // en scope slaan we daarom over -- die velden blijven bij zo'n onderzoek leeg en
      // zouden hem anders permanent op "transcript toevoegen" laten staan.
      const viaBureau = p.isExternalProject;
      const bureau = p.externalBureau || 'het bureau';

      if (!p.invitationSent) {
        actie.push({
          ...basis,
          toelichting: viaBureau ? `planningsverzoek indienen bij ${bureau}` : 'uitnodiging versturen',
        });
        continue;
      }

      if (!viaBureau && !p.scopeCallHeld) {
        const dagen = dagenGeleden(p.invitationSent);
        if (dagen >= RAPPELTERMIJN_DAGEN) {
          actie.push({ ...basis, toelichting: `${sinds(p.invitationSent!)} uitgenodigd voor het scopegesprek` });
        } else {
          wacht.push({ ...basis, toelichting: `${sinds(p.invitationSent!)} uitgenodigd voor het scopegesprek` });
        }
        continue;
      }
      if (!viaBureau && !p.scopeCallTranscript?.trim()) {
        actie.push({ ...basis, toelichting: 'transcript toevoegen' });
        continue;
      }
      if (!viaBureau && !p.scopeInfo?.trim()) {
        actie.push({ ...basis, toelichting: 'scope afmaken' });
        continue;
      }
      if (!p.dateStart || !p.dateEnd) {
        if (viaBureau) {
          // De datum komt van het bureau, dus hier valt niets te bepalen -- alleen te
          // wachten, en na de rappeltermijn te rappelleren.
          const dagen = dagenGeleden(p.invitationSent);
          if (dagen >= RAPPELTERMIJN_DAGEN) {
            actie.push({ ...basis, toelichting: `${sinds(p.invitationSent!)} om planning gevraagd bij ${bureau}` });
          } else {
            wacht.push({ ...basis, toelichting: `${sinds(p.invitationSent!)} om planning gevraagd bij ${bureau}` });
          }
        } else {
          actie.push({ ...basis, toelichting: 'planning bepalen' });
        }
        continue;
      }
      // Het CRM-nummer wordt door Shift2 zelf toegekend en is bij een getekende offerte vaak
      // nog niet bekend. Dat mag de uitnodiging en het scopegesprek niet ophouden, maar bij
      // de planningsmail wordt de opdracht officieel: er gaan datums naar de klant, en dan
      // hoort de administratie compleet te zijn. Wachten tot het factureren betekent het
      // achteraf uitzoeken bij een onderzoek dat al gedaan is.
      if (!p.clientProject?.projectnummer?.trim()) {
        actie.push({ ...basis, toelichting: 'CRM-nummer invullen' });
        continue;
      }
      if (!p.planningSent) {
        actie.push({ ...basis, toelichting: 'planningsmail versturen' });
        continue;
      }
      // Een herinspectie erft de planningsdatums van de nulmeting; daar gaat
      // het akkoord dus niet over.
      if (!p.planningApproved && !isVervolg) {
        const dagen = dagenGeleden(p.planningSent);
        if (dagen >= RAPPELTERMIJN_DAGEN) {
          actie.push({ ...basis, toelichting: `${sinds(p.planningSent!)} planningsmail verstuurd, nog geen akkoord` });
        } else {
          wacht.push({ ...basis, toelichting: `${sinds(p.planningSent!)} planningsmail verstuurd` });
        }
        continue;
      }
    } else if (p.planningSent && !p.planningApproved && !isVervolg) {
      // Oudere projecten zonder routekaartje: het akkoord is wel te volgen.
      // Een herinspectie niet: die erft de planningsdatums van de nulmeting.
      const dagen = dagenGeleden(p.planningSent);
      if (dagen >= RAPPELTERMIJN_DAGEN) {
        actie.push({ ...basis, toelichting: `${sinds(p.planningSent!)} planningsmail verstuurd, nog geen akkoord` });
        continue;
      }
    }

    if (p.dateStart) {
      komtEraan.push({ ...basis, toelichting: `start ${datumNl(p.dateStart)}` });
    }
  }

  // De kleur zegt hoe dringend het blok is: groen loopt, rood vraagt actie,
  // amber ligt stil bij een ander, blauw is informatief.
  const blokken = [
    { titel: 'Loopt nu', regels: loopt, kleur: 'bg-green-600' },
    { titel: 'Actie nodig', regels: actie, kleur: 'bg-red-600' },
    { titel: 'Wacht op iemand anders', regels: wacht, kleur: 'bg-amber-500' },
    { titel: 'Komt eraan', regels: komtEraan, kleur: 'bg-blue-600' },
  ].filter((b) => b.regels.length > 0);

  /**
   * Onderzoeken die wel een CRM-project hebben, maar niet in de Dynamics-weergave
   * "Mijn actieve projecten" staan.
   *
   * Als losse melding boven de blokken en niet als regel bij "Actie nodig": het is één
   * handeling in een ander systeem, geen stap in de routekaart van een onderzoek. Tussen
   * de andere regels zou het bovendien verdwijnen -- daar staan er al vijftien.
   */
  const nietInCrmLijst = projects.filter((p) => !p.crmProjectActief);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Wat er loopt en waar actie op nodig is</p>
          </div>
          <Link
            href="/admin/intake"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Nieuwe intake
          </Link>
        </div>

        {nietInCrmLijst.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-900">
              {nietInCrmLijst.length === 1
                ? 'Eén onderzoek staat niet in je actieve projecten in het CRM'
                : `${nietInCrmLijst.length} onderzoeken staan niet in je actieve projecten in het CRM`}
            </p>
            <p className="mt-1 text-sm text-amber-900">
              {nietInCrmLijst.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <Link href={`/admin/projects/${p.id}`} className="underline hover:no-underline">
                    {p.kenmerk ?? '(geen kenmerk)'}
                  </Link>
                </span>
              ))}
            </p>
          </div>
        )}

        {blokken.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Niets openstaand</h3>
            <p className="text-gray-600">Er loopt op dit moment geen onderzoek.</p>
          </div>
        ) : (
          /* Elk blok over de volle breedte, onder elkaar. De volgorde is de urgentie:
             wat jij moet doen bovenaan, doorlopend werk onderaan.

             Eerder stonden "Actie nodig" en "Loopt nu" naast elkaar en had het wachtblok
             twee kolommen. Dat paste minder naarmate er meer bij kwam: een regel bestaat
             uit kenmerk, titel, soort onderzoek, bureau en een toelichting, en in een
             halve kolom valt daar te veel van weg. */
          <div className="space-y-6">
            {['Actie nodig', 'Loopt nu', 'Komt eraan', 'Wacht op iemand anders'].map((naam) => {
              const blok = blokken.find((b) => b.titel === naam);
              if (!blok) return null;
              return (
                <Blok key={blok.titel} titel={blok.titel} kleur={blok.kleur} regels={blok.regels} />
              );
            })}

            {/* Helemaal onderaan: werk zonder begin of eind, dus zonder
                urgentie. */}
            {doorlopend.length > 0 && (
              <Blok titel="Doorlopend" kleur="bg-gray-500" regels={doorlopend} />
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/onderzoeken" className="text-sm text-shift2-primary hover:underline">
            Alle onderzoeken
          </Link>
        </div>
      </div>
    </div>
  );
}
