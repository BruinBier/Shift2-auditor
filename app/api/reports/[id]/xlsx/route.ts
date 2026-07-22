import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { groupFindingsByHierarchy } from '@/lib/report-calculations';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('[XLSX] Starting Excel export for project:', id);

    // Fetch project with all necessary relations
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
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
        sampleItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch research type data separately
    let researchTypeData = null;
    if (project.researchType) {
      researchTypeData = await prisma.researchType.findUnique({
        where: { name: project.researchType },
      });
    }

    // Group findings by hierarchy (same as report page)
    const groupedFindings = await groupFindingsByHierarchy(project as any);

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Helper function to strip HTML tags
    const stripHtml = (html: string | null) => {
      if (!html) return '';
      return html
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    };

    // Map impact to Dutch
    const impactMap: Record<string, string> = {
      klein: 'Klein',
      matig: 'Matig',
      serieus: 'Serieus',
      kritiek: 'Kritiek',
      onbekend: 'Onbekend',
    };

    // Extract ONLY open findings from grouped data with their index within each criterion
    const openFindings: Array<{finding: any, criterionCode: string, indexInCriterion: number}> = [];
    const remarks: Array<{finding: any, criterionCode: string, indexInCriterion: number}> = [];

    groupedFindings.forEach((principle: any) => {
      principle.guidelines.forEach((guideline: any) => {
        guideline.criteria.forEach((criterion: any) => {
          // Use findings as-is (already sorted by createdAt desc from database query)
          const findings = criterion.findings;

          // Splitsing bevinding vs opmerking op basis van impact (niet status):
          //   impact gezet + open      -> echte bevinding
          //   impact leeg              -> opmerking (ongeacht status; opmerkingen
          //                               worden bewust met status 'resolved' opgeslagen)
          //   impact gezet + resolved  -> opgeloste afkeuring, uit rapport
          const openFindingsInCriterion = findings.filter(
            (f: any) => f.impact != null && f.status === 'open'
          );
          openFindingsInCriterion.forEach((finding: any, index: number) => {
            openFindings.push({
              finding,
              criterionCode: criterion.code,
              indexInCriterion: index + 1 // 1-based index like on report page
            });
          });

          const remarksInCriterion = findings.filter(
            (f: any) => f.impact == null
          );
          remarksInCriterion.forEach((finding: any, index: number) => {
            remarks.push({
              finding,
              criterionCode: criterion.code,
              indexInCriterion: index + 1
            });
          });
        });
      });
    });

    // Sheet 1: Bevindingen (Only findings with status 'open')
    const findingsSheet = workbook.addWorksheet('Bevindingen');

    // Define columns for findings
    findingsSheet.columns = [
      { header: 'WCAG Criterium', key: 'criterion', width: 30 },
      { header: 'Bevinding', key: 'code', width: 12 },
      { header: 'Url', key: 'urls', width: 60 },
      { header: 'Beschrijving', key: 'description', width: 50 },
      { header: 'Impact', key: 'impact', width: 15 },
      { header: 'Advies', key: 'advice', width: 50 },
      { header: 'Datum bevinding opgelost', key: 'dateResolved', width: 25 },
      { header: 'Opmerkingen', key: 'remarks', width: 40 },
      { header: 'Genomen maatregelen', key: 'actions', width: 40 },
    ];

    // Style the header row
    findingsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    findingsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF290047' }, // Shift2 purple
    };

    // Determine if this is a "website" template (no "Stap X" prefix) or "formulieren" template (with "Stap X" prefix)
    const isWebsiteTemplate = researchTypeData?.type === 'website';

    // Add open findings data with per-criterion numbering from report page
    for (const item of openFindings) {
      const finding = item.finding;
      const criterionCode = item.criterionCode;
      const findingNumber = item.indexInCriterion;

      // Format URLs based on template type
      const formattedUrls = finding.occurrences
        .map((occ: any, idx: number) => {
          const title = occ.sampleItem?.title || 'Onbekend';
          const url = occ.sampleItem?.url || '';

          if (isWebsiteTemplate) {
            // Website template: just show title and URL (no "Stap X" prefix)
            return url ? `${title}\n${url}` : title;
          } else {
            // Formulieren template: add "Stap X" prefix if not already present
            const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
            return url ? `${formattedTitle}\n${url}` : formattedTitle;
          }
        })
        .join('\n\n');

      const row = findingsSheet.addRow({
        code: `Bevinding ${findingNumber} (SC ${criterionCode})`,
        criterion: `${criterionCode} ${finding.wcagCriterion.titleNl}`,
        description: stripHtml(finding.description),
        impact: impactMap[finding.impact] || finding.impact,
        urls: formattedUrls,
        advice: stripHtml(finding.advice),
        dateResolved: '', // Empty for manual input
        remarks: '', // Empty for manual input
        actions: '', // Empty for manual input
      });

      // Make URLs clickable hyperlinks with blue underlined style for both templates
      const urlCell = row.getCell('urls');
      const richText: any[] = [];

      finding.occurrences.forEach((occ: any, idx: number) => {
        const title = occ.sampleItem?.title || 'Onbekend';
        const url = occ.sampleItem?.url || '';

        if (url) {
          // Add title as plain text (with "Stap X" prefix for formulieren template)
          if (idx > 0) richText.push({ text: '\n\n' });

          if (isWebsiteTemplate) {
            richText.push({ text: title + '\n' });
          } else {
            // Formulieren template: add "Stap X" prefix if not already present
            const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
            richText.push({ text: formattedTitle + '\n' });
          }

          // Add URL as hyperlink with blue underlined style
          richText.push({
            text: url,
            hyperlink: url,
            font: { color: { argb: 'FF0563C1' }, underline: true }
          });
        } else {
          if (idx > 0) richText.push({ text: '\n\n' });
          if (isWebsiteTemplate) {
            richText.push({ text: title });
          } else {
            const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
            richText.push({ text: formattedTitle });
          }
        }
      });

      if (richText.length > 0) {
        urlCell.value = { richText };
      }
    }

    // Enable text wrapping for all cells
    findingsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { wrapText: true, vertical: 'top' };
        });
      }
    });

    // Sheet 2: Opmerkingen (Findings with status !== 'open')
    const remarksSheet = workbook.addWorksheet('Opmerkingen');

    // Define columns for remarks (same as findings sheet)
    remarksSheet.columns = [
      { header: 'WCAG Criterium', key: 'criterion', width: 30 },
      { header: 'Opmerking', key: 'code', width: 12 },
      { header: 'Beschrijving', key: 'description', width: 50 },
      { header: 'Impact', key: 'impact', width: 15 },
      { header: 'Url', key: 'urls', width: 60 },
      { header: 'Advies', key: 'advice', width: 50 },
    ];

    // Style the header row
    remarksSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    remarksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF290047' },
    };

    // Add remarks data with same format as findings
    for (const item of remarks) {
      const remark = item.finding;
      const criterionCode = item.criterionCode;
      const remarkNumber = item.indexInCriterion;

      // Format URLs based on template type (same as findings above)
      const formattedUrls = remark.occurrences
        .map((occ: any, idx: number) => {
          const title = occ.sampleItem?.title || 'Onbekend';
          const url = occ.sampleItem?.url || '';

          if (isWebsiteTemplate) {
            // Website template: just show title and URL (no "Stap X" prefix)
            return url ? `${title}\n${url}` : title;
          } else {
            // Formulieren template: add "Stap X" prefix if not already present
            const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
            return url ? `${formattedTitle}\n${url}` : formattedTitle;
          }
        })
        .join('\n\n');

      const row = remarksSheet.addRow({
        code: `Opmerking ${remarkNumber} (SC ${criterionCode})`,
        criterion: `${criterionCode} ${remark.wcagCriterion.titleNl}`,
        description: stripHtml(remark.description),
        impact: impactMap[remark.impact] || remark.impact,
        urls: formattedUrls,
        advice: stripHtml(remark.advice),
      });

      // Make URLs clickable hyperlinks with blue underlined style for both templates
      const urlCell = row.getCell('urls');
      const richText: any[] = [];

      remark.occurrences.forEach((occ: any, idx: number) => {
        const title = occ.sampleItem?.title || 'Onbekend';
        const url = occ.sampleItem?.url || '';

        if (url) {
          // Add title as plain text (with "Stap X" prefix for formulieren template)
          if (idx > 0) richText.push({ text: '\n\n' });

          if (isWebsiteTemplate) {
            richText.push({ text: title + '\n' });
          } else {
            // Formulieren template: add "Stap X" prefix if not already present
            const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
            richText.push({ text: formattedTitle + '\n' });
          }

          // Add URL as hyperlink with blue underlined style
          richText.push({
            text: url,
            hyperlink: url,
            font: { color: { argb: 'FF0563C1' }, underline: true }
          });
        } else {
          if (idx > 0) richText.push({ text: '\n\n' });
          if (isWebsiteTemplate) {
            richText.push({ text: title });
          } else {
            const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
            richText.push({ text: formattedTitle });
          }
        }
      });

      if (richText.length > 0) {
        urlCell.value = { richText };
      }
    }

    // Enable text wrapping for remarks
    remarksSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { wrapText: true, vertical: 'top' };
        });
      }
    });

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Create filename in format: "Bevindingen-{site}-{fase}-v{version}.xlsx"
    // - site: hostname uit de meest voorkomende sample-URL (bv. "ijsselstein.nl")
    // - fase: "nulmeting" bij v1.0, "herinspectie" bij v > 1
    // - fallback op project.kenmerk/subject als er geen sample-URL beschikbaar is
    const versionNum = Number(project.version || 1);
    const versionStr = versionNum.toFixed(1);
    const phaseLabel = versionNum > 1 ? 'herinspectie' : 'nulmeting';

    let siteLabel = '';
    const hostCounts = new Map<string, number>();
    for (const s of project.sampleItems || []) {
      if (!s.url) continue;
      try {
        const host = new URL(s.url).hostname.replace(/^www\./, '');
        hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
      } catch {}
    }
    if (hostCounts.size > 0) {
      siteLabel = [...hostCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    if (!siteLabel) siteLabel = project.subject || project.kenmerk || 'project';

    const filename = `Bevindingen-${siteLabel}-${phaseLabel}-v${versionStr}.xlsx`;

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[XLSX] Error generating Excel:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}