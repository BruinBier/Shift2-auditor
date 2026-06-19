import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const issues = await prisma.technicalIssue.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        wcagCriterion: {
          select: { id: true, code: true, titleNl: true, level: true },
        },
      },
    });
    return NextResponse.json(issues);
  } catch (error) {
    console.error('Failed to fetch technical issues:', error);
    return NextResponse.json({ error: 'Failed to fetch technical issues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'title en description zijn verplicht' },
        { status: 400 }
      );
    }

    const issue = await prisma.technicalIssue.create({
      data: {
        title: body.title,
        description: body.description,
        request: body.request?.trim() || null,
        wcagCriterionId: body.wcagCriterionId || null,
        impact: body.impact || null,
        supplier: body.supplier || null,
        status: body.status || 'open',
        githubIssueUrl: body.githubIssueUrl || null,
      },
      include: {
        wcagCriterion: { select: { id: true, code: true, titleNl: true, level: true } },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Failed to create technical issue:', error);
    return NextResponse.json({ error: 'Failed to create technical issue' }, { status: 500 });
  }
}
