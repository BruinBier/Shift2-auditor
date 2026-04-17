import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: body.title,
        subject: body.subject || '',
        standard: body.standard || 'WCAG 2.2',
        level: body.level || 'AA',
        researchType: body.researchType,
        version: body.version || 1,
        language: body.language || 'Nederlands',
        status: body.status || 'In uitvoering',
        clientName: body.clientName,
        commissionedBy: body.commissionedBy,
        clientProjectId: body.clientProjectId || null,
        auditedByOrg: body.auditedByOrg || 'Shift2',
        researcherName: body.researcherName,
        controllerName: body.controllerName,
        plannedTime: body.plannedTime,
        dateStart: body.dateStart ? new Date(body.dateStart) : null,
        dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
        researchStartedOn: body.researchStartedOn ? new Date(body.researchStartedOn) : null,
        reportDate: body.reportDate ? new Date(body.reportDate) : new Date(),
        description: body.description,
        isAnonymous: body.isAnonymous || false,
        isPrivate: body.isPrivate || false,
        isExternalProject: body.isExternalProject || false,
        externalBureau: body.externalBureau || null,
        hasReinspection: body.hasReinspection || false,
        reinspectionWeeks: body.reinspectionWeeks || null,
        reinspectionDate: body.reinspectionDate ? new Date(body.reinspectionDate) : null,
      },
    });

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Get current project to check previous status
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: { status: true },
    });

    // Check if status is being changed FROM "Gereed" to something else (reactivation)
    const isBeingReactivated = currentProject?.status === 'Gereed' && body.status && body.status !== 'Gereed';

    // If project is being reactivated, clear all data from herinspectie project
    if (isBeingReactivated) {
      console.log('[PATCH] Project is being reactivated, clearing herinspectie data');

      // Find the herinspectie project (child project)
      const herinspectieProject = await prisma.project.findFirst({
        where: { parentProjectId: id },
      });

      if (herinspectieProject) {
        console.log(`[PATCH] Found herinspectie project: ${herinspectieProject.id}, deleting all data`);

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

        console.log('[PATCH] Successfully cleared all data from herinspectie project');
      }
    }

    // Only update the fields that are provided in the request
    const project = await prisma.project.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      project,
      dataCleared: isBeingReactivated,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete the project (cascade will handle related records)
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
