import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    if (!body.elementType || !body.title || !body.helpText) {
      return NextResponse.json(
        { error: 'elementType, title en helpText zijn verplicht' },
        { status: 400 }
      );
    }

    const helptext = await prisma.cmsParagraphHelptext.create({
      data: {
        paragraphId: params.id,
        elementType: body.elementType,
        title: body.title,
        helpText: body.helpText,
        wcagCriteria: body.wcagCriteria?.trim() || null,
        screenshotPath: body.screenshotPath?.trim() || null,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    return NextResponse.json(helptext, { status: 201 });
  } catch (error) {
    console.error('Failed to create helptekst:', error);
    return NextResponse.json({ error: 'Failed to create helptekst' }, { status: 500 });
  }
}
