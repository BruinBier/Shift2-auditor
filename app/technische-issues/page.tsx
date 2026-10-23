import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import { IssueStatus, IssueVerwijderen } from './IssueRijActies';
import NummerBadge from './NummerBadge';

export const dynamic = 'force-dynamic';

export default async function TechnischeIssuesPage() {
  const issues = await prisma.technicalIssue.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      wcagCriterion: { select: { code: true, titleNl: true, level: true } },
      // Gekoppelde werkitems: een koppeling geldt twee kanten op, dus beide richtingen.
      koppelingenVan: { select: { naar: { select: { id: true, title: true, nummer: true } } } },
      koppelingenNaar: { select: { van: { select: { id: true, title: true, nummer: true } } } },
    },
  });

  const gekoppeldAan = (issue: (typeof issues)[number]) =>
    [...issue.koppelingenVan.map((k) => k.naar), ...issue.koppelingenNaar.map((k) => k.van)].sort(
      (a, b) => a.nummer - b.nummer
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Technische issues</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interne lijst van technische issues per gemeente of organisatie, los van WCAG-onderzoeken.
            </p>
          </div>
          <Link
            href="/technische-issues/new"
            className="bg-shift2-primary text-white px-4 py-2 rounded-md hover:opacity-90 text-sm font-medium"
          >
            + Nieuw issue
          </Link>
        </div>

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
                  <th className="px-4 py-3">Organisatie</th>
                  <th className="px-4 py-3">WCAG</th>
                  <th className="px-4 py-3">Impact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aangemaakt</th>
                  <th className="px-4 py-3"><span className="sr-only">Acties</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-5 align-top">
                      <Link
                        href={`/technische-issues/${issue.id}`}
                        className="text-shift2-primary hover:underline font-medium"
                      >
                        <NummerBadge nummer={issue.nummer} />{' '}
                        {issue.title}
                      </Link>
                      {/* De Engelse URL van de detailpagina, om meteen door te klikken. */}
                      {issue.urlEn && (
                        <div className="mt-2">
                          <a
                            href={issue.urlEn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-600 hover:text-shift2-primary hover:underline break-all"
                          >
                            {issue.urlEn}
                            <span className="sr-only"> (opent in een nieuw tabblad)</span>
                            <span aria-hidden="true"> ↗</span>
                          </a>
                        </div>
                      )}
                      {gekoppeldAan(issue).length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {gekoppeldAan(issue).map((g) => (
                            <li key={g.id} className="flex items-start gap-1 text-xs">
                              <svg
                                aria-hidden="true"
                                className="mt-0.5 h-3 w-3 shrink-0 text-orange-700"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <Link
                                href={`/technische-issues/${g.id}`}
                                className="text-gray-600 hover:text-shift2-primary hover:underline"
                              >
                                <span className="sr-only">Gekoppeld aan </span>
                                <NummerBadge nummer={g.nummer} gekoppeld /> {g.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-5 align-top text-gray-700">{issue.supplier || '—'}</td>
                    <td className="px-4 py-5 align-top text-gray-700">
                      {issue.wcagCriterion ? `${issue.wcagCriterion.code} (${issue.wcagCriterion.level})` : '—'}
                    </td>
                    <td className="px-4 py-5 align-top text-gray-700">{issue.impact || '—'}</td>
                    <td className="px-4 py-5 align-top">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <IssueStatus
                          id={issue.id}
                          status={issue.status}
                          titel={issue.title}
                          aantalGekoppeld={gekoppeldAan(issue).length}
                        />
                        {/* Gekoppeld is geen status: het staat ernaast, zodat de voortgang
                            zichtbaar blijft. De titels staan onder de issuetitel. */}
                        {gekoppeldAan(issue).length > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded border border-orange-300 bg-orange-100 px-1.5 py-0.5 text-xs text-orange-900">
                            <svg
                              aria-hidden="true"
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="sr-only">Gekoppeld aan </span>
                            {gekoppeldAan(issue).map((g, i) => (
                              <span key={g.id} className="font-mono font-semibold">
                                {i > 0 && ', '}#{g.nummer}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top text-gray-600 text-xs">
                      {new Date(issue.createdAt).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-4 py-5 align-top text-right">
                      <IssueVerwijderen id={issue.id} titel={issue.title} />
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
