import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { calculateReportStats } from '@/lib/report-calculations';
import { generateFindingsSectionXml } from '@/lib/generate-findings-xml';

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
          orderBy: { sortOrder: 'asc' },
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

    // Calculate principle statistics for the scores table
    const principleLabels: Record<string, string> = {
      'Perceivable': 'Waarneembaar',
      'Operable': 'Bedienbaar',
      'Understandable': 'Begrijpelijk',
      'Robust': 'Robuust',
    };

    const principleScores = ['Perceivable', 'Operable', 'Understandable', 'Robust'].map(principle => {
      const criteriaForPrinciple = project.criterionAssessments.filter(
        (a: any) => a.wcagCriterion.principle === principle
      );

      const levelA = criteriaForPrinciple.filter((a: any) => a.wcagCriterion.level === 'A');
      const levelAA = criteriaForPrinciple.filter((a: any) => a.wcagCriterion.level === 'AA');

      // "Goedgekeurd" = only passed (not including not_present)
      const countApproved = (arr: any[]) => arr.filter((a: any) => a.status === 'passed').length;
      // "Getoetst" = total assessed (excludes not_tested)
      const countTested = (arr: any[]) => arr.filter((a: any) => a.status !== 'not_tested').length;

      return {
        principle: principleLabels[principle] || principle,
        levelA: {
          approved: countApproved(levelA),
          tested: countTested(levelA),
        },
        levelAA: {
          approved: countApproved(levelAA),
          tested: countTested(levelAA),
        },
        total: {
          approved: countApproved(criteriaForPrinciple),
          tested: countTested(criteriaForPrinciple),
        },
      };
    });

    // Calculate totals across all principles
    const totalScores = {
      levelA: {
        approved: principleScores.reduce((sum, p) => sum + p.levelA.approved, 0),
        tested: principleScores.reduce((sum, p) => sum + p.levelA.tested, 0),
      },
      levelAA: {
        approved: principleScores.reduce((sum, p) => sum + p.levelAA.approved, 0),
        tested: principleScores.reduce((sum, p) => sum + p.levelAA.tested, 0),
      },
      total: {
        approved: principleScores.reduce((sum, p) => sum + p.total.approved, 0),
        tested: principleScores.reduce((sum, p) => sum + p.total.tested, 0),
      },
    };

    // Prepare criteria assessments for table
    const criteriaForTable = project.criterionAssessments
      .filter(a => a.status === 'passed' || a.status === 'failed' || a.status === 'not_present' || a.status === 'unknown')
      .sort((a, b) => {
        // Sort by code (e.g., "1.1.1" < "1.3.1" < "2.4.6")
        const [aMajor, aMinor, aPatch] = a.wcagCriterion.code.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.wcagCriterion.code.split('.').map(Number);

        if (aMajor !== bMajor) return aMajor - bMajor;
        if (aMinor !== bMinor) return aMinor - bMinor;
        return aPatch - bPatch;
      })
      .map(assessment => {
        // Map status to Dutch labels
        let statusLabel = 'Voldoet';
        if (assessment.status === 'failed') {
          statusLabel = 'Voldoet niet';
        } else if (assessment.status === 'not_present') {
          statusLabel = 'Niet aanwezig';
        } else if (assessment.status === 'unknown') {
          statusLabel = 'Niet beoordeeld';
        }

        return {
          code: assessment.wcagCriterion.code,
          name: assessment.wcagCriterion.titleNl,
          status: statusLabel,
          isFailed: assessment.status === 'failed',
        };
      });

    // Prepare findings data for bevindingen section
    const failedAssessments = project.criterionAssessments
      .filter(a => a.status === 'failed')
      .sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.wcagCriterion.code.split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.wcagCriterion.code.split('.').map(Number);
        if (aMajor !== bMajor) return aMajor - bMajor;
        if (aMinor !== bMinor) return aMinor - bMinor;
        return aPatch - bPatch;
      });

    const findingsData = failedAssessments.map(assessment => {
      const criterion = assessment.wcagCriterion;
      const findingsForCriterion = project.findings.filter(
        f => f.wcagCriterionId === criterion.id
      );

      return {
        code: criterion.code,
        title: criterion.titleNl,
        level: criterion.level,
        description: criterion.descriptionNl || '',
        understandingUrl: criterion.understandingUrl || '',
        findings: findingsForCriterion.map((finding, index) => ({
          number: index + 1,
          findingCode: finding.findingCode,
          description: finding.description || '',
          advice: finding.advice || '',
          impact: finding.impact,
          responsibility: finding.responsibility || '',
          locations: finding.occurrences.map(occ => ({
            title: occ.sampleItem?.title || 'Onbekende locatie',
            url: occ.sampleItem?.url || '',
          })),
        })),
      };
    }).filter(item => item.findings.length > 0); // Only include criteria that have findings

    console.log(`[DOCX] Prepared ${findingsData.length} failed criteria with findings`);

    // Prepare opmerkingen data (findings with status !== 'open')
    const opmerkingenFindings = project.findings.filter(f => f.status !== 'open');

    // Group opmerkingen by criterion
    const opmerkingenData = opmerkingenFindings.reduce((acc, finding) => {
      const criterion = finding.wcagCriterion;
      if (!criterion) return acc;

      let criterionGroup = acc.find(item => item.code === criterion.code);

      if (!criterionGroup) {
        criterionGroup = {
          code: criterion.code,
          title: criterion.titleNl,
          level: criterion.level,
          description: criterion.descriptionNl || '',
          understandingUrl: criterion.understandingUrl || '',
          findings: [],
        };
        acc.push(criterionGroup);
      }

      criterionGroup.findings.push({
        number: criterionGroup.findings.length + 1,
        findingCode: finding.findingCode,
        description: finding.description || '',
        advice: finding.advice || '',
        impact: finding.impact,
        responsibility: finding.responsibility || '',
        locations: finding.occurrences.map(occ => ({
          title: occ.sampleItem?.title || 'Onbekende locatie',
          url: occ.sampleItem?.url || '',
        })),
      });

      return acc;
    }, [] as any[]).sort((a, b) => {
      // Sort by criterion code
      const [aMajor, aMinor, aPatch] = a.code.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.code.split('.').map(Number);
      if (aMajor !== bMajor) return aMajor - bMajor;
      if (aMinor !== bMinor) return aMinor - bMinor;
      return aPatch - bPatch;
    });

    console.log(`[DOCX] Prepared ${opmerkingenData.length} criteria with opmerkingen (${opmerkingenFindings.length} total opmerkingen)`);

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

      // Dynamic criteria assessments for table
      criteriaAssessments: criteriaForTable,
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

    console.log('[DOCX] Updating criteria table with project data...');

    // Get the rendered ZIP and modify the criteria table
    const renderedZip = doc.getZip();
    const documentXml = renderedZip.file('word/document.xml');
    if (documentXml) {
      let xmlContent = documentXml.asText();

      // Find the criteria table (contains pattern that identifies it)
      // We'll look for the table that has "1.1.1" in it (after TOC)
      const firstOccurrence = xmlContent.indexOf('1.1.1');
      const secondOccurrence = xmlContent.indexOf('1.1.1', firstOccurrence + 1);

      if (secondOccurrence !== -1) {
        // Find the table containing this occurrence
        const tableStart = xmlContent.lastIndexOf('<w:tbl', secondOccurrence);
        const tableEnd = xmlContent.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

        if (tableStart !== -1 && tableEnd > tableStart) {
          // Extract table
          const oldTable = xmlContent.substring(tableStart, tableEnd);

          // Find header row
          const headerRowStart = oldTable.indexOf('<w:tr');
          const headerRowEnd = oldTable.indexOf('</w:tr>', headerRowStart) + '</w:tr>'.length;
          const headerRow = oldTable.substring(headerRowStart, headerRowEnd);

          // Find a template row (second row)
          const templateRowStart = oldTable.indexOf('<w:tr', headerRowEnd);
          const templateRowEnd = oldTable.indexOf('</w:tr>', templateRowStart) + '</w:tr>'.length;
          const templateRowXml = oldTable.substring(templateRowStart, templateRowEnd);

          // Build new table with dynamic rows
          let newTable = oldTable.substring(0, headerRowStart) + headerRow;

          // Generate rows for each criterion
          for (const criterion of criteriaForTable) {
            let row = templateRowXml;

            // Replace placeholders (using actual values from first row as template)
            // This is a simple approach - replace the first criterion's data with current criterion
            row = row.replace(/1\.1\.1/g, criterion.code);
            row = row.replace(/Niet-tekstuele content/g, criterion.name);
            // Replace any existing status text with the current criterion's status
            row = row.replace(/<w:t>Voldoet niet<\/w:t>/g, `<w:t>${criterion.status}</w:t>`);
            row = row.replace(/<w:t>Voldoet<\/w:t>/g, `<w:t>${criterion.status}</w:t>`);
            row = row.replace(/<w:t>Niet aanwezig<\/w:t>/g, `<w:t>${criterion.status}</w:t>`);
            row = row.replace(/<w:t>Niet beoordeeld<\/w:t>/g, `<w:t>${criterion.status}</w:t>`);

            // Handle bold formatting for failed criteria
            if (criterion.isFailed) {
              // Add bold tags if not present
              row = row.replace(/<w:rPr>/g, '<w:rPr><w:b/><w:bCs/>');
              row = row.replace(/<w:rPr\/>/g, '<w:rPr><w:b/><w:bCs/></w:rPr>');
            } else {
              // Remove bold tags if present
              row = row.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');
            }

            newTable += row;
          }

          newTable += '</w:tbl>';

          // Replace the old table with the new one
          xmlContent = xmlContent.substring(0, tableStart) + newTable + xmlContent.substring(tableEnd);

          // Update the ZIP
          renderedZip.file('word/document.xml', xmlContent);

          console.log(`[DOCX] Updated criteria table with ${criteriaForTable.length} criteria`);
        }
      }

      // Now update the scores table (Onderzoek scores)
      console.log('[DOCX] Updating scores table with project data...');

      // Find the scores table by looking for "WCAG Principe" header text
      const scoresTableMarker = 'De tabel hieronder laat per WCAG-principe';
      const scoresTableIntroIndex = xmlContent.indexOf(scoresTableMarker);

      if (scoresTableIntroIndex !== -1) {
        // Find the table after this marker
        const scoresTableStart = xmlContent.indexOf('<w:tbl', scoresTableIntroIndex);

        if (scoresTableStart !== -1) {
          const scoresTableEnd = xmlContent.indexOf('</w:tbl>', scoresTableStart) + '</w:tbl>'.length;

          if (scoresTableEnd > scoresTableStart) {
            const oldScoresTable = xmlContent.substring(scoresTableStart, scoresTableEnd);

            // Extract all rows from the table
            const rowMatches = oldScoresTable.match(/<w:tr[^>]*>[\s\S]*?<\/w:tr>/g);

            if (rowMatches && rowMatches.length >= 6) {
              // Row 0: Header
              // Row 1-4: Principle rows (Waarneembaar, Bedienbaar, Begrijpelijk, Robuust)
              // Row 5: Total row

              const headerRow = rowMatches[0];
              let updatedRows = [headerRow];

              // Update principle rows (rows 1-4)
              for (let i = 0; i < 4; i++) {
                const principleScore = principleScores[i];
                let row = rowMatches[i + 1]; // +1 because row 0 is header

                // Helper function to replace text in <w:t> tags
                const replaceInTextTags = (xmlRow: string, oldText: string, newText: string) => {
                  return xmlRow.replace(
                    new RegExp(`(<w:t[^>]*>)${oldText.replace(/[/\s]/g, '\\s*')}(<\\/w:t>)`, 'g'),
                    `$1${newText}$2`
                  );
                };

                // Replace each cell value individually
                // The format in XML is separate <w:t> tags for each part: "5 /" and "8"

                // First, let's extract current values and replace them
                const textMatches = row.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

                if (textMatches && textMatches.length >= 7) {
                  // Index 0: Principle name (already correct)
                  // Index 1-2: Level A (e.g., "5 /" and "8")
                  // Index 3-4: Level AA (e.g., "6 /" and "7")
                  // Index 5-6: Total (e.g., "11 /" and "15")

                  // Replace Level A
                  row = row.replace(textMatches[1], `<w:t>${principleScore.levelA.approved} /</w:t>`);
                  row = row.replace(textMatches[2], `<w:t> ${principleScore.levelA.tested}</w:t>`);

                  // Replace Level AA
                  row = row.replace(textMatches[3], `<w:t>${principleScore.levelAA.approved} /</w:t>`);
                  row = row.replace(textMatches[4], `<w:t> ${principleScore.levelAA.tested}</w:t>`);

                  // Replace Total
                  row = row.replace(textMatches[5], `<w:t>${principleScore.total.approved} /</w:t>`);
                  row = row.replace(textMatches[6], `<w:t> ${principleScore.total.tested}</w:t>`);
                }

                updatedRows.push(row);
              }

              // Update total row (row 5)
              let totalRow = rowMatches[5];
              const totalTextMatches = totalRow.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

              if (totalTextMatches && totalTextMatches.length >= 5) {
                // Total row structure (6 text elements):
                // [0]: "Totaal"
                // [1]: "11 /" (Level A approved)
                // [2]: " 16" (Level A tested)
                // [3]: "9 /" (Level AA approved)
                // [4]: " 11" (Level AA tested)
                // [5]: "20/ 27" (Total - BOTH numbers in ONE tag!)

                // Replace Level A total
                totalRow = totalRow.replace(totalTextMatches[1], `<w:t>${totalScores.levelA.approved} /</w:t>`);
                totalRow = totalRow.replace(totalTextMatches[2], `<w:t> ${totalScores.levelA.tested}</w:t>`);

                // Replace Level AA total
                totalRow = totalRow.replace(totalTextMatches[3], `<w:t>${totalScores.levelAA.approved} /</w:t>`);
                totalRow = totalRow.replace(totalTextMatches[4], `<w:t> ${totalScores.levelAA.tested}</w:t>`);

                // Replace overall total (note: both numbers are in one <w:t> tag)
                totalRow = totalRow.replace(totalTextMatches[5], `<w:t>${totalScores.total.approved}/ ${totalScores.total.tested}</w:t>`);
              }

              updatedRows.push(totalRow);

              // Rebuild the table
              const tablePrefix = oldScoresTable.substring(0, oldScoresTable.indexOf('<w:tr'));
              const newScoresTable = tablePrefix + updatedRows.join('') + '</w:tbl>';

              // Replace the old scores table with the new one
              xmlContent = xmlContent.substring(0, scoresTableStart) + newScoresTable + xmlContent.substring(scoresTableEnd);

              // Update the ZIP
              renderedZip.file('word/document.xml', xmlContent);

              console.log(`[DOCX] Updated scores table with ${principleScores.length} principles`);
            } else {
              console.log(`[DOCX] Unexpected number of rows in scores table: ${rowMatches?.length || 0}`);
            }
          }
        }
      } else {
        console.log('[DOCX] Scores table marker not found, skipping scores table update');
      }

      // Now update the bevindingen (findings) section
      console.log('[DOCX] Updating bevindingen section with project data...');

      if (findingsData.length > 0) {
        // Find the bevindingen section by searching for "Bevindingen" heading (not the intro text)
        // We need to find the Heading2 "Bevindingen", not just any paragraph with that text
        let bevHeadingStart = -1;
        let searchPos = 0;

        // Search for "Bevindingen" that is in a Heading2 style
        while ((searchPos = xmlContent.indexOf('Bevindingen', searchPos)) !== -1) {
          // Check if this occurrence is in a heading by looking backwards for pStyle="Heading2" or "Kop2"
          const before = xmlContent.substring(Math.max(0, searchPos - 200), searchPos);
          if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
            // This is the heading! Now find the start of this paragraph
            const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
            const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
            bevHeadingStart = Math.max(paragraphStart, paragraphStart2);
            break;
          }
          searchPos++;
        }

        if (bevHeadingStart !== -1) {
          // Find the end of the bevindingen section (before "Opmerkingen" heading or next section)
          const bevSectionEndMarker = 'Opmerkingen';
          let bevSectionEnd = xmlContent.indexOf(bevSectionEndMarker, bevHeadingStart);

          // If no "Opmerkingen" section, try "Borging en vervolg"
          if (bevSectionEnd === -1) {
            bevSectionEnd = xmlContent.indexOf('Borging en vervolg', bevHeadingStart);
          }

          if (bevSectionEnd !== -1) {
            // Find the start of the paragraph containing the end marker
            // This ensures we stop right before the next heading
            const beforeEndMarker = xmlContent.substring(bevSectionEnd - 1000, bevSectionEnd);
            const lastPStart = Math.max(
              beforeEndMarker.lastIndexOf('<w:p '),
              beforeEndMarker.lastIndexOf('<w:p>')
            );

            const actualSectionEnd = bevSectionEnd - 1000 + lastPStart;

            console.log(`[DOCX] Found bevindingen section from ${bevHeadingStart} to ${actualSectionEnd}`);

            // Generate new findings XML
            const newFindingsXml = generateFindingsSectionXml(findingsData);

            // Replace the entire section (from Bevindingen heading to before next section heading)
            // This removes both the heading, intro text, and all old findings
            xmlContent = xmlContent.substring(0, bevHeadingStart) + newFindingsXml + xmlContent.substring(actualSectionEnd);

            // Update the ZIP
            renderedZip.file('word/document.xml', xmlContent);

            console.log(`[DOCX] Updated bevindingen section with ${findingsData.length} failed criteria`);
          } else {
            console.log('[DOCX] Could not find end of bevindingen section');
          }
        } else {
          console.log('[DOCX] Bevindingen heading not found in template');
        }
      } else {
        console.log('[DOCX] No findings to include in bevindingen section');
      }

      // Now update the opmerkingen section
      console.log('[DOCX] Updating opmerkingen section with project data...');

      if (opmerkingenData.length > 0) {
        // Find the opmerkingen section by searching for "Opmerkingen" heading
        let opmHeadingStart = -1;
        let searchPos = 0;

        // Search for "Opmerkingen" that is in a Heading2 style
        while ((searchPos = xmlContent.indexOf('Opmerkingen', searchPos)) !== -1) {
          // Check if this occurrence is in a heading by looking backwards for pStyle="Heading2" or "Kop2"
          const before = xmlContent.substring(Math.max(0, searchPos - 200), searchPos);
          if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
            // This is the heading! Now find the start of this paragraph
            const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
            const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
            opmHeadingStart = Math.max(paragraphStart, paragraphStart2);
            break;
          }
          searchPos++;
        }

        if (opmHeadingStart !== -1) {
          // Find the end of the opmerkingen section (before next section heading)
          // Try "Borging en vervolg" or any other next section
          const possibleEndMarkers = ['Borging en vervolg', 'Bijlage'];
          let opmSectionEnd = -1;

          for (const marker of possibleEndMarkers) {
            const pos = xmlContent.indexOf(marker, opmHeadingStart);
            if (pos !== -1) {
              opmSectionEnd = pos;
              break;
            }
          }

          if (opmSectionEnd !== -1) {
            // Find the start of the paragraph containing the end marker
            const beforeEndMarker = xmlContent.substring(opmSectionEnd - 1000, opmSectionEnd);
            const lastPStart = Math.max(
              beforeEndMarker.lastIndexOf('<w:p '),
              beforeEndMarker.lastIndexOf('<w:p>')
            );

            const actualSectionEnd = opmSectionEnd - 1000 + lastPStart;

            console.log(`[DOCX] Found opmerkingen section from ${opmHeadingStart} to ${actualSectionEnd}`);

            // Generate new opmerkingen XML (use custom intro and result text)
            const newOpmerkingenXml = generateFindingsSectionXml(
              opmerkingenData,
              'Opmerkingen',
              undefined, // Use default intro text for Opmerkingen
              'Voldoet maar met opmerking', // Result text
              'Opmerking' // Finding label
            );

            // Replace the entire section
            xmlContent = xmlContent.substring(0, opmHeadingStart) + newOpmerkingenXml + xmlContent.substring(actualSectionEnd);

            // Update the ZIP
            renderedZip.file('word/document.xml', xmlContent);

            console.log(`[DOCX] Updated opmerkingen section with ${opmerkingenData.length} criteria (${opmerkingenFindings.length} total opmerkingen)`);
          } else {
            console.log('[DOCX] Could not find end of opmerkingen section');
          }
        } else {
          console.log('[DOCX] Opmerkingen heading not found in template');
        }
      } else {
        console.log('[DOCX] No opmerkingen to include in opmerkingen section');
      }
    }

    console.log('[DOCX] Generating Word document buffer...');

    // Generate the Word document (use renderedZip if available)
    const docxBuffer = renderedZip.generate({
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