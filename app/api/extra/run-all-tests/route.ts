import { NextRequest, NextResponse } from 'next/server';
import { runAllMVPTests } from '@/lib/crawler/tests';
import { fetchHtmlWithBrowser } from '@/lib/crawler/browser-crawler';

/**
 * POST /api/extra/run-all-tests
 * Run all tests without saving to database
 * For debugging and development purposes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, html } = body;

    if (!url && !html) {
      return NextResponse.json(
        { error: 'Geef een URL of HTML op' },
        { status: 400 }
      );
    }

    let htmlToTest: string;

    // If URL is provided, fetch it with Puppeteer
    if (url) {
      try {
        htmlToTest = await fetchHtmlWithBrowser(url, {
          waitTime: 3000, // Extra wait time for JavaScript to load videos/iframes
        });
      } catch (error) {
        console.error('Error fetching URL:', error);
        return NextResponse.json(
          {
            error: 'Kon URL niet ophalen',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else {
      // Use provided HTML
      htmlToTest = html;
    }

    // Run all tests
    const results = runAllMVPTests(htmlToTest);

    // Calculate summary statistics
    const totalTests = results.length;
    const testsFound = results.filter(r => r.found).length;
    const testsPassed = totalTests - testsFound;

    // Return the results (NOT saved to database)
    return NextResponse.json({
      results,
      summary: {
        totalTests,
        testsFound,
        testsPassed,
      },
      source: url ? 'url' : 'html',
      testedUrl: url || null,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error running all tests:', error);
    return NextResponse.json(
      {
        error: 'Er ging iets mis bij het draaien van de tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}