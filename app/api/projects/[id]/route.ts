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

    // Check if status is being changed to "Gereed"
    const isBeingMarkedAsCompleted = body.status === 'Gereed';

    // Get current project to check previous status
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: { status: true, hasReinspection: true },
    });

    // Only update the fields that are provided in the request
    const project = await prisma.project.update({
      where: { id },
      data: body,
    });

    // If project is being marked as completed AND it has reinspection, copy findings to v1.1
    if (
      isBeingMarkedAsCompleted &&
      currentProject?.status !== 'Gereed' &&
      currentProject?.hasReinspection
    ) {
      // Find the reinspection project (v1.1)
      const reinspectionProject = await prisma.project.findFirst({
        where: { parentProjectId: id },
      });

      if (reinspectionProject) {
        // Get all findings from v1.0
        const findings = await prisma.finding.findMany({
          where: { projectId: id },
          include: {
            occurrences: true,
            affectedUrls: true,
          },
        });

        console.log(`Copying ${findings.length} findings from ${id} to ${reinspectionProject.id}`);

        // Copy each finding to v1.1
        for (const finding of findings) {
          await prisma.finding.create({
            data: {
              projectId: reinspectionProject.id,
              findingCode: finding.findingCode,
              wcagCriterionId: finding.wcagCriterionId,
              status: 'open', // Reset status to open for reinspection
              impact: finding.impact,
              responsibility: finding.responsibility,
              description: finding.description,
              advice: finding.advice,
              evidence: finding.evidence,
              notes: finding.notes,
              sortOrder: finding.sortOrder,
              // Note: We don't copy occurrences and affectedUrls yet
              // These will be added during the actual reinspection
            },
          });
        }

        console.log(`Successfully copied findings to reinspection project`);
      }
    }

    return NextResponse.json({
      project,
      findingsCopied: isBeingMarkedAsCompleted && currentProject?.hasReinspection,
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
