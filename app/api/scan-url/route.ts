import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import axeCore from 'axe-core';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is verplicht' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Ongeldige URL format' },
        { status: 400 }
      );
    }

    console.log(`Starting scan with Puppeteer for: ${url}`);

    // Create snapshots directory
    const snapshotsDir = path.join(process.cwd(), 'public', '__visual-snapshots__');
    await fs.mkdir(snapshotsDir, { recursive: true });

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Generate safe filename from URL
      const urlObj = new URL(url);
      const safeName = `${urlObj.hostname.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}`;
      const screenshotPath = path.join(snapshotsDir, `${safeName}.png`);
      const screenshotPublicPath = `/__visual-snapshots__/${safeName}.png`;

      // Take screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`Screenshot saved: ${screenshotPath}`);

      // axe-core komt uit node_modules, niet van een CDN. Het pakket levert zijn eigen
      // broncode als string (axe.source) juist om in een pagina geinjecteerd te worden.
      // Zo draait de scan op de versie uit package.json, werkt hij zonder internet, en
      // kan een uitslag niet veranderen doordat een CDN iets anders serveert dan gisteren.
      await page.evaluate(axeCore.source);

      await page.waitForFunction('typeof axe !== "undefined"');

      const axeResults = await page.evaluate(async () => {
        // @ts-ignore
        const results = await axe.run();
        return {
          violations: results.violations,
          passes: results.passes,
          incomplete: results.incomplete,
          inapplicable: results.inapplicable
        };
      });

      console.log(`Scan completed for: ${url}`);
      console.log(`Found ${axeResults.violations.length} violations (axe-core ${axeCore.version})`);
      console.log(`Screenshot available at: ${screenshotPublicPath}`);

      return NextResponse.json({
        success: true,
        url: url,
        timestamp: new Date().toISOString(),
        screenshot: screenshotPublicPath,
        motor: { naam: 'axe-core', versie: axeCore.version },
        results: axeResults
      });

    } finally {
      await browser.close();
    }

  } catch (error: any) {
    console.error('Error during scan:', error);

    return NextResponse.json(
      {
        error: 'Er is een fout opgetreden tijdens het scannen',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST a URL to scan',
    example: {
      url: 'https://example.com'
    }
  });
}