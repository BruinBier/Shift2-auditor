import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAllMVPTests } from '@/lib/crawler/tests';
import { runSingleTestByName, getAvailableTestNames } from '@/lib/crawler/test-runner';
import { fetchHtmlWithBrowser } from '@/lib/crawler/browser-crawler';

/**
 * POST /api/sample-items/[id]/crawler
 * Initiates crawler tests for a specific sample item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse request body to get optional testName
    const body = await request.json().catch(() => ({}));
    const testName = body.testName as string | undefined;

    // If testName is provided, validate it
    if (testName) {
      const availableTests = getAvailableTestNames();
      if (!availableTests.includes(testName)) {
        return NextResponse.json(
          {
            error: 'Invalid test name',
            availableTests: availableTests,
          },
          { status: 400 }
        );
      }
    }

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

    console.log(`[CRAWLER] Starting browser-based crawler for sample item: ${sampleItem.title} (${sampleItem.url})`);
    if (testName) {
      console.log(`[CRAWLER] Debug mode: Running single test "${testName}"`);
    }

    // Fetch the HTML content using browser-based crawler
    // This will execute JavaScript and handle cookie consent dialogs
    let html: string;
    let usedBrowser = false;

    try {
      console.log(`[CRAWLER] ========================================`);
      console.log(`[CRAWLER] Attempting to use Puppeteer for ${sampleItem.url}`);
      console.log(`[CRAWLER] ========================================`);

      html = await fetchHtmlWithBrowser(sampleItem.url, {
        userAgent: 'Shift2-Auditor/1.0 (Accessibility Crawler; +https://shift2.nl)',
        waitTime: 3000, // Wait 3 seconds for lazy-loaded content (like videos)
      });

      usedBrowser = true;

      console.log(`[CRAWLER] ========================================`);
      console.log(`[CRAWLER] ✓ Successfully used Puppeteer - Fetched ${html.length} bytes`);
      console.log(`[CRAWLER] ========================================`);

    } catch (browserError) {
      console.error('[CRAWLER] ========================================');
      console.error('[CRAWLER] ⚠️ Puppeteer failed, falling back to simple fetch');
      console.error('[CRAWLER] Puppeteer error:', browserError instanceof Error ? browserError.message : 'Unknown');
      console.error('[CRAWLER] ========================================');

      // Fallback to simple fetch
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
        console.log(`[CRAWLER] ✓ Fallback fetch succeeded - ${html.length} bytes`);
      } catch (fetchError) {
        console.error('[CRAWLER] ✗ Both Puppeteer and fallback fetch failed!');
        return NextResponse.json({
          error: 'Failed to fetch URL with both browser and fallback',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        }, { status: 500 });
      }
    }

    // Debug: check if video/iframe is in HTML
    const hasVideo = html.includes('<video') || html.includes('video');
    const hasIframe = html.includes('<iframe') || html.includes('iframe');
    const hasYouTube = html.includes('youtube.com') || html.includes('youtu.be');
    const hasVimeo = html.includes('vimeo.com');

    console.log(`[CRAWLER DEBUG] Method used: ${usedBrowser ? 'Puppeteer (with JS)' : 'Simple fetch (no JS)'}`);
    console.log(`[CRAWLER DEBUG] HTML size: ${html.length} bytes`);
    console.log(`[CRAWLER DEBUG] Contains <video>: ${hasVideo}`);
    console.log(`[CRAWLER DEBUG] Contains <iframe>: ${hasIframe}`);
    console.log(`[CRAWLER DEBUG] Contains YouTube: ${hasYouTube}`);
    console.log(`[CRAWLER DEBUG] Contains Vimeo: ${hasVimeo}`);

    // Delete existing crawler results for this sample item
    await prisma.crawlerResult.deleteMany({
      where: { sampleItemId: params.id },
    });

    // Run tests on the HTML (either single test or all tests)
    let testResults;
    if (testName) {
      // Run single test in debug mode
      const singleTestResult = await runSingleTestByName(html, testName);
      testResults = singleTestResult.results;
      console.log(`[CRAWLER] Debug mode: Ran 1 test "${testName}"`);
    } else {
      // Run all tests
      testResults = runAllMVPTests(html);
      console.log(`[CRAWLER] Ran ${testResults.length} tests`);
    }

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
      message: testName ? `Debug mode: Single test "${testName}" completed` : 'Crawler initiated successfully',
      url: sampleItem.url,
      testsRun: results.length,
      testsFound: results.filter(r => r.found).length,
      crawledAt: new Date(),
      debugMode: !!testName,
      testName: testName,
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
