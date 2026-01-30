import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAllMVPTests } from '@/lib/crawler/tests';

/**
 * POST /api/projects/[id]/scope-urls/[urlId]/crawler
 * Initiates crawler for a specific scope URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    // Get the scope URL
    const scopeUrl = await prisma.projectScopeUrl.findUnique({
      where: { id: params.urlId },
    });

    if (!scopeUrl) {
      return NextResponse.json(
        { error: 'Scope URL not found' },
        { status: 404 }
      );
    }

    console.log(`[CRAWLER] Starting crawler for URL: ${scopeUrl.url}`);

    // Fetch the HTML content
    let html: string;
    try {
      const response = await fetch(scopeUrl.url, {
        headers: {
          'User-Agent': 'Shift2-Auditor/1.0 (Accessibility Crawler)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      html = await response.text();
      console.log(`[CRAWLER] Fetched ${html.length} bytes from ${scopeUrl.url}`);
    } catch (fetchError) {
      console.error('[CRAWLER] Error fetching URL:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch URL',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      }, { status: 500 });
    }

    // Delete existing crawler results for this URL
    await prisma.crawlerResult.deleteMany({
      where: { scopeUrlId: params.urlId },
    });

    // Run all MVP tests on the HTML
    const testResults = runAllMVPTests(html);
    console.log(`[CRAWLER] Ran ${testResults.length} tests`);

    // Save crawler results to database
    const results = testResults.map(test => ({
      scopeUrlId: params.urlId,
      testId: test.testId,
      testName: test.testName,
      found: test.found,
      count: test.count,
      details: JSON.stringify(test.details || {}),
    }));

    await prisma.crawlerResult.createMany({
      data: results,
    });

    // Update the scopeUrl with crawledAt timestamp
    await prisma.projectScopeUrl.update({
      where: { id: params.urlId },
      data: { crawledAt: new Date() },
    });

    console.log(`[CRAWLER] Completed crawler for URL: ${scopeUrl.url}`);
    console.log(`[CRAWLER] Found ${results.filter(r => r.found).length} positive tests`);

    return NextResponse.json({
      success: true,
      message: 'Crawler initiated successfully',
      url: scopeUrl.url,
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
 * GET /api/projects/[id]/scope-urls/[urlId]/crawler
 * Gets crawler results for a specific scope URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    const scopeUrl = await prisma.projectScopeUrl.findUnique({
      where: { id: params.urlId },
      include: {
        crawlerResults: {
          orderBy: { testName: 'asc' },
        },
      },
    });

    if (!scopeUrl) {
      return NextResponse.json(
        { error: 'Scope URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: scopeUrl.url,
      crawledAt: scopeUrl.crawledAt,
      results: scopeUrl.crawlerResults,
      totalTests: scopeUrl.crawlerResults.length,
      testsFound: scopeUrl.crawlerResults.filter(r => r.found).length,
    }, { status: 200 });

  } catch (error) {
    console.error('[CRAWLER] Error fetching crawler results:', error);
    return NextResponse.json({
      error: 'Failed to fetch crawler results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}