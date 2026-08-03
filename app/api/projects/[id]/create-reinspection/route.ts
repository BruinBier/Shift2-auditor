import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type StartPhase = 'tussencheck' | 'herinspectie';

/**
 * Create a herinspection project (v1.1) for a nulmeting project that didn't have
 * one set up at creation time. Mirrors what /finalize does when a herinspection
 * project already exists, but creates the child project from scratch.
 *
 * Body: { checkPhase: 'tussencheck' | 'herinspectie' }
 *
 * Preconditions:
 *  - Parent project exists
 *  - Parent has status 'Gereed' (afgerond nulmeting)
 *  - Parent has no other child project yet
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const startPhase: StartPhase = body.checkPhase;

    if (startPhase !== 'tussencheck' && startPhase !== 'herinspectie') {
      return NextResponse.json({ error: 'Invalid checkPhase. Use tussencheck or herinspectie.' }, { status: 400 });
    }

    const parent = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        scopeUrls: { include: { crawlerResults: true } },
        sampleItems: { include: { crawlerResults: true } },
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

    if (!parent) {
      return NextResponse.json({ error: 'Parent project not found' }, { status: 404 });
    }

    if (parent.status !== 'Gereed') {
      return NextResponse.json(
        { error: 'Parent project must be afgerond (status Gereed) before creating a herinspection.' },
        { status: 400 }
      );
    }

    const existingChild = await prisma.project.findFirst({
      where: { parentProjectId: parent.id },
      select: { id: true },
    });
    if (existingChild) {
      return NextResponse.json(
        { error: 'A herinspection project already exists for this parent.' },
        { status: 409 }
      );
    }

    // Create the child project (version 1.1) with no scheduled dates.
    // The user fills those in afterwards via the Details tab.
    const child = await prisma.project.create({
      data: {
        kenmerk: parent.kenmerk,
        title: parent.title,
        subject: parent.subject ?? '',
        standard: parent.standard,
        level: parent.level,
        researchType: parent.researchType,
        version: 1.1,
        language: parent.language,
        status: 'Gepland',
        clientName: parent.clientName,
        commissionedBy: parent.commissionedBy,
        clientProjectId: parent.clientProjectId,
        auditedByOrg: parent.auditedByOrg,
        researcherName: parent.researcherName,
        controllerName: parent.controllerName,
        plannedTime: parent.plannedTime,
        dateStart: null,
        dateEnd: null,
        reportDate: new Date(),
        description: parent.description,
        notes: parent.notes,
        isAnonymous: parent.isAnonymous,
        isPrivate: parent.isPrivate,
        hasReinspection: false,
        reinspectionWeeks: null,
        parentProjectId: parent.id,
        summaryText: parent.summaryText,
        researcherFeedbackText: parent.researcherFeedbackText,
        aboutResearchText: parent.aboutResearchText,
        whatWasTestedText: parent.whatWasTestedText,
        aboutOrgText: parent.aboutOrgText,
        scopeInfo: parent.scopeInfo,
        sampleInfo: parent.sampleInfo,
        conclusionText: parent.conclusionText,
        managementSummary: parent.managementSummary,
        researcherFeedback: parent.researcherFeedback,
        methodName: parent.methodName,
        techniquesNote: parent.techniquesNote,
        supportBaseline: parent.supportBaseline,
        userAgents: parent.userAgents,
        technologies: parent.technologies,
        checkPhase: startPhase,
        checkPhaseStartedAt: new Date(),
      },
    });

    // Copy scope URLs
    const scopeUrlMap = new Map<string, string>();
    for (const scopeUrl of parent.scopeUrls) {
      const newScopeUrl = await prisma.projectScopeUrl.create({
        data: {
          projectId: child.id,
          url: scopeUrl.url,
          title: scopeUrl.title,
          crawlerType: scopeUrl.crawlerType,
          inScope: scopeUrl.inScope,
          note: scopeUrl.note,
          crawledAt: scopeUrl.crawledAt,
          parentUrlId: null,
        },
      });
      scopeUrlMap.set(scopeUrl.id, newScopeUrl.id);

      for (const cr of scopeUrl.crawlerResults) {
        await prisma.crawlerResult.create({
          data: {
            scopeUrlId: newScopeUrl.id,
            testId: cr.testId,
            testName: cr.testName,
            found: cr.found,
            count: cr.count,
            details: cr.details,
          },
        });
      }
    }

    // Update parent-child relationships for scope URLs
    for (const scopeUrl of parent.scopeUrls) {
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
    const sampleItemMap = new Map<string, string>();
    for (const sampleItem of parent.sampleItems) {
      const newSampleItem = await prisma.sampleItem.create({
        data: {
          projectId: child.id,
          url: sampleItem.url,
          title: sampleItem.title,
          sampleType: sampleItem.sampleType,
          description: sampleItem.description,
          orderIndex: sampleItem.orderIndex,
          makeScreenshot: sampleItem.makeScreenshot,
          screenshotPath: sampleItem.screenshotPath,
          auditHtmlPath: sampleItem.auditHtmlPath,
          auditCapturedAt: sampleItem.auditCapturedAt,
          screenshotAlt: sampleItem.screenshotAlt,
          notes: sampleItem.notes,
          crawledAt: sampleItem.crawledAt,
        },
      });
      sampleItemMap.set(sampleItem.id, newSampleItem.id);

      for (const cr of sampleItem.crawlerResults) {
        await prisma.crawlerResult.create({
          data: {
            sampleItemId: newSampleItem.id,
            testId: cr.testId,
            testName: cr.testName,
            found: cr.found,
            count: cr.count,
            details: cr.details,
          },
        });
      }
    }

    // Copy criterion assessments
    for (const assessment of parent.criterionAssessments) {
      await prisma.criterionAssessment.create({
        data: {
          projectId: child.id,
          wcagCriterionId: assessment.wcagCriterionId,
          status: assessment.status,
          notes: assessment.notes,
          explanation: assessment.explanation,
        },
      });
    }

    // Copy findings — preserve discoveredInPhase and tussencheck-state
    // (interimReviewed + interimNotes) so werk uit de tussencheck niet
    // opnieuw hoeft in de herinspectie.
    for (const finding of parent.findings) {
      const newFinding = await prisma.finding.create({
        data: {
          projectId: child.id,
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
          discoveredInPhase: finding.discoveredInPhase,
          interimReviewed: finding.interimReviewed,
          interimNotes: finding.interimNotes,
        },
      });

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

    return NextResponse.json({ success: true, project: child }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reinspection:', error);
    return NextResponse.json(
      { error: 'Failed to create reinspection', details: error.message },
      { status: 500 }
    );
  }
}
