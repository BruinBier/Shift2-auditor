import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crawlProject, getProjectCrawlerSummary } from '@/lib/crawler/crawler-engine';

/**
 * POST /api/projects/[id]/crawler
 * Crawls all scope URLs for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));

    const config = {
      maxDepth: body.maxDepth || 2,
      maxPages: body.maxPages || 100,
      delayMs: body.delayMs || 1000, // 1 second delay between requests
    };

    console.log(`[CRAWLER] Starting project crawl for project ${params.id}`);
    console.log(`[CRAWLER] Config:`, config);

    // Create a crawler run record
    const crawlerRun = await prisma.crawlerRun.create({
      data: {
        projectId: params.id,
        status: 'running',
        config: JSON.stringify(config),
      },
    });

    try {
      // Execute the crawl
      const result = await crawlProject(params.id, config);

      // Update crawler run with results
      await prisma.crawlerRun.update({
        where: { id: crawlerRun.id },
        data: {
          status: 'completed',
          totalUrls: result.totalUrls,
          urlsProcessed: result.urlsProcessed,
          urlsFailed: result.urlsFailed,
          totalIssues: result.totalIssuesFound,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Project crawl completed successfully',
        runId: crawlerRun.id,
        ...result,
      }, { status: 200 });

    } catch (crawlError) {
      // Mark run as failed
      await prisma.crawlerRun.update({
        where: { id: crawlerRun.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
        },
      });

      throw crawlError;
    }

  } catch (error) {
    console.error('[CRAWLER] Error crawling project:', error);
    return NextResponse.json({
      error: 'Failed to crawl project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/projects/[id]/crawler
 * Gets crawler summary for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const summary = await getProjectCrawlerSummary(params.id);

    // Get recent crawler runs
    const recentRuns = await prisma.crawlerRun.findMany({
      where: { projectId: params.id },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      summary,
      recentRuns,
    }, { status: 200 });

  } catch (error) {
    console.error('[CRAWLER] Error fetching crawler summary:', error);
    return NextResponse.json({
      error: 'Failed to fetch crawler summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}