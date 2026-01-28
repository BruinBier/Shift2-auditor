import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ScreenshotViewer from './ScreenshotViewer';
import AttachmentsSection from './AttachmentsSection';
import FindingsList from './FindingsList';
import NotesSection from './NotesSection';

export default async function SampleItemPage({
  params,
  searchParams
}: {
  params: { id: string; sampleId: string }
  searchParams: { returnTo?: string }
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

  // Get all criterion assessments for this project
  const criterionAssessments = await prisma.criterionAssessment.findMany({
    where: {
      projectId: params.id,
      status: 'failed'
    },
    select: {
      wcagCriterionId: true
    }
  });

  const failedCriterionIds = criterionAssessments.map(a => a.wcagCriterionId);

  // Get all project findings linked to afgekeurde criteria (includes both afgekeurd and opmerkingen)
  const allFindings = await prisma.finding.findMany({
    where: {
      projectId: params.id,
      wcagCriterionId: { in: failedCriterionIds }
    },
    include: {
      wcagCriterion: true,
      occurrences: {
        include: {
          sampleItem: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const currentIndex = allSampleItems.findIndex(item => item.id === params.sampleId);
  const totalItems = allSampleItems.length;

  const sampleTypeLabels = {
    structured: 'Gestructureerde steekproef',
    random: 'Willekeurige steekproef',
    pdf: 'PDF steekproef',
  };

  // Determine back link based on returnTo parameter
  const backLink = searchParams.returnTo === 'report'
    ? `/report/${params.id}?tab=sample`
    : `/admin/projects/${params.id}?tab=steekproef`;

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
                <Link
                  href={`/admin/projects/${params.id}?tab=steekproef`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  2. Steekproef
                </Link>
                <Link
                  href={`/admin/projects/${params.id}?tab=bevindingen`}
                  className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
                >
                  3. Bevindingen
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
              <div className="flex items-center gap-3">
                <Link
                  href={backLink}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900 font-heading">{project.title}</h1>
                {project.kenmerk && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                    {project.kenmerk}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  project.status === 'In uitvoering' ? 'bg-orange-100 text-orange-800' :
                  project.status === 'Afgerond' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-8">
            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Page details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Page Info Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    Pagina uit steekproef
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Titel</label>
                      <p className="text-sm text-gray-900">{sampleItem.title}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Locatie</label>
                      <a
                        href={sampleItem.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1"
                      >
                        {sampleItem.url}
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Beschrijving</label>
                      {sampleItem.description ? (
                        <div
                          className="text-sm text-gray-900 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                          dangerouslySetInnerHTML={{ __html: sampleItem.description }}
                        />
                      ) : (
                        <p className="text-sm text-gray-900">-</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                      <p className="text-sm text-gray-900">{sampleTypeLabels[sampleItem.sampleType as keyof typeof sampleTypeLabels] || sampleItem.sampleType}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Datum aangemaakt</label>
                      <p className="text-sm text-gray-900">
                        {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} om {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Laatst gewijzigd</label>
                      <p className="text-sm text-gray-900">
                        {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} om {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Screenshot */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Afbeelding</label>
                      {sampleItem.screenshotPath ? (
                        <ScreenshotViewer
                          src={sampleItem.screenshotPath}
                          alt={`Screenshot van ${sampleItem.title}`}
                        />
                      ) : (
                        <p className="text-sm text-gray-500">Nog geen schermafbeelding beschikbaar</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bevindingen section */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Bevindingen ({allFindings.length})</h2>
                  </div>

                  <FindingsList
                    findings={allFindings}
                    projectId={params.id}
                    sampleId={params.sampleId}
                  />
                </div>

                {/* Notities section */}
                <NotesSection
                  sampleItemId={params.sampleId}
                  initialNotes={sampleItem.notes || undefined}
                />

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

              {/* Right column - Sidebar */}
              <div className="space-y-6">
                {/* Filter bevindingen section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-base font-semibold mb-4">Filter bevindingen (1)</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="zoeken"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Selecteer een WCAG principe</option>
                    </select>

                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Selecteer persoon</option>
                    </select>

                    <button className="w-full px-4 py-2 bg-purple-700 text-white rounded-md text-sm font-medium hover:bg-purple-800">
                      Voeg een nieuwe bevinding toe
                    </button>

                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                      Voeg een bestaande bevinding toe
                    </button>
                  </div>
                </div>

                {/* Bijlagen section */}
                <AttachmentsSection
                  sampleItemId={params.sampleId}
                  screenshotUrl={sampleItem.screenshotPath || undefined}
                  screenshotAlt={sampleItem.screenshotAlt || sampleItem.title}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
