import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VIDEO_PHASES } from '@/lib/videoPhases';
import { parseVideoXlsx } from '@/lib/parseVideoXlsx';

export const runtime = 'nodejs';

// POST: video's importeren uit een .xlsx.
// multipart/form-data: file (.xlsx) + optioneel gemeente (fallback als het bestand
// geen Gemeente-kolom heeft).
//
// Ondersteunt het A2-formaat: blad met kolommen "URL-alias", "Medianaam" en "Gemeente".
// Als er een Gemeente-kolom is, wordt de gemeente per rij daaruit gehaald; anders wordt
// de meegegeven fallback-gemeente gebruikt.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fallbackGemeente = formData.get('gemeente');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'geen bestand ontvangen' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseVideoXlsx(
      buffer,
      typeof fallbackGemeente === 'string' ? fallbackGemeente : undefined
    );

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            'geen rijen met een gemeente gevonden. Kies een gemeente als het bestand geen Gemeente-kolom heeft.',
        },
        { status: 400 }
      );
    }

    // Dedupe tegen bestaande video's (op exacte URL) en binnen de invoer.
    const urls = parsed.rows.map((r) => r.url);
    const existing = await prisma.video.findMany({
      where: { url: { in: urls } },
      select: { url: true },
    });
    const existingSet = new Set(existing.map((v) => v.url));

    const seen = new Set<string>();
    const toCreate = [];
    let skipped = 0;
    for (const row of parsed.rows) {
      if (seen.has(row.url) || existingSet.has(row.url)) {
        skipped++;
        continue;
      }
      seen.add(row.url);
      toCreate.push(row);
    }

    const last = await prisma.video.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    let nextOrder = (last?.sortOrder ?? -1) + 1;

    const created = await prisma.$transaction(
      toCreate.map((row) =>
        prisma.video.create({
          data: {
            gemeente: row.gemeente,
            titel: row.titel,
            url: row.url,
            sortOrder: nextOrder++,
            phases: { create: VIDEO_PHASES.map((phase, i) => ({ phase, sortOrder: i })) },
          },
          include: { phases: { orderBy: { sortOrder: 'asc' } } },
        })
      )
    );

    return NextResponse.json(
      { created: created.length, skipped, usedGemeenteColumn: parsed.usedGemeenteColumn, videos: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error importing videos:', error);
    return NextResponse.json({ error: 'Failed to import videos' }, { status: 500 });
  }
}
