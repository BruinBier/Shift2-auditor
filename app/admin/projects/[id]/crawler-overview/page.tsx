import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CrawlerOverviewClient from './CrawlerOverviewClient';

type CrawlStatus = 'not-crawled' | 'clean' | 'issues-found';

export default async function CrawlerOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      scopeUrls: {
        where: { inScope: true },
        include: {
          crawlerResults: {
            where: { found: true },
          },
        },
        orderBy: { url: 'asc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Calculate summary statistics for each URL
  const urlsWithStats = project.scopeUrls.map(scopeUrl => {
    const foundCount = scopeUrl.crawlerResults.length;

    // Calculate impact score (simple formula: count of found issues)
    // In the future, this can be weighted by severity
    const impactScore = foundCount;

    // Determine status
    const status: CrawlStatus = scopeUrl.crawledAt
      ? (foundCount > 0 ? 'issues-found' : 'clean')
      : 'not-crawled';

    // Get unique test names as tags
    const tags = Array.from(new Set(scopeUrl.crawlerResults.map(r => r.testName)));

    return {
      id: scopeUrl.id,
      url: scopeUrl.url,
      title: scopeUrl.title,
      crawledAt: scopeUrl.crawledAt,
      foundCount,
      impactScore,
      status,
      tags: tags.slice(0, 3), // Show max 3 tags
      totalTags: tags.length,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Web Crawler Resultaten</h1>
              <p className="text-sm text-gray-600 mt-1">
                Project: {project.title}
              </p>
            </div>
            <a
              href={`/admin/projects/${project.id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Terug naar project
            </a>
          </div>
        </div>

        <CrawlerOverviewClient
          projectId={project.id}
          urls={urlsWithStats}
        />
      </div>
    </div>
  );
}