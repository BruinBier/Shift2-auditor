import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { typeVoorImpact } from '@/lib/finding-classification';

async function upsertAssessment(
  projectId: string,
  wcagCriterionId: string,
  status: 'passed' | 'failed',
) {
  const existing = await prisma.criterionAssessment.findFirst({
    where: { projectId, wcagCriterionId },
  });

  if (existing) {
    if (existing.status !== status) {
      await prisma.criterionAssessment.update({
        where: { id: existing.id },
        data: { status },
      });
    }
  } else {
    await prisma.criterionAssessment.create({
      data: { projectId, wcagCriterionId, status },
    });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; findingId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    console.log('PUT finding - params:', params);
    console.log('PUT finding - body:', JSON.stringify(body, null, 2));

    // Check if finding exists first
    const existingFinding = await prisma.finding.findUnique({
      where: { id: params.findingId },
    });

    if (!existingFinding) {
      console.log('Finding not found:', params.findingId);
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    console.log('Existing finding:', JSON.stringify(existingFinding, null, 2));

    // Build update data object - only include fields that are provided
    const updateData: any = {};

    if (body.criterionId !== undefined) {
      updateData.wcagCriterionId = body.criterionId;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.advice !== undefined) {
      updateData.advice = body.advice;
    }
    if (body.evidence !== undefined) {
      updateData.evidence = body.evidence;
    }
    if (body.impact !== undefined) {
      updateData.impact = body.impact;
      // Impact en type horen bij elkaar: impact leegmaken maakt er een opmerking
      // van, een impact invullen een afkeuring. Een expliciet meegestuurd type
      // wint (zie hieronder).
      //
      // UITZONDERING: een OPGELOSTE afkeuring blijft een afkeuring. Bij een
      // herinspectie wordt de impact soms leeggemaakt omdat het probleem weg is;
      // zou het type dan meeveranderen, dan wordt een serieuze bevinding stil een
      // opmerking en telt hij niet meer mee voor de conclusie. Dat is precies wat
      // er bij Heerlen-01 gebeurde: tien afkeuringen werden opmerkingen.
      const wordtOpgelost =
        (body.status ?? existingFinding.status) === 'resolved';
      const wasAfkeuring = existingFinding.type === 'bevinding';
      if (!(wordtOpgelost && wasAfkeuring)) {
        updateData.type = typeVoorImpact(body.impact);
      }
    }
    if (body.type !== undefined) {
      updateData.type = body.type;
    }
    if (body.responsibility !== undefined) {
      updateData.responsibility = body.responsibility;
    }
    if (body.interimReviewed !== undefined) {
      updateData.interimReviewed = body.interimReviewed;
    }
    if (body.interimNotes !== undefined) {
      updateData.interimNotes = body.interimNotes;
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Update the finding
    const updatedFinding = await prisma.finding.update({
      where: { id: params.findingId },
      data: updateData,
      include: {
        wcagCriterion: true,
        occurrences: true,
      },
    });

    console.log('Finding updated successfully:', updatedFinding.id);

    // Update FindingOccurrence records if sampleItemIds are provided
    if (body.sampleItemIds !== undefined) {
      console.log('Updating FindingOccurrence records');

      // Delete all existing occurrences for this finding
      await prisma.findingOccurrence.deleteMany({
        where: { findingId: params.findingId },
      });
      console.log('Deleted existing FindingOccurrence records');

      // Create new occurrences if sampleItemIds are provided
      if (Array.isArray(body.sampleItemIds) && body.sampleItemIds.length > 0) {
        const occurrences = body.sampleItemIds.map((sampleItemId: string) => ({
          findingId: params.findingId,
          sampleItemId: sampleItemId,
        }));

        await prisma.findingOccurrence.createMany({
          data: occurrences,
        });

        console.log('Created', occurrences.length, 'new FindingOccurrence records');
      }
    }

    // Auto-update CriterionAssessment after a status change.
    // Behavior depends on the project's check phase:
    //   - nulmeting: keep legacy one-way logic (status=open → assessment=failed)
    //   - tussencheck / herinspectie: bi-directional logic based on all
    //     non-opmerking findings (impact != null) for this criterion.
    //   - afgerond: do nothing (project is locked).
    if (body.status !== undefined) {
      const criterionId = updatedFinding.wcagCriterionId;

      const project = await prisma.project.findUnique({
        where: { id: params.id },
        select: { checkPhase: true },
      });

      if (project && project.checkPhase !== 'afgerond') {
        if (project.checkPhase === 'nulmeting') {
          if (body.status === 'open') {
            console.log('[nulmeting] Finding status=open, setting assessment to "failed"');
            await upsertAssessment(params.id, criterionId, 'failed');
          }
        } else {
          // tussencheck or herinspectie: recalculate based on all real findings.
          const realFindings = await prisma.finding.findMany({
            where: {
              projectId: params.id,
              wcagCriterionId: criterionId,
              impact: { not: null },
            },
            select: { status: true },
          });

          let newStatus: 'passed' | 'failed' | null = null;
          if (realFindings.length > 0) {
            const hasOpen = realFindings.some((f) => f.status === 'open');
            newStatus = hasOpen ? 'failed' : 'passed';
          }

          if (newStatus) {
            console.log(`[${project.checkPhase}] Recalculated assessment for criterion ${criterionId}: ${newStatus} (based on ${realFindings.length} real findings)`);
            await upsertAssessment(params.id, criterionId, newStatus);
          }
        }
      }
    }

    return NextResponse.json(updatedFinding, { status: 200 });
  } catch (error: any) {
    console.error('Error updating finding:', error);
    console.error('Error details:', error.message, error.code);
    return NextResponse.json({ error: 'Failed to update finding', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; findingId: string }> }
) {
  try {
    const params = await context.params;

    console.log('DELETE finding - params:', params);

    // Check if finding exists first
    const existingFinding = await prisma.finding.findUnique({
      where: { id: params.findingId },
    });

    if (!existingFinding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    // Delete the finding
    await prisma.finding.delete({
      where: { id: params.findingId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting finding:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete finding' }, { status: 500 });
  }
}