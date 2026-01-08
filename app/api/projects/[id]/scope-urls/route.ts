import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const scopeUrl = await prisma.projectScopeUrl.create({
      data: {
        projectId: params.id,
        url: body.url,
        title: body.title,
        crawlerType: body.crawlerType,
        inScope: body.inScope ?? true,
        note: body.note,
      },
    });
    return NextResponse.json(scopeUrl, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create scope URL' }, { status: 500 });
  }
}
