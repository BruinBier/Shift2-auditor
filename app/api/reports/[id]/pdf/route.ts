import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let browser = null;

  try {
    const { id } = await context.params;
    console.log('[PDF] Starting PDF generation for project:', id);

    // Fetch project - we only need basic info for filename
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        subject: true,
        version: true,
      },
    });

    if (!project) {
      console.error('[PDF] Project not found:', id);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[PDF] Project found, launching browser...');

    // Launch Puppeteer with Windows-compatible settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
    });

    console.log('[PDF] Browser launched, creating page...');
    const page = await browser.newPage();

    // Get the full URL to the report page
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const reportUrl = `${protocol}://${host}/report/${id}?pdf=true`;

    console.log('[PDF] Navigating to:', reportUrl);

    // Navigate to the report page
    await page.goto(reportUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log('[PDF] Page loaded, waiting for content...');

    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Wait for React to hydrate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Open all accordions for PDF
    await page.evaluate(() => {
      // Click all accordion buttons to open them
      const buttons = document.querySelectorAll('button[aria-expanded="false"]');
      buttons.forEach(button => (button as HTMLButtonElement).click());
    });

    // Wait for accordions to open
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[PDF] Generating accessible PDF...');

    // Set PDF metadata for accessibility
    await page.evaluateOnNewDocument((metadata) => {
      // @ts-ignore
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.pdfMetadata = metadata;
      }
    }, {
      title: `Toegankelijkheidsrapport - ${project.subject || project.title}`,
      author: 'Shift2 Auditor',
      subject: `WCAG 2.2 Toegankelijkheidsonderzoek - ${project.subject || project.title}`,
      creator: 'Shift2 Auditor',
      keywords: 'WCAG, toegankelijkheid, accessibility, audit, rapport',
    });

    // Generate PDF with accessibility settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false, // No page numbers
      tagged: true, // Enable tagged PDF for better accessibility
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    console.log('[PDF] PDF generated, closing browser...');
    await browser.close();
    browser = null;

    // Generate filename
    const fileName = `rapport-${project.subject || project.title}-v${project.version}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');

    console.log('[PDF] Sending PDF:', fileName);

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);

    // Make sure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[PDF] Error closing browser:', e);
      }
    }

    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}