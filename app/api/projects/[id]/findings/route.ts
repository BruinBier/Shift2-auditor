import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { typeVoorImpact } from '@/lib/finding-classification';
import { createFindingWithCode } from '@/lib/finding-code';
import { lintFinding, type LintIssue } from '@/lib/finding-lint';

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

    let lintWarnings: LintIssue[] = [];

    // Build create data object. findingCode wordt door createFindingWithCode
    // toegekend, binnen de transactie die de finding aanmaakt.
    const createData: any = {
      projectId: params.id,
      wcagCriterionId: body.criterionId,
      status: body.status || 'open',
      description: body.description || '',
      advice: body.advice || '',
      evidence: body.evidence,
      type: body.type ?? typeVoorImpact(body.impact !== undefined ? body.impact : null),
      impact: body.impact !== undefined ? body.impact : null,
      responsibility: body.responsibility !== undefined ? body.responsibility : null,
      sortOrder: newSortOrder,
      discoveredInPhase,
      interimReviewed,
    };

    // Schrijfregel-check. Draaide eerder alleen in de CLI, waardoor
    // bevindingen uit de UI en de crawler er langs gingen. Harde fouten
    // blokkeren; waarschuwingen komen mee in het antwoord. Omzeilen kan met
    // skipLint, voor de gevallen waarin de linter er naast zit.
    if (body.skipLint !== true) {
      const criterion = await prisma.wCAGCriterion.findUnique({
        where: { id: body.criterionId },
        select: { code: true },
      });
      const issues = lintFinding({
        description: createData.description,
        advice: createData.advice,
        impact: createData.impact,
        responsibility: createData.responsibility,
        status: createData.status,
        type: createData.type,
        criterionCode: criterion?.code,
      });
      const errors = issues.filter((i) => i.severity === 'error');
      if (errors.length > 0) {
        return NextResponse.json(
          {
            error: 'Bevinding voldoet niet aan de schrijfregels',
            lintIssues: issues,
            hint: 'Pas de tekst aan, of stuur skipLint mee als de linter er hier naast zit.',
          },
          { status: 422 }
        );
      }
      if (issues.length > 0) lintWarnings = issues;
    }

    const finding = await createFindingWithCode(params.id, (findingCode) => ({
      data: { ...createData, findingCode },
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
    }));

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

    return NextResponse.json(
      lintWarnings.length > 0 ? { ...finding, lintWarnings } : finding,
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating finding:', error);
    return NextResponse.json(
      { error: 'Failed to create finding', details: error?.message },
      { status: 500 }
    );
  }
}
