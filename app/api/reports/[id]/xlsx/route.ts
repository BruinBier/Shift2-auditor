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

          // Filter for open findings only and number them
          const openFindingsInCriterion = findings.filter((f: any) => f.status === 'open');
          openFindingsInCriterion.forEach((finding: any, index: number) => {
            openFindings.push({
              finding,
              criterionCode: criterion.code,
              indexInCriterion: index + 1 // 1-based index like on report page
            });
          });

          // Filter for remarks (not open) and number them
          const remarksInCriterion = findings.filter((f: any) => f.status !== 'open');
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

    // Add open findings data with per-criterion numbering from report page
    for (const item of openFindings) {
      const finding = item.finding;
      const criterionCode = item.criterionCode;
      const findingNumber = item.indexInCriterion;

      // Format URLs as "Stap X - Title\nURL" (or just "Title\nURL" if title already starts with "Stap")
      const formattedUrls = finding.occurrences
        .map((occ: any, idx: number) => {
          const title = occ.sampleItem?.title || 'Onbekend';
          const url = occ.sampleItem?.url || '';
          // Check if title already starts with "Stap"
          const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
          return url ? `${formattedTitle}\n${url}` : formattedTitle;
        })
        .join('\n\n');

      findingsSheet.addRow({
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

      // Format URLs as "Stap X - Title\nURL" (or just "Title\nURL" if title already starts with "Stap")
      const formattedUrls = remark.occurrences
        .map((occ: any, idx: number) => {
          const title = occ.sampleItem?.title || 'Onbekend';
          const url = occ.sampleItem?.url || '';
          // Check if title already starts with "Stap"
          const formattedTitle = title.toLowerCase().startsWith('stap') ? title : `Stap ${idx + 1} - ${title}`;
          return url ? `${formattedTitle}\n${url}` : formattedTitle;
        })
        .join('\n\n');

      remarksSheet.addRow({
        code: `Opmerking ${remarkNumber} (SC ${criterionCode})`,
        criterion: `${criterionCode} ${remark.wcagCriterion.titleNl}`,
        description: stripHtml(remark.description),
        impact: impactMap[remark.impact] || remark.impact,
        urls: formattedUrls,
        advice: stripHtml(remark.advice),
      });
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

    // Create filename
    const projectName = project.subject || project.kenmerk || 'project';
    const filename = `Bevindingen toegankelijkheidsonderzoek ${projectName}.xlsx`;

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