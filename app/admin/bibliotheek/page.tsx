import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import Patronenlijst, { type PatroonRij } from './Patronenlijst';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Patronen · Shift2 Auditor' };

/**
 * De patronenbibliotheek (docs/bibliotheek/SPEC.md). Staat naast de
 * QuickFindings op /admin/bevindingen en raakt die niet (besluit 4).
 */
export default async function BibliotheekPage() {
  const [patronen, oefensets] = await Promise.all([
    prisma.patroon.findMany({
      include: {
        casussen: { select: { html: true } },
        rapportBevindingen: { select: { overeenstemming: true } },
      },
    }),
    prisma.oefenset.findMany({ orderBy: { id: 'asc' }, select: { id: true, titel: true } }),
  ]);

  const rijen: PatroonRij[] = patronen.map((p) => ({
    id: p.id,
    titel: p.titel,
    criteria: p.criteria,
    oordeel: p.oordeel,
    herkomst: p.herkomst,
    tags: p.tags,
    status: p.status,
    aantalCasussen: p.casussen.length,
    aantalRapportbevindingen: p.rapportBevindingen.length,
    wijktAf: p.rapportBevindingen.some((r) => r.overeenstemming !== 'eens'),
    zoektekst: [p.titel, p.onderbouwing, p.standaardTekst, ...p.casussen.map((c) => c.html)]
      .join('\n')
      .toLowerCase(),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Patronen</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-3xl">
              Terugkerende fouten en twijfelgevallen, elk met één Shift2-oordeel en casussen om op te
              oefenen. Een patroon is pas bruikbaar in een audit als het is vastgesteld. Het regelbestand
              in <code>wcag-regels/</code> blijft leidend.
            </p>
          </div>
          <Link
            href="/admin/bibliotheek/nieuw"
            className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium"
          >
            + Nieuw patroon
          </Link>
        </div>

        {oefensets.length > 0 && (
          <nav aria-label="Oefensets" className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Oefenen</h2>
            <ul className="flex flex-wrap gap-2">
              {oefensets.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/oefenen/${s.id}`}
                    className="inline-block rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-shift2-primary hover:underline"
                  >
                    {s.titel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <Patronenlijst patronen={rijen} />
      </main>
    </div>
  );
}
