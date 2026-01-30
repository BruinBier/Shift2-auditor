import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { discoverSite } from '@/lib/crawler/discovery';
import { runAllMVPTests } from '@/lib/crawler/tests';

/**
 * POST /api/projects/[id]/scope-urls/[urlId]/discover
 * Discovers all pages on a website and optionally crawls them
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    const body = await request.json();
    const { maxDepth = 2, maxPages = 100, crawlPages = false } = body;

    // Get the starting scope URL
    const scopeUrl = await prisma.projectScopeUrl.findUnique({
      where: { id: params.urlId },
    });

    if (!scopeUrl) {
      return NextResponse.json(
        { error: 'Scope URL not found' },
        { status: 404 }
      );
    }

    console.log(`[DISCOVER] Starting site discovery from ${scopeUrl.url}`);
    console.log(`[DISCOVER] Settings: maxDepth=${maxDepth}, maxPages=${maxPages}, crawl=${crawlPages}`);

    // Discover all pages on the site
    const discoveredPages = await discoverSite(scopeUrl.url, maxDepth, maxPages);

    console.log(`[DISCOVER] Found ${discoveredPages.length} pages`);

    // Filter to only internal pages
    const internalPages = discoveredPages.filter(page => page.isInternal);

    console.log(`[DISCOVER] ${internalPages.length} are internal pages`);

    // Get existing scope URLs to avoid duplicates
    const existingScopeUrls = await prisma.projectScopeUrl.findMany({
      where: { projectId: params.id },
      select: { url: true },
    });

    const existingUrls = new Set(existingScopeUrls.map(su => su.url));

    // Create new scope URLs for discovered pages (excluding duplicates)
    const newPages = internalPages.filter(page => !existingUrls.has(page.url));

    console.log(`[DISCOVER] Creating ${newPages.length} new scope URLs`);

    const createdScopeUrls = await Promise.all(
      newPages.map(async (page) => {
        return await prisma.projectScopeUrl.create({
          data: {
            projectId: params.id,
            url: page.url,
            title: page.title || `Discovered: ${page.url}`,
            crawlerType: 'Productieomgeving',
            inScope: true,
          },
        });
      })
    );

    console.log(`[DISCOVER] Created ${createdScopeUrls.length} scope URLs`);

    // Optionally crawl all discovered pages
    let crawledCount = 0;
    if (crawlPages) {
      console.log(`[DISCOVER] Starting to crawl ${createdScopeUrls.length} pages...`);

      for (const newScopeUrl of createdScopeUrls) {
        try {
          console.log(`[DISCOVER] Crawling ${newScopeUrl.url}...`);

          // Fetch HTML
          const response = await fetch(newScopeUrl.url, {
            headers: {
              'User-Agent': 'Shift2-Auditor/1.0 (Accessibility Crawler)',
            },
          });

          if (!response.ok) {
            console.error(`[DISCOVER] Failed to fetch ${newScopeUrl.url}: ${response.status}`);
            continue;
          }

          const html = await response.text();

          // Run tests
          const testResults = runAllMVPTests(html);

          // Save results
          const results = testResults.map(test => ({
            scopeUrlId: newScopeUrl.id,
            testId: test.testId,
            testName: test.testName,
            found: test.found,
            count: test.count,
            details: JSON.stringify(test.details || {}),
          }));

          await prisma.crawlerResult.createMany({
            data: results,
          });

          // Update crawledAt
          await prisma.projectScopeUrl.update({
            where: { id: newScopeUrl.id },
            data: { crawledAt: new Date() },
          });

          crawledCount++;
          console.log(`[DISCOVER] Crawled ${newScopeUrl.url} (${crawledCount}/${createdScopeUrls.length})`);

        } catch (error) {
          console.error(`[DISCOVER] Error crawling ${newScopeUrl.url}:`, error);
        }
      }

      console.log(`[DISCOVER] Crawling completed. Crawled ${crawledCount} pages`);
    }

    return NextResponse.json({
      success: true,
      message: 'Site discovery completed',
      discovered: {
        total: discoveredPages.length,
        internal: internalPages.length,
        new: createdScopeUrls.length,
        existing: internalPages.length - createdScopeUrls.length,
      },
      crawled: crawlPages ? crawledCount : 0,
    }, { status: 200 });

  } catch (error) {
    console.error('[DISCOVER] Error during site discovery:', error);
    return NextResponse.json({
      error: 'Failed to discover site',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}