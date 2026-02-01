import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CrawlerOverviewResults from './CrawlerOverviewResults';

export async function generateMetadata({
  params,
}: {
  params: { id: string; parentUrlId: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  const title = project
    ? `${project.title} - Crawler overzicht`
    : 'Crawler overzicht';

  return {
    title,
    openGraph: {
      title,
    },
  };
}

export default async function ParentCrawlerOverviewPage({
  params,
}: {
  params: { id: string; parentUrlId: string };
}) {
  // Get the parent URL
  const parentUrl = await prisma.projectScopeUrl.findUnique({
    where: { id: params.parentUrlId },
  });

  if (!parentUrl) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    notFound();
  }

  // Get the parent URL and all discovered URLs
  const discoveredUrls = await prisma.projectScopeUrl.findMany({
    where: {
      OR: [
        { id: params.parentUrlId }, // Include the parent URL itself
        { parentUrlId: params.parentUrlId }, // Include discovered child URLs
      ],
    },
    include: {
      crawlerResults: {
        where: { found: true },
      },
    },
    orderBy: { url: 'asc' },
  });

  // Calculate summary statistics for each URL
  const urlsWithStats = discoveredUrls.map(scopeUrl => {
    const foundCount = scopeUrl.crawlerResults.length;
    // Impact score = sum of all count values (total number of issues found)
    const impactScore = scopeUrl.crawlerResults.reduce((sum, result) => sum + result.count, 0);

    return {
      id: scopeUrl.id,
      url: scopeUrl.url,
      title: scopeUrl.title,
      crawledAt: scopeUrl.crawledAt,
      foundCount,
      impactScore,
    };
  });

  // Sort by impact score (descending)
  urlsWithStats.sort((a, b) => b.impactScore - a.impactScore);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo and navigation */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2 Logo"
                className="h-8 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>

            {/* Navigation menu in header */}
            <nav className="flex gap-8 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {/* Page header with back button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex items-center gap-4">
            <Link
              href={`/admin/projects/${params.id}?tab=scope`}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {project.title}
              </h1>
              {project.kenmerk && (
                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                  {project.kenmerk}
                </span>
              )}
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {project.status}
              </span>
            </div>
          </div>

          {/* Scope URL details */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left column - Results */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Binnen scope
                  </h2>
                  <p className="text-sm text-gray-600">-</p>
                </div>

                {/* URL */}
                <div>
                  <a
                    href={parentUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline flex items-center gap-2 w-fit"
                  >
                    {parentUrl.url}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Crawler Results */}
              <CrawlerOverviewResults
                projectId={params.id}
                urls={urlsWithStats}
              />
            </div>

            {/* Right column - Info */}
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Web crawler</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aantal pagina's:</span>
                      <span className="font-medium text-gray-900">{discoveredUrls.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-medium text-gray-900">{parentUrl.id.split('-')[0]}</span>
                    </div>
                    {parentUrl.crawledAt && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aangemaakt:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(parentUrl.crawledAt).toLocaleString('nl-NL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gewijzigd:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(parentUrl.crawledAt).toLocaleString('nl-NL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/shift2-logo.svg"
                  alt="Shift2 Logo"
                  className="h-6 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <p className="text-sm text-white leading-relaxed">
                Wij maken zaken met de overheid eenvoudig, met digitale toegankelijkheid als vast onderdeel van onze dienstverlening.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white mb-2">
                Onderzoek uitgevoerd door:
              </div>
              <div className="text-sm text-white">
                <div>{project.auditedByOrg}</div>
                {project.researcherName && <div>{project.researcherName}</div>}
                {project.commissionedBy && <div>In opdracht van {project.commissionedBy}</div>}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
