import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { calculateReportStats } from '@/lib/report-calculations';
import { generateFindingsSectionXml } from '@/lib/generate-findings-xml';
import { generateTocXml, defaultFormulierenTocEntries } from '@/lib/generate-toc-xml';

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Track hyperlink relationships for Word document
 */
class HyperlinkManager {
  private relationships: Map<string, string> = new Map();
  private nextId: number = 100; // Start at high number to avoid conflicts

  /**
   * Get or create a relationship ID for a URL
   */
  getRelId(url: string): string {
    if (this.relationships.has(url)) {
      return this.relationships.get(url)!;
    }

    const relId = `rId${this.nextId++}`;
    this.relationships.set(url, relId);
    return relId;
  }

  /**
   * Generate relationship XML entries for all tracked URLs
   */
  generateRelationshipXml(): string {
    let xml = '';
    for (const [url, relId] of this.relationships.entries()) {
      xml += `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(url)}" TargetMode="External"/>`;
    }
    return xml;
  }

  /**
   * Get all relationships as array for insertion into rels file
   */
  getRelationships(): Array<{url: string, relId: string}> {
    return Array.from(this.relationships.entries()).map(([url, relId]) => ({url, relId}));
  }
}

/**
 * Generate a hyperlink paragraph with proper relationship
 */
