import { NextRequest, NextResponse } from 'next/server';
import { nieuwDocument } from '@/lib/pdf-bouwer/model';
import { bewaar, lijst } from '@/lib/pdf-bouwer/opslag';

export const dynamic = 'force-dynamic';

/** De documenten van de PDF-bouwer, nieuwste eerst. */
export async function GET() {
  return NextResponse.json(await lijst());
}

/** Een nieuw, leeg document met alleen een kop 1. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const titel = typeof body.titel === 'string' && body.titel.trim() ? body.titel.trim() : 'Nieuw document';
  const doc = await bewaar(nieuwDocument(titel));
  return NextResponse.json(doc, { status: 201 });
}
