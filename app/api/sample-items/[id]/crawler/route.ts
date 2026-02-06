import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAllMVPTests } from '@/lib/crawler/tests';

/**
 * POST /api/sample-items/[id]/crawler
 * Initiates crawler tests for a specific sample item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the sample item
    const sampleItem = await prisma.sampleItem.findUnique({
      where: { id: params.id },
    });

    if (!sampleItem) {
      return NextResponse.json(
        { error: 'Sample item not found' },
        { status: 404 }
      );
    }

    if (!sampleItem.url) {
      return NextResponse.json(
        { error: 'Sample item has no URL' },
        { status: 400 }
      );
    }

    console.log(`[CRAWLER] Starting crawler for sample item: ${sampleItem.title} (${sampleItem.url})`);

    // Fetch the HTML content
    let html: string;
    try {
      const response = await fetch(sampleItem.url, {
        headers: {
          'User-Agent': 'Shift2-Auditor/1.0 (Accessibility Crawler)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      html = await response.text();
      console.log(`[CRAWLER] Fetched ${html.length} bytes from ${sampleItem.url}`);
    } catch (fetchError) {
      console.error('[CRAWLER] Error fetching URL:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch URL',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      }, { status: 500 });
    }

    // Delete existing crawler results for this sample item
    await prisma.crawlerResult.deleteMany({
      where: { sampleItemId: params.id },
    });

    // Run all MVP tests on the HTML
    const testResults = runAllMVPTests(html);
    console.log(`[CRAWLER] Ran ${testResults.length} tests`);

    // Save crawler results to database
    const results = testResults.map(test => ({
      sampleItemId: params.id,
      testId: test.testId,
      testName: test.testName,
      found: test.found,
      count: test.count,
      details: JSON.stringify(test.details || {}),
    }));

    await prisma.crawlerResult.createMany({
      data: results,
    });

    // Update the sample item with crawledAt timestamp
    await prisma.sampleItem.update({
      where: { id: params.id },
      data: { crawledAt: new Date() },
    });

    console.log(`[CRAWLER] Completed crawler for sample item: ${sampleItem.title}`);
    console.log(`[CRAWLER] Found ${results.filter(r => r.found).length} positive tests`);

    return NextResponse.json({
      success: true,
      message: 'Crawler initiated successfully',
      url: sampleItem.url,
      testsRun: results.length,
      testsFound: results.filter(r => r.found).length,
      crawledAt: new Date(),
    }, { status: 200 });

  } catch (error) {
    console.error('[CRAWLER] Error initiating crawler:', error);
    return NextResponse.json({
      error: 'Failed to initiate crawler',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/sample-items/[id]/crawler
 * Gets crawler results for a specific sample item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sampleItem = await prisma.sampleItem.findUnique({
      where: { id: params.id },
      include: {
        crawlerResults: {
          orderBy: { testName: 'asc' },
        },
      },
    });

    if (!sampleItem) {
      return NextResponse.json(
        { error: 'Sample item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: sampleItem.url,
      crawledAt: sampleItem.crawledAt,
      results: sampleItem.crawlerResults,
      totalTests: sampleItem.crawlerResults.length,
      testsFound: sampleItem.crawlerResults.filter(r => r.found).length,
    }, { status: 200 });

  } catch (error) {
    console.error('[CRAWLER] Error fetching crawler results:', error);
    return NextResponse.json({
      error: 'Failed to fetch crawler results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
