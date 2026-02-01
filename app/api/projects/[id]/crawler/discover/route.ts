import { NextRequest, NextResponse } from 'next/server';
import { discoverAndAddUrls } from '@/lib/crawler/crawler-engine';

/**
 * POST /api/projects/[id]/crawler/discover
 * Discovers URLs from a starting URL and adds them to project scope
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { startUrl, maxDepth, maxPages } = body;

    if (!startUrl) {
      return NextResponse.json(
        { error: 'startUrl is required' },
        { status: 400 }
      );
    }

    console.log(`[DISCOVERY] Starting URL discovery for project ${params.id}`);
    console.log(`[DISCOVERY] Start URL: ${startUrl}`);

    const addedCount = await discoverAndAddUrls(
      params.id,
      startUrl,
      {
        maxDepth: maxDepth || 2,
        maxPages: maxPages || 100,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Discovered and added ${addedCount} new URLs`,
      addedCount,
    }, { status: 200 });

  } catch (error) {
    console.error('[DISCOVERY] Error discovering URLs:', error);
    return NextResponse.json({
      error: 'Failed to discover URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}