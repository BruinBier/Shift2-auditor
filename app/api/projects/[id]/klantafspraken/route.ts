import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Wat er met de klant is afgesproken: lopende afspraken eerst, daarbinnen op de datum
 * waarop het af moet zijn (wat het eerst verloopt bovenaan, afspraken zonder datum
 * daarachter). Nagekomen afspraken daaronder, laatst afgerond bovenaan.
 *
 * Los van de bespreekpunten. Een bespreekpunt is een vraag die je nog moet stellen; een
 * afspraak is het antwoord waar iemand mee aan de slag gaat.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const afspraken = await prisma.klantafspraak.findMany({
      where: { projectId: params.id },
      orderBy: [
        { nagekomenOp: { sort: 'desc', nulls: 'first' } },
        { uiterlijk: { sort: 'asc', nulls: 'last' } },
        { afgesprokenOp: 'asc' },
      ],
    });
    return NextResponse.json(afspraken);
  } catch (error) {
    console.error('Error fetching klantafspraken:', error);
    return NextResponse.json({ error: 'Afspraken ophalen is niet gelukt' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const tekst = typeof data.tekst === 'string' ? data.tekst.trim() : '';
    if (!tekst) {
      return NextResponse.json({ error: 'Een afspraak heeft tekst nodig' }, { status: 400 });
    }
    const afspraak = await prisma.klantafspraak.create({
      data: {
        projectId: params.id,
        tekst,
        wie: typeof data.wie === 'string' && data.wie.trim() ? data.wie.trim() : null,
        uiterlijk: data.uiterlijk ? new Date(data.uiterlijk) : null,
        afgesprokenOp: data.afgesprokenOp ? new Date(data.afgesprokenOp) : new Date(),
      },
    });
    return NextResponse.json(afspraak);
  } catch (error) {
    console.error('Error creating klantafspraak:', error);
    return NextResponse.json({ error: 'Afspraak toevoegen is niet gelukt' }, { status: 500 });
  }
}
