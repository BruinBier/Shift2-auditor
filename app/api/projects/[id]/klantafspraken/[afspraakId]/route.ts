import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Eén afspraak bijwerken: de tekst, bij wie het ligt, wanneer het af moet, of afvinken
 * met wat eruit kwam.
 *
 * `nagekomen: true` zet de datum op nu, `nagekomen: false` maakt hem weer leeg.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; afspraakId: string } },
) {
  try {
    const data = await request.json();
    const update: {
      tekst?: string;
      wie?: string | null;
      uiterlijk?: Date | null;
      uitkomst?: string | null;
      nagekomenOp?: Date | null;
    } = {};

    if (typeof data.tekst === 'string') {
      const tekst = data.tekst.trim();
      if (!tekst) {
        return NextResponse.json({ error: 'Een afspraak heeft tekst nodig' }, { status: 400 });
      }
      update.tekst = tekst;
    }
    if (data.wie !== undefined) {
      update.wie = typeof data.wie === 'string' && data.wie.trim() ? data.wie.trim() : null;
    }
    if (data.uiterlijk !== undefined) {
      update.uiterlijk = data.uiterlijk ? new Date(data.uiterlijk) : null;
    }
    if (data.uitkomst !== undefined) {
      update.uitkomst =
        typeof data.uitkomst === 'string' && data.uitkomst.trim() ? data.uitkomst.trim() : null;
    }
    if (data.nagekomen === true) update.nagekomenOp = new Date();
    if (data.nagekomen === false) update.nagekomenOp = null;

    const afspraak = await prisma.klantafspraak.update({
      where: { id: params.afspraakId, projectId: params.id },
      data: update,
    });
    return NextResponse.json(afspraak);
  } catch (error) {
    console.error('Error updating klantafspraak:', error);
    return NextResponse.json({ error: 'Afspraak bijwerken is niet gelukt' }, { status: 500 });
  }
}

/**
 * Een lopende afspraak verwijderen.
 *
 * Alleen zolang hij nog niet is nagekomen, net als bij een bespreekpunt: een afgeronde
 * afspraak legt vast wat er met de klant is afgestemd en wat ervan kwam.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; afspraakId: string } },
) {
  try {
    const afspraak = await prisma.klantafspraak.findFirst({
      where: { id: params.afspraakId, projectId: params.id },
      select: { nagekomenOp: true },
    });

    if (!afspraak) {
      return NextResponse.json({ error: 'Afspraak niet gevonden' }, { status: 404 });
    }
    if (afspraak.nagekomenOp) {
      return NextResponse.json(
        { error: 'Een nagekomen afspraak blijft staan: die legt vast wat er met de klant is afgestemd.' },
        { status: 409 },
      );
    }

    await prisma.klantafspraak.delete({ where: { id: params.afspraakId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting klantafspraak:', error);
    return NextResponse.json({ error: 'Afspraak verwijderen is niet gelukt' }, { status: 500 });
  }
}
