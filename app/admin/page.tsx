import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Navigation from '@/app/components/Navigation';

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

type Regel = {
  id: string;
  kenmerk: string;
  titel: string;
  toelichting: string;
  bureau?: string | null;
};

function dagenGeleden(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function datumNl(d: Date): string {
  return format(d, 'd MMMM', { locale: nl });
}

export default async function AdminPage() {
  const projects = await prisma.project.findMany({
    where: { status: { notIn: ['Gereed', 'Geannuleerd'] } },
    orderBy: { dateStart: 'asc' },
  });

  const loopt: Regel[] = [];
  const doorlopend: Regel[] = [];
  const actie: Regel[] = [];
  const wacht: Regel[] = [];
  const komtEraan: Regel[] = [];

  for (const p of projects) {
    // Nulmeting en herinspectie delen hetzelfde kenmerk; het versienummer
    // houdt ze uit elkaar.
    const isVervolg = Boolean(p.parentProjectId);
    const basis = {
      id: p.id,
      kenmerk: `${p.kenmerk ?? '(geen kenmerk)'}${isVervolg ? ' v1.1' : ''}`,
      titel: p.title,
      bureau: p.externalBureau,
    };

    if (p.isOngoing) {
      doorlopend.push({ ...basis, toelichting: 'doorlopend' });
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
      if (!p.invitationSent) {
        actie.push({ ...basis, toelichting: 'uitnodiging versturen' });
        continue;
      }
      if (!p.scopeCallHeld) {
        const dagen = dagenGeleden(p.invitationSent);
        if (dagen >= RAPPELTERMIJN_DAGEN) {
          actie.push({ ...basis, toelichting: `herinnering sturen, ${dagen} dagen geen reactie` });
        } else {
          wacht.push({ ...basis, toelichting: `uitnodiging ${dagen} dagen geleden verstuurd` });
        }
        continue;
      }
      if (!p.scopeCallTranscript?.trim()) {
        actie.push({ ...basis, toelichting: 'transcript toevoegen' });
        continue;
      }
      if (!p.scopeInfo?.trim()) {
        actie.push({ ...basis, toelichting: 'scope afmaken' });
        continue;
      }
      if (!p.dateStart || !p.dateEnd) {
        actie.push({ ...basis, toelichting: 'planning bepalen' });
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
          actie.push({ ...basis, toelichting: `herinnering sturen, ${dagen} dagen geen akkoord` });
        } else {
          wacht.push({ ...basis, toelichting: `wacht op akkoord, ${dagen} dagen` });
        }
        continue;
      }
    } else if (p.planningSent && !p.planningApproved && !isVervolg) {
      // Oudere projecten zonder routekaartje: het akkoord is wel te volgen.
      // Een herinspectie niet: die erft de planningsdatums van de nulmeting.
      const dagen = dagenGeleden(p.planningSent);
      if (dagen >= RAPPELTERMIJN_DAGEN) {
        actie.push({ ...basis, toelichting: `herinnering sturen, ${dagen} dagen geen akkoord` });
        continue;
      }
    }

    if (p.dateStart) {
      komtEraan.push({ ...basis, toelichting: `start ${datumNl(p.dateStart)}` });
    }
  }

  const blokken = [
    { titel: 'Loopt nu', regels: loopt, kleur: 'text-green-700' },
    { titel: 'Actie nodig', regels: actie, kleur: 'text-amber-700' },
    { titel: 'Wacht op iemand anders', regels: wacht, kleur: 'text-gray-600' },
    { titel: 'Komt eraan', regels: komtEraan, kleur: 'text-gray-600' },
  ].filter((b) => b.regels.length > 0);

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

        {blokken.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Niets openstaand</h3>
            <p className="text-gray-600">Er loopt op dit moment geen onderzoek.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {blokken.map((blok) => (
              <section key={blok.titel} className="bg-white rounded-lg border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200 flex items-baseline justify-between">
                  <h2 className={`font-semibold ${blok.kleur}`}>{blok.titel}</h2>
                  <span className="text-sm text-gray-400">{blok.regels.length}</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {blok.regels.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/admin/projects/${r.id}`}
                        className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm font-medium text-gray-900 w-28 flex-shrink-0">
                            {r.kenmerk}
                          </span>
                          <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
                            {r.titel}
                            {r.bureau && (
                              <span className="ml-2 text-xs text-amber-700">{r.bureau}</span>
                            )}
                          </span>
                          {/* Korte toelichtingen passen naast de titel; een reden
                              van wachten is vaak een hele zin en krijgt een eigen
                              regel, zodat de rij niet buiten beeld loopt. */}
                          {r.toelichting.length <= 40 && (
                            <span className="text-sm text-gray-500 flex-shrink-0">
                              {r.toelichting}
                            </span>
                          )}
                        </div>
                        {r.toelichting.length > 40 && (
                          <p className="text-sm text-gray-500 mt-1 ml-28 pl-3">{r.toelichting}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {doorlopend.length > 0 && (
              <section className="bg-white rounded-lg border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200 flex items-baseline justify-between">
                  <h2 className="font-semibold text-gray-600">Doorlopend</h2>
                  <span className="text-sm text-gray-400">{doorlopend.length}</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {doorlopend.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/admin/projects/${r.id}`}
                        className="flex items-baseline gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900 w-24 flex-shrink-0">
                          {r.kenmerk}
                        </span>
                        <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">{r.titel}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
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
