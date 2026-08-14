import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[COPY] Route hit!');

  try {
    const { id } = await params;

    console.log('[COPY] Starting copy for project:', id);

    // Fetch the original project with all its relations
    const originalProject = await prisma.project.findUnique({
      where: { id },
      include: {
        scopeUrls: {
          include: {
            crawlerResults: true,
          },
        },
        sampleItems: {
          include: {
            crawlerResults: true,
            criterionChecks: true,
          },
        },
        criterionAssessments: true,
        findings: {
          include: {
            occurrences: true,
            affectedUrls: true,
            attachments: true,
          },
        },
        projectNotes: true,
      },
    });

    if (!originalProject) {
      console.log('[COPY] Project not found:', id);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[COPY] Found project:', originalProject.title);

    // Generate kenmerk for the new project
    let kenmerk: string | null = null;
    if (originalProject.commissionedBy) {
      const opdrachtgever = await prisma.opdrachtgever.findFirst({
        where: { naam: originalProject.commissionedBy },
      });

      if (opdrachtgever) {
        const opdrachtgeverKenmerk = opdrachtgever.kenmerk;

        // Find all existing projects with this opdrachtgever's kenmerk
        const existingProjectsWithKenmerk = await prisma.project.findMany({
          where: {
            kenmerk: {
              startsWith: `${opdrachtgeverKenmerk}-`,
            },
          },
          select: { kenmerk: true },
        });

        let highestNumber = 0;
        existingProjectsWithKenmerk.forEach((project) => {
          if (project.kenmerk) {
            const match = project.kenmerk.match(/-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > highestNumber) {
                highestNumber = num;
              }
            }
          }
        });

        // Generate next kenmerk number
        const nextNumber = highestNumber + 1;
        kenmerk = `${opdrachtgeverKenmerk}-${String(nextNumber).padStart(2, '0')}`;

        console.log(`[COPY] Generated kenmerk: ${kenmerk} (highest: ${highestNumber})`);
      }
    }

    // Create the new project with modified title and version
    const newProject = await prisma.project.create({
      data: {
        // Modified fields
        title: `${originalProject.title} herinspectie`,
        version: 1.1,
        kenmerk: kenmerk,

        // Copy all other fields
        subject: originalProject.subject,
        standard: originalProject.standard,
        level: originalProject.level,
        researchType: originalProject.researchType,
        language: originalProject.language,
        status: originalProject.status,
        clientName: originalProject.clientName,
        commissionedBy: originalProject.commissionedBy,
        clientProjectId: originalProject.clientProjectId,
        auditedByOrg: originalProject.auditedByOrg,
        researcherName: originalProject.researcherName,
        controllerName: originalProject.controllerName,
        plannedTime: originalProject.plannedTime,
        dateStart: originalProject.dateStart,
        dateEnd: originalProject.dateEnd,
        researchStartedOn: originalProject.researchStartedOn,
        reportDate: originalProject.reportDate,
        description: originalProject.description,
        notes: originalProject.notes,
        isAnonymous: originalProject.isAnonymous,
        isPrivate: originalProject.isPrivate,
        summaryText: originalProject.summaryText,
        researcherFeedbackText: originalProject.researcherFeedbackText,
        aboutResearchText: originalProject.aboutResearchText,
        whatWasTestedText: originalProject.whatWasTestedText,
        aboutOrgText: originalProject.aboutOrgText,
        scopeInfo: originalProject.scopeInfo,
        sampleInfo: originalProject.sampleInfo,
        conclusionText: originalProject.conclusionText,
        managementSummary: originalProject.managementSummary,
        researcherFeedback: originalProject.researcherFeedback,
        methodName: originalProject.methodName,
        techniquesNote: originalProject.techniquesNote,
        supportBaseline: originalProject.supportBaseline,
        userAgents: originalProject.userAgents,
        technologies: originalProject.technologies,
      },
    });

    console.log('[COPY] Created new project:', newProject.id);

    // Map to store old ID -> new ID mappings
    const scopeUrlMap = new Map<string, string>();
    const sampleItemMap = new Map<string, string>();

    // Copy scope URLs
    console.log('[COPY] Copying', originalProject.scopeUrls.length, 'scope URLs');
    for (const scopeUrl of originalProject.scopeUrls) {
      const newScopeUrl = await prisma.projectScopeUrl.create({
        data: {
          projectId: newProject.id,
          url: scopeUrl.url,
          title: scopeUrl.title,
          crawlerType: scopeUrl.crawlerType,
          inScope: scopeUrl.inScope,
          note: scopeUrl.note,
          crawledAt: scopeUrl.crawledAt,
          parentUrlId: null, // Will update after all URLs are created
        },
      });
      scopeUrlMap.set(scopeUrl.id, newScopeUrl.id);

      // Copy crawler results for this scope URL
      for (const crawlerResult of scopeUrl.crawlerResults) {
        await prisma.crawlerResult.create({
          data: {
            scopeUrlId: newScopeUrl.id,
            testId: crawlerResult.testId,
            testName: crawlerResult.testName,
            found: crawlerResult.found,
            count: crawlerResult.count,
            details: crawlerResult.details,
          },
        });
      }
    }

    // Update parent-child relationships for scope URLs
    console.log('[COPY] Updating parent-child relationships');
    for (const scopeUrl of originalProject.scopeUrls) {
      if (scopeUrl.parentUrlId) {
        const newParentId = scopeUrlMap.get(scopeUrl.parentUrlId);
        const newScopeUrlId = scopeUrlMap.get(scopeUrl.id);
        if (newParentId && newScopeUrlId) {
          await prisma.projectScopeUrl.update({
            where: { id: newScopeUrlId },
            data: { parentUrlId: newParentId },
          });
        }
      }
    }

    // Copy sample items
    console.log('[COPY] Copying', originalProject.sampleItems.length, 'sample items');
    for (const sampleItem of originalProject.sampleItems) {
      const newSampleItem = await prisma.sampleItem.create({
        data: {
          projectId: newProject.id,
          url: sampleItem.url,
          title: sampleItem.title,
          sampleType: sampleItem.sampleType,
          description: sampleItem.description,
          orderIndex: sampleItem.orderIndex,
          makeScreenshot: sampleItem.makeScreenshot,
          screenshotPath: sampleItem.screenshotPath,
          screenshotAlt: sampleItem.screenshotAlt,
          notes: sampleItem.notes,
          crawledAt: sampleItem.crawledAt,
        },
      });
      sampleItemMap.set(sampleItem.id, newSampleItem.id);

      // Copy crawler results for this sample item
      for (const crawlerResult of sampleItem.crawlerResults) {
        await prisma.crawlerResult.create({
          data: {
            sampleItemId: newSampleItem.id,
            testId: crawlerResult.testId,
            testName: crawlerResult.testName,
            found: crawlerResult.found,
            count: crawlerResult.count,
            details: crawlerResult.details,
          },
        });
      }

      // Sampleoordelen meekopiëren, met behoud van checkedAt. Die datum maakt
      // straks zichtbaar wat nog van de vorige ronde is en wat opnieuw is
      // beoordeeld. Ging eerder verloren, waardoor de matrix in een kopie leeg
      // begon — zie docs/adr/0001-akkoord-als-poort.md.
      if (sampleItem.criterionChecks?.length) {
        await prisma.sampleCriterionCheck.createMany({
          data: sampleItem.criterionChecks.map((c: any) => ({
            sampleItemId: newSampleItem.id,
            wcagCriterionId: c.wcagCriterionId,
            status: c.status,
            reden: c.reden,
            bron: c.bron,
            akkoord: c.akkoord,
            checkedAt: c.checkedAt,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Copy criterion assessments
    console.log('[COPY] Copying', originalProject.criterionAssessments.length, 'criterion assessments');
    for (const assessment of originalProject.criterionAssessments) {
      await prisma.criterionAssessment.create({
        data: {
          projectId: newProject.id,
          wcagCriterionId: assessment.wcagCriterionId,
          status: assessment.status,
          notes: assessment.notes,
          explanation: assessment.explanation,
        },
      });
    }

    // Copy findings with their relations
    console.log('[COPY] Copying', originalProject.findings.length, 'findings');
    for (const finding of originalProject.findings) {
      const newFinding = await prisma.finding.create({
        data: {
          projectId: newProject.id,
          findingCode: finding.findingCode,
          wcagCriterionId: finding.wcagCriterionId,
          status: finding.status,
          type: finding.type,
          impact: finding.impact,
          responsibility: finding.responsibility,
          description: finding.description,
          advice: finding.advice,
          evidence: finding.evidence,
          notes: finding.notes,
          sortOrder: finding.sortOrder,
        },
      });

      // Copy finding occurrences
      for (const occurrence of finding.occurrences) {
        const newSampleItemId = sampleItemMap.get(occurrence.sampleItemId);
        if (newSampleItemId) {
          await prisma.findingOccurrence.create({
            data: {
              findingId: newFinding.id,
              sampleItemId: newSampleItemId,
              url: occurrence.url,
              context: occurrence.context,
            },
          });
        }
      }

      // Copy affected URLs
      for (const affectedUrl of finding.affectedUrls) {
        const newScopeUrlId = scopeUrlMap.get(affectedUrl.scopeUrlId);
        if (newScopeUrlId) {
          await prisma.findingUrl.create({
            data: {
              findingId: newFinding.id,
              scopeUrlId: newScopeUrlId,
            },
          });
        }
      }

      // Copy attachments
      for (const attachment of finding.attachments) {
        await prisma.findingAttachment.create({
          data: {
            findingId: newFinding.id,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            filePath: attachment.filePath,
          },
        });
      }
    }

    // Copy project notes
    console.log('[COPY] Copying', originalProject.projectNotes.length, 'project notes');
    for (const note of originalProject.projectNotes) {
      await prisma.projectNote.create({
        data: {
          projectId: newProject.id,
          authorName: note.authorName,
          content: note.content,
        },
      });
    }

    console.log('[COPY] Successfully copied project:', newProject.id);
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('[COPY] Error copying project:', error);

    // Return detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[COPY] Error details:', { errorMessage, errorStack });

    return NextResponse.json({
      error: 'Failed to copy project',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}
