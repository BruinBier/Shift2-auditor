import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; helptextId: string } }
) {
  try {
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.elementType !== undefined) data.elementType = body.elementType;
    if (body.title !== undefined) data.title = body.title;
    if (body.helpText !== undefined) data.helpText = body.helpText;
    if (body.wcagCriteria !== undefined) data.wcagCriteria = body.wcagCriteria?.trim() || null;
    if (body.screenshotPath !== undefined) data.screenshotPath = body.screenshotPath?.trim() || null;
    if (body.order !== undefined) data.order = body.order;

    const helptext = await prisma.cmsParagraphHelptext.update({
      where: { id: params.helptextId },
      data,
    });

    return NextResponse.json(helptext);
  } catch (error) {
    console.error('Failed to update helptekst:', error);
    return NextResponse.json({ error: 'Failed to update helptekst' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; helptextId: string } }
) {
  try {
    await prisma.cmsParagraphHelptext.delete({ where: { id: params.helptextId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete helptekst:', error);
    return NextResponse.json({ error: 'Failed to delete helptekst' }, { status: 500 });
  }
}
