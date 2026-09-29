import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Navigation from '@/app/components/Navigation';
import { lijst } from '@/lib/pdf-bouwer/opslag';
import { NieuwDocumentKnop, VerwijderKnop } from './Knoppen';

export const dynamic = 'force-dynamic';

/**
 * PDF-bouwer: toegankelijke PDF's vanaf nul samenstellen. Zie lib/pdf-bouwer/model.ts.
 */
export default async function PdfBouwerPage() {
  const docs = await lijst();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1000px] mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">PDF-bouwer</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Stel een PDF samen uit koppen, alinea&apos;s, lijsten, afbeeldingen en tabellen. Elk blok
              krijgt de tag die bij zijn soort hoort, en een afbeelding krijgt naast het tekstalternatief
              een zichtbare beschrijving. De PDF is getagd en gemaakt voor PDF/UA.
            </p>
          </div>
          <NieuwDocumentKnop />
        </div>

        {docs.length === 0 ? (
          <p className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
            Nog geen documenten.
          </p>
        ) : (
          <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link href={`/admin/pdf-bouwer/${d.id}`} className="font-medium text-shift2-primary hover:underline">
                    {d.titel || 'Zonder titel'}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {d.blokken} {d.blokken === 1 ? 'blok' : 'blokken'} · gewijzigd{' '}
                    {format(new Date(d.gewijzigd), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                  </p>
                </div>
                <VerwijderKnop id={d.id} titel={d.titel} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-4">
          De documenten staan op deze computer, in de map <code>pdf-bouwer-documenten</code>.
        </p>
      </main>
    </div>
  );
}
