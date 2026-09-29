import { NextRequest, NextResponse } from 'next/server';
import { controleer } from '@/lib/pdf-bouwer/model';
import { lees } from '@/lib/pdf-bouwer/opslag';
import { maakPdf } from '@/lib/pdf-bouwer/pdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * De getagde PDF van een document. Weigert zolang de controle een fout meldt: een PDF met
 * een afbeelding zonder tekstalternatief is precies wat deze tool moet voorkomen.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = await lees(params.id);
  if (!doc) return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 });

  const fouten = controleer(doc).filter((m) => m.ernst === 'fout');
  if (fouten.length > 0) {
    return NextResponse.json({ error: 'Het document heeft nog fouten', fouten }, { status: 422 });
  }

  try {
    const pdf = await maakPdf(doc);
    const naam = `${doc.titel.replace(/[\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'document'}.pdf`;
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `attachment; filename="${naam.replace(/[^\x20-\x7E]/g, '_')}"; ` +
          `filename*=UTF-8''${encodeURIComponent(naam)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[pdf-bouwer] PDF maken mislukt:', err);
    return NextResponse.json({ error: err?.message || 'PDF maken mislukt' }, { status: 500 });
  }
}
