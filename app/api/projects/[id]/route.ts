import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        scopeUrls: true,
        sampleItems: {
          orderBy: { orderIndex: 'asc' },
        },
        criterionAssessments: {
          include: {
            wcagCriterion: true,
          },
        },
        findings: {
          include: {
            wcagCriterion: true,
            occurrences: {
              include: {
                sampleItem: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.subject && { subject: body.subject }),
        ...(body.standard && { standard: body.standard }),
        ...(body.level && { level: body.level }),
        ...(body.researchType && { researchType: body.researchType }),
        ...(body.version && { version: body.version }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.commissionedBy !== undefined && { commissionedBy: body.commissionedBy }),
        ...(body.auditedByOrg && { auditedByOrg: body.auditedByOrg }),
        ...(body.researcherName !== undefined && { researcherName: body.researcherName }),
        ...(body.dateStart !== undefined && { dateStart: body.dateStart ? new Date(body.dateStart) : null }),
        ...(body.dateEnd !== undefined && { dateEnd: body.dateEnd ? new Date(body.dateEnd) : null }),
        ...(body.reportDate && { reportDate: new Date(body.reportDate) }),
        ...(body.summaryText !== undefined && { summaryText: body.summaryText }),
        ...(body.researcherFeedbackText !== undefined && { researcherFeedbackText: body.researcherFeedbackText }),
        ...(body.aboutResearchText !== undefined && { aboutResearchText: body.aboutResearchText }),
        ...(body.whatWasTestedText !== undefined && { whatWasTestedText: body.whatWasTestedText }),
        ...(body.aboutOrgText !== undefined && { aboutOrgText: body.aboutOrgText }),
        ...(body.methodName !== undefined && { methodName: body.methodName }),
        ...(body.techniquesNote !== undefined && { techniquesNote: body.techniquesNote }),
        ...(body.supportBaseline !== undefined && { supportBaseline: body.supportBaseline }),
        ...(body.userAgents && { userAgents: body.userAgents }),
        ...(body.technologies && { technologies: body.technologies }),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
