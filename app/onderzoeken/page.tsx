import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function OnderzoekekenPage() {
  const projects = await prisma.project.findMany({
    orderBy: { reportDate: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Onderzoeken</h1>
          <p className="text-xl text-gray-600">
            Bekijk alle WCAG toegankelijkheidsonderzoeken
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Nog geen onderzoeken beschikbaar.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/report/${project.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {project.standard} {project.level}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h2>
                  <div className="text-gray-700">{project.subject}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {format(project.reportDate, 'dd MMMM yyyy')}
                </div>
                <div className="mt-4 text-sm text-blue-600 font-medium">
                  Bekijk rapport →
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors inline-block"
          >
            ← Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}
