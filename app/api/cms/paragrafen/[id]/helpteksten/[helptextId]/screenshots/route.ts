import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; helptextId: string } }
) {
  try {
    const body = await request.json();

    if (!body.path) {
      return NextResponse.json({ error: 'path is verplicht' }, { status: 400 });
    }

    const existingCount = await prisma.cmsHelptextScreenshot.count({
      where: { helptextId: params.helptextId },
    });

    const screenshot = await prisma.cmsHelptextScreenshot.create({
      data: {
        helptextId: params.helptextId,
        path: body.path,
        caption: body.caption?.trim() || null,
        alt: body.alt?.trim() || null,
        order: typeof body.order === 'number' ? body.order : existingCount,
      },
    });

    return NextResponse.json(screenshot, { status: 201 });
  } catch (error) {
    console.error('Failed to create screenshot:', error);
    return NextResponse.json({ error: 'Failed to create screenshot' }, { status: 500 });
  }
}
