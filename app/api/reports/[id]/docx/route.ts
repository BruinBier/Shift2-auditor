import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
import HTMLToDocx from 'html-to-docx';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let browser = null;

  try {
    const { id } = await context.params;
    console.log('[DOCX] Starting Word document generation for project:', id);

    // Fetch project - we need basic info and research type for title page
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        subject: true,
        version: true,
        researchType: true,
      },
    });

    if (!project) {
      console.error('[DOCX] Project not found:', id);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[DOCX] Project found, launching browser...');

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

    console.log('[DOCX] Browser launched, creating page...');
    const page = await browser.newPage();

    // Get the full URL to the report page
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const reportUrl = `${protocol}://${host}/report/${id}?pdf=true`;

    console.log('[DOCX] Navigating to:', reportUrl);

    // Navigate to the report page
    await page.goto(reportUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log('[DOCX] Page loaded, waiting for content...');

    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Wait for React to hydrate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Open all accordions for Word document
    await page.evaluate(() => {
      // Click all accordion buttons to open them
      const buttons = document.querySelectorAll('button[aria-expanded="false"]');
      buttons.forEach(button => (button as HTMLButtonElement).click());
    });

    // Wait for accordions to open
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[DOCX] Extracting HTML content...');

    // Get the HTML content of the report (just the innerHTML)
    const reportContentHtml = await page.evaluate(() => {
      // Get the main content area
      const mainContent = document.querySelector('.col-span-2');
      if (!mainContent) return '';
      return mainContent.innerHTML;
    });

    console.log('[DOCX] Converting logo to PNG...');

    // Use Puppeteer to convert SVG to PNG for better Word compatibility
    const logoPage = await browser.newPage();

    // Set viewport for logo
    await logoPage.setViewport({ width: 600, height: 200 });

    // Navigate to the logo
    const logoUrl = `${protocol}://${host}/shift2-logo.svg`;
    await logoPage.goto(logoUrl, { waitUntil: 'networkidle0' });

    // Take screenshot of the logo as PNG
    const logoScreenshot = await logoPage.screenshot({
      type: 'png',
      omitBackground: true,
    });

    await logoPage.close();

    // Convert PNG to base64
    const logoBase64 = logoScreenshot.toString('base64');
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;

    // Create title page
    const projectTitle = `Toegankelijkheidsonderzoek website ${project.subject || project.title}`;
    const projectSubtitle = `WCAG 2.2 AA - Deelonderzoek content - ${project.subject || project.title}`;

    // Build complete HTML document with title page
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { font-size: 24pt; font-weight: bold; }
          h2 { font-size: 18pt; font-weight: bold; margin-top: 16pt; }
          h3 { font-size: 14pt; font-weight: bold; margin-top: 12pt; }
          p { font-size: 11pt; margin-bottom: 8pt; }
          table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
          th, td { border: 1px solid #ccc; padding: 8pt; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          a { color: #2563eb; text-decoration: underline; }
          ul, ol { margin-left: 20pt; }
          li { margin-bottom: 4pt; }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div style="text-align: center; padding-top: 100pt;">
          <div style="margin-bottom: 60pt;">
            <img src="${logoDataUrl}" alt="Shift2 Logo" style="width: 300px; height: auto;" />
          </div>
          <h1 style="font-size: 32pt; font-weight: bold; color: #111827; margin-bottom: 20pt;">
            ${projectTitle}
          </h1>
          <p style="font-size: 16pt; color: #6b7280; margin-bottom: 40pt;">
            ${projectSubtitle}
          </p>
        </div>

        <!-- Page Break -->
        <div style="page-break-before: always;"></div>

        <!-- Report Content -->
        ${reportContentHtml}
      </body>
      </html>
    `;

    console.log('[DOCX] Closing browser...');
    await browser.close();
    browser = null;

    console.log('[DOCX] Converting HTML to Word document...');

    // Convert HTML to Word document using html-to-docx (with logo)
    const docxBuffer = await HTMLToDocx(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    // Generate filename
    const fileName = `rapport-${project.subject || project.title}-v${project.version}.docx`.replace(/[^a-zA-Z0-9.-]/g, '_');

    console.log('[DOCX] Sending Word document:', fileName);

    // Return Word document as download
    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[DOCX] Error generating Word document:', error);

    // Make sure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[DOCX] Error closing browser:', e);
      }
    }

    return NextResponse.json({
      error: 'Failed to generate Word document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}