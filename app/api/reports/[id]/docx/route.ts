import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { calculateReportStats } from '@/lib/report-calculations';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('[DOCX] Starting Word document generation for project:', id);

    // Fetch complete project data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        clientProject: {
          include: {
            opdrachtgever: true,
          },
        },
        scopeUrls: {
          where: { inScope: true },
          orderBy: { url: 'asc' },
        },
        sampleItems: {
          orderBy: { orderIndex: 'asc' },
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
        criterionAssessments: {
          include: {
            wcagCriterion: true,
          },
        },
      },
    });

    if (!project) {
      console.error('[DOCX] Project not found:', id);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch research type separately (no direct relation in schema)
    const researchTypeData = await prisma.researchType.findUnique({
      where: { name: project.researchType },
    });

    console.log('[DOCX] Project found, loading template...');

    // Load the template
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'formulieren',
      'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
    );

    const templateContent = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(templateContent);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    console.log('[DOCX] Template loaded, preparing data...');

    // Format dates
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // Count unique forms for formulieren research type
    const countUniqueForms = () => {
      const formNames = new Set<string>();
      project.sampleItems.forEach((item) => {
        // Extract form name from title (text in parentheses at the end)
        const match = item.title.match(/\(([^)]+)\)\s*$/);
        if (match) {
          formNames.add(match[1].trim());
        } else {
          // Fallback: use the part after the last "-"
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

    // Calculate report statistics
    const stats = calculateReportStats(project as any);
    const passedCriteria = stats.effectivePassed;
    const totalCriteria = stats.totalAssessed;
    const percentage = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
    const failedCriteria = stats.failed;
    const compliesFully = percentage === 100 ? 'volledig' : 'niet volledig';

    // Prepare data for template
    const templateData = {
      // Basic project info
      projectSubject: project.subject || project.title,
      opdrachtgeverNaam: (() => {
        let naam = project.clientProject?.opdrachtgever?.naam || project.commissionedBy || '';
        // Remove "gemeente" prefix if present
        return naam.replace(/^gemeente\s+/i, '');
      })(),
      websiteUrl: (() => {
        const firstUrl = project.scopeUrls[0]?.url;
        if (!firstUrl) return '';
        // Extract base domain (e.g., https://www.wierden.nl/)
        try {
          const url = new URL(firstUrl);
          return `${url.protocol}//${url.host}/`;
        } catch {
          return firstUrl;
        }
      })(),
      reportDate: formatDate(project.reportDate),
      version: project.version.toString(),

      // Additional fields
      title: project.title,
      kenmerk: project.kenmerk || '',
      standard: project.standard,
      level: project.level,
      researchType: project.researchType,
      researcherName: project.researcherName || '',
      dateStart: formatDate(project.dateStart),
      dateEnd: formatDate(project.dateEnd),
      auditedByOrg: project.auditedByOrg || 'Shift2',

      // Form-specific counts
      uniqueForms: uniqueForms,
      totalPages: totalPages,

      // Criteria statistics for summary
      totalCriteria: totalCriteria,
      passedCriteria: passedCriteria,
      failedCriteria: failedCriteria,
      percentage: percentage,
      compliesFully: compliesFully,

      // Rich text fields - main sections
      // Combine management summary with researcher feedback (if available)
      managementSummary: (() => {
        let summary = '';

        // If managementSummary exists, use it
        if (project.managementSummary) {
          summary = project.managementSummary;
        }
        // Otherwise, generate from research type template
        else if (researchTypeData?.summaryTemplate) {
          const template = researchTypeData.summaryTemplate;

          // Replace placeholders with actual values
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
        }
        // Fallback
        else {
          summary = `De onderzochte content voldoet niet volledig aan ${project.standard} niveau ${project.level}. In dit onderzoek zijn criteria beoordeeld.`;
        }

        // Strip HTML tags from summary for Word
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

        // Add researcher feedback after the summary
        if (project.researcherFeedback) {
          // Strip HTML tags from researcher feedback for Word
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
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .trim();

          summary += '\n\n' + feedbackText;
        }

        // Add closing advice for formulieren (only if not already present)
        const isFormulieren = researchTypeData?.type === 'formulieren';
        const closingAdviceText = 'Wij adviseren om ' +
          (isFormulieren ? 'formuliercontent' : 'content') +
          ' periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het ' +
          (isFormulieren ? 'beheer- en publicatieproces van formulieren' : 'publicatieproces') +
          '.';

        // Only add if not already present
        if (!summary.includes('Wij adviseren om')) {
          summary += '\n\n' + closingAdviceText;
        }

        return summary;
      })(),
      researcherFeedback: '', // Empty since we're combining it with managementSummary
      aboutResearchText: project.aboutResearchText || `Voor dit project is een onderzoek uitgevoerd naar de toegankelijkheid van de content, om vast te stellen in hoeverre deze voldoet aan ${project.standard} niveau ${project.level} (EN 301 549).`,
      scopeInfo: project.scopeInfo || `Dit onderzoek heeft betrekking op de content die door de organisatie via het beheersysteem kan worden ingevoerd of aangepast.`,
      sampleInfo: project.sampleInfo || `Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM. Als een proces is meegenomen in het onderzoek staan ook alle procespagina's in de steekproef vermeld. Zie: https://www.digitoegankelijk.nl/aanpak/toegankelijkheidsonderzoek.`,
      conclusionText: project.conclusionText || '',

      // Additional text sections with defaults
      managementSummaryAdvice: 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces.',

      validityText: 'De geldigheid van dit onderzoeksrapport bedraagt maximaal drie jaar. Bij substantiële wijzigingen in de content of het publicatieproces adviseren wij een aanvullend of nieuw onderzoek uit te laten voeren.',

      criteriaCountText: `Bij dit onderzoek zijn succescriteria van ${project.standard} niveau ${project.level} beoordeeld.`,

      otherCriteriaText: 'Andere succescriteria hebben betrekking op de technische basis en worden beoordeeld in het afzonderlijke deelonderzoek techniek.',

      combinedAssessmentText: `Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van het project.`,

      methodologyText: `Het onderzoek is uitgevoerd op basis van een representatieve steekproef. Binnen deze steekproef zijn de aangetroffen toegankelijkheidsproblemen zo concreet mogelijk beschreven. Waar mogelijk is een aanbeveling opgenomen om de afwijking te verhelpen.`,

      snapshotWarningText: 'Dit onderzoek biedt geen uitputtend overzicht van alle mogelijke toegankelijkheidsproblemen. De bevindingen vormen een momentopname van de situatie ten tijde van het onderzoek.',

      continuityAdvice1: 'Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen in pagina\'s die niet zijn onderzocht. Het is daarom raadzaam om alle pagina\'s te controleren op vergelijkbare patronen en deze structureel te monitoren.',

      continuityAdvice2: 'Daarnaast kunnen wijzigingen in de inhoud of in het publicatieproces nieuwe toegankelijkheidsrisico\'s met zich meebrengen. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling blijven daarom noodzakelijk.',

      scopeExplanation: 'Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.',

      methodologyDetailText: `Dit onderzoek is uitgevoerd conform de evaluatiemethode WCAG-EM. Deze methode is aanbevolen door DigiToegankelijk (Logius). Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden.`,

      testEnvironmentIntro: 'Het basisniveau van ondersteuning bestaat uit gangbare webbrowsers en hulptechnologieën. Het onderzoek is uitgevoerd met:',

      // Counts for summary
      totalFindings: project.findings.length,
      totalSampleItems: project.sampleItems.length,
      totalScopeUrls: project.scopeUrls.length,

      // Browser and tool versions for test environment section
      browserChrome: 'Google Chrome 145',
      browserFirefox: 'Mozilla Firefox 147',
      browserEdge: 'Microsoft Edge 145',
      screenReader: 'NVDA (Windows)',
    };

    console.log('[DOCX] Rendering template with data...');
    console.log('[DOCX DEBUG] managementSummary length:', templateData.managementSummary.length);
    console.log('[DOCX DEBUG] managementSummary preview:', templateData.managementSummary.substring(0, 500));

    // Write debug file
    try {
      fs.writeFileSync(
        path.join(process.cwd(), 'debug-summary.txt'),
        `Full managementSummary content:\n\n${templateData.managementSummary}\n\nHas researcher feedback: ${project.researcherFeedback ? 'YES' : 'NO'}\n`
      );
      console.log('[DOCX DEBUG] Written debug-summary.txt');
    } catch (err) {
      console.log('[DOCX DEBUG] Failed to write debug file:', err);
    }

    // Render the template with data
    doc.render(templateData);

    console.log('[DOCX] Generating Word document buffer...');

    // Generate the Word document
    const docxBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Generate filename
    const fileName = `rapport-${project.subject || project.title}-v${project.version}.docx`
      .replace(/[^a-zA-Z0-9.-]/g, '_');

    console.log('[DOCX] Sending Word document:', fileName);

    // Return Word document as download
    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[DOCX] Error generating Word document:', error);

    return NextResponse.json({
      error: 'Failed to generate Word document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}