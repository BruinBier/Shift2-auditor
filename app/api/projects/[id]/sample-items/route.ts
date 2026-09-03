import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = { projectId: params.id };
    if (type && ['structured', 'random', 'pdf'].includes(type)) {
      where.sampleType = type;
    }

    const sampleItems = await prisma.sampleItem.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { occurrences: true },
        },
      },
    });

    return NextResponse.json(sampleItems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sample items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    let screenshotPath: string | null = null;

    // If makeScreenshot is true and URL is provided, create a screenshot
    if (body.makeScreenshot && body.url) {
      try {
        // Call the scan-url API to generate screenshot
        const scanResponse = await fetch(`${request.nextUrl.origin}/api/scan-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: body.url }),
        });

        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          screenshotPath = scanData.screenshot;
        }
      } catch (error) {
        console.error('Failed to create screenshot:', error);
        // Continue creating the sample item even if screenshot fails
      }
    }

    // Achteraan de lijst als er geen plek is meegegeven. De UI rekent zelf een
    // orderIndex uit, de CLI niet -- en dan bleef hij null, waardoor de sortering
    // op orderIndex de volgorde liet vallen.
    let orderIndex = body.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const laatste = await prisma.sampleItem.findFirst({
        where: { projectId: params.id },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      orderIndex = (laatste?.orderIndex ?? 0) + 1;
    }

    const sampleItem = await prisma.sampleItem.create({
      data: {
        projectId: params.id,
        sampleType: body.sampleType,
        title: body.title,
        url: body.url,
        description: body.description || '',
        orderIndex,
        makeScreenshot: body.makeScreenshot || false,
        screenshotPath: screenshotPath,
        // Door een agent voorgesteld en nog niet nagekeken. Ontbreekt deze regel,
        // dan komt de steekproef er als goedgekeurd in en valt de poort stil weg.
        voorgesteld: body.voorgesteld === true,
        // Blijft staan waar `voorgesteld` vervalt, zodat een goedgekeurd voorstel te
        // onderscheiden is van een sample die de onderzoeker zelf heeft ingevoerd.
        vanAgent: body.voorgesteld === true,
      },
    });
    return NextResponse.json(sampleItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sample item' }, { status: 500 });
  }
}
