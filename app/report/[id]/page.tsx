import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReportTabs from './ReportTabs';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      scopeUrls: true,
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
        include: {
          _count: {
            select: { occurrences: true },
          },
        },
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
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Convert dates to strings for client component
  const projectData = {
    ...project,
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    findings: project.findings.map((f: any) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  };

  return <ReportTabs project={projectData} />;
}
