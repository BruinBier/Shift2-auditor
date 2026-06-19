import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const issue = await prisma.technicalIssue.findUnique({
      where: { id: params.id },
      include: {
        wcagCriterion: { select: { id: true, code: true, titleNl: true, level: true } },
      },
    });
    if (!issue) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to fetch technical issue:', error);
    return NextResponse.json({ error: 'Failed to fetch technical issue' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.request !== undefined) data.request = body.request?.trim() || null;
    if (body.wcagCriterionId !== undefined) data.wcagCriterionId = body.wcagCriterionId || null;
    if (body.impact !== undefined) data.impact = body.impact || null;
    if (body.supplier !== undefined) data.supplier = body.supplier || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.githubIssueUrl !== undefined) data.githubIssueUrl = body.githubIssueUrl || null;

    const issue = await prisma.technicalIssue.update({
      where: { id: params.id },
      data,
      include: {
        wcagCriterion: { select: { id: true, code: true, titleNl: true, level: true } },
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to update technical issue:', error);
    return NextResponse.json({ error: 'Failed to update technical issue' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.technicalIssue.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete technical issue:', error);
    return NextResponse.json({ error: 'Failed to delete technical issue' }, { status: 500 });
  }
}
