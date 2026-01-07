import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            scopeUrls: true,
            sampleItems: true,
            findings: true,
          },
        },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project = await prisma.project.create({
      data: {
        title: body.title,
        subject: body.subject,
        standard: body.standard || 'WCAG 2.2',
        level: body.level || 'AA',
        researchType: body.researchType,
        version: body.version || 1,
        clientName: body.clientName,
        commissionedBy: body.commissionedBy,
        auditedByOrg: body.auditedByOrg || 'Shift2',
        researcherName: body.researcherName,
        dateStart: body.dateStart ? new Date(body.dateStart) : null,
        dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
        reportDate: body.reportDate ? new Date(body.reportDate) : new Date(),
        summaryText: body.summaryText,
        researcherFeedbackText: body.researcherFeedbackText,
        aboutResearchText: body.aboutResearchText,
        whatWasTestedText: body.whatWasTestedText,
        aboutOrgText: body.aboutOrgText,
        methodName: body.methodName,
        techniquesNote: body.techniquesNote,
        supportBaseline: body.supportBaseline,
        userAgents: body.userAgents || [],
        technologies: body.technologies || [],
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
