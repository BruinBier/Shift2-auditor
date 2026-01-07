import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const occurrence = await prisma.findingOccurrence.create({
      data: {
        findingId: params.id,
        sampleItemId: body.sampleItemId,
        url: body.url,
        context: body.context,
      },
      include: {
        sampleItem: true,
      },
    });
    return NextResponse.json(occurrence, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create occurrence' }, { status: 500 });
  }
}
