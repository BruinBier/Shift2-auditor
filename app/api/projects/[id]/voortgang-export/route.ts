import { NextRequest, NextResponse } from 'next/server';
import { generateVoortgangsoverzichtDocx } from '@/lib/generate-voortgangsoverzicht-docx';
import { prisma } from '@/lib/prisma';

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, kenmerk: true, checkPhase: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const buffer = await generateVoortgangsoverzichtDocx(params.id);

    const today = new Date().toISOString().slice(0, 10);
    const baseName = slugify(project.kenmerk || project.title || 'voortgang');
    const filename = `voortgangsoverzicht-${baseName}-${today}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating voortgangsoverzicht:', error);
    return NextResponse.json(
      { error: 'Failed to generate voortgangsoverzicht', details: error.message },
      { status: 500 }
    );
  }
}
