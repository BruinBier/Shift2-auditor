/**
 * Test Runner
 * Executes all crawler tests on HTML content and aggregates results
 */

import { CrawlerTestResult, runAllMVPTests, getAvailableTests, runSingleTest } from './tests';

export interface TestRunResult {
  totalTests: number;
  testsFound: number;
  testsPassed: number;
  results: CrawlerTestResult[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
}

/**
 * Run all tests on HTML content
 */
export async function runTests(html: string): Promise<TestRunResult> {
  const results = runAllMVPTests(html);

  const testsFound = results.filter(r => r.found).length;
  const testsPassed = results.filter(r => !r.found).length;

  // Categorize by severity
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  results.forEach(result => {
    if (!result.found) return;

    if (result.details?.critical) {
      summary.critical++;
    } else if (result.details?.informational) {
      summary.informational++;
    } else {
      // Default to medium for now
      summary.medium++;
    }
  });

  return {
    totalTests: results.length,
    testsFound,
    testsPassed,
    results,
    summary,
  };
}

/**
 * Get test result by ID
 */
export function getTestById(results: CrawlerTestResult[], testId: string): CrawlerTestResult | undefined {
  return results.find(r => r.testId === testId);
}

/**
 * Filter results by criteria
 */
export function filterResults(
  results: CrawlerTestResult[],
  options: {
    onlyFailed?: boolean;
    onlyCritical?: boolean;
    onlyInformational?: boolean;
  }
): CrawlerTestResult[] {
  let filtered = results;

  if (options.onlyFailed) {
    filtered = filtered.filter(r => r.found);
  }

  if (options.onlyCritical) {
    filtered = filtered.filter(r => r.details?.critical === true);
  }

  if (options.onlyInformational) {
    filtered = filtered.filter(r => r.details?.informational === true);
  }

  return filtered;
}

/**
 * Run a single test on HTML content (for debugging)
 */
export async function runSingleTestByName(html: string, testName: string): Promise<TestRunResult> {
  const result = runSingleTest(html, testName);

  if (!result) {
    return {
      totalTests: 0,
      testsFound: 0,
      testsPassed: 0,
      results: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        informational: 0,
      },
    };
  }

  const results = [result];
  const testsFound = result.found ? 1 : 0;
  const testsPassed = result.found ? 0 : 1;

  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  if (result.found) {
    if (result.details?.critical) {
      summary.critical++;
    } else if (result.details?.informational) {
      summary.informational++;
    } else {
      summary.medium++;
    }
  }

  return {
    totalTests: 1,
    testsFound,
    testsPassed,
    results,
    summary,
  };
}

/**
 * Get list of available tests
 */
export function getAvailableTestNames(): string[] {
  return getAvailableTests();
}