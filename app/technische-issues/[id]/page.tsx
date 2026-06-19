import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navigation from '@/app/components/Navigation';
import { fetchGithubComments, GithubComment } from '@/lib/github';
import TechnicalIssueDetail from './TechnicalIssueDetail';

export const dynamic = 'force-dynamic';

export default async function TechnicalIssueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [issue, criteria] = await Promise.all([
    prisma.technicalIssue.findUnique({
      where: { id: params.id },
      include: {
        wcagCriterion: { select: { id: true, code: true, titleNl: true, level: true } },
      },
    }),
    prisma.wCAGCriterion.findMany({
      select: { id: true, code: true, titleNl: true, level: true },
      orderBy: { code: 'asc' },
    }),
  ]);

  if (!issue) notFound();

  let comments: GithubComment[] = [];
  let commentsError: string | null = null;
  if (issue.githubIssueUrl) {
    try {
      comments = await fetchGithubComments(issue.githubIssueUrl);
    } catch (err) {
      commentsError = err instanceof Error ? err.message : 'Comments ophalen mislukt';
    }
  }

  const initial = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    request: issue.request,
    wcagCriterionId: issue.wcagCriterionId,
    impact: issue.impact,
    supplier: issue.supplier,
    status: issue.status,
    githubIssueUrl: issue.githubIssueUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-[1000px] mx-auto px-8 py-8">
        <div className="mb-4">
          <Link href="/technische-issues" className="text-sm text-shift2-primary hover:underline">
            ← Terug naar Technische issues
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{issue.title}</h1>
        <TechnicalIssueDetail
          initial={initial}
          criteria={criteria}
          wcagCriterion={issue.wcagCriterion}
          comments={comments}
          commentsError={commentsError}
        />
      </main>
    </div>
  );
}
