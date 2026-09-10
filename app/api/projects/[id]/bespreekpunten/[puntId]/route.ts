import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Eén bespreekpunt bijwerken: de tekst, de uitkomst, of afvinken.
 *
 * `besproken: true` zet de datum op nu, `besproken: false` maakt hem weer leeg (per
 * ongeluk afgevinkt). Verwijderen kan niet: een afgehandeld punt is de vastlegging van
 * wat er wanneer met de klant is afgestemd, en die wil je bij een Cardan-project later
 * kunnen terugvinden.
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
