import { NextRequest, NextResponse } from 'next/server';
import type { PdfDocument } from '@/lib/pdf-bouwer/model';
import { bewaar, lees, verwijder } from '@/lib/pdf-bouwer/opslag';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const doc = await lees(params.id);
  if (!doc) return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 });
  return NextResponse.json(doc);
}

/** Het hele document vervangen; de bouwer stuurt steeds alles mee. */
export async function PUT(request: NextRequest, { params }: Params) {
  const doc = (await request.json()) as PdfDocument;
  if (doc?.id !== params.id || !Array.isArray(doc.blokken)) {
    return NextResponse.json({ error: 'Ongeldig document' }, { status: 400 });
  }
  if (!(await lees(params.id))) {
    return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 });
  }
  const opgeslagen = await bewaar(doc);
  return NextResponse.json({ gewijzigd: opgeslagen.gewijzigd });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await verwijder(params.id);
  return NextResponse.json({ ok: true });
}
