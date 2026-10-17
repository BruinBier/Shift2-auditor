import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Een afbeelding van een casus, uit de database (besluit 12). Testgebieden
 * verwijzen ernaar met alleen de bestandsnaam; het iframe zet zijn `base` op
 * deze route.
 *
 * Een SVG kan script bevatten. Rechtstreeks geopend zou het op het adres van de
 * app draaien; de CSP met `sandbox` en `script-src 'none'` voorkomt dat.
 */
export async function GET(_request: NextRequest, { params }: { params: { naam: string } }) {
  const naam = decodeURIComponent(params.naam);
  const afbeelding = await prisma.bibliotheekAfbeelding.findUnique({ where: { naam } });
  if (!afbeelding) {
    return NextResponse.json({ error: `Afbeelding ${naam} bestaat niet` }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(afbeelding.data), {
    headers: {
      'Content-Type': afbeelding.mimeType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
    },
  });
}
