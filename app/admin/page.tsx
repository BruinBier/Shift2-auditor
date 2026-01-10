import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function AdminPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          scopeUrls: true,
          sampleItems: true,
          findings: true,
          criterionAssessments: true,
        },
      },
    },
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .new-project-button,
        .new-project-button[class] {
          background-color: white !important;
        }
        .new-project-button:hover,
        .new-project-button[class]:hover {
          background-color: #F9FAFB !important;
        }
      `}} />
      <div className="min-h-screen bg-gray-50">
        {/* Header with logo and navigation */}
        <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/admin">
                <img
                  src="/shift2-logo.svg"
                  alt="Shift2"
                  className="h-8"
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

        <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Beheer WCAG onderzoeken</p>
          </div>
          <Link
            href="/admin/projects/new"
            className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-white hover:bg-gray-50"
            style={{
              border: '1px solid #79e792',
              color: '#1f0036'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nieuw onderzoek
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen onderzoeken</h3>
            <p className="text-gray-600 mb-4">Begin met het aanmaken van je eerste onderzoek.</p>
            <Link
              href="/admin/projects/new"
              className="new-project-button inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-white hover:bg-gray-50"
              style={{
                border: '1px solid #79e792',
                color: '#1f0036'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Maak eerste onderzoek aan
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voortgang
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      <div className="text-sm text-gray-500">
                        {project.standard} {project.level}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(project.reportDate, 'dd-MM-yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {project._count.criterionAssessments} assessments
                      </div>
                      <div className="text-sm text-gray-500">
                        {project._count.findings} bevindingen
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Bewerk
                      </Link>
                      <Link
                        href={`/report/${project.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Rapport
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-6">
          <Link
            href="/"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Homepage</h3>
            <p className="text-sm text-gray-600">Terug naar de homepage</p>
          </Link>
          <Link
            href="/onderzoeken"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bekijk Onderzoeken</h3>
            <p className="text-sm text-gray-600">Bekijk alle gepubliceerde onderzoeken</p>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
