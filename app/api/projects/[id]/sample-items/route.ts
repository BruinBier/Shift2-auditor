import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = { projectId: params.id };
    if (type && ['structured', 'random', 'pdf'].includes(type)) {
      where.sampleType = type;
    }

    const sampleItems = await prisma.sampleItem.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { occurrences: true },
        },
      },
    });

    return NextResponse.json(sampleItems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sample items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const sampleItem = await prisma.sampleItem.create({
      data: {
        projectId: params.id,
        sampleType: body.sampleType,
        title: body.title,
        url: body.url,
        orderIndex: body.orderIndex,
      },
    });
    return NextResponse.json(sampleItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sample item' }, { status: 500 });
  }
}
