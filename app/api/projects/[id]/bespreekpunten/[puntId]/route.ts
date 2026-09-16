import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Eén bespreekpunt bijwerken: de tekst, de uitkomst, of afvinken.
 *
 * `besproken: true` zet de datum op nu, `besproken: false` maakt hem weer leeg (per
 * ongeluk afgevinkt).
 *
 * Verwijderen kan alleen zolang een punt nog open staat -- zie DELETE hieronder.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; puntId: string } },
) {
  try {
    const data = await request.json();
    const update: { tekst?: string; uitkomst?: string | null; besprokenOp?: Date | null } = {};

    if (typeof data.tekst === 'string') {
      const tekst = data.tekst.trim();
      if (!tekst) {
        return NextResponse.json({ error: 'Een bespreekpunt heeft tekst nodig' }, { status: 400 });
      }
      update.tekst = tekst;
    }
    if (data.uitkomst !== undefined) {
      update.uitkomst = typeof data.uitkomst === 'string' && data.uitkomst.trim() ? data.uitkomst.trim() : null;
    }
    if (data.besproken === true) update.besprokenOp = new Date();
    if (data.besproken === false) update.besprokenOp = null;

    const punt = await prisma.bespreekpunt.update({
      where: { id: params.puntId, projectId: params.id },
      data: update,
    });
    return NextResponse.json(punt);
  } catch (error) {
    console.error('Error updating bespreekpunt:', error);
    return NextResponse.json({ error: 'Bespreekpunt bijwerken is niet gelukt' }, { status: 500 });
  }
}

/**
 * Een open bespreekpunt verwijderen.
 *
 * Alleen zolang het nog niet is afgevinkt. Een afgehandeld punt is de vastlegging van wat
 * er wanneer met de klant is afgestemd, en die wil je bij een Cardan-project later kunnen
 * terugvinden; daar zit geen knop op en deze route weigert het.
 *
 * Voor een punt dat er niet had moeten staan: verkeerd geformuleerd, dubbel, of door een
 * agent aangemaakt zonder dat je erom vroeg. Tot 16 september 2026 kon dat helemaal niet,
 * en was Prisma Studio de enige uitweg.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; puntId: string } },
) {
  try {
    const punt = await prisma.bespreekpunt.findFirst({
      where: { id: params.puntId, projectId: params.id },
      select: { besprokenOp: true },
    });

    if (!punt) {
      return NextResponse.json({ error: 'Bespreekpunt niet gevonden' }, { status: 404 });
    }
    if (punt.besprokenOp) {
      return NextResponse.json(
        { error: 'Een afgevinkt bespreekpunt blijft staan: het legt vast wat er met de klant is afgestemd.' },
        { status: 409 },
      );
    }

    await prisma.bespreekpunt.delete({ where: { id: params.puntId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bespreekpunt:', error);
    return NextResponse.json({ error: 'Bespreekpunt verwijderen is niet gelukt' }, { status: 500 });
  }
}
