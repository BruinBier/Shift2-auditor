import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TEST_COVERAGE } from '@/lib/wcag-coverage';
import TestDetailClient from './TestDetailClient';

interface PageProps {
  params: { id: string; testName: string };
}

export default async function TestDetailPage({ params }: PageProps) {
  const { id: projectId, testName } = params;
  const testNameDecoded = decodeURIComponent(testName);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      kenmerk: true,
      title: true,
      sampleItems: {
        select: {
          id: true,
          title: true,
          url: true,
          sampleType: true,
          orderIndex: true,
          crawledAt: true,
          crawlerResults: {
            where: { testName: testNameDecoded },
            select: {
              id: true,
              testId: true,
              testName: true,
              found: true,
              count: true,
              details: true,
              createdAt: true,
            },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!project) notFound();

  const testInfo = TEST_COVERAGE.find((t) => t.testName === testNameDecoded);

  // Statistieken berekenen
  const samplesWithResults = project.sampleItems.filter((s) => s.crawlerResults.length > 0);
  const samplesWithIssues = samplesWithResults.filter((s) => s.crawlerResults.some((r) => r.found));
  const totalVoorvallen = samplesWithIssues.reduce(
    (sum, s) => sum + s.crawlerResults.reduce((rs, r) => rs + (r.found ? r.count : 0), 0),
    0,
  );

  return (
    <TestDetailClient
      project={project}
      testName={testNameDecoded}
      testInfo={testInfo}
      stats={{
        samplesTested: samplesWithResults.length,
        samplesWithIssues: samplesWithIssues.length,
        totalVoorvallen,
        totalSamples: project.sampleItems.length,
      }}
    />
  );
}
