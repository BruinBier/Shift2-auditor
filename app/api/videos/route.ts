import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VIDEO_PHASES, isGemeente } from '@/lib/videoPhases';

// GET: alle video's met hun 5 fasen.
export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      include: { phases: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

// POST: één video aanmaken + de 5 vaste fase-rijen seeden.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isGemeente(body.gemeente)) {
      return NextResponse.json(
        { error: 'gemeente moet cranendonck, heeze_leende of valkenswaard zijn' },
        { status: 400 }
      );
    }
    if (!body.titel?.trim() || !body.url?.trim()) {
      return NextResponse.json({ error: 'titel en url zijn verplicht' }, { status: 400 });
    }

    const last = await prisma.video.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const video = await prisma.video.create({
      data: {
        gemeente: body.gemeente,
        titel: body.titel.trim(),
        url: body.url.trim(),
        sortOrder: (last?.sortOrder ?? -1) + 1,
        phases: {
          create: VIDEO_PHASES.map((phase, i) => ({ phase, sortOrder: i })),
        },
      },
      include: { phases: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
