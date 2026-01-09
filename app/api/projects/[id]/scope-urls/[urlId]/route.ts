import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    await prisma.projectScopeUrl.delete({
      where: { id: params.urlId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting scope URL:', error);
    return NextResponse.json({
      error: 'Failed to delete scope URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    const body = await request.json();

    const scopeUrl = await prisma.projectScopeUrl.update({
      where: { id: params.urlId },
      data: {
        ...(body.url !== undefined && { url: body.url }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.crawlerType !== undefined && { crawlerType: body.crawlerType }),
        ...(body.inScope !== undefined && { inScope: body.inScope }),
        ...(body.note !== undefined && { note: body.note }),
      },
    });

    return NextResponse.json(scopeUrl, { status: 200 });
  } catch (error) {
    console.error('Error updating scope URL:', error);
    return NextResponse.json({
      error: 'Failed to update scope URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
