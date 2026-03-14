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

  // Get all findings for this criterion to calculate index
  const criterionFindings = await prisma.finding.findMany({
    where: {
      projectId: params.id,
      wcagCriterionId: finding.wcagCriterionId,
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Calculate the index of this finding (1-based)
  const findingIndex = criterionFindings.findIndex(f => f.id === finding.id) + 1;

  // Fetch sample items for the edit dialog
  const sampleItems = await prisma.sampleItem.findMany({
    where: { projectId: params.id },
    orderBy: { orderIndex: 'asc' },
  });

  // Convert dates to strings
  const findingData = {
    ...finding,
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
    occurrences: finding.occurrences.map((occ: any) => ({
      ...occ,
      createdAt: occ.createdAt?.toISOString() || null,
      updatedAt: occ.updatedAt?.toISOString() || null,
    })),
  };

  const projectData = {
    ...project,
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    researchStartedOn: project.researchStartedOn?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
  };

  return <FindingDetailView project={projectData} finding={findingData} allCriteria={allCriteria} findingIndex={findingIndex} sampleItems={sampleItems} />;
}