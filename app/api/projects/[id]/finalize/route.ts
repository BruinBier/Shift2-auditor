import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update project status to "Gereed"
    const project = await prisma.project.update({
      where: { id },
      data: {
        status: 'Gereed',
      },
    });

    // Check if this project has a herinspectie (child project)
    const herinspectieProject = await prisma.project.findFirst({
      where: { parentProjectId: id },
    });

    if (herinspectieProject) {
      console.log(`[FINALIZE] Found herinspectie project: ${herinspectieProject.id}`);

      // First, clear all existing data from herinspectie project
      console.log('[FINALIZE] Clearing existing data from herinspectie project');

      // Delete all data from herinspectie project (in correct order due to foreign keys)
      // First delete finding-related data
      await prisma.findingOccurrence.deleteMany({
        where: {
          finding: {
            projectId: herinspectieProject.id,
          },
        },
      });

      await prisma.findingUrl.deleteMany({
        where: {
          finding: {
            projectId: herinspectieProject.id,
          },
        },
      });

      await prisma.findingAttachment.deleteMany({
        where: {
          finding: {
            projectId: herinspectieProject.id,
          },
        },
      });

      await prisma.finding.deleteMany({
        where: { projectId: herinspectieProject.id },
      });

      // Delete crawler results
      await prisma.crawlerResult.deleteMany({
        where: {
          OR: [
            {
              scopeUrl: {
                projectId: herinspectieProject.id,
              },
            },
            {
              sampleItem: {
                projectId: herinspectieProject.id,
              },
            },
          ],
        },
      });

      // Delete sample items
      await prisma.sampleItem.deleteMany({
        where: { projectId: herinspectieProject.id },
      });

      // Delete scope URLs
      await prisma.projectScopeUrl.deleteMany({
        where: { projectId: herinspectieProject.id },
      });

      // Delete criterion assessments
      await prisma.criterionAssessment.deleteMany({
        where: { projectId: herinspectieProject.id },
      });

      console.log('[FINALIZE] Successfully cleared existing data');

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
        },
      });

      if (!originalProject) {
        throw new Error('Original project not found');
      }

      console.log('[FINALIZE] Starting data copy to herinspectie project');

      // Map to store old ID -> new ID mappings
      const scopeUrlMap = new Map<string, string>();
      const sampleItemMap = new Map<string, string>();

      // Copy scope URLs
      console.log('[FINALIZE] Copying', originalProject.scopeUrls.length, 'scope URLs');
      for (const scopeUrl of originalProject.scopeUrls) {
        const newScopeUrl = await prisma.projectScopeUrl.create({
          data: {
            projectId: herinspectieProject.id,
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
      console.log('[FINALIZE] Updating parent-child relationships');
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
      console.log('[FINALIZE] Copying', originalProject.sampleItems.length, 'sample items');
      for (const sampleItem of originalProject.sampleItems) {
        const newSampleItem = await prisma.sampleItem.create({
          data: {
            projectId: herinspectieProject.id,
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
      }

      // Copy criterion assessments
      console.log('[FINALIZE] Copying', originalProject.criterionAssessments.length, 'criterion assessments');
      for (const assessment of originalProject.criterionAssessments) {
        await prisma.criterionAssessment.create({
          data: {
            projectId: herinspectieProject.id,
            wcagCriterionId: assessment.wcagCriterionId,
            status: assessment.status,
            notes: assessment.notes,
            explanation: assessment.explanation,
          },
        });
      }

      // Copy findings with their relations
      console.log('[FINALIZE] Copying', originalProject.findings.length, 'findings');
      for (const finding of originalProject.findings) {
        const newFinding = await prisma.finding.create({
          data: {
            projectId: herinspectieProject.id,
            findingCode: finding.findingCode,
            wcagCriterionId: finding.wcagCriterionId,
            status: finding.status,
            impact: finding.impact,
            responsibility: finding.responsibility,
            description: finding.description,
            advice: finding.advice,
            evidence: finding.evidence,
            notes: finding.notes,
            sortOrder: finding.sortOrder,
            discoveredInPhase: finding.discoveredInPhase,
            interimReviewed: false,
            interimNotes: null,
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

      console.log('[FINALIZE] Successfully copied all data to herinspectie project');

      // Copy project-level rich text fields and other properties
      console.log('[FINALIZE] Copying project-level properties (rich text fields, method info, etc.)');
      await prisma.project.update({
        where: { id: herinspectieProject.id },
        data: {
          // Rich text fields
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

          // Method info
          methodName: originalProject.methodName,
          techniquesNote: originalProject.techniquesNote,
          supportBaseline: originalProject.supportBaseline,
          userAgents: originalProject.userAgents,
          technologies: originalProject.technologies,

          // Other fields
          description: originalProject.description,
          notes: originalProject.notes,

          // Tussencheck-fase activeren op het herinspectie-project
          checkPhase: 'tussencheck',
          checkPhaseStartedAt: new Date(),
        },
      });

      console.log('[FINALIZE] Successfully copied project-level properties');
    }

    return NextResponse.json({
      success: true,
      project,
      dataCopied: !!herinspectieProject,
      message: 'Onderzoek succesvol afgerond'
    }, { status: 200 });
  } catch (error) {
    console.error('Error finalizing project:', error);
    return NextResponse.json({
      error: 'Failed to finalize project'
    }, { status: 500 });
  }
}