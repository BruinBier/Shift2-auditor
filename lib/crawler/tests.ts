import * as cheerio from 'cheerio';

export interface CrawlerTestResult {
  testId: string;
  testName: string;
  found: boolean;
  count: number;
  details?: any;
}

/**
 * #48: LangAttributeMissingTest
 * Page has no lang-attribute
 * WCAG: Level A - Critical
 */
export function testLangAttributeMissing(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const htmlElement = $('html');
  const hasLang = htmlElement.attr('lang') !== undefined && htmlElement.attr('lang') !== '';

  return {
    testId: '48',
    testName: 'LangAttributeMissingTest',
    found: !hasLang, // Test is positive if lang is MISSING
    count: hasLang ? 0 : 1,
    details: {
      langValue: htmlElement.attr('lang') || null,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #50: TitleMissingTest
 * Page has no page title
 * WCAG: Level A - Critical
 */
export function testTitleMissing(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const title = $('title');
  const hasTitle = title.length > 0;

  return {
    testId: '50',
    testName: 'TitleMissingTest',
    found: !hasTitle,
    count: hasTitle ? 0 : 1,
    details: {
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #51: TitleEmptyTest
 * Page title is empty
 * WCAG: Level A - Critical
 */
export function testTitleEmpty(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const title = $('title');
  const titleText = title.text().trim();
  const isEmpty = title.length > 0 && titleText === '';

  return {
    testId: '51',
    testName: 'TitleEmptyTest',
    found: isEmpty,
    count: isEmpty ? 1 : 0,
    details: {
      titleText: titleText || null,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #64: ImgMissingAltTest
 * Page has images without alt-attribute
 * WCAG: Level A - Critical
 */
export function testImgMissingAlt(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const imagesWithoutAlt = $('img:not([alt])');
  const count = imagesWithoutAlt.length;

  const details: any[] = [];
  imagesWithoutAlt.each((i, img) => {
    if (i < 10) { // Limit to first 10 for performance
      details.push({
        src: $(img).attr('src'),
        class: $(img).attr('class'),
      });
    }
  });

  return {
    testId: '64',
    testName: 'ImgMissingAltTest',
    found: count > 0,
    count: count,
    details: {
      images: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #30: FormMissingLabelsTest
 * Page has form without label-elements
 * WCAG: Level A - Critical
 */
export function testFormMissingLabels(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const forms = $('form');
  let formsWithoutLabels = 0;
  const details: any[] = [];

  forms.each((i, form) => {
    const inputs = $(form).find('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="number"], textarea, select');
    const labels = $(form).find('label');

    if (inputs.length > 0 && labels.length === 0) {
      formsWithoutLabels++;
      details.push({
        formIndex: i + 1,
        inputCount: inputs.length,
        labelCount: 0,
      });
    }
  });

  return {
    testId: '30',
    testName: 'FormMissingLabelsTest',
    found: formsWithoutLabels > 0,
    count: formsWithoutLabels,
    details: {
      forms: details,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #57: HeadingsAtLeastOneH1Test
 * Page has at least one H1 heading
 * WCAG: Level A - Critical
 */
export function testHeadingsAtLeastOneH1(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const h1Count = $('h1').length;
  const hasH1 = h1Count > 0;

  const h1Texts: string[] = [];
  $('h1').each((i, h1) => {
    if (i < 5) { // First 5 H1s
      h1Texts.push($(h1).text().trim().substring(0, 100));
    }
  });

  return {
    testId: '57',
    testName: 'HeadingsAtLeastOneH1Test',
    found: !hasH1, // Test is positive if H1 is MISSING
    count: hasH1 ? 0 : 1,
    details: {
      h1Count: h1Count,
      h1Texts: h1Texts,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #7: IframeMissingAccessibleNameTest
 * Page has iframe without an accessible name (title attribute)
 * WCAG: Level A - Critical
 */
export function testIframeMissingAccessibleName(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const iframesWithoutTitle = $('iframe:not([title]), iframe[title=""]');
  const count = iframesWithoutTitle.length;

  const details: any[] = [];
  iframesWithoutTitle.each((i, iframe) => {
    if (i < 10) {
      details.push({
        src: $(iframe).attr('src'),
        hasAriaLabel: $(iframe).attr('aria-label') !== undefined,
        hasAriaLabelledby: $(iframe).attr('aria-labelledby') !== undefined,
      });
    }
  });

  return {
    testId: '7',
    testName: 'IframeMissingAccessibleNameTest',
    found: count > 0,
    count: count,
    details: {
      iframes: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #25: TableTest
 * Page has table
 * Informational - used to trigger further manual checks
 */
export function testTable(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const tables = $('table');
  const count = tables.length;

  const details: any[] = [];
  tables.each((i, table) => {
    if (i < 10) {
      const hasHeaders = $(table).find('th').length > 0;
      const rowCount = $(table).find('tr').length;
      details.push({
        index: i + 1,
        hasHeaders: hasHeaders,
        rowCount: rowCount,
        colCount: $(table).find('tr').first().find('td, th').length,
      });
    }
  });

  return {
    testId: '25',
    testName: 'TableTest',
    found: count > 0,
    count: count,
    details: {
      tables: details,
      totalCount: count,
      informational: true,
    },
  };
}

/**
 * #29: FormTest
 * Page has form
 * Informational - used to trigger further manual checks
 */
export function testForm(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const forms = $('form');
  const count = forms.length;

  const details: any[] = [];
  forms.each((i, form) => {
    if (i < 10) {
      details.push({
        index: i + 1,
        action: $(form).attr('action'),
        method: $(form).attr('method') || 'GET',
        inputCount: $(form).find('input, textarea, select').length,
      });
    }
  });

  return {
    testId: '29',
    testName: 'FormTest',
    found: count > 0,
    count: count,
    details: {
      forms: details,
      totalCount: count,
      informational: true,
    },
  };
}

/**
 * #63: ImgTest
 * Page has images
 * Informational - used to trigger further manual checks
 */
export function testImg(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const images = $('img');
  const count = images.length;

  const imagesWithAlt = $('img[alt]').length;
  const imagesWithoutAlt = $('img:not([alt])').length;
  const imagesWithEmptyAlt = $('img[alt=""]').length;

  return {
    testId: '63',
    testName: 'ImgTest',
    found: count > 0,
    count: count,
    details: {
      totalImages: count,
      withAlt: imagesWithAlt,
      withoutAlt: imagesWithoutAlt,
      withEmptyAlt: imagesWithEmptyAlt,
      informational: true,
    },
  };
}

/**
 * Run all MVP tests on HTML content
 */
export function runAllMVPTests(html: string): CrawlerTestResult[] {
  return [
    testLangAttributeMissing(html),
    testTitleMissing(html),
    testTitleEmpty(html),
    testImgMissingAlt(html),
    testFormMissingLabels(html),
    testHeadingsAtLeastOneH1(html),
    testIframeMissingAccessibleName(html),
    testTable(html),
    testForm(html),
    testImg(html),
  ];
}