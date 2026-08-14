import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { typeVoorImpact } from '@/lib/finding-classification';
import { createFindingWithCode } from '@/lib/finding-code';
import { herberekenCriteriumOordelen } from '@/lib/criterion-assessment';

const prisma = new PrismaClient();

/**
 * Automatically creates draft findings for all crawler test results
 * that have QuickFinding templates and were found on this scope URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    const { id: projectId, urlId: scopeUrlId } = params;

    // Get all crawler results for this URL that found issues
    const crawlerResults = await prisma.crawlerResult.findMany({
      where: {
        scopeUrlId,
        found: true,
      },
    });

    if (crawlerResults.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Geen issues gevonden op deze pagina',
        findingsCreated: 0,
      });
    }

    // Get QuickFindings for these test IDs
    const testIds = crawlerResults.map(r => r.testId);
    const quickFindings = await prisma.quickFinding.findMany({
      where: {
        crawlerTestId: {
          in: testIds,
        },
      },
    });

    if (quickFindings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Geen bevinding templates gevonden voor deze tests',
        findingsCreated: 0,
      });
    }

    // Check which findings already exist for this project
    // Note: quickFindingId field doesn't exist in schema, so we can't filter by it
    const existingFindings = await prisma.finding.findMany({
      where: {
        projectId,
        // TODO: Add quickFindingId to schema to enable this filter
        // quickFindingId: {
        //   in: quickFindings.map(qf => qf.id),
        // },
      },
      include: {
        affectedUrls: {
          where: {
            scopeUrlId,
          },
        },
      },
    });

    const createdFindings: string[] = [];
    const updatedFindings: string[] = [];
    // De lus maakt bevindingen aan onder verschillende criteria; die worden na
    // afloop in één keer herberekend.
    const geraakteCriteria = new Set<string>();

    for (const quickFinding of quickFindings) {
      // Check if finding already exists for this QuickFinding
      // Note: Since quickFindingId doesn't exist, we can't match findings properly
      // This will create duplicate findings for now until schema is updated
      const existingFinding = null; // TODO: Re-enable when quickFindingId is added to schema

      if (existingFinding) {
        // TODO: Re-enable this block when quickFindingId is added to schema
        // // Check if this scopeUrl is already linked
        // const hasUrl = existingFinding.affectedUrls.some(au => au.scopeUrlId === scopeUrlId);
        //
        // if (!hasUrl) {
        //   // Add the URL to the existing finding
        //   await prisma.findingUrl.create({
        //     data: {
        //       findingId: existingFinding.id,
        //       scopeUrlId,
        //     },
        //   });
        //   updatedFindings.push(existingFinding.findingCode);
        // }
      } else {
        // Get the WCAG criterion
        const wcagCriterion = await prisma.wCAGCriterion.findUnique({
          where: { code: quickFinding.criterionCode },
        });

        if (!wcagCriterion) {
          console.warn(`WCAG criterion ${quickFinding.criterionCode} not found, skipping`);
          continue;
        }

        // Get the highest sort order
        const lastFinding = await prisma.finding.findFirst({
          where: { projectId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        });
        const sortOrder = (lastFinding?.sortOrder || 0) + 1;

        // Get crawler result details for this test
        const crawlerResult = crawlerResults.find(cr => cr.testId === quickFinding.crawlerTestId);
        let enhancedDescription = quickFinding.description;

        // Add specific details from crawler test to description
        if (crawlerResult && crawlerResult.details) {
          try {
            const details = JSON.parse(crawlerResult.details);

            // For PageContainsMultipleSameLinksTest (testId: 6)
            if (quickFinding.crawlerTestId === '6' && details.issues && details.issues.length > 0) {
              enhancedDescription += '\n\n**Gevonden op deze pagina:**\n\n';

              details.issues.forEach((issue: any, index: number) => {
                enhancedDescription += `${index + 1}. URL: \`${issue.url}\`\n`;
                enhancedDescription += `   - Verschillende teksten: ${issue.uniqueTexts.map((t: string) => `"${t}"`).join(', ')}\n`;

                // Add context breakdown
                if (issue.contexts) {
                  const contextEntries = Object.entries(issue.contexts);
                  contextEntries.forEach(([context, texts]: [string, any]) => {
                    const textList = texts.map((t: any) => `"${t.text}" (${t.count}×)`).join(', ');
                    enhancedDescription += `   - ${context}: ${textList}\n`;
                  });
                }
                enhancedDescription += '\n';
              });
            }
          } catch (e) {
            console.error('Failed to parse crawler result details:', e);
          }
        }

        // Create the Finding in draft status. De code wordt binnen de
        // transactie toegekend; deze lus maakt er meerdere achter elkaar aan.
        const finding = await createFindingWithCode(projectId, (findingCode) => ({
          data: {
            projectId,
            findingCode,
            wcagCriterionId: wcagCriterion.id,
            // TODO: Add quickFindingId to schema
            // quickFindingId: quickFinding.id,
            status: 'open', // Draft status
            type: typeVoorImpact(quickFinding.impact),
            impact: quickFinding.impact,
            responsibility: quickFinding.responsibility,
            description: enhancedDescription,
            advice: quickFinding.advice,
            sortOrder,
            affectedUrls: {
              create: {
                scopeUrlId,
              },
            },
          },
        }));

        createdFindings.push(finding.findingCode);
        geraakteCriteria.add(wcagCriterion.id);
      }
    }

    // Deze route liet het criteriumoordeel ongemoeid: er werden bevindingen
    // aangemaakt zonder dat het criterium ooit op 'failed' kwam.
    await herberekenCriteriumOordelen(projectId, Array.from(geraakteCriteria));

    const totalChanges = createdFindings.length + updatedFindings.length;

    if (totalChanges === 0) {
      return NextResponse.json({
        success: true,
        message: 'Alle bevindingen waren al aangemaakt',
        findingsCreated: 0,
        findingsUpdated: 0,
      });
    }

    let message = '';
    if (createdFindings.length > 0) {
      message += `${createdFindings.length} nieuwe bevinding(en) aangemaakt in concept: ${createdFindings.join(', ')}`;
    }
    if (updatedFindings.length > 0) {
      if (message) message += '. ';
      message += `${updatedFindings.length} bestaande bevinding(en) bijgewerkt: ${updatedFindings.join(', ')}`;
    }

    return NextResponse.json({
      success: true,
      message,
      findingsCreated: createdFindings.length,
      findingsUpdated: updatedFindings.length,
      findingCodes: createdFindings,
    });
  } catch (error) {
    console.error('Error auto-creating findings:', error);
    return NextResponse.json(
      { error: 'Failed to create findings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
