import { NextRequest, NextResponse } from 'next/server';
import { zoekKlantdata } from '@/lib/bibliotheek/klantdata';
import { klantDomeinen } from '@/lib/bibliotheek/server';

/**
 * Lijkt deze casuscode op klantdata (besluit 13)? De casuseditor vraagt het
 * vóór het opslaan en laat de keuze dan aan de onderzoeker: het is een
 * waarschuwing, geen blokkade.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const tekst = typeof body?.tekst === 'string' ? body.tekst : '';
  return NextResponse.json({ meldingen: zoekKlantdata(tekst, await klantDomeinen()) });
}
