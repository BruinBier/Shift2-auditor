import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paragraph = await prisma.cmsParagraph.findUnique({
      where: { id: params.id },
      include: {
        helpteksten: { orderBy: [{ order: 'asc' }, { title: 'asc' }] },
      },
    });
    if (!paragraph) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(paragraph);
  } catch (error) {
    console.error('Failed to fetch CMS paragraph:', error);
    return NextResponse.json({ error: 'Failed to fetch CMS paragraph' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.order !== undefined) data.order = body.order;

    const paragraph = await prisma.cmsParagraph.update({
      where: { id: params.id },
      data,
      include: { helpteksten: { orderBy: [{ order: 'asc' }, { title: 'asc' }] } },
    });

    return NextResponse.json(paragraph);
  } catch (error) {
    console.error('Failed to update CMS paragraph:', error);
    return NextResponse.json({ error: 'Failed to update CMS paragraph' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.cmsParagraph.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete CMS paragraph:', error);
    return NextResponse.json({ error: 'Failed to delete CMS paragraph' }, { status: 500 });
  }
}
