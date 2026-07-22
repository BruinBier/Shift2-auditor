import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const advices = await prisma.projectAdvice.findMany({
      where: { projectId: params.id },
      include: { wcagCriterion: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(advices);
  } catch (error) {
    console.error('Error fetching advices:', error);
    return NextResponse.json({ error: 'Failed to fetch advices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.adviceText?.trim() || !body.reasonText?.trim()) {
      return NextResponse.json(
        { error: 'title, adviceText en reasonText zijn verplicht' },
        { status: 400 }
      );
    }

    const last = await prisma.projectAdvice.findFirst({
      where: { projectId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const advice = await prisma.projectAdvice.create({
      data: {
        projectId: params.id,
        title: body.title.trim(),
        adviceText: body.adviceText.trim(),
        reasonText: body.reasonText.trim(),
        wcagCriterionId: body.wcagCriterionId || null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
      include: { wcagCriterion: true },
    });

    return NextResponse.json(advice, { status: 201 });
  } catch (error) {
    console.error('Error creating advice:', error);
    return NextResponse.json({ error: 'Failed to create advice' }, { status: 500 });
  }
}
