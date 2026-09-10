import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Bespreekpunten voor het klantgesprek: open punten eerst, daarbinnen oudste bovenaan
 * (de volgorde waarin ze zijn opgekomen is de volgorde waarin je ze bespreekt);
 * afgehandelde punten daaronder, laatst besproken bovenaan.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const punten = await prisma.bespreekpunt.findMany({
      where: { projectId: params.id },
      orderBy: [{ besprokenOp: { sort: 'desc', nulls: 'first' } }, { createdAt: 'asc' }],
    });
    return NextResponse.json(punten);
  } catch (error) {
    console.error('Error fetching bespreekpunten:', error);
    return NextResponse.json({ error: 'Bespreekpunten ophalen is niet gelukt' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const tekst = typeof data.tekst === 'string' ? data.tekst.trim() : '';
    if (!tekst) {
      return NextResponse.json({ error: 'Een bespreekpunt heeft tekst nodig' }, { status: 400 });
    }
    const punt = await prisma.bespreekpunt.create({
      data: { projectId: params.id, tekst },
    });
    return NextResponse.json(punt);
  } catch (error) {
    console.error('Error creating bespreekpunt:', error);
    return NextResponse.json({ error: 'Bespreekpunt toevoegen is niet gelukt' }, { status: 500 });
  }
}
