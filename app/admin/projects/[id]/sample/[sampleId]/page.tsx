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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/admin/projects/${params.id}?tab=steekproef`}
            className="text-sm text-purple-700 hover:text-purple-900 flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug naar dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Pagina uit steekproef</h1>
        </div>

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
        <div className="bg-white rounded-lg border border-gray-200">
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
        <div className="mt-6 flex justify-between items-center">
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
  );
}
