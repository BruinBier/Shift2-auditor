import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import { syncGithubIssuesToShift2 } from '@/lib/github-sync';

export const dynamic = 'force-dynamic';

export default async function TechnischeIssuesPage() {
  const sync = await syncGithubIssuesToShift2();

  const issues = await prisma.technicalIssue.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      wcagCriterion: { select: { code: true, titleNl: true, level: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Technische issues</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interne lijst van technische issues (leverancier/ontwikkelteam), los van WCAG-onderzoeken.
            </p>
          </div>
          <Link
            href="/technische-issues/new"
            className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium"
          >
            + Nieuw issue
          </Link>
        </div>

        {sync.errors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-2 rounded text-sm mb-4">
            GitHub-sync mislukt: {sync.errors.join(' / ')}
          </div>
        )}
        {sync.imported > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2 rounded text-sm mb-4">
            {sync.imported} {sync.imported === 1 ? 'issue' : 'issues'} geïmporteerd vanaf GitHub.
          </div>
        )}

        {issues.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            Nog geen issues. Klik op &quot;Nieuw issue&quot; om er één toe te voegen.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Titel</th>
                  <th className="px-4 py-3">Leverancier</th>
                  <th className="px-4 py-3">WCAG</th>
                  <th className="px-4 py-3">Impact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">GitHub</th>
                  <th className="px-4 py-3">Aangemaakt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/technische-issues/${issue.id}`}
                        className="text-shift2-primary hover:underline font-medium"
                      >
                        {issue.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{issue.supplier || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {issue.wcagCriterion ? `${issue.wcagCriterion.code} (${issue.wcagCriterion.level})` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{issue.impact || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          issue.status === 'open'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {issue.status === 'open' ? 'Open' : 'Opgelost'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {issue.githubIssueUrl ? (
                        <a
                          href={issue.githubIssueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-shift2-primary hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(issue.createdAt).toLocaleDateString('nl-NL')}
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
