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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Beheer WCAG onderzoeken</p>
          </div>
          <Link
            href="/admin/projects/new"
            className="px-4 py-2 bg-shift2-primary text-white rounded-lg hover:bg-shift2-secondary transition-colors"
          >
            + Nieuw onderzoek
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen onderzoeken</h3>
            <p className="text-gray-600 mb-4">Begin met het aanmaken van je eerste onderzoek.</p>
            <Link
              href="/admin/projects/new"
              className="inline-block px-4 py-2 bg-shift2-primary text-white rounded-lg hover:bg-shift2-secondary transition-colors"
            >
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
                {projects.map((project) => (
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
  );
}
