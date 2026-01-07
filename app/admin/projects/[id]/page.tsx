import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectAdminTabs from './ProjectAdminTabs';

export default async function ProjectAdminPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      scopeUrls: true,
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
      },
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
      findings: {
        include: {
          wcagCriterion: true,
          occurrences: {
            include: {
              sampleItem: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const allCriteria = await prisma.wCAGCriterion.findMany({
    orderBy: { code: 'asc' },
  });

  // Convert dates to strings
  const projectData = {
    ...project,
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    findings: project.findings.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  };

  return <ProjectAdminTabs project={projectData} allCriteria={allCriteria} />;
}
