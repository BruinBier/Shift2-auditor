import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReportTabs from './ReportTabs';
import { marked } from 'marked';
import { groupFindingsByHierarchy } from '@/lib/report-calculations';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      clientProject: true,
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

  // Fetch research type data
  let researchTypeData = null;
  if (project.researchType) {
    const researchType = await prisma.researchType.findUnique({
      where: { name: project.researchType },
    });

    // Convert markdown to HTML
    if (researchType) {
      researchTypeData = {
        ...researchType,
        reportIntro: researchType.reportIntro ? await marked.parse(researchType.reportIntro) : null,
        reportIntroPdf: researchType.reportIntroPdf ? await marked.parse(researchType.reportIntroPdf) : null,
      };
    }
  }

  // Convert scopeInfo markdown to HTML
  const scopeInfoHtml = project.scopeInfo ? await marked.parse(project.scopeInfo) : null;

  // Debug: Check if occurrences are loaded
  console.log('=== DEBUG: Findings in page.tsx ===');
  project.findings.slice(0, 3).forEach((f: any) => {
    console.log(`Finding: ${f.findingCode}`);
    console.log(`Occurrences count: ${f.occurrences?.length || 0}`);
    if (f.occurrences && f.occurrences.length > 0) {
      console.log(`First occurrence sampleItem:`, f.occurrences[0].sampleItem);
    }
  });

  // Group findings by WCAG hierarchy
  const groupedFindings = await groupFindingsByHierarchy(project as any);

  // Convert dates to strings for client component
  const projectData = {
    ...project,
    version: parseFloat(String(project.version)),
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    userAgents: project.userAgents || null,
    researchTypeData: researchTypeData,
    scopeInfo: scopeInfoHtml,
    groupedFindings, // Pass the grouped findings to the client
    findings: project.findings.map((f: any) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      occurrences: f.occurrences, // Include occurrences with sampleItem
    })),
  };

  return <ReportTabs project={projectData} />;
}
