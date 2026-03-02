import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReportTabs from './ReportTabs';
import { marked } from 'marked';
import { groupFindingsByHierarchy } from '@/lib/report-calculations';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      subject: true,
    },
  });

  if (!project) {
    return {
      title: 'Rapport niet gevonden',
    };
  }

  return {
    title: `Rapport digitale toegankelijkheid - ${project.subject || project.title || 'Shift2 Auditor'}`,
  };
}

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

  // Filter criterionAssessments based on research type
  let filteredAssessments = project.criterionAssessments;
  if (project.researchType) {
    const researchType = await prisma.researchType.findUnique({
      where: { name: project.researchType },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    if (researchType && researchType.criteria.length > 0) {
      const allowedCriteriaIds = new Set(researchType.criteria.map(c => c.wcagCriterionId));
      filteredAssessments = project.criterionAssessments.filter(
        assessment => allowedCriteriaIds.has(assessment.wcagCriterion.id)
      );
    }
  }

  // Update project with filtered assessments
  const projectWithFilteredAssessments = {
    ...project,
    criterionAssessments: filteredAssessments,
  };

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
        // summaryTemplate is passed through as-is (HTML with placeholders, not markdown)
        summaryTemplate: researchType.summaryTemplate || null,
      };
    }
  }

  // Convert scopeInfo markdown to HTML
  const scopeInfoHtml = project.scopeInfo ? await marked.parse(project.scopeInfo) : null;

  // Convert sampleInfo markdown to HTML
  const sampleInfoHtml = project.sampleInfo ? await marked.parse(project.sampleInfo) : null;

  // Group findings by WCAG hierarchy (use filtered assessments)
  const groupedFindings = await groupFindingsByHierarchy(projectWithFilteredAssessments as any);

  // Convert dates to strings for client component
  const projectData = {
    ...projectWithFilteredAssessments,
    version: parseFloat(String(project.version)),
    dateStart: project.dateStart?.toISOString() || null,
    dateEnd: project.dateEnd?.toISOString() || null,
    reportDate: project.reportDate.toISOString(),
    userAgents: project.userAgents || null,
    researchTypeData: researchTypeData,
    scopeInfo: scopeInfoHtml,
    sampleInfo: sampleInfoHtml,
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
