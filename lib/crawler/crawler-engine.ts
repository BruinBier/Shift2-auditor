/**
 * Crawler Engine
 * Orchestrates site discovery, test execution, and result storage
 */

import { PrismaClient } from '@prisma/client';
import { discoverSite, discoverLinksOnPage } from './discovery';
import { runTests } from './test-runner';
import { fetchHtmlWithBrowser, closeBrowser } from './browser-crawler';

const prisma = new PrismaClient();

export interface CrawlerConfig {
  maxDepth?: number;
  maxPages?: number;
  userAgent?: string;
  delayMs?: number; // Delay between requests
}

export interface CrawlResult {
  projectId: string;
  totalUrls: number;
  urlsProcessed: number;
  urlsFailed: number;
  totalIssuesFound: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Crawl a single URL and run tests
 */
export async function crawlUrl(
  url: string,
  scopeUrlId: string,
  config?: CrawlerConfig
): Promise<void> {
  console.log(`[CRAWLER] Processing ${url}`);

  try {
    // Fetch HTML using Puppeteer (executes JavaScript)
    const html = await fetchHtmlWithBrowser(url, {
      userAgent: config?.userAgent || 'Shift2-Auditor/1.0 (Accessibility Crawler)',
      waitTime: 3000, // Wait 3 seconds for dynamic content to load
    });

    // Run all tests
    const testResults = await runTests(html);

    // Store results in database
    console.log(`[CRAWLER] Storing ${testResults.results.length} test results`);

    // Delete existing results for this URL to avoid duplicates
    await prisma.crawlerResult.deleteMany({
      where: { scopeUrlId },
    });

    // Insert new results
    await prisma.crawlerResult.createMany({
      data: testResults.results.map(result => ({
        scopeUrlId,
        testId: result.testId,
        testName: result.testName,
        found: result.found,
        count: result.count,
        details: result.details ? JSON.stringify(result.details) : null,
      })),
    });

    // Update crawled timestamp
    await prisma.projectScopeUrl.update({
      where: { id: scopeUrlId },
      data: { crawledAt: new Date() },
    });

    console.log(`[CRAWLER] ✓ Completed ${url} - Found ${testResults.testsFound} issues`);

  } catch (error) {
    console.error(`[CRAWLER] ✗ Failed to crawl ${url}:`, error);
    throw error;
  }
}

/**
 * Crawl an entire project scope
 */
export async function crawlProject(
  projectId: string,
  config?: CrawlerConfig
): Promise<CrawlResult> {
  const startedAt = new Date();
  const result: CrawlResult = {
    projectId,
    totalUrls: 0,
    urlsProcessed: 0,
    urlsFailed: 0,
    totalIssuesFound: 0,
    startedAt,
  };

  console.log(`[CRAWLER] Starting project crawl: ${projectId}`);

  try {
    // Get all in-scope URLs
    const scopeUrls = await prisma.projectScopeUrl.findMany({
      where: {
        projectId,
        inScope: true,
      },
    });

    result.totalUrls = scopeUrls.length;
    console.log(`[CRAWLER] Found ${result.totalUrls} URLs to crawl`);

    // Process each URL
    for (const scopeUrl of scopeUrls) {
      try {
        await crawlUrl(scopeUrl.url, scopeUrl.id, config);
        result.urlsProcessed++;

        // Delay between requests to be respectful
        if (config?.delayMs && result.urlsProcessed < result.totalUrls) {
          await new Promise(resolve => setTimeout(resolve, config.delayMs));
        }

      } catch (error) {
        console.error(`[CRAWLER] Failed to process ${scopeUrl.url}`, error);
        result.urlsFailed++;
      }
    }

    // Count total issues
    const issueCount = await prisma.crawlerResult.count({
      where: {
        scopeUrl: {
          projectId,
        },
        found: true,
      },
    });

    result.totalIssuesFound = issueCount;
    result.completedAt = new Date();

    console.log(`[CRAWLER] Project crawl completed`);
    console.log(`[CRAWLER] URLs processed: ${result.urlsProcessed}/${result.totalUrls}`);
    console.log(`[CRAWLER] Total issues found: ${result.totalIssuesFound}`);

    // Close the browser
    await closeBrowser();

    return result;

  } catch (error) {
    console.error(`[CRAWLER] Project crawl failed:`, error);
    // Close the browser on error as well
    await closeBrowser();
    throw error;
  }
}

/**
 * Discover and add URLs to project scope
 */
export async function discoverAndAddUrls(
  projectId: string,
  startUrl: string,
  config?: CrawlerConfig
): Promise<number> {
  console.log(`[CRAWLER] Discovering URLs from ${startUrl}`);

  const discovered = await discoverSite(
    startUrl,
    config?.maxDepth || 2,
    config?.maxPages || 100
  );

  console.log(`[CRAWLER] Discovered ${discovered.length} URLs`);

  let addedCount = 0;

  for (const page of discovered) {
    // Check if URL already exists
    const existing = await prisma.projectScopeUrl.findFirst({
      where: {
        projectId,
        url: page.url,
      },
    });

    if (!existing) {
      await prisma.projectScopeUrl.create({
        data: {
          projectId,
          url: page.url,
          title: page.title,
          inScope: page.isInternal,
        },
      });
      addedCount++;
    }
  }

  console.log(`[CRAWLER] Added ${addedCount} new URLs to project scope`);
  return addedCount;
}

/**
 * Get crawler results summary for a project
 */
export async function getProjectCrawlerSummary(projectId: string) {
  const scopeUrls = await prisma.projectScopeUrl.findMany({
    where: { projectId },
    include: {
      crawlerResults: true,
    },
  });

  const summary = {
    totalUrls: scopeUrls.length,
    crawledUrls: scopeUrls.filter(url => url.crawledAt).length,
    totalTests: 0,
    totalIssues: 0,
    criticalIssues: 0,
    byTest: new Map<string, number>(),
  };

  scopeUrls.forEach(url => {
    url.crawlerResults.forEach(result => {
      summary.totalTests++;
      if (result.found) {
        summary.totalIssues++;

        // Try to determine if critical
        try {
          const details = result.details ? JSON.parse(result.details) : {};
          if (details.critical) {
            summary.criticalIssues++;
          }
        } catch {
          // Invalid JSON, skip
        }

        // Count by test type
        const count = summary.byTest.get(result.testName) || 0;
        summary.byTest.set(result.testName, count + result.count);
      }
    });
  });

  return {
    ...summary,
    byTest: Object.fromEntries(summary.byTest),
  };
}

export { prisma };