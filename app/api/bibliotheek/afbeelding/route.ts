import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_BYTES = 2 * 1024 * 1024;

/** Lijst van afbeeldingen, voor de casuseditor. */
export async function GET() {
  const rijen = await prisma.bibliotheekAfbeelding.findMany({
    select: { naam: true, mimeType: true },
    orderBy: { naam: 'asc' },
  });
  return NextResponse.json(rijen);
}

/**
 * Afbeelding uploaden voor een casus. Komt in de database, niet in
 * public/uploads/, zodat beide computers hem zien (besluit 12). In de
 * casus-HTML staat daarna alleen de bestandsnaam.
 *
 * Een bestaande naam wordt niet overschreven, tenzij `vervang=1`: een andere
 * casus kan hem gebruiken.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const bestand = form?.get('bestand');
  if (!(bestand instanceof File)) {
    return NextResponse.json({ fouten: ['Geen bestand meegestuurd.'] }, { status: 400 });
  }
  if (!bestand.type.startsWith('image/')) {
    return NextResponse.json({ fouten: [`${bestand.name} is geen afbeelding.`] }, { status: 400 });
  }
  if (bestand.size > MAX_BYTES) {
    return NextResponse.json({ fouten: [`${bestand.name} is groter dan 2 MB.`] }, { status: 400 });
  }
  const naam = bestand.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const vervang = request.nextUrl.searchParams.get('vervang') === '1';
  const bestaat = await prisma.bibliotheekAfbeelding.findUnique({ where: { naam }, select: { naam: true } });
  if (bestaat && !vervang) {
    return NextResponse.json(
      { fouten: [`Er is al een afbeelding ${naam}. Kies een andere naam of vervang hem bewust.`], bestaat: true },
      { status: 409 },
    );
  }
  const data = Buffer.from(await bestand.arrayBuffer());
  await prisma.bibliotheekAfbeelding.upsert({
    where: { naam },
    create: { naam, mimeType: bestand.type, data },
    update: { mimeType: bestand.type, data },
  });
  return NextResponse.json({ naam }, { status: 201 });
}
