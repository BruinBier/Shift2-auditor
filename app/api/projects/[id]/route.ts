import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Recalculate the reinspection child's planned dates based on the parent's
 * deadline (dateEnd) + reinspectionWeeks. Called after any parent update so
 * changing the parent's deadline (or moving it out of "In de wacht") propagates
 * to the v1.1 herinspectie project.
 */
/**
 * Create the v1.1 herinspectie child project for a parent that has
 * hasReinspection=true but no child yet. This happens when the herinspectie
 * checkbox is toggled on via the edit form (PUT) rather than at creation time
 * (POST), since only POST created the child historically. Mirrors the field
 * set + date calculation of the POST route. No-op when a child already exists.
 */
async function ensureReinspectionChild(parentId: string) {
  const parent = await prisma.project.findUnique({ where: { id: parentId } });
  if (!parent || !parent.hasReinspection) return;

  const existingChild = await prisma.project.findFirst({
    where: { parentProjectId: parentId },
    select: { id: true },
  });
  if (existingChild) return;

  // Same date logic as the POST route: reinspectionDate wins, else deadline + weeks,
  // else leave dates empty so it can be planned later.
  let reinspectionStart: Date | null = null;
  let reinspectionEnd: Date | null = null;
  if (parent.reinspectionDate) {
    reinspectionStart = new Date(parent.reinspectionDate);
    reinspectionEnd = new Date(reinspectionStart);
    reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);
  } else if (parent.reinspectionWeeks && parent.dateEnd) {
    reinspectionStart = new Date(parent.dateEnd);
    reinspectionStart.setDate(reinspectionStart.getDate() + parent.reinspectionWeeks * 7);
    reinspectionEnd = new Date(reinspectionStart);
    reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);
  }

  await prisma.project.create({
    data: {
      kenmerk: parent.kenmerk,
      title: parent.title,
      subject: parent.subject ?? '',
      standard: parent.standard,
      level: parent.level,
      researchType: parent.researchType,
      version: 1.1,
      language: parent.language,
      status: parent.status === 'In de wacht' ? 'In de wacht' : 'Gepland',
      clientName: parent.clientName,
      commissionedBy: parent.commissionedBy,
      clientProjectId: parent.clientProjectId,
      auditedByOrg: parent.auditedByOrg,
      researcherName: parent.researcherName,
      controllerName: parent.controllerName,
      plannedTime: parent.plannedTime,
      dateStart: reinspectionStart,
      dateEnd: reinspectionEnd,
      researchStartedOn: null,
      reportDate: reinspectionEnd ?? new Date(),
      description: parent.description,
      isAnonymous: parent.isAnonymous,
      isPrivate: parent.isPrivate,
      hasReinspection: false,
      reinspectionWeeks: null,
      parentProjectId: parent.id,
      checkPhase: 'tussencheck',
    },
  });

  console.log(`Created missing reinspection child (v1.1) for parent ${parent.id} via edit`);
}

async function syncReinspectionChild(parentId: string) {
  const child = await prisma.project.findFirst({
    where: { parentProjectId: parentId },
    select: { id: true, status: true },
  });
  if (!child) return;

  const parent = await prisma.project.findUnique({
    where: { id: parentId },
    select: {
      status: true,
      dateEnd: true,
      reinspectionWeeks: true,
    },
  });
  if (!parent || !parent.dateEnd || !parent.reinspectionWeeks) return;

  const reinspectionStart = new Date(parent.dateEnd);
  reinspectionStart.setDate(reinspectionStart.getDate() + parent.reinspectionWeeks * 7);
  const reinspectionEnd = new Date(reinspectionStart);
  reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);

  const nextStatus =
    child.status === 'In de wacht' && parent.status !== 'In de wacht' ? 'Gepland' : child.status;

  await prisma.project.update({
    where: { id: child.id },
    data: {
      dateStart: reinspectionStart,
      dateEnd: reinspectionEnd,
      reportDate: reinspectionEnd,
      status: nextStatus,
    },
  });
}

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
        // Default the rapportdatum to the deadline (dateEnd) rather than "today",
        // so editing a project without an explicit reportDate doesn't reset it
        // to the current date. Falls back to today only when there is no deadline.
        reportDate: body.reportDate
          ? new Date(body.reportDate)
          : (body.dateEnd ? new Date(body.dateEnd) : new Date()),
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

    await ensureReinspectionChild(id);
    await syncReinspectionChild(id);

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

    /**
     * Alleen de velden die deze route hoort te kunnen zetten.
     *
     * Hier stond `data: body` — alles wat een client meestuurde ging er ongefilterd in. Dat
     * is meer dan een tikfout-risico: Prisma accepteert in `data` ook geneste writes, dus
     * `{ findings: { deleteMany: {} } }` zou alle bevindingen van een project wissen. En
     * velden die de betekenis van een project bepalen — `parentProjectId` (de
     * herinspectie-relatie), `isProeftuin` (echt werk of testwerk) — stuurt geen enkel
     * scherm mee, maar konden wel gezet worden.
     *
     * De lijst komt uit een inventarisatie van alle zeventien PATCH-aanroepen naar deze
     * route, in zes bestanden. Voeg je een veld toe aan een formulier, zet het dan hier
     * ook neer — de melding hieronder wijst je erop.
     *
     * `title`, `kenmerk`, `notes` en dergelijke staan er bewust NIET in: die lopen via de
     * PUT-handler hierboven, met een eigen, ruimere set.
     */
    const TOEGESTAAN = new Set([
      'accountmanager',
      'cancellationReason',
      'clientProjectId',
      'commissionedBy',
      'dateEnd',
      'dateStart',
      'hasReinspection',
      'invitationSent',
      'isOngoing',
      'managementSummary',
      'planningApproved',
      'planningSent',
      'reinspectionWeeks',
      'reportDate',
      'researcherFeedback',
      'sampleClientPages',
      'sampleInfo',
      'scopeCallHeld',
      'scopeCallTranscript',
      'scopeInfo',
      'scopeInScope',
      'scopeOutOfScope',
      'status',
      'technologies',
      'userAgents',
    ]);

    /**
     * Weigeren en niet stilzwijgend negeren.
     *
     * Een veld dat je vergeet toe te voegen levert anders een knop op die lijkt te werken
     * maar niets bewaart — precies het soort stille fout dat deze allowlist moet voorkomen,
     * alleen omgekeerd. Nu staat er meteen welk veld het is.
     */
    const onbekend = Object.keys(body).filter((k) => !TOEGESTAAN.has(k));
    if (onbekend.length) {
      return NextResponse.json(
        {
          error: `Deze route mag ${onbekend.join(', ')} niet zetten.`,
          hint: 'Hoort dit veld hier wel thuis, voeg het dan toe aan TOEGESTAAN in app/api/projects/[id]/route.ts.',
        },
        { status: 400 }
      );
    }

    // Alleen de meegestuurde velden bijwerken. `null` blijft staan: dat is hoe een vinkje
    // bij de voorbereidingsstappen wordt uitgezet, en wegfilteren zou dat stil breken.
    const data = Object.fromEntries(Object.entries(body).filter(([k]) => TOEGESTAAN.has(k)));

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    await syncReinspectionChild(id);

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
