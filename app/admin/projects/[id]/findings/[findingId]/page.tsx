import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FindingDetailView from './FindingDetailView';

export default async function FindingDetailPage({
  params
}: {
  params: { id: string; findingId: string }
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    notFound();
  }

  const finding = await prisma.finding.findUnique({
    where: { id: params.findingId },
    include: {
      wcagCriterion: true,
      occurrences: {
        include: {
          sampleItem: true,
        },
      },
    },
  });

  if (!finding) {
    notFound();
  }

  // Fetch all WCAG criteria for the edit dialog
  const allCriteria = await prisma.wCAGCriterion.findMany({
    orderBy: { code: 'asc' },
  });

  // Convert dates to strings
  const findingData = {
    ...finding,
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
  };

  const projectData = {
    ...project,
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    researchStartedOn: project.researchStartedOn?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
  };

  return <FindingDetailView project={projectData} finding={findingData} allCriteria={allCriteria} />;
}