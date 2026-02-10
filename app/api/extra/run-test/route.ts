import { NextRequest, NextResponse } from 'next/server';
import { runSingleTest } from '@/lib/crawler/tests';
import { fetchHtmlWithBrowser } from '@/lib/crawler/browser-crawler';

/**
 * POST /api/extra/run-test
 * Run a single test without saving to database
 * For debugging and development purposes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, html, testName } = body;

    if (!testName) {
      return NextResponse.json(
        { error: 'testName is verplicht' },
        { status: 400 }
      );
    }

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

    // Run the test
    const result = runSingleTest(htmlToTest, testName);

    if (!result) {
      return NextResponse.json(
        { error: `Test "${testName}" niet gevonden` },
        { status: 404 }
      );
    }

    // Return the result (NOT saved to database)
    return NextResponse.json({
      result,
      source: url ? 'url' : 'html',
      testedUrl: url || null,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error running test:', error);
    return NextResponse.json(
      {
        error: 'Er ging iets mis bij het draaien van de test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}