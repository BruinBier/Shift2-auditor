import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateReportHtml } from '@/lib/generate-report-html';
import { makePdfAccessible } from '@/lib/pdf-accessibility';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120;

/**
 * Toegankelijke PDF-export.
 *
 * De rapport-HTML is de bron: die is al semantisch correct (koppen, tabellen met
 * thead/th, lijsten). Chrome zet dat om naar een getagde PDF en behoudt daarbij
 * de TH-cellen. Wat Chrome laat liggen (THead-groepering, LBody, linkbeschrijvingen
 * en de PDF/UA-metadata) wordt daarna in de PDF zelf hersteld.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  let browser = null;

  try {
    const html = await generateReportHtml(params.id);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { title: true },
    });

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    const rawPdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      tagged: true,
      displayHeaderFooter: false,
      margin: { top: '18mm', right: '15mm', bottom: '18mm', left: '15mm' },
    });

    await browser.close();
    browser = null;

    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = (titleMatch?.[1] ?? project?.title ?? 'Rapport').trim();

    // Tekstalternatief van het logo uit de HTML halen; Chrome tagt die
    // afbeelding zelf niet, dus geven we de alt-tekst apart mee.
    const logoAlt = html.match(/<img[^>]*\salt="([^"]*)"/i)?.[1];

    const { pdf, stats } = await makePdfAccessible(new Uint8Array(rawPdf), {
      title,
      language: 'nl-NL',
      imageAltText: logoAlt,
    });

    console.log(
      `[accessible-pdf] ${stats.tablesGrouped} tabellen, ` +
        `${stats.listItemsWrapped} lijstitems, ${stats.linksLabelled} links ` +
        `(${stats.wcagLinksLabelled} WCAG-titels)`
    );

    // De bestandsnaam is de rapporttitel zelf ("WCAG 2.2 AA deelonderzoek
    // content website duurzaam.beverwijk.nl"), zodat het bestand herkenbaar is
    // zonder het te openen. Alleen tekens die in een bestandsnaam problemen
    // geven worden vervangen.
    const filename =
      `${title.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()}.pdf`;

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // filename* met UTF-8 zodat accenten en spaties intact blijven; de
        // kale filename is de terugval voor oudere browsers.
        'Content-Disposition':
          `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, '_')}"; ` +
          `filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Accessible PDF generation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
