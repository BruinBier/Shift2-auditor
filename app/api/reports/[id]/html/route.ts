import { NextRequest, NextResponse } from 'next/server';
import { generateReportHtml } from '@/lib/generate-report-html';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const html = await generateReportHtml(params.id);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('HTML report generation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
