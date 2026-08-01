import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReportTabs from './ReportTabs';
import { marked } from 'marked';
import { groupFindingsByHierarchy } from '@/lib/report-calculations';
import { getReportData } from '@/lib/report-data';
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
  const data = await getReportData(params.id);

  if (!data) {
    notFound();
  }

  const { project } = data;
  const projectWithFilteredAssessments = data.projectForCalc;

  // Bij een heronderzoek: datums van de nulmeting voor de samenvatting
  const nulmetingDates =
    data.nulmeting?.dateStart && data.nulmeting?.dateEnd
      ? {
          dateStart: data.nulmeting.dateStart.toISOString(),
          dateEnd: data.nulmeting.dateEnd.toISOString(),
        }
      : null;

  // De markdown-velden van het onderzoekstype naar HTML omzetten.
  const rt = data.researchTypeData;
  const researchTypeData = rt
    ? {
        ...rt,
        reportIntro: rt.reportIntro ? await marked.parse(rt.reportIntro) : null,
        reportIntroPdf: rt.reportIntroPdf ? await marked.parse(rt.reportIntroPdf) : null,
        // summaryTemplate is HTML met placeholders, geen markdown.
        summaryTemplate: rt.summaryTemplate || null,
      }
    : null;

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
    nulmetingDates,
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