function generateHyperlink(url: string, displayText: string, hyperlinkManager: HyperlinkManager, style?: 'bullet' | 'normal'): string {
  const relId = hyperlinkManager.getRelId(url);

  if (style === 'bullet') {
    // Bullet list item with hyperlink
    return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(displayText)}</w:t></w:r></w:hyperlink></w:p>`;
  } else {
    // Normal paragraph with hyperlink
    return `<w:p><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(displayText)}</w:t></w:r></w:hyperlink></w:p>`;
  }
}

/**
 * Generate a bullet list item with bold title and hyperlink URL on new line
 */
function generateBulletWithTitleAndUrl(title: string, url: string, hyperlinkManager: HyperlinkManager): string {
  // Start with title and line break
  let xml = `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(title)}</w:t></w:r>`;

  // Only add URL if it exists
  if (url && url.trim() !== '') {
    const relId = hyperlinkManager.getRelId(url);
    xml += `<w:r><w:br/></w:r><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(url)}</w:t></w:r></w:hyperlink>`;
  }

  xml += `</w:p>`;
  return xml;
}

/**
 * Generate a paragraph with bold title and hyperlink URL on new line
 */
function generateParagraphWithTitleAndUrl(title: string, url: string, hyperlinkManager: HyperlinkManager): string {
  const relId = hyperlinkManager.getRelId(url);

  return `<w:p><w:pPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(title)}</w:t></w:r><w:r><w:br/></w:r><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(url)}</w:t></w:r></w:hyperlink></w:p>`;
}

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

    // Initialize hyperlink manager for tracking all hyperlinks in the document
    const hyperlinkManager = new HyperlinkManager();

    // Format dates
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // For formulieren projects: count in-scope URLs (each URL = one form)
    // For other projects: use total sample items
    const isFormulieren = researchTypeData?.type === 'formulieren';
    const totalPages = project.sampleItems.length;
    const uniqueForms = isFormulieren && project.scopeUrls
      ? project.scopeUrls.filter((url: any) => url.inScope).length
      : totalPages;

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
          level: assessment.wcagCriterion.level,
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
      opdrachtgeverNaam: project.clientProject?.opdrachtgever?.naam || project.commissionedBy || '',

      // Website URL - extract base domain from first in-scope URL (without protocol and www)
      websiteUrl: (() => {
        const inScopeUrls = project.scopeUrls.filter(u => u.inScope);
        const firstUrl = inScopeUrls[0]?.url;
        if (!firstUrl) return '';
        // Extract base domain (e.g., heerlen.nl)
        try {
          const url = new URL(firstUrl);
          let host = url.host;
          // Remove www. prefix if present
          if (host.startsWith('www.')) {
            host = host.substring(4);
          }
          return host;
        } catch {
          return firstUrl;
        }
      })(),

      // Website name - use project subject (e.g., "Heerlen")
      websiteName: project.subject || project.title,

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
            .replace(/\{compliesFully\}/g, compliesFully)
            .replace(/\{formsSingularPlural\}/g, uniqueForms === 1 ? 'formulier' : 'formulieren')
            .replace(/\{pagesSingularPlural\}/g, totalPages === 1 ? 'processtap' : 'processtappen')
            .replace(/\{criteriaFailedSingularPlural\}/g, failedCriteria === 1 ? 'succescriterium' : 'succescriteria');
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
        const closingAdviceText = 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het ' +
          (isFormulieren ? 'beheer- en publicatieproces van formulieren' : 'publicatieproces') +
          '.';

        // Only add if not already present
        if (!summary.includes('Wij adviseren om')) {
          summary += '\n\n' + closingAdviceText;
        }

        return summary;
      })(),
      researcherFeedback: '', // Empty since we're combining it with managementSummary

      // Report intro header - different for formulieren vs regular projects
      reportIntroHeader: (() => {
        const websiteUrl = (() => {
          const inScopeUrls = project.scopeUrls.filter(u => u.inScope);
          const firstUrl = inScopeUrls[0]?.url;
          if (!firstUrl) return '';
          // Extract base domain (without protocol and www)
          try {
            const url = new URL(firstUrl);
            let host = url.host;
            // Remove www. prefix if present
            if (host.startsWith('www.')) {
              host = host.substring(4);
            }
            return host;
          } catch {
            return firstUrl;
          }
        })();

        return isFormulieren
          ? `Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content van de formulieren op ${websiteUrl}`
          : `Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content op de website ${websiteUrl}`;
      })(),

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

      continuityAdvice1: `Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen in ${isFormulieren ? 'formulieren' : 'pagina\'s'} die niet zijn onderzocht. Het is daarom raadzaam om alle ${isFormulieren ? 'formulieren' : 'pagina\'s'} te controleren op vergelijkbare patronen en deze structureel te monitoren.`,

      continuityAdvice2: 'Daarnaast kunnen wijzigingen in de content van formulieren of in het publicatieproces nieuwe toegankelijkheidsrisico\'s met zich meebrengen. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling blijven daarom noodzakelijk.',

      scopeExplanation: 'Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.',

      methodologyDetailText: `Dit onderzoek is uitgevoerd conform de evaluatiemethode WCAG-EM. Deze methode is aanbevolen door DigiToegankelijk (Logius). Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden.`,

      testEnvironmentIntro: 'Het basisniveau van ondersteuning bestaat uit gangbare webbrowsers en hulptechnologieën. Het onderzoek is uitgevoerd met:',

      // Counts for summary
      totalFindings: project.findings.length,
      totalSampleItems: project.sampleItems.length,
      totalScopeUrls: project.scopeUrls.length,

      // Scope URLs for onderzoeksdetails (split by inScope)
      scopeUrlsInScope: project.scopeUrls
        .filter(u => u.inScope)
        .map(scopeUrl => ({
          url: scopeUrl.url,
          scopeDescription: '(Andere URI-basis en stijlkenmerken)', // TODO: Add scopeDescription field to ProjectScopeUrl model
        })),
      scopeUrlsOutOfScope: project.scopeUrls
        .filter(u => !u.inScope)
        .map(scopeUrl => ({
          url: scopeUrl.url,
          scopeDescription: '(Andere URI-basis en stijlkenmerken)', // TODO: Add scopeDescription field to ProjectScopeUrl model
        })),

      // Browser and tool versions for test environment section (from database)
      userAgents: project.userAgents || 'Google Chrome 145 (primair);\nMozilla Firefox 147;\nMicrosoft Edge 145;\nNVDA (Windows) in combinatie met Google Chrome;',
      technologies: project.technologies.length > 0 ? Array.from(new Set(project.technologies)).join('\n') : 'DOM\nHTML\nCSS',

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

      // NOTE: We no longer manually split managementSummary here
      // Docxtemplater with linebreaks:true handles newlines automatically
      console.log('[DOCX] Docxtemplater has already rendered managementSummary with linebreaks');

      // Find the criteria table (contains pattern that identifies it)
      // We'll look for the table that has both a criterion code pattern AND "Voldoet" (results column)
      // This ensures we find the criteria assessment table, not the "niet getoetste criteria" table

      // Search for "Voldoet" text
      const voldoetOccurrence = xmlContent.indexOf('Voldoet');

      if (voldoetOccurrence !== -1) {
        // Find the table containing "Voldoet"
        const tableStart = xmlContent.lastIndexOf('<w:tbl', voldoetOccurrence);
        const tableEnd = xmlContent.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

        if (tableStart !== -1 && tableEnd > tableStart) {
          // Extract table
          const oldTable = xmlContent.substring(tableStart, tableEnd);

          // Verify this table also contains a criterion code pattern (like "1.1.1")
          // This confirms it's the criteria assessment table
          if (!oldTable.match(/\d\.\d\.\d/)) {
            console.log('[DOCX] Table with Voldoet does not contain criterion codes, skipping');
          } else {

          // Find header row
          const headerRowStart = oldTable.indexOf('<w:tr');
          const headerRowEnd = oldTable.indexOf('</w:tr>', headerRowStart) + '</w:tr>'.length;
          const headerRow = oldTable.substring(headerRowStart, headerRowEnd);

          // Find a template row (second row)
          const templateRowStart = oldTable.indexOf('<w:tr', headerRowEnd);
          const templateRowEnd = oldTable.indexOf('</w:tr>', templateRowStart) + '</w:tr>'.length;
          const templateRowXml = oldTable.substring(templateRowStart, templateRowEnd);

          // Extract the criterion code from the template row to know what to replace
          const codeMatch = templateRowXml.match(/<w:t>(\d\.\d\.\d)/);
          const templateCode = codeMatch ? codeMatch[1] : '1.1.1';

          // Extract the criterion name from the template row
          const nameMatch = templateRowXml.match(/<w:t>\d\.\d\.\d ([^<]+)<\/w:t>/);
          const templateName = nameMatch ? nameMatch[1] : 'Niet-tekstuele content';

          console.log(`[DOCX] Using template row with code "${templateCode}" and name "${templateName}"`);

          // Build new table with dynamic rows
          let newTable = oldTable.substring(0, headerRowStart) + headerRow;

          // Generate rows for each criterion
          for (let i = 0; i < criteriaForTable.length; i++) {
            const criterion = criteriaForTable[i];
            let row = templateRowXml;

            // Replace placeholders (using detected template values)
            // Replace the criterion code found in template with actual criterion code
            row = row.replace(new RegExp(templateCode.replace(/\./g, '\\.'), 'g'), criterion.code);
            // Replace the criterion name found in template with actual criterion name
            row = row.replace(new RegExp(templateName.replace(/[()]/g, '\\$&'), 'g'), criterion.name);

            // Replace the level text directly using the exact XML structure
            // The template has "<w:t>A</w:t>" in the level column
            // We replace it with the actual level (A or AA)
            row = row.replace(/<w:t>A<\/w:t>/g, `<w:t>${criterion.level}</w:t>`);

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

            // Mark the first data row (second row overall) as a header row
            // This makes it repeat on each page if the table spans multiple pages
            if (i === 0) {
              // This is the second row (first data row after the header)
              // Add table header property to make it repeat on each page
              const trTagIndex = row.indexOf('<w:tr');
              const trTagEnd = row.indexOf('>', trTagIndex) + 1;

              // Check if there's already a <w:trPr> section
              if (row.includes('<w:trPr>')) {
                // Add tblHeader to existing trPr
                row = row.replace('<w:trPr>', '<w:trPr><w:tblHeader/>');
              } else if (row.includes('<w:trPr/>')) {
                // Replace empty trPr
                row = row.replace('<w:trPr/>', '<w:trPr><w:tblHeader/></w:trPr>');
              } else {
                // Add new trPr section right after the <w:tr> tag
                row = row.substring(0, trTagEnd) + '<w:trPr><w:tblHeader/></w:trPr>' + row.substring(trTagEnd);
              }
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

            // Generate new findings XML with clickable hyperlinks
            const newFindingsXml = generateFindingsSectionXml(findingsData, hyperlinkManager);

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

            // Generate new opmerkingen XML with clickable hyperlinks (use custom intro and result text)
            const newOpmerkingenXml = generateFindingsSectionXml(
              opmerkingenData,
              hyperlinkManager,
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

      // Update scope URLs in Onderzoeksdetails section
      console.log('[DOCX] Updating scope URLs in Onderzoeksdetails section...');
      console.log(`[DOCX] In-scope URLs: ${templateData.scopeUrlsInScope.length}, Out-of-scope URLs: ${templateData.scopeUrlsOutOfScope.length}`);

      // Find "Scope" heading (Kop3) - the existing one in the template
      let scopeHeadingStart = -1;
      let searchPos = 0;

      while ((searchPos = xmlContent.indexOf('>Scope<', searchPos)) !== -1) {
        // Check if this is THE scope heading (Kop3 style) by looking backwards
        const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);
        if (before.includes('pStyle w:val="Kop3"')) {
          // This is the Scope heading in Onderzoeksdetails!
          const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
          const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
          scopeHeadingStart = Math.max(paragraphStart, paragraphStart2);
          console.log('[DOCX] Found "Scope" heading at index', scopeHeadingStart);
          break;
        }
        searchPos++;
      }

      if (scopeHeadingStart !== -1) {
        // Find the end of the Scope heading paragraph
        const scopeHeadingEnd = xmlContent.indexOf('</w:p>', scopeHeadingStart) + '</w:p>'.length;

        // Find the intro text paragraph (the one that starts with "Bij de URL staat...")
        // This is the paragraph right after the Scope heading
        const afterScopeHeading = xmlContent.substring(scopeHeadingEnd);
        const introTextEnd = afterScopeHeading.indexOf('</w:p>') + '</w:p>'.length;
        const scopeIntroEnd = scopeHeadingEnd + introTextEnd;

        console.log('[DOCX] Found Scope intro text, ends at index', scopeIntroEnd);

        // Now find where the Scope section ends (before "Buiten scope" or next Kop3/Kop4 heading)
        const afterIntro = xmlContent.substring(scopeIntroEnd);

        // Look for "Buiten scope" heading OR next Kop3/Kop4 heading
        let scopeSectionEnd = -1;
        const buitenScopeMatch = afterIntro.search(/>Buiten scope</);

        if (buitenScopeMatch !== -1) {
          // Found "Buiten scope" - scope section ends where "Buiten scope" starts
          const beforeBuitenScope = afterIntro.substring(0, buitenScopeMatch);
          const lastPStart = Math.max(
            beforeBuitenScope.lastIndexOf('<w:p '),
            beforeBuitenScope.lastIndexOf('<w:p>')
          );
          scopeSectionEnd = scopeIntroEnd + lastPStart;
        } else {
          // No "Buiten scope" - look for next heading
          const nextHeadingMatch = afterIntro.search(/<w:pStyle w:val="Kop[3-4]"/);
          if (nextHeadingMatch !== -1) {
            const beforeNextHeading = afterIntro.substring(0, nextHeadingMatch);
            const lastPStart = Math.max(
              beforeNextHeading.lastIndexOf('<w:p '),
              beforeNextHeading.lastIndexOf('<w:p>')
            );
            scopeSectionEnd = scopeIntroEnd + lastPStart;
          }
        }

        if (scopeSectionEnd !== -1) {
          console.log('[DOCX] Scope section ends at index', scopeSectionEnd);

          // Extract one URL paragraph as template
          const scopeContent = xmlContent.substring(scopeIntroEnd, scopeSectionEnd);
          const firstHyperlinkMatch = scopeContent.match(/<w:p[^>]*>[\s\S]*?<w:hyperlink[\s\S]*?<\/w:hyperlink>[\s\S]*?<\/w:p>/);

          let urlParagraphTemplate = '';
          if (firstHyperlinkMatch) {
            urlParagraphTemplate = firstHyperlinkMatch[0];
            console.log('[DOCX] Extracted URL paragraph template from Scope section');
          } else {
            // Fallback
            console.log('[DOCX] Could not find URL paragraph template, using fallback');
            urlParagraphTemplate = '<w:p><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>{{URL}}</w:t></w:r></w:p>';
          }

          // Generate new URL paragraphs for in-scope URLs
          let inScopeUrlsXml = '';

          if (templateData.scopeUrlsInScope.length >= 2) {
            // Render as bullet list when there are 2 or more URLs with clickable hyperlinks
            templateData.scopeUrlsInScope.forEach(scopeUrl => {
              const relId = hyperlinkManager.getRelId(scopeUrl.url);
              // Bullet list item with clickable hyperlink, followed by " (URI-basis)"
              inScopeUrlsXml += `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(scopeUrl.url)}</w:t></w:r></w:hyperlink><w:r><w:t xml:space="preserve"> (URI-basis)</w:t></w:r></w:p>`;
            });
          } else if (templateData.scopeUrlsInScope.length === 1) {
            // Single URL - render as regular paragraph with clickable hyperlink
            const scopeUrl = templateData.scopeUrlsInScope[0];
            const relId = hyperlinkManager.getRelId(scopeUrl.url);
            inScopeUrlsXml += `<w:p><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(scopeUrl.url)}</w:t></w:r></w:hyperlink><w:r><w:t xml:space="preserve"> (URI-basis)</w:t></w:r></w:p>`;
          }

          // Replace the URL content (keep heading and intro, replace URLs)
          xmlContent = xmlContent.substring(0, scopeIntroEnd) +
                      inScopeUrlsXml +
                      xmlContent.substring(scopeSectionEnd);

          console.log(`[DOCX] Updated Scope section with ${templateData.scopeUrlsInScope.length} in-scope URLs`);

          // Update the ZIP
          renderedZip.file('word/document.xml', xmlContent);

          // Now handle "Buiten scope" section (if it exists)
          const buitenScopeIndex = xmlContent.indexOf('>Buiten scope<');
          if (buitenScopeIndex !== -1) {
            // Find the actual heading
            let buitenScopeHeadingStart = -1;
            const beforeBuiten = xmlContent.substring(Math.max(0, buitenScopeIndex - 300), buitenScopeIndex);
            if (beforeBuiten.includes('pStyle w:val="Kop')) {
              const paragraphStart = xmlContent.lastIndexOf('<w:p ', buitenScopeIndex);
              const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', buitenScopeIndex);
              buitenScopeHeadingStart = Math.max(paragraphStart, paragraphStart2);
            }

            if (buitenScopeHeadingStart !== -1) {
              if (templateData.scopeUrlsOutOfScope.length === 0) {
                // Remove entire "Buiten scope" section
                console.log('[DOCX] No out-of-scope URLs, removing "Buiten scope" section...');

                // Find the end of "Buiten scope" heading paragraph first
                const buitenHeadingEnd = xmlContent.indexOf('</w:p>', buitenScopeHeadingStart) + '</w:p>'.length;

                // Now search for the NEXT heading AFTER the "Buiten scope" heading
                const afterBuitenHeading = xmlContent.substring(buitenHeadingEnd);
                const nextHeadingMatch = afterBuitenHeading.search(/<w:pStyle w:val="Kop[2-4]"/);

                if (nextHeadingMatch !== -1) {
                  const contentBetween = afterBuitenHeading.substring(0, nextHeadingMatch);
                  const lastPStart = Math.max(
                    contentBetween.lastIndexOf('<w:p '),
                    contentBetween.lastIndexOf('<w:p>')
                  );

                  if (lastPStart !== -1) {
                    const buitenSectionEnd = buitenHeadingEnd + lastPStart;
                    xmlContent = xmlContent.substring(0, buitenScopeHeadingStart) + xmlContent.substring(buitenSectionEnd);
                    console.log('[DOCX] Removed "Buiten scope" section');

                    // Update the ZIP again
                    renderedZip.file('word/document.xml', xmlContent);
                  } else {
                    console.log('[DOCX] Could not find paragraph start before next heading');
                  }
                } else {
                  console.log('[DOCX] Could not find next heading after "Buiten scope"');
                }
              } else {
                // Replace "Buiten scope" URLs
                console.log(`[DOCX] Replacing "Buiten scope" URLs with ${templateData.scopeUrlsOutOfScope.length} out-of-scope URLs...`);

                const buitenHeadingEnd = xmlContent.indexOf('</w:p>', buitenScopeHeadingStart) + '</w:p>'.length;
                const afterBuitenHeading = xmlContent.substring(buitenHeadingEnd);
                const nextHeadingMatch = afterBuitenHeading.search(/<w:pStyle w:val="Kop[2-4]"/);

                if (nextHeadingMatch !== -1) {
                  const contentBetween = afterBuitenHeading.substring(0, nextHeadingMatch);
                  const lastPStart = Math.max(
                    contentBetween.lastIndexOf('<w:p '),
                    contentBetween.lastIndexOf('<w:p>')
                  );

                  if (lastPStart !== -1) {
                    const buitenContentEnd = buitenHeadingEnd + lastPStart;

                    let outOfScopeUrlsXml = '';
                    templateData.scopeUrlsOutOfScope.forEach(scopeUrl => {
                      const urlParagraph = urlParagraphTemplate.replace(/https?:\/\/[^<]+/g, scopeUrl.url);
                      outOfScopeUrlsXml += urlParagraph;
                    });

                    xmlContent = xmlContent.substring(0, buitenHeadingEnd) +
                                outOfScopeUrlsXml +
                                xmlContent.substring(buitenContentEnd);

                    console.log('[DOCX] Replaced "Buiten scope" URLs');

                    // Update the ZIP again
                    renderedZip.file('word/document.xml', xmlContent);
                  }
                }
              }
            }
          }
        } else {
          console.log('[DOCX] Could not determine end of Scope section');
        }
      } else {
        console.log('[DOCX] "Scope" heading not found in template');
      }

      // Update "Volledige steekproef" section with sample items
      console.log('[DOCX] Updating "Volledige steekproef" section...');
      console.log(`[DOCX] Sample items: ${project.sampleItems.length}`);

      // Find "Volledige steekproef" heading (Kop4)
      let steekproefHeadingStart = -1;
      searchPos = 0;

      while ((searchPos = xmlContent.indexOf('Volledige steekproef', searchPos)) !== -1) {
        // Check if this is a heading by looking backwards
        const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);
        if (before.includes('pStyle w:val="Kop')) {
          const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
          const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
          steekproefHeadingStart = Math.max(paragraphStart, paragraphStart2);
          console.log('[DOCX] Found "Volledige steekproef" heading at index', steekproefHeadingStart);
          break;
        }
        searchPos++;
      }

      if (steekproefHeadingStart !== -1) {
        // Add spacing after the "Volledige steekproef" heading
        // Find the heading paragraph
        const steekproefHeadingPEnd = xmlContent.indexOf('</w:p>', steekproefHeadingStart);
        const steekproefHeadingParagraph = xmlContent.substring(steekproefHeadingStart, steekproefHeadingPEnd + '</w:p>'.length);

        // Add spacing before and after the heading (before="480" after="240" = 24pt spacing above, 12pt below)
        let updatedHeading = steekproefHeadingParagraph;

        // Check if there's already a <w:pPr> section
        if (updatedHeading.includes('<w:pPr>')) {
          // Find where to insert spacing - after <w:pStyle> if present, otherwise at start of pPr
          const pStyleEndIndex = updatedHeading.indexOf('</w:pPr>');
          updatedHeading = updatedHeading.substring(0, pStyleEndIndex) +
                          '<w:spacing w:before="480" w:after="240"/>' +
                          updatedHeading.substring(pStyleEndIndex);
        }

        // Replace the heading with the updated version
        xmlContent = xmlContent.substring(0, steekproefHeadingStart) +
                    updatedHeading +
                    xmlContent.substring(steekproefHeadingPEnd + '</w:p>'.length);

        // Find the end of the heading paragraph
        const steekproefHeadingEnd = xmlContent.indexOf('</w:p>', steekproefHeadingStart) + '</w:p>'.length;

        // Find where the section ends (before next Kop3/Kop4 heading)
        const afterSteekproefHeading = xmlContent.substring(steekproefHeadingEnd);
        const nextHeadingMatch = afterSteekproefHeading.search(/<w:pStyle w:val="Kop[3-4]"/);

        if (nextHeadingMatch !== -1) {
          const beforeNextHeading = afterSteekproefHeading.substring(0, nextHeadingMatch);
          const lastPStart = Math.max(
            beforeNextHeading.lastIndexOf('<w:p '),
            beforeNextHeading.lastIndexOf('<w:p>')
          );
          const steekproefSectionEnd = steekproefHeadingEnd + lastPStart;

          console.log('[DOCX] Steekproef section ends at index', steekproefSectionEnd);

          // Extract sample item paragraph templates from the content
          const steekproefContent = xmlContent.substring(steekproefHeadingEnd, steekproefSectionEnd);

          // Find a text paragraph (for title) - look for numbered list paragraph
          const titleParagraphMatch = steekproefContent.match(/<w:p[^>]*>[\s\S]*?<w:numPr>[\s\S]*?<\/w:p>/);

          // Find a hyperlink paragraph (for URL) - look for paragraph with hyperlink
          const urlParagraphMatch = steekproefContent.match(/<w:p[^>]*>(?![\s\S]*<w:numPr>)[\s\S]*?<w:hyperlink[\s\S]*?<\/w:hyperlink>[\s\S]*?<\/w:p>/);

          let titleParagraphTemplate = '';
          let urlParagraphTemplate = '';

          if (titleParagraphMatch) {
            titleParagraphTemplate = titleParagraphMatch[0];
            console.log('[DOCX] Extracted title paragraph template');
          } else {
            console.log('[DOCX] Could not find title paragraph template, using fallback');
            titleParagraphTemplate = '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr></w:pPr><w:r><w:t>{{TITLE}}</w:t></w:r></w:p>';
          }

          if (urlParagraphMatch) {
            urlParagraphTemplate = urlParagraphMatch[0];
            console.log('[DOCX] Extracted URL paragraph template');
          } else {
            console.log('[DOCX] Could not find URL paragraph template, using fallback');
            urlParagraphTemplate = '<w:p><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>{{URL}}</w:t></w:r></w:p>';
          }

          // Generate new paragraphs for all sample items
          let sampleItemsXml = '';
          project.sampleItems.forEach(item => {
            // Create bullet list item with title (bold) and clickable hyperlink URL on new line
            // Use numId="4" for visible bullets (same as scope URLs and findings)
            sampleItemsXml += generateBulletWithTitleAndUrl(item.title, item.url || '', hyperlinkManager);
          });

          // Replace the section content (keep heading, replace items)
          xmlContent = xmlContent.substring(0, steekproefHeadingEnd) +
                      sampleItemsXml +
                      xmlContent.substring(steekproefSectionEnd);

          console.log(`[DOCX] Updated "Volledige steekproef" section with ${project.sampleItems.length} sample items`);

          // Update the ZIP
          renderedZip.file('word/document.xml', xmlContent);
        } else {
          console.log('[DOCX] Could not find end of Volledige steekproef section');
        }
      } else {
        console.log('[DOCX] "Volledige steekproef" heading not found in template');
      }

      // Update numbering.xml to remove visual numbering (no bullets, no numbers) but keep list structure
      console.log('[DOCX] Updating numbering.xml to remove visual numbering for sample items...');
      const numberingXml = renderedZip.file('word/numbering.xml');
      if (numberingXml) {
        let numberingContent = numberingXml.asText();

        // Find abstractNum with abstractNumId="0" (used by numId="3" - sample items)
        // Change the format to "none" so no bullets or numbers are shown
        // This keeps the list structure for indentation but hides the visual marker

        // Find the first <w:lvl w:ilvl="0"> within abstractNumId="0"
        const abstractNum0Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="0"');
        if (abstractNum0Start !== -1) {
          const abstractNum0End = numberingContent.indexOf('</w:abstractNum>', abstractNum0Start);
          const abstractNum0Content = numberingContent.substring(abstractNum0Start, abstractNum0End);

          // Find the first lvl (ilvl="0") within this abstractNum
          const lvl0Start = abstractNum0Content.indexOf('<w:lvl w:ilvl="0">');
          if (lvl0Start !== -1) {
            const lvl0End = abstractNum0Content.indexOf('</w:lvl>', lvl0Start) + '</w:lvl>'.length;
            let lvl0Content = abstractNum0Content.substring(lvl0Start, lvl0End);

            // Replace bullet format with "none" to hide visual numbering
            lvl0Content = lvl0Content.replace('<w:numFmt w:val="bullet"/>', '<w:numFmt w:val="none"/>');

            // Replace lvlText with empty string (no visual marker)
            lvl0Content = lvl0Content.replace(/<w:lvlText w:val="[^"]*"\/>/, '<w:lvlText w:val=""/>');

            // Replace the rFonts (remove Symbol font, use default)
            lvl0Content = lvl0Content.replace(/<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"[^>]*\/>/, '');

            // Remove indentation - set left and hanging to 0
            lvl0Content = lvl0Content.replace(/<w:ind w:left="[^"]*" w:hanging="[^"]*"\/>/, '<w:ind w:left="0" w:hanging="0"/>');
            // Also handle variations
            lvl0Content = lvl0Content.replace(/<w:ind w:left="[^"]*"\/>/, '<w:ind w:left="0"/>');
            lvl0Content = lvl0Content.replace(/<w:ind w:hanging="[^"]*"\/>/, '<w:ind w:hanging="0"/>');

            // Update the abstractNum content
            const updatedAbstractNum0 = abstractNum0Content.substring(0, lvl0Start) + lvl0Content + abstractNum0Content.substring(lvl0End);

            // Update the full numbering content
            numberingContent = numberingContent.substring(0, abstractNum0Start) + updatedAbstractNum0 + numberingContent.substring(abstractNum0End);

            console.log('[DOCX] Updated abstractNum 0 (sample items) to hide visual numbering');
          }
        }

        // Also update abstractNum with abstractNumId="2" (used by numId="4" - technology lists)
        // Update font size to 11pt (22 half-points)
        const abstractNum2Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="2"');
        if (abstractNum2Start !== -1) {
          const abstractNum2End = numberingContent.indexOf('</w:abstractNum>', abstractNum2Start);
          const abstractNum2Content = numberingContent.substring(abstractNum2Start, abstractNum2End);

          // Find the first lvl (ilvl="0") within this abstractNum
          const lvl0Start = abstractNum2Content.indexOf('<w:lvl w:ilvl="0">');
          if (lvl0Start !== -1) {
            const lvl0End = abstractNum2Content.indexOf('</w:lvl>', lvl0Start) + '</w:lvl>'.length;
            let lvl0Content = abstractNum2Content.substring(lvl0Start, lvl0End);

            // Update font size from 20 (10pt) to 22 (11pt) to match browsers
            lvl0Content = lvl0Content.replace(/<w:sz w:val="20"\/>/g, '<w:sz w:val="22"/>');

            // Update the abstractNum content
            const updatedAbstractNum2 = abstractNum2Content.substring(0, lvl0Start) + lvl0Content + abstractNum2Content.substring(lvl0End);

            // Update the full numbering content
            numberingContent = numberingContent.substring(0, abstractNum2Start) + updatedAbstractNum2 + numberingContent.substring(abstractNum2End);

            console.log('[DOCX] Updated abstractNum 2 (technologies) font size to 11pt to match browsers');
          }
        }

        // Also update abstractNum with abstractNumId="1" (used by numId="5" - browser lists)
        // Update font size to 11pt (22 half-points)
        const abstractNum1Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="1"');
        if (abstractNum1Start !== -1) {
          const abstractNum1End = numberingContent.indexOf('</w:abstractNum>', abstractNum1Start);
          const abstractNum1Content = numberingContent.substring(abstractNum1Start, abstractNum1End);

          // Find the first lvl (ilvl="0") within this abstractNum
          const lvl0Start = abstractNum1Content.indexOf('<w:lvl w:ilvl="0">');
          if (lvl0Start !== -1) {
            const lvl0End = abstractNum1Content.indexOf('</w:lvl>', lvl0Start) + '</w:lvl>'.length;
            let lvl0Content = abstractNum1Content.substring(lvl0Start, lvl0End);

            // Update font size from 20 (10pt) to 22 (11pt) to match browsers and technologies
            lvl0Content = lvl0Content.replace(/<w:sz w:val="20"\/>/g, '<w:sz w:val="22"/>');

            // Update the abstractNum content
            const updatedAbstractNum1 = abstractNum1Content.substring(0, lvl0Start) + lvl0Content + abstractNum1Content.substring(lvl0End);

            // Update the full numbering content
            numberingContent = numberingContent.substring(0, abstractNum1Start) + updatedAbstractNum1 + numberingContent.substring(abstractNum1End);

            console.log('[DOCX] Updated abstractNum 1 (browsers) font size to 11pt to match browsers and technologies');
          }
        }

        // Update the ZIP
        renderedZip.file('word/numbering.xml', numberingContent);

        console.log('[DOCX] Updated numbering.xml');
      } else {
        console.log('[DOCX] numbering.xml not found');
      }

      // Update browser versions (userAgents) section
      console.log('[DOCX] Replacing hardcoded browser versions with database values...');

      // Find the intro text "Het onderzoek is uitgevoerd met:"
      const browserIntroText = 'Het onderzoek is uitgevoerd met:';
      const browserIntroIndex = xmlContent.indexOf(browserIntroText);

      if (browserIntroIndex !== -1) {
        // Find the paragraph containing this text
        const introParagraphStart = xmlContent.lastIndexOf('<w:p ', browserIntroIndex);
        const introParagraphEnd = xmlContent.indexOf('</w:p>', browserIntroIndex) + '</w:p>'.length;

        // After this paragraph, find the next set of list items (browsers)
        // Look for the first browser "Google Chrome 145"
        const firstBrowserIndex = xmlContent.indexOf('Google Chrome 145', introParagraphEnd);

        if (firstBrowserIndex !== -1) {
          // Find where this browser list starts
          const browserListStart = xmlContent.lastIndexOf('<w:p ', firstBrowserIndex);

          // Find where the browser list ends - look for the next heading or section
          // The browsers are in a numbered list (numId="4"), so find where that list ends
          // We'll look for the next paragraph that doesn't have numId="4"
          let browserListEnd = firstBrowserIndex;
          let searchPos = browserListEnd;

          // Find all consecutive paragraphs with numId="4"
          while (true) {
            const nextPEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;
            const nextPStart = xmlContent.indexOf('<w:p ', nextPEnd);

            if (nextPStart === -1) break;

            // Check if this paragraph has numId="4"
            const nextPContent = xmlContent.substring(nextPStart, nextPStart + 500);
            if (nextPContent.includes('<w:numId w:val="4"/>')) {
              // This is still part of the browser list
              browserListEnd = xmlContent.indexOf('</w:p>', nextPStart) + '</w:p>'.length;
              searchPos = browserListEnd;
            } else {
              // This is not part of the browser list, we've reached the end
              break;
            }
          }

          // Extract a template paragraph from the existing browser list
          const templateParagraphEnd = xmlContent.indexOf('</w:p>', firstBrowserIndex) + '</w:p>'.length;
          const templateParagraph = xmlContent.substring(browserListStart, templateParagraphEnd);

          // Extract paragraph properties and formatting
          const pPrMatch = templateParagraph.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
          const pPr = pPrMatch ? pPrMatch[0] : '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr>';

          // Extract run properties if any
          const rPrMatch = templateParagraph.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
          const rPr = rPrMatch ? rPrMatch[0] : '';

          // Build new paragraphs from database userAgents
          // First, strip HTML tags from userAgents
          const cleanedUserAgents = templateData.userAgents
            .replace(/<ul>/gi, '')
            .replace(/<\/ul>/gi, '')
            .replace(/<li>/gi, '')
            .replace(/<\/li>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .trim();

          const userAgentLines = cleanedUserAgents.split('\n').filter(line => line.trim().length > 0);
          const newBrowserParagraphs = userAgentLines.map(line => {
            const escapedLine = line.trim()
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');

            // Add 12pt (24 half-points) font size to run properties
            return `<w:p>${pPr}<w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapedLine}</w:t></w:r></w:p>`;
          }).join('\n');

          // Replace the old browser list with new paragraphs
          xmlContent = xmlContent.substring(0, browserListStart) + newBrowserParagraphs + xmlContent.substring(browserListEnd);

          // Update the ZIP
          renderedZip.file('word/document.xml', xmlContent);

          console.log(`[DOCX] Replaced browser versions with ${userAgentLines.length} entries from database`);
        } else {
          console.log('[DOCX] Could not find hardcoded browser versions to replace');
        }
      } else {
        console.log('[DOCX] Browser intro text not found');
      }

      // Update technologies (DOM, HTML, CSS) section
      console.log('[DOCX] Replacing hardcoded technologies with database values...');

      // Find "Technologieën" Kop3 heading (NOT "Onderzoeksmethode en technieken")
      let techHeadingStart = -1;
      let techSearchPos = 0;

      while ((techSearchPos = xmlContent.indexOf('>Technologieën<', techSearchPos)) !== -1) {
        // Check if this is a Kop3 heading
        const before = xmlContent.substring(Math.max(0, techSearchPos - 300), techSearchPos);
        if (before.includes('pStyle w:val="Kop3"')) {
          const paragraphStart = xmlContent.lastIndexOf('<w:p ', techSearchPos);
          const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', techSearchPos);
          techHeadingStart = Math.max(paragraphStart, paragraphStart2);
          console.log('[DOCX] Found "Technologieën" heading at index', techHeadingStart);
          break;
        }
        techSearchPos++;
      }

      if (techHeadingStart !== -1) {
        // Find the end of the heading paragraph
        const techHeadingEnd = xmlContent.indexOf('</w:p>', techHeadingStart) + '</w:p>'.length;

        // Find where the Technologieën section ends (before next Kop2/Kop3/section heading)
        const afterTechHeading = xmlContent.substring(techHeadingEnd);
        const nextHeadingMatch = afterTechHeading.search(/<w:pStyle w:val="Kop[2-3]"/);

        if (nextHeadingMatch !== -1) {
          const beforeNextHeading = afterTechHeading.substring(0, nextHeadingMatch);
          const lastPStart = Math.max(
            beforeNextHeading.lastIndexOf('<w:p '),
            beforeNextHeading.lastIndexOf('<w:p>')
          );
          const techSectionEnd = techHeadingEnd + lastPStart;

          console.log('[DOCX] Technologieën section ends at index', techSectionEnd);

          // Extract the section content
          const techContent = xmlContent.substring(techHeadingEnd, techSectionEnd);

          // Find the FIRST paragraph with numId="5" (or numId="4") in this section
          const firstNumIdMatch = techContent.match(/<w:p[^>]*>[\s\S]*?<w:numPr>[\s\S]*?<w:numId w:val="(\d+)"[\s\S]*?<\/w:p>/);

          if (firstNumIdMatch) {
            const firstParagraphStart = techHeadingEnd + techContent.indexOf(firstNumIdMatch[0]);
            const firstParagraphEnd = firstParagraphStart + firstNumIdMatch[0].length;
            const templateParagraph = xmlContent.substring(firstParagraphStart, firstParagraphEnd);

            // Extract paragraph properties and formatting
            const pPrMatch = templateParagraph.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
            const pPr = pPrMatch ? pPrMatch[0] : '';

            // Build new paragraphs from database technologies
            // Remove duplicates and filter empty lines
            console.log('[DOCX DEBUG] Raw technologies:', templateData.technologies);
            const techLines = Array.from(new Set(
              templateData.technologies.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
            ));
            console.log('[DOCX DEBUG] Unique tech lines after dedup:', techLines);

            const newTechParagraphs = techLines.map(line => {
              const escapedLine = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');

              // Create paragraph properties with bullet list formatting (numId="4")
              const cleanPPr = '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr>';

              // Add run properties with font size: 24 half-points (12pt) to match browsers
              // NOTE: DO NOT specify font family - let it inherit from default
              const rPr = '<w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>';

              return `<w:p>${cleanPPr}<w:r>${rPr}<w:t xml:space="preserve">${escapedLine}</w:t></w:r></w:p>`;
            }).join('\n');

            // Replace ENTIRE section content (from after heading to before next heading) with new paragraphs
            xmlContent = xmlContent.substring(0, techHeadingEnd) + newTechParagraphs + xmlContent.substring(techSectionEnd);

            // Update the ZIP
            renderedZip.file('word/document.xml', xmlContent);

            console.log(`[DOCX] Replaced technologies with ${techLines.length} entries from database`);
          } else {
            console.log('[DOCX] Could not find technology list paragraphs');
          }
        } else {
          console.log('[DOCX] Could not find end of Technologieën section');
        }
      } else {
        console.log('[DOCX] "Technologieën" heading not found');
      }

      // Now update the TOC (Table of Contents) with fixed entries
      console.log('[DOCX] Updating table of contents with fixed entries...');

      // Find the TOC section (after "Inhoud" heading)
      const inhoudHeadingIndex = xmlContent.indexOf('Inhoud</w:t>');
      if (inhoudHeadingIndex !== -1) {
        // Find the SDT content area after "Inhoud"
        const sdtContentStart = xmlContent.indexOf('<w:sdtContent>', inhoudHeadingIndex);
        const sdtContentEnd = xmlContent.indexOf('</w:sdtContent>', sdtContentStart);

        if (sdtContentStart !== -1 && sdtContentEnd !== -1) {
          // Generate TOC entries (fixed list)
          const tocXml = generateTocXml(defaultFormulierenTocEntries);

          // Replace the SDT content
          xmlContent = xmlContent.substring(0, sdtContentStart + '<w:sdtContent>'.length) +
            tocXml +
            xmlContent.substring(sdtContentEnd);

          // Update the ZIP
          renderedZip.file('word/document.xml', xmlContent);

          console.log(`[DOCX] Updated TOC with ${defaultFormulierenTocEntries.length} fixed entries`);
        } else {
          console.log('[DOCX] Could not find TOC SDT content area');
        }
      } else {
        console.log('[DOCX] Inhoud heading not found');
      }
    }

    // Update hyperlink relationships with actual URLs
    console.log('[DOCX] Updating hyperlink relationships with actual project URLs...');
    const relsFile = renderedZip.file('word/_rels/document.xml.rels');
    if (relsFile) {
      let relsContent = relsFile.asText();

      // Replace {website_url} with actual website URL (add https://www. for hyperlinks)
      let websiteUrlWithProtocol = templateData.websiteUrl;
      if (websiteUrlWithProtocol && !websiteUrlWithProtocol.startsWith('http://') && !websiteUrlWithProtocol.startsWith('https://')) {
        websiteUrlWithProtocol = 'https://www.' + websiteUrlWithProtocol;
      }
      relsContent = relsContent.replace(/{website_url}/g, websiteUrlWithProtocol);

      // Replace {scope_url_1}, {scope_url_2}, {scope_url_3} with actual scope URLs
      templateData.scopeUrlsInScope.forEach((scopeUrl, index) => {
        const placeholder = `{scope_url_${index + 1}}`;
        relsContent = relsContent.replace(new RegExp(placeholder, 'g'), scopeUrl.url);
      });

      // Insert all hyperlink relationships tracked by HyperlinkManager
      console.log('[DOCX] Inserting hyperlink relationships from HyperlinkManager...');
      const newRelationships = hyperlinkManager.generateRelationshipXml();
      const relationshipsCount = hyperlinkManager.getRelationships().length;

      if (relationshipsCount > 0) {
        // Insert before closing </Relationships> tag
        const closingTag = '</Relationships>';
        const insertPosition = relsContent.lastIndexOf(closingTag);

        if (insertPosition !== -1) {
          relsContent = relsContent.substring(0, insertPosition) +
                        newRelationships +
                        relsContent.substring(insertPosition);

          console.log(`[DOCX] Inserted ${relationshipsCount} hyperlink relationships`);
        } else {
          console.error('[DOCX] Could not find closing </Relationships> tag');
        }
      }

      // Update the relationships file
      renderedZip.file('word/_rels/document.xml.rels', relsContent);

      console.log(`[DOCX] Updated ${templateData.scopeUrlsInScope.length + 1} placeholder relationships + ${relationshipsCount} new hyperlinks`);
    } else {
      console.log('[DOCX] Could not find relationships file');
    }

    // Update document metadata (title, subject, etc.)
    console.log('[DOCX] Updating document metadata...');
    const corePropsFile = renderedZip.file('docProps/core.xml');
    if (corePropsFile) {
      let corePropsContent = corePropsFile.asText();

      // Create dynamic title based on project info
      const documentTitle = `Toegankelijkheidsonderzoek ${project.researchType} - ${project.subject || project.title}`;

      // Replace title
      corePropsContent = corePropsContent.replace(
        /<dc:title>.*?<\/dc:title>/,
        `<dc:title>${escapeXml(documentTitle)}</dc:title>`
      );

      // Replace subject
      corePropsContent = corePropsContent.replace(
        /<dc:subject>.*?<\/dc:subject>/,
        `<dc:subject>${escapeXml(project.subject || project.title)}</dc:subject>`
      );

      // Update creator/author
      corePropsContent = corePropsContent.replace(
        /<dc:creator>.*?<\/dc:creator>/,
        `<dc:creator>${escapeXml(project.researcherName || 'Shift2')}</dc:creator>`
      );

      // Update last modified by
      corePropsContent = corePropsContent.replace(
        /<cp:lastModifiedBy>.*?<\/cp:lastModifiedBy>/,
        `<cp:lastModifiedBy>${escapeXml(project.researcherName || 'Shift2')}</cp:lastModifiedBy>`
      );

      // Update the core properties
      renderedZip.file('docProps/core.xml', corePropsContent);

      console.log(`[DOCX] Updated document metadata with title: "${documentTitle}"`);
    } else {
      console.log('[DOCX] Could not find core.xml for metadata update');
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
    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(docxBuffer), {
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