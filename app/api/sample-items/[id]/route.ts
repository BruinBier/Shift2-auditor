import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const sampleItem = await prisma.sampleItem.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.sampleType && { sampleType: body.sampleType }),
        ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
      },
    });
    return NextResponse.json(sampleItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sample item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sampleItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sample item' }, { status: 500 });
  }
}
