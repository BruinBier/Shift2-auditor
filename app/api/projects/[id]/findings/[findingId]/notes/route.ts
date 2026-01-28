import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; findingId: string } }
) {
  try {
    const body = await request.json();
    const { notes } = body;

    const finding = await prisma.finding.update({
      where: { id: params.findingId },
      data: { notes },
    });

    return NextResponse.json(finding);
  } catch (error) {
    console.error('Failed to update finding notes:', error);
    return NextResponse.json(
      { error: 'Failed to update finding notes' },
      { status: 500 }
    );
  }
}