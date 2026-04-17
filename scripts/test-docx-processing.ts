import { PrismaClient } from '@prisma/client';
import { calculateReportStats } from '../lib/report-calculations';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    include: {
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
      },
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
      findings: true,
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  const researchTypeData = await prisma.researchType.findUnique({
    where: { name: project.researchType }
  });

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const countUniqueForms = () => {
    const formNames = new Set<string>();
    project.sampleItems.forEach((item) => {
      const match = item.title.match(/\(([^)]+)\)\s*$/);
      if (match) {
        formNames.add(match[1].trim());
      } else {
        const parts = item.title.split('-');
        if (parts.length > 1) {
          formNames.add(parts[parts.length - 1].trim());
        } else {
          formNames.add(item.title.trim());
        }
      }
    });
    return formNames.size;
  };

  const uniqueForms = countUniqueForms();
  const totalPages = project.sampleItems.length;
  const stats = calculateReportStats(project as any);
  const passedCriteria = stats.effectivePassed;
  const totalCriteria = stats.totalAssessed;
  const percentage = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
  const failedCriteria = stats.failed;
  const compliesFully = percentage === 100 ? 'volledig' : 'niet volledig';

  let summary = '';

  if (project.managementSummary) {
    summary = project.managementSummary;
  } else if (researchTypeData?.summaryTemplate) {
    const template = researchTypeData.summaryTemplate;
    summary = template
      .replace(/\{dateStart\}/g, formatDate(project.dateStart))
      .replace(/\{dateEnd\}/g, formatDate(project.dateEnd))
      .replace(/\{totalPages\}/g, String(totalPages))
      .replace(/\{uniqueForms\}/g, String(uniqueForms))
      .replace(/\{totalCriteria\}/g, String(totalCriteria))
      .replace(/\{passedCriteria\}/g, String(passedCriteria))
      .replace(/\{percentage\}/g, String(percentage))
      .replace(/\{failedCriteria\}/g, String(failedCriteria))
      .replace(/\{compliesFully\}/g, compliesFully);
  } else {
    summary = `De onderzochte content voldoet niet volledig aan ${project.standard} niveau ${project.level}. In dit onderzoek zijn criteria beoordeeld.`;
  }

  console.log('=== BEFORE HTML STRIP ===');
  console.log(summary);
  console.log('\n');

  // Strip HTML tags
  summary = summary
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  console.log('=== AFTER HTML STRIP ===');
  console.log(summary);
  console.log('\n');

  // Add researcher feedback
  if (project.researcherFeedback) {
    const feedbackText = project.researcherFeedback
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    console.log('=== RESEARCHER FEEDBACK ===');
    console.log(feedbackText);
    console.log('\n');

    summary += '\n\n' + feedbackText;
  }

  // Add closing advice
  const isFormulieren = researchTypeData?.type === 'formulieren';
  summary += '\n\nWij adviseren om ' +
    (isFormulieren ? 'formuliercontent' : 'content') +
    ' periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het ' +
    (isFormulieren ? 'beheer- en publicatieproces van formulieren' : 'publicatieproces') +
    '.';

  console.log('=== FINAL SUMMARY ===');
  console.log(summary);
  console.log('\n');
  console.log('Total length:', summary.length);
}

main().then(() => process.exit(0));