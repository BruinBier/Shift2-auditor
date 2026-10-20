import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import { OORDEEL_LABEL, OORDEEL_PILL, STATUS_LABEL } from '@/lib/bibliotheek/weergave';
import Patroonformulier from '../Patroonformulier';
import Casussen from './Casussen';
import InRapporten, { type RapportRij } from './InRapporten';

export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'oordeel', label: 'Oordeel' },
  { id: 'casussen', label: 'Casussen' },
  { id: 'rapporten', label: 'In rapporten' },
] as const;

export default async function PatroonPage({
  params,
  searchParams,
}: {
  params: { patroonId: string };
  searchParams: { tab?: string };
}) {
  const id = decodeURIComponent(params.patroonId);
  const patroon = await prisma.patroon.findUnique({
    where: { id },
    include: {
      casussen: { orderBy: [{ volgorde: 'asc' }, { id: 'asc' }] },
      rapportBevindingen: {
        include: { bron: { include: { auditor: { select: { naam: true } } } } },
        orderBy: { id: 'asc' },
      },
    },
  });
  if (!patroon) notFound();

  const [criteria, oefensets, categorieRijen] = await Promise.all([
    prisma.wCAGCriterion.findMany({ select: { code: true, titleNl: true }, orderBy: { code: 'asc' } }),
    prisma.oefenset.findMany({ select: { id: true, titel: true, paginaCss: true }, orderBy: { id: 'asc' } }),
    prisma.casus.findMany({ where: { categorie: { not: null } }, select: { categorie: true }, distinct: ['categorie'] }),
  ]);
  const categorieen = categorieRijen.map((r) => r.categorie!).sort((a, b) => a.localeCompare(b, 'nl'));

  const tab = TABS.some((t) => t.id === searchParams.tab) ? searchParams.tab! : 'oordeel';
  const href = (t: string) => `/admin/bibliotheek/${encodeURIComponent(patroon.id)}?tab=${t}`;

  // Bij een vertrouwelijke bron gaat de organisatienaam niet naar de browser.
  const rapporten: RapportRij[] = patroon.rapportBevindingen.map((r) => ({
    id: r.id,
    auditor: r.bron.auditor?.naam ?? 'Onbekend',
    auditorZeker: r.bron.auditorZeker,
    organisatie: r.bron.vertrouwelijk ? null : r.bron.organisatie,
    rapportCriteria: r.rapportCriteria,
    rapportOordeel: r.rapportOordeel,
    overeenstemming: r.overeenstemming,
    handmatig: r.overeenstemmingHandmatig,
    citaat: r.citaat,
    casusId: r.casusId,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <p className="text-sm mb-2">
          <Link href="/admin/bibliotheek" className="text-shift2-primary hover:underline">
            ← Patronen
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-gray-900">{patroon.titel}</h1>
          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${OORDEEL_PILL[patroon.oordeel]}`}>
            {OORDEEL_LABEL[patroon.oordeel]}
          </span>
          <span className="text-sm text-gray-600">{STATUS_LABEL[patroon.status]}</span>
        </div>
        <p className="text-xs text-gray-500 font-mono mb-6">
          {patroon.id} · {patroon.criteria.join(', ')}
        </p>

        <nav aria-label="Onderdelen van het patroon" className="border-b border-gray-200 mb-6">
          <ul className="flex gap-6">
            {TABS.map((t) => (
              <li key={t.id}>
                <Link
                  href={href(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className={`inline-block pb-2 text-sm font-medium border-b-2 ${
                    tab === t.id
                      ? 'border-shift2-primary text-shift2-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                  {t.id === 'casussen' && ` (${patroon.casussen.length})`}
                  {t.id === 'rapporten' && ` (${patroon.rapportBevindingen.length})`}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {tab === 'oordeel' && (
          <Patroonformulier
            criteria={criteria}
            voorbeelden={patroon.casussen.map((c) => ({ id: c.id, titel: c.titel, html: c.html, correcteCode: c.correcteCode }))}
            patroon={{
              id: patroon.id,
              titel: patroon.titel,
              omschrijving: patroon.omschrijving,
              criteria: patroon.criteria,
              oordeel: patroon.oordeel,
              onderbouwing: patroon.onderbouwing,
              technieken: patroon.technieken,
              herkomst: patroon.herkomst,
              wcag: patroon.wcag,
              standaardTekst: patroon.standaardTekst,
              advies: patroon.advies,
              tags: patroon.tags,
              status: patroon.status,
              vastgesteldDoor: patroon.vastgesteldDoor,
              vastgesteldOp: patroon.vastgesteldOp?.toISOString() ?? null,
            }}
          />
        )}
        {tab === 'casussen' && (
          <Casussen
            patroon={{ id: patroon.id, oordeel: patroon.oordeel, criteria: patroon.criteria }}
            casussen={patroon.casussen.map((c) => ({
              id: c.id,
              titel: c.titel,
              html: c.html,
              css: c.css ?? '',
              js: c.js ?? '',
              correcteCode: c.correcteCode,
              uitleg: c.uitleg,
              isValkuil: c.isValkuil,
              categorie: c.categorie ?? '',
              oefensets: c.oefensets,
              volgorde: c.volgorde,
            }))}
            oefensets={oefensets}
            categorieen={categorieen}
          />
        )}
        {tab === 'rapporten' && <InRapporten rapporten={rapporten} />}
      </main>
    </div>
  );
}
