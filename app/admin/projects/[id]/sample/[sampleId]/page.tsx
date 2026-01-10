import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function SampleItemPage({
  params
}: {
  params: { id: string; sampleId: string }
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    notFound();
  }

  const sampleItem = await prisma.sampleItem.findUnique({
    where: { id: params.sampleId },
    include: {
      occurrences: {
        include: {
          finding: {
            include: {
              wcagCriterion: true,
            },
          },
        },
      },
    },
  });

  if (!sampleItem) {
    notFound();
  }

  // Get all sample items for navigation
  const allSampleItems = await prisma.sampleItem.findMany({
    where: { projectId: params.id },
    orderBy: { orderIndex: 'asc' },
  });

  const currentIndex = allSampleItems.findIndex(item => item.id === params.sampleId);
  const totalItems = allSampleItems.length;

  const sampleTypeLabels = {
    structured: 'Gestructureerde steekproef',
    random: 'Willekeurige steekproef',
    pdf: 'PDF steekproef',
  };

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
              <Link
                href="/admin/beheer"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Beheer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-grow">
          {/* Title section */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-8 py-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Rapport digitale toegankelijkheid</h1>
              </div>

              {/* Tabs */}
              <nav className="flex gap-8 border-b border-gray-200 items-center">
                <Link
                  href={`/admin/projects/${params.id}`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  Details
                </Link>
                <Link
                  href={`/admin/projects/${params.id}?tab=scope`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  1. Scope
                </Link>
                <span className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-shift2-primary text-shift2-primary transition-colors rounded-t-lg">
                  2. Steekproef ({totalItems})
                </span>
                <Link
                  href={`/admin/projects/${params.id}?tab=bevindingen`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  3. Bevindingen (0)
                </Link>
                <Link
                  href={`/admin/projects/${params.id}?tab=conclusie`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  4. Conclusie
                </Link>
                <Link
                  href={`/admin/projects/${params.id}?tab=voltooien`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  5. Voltooien
                </Link>
                <div className="ml-auto">
                  <button className="px-4 py-2 text-white rounded-lg font-medium transition-colors" style={{ backgroundColor: '#6b2d8f' }}>
                    Bekijk het rapport
                  </button>
                </div>
              </nav>
            </div>

            {/* Project info below tabs */}
            <div className="px-8 py-3 bg-gray-50">
              <p className="text-sm text-gray-600">{project.subject} - {project.standard} {project.level}</p>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-8">
            {/* Page Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Titel</label>
                  <p className="text-base text-gray-900">{sampleItem.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">URL</label>
                  <a
                    href={sampleItem.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-purple-700 hover:underline flex items-center gap-2"
                  >
                    {sampleItem.url}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Aantal steekproeven</label>
                  <p className="text-base text-gray-900">{currentIndex + 1} van {totalItems}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-base text-gray-900">{sampleTypeLabels[sampleItem.sampleType]}</p>
                </div>

                {sampleItem.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Beschrijving</label>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sampleItem.description }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Findings */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Bevindingen ({sampleItem.occurrences.length})</h2>
              </div>

              {sampleItem.occurrences.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nog geen bevindingen voor deze pagina
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sampleItem.occurrences.map((occurrence) => (
                    <div key={occurrence.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              Bevinding {occurrence.finding.findingCode}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              occurrence.finding.impact === 'kritiek' ? 'bg-red-100 text-red-800' :
                              occurrence.finding.impact === 'matig' ? 'bg-orange-100 text-orange-800' :
                              occurrence.finding.impact === 'klein' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {occurrence.finding.impact}
                            </span>
                            <span className="text-sm text-gray-500">
                              {occurrence.finding.wcagCriterion.code} - {occurrence.finding.wcagCriterion.titleNl}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Beschrijving</h4>
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: occurrence.finding.description }}
                              />
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Advies</h4>
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: occurrence.finding.advice }}
                              />
                            </div>

                            {occurrence.context && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Context</h4>
                                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                  {occurrence.context}
                                </pre>
                              </div>
                            )}

                            {occurrence.url && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">URL</h4>
                                <a
                                  href={occurrence.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-700 hover:underline"
                                >
                                  {occurrence.url}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/admin/projects/${params.id}?tab=bevindingen&finding=${occurrence.finding.id}`}
                          className="ml-4 text-sm text-purple-700 hover:text-purple-900"
                        >
                          Bekijk bevinding →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              {currentIndex > 0 ? (
                <Link
                  href={`/admin/projects/${params.id}/sample/${allSampleItems[currentIndex - 1].id}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Vorige
                </Link>
              ) : (
                <div />
              )}

              {currentIndex < totalItems - 1 ? (
                <Link
                  href={`/admin/projects/${params.id}/sample/${allSampleItems[currentIndex + 1].id}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  Volgende
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
