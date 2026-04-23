import { NextRequest, NextResponse } from 'next/server';
import { generateReportDocx } from '@/lib/generate-report-docx';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { subject: true, title: true, version: true },
    });
    const buffer = await generateReportDocx(params.id);
    const base =
      (project?.subject || project?.title || 'rapport')
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .slice(0, 80) || 'rapport';
    const fileName = `rapport-${base}-v${Number(project?.version || 1).toFixed(1)}.docx`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('DOCX report generation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
