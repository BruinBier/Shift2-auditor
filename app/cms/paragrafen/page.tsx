import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CmsParagrafenPage() {
  const paragrafen = await prisma.cmsParagraph.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      helpteksten: { select: { id: true, elementType: true, title: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              <Link href="/cms" className="hover:underline">
                CMS
              </Link>{' '}
              / Paragrafen
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Paragrafen</h1>
            <p className="text-sm text-gray-600 mt-1">
              Paragraaf-types uit het CMS met bijbehorende helpteksten voor redacteuren.
            </p>
          </div>
          <Link
            href="/cms/paragrafen/new"
            className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium"
          >
            + Nieuw paragraaf-type
          </Link>
        </div>

        {paragrafen.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            Nog geen paragraaf-types. Klik op &quot;Nieuw paragraaf-type&quot; om er één toe te voegen.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Naam</th>
                  <th className="px-4 py-3">Beschrijving</th>
                  <th className="px-4 py-3">Helpteksten</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paragrafen.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/cms/paragrafen/${p.id}`}
                        className="text-shift2-primary hover:underline font-medium"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.description ? (
                        <span className="line-clamp-1">{p.description}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.helpteksten.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span>
                          {p.helpteksten.length} ({p.helpteksten.map((h) => h.elementType).join(', ')})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
