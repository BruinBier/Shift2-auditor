import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VIDEO_PHASES, isGemeente } from '@/lib/videoPhases';

// Voorlopige titel afleiden uit een YouTube-URL (video-id), anders de URL zelf.
// De gebruiker kan de titel later bewerken.
function tempTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\/+/, '');
      if (id) return id;
    }
    const v = u.searchParams.get('v');
    if (v) return v;
  } catch {
    // geen geldige URL — val terug op de ruwe tekst
  }
  return url;
}

// POST: bulk video's aanmaken uit geplakte URL's (één per regel).
// Body: { gemeente, text }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isGemeente(body.gemeente)) {
      return NextResponse.json({ error: 'ongeldige gemeente' }, { status: 400 });
    }

    const urls = String(body.text ?? '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      return NextResponse.json({ error: 'geen URLs opgegeven' }, { status: 400 });
    }

    // Dedupe binnen de invoer én tegen bestaande video's.
    const existing = await prisma.video.findMany({
      where: { url: { in: urls } },
      select: { url: true },
    });
    const existingSet = new Set(existing.map((v) => v.url));

    const seen = new Set<string>();
    const toCreate: string[] = [];
    let skipped = 0;
    for (const url of urls) {
      if (seen.has(url) || existingSet.has(url)) {
        skipped++;
        continue;
      }
      seen.add(url);
      toCreate.push(url);
    }

    const last = await prisma.video.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    let nextOrder = (last?.sortOrder ?? -1) + 1;

    const created = await prisma.$transaction(
      toCreate.map((url) =>
        prisma.video.create({
          data: {
            gemeente: body.gemeente,
            titel: tempTitleFromUrl(url),
            url,
            sortOrder: nextOrder++,
            phases: { create: VIDEO_PHASES.map((phase, i) => ({ phase, sortOrder: i })) },
          },
          include: { phases: { orderBy: { sortOrder: 'asc' } } },
        })
      )
    );

    return NextResponse.json({ created: created.length, skipped, videos: created }, { status: 201 });
  } catch (error) {
    console.error('Error bulk-creating videos:', error);
    return NextResponse.json({ error: 'Failed to bulk-create videos' }, { status: 500 });
  }
}
