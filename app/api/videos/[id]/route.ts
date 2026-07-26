import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGemeente } from '@/lib/videoPhases';

// GET: één video met fasen.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({
      where: { id },
      include: { phases: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

// PUT: gemeente/titel/url bewerken (raakt fasen/tijd niet).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: { gemeente?: string; titel?: string; url?: string; notities?: string | null } = {};
    if (body.gemeente !== undefined) {
      if (!isGemeente(body.gemeente)) {
        return NextResponse.json({ error: 'ongeldige gemeente' }, { status: 400 });
      }
      data.gemeente = body.gemeente;
    }
    if (body.titel !== undefined) {
      if (!body.titel?.trim()) {
        return NextResponse.json({ error: 'titel mag niet leeg zijn' }, { status: 400 });
      }
      data.titel = body.titel.trim();
    }
    if (body.url !== undefined) {
      if (!body.url?.trim()) {
        return NextResponse.json({ error: 'url mag niet leeg zijn' }, { status: 400 });
      }
      data.url = body.url.trim();
    }
    if (body.notities !== undefined) {
      const n = typeof body.notities === 'string' ? body.notities : '';
      data.notities = n.trim() ? n : null;
    }

    const video = await prisma.video.update({
      where: { id },
      data,
      include: { phases: { orderBy: { sortOrder: 'asc' } } },
    });
    return NextResponse.json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

// DELETE: video + fasen (cascade).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.video.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
