import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CmsPage() {
  const paragrafenCount = await prisma.cmsParagraph.count();

  const onderdelen = [
    {
      titel: 'Paragrafen',
      beschrijving:
        'Helpteksten per paragraaf-type en sub-element, om redacteuren te ondersteunen bij toegankelijke content.',
      href: '/cms/paragrafen',
      aantal: paragrafenCount,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">CMS</h1>
          <p className="text-sm text-gray-600 mt-1">
            Beheer van CMS-onderdelen die relevant zijn voor toegankelijkheid.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {onderdelen.map((onderdeel) => (
            <Link
              key={onderdeel.href}
              href={onderdeel.href}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-shift2-primary hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{onderdeel.titel}</h2>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {onderdeel.aantal}
                </span>
              </div>
              <p className="text-sm text-gray-600">{onderdeel.beschrijving}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
