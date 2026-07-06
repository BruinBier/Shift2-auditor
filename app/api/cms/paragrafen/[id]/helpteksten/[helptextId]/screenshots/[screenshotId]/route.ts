import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; helptextId: string; screenshotId: string } }
) {
  try {
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.path !== undefined) data.path = body.path;
    if (body.caption !== undefined) data.caption = body.caption?.trim() || null;
    if (body.alt !== undefined) data.alt = body.alt?.trim() || null;
    if (body.order !== undefined) data.order = body.order;

    const screenshot = await prisma.cmsHelptextScreenshot.update({
      where: { id: params.screenshotId },
      data,
    });

    return NextResponse.json(screenshot);
  } catch (error) {
    console.error('Failed to update screenshot:', error);
    return NextResponse.json({ error: 'Failed to update screenshot' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; helptextId: string; screenshotId: string } }
) {
  try {
    await prisma.cmsHelptextScreenshot.delete({ where: { id: params.screenshotId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete screenshot:', error);
    return NextResponse.json({ error: 'Failed to delete screenshot' }, { status: 500 });
  }
}
