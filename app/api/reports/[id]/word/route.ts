import { NextRequest, NextResponse } from 'next/server';
import { generateReportHtml } from '@/lib/generate-report-html';
import { htmlReportToDocx } from '@/lib/html-to-docx-report';
import { prisma } from '@/lib/prisma';

/**
 * Word-export die de rapport-HTML als bron gebruikt.
 *
 * De HTML is al semantisch correct (koppen, thead/th, lijsten), dus de Word-versie
 * en de webversie blijven vanzelf gelijk. Staat los van de bestaande
 * /docx-route, die op een Word-sjabloon werkt.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const html = await generateReportHtml(params.id);
    const buffer = await htmlReportToDocx(html);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { subject: true, title: true, version: true },
    });

    const slug = (project?.subject || project?.title || 'rapport')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .replace(/[^a-zA-Z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    const version = project?.version ? `-v${project.version}` : '';
    const filename = `rapport-${slug}${version}.docx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Word report generation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
