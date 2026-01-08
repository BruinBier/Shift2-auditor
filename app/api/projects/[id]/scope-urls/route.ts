import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('Creating scope URL:', { projectId: params.id, ...body });

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

    console.log('Scope URL created:', scopeUrl);
    return NextResponse.json(scopeUrl, { status: 201 });
  } catch (error) {
    console.error('Error creating scope URL:', error);
    return NextResponse.json({
      error: 'Failed to create scope URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
