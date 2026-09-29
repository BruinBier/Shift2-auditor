import puppeteer from 'puppeteer';
import { makePdfAccessible } from '@/lib/pdf-accessibility';
import { markeerArtefacten } from './artefacten';
import { documentHtml } from './html';
import type { PdfDocument } from './model';

/**
 * Een PDF-bouwer-document omzetten naar een getagde PDF/UA-PDF.
 *
 * Zelfde route als de toegankelijke rapport-PDF (app/api/reports/[id]/accessible-pdf):
 * Chrome drukt de HTML af met tags, en makePdfAccessible vult aan wat Chrome laat liggen
 * (THead, LBody, linkbeschrijvingen, PDF/UA-metadata). Daarna wordt alles wat nog
 * ongemarkeerd is een artefact: paginanummers, decoratieve afbeeldingen, vlakken.
 */
export async function maakPdf(doc: PdfDocument): Promise<Uint8Array> {
  const html = documentHtml(doc);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    const ruw = await page.pdf({
      format: 'A4',
      printBackground: true,
      tagged: true,
      // De marges staan in @page; zo komen voorbeeld en PDF overeen.
      preferCSSPageSize: true,
      displayHeaderFooter: doc.paginanummers,
      headerTemplate: '<span></span>',
      footerTemplate: doc.paginanummers
        ? `<div style="width:100%;text-align:center;font-family:${doc.lettertype},Arial,sans-serif;font-size:9px;color:#555;">` +
          `<span class="pageNumber"></span> / <span class="totalPages"></span></div>`
        : '<span></span>',
    });

    await browser.close();

    const { pdf: getagd } = await makePdfAccessible(new Uint8Array(ruw), {
      title: doc.titel.trim(),
      language: doc.taal.trim() || 'nl-NL',
      // Afbeeldingen die Chrome niet tagt, zijn hier altijd decoratief: elke inhoudelijke
      // afbeelding heeft een alt en die tagt Chrome zelf.
      tagUntaggedImages: false,
    });
    const { pdf } = await markeerArtefacten(getagd);
    return pdf;
  } finally {
    await browser.close().catch(() => {});
  }
}
