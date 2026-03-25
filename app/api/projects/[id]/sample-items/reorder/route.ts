import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Update all items with their new orderIndex
    await Promise.all(
      items.map((item: { id: string; orderIndex: number }) =>
        prisma.sampleItem.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering sample items:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het opslaan van de nieuwe volgorde' },
      { status: 500 }
    );
  }
}