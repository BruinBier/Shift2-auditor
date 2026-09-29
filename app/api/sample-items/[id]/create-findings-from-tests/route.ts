import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { typeVoorImpact } from '@/lib/finding-classification';
import { createFindingWithCode } from '@/lib/finding-code';
import { herberekenCriteriumOordelen } from '@/lib/criterion-assessment';

interface CreateFindingsRequest {
  testIds: string[];
}

/**
 * POST /api/sample-items/[id]/create-findings-from-tests
 * Creates findings from crawler test results for a sample item, with the text of
 * the matching QuickFinding. The GPT-4o-mini option was removed on 2026-09-28: it
 * ignored the writing rules.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sampleItemId = params.id;
    const body: CreateFindingsRequest = await request.json();
    const { testIds } = body;

    if (!testIds || testIds.length === 0) {
      return NextResponse.json(
        { error: 'testIds are required' },
        { status: 400 }
      );
    }

    // Get the sample item with project info
    const sampleItem = await prisma.sampleItem.findUnique({
      where: { id: sampleItemId },
      include: {
        crawlerResults: {
          where: {
            testId: { in: testIds },
            found: true, // Only create findings for positive test results
          },
        },
        project: true,
      },
    });

    if (!sampleItem) {
      return NextResponse.json(
        { error: 'Sample item not found' },
        { status: 404 }
      );
    }

    const projectId = sampleItem.projectId;
    const createdFindings = [];
    // Deze lus maakt bevindingen aan onder verschillende criteria; die worden na
    // afloop in één keer herberekend. Ook deze route liet het oordeel eerder staan.
    const geraakteCriteria = new Set<string>();
    const errors = [];

    console.log(`[CREATE-FINDINGS] Processing ${sampleItem.crawlerResults.length} test results`);

    // Process each test result
    for (const result of sampleItem.crawlerResults) {
      try {
        console.log(`[CREATE-FINDINGS] Processing test: ${result.testName} (${result.testId})`);
        let description = '';
        let advice = '';
        let impact = 'onbekend';
        let responsibility = 'onbekend';
        let quickFindingId: string | undefined = undefined;
        let wcagCriterionId: string | undefined = undefined;

        // Try to get QuickFinding for this test
        const quickFinding = await prisma.quickFinding.findFirst({
          where: { crawlerTestId: result.testId },
        });

        // Use QuickFinding template
        if (!quickFinding) {
          errors.push({
            testId: result.testId,
            testName: result.testName,
            error: 'No QuickFinding template found',
          });
          continue;
        }

        description = quickFinding.description;
        advice = quickFinding.advice;
        impact = quickFinding.impact || 'onbekend';
        responsibility = quickFinding.responsibility || 'onbekend';
        quickFindingId = quickFinding.id;

        // Get WCAG criterion
        const wcagCriterion = await prisma.wCAGCriterion.findUnique({
          where: { code: quickFinding.criterionCode },
        });

        if (!wcagCriterion) {
          errors.push({
            testId: result.testId,
            testName: result.testName,
            error: `WCAG criterion ${quickFinding.criterionCode} not found`,
          });
          continue;
        }

        wcagCriterionId = wcagCriterion.id;

        if (!wcagCriterionId) {
          // If we still don't have a criterion, skip this test
          errors.push({
            testId: result.testId,
            testName: result.testName,
            error: 'No WCAG criterion found',
          });
          continue;
        }

        // Get the highest sort order
        const lastFinding = await prisma.finding.findFirst({
          where: { projectId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        });
        const sortOrder = (lastFinding?.sortOrder || 0) + 1;

        // Create the Finding with FindingOccurrence
        // De code wordt binnen de transactie toegekend. Deze route gebruikte
        // een afwijkend formaat (KENMERK-v-F###); nu overal B### zoals de
        // andere aanmaakroutes.
        const finding = await createFindingWithCode(projectId, (findingCode) => ({
          data: {
            projectId,
            findingCode,
            wcagCriterionId,
            status: 'open',
            type: typeVoorImpact(impact),
            impact: impact as any,
            responsibility: responsibility as any,
            description,
            advice,
            sortOrder,
            occurrences: {
              create: {
                sampleItemId: sampleItemId,
              },
            },
          },
          include: {
            wcagCriterion: true,
            occurrences: {
              include: {
                sampleItem: true,
              },
            },
          },
        }));

        createdFindings.push({
          findingCode: finding.findingCode,
          testName: result.testName,
          id: finding.id,
        });
        geraakteCriteria.add(wcagCriterionId);

      } catch (error) {
        console.error(`[CREATE-FINDINGS] Error creating finding for test ${result.testId}:`, error);
        errors.push({
          testId: result.testId,
          testName: result.testName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await herberekenCriteriumOordelen(projectId, Array.from(geraakteCriteria));

    console.log(`[CREATE-FINDINGS] Completed: ${createdFindings.length} findings created, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      created: createdFindings.length,
      findings: createdFindings,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdFindings.length} bevindingen aangemaakt${errors.length > 0 ? `, ${errors.length} fouten` : ''}`,
    });

  } catch (error) {
    console.error('Error creating findings from tests:', error);
    return NextResponse.json(
      {
        error: 'Failed to create findings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
