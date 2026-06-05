import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const criterionId = searchParams.get('criterion');
    const sampleId = searchParams.get('sample');
    const search = searchParams.get('search');

    const where: any = { projectId: params.id };

    if (status) {
      where.status = status;
    }
    if (criterionId) {
      where.wcagCriterionId = criterionId;
    }
    if (sampleId) {
      where.occurrences = {
        some: {
          sampleItemId: sampleId,
        },
      };
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { advice: { contains: search, mode: 'insensitive' } },
        { findingCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const findings = await prisma.finding.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        wcagCriterion: true,
        occurrences: {
          include: {
            sampleItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(findings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    console.log('POST finding - projectId:', params.id, 'body:', body);

    // Generate finding code automatically.
    // Use the HIGHEST existing findingCode number + 1 (not count-based),
    // so deleted findings don't cause duplicate codes when new ones are added.
    const existingFindings = await prisma.finding.findMany({
      where: { projectId: params.id },
      select: { findingCode: true },
    });
    let maxNumber = 0;
    for (const f of existingFindings) {
      const m = (f.findingCode || '').match(/^B(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxNumber) maxNumber = n;
      }
    }
    const findingCode = `B${String(maxNumber + 1).padStart(3, '0')}`;

    console.log('Generated finding code:', findingCode, '(max existing:', maxNumber, ')');

    // Get the highest sortOrder for this criterion to place new finding at the bottom
    const highestSortOrder = await prisma.finding.findFirst({
      where: {
        projectId: params.id,
        wcagCriterionId: body.criterionId,
      },
      orderBy: {
        sortOrder: 'desc',
      },
      select: {
        sortOrder: true,
      },
    });

    const newSortOrder = (highestSortOrder?.sortOrder ?? -1) + 1;
    console.log('New finding will have sortOrder:', newSortOrder);

    // Get the project's current check phase. New findings are tagged with the
    // phase they were discovered in, and pre-marked as reviewed in tussencheck/
    // herinspectie (you just created it, so by definition you've looked at it).
    const projectForPhase = await prisma.project.findUnique({
      where: { id: params.id },
      select: { checkPhase: true },
    });
    const discoveredInPhase = projectForPhase?.checkPhase ?? 'nulmeting';
    const interimReviewed =
      discoveredInPhase === 'tussencheck' || discoveredInPhase === 'herinspectie';

    // Build create data object
    const createData: any = {
      projectId: params.id,
      findingCode: findingCode,
      wcagCriterionId: body.criterionId,
      status: body.status || 'open',
      description: body.description || '',
      advice: body.advice || '',
      evidence: body.evidence,
      impact: body.impact !== undefined ? body.impact : null,
      responsibility: body.responsibility !== undefined ? body.responsibility : null,
      sortOrder: newSortOrder,
      discoveredInPhase,
      interimReviewed,
    };

    const finding = await prisma.finding.create({
      data: createData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        wcagCriterion: true,
        occurrences: true,
      },
    });

    console.log('Finding created successfully:', finding.id);

    // Create FindingOccurrence records if sampleItemIds are provided
    if (body.sampleItemIds && Array.isArray(body.sampleItemIds) && body.sampleItemIds.length > 0) {
      console.log('Creating FindingOccurrence records for sample items:', body.sampleItemIds);

      const occurrences = body.sampleItemIds.map((sampleItemId: string) => ({
        findingId: finding.id,
        sampleItemId: sampleItemId,
      }));

      await prisma.findingOccurrence.createMany({
        data: occurrences,
      });

      console.log('Created', occurrences.length, 'FindingOccurrence records');
    }

    // If the finding status is "open" (afgekeurd), automatically update the criterion assessment to "failed"
    if (body.status === 'open') {
      console.log('Finding status is "open", updating criterion assessment to "failed"');

      // Check if assessment already exists
      const existingAssessment = await prisma.criterionAssessment.findFirst({
        where: {
          projectId: params.id,
          wcagCriterionId: body.criterionId,
        },
      });

      if (existingAssessment) {
        // Update existing assessment to "failed"
        await prisma.criterionAssessment.update({
          where: {
            id: existingAssessment.id,
          },
          data: {
            status: 'failed',
          },
        });
        console.log('Updated existing assessment to "failed"');
      } else {
        // Create new assessment with status "failed"
        await prisma.criterionAssessment.create({
          data: {
            projectId: params.id,
            wcagCriterionId: body.criterionId,
            status: 'failed',
          },
        });
        console.log('Created new assessment with status "failed"');
      }
    }

    return NextResponse.json(finding, { status: 201 });
  } catch (error) {
    console.error('Error creating finding:', error);
    return NextResponse.json({ error: 'Failed to create finding' }, { status: 500 });
  }
}
