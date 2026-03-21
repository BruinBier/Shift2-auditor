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
  const allImages = $('img');
  const imagesWithoutAlt = $('img:not([alt])');
  const imagesWithAlt = $('img[alt]');
  const count = imagesWithoutAlt.length;

  const issues: any[] = [];
  imagesWithoutAlt.each((i, img) => {
    if (i < 10) { // Limit to first 10 for performance
      const $img = $(img);
      const location = getElementLocation($, img);

      issues.push({
        src: $img.attr('src'),
        class: $img.attr('class'),
        location: location,
        html: $.html($img),
      });
    }
  });

  // Also collect info about images WITH alt for context
  const imagesWithAltInfo: any[] = [];
  imagesWithAlt.each((i, img) => {
    if (i < 5) { // Limit to first 5 for performance
      const $img = $(img);
      const location = getElementLocation($, img);

      imagesWithAltInfo.push({
        src: $img.attr('src'),
        alt: $img.attr('alt'),
        class: $img.attr('class'),
        location: location,
      });
    }
  });

  return {
    testId: '64',
    testName: 'ImgMissingAltTest',
    found: count > 0,
    count: count,
    details: {
      issues: issues,
      images: issues, // Keep for backward compatibility
      totalCount: count,
      totalImages: allImages.length,
      imagesWithAlt: imagesWithAlt.length,
      imagesWithoutAlt: count,
      imagesWithAltExamples: imagesWithAltInfo,
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
 * #1: IframeIsVimeoVideoWithKeysDisabledTest
 * Page has Vimeo video with keyboard disabled
 */
export function testIframeIsVimeoVideoWithKeysDisabled(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const vimeoIframes = $('iframe[src*="vimeo.com"]');
  let count = 0;
  const details: any[] = [];

  vimeoIframes.each((i, iframe) => {
    const src = $(iframe).attr('src') || '';
    if (src.includes('keyboard=0')) {
      count++;
      if (details.length < 10) {
        details.push({ src, index: i + 1 });
      }
    }
  });

  return {
    testId: '1',
    testName: 'IframeIsVimeoVideoWithKeysDisabledTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count },
  };
}

/**
 * #2: ImgAltTooLongTest
 * Page has images with a very long alt-attribute value
 */
export function testImgAltTooLong(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const images = $('img[alt]');
  let count = 0;
  const details: any[] = [];

  images.each((i, img) => {
    const alt = $(img).attr('alt') || '';
    if (alt.length > 150) {
      count++;
      if (details.length < 10) {
        details.push({
          src: $(img).attr('src'),
          altLength: alt.length,
          alt: alt.substring(0, 100) + '...',
        });
      }
    }
  });

  return {
    testId: '2',
    testName: 'ImgAltTooLongTest',
    found: count > 0,
    count: count,
    details: { images: details, totalCount: count },
  };
}

/**
 * #10: ImgAltTooShortTest
 * Images with alt text that is too short (1-3 characters, excluding empty alt)
 * WCAG: 1.1.1 Non-text Content - Level A
 */
export function testImgAltTooShort(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const images = $('img[alt]');
  let count = 0;
  const details: any[] = [];

  images.each((i, img) => {
    const $img = $(img);
    const alt = $img.attr('alt') || '';
    // Empty alt (alt="") is valid for decorative images, so we skip it
    // But alt text with 1-3 characters is too short to be descriptive
    if (alt.length > 0 && alt.length <= 3) {
      count++;
      if (details.length < 10) {
        const location = getElementLocation($, img);
        details.push({
          src: $img.attr('src'),
          class: $img.attr('class'),
          altLength: alt.length,
          alt: alt,
          location: location,
          html: $.html($img),
        });
      }
    }
  });

  return {
    testId: '10',
    testName: 'ImgAltTooShortTest',
    found: count > 0,
    count: count,
    details: {
      images: details,
      totalCount: count,
      wcagLevel: 'A',
      wcagCriteria: ['1.1.1'],
      classification: 'toegankelijkheid/serieus',
    },
  };
}

/**
 * #11: StrongHasMoreThanFourWordsTest
 * Strict check: <strong> elements should contain max 4 words
 */
export function testStrongHasMoreThanFourWords(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const issues: any[] = [];

  // Check <strong> elements
  $('strong').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Strict: more than 4 words is an issue (5 or more)
    if (wordCount > 4) {
      const snippet = text.length > 50 ? text.substring(0, 50) + '...' : text;
      const location = getElementLocation($, element);

      issues.push({
        tagName: 'STRONG',
        wordCount,
        textSnippet: snippet,
        reason: `Element bevat ${wordCount} woorden, maximaal 4 toegestaan voor semantische nadruk.`,
        location,
        html: $.html($el),
      });
    }
  });

  const count = issues.length;

  return {
    testId: 'StrongHasMoreThanFourWordsTest',
    testName: 'StrongHasMoreThanFourWordsTest',
    found: count > 0,
    count: count,
    details: {
      issues,
      totalCount: count,
      classification: 'Kwaliteit / Premium bevinding',
    },
  };
}

/**
 * #12: ElementsStyledWithStrongOrEmTest
 * Detects misuse of <strong> or <em> for styling complete paragraphs or very long text
 */
export function testElementsStyledWithStrongOrEm(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const issues: any[] = [];

  // Check <strong> elements
  $('strong').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const location = getElementLocation($, element);

    // Check if it's the only child of a <p> tag (complete paragraph)
    const $parent = $el.parent();
    const isOnlyChildOfParagraph = $parent.is('p') && $parent.children().length === 1;

    // Check if it has more than 15 words
    const hasTooManyWords = wordCount > 15;

    if (isOnlyChildOfParagraph || hasTooManyWords) {
      const snippet = text.length > 50 ? text.substring(0, 50) + '...' : text;
      let reason = '';

      if (isOnlyChildOfParagraph) {
        reason = 'Element beslaat een complete alinea. Gebruik CSS voor styling van volledige paragrafen.';
      } else if (hasTooManyWords) {
        reason = `Element bevat ${wordCount} woorden (>15). Waarschijnlijk misbruikt voor styling in plaats van semantische nadruk.`;
      }

      issues.push({
        tagName: 'STRONG',
        wordCount,
        textSnippet: snippet,
        reason,
        location,
        isOnlyChildOfParagraph,
        html: $.html($el),
      });
    }
  });

  // Check <em> elements
  $('em').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const location = getElementLocation($, element);

    // Check if it's the only child of a <p> tag (complete paragraph)
    const $parent = $el.parent();
    const isOnlyChildOfParagraph = $parent.is('p') && $parent.children().length === 1;

    // Check if it has more than 15 words
    const hasTooManyWords = wordCount > 15;

    if (isOnlyChildOfParagraph || hasTooManyWords) {
      const snippet = text.length > 50 ? text.substring(0, 50) + '...' : text;
      let reason = '';

      if (isOnlyChildOfParagraph) {
        reason = 'Element beslaat een complete alinea. Gebruik CSS voor styling van volledige paragrafen.';
      } else if (hasTooManyWords) {
        reason = `Element bevat ${wordCount} woorden (>15). Waarschijnlijk misbruikt voor styling in plaats van semantische nadruk.`;
      }

      issues.push({
        tagName: 'EM',
        wordCount,
        textSnippet: snippet,
        reason,
        location,
        isOnlyChildOfParagraph,
        html: $.html($el),
      });
    }
  });

  const count = issues.length;

  return {
    testId: 'ElementsStyledWithStrongOrEmTest',
    testName: 'ElementsStyledWithStrongOrEmTest',
    found: count > 0,
    count: count,
    details: {
      issues,
      totalCount: count,
      classification: 'Semantiek / Structuur',
    },
  };
}

/**
 * #3: ViewportMetaRestrictsScalingTest
 * Page has restrictions on scaling of the viewport
 */
export function testViewportMetaRestrictsScaling(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const viewport = $('meta[name="viewport"]');
  const content = viewport.attr('content') || '';

  const restrictsScaling = content.includes('user-scalable=no') ||
                          content.includes('user-scalable=0') ||
                          content.match(/maximum-scale\s*=\s*1/);

  return {
    testId: '3',
    testName: 'ViewportMetaRestrictsScalingTest',
    found: !!restrictsScaling,
    count: restrictsScaling ? 1 : 0,
    details: { content, restrictsScaling: !!restrictsScaling },
  };
}

/**
 * #4: ImageLinkMissingAccessibleNameTest
 * Link with image without accessible name
 */
export function testImageLinkMissingAccessibleName(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const links = $('a');
  let count = 0;
  const details: any[] = [];

  links.each((i, link) => {
    const $link = $(link);
    const images = $link.find('img');
    const hasText = $link.text().trim().length > 0;
    const hasAriaLabel = $link.attr('aria-label');
    const hasTitle = $link.attr('title');

    if (images.length > 0 && !hasText && !hasAriaLabel && !hasTitle) {
      const allImgsHaveAlt = images.toArray().every(img => $(img).attr('alt'));
      if (!allImgsHaveAlt) {
        count++;
        if (details.length < 10) {
          details.push({
            href: $link.attr('href'),
            imageCount: images.length,
          });
        }
      }
    }
  });

  return {
    testId: '4',
    testName: 'ImageLinkMissingAccessibleNameTest',
    found: count > 0,
    count: count,
    details: { links: details, totalCount: count },
  };
}

/**
 * #5: PageContainsLinkReadMoreTest
 * Page contains links with "Read More"
 */
export function testPageContainsLinkReadMore(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const links = $('a');
  let count = 0;
  const details: any[] = [];
  const readMorePatterns = /\b(read more|lees meer|meer lezen|verder lezen)\b/i;

  links.each((i, link) => {
    const text = $(link).text().trim().toLowerCase();
    if (readMorePatterns.test(text)) {
      count++;
      if (details.length < 10) {
        details.push({
          text: $(link).text().trim(),
          href: $(link).attr('href'),
        });
      }
    }
  });

  return {
    testId: '5',
    testName: 'PageContainsLinkReadMoreTest',
    found: count > 0,
    count: count,
    details: { links: details, totalCount: count },
  };
}

/**
 * #6: PageContainsMultipleSameLinksTest
 * Page contains multiple links to same URL with different link texts
 * Filters semantic noise (home links, hash links, mailto/tel)
 * Classification: Quality/Opmerking
 */
export function testPageContainsMultipleSameLinks(
  html: string,
  options: {
    excludeHome?: boolean;
    excludeHashLinks?: boolean;
    excludeSkipLinks?: boolean;
    ignoreQuery?: boolean;
  } = {}
): CrawlerTestResult {
  const $ = cheerio.load(html);

  // Default options
  const config = {
    excludeHome: options.excludeHome !== false,
    excludeHashLinks: options.excludeHashLinks !== false,
    excludeSkipLinks: options.excludeSkipLinks !== false,
    ignoreQuery: options.ignoreQuery || false,
  };

  // Collect all internal links with context
  const links: Array<{
    url: string;
    text: string;
    context: string;
    originalHref: string;
  }> = [];

  $('a[href]').each((i, link) => {
    const $link = $(link);
    const originalHref = $link.attr('href') || '';

    // Filter protocol links (always excluded)
    if (originalHref.startsWith('mailto:') ||
        originalHref.startsWith('tel:') ||
        originalHref.startsWith('javascript:')) {
      return;
    }

    // Filter hash links (configurable)
    if (config.excludeHashLinks && (originalHref.startsWith('#') || originalHref.includes('#'))) {
      return;
    }

    // Check if internal link
    const isInternal = isInternalLink(originalHref);
    if (!isInternal) {
      return; // Skip external links
    }

    const text = getAccessibleName($, $link);

    // Skip empty text
    if (!text || text.trim() === '') return;

    // Filter home links (configurable)
    if (config.excludeHome && isHomeLink(originalHref, text)) {
      return;
    }

    // Filter skip links (configurable)
    if (config.excludeSkipLinks && isSkipLink(text, $link)) {
      return;
    }

    const normalizedUrl = normalizeUrl(originalHref, config.ignoreQuery);
    const context = getContext($, $link);

    links.push({
      url: normalizedUrl,
      text: text.toLowerCase().trim(),
      context: context,
      originalHref: originalHref,
    });
  });

  // Group links by URL
  const grouped = new Map<string, Array<{ text: string; context: string }>>();

  links.forEach(link => {
    if (!grouped.has(link.url)) {
      grouped.set(link.url, []);
    }
    grouped.get(link.url)!.push({ text: link.text, context: link.context });
  });

  // Detect issues: URLs with multiple different texts
  const issues: any[] = [];

  grouped.forEach((linkInstances, url) => {
    if (linkInstances.length < 2) return;

    // Get unique texts
    const uniqueTexts = new Set(linkInstances.map(l => l.text));

    // Only report if same URL has different texts
    if (uniqueTexts.size > 1) {
      // Group by context
      const byContext: Record<string, Array<{ text: string; count: number }>> = {};

      linkInstances.forEach(link => {
        if (!byContext[link.context]) {
          byContext[link.context] = [];
        }

        const existing = byContext[link.context].find(t => t.text === link.text);
        if (existing) {
          existing.count++;
        } else {
          byContext[link.context].push({ text: link.text, count: 1 });
        }
      });

      issues.push({
        url: url,
        linkCount: linkInstances.length,
        uniqueTexts: Array.from(uniqueTexts),
        contexts: byContext,
      });
    }
  });

  return {
    testId: '6',
    testName: 'PageContainsMultipleSameLinksTest',
    found: issues.length > 0,
    count: issues.length,
    details: {
      issues: issues,
      totalLinksAnalyzed: links.length,
      classification: 'kwaliteit/opmerking',
    },
  };
}

// Helper functions

function getElementLocation($: cheerio.CheerioAPI, element: any): string {
  const $el = $(element);
  // Try to find containing landmark
  if ($el.closest('header').length > 0) return 'header';
  if ($el.closest('nav').length > 0) return 'nav';
  if ($el.closest('main').length > 0) return 'main';
  if ($el.closest('article').length > 0) return 'article';
  if ($el.closest('aside').length > 0) return 'aside';
  if ($el.closest('footer').length > 0) return 'footer';
  return 'body';
}

// Helper functions for PageContainsMultipleSameLinksTest

function getAccessibleName($: cheerio.CheerioAPI, $link: cheerio.Cheerio<any>): string {
  // Check aria-label
  const ariaLabel = $link.attr('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return ariaLabel.trim();
  }

  // Check aria-labelledby
  const ariaLabelledby = $link.attr('aria-labelledby');
  if (ariaLabelledby) {
    const labelText = ariaLabelledby
      .split(/\s+/)
      .map(id => $(`#${id}`).text())
      .join(' ');
    if (labelText.trim()) return labelText.trim();
  }

  // Get text content including image alt
  let text = $link.text() || '';
  $link.find('img[alt]').each((i, img) => {
    const alt = $(img).attr('alt');
    if (alt) text += ' ' + alt;
  });

  return text.replace(/\s+/g, ' ').trim();
}

function getContext($: cheerio.CheerioAPI, $link: cheerio.Cheerio<any>): string {
  // Check parent elements for context
  if ($link.closest('header').length > 0) return 'header';
  if ($link.closest('nav').length > 0) return 'navigation';
  if ($link.closest('footer').length > 0) return 'footer';
  if ($link.closest('main, article').length > 0) return 'main';
  if ($link.closest('aside').length > 0) return 'sidebar';
  return 'other';
}

function normalizeUrl(url: string, ignoreQuery: boolean): string {
  let normalized = url;

  // If absolute URL, extract only the pathname
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const urlObj = new URL(normalized);
      normalized = urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, just use the original
    }
  }

  // Remove hash
  normalized = normalized.split('#')[0];

  // Remove query if configured
  if (ignoreQuery) {
    normalized = normalized.split('?')[0];
  }

  // Normalize trailing slash
  if (normalized.endsWith('/') && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function isHomeLink(href: string, text: string): boolean {
  const homeUrls = ['/', '/#', '/index', '/index.html', '/home'];
  if (homeUrls.includes(href)) return true;

  const homeTexts = /^(home|start|homepage|startpagina|ga naar.*homepage|terug naar.*home)$/i;
  if (homeTexts.test(text.toLowerCase().trim())) return true;

  return false;
}

function isSkipLink(text: string, $link: cheerio.Cheerio<any>): boolean {
  const skipPatterns = /skip to|skip navigation|ga naar inhoud|spring naar|naar hoofdinhoud|overslaan/i;
  if (skipPatterns.test(text)) return true;

  const classes = $link.attr('class') || '';
  if (/skip[-_]link|skip[-_]to|skipnav/i.test(classes)) return true;

  return false;
}

function isInternalLink(href: string): boolean {
  // Relative URLs are always internal
  if (href.startsWith('/') && !href.startsWith('//')) {
    return true;
  }

  // Relative paths (no protocol)
  if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
    return true;
  }

  // Absolute URLs - check if localhost/development
  if (href.includes('localhost') ||
      href.includes('127.0.0.1')) {
    return true;
  }

  // For absolute URLs, we cannot reliably determine if they are internal without
  // comparing to the page's domain. This is handled by the caller.
  return false;
}

/**
 * #8: IframeIsYouTubeVideoWithKeysEnabledTest
 * Page has YouTube video with single character keys enabled
 * INFORMATIONAL - this is GOOD for accessibility
 */
export function testIframeIsYouTubeVideoWithKeysEnabled(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const youtubeIframes = $('iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie.com"]');
  let count = 0;
  const details: any[] = [];

  youtubeIframes.each((i, iframe) => {
    const src = $(iframe).attr('src') || '';
    // If keyboard parameter is not present or is set to 1, keys are enabled
    if (!src.includes('disablekb=1')) {
      count++;
      if (details.length < 10) {
        details.push({ src, index: i + 1 });
      }
    }
  });

  return {
    testId: '8',
    testName: 'IframeIsYouTubeVideoWithKeysEnabledTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count, informational: true },
  };
}

/**
 * #132: IframeIsYouTubeVideoWithKeysDisabledTest
 * Page has YouTube video with keyboard disabled (disablekb=1)
 * ACCESSIBILITY ISSUE - keyboard users cannot control the video
 */
export function testIframeIsYouTubeVideoWithKeysDisabled(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const youtubeIframes = $('iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie.com"]');
  let count = 0;
  const details: any[] = [];

  youtubeIframes.each((i, iframe) => {
    const src = $(iframe).attr('src') || '';
    // Check if keyboard is explicitly disabled
    if (src.includes('disablekb=1')) {
      count++;
      if (details.length < 10) {
        details.push({
          src,
          index: i + 1,
          title: $(iframe).attr('title') || '(no title)',
        });
      }
    }
  });

  return {
    testId: '132',
    testName: 'IframeIsYouTubeVideoWithKeysDisabledTest',
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
 * #9: TableWithHeadingsTest
 * Page has table with th-elements
 */
export function testTableWithHeadings(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const tables = $('table');
  let count = 0;
  const details: any[] = [];

  tables.each((i, table) => {
    const headers = $(table).find('th');
    if (headers.length > 0) {
      count++;
      if (details.length < 10) {
        details.push({
          index: i + 1,
          headerCount: headers.length,
          rowCount: $(table).find('tr').length,
        });
      }
    }
  });

  return {
    testId: '9',
    testName: 'TableWithHeadingsTest',
    found: count > 0,
    count: count,
    details: { tables: details, totalCount: count },
  };
}

/**
 * #11: IframeIsGoogleMapTest
 * Page has Google Maps
 */
export function testIframeIsGoogleMap(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const googleMapIframes = $('iframe[src*="google.com/maps"]');
  const count = googleMapIframes.length;
  const details: any[] = [];

  googleMapIframes.each((i, iframe) => {
    if (i < 10) {
      details.push({
        src: $(iframe).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '11',
    testName: 'IframeIsGoogleMapTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count },
  };
}

/**
 * #12: IframeIsScribitVideoTest
 * Page contains Scribit video
 */
export function testIframeIsScribitVideo(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const scribitIframes = $('iframe[src*="scribit"], iframe[src*="scribit"]');
  const count = scribitIframes.length;
  const details: any[] = [];

  scribitIframes.each((i, iframe) => {
    if (i < 10) {
      details.push({
        src: $(iframe).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '12',
    testName: 'IframeIsScribitVideoTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count },
  };
}

/**
 * #13: IframeIsVimeoVideoWithKeysEnabledTest
 * Page has Vimeo video with single character keys enabled
 */
export function testIframeIsVimeoVideoWithKeysEnabled(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const vimeoIframes = $('iframe[src*="vimeo.com"]');
  let count = 0;
  const details: any[] = [];

  vimeoIframes.each((i, iframe) => {
    const src = $(iframe).attr('src') || '';
    if (!src.includes('keyboard=0')) {
      count++;
      if (details.length < 10) {
        details.push({ src, index: i + 1 });
      }
    }
  });

  return {
    testId: '13',
    testName: 'IframeIsVimeoVideoWithKeysEnabledTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count },
  };
}

/**
 * #14: IframeIsVimeoVideoTest
 * Page has Vimeo video
 */
export function testIframeIsVimeoVideo(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const vimeoIframes = $('iframe[src*="vimeo.com"]');
  const count = vimeoIframes.length;
  const details: any[] = [];

  vimeoIframes.each((i, iframe) => {
    if (i < 10) {
      details.push({
        src: $(iframe).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '14',
    testName: 'IframeIsVimeoVideoTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count },
  };
}

/**
 * #15: IframeTest
 * Page has iframe
 */
export function testIframe(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const iframes = $('iframe');
  const count = iframes.length;
  const details: any[] = [];

  iframes.each((i, iframe) => {
    if (i < 10) {
      details.push({
        src: $(iframe).attr('src'),
        title: $(iframe).attr('title'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '15',
    testName: 'IframeTest',
    found: count > 0,
    count: count,
    details: { iframes: details, totalCount: count, informational: true },
  };
}

/**
 * #16: AudioHasAutoplayTest
 * Audio has autoplay
 */
export function testAudioHasAutoplay(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const audiosWithAutoplay = $('audio[autoplay]');
  const count = audiosWithAutoplay.length;
  const details: any[] = [];

  audiosWithAutoplay.each((i, audio) => {
    if (i < 10) {
      details.push({
        src: $(audio).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '16',
    testName: 'AudioHasAutoplayTest',
    found: count > 0,
    count: count,
    details: { audios: details, totalCount: count },
  };
}

/**
 * #17: AudioControlsTest
 * Page has audio with controls
 */
export function testAudioControls(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const audiosWithControls = $('audio[controls]');
  const count = audiosWithControls.length;
  const details: any[] = [];

  audiosWithControls.each((i, audio) => {
    if (i < 10) {
      details.push({
        src: $(audio).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '17',
    testName: 'AudioControlsTest',
    found: count > 0,
    count: count,
    details: { audios: details, totalCount: count, informational: true },
  };
}

/**
 * #18: AudioTest
 * Page has audio
 */
export function testAudio(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const audios = $('audio');
  const count = audios.length;
  const details: any[] = [];

  audios.each((i, audio) => {
    if (i < 10) {
      details.push({
        src: $(audio).attr('src'),
        hasControls: $(audio).attr('controls') !== undefined,
        hasAutoplay: $(audio).attr('autoplay') !== undefined,
        index: i + 1,
      });
    }
  });

  return {
    testId: '18',
    testName: 'AudioTest',
    found: count > 0,
    count: count,
    details: { audios: details, totalCount: count, informational: true },
  };
}

/**
 * #19: VideoHasAutoplayTest
 * Video has autoplay
 */
export function testVideoHasAutoplay(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const videosWithAutoplay = $('video[autoplay]');
  const count = videosWithAutoplay.length;
  const details: any[] = [];

  videosWithAutoplay.each((i, video) => {
    if (i < 10) {
      details.push({
        src: $(video).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '19',
    testName: 'VideoHasAutoplayTest',
    found: count > 0,
    count: count,
    details: { videos: details, totalCount: count },
  };
}

/**
 * #20: VideoMissingTitleAriaTest
 * Video-element with controls does not have an accessible name
 */
export function testVideoMissingTitleAria(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const videosWithControls = $('video[controls]');
  let count = 0;
  const details: any[] = [];

  videosWithControls.each((i, video) => {
    const $video = $(video);
    const hasTitle = $video.attr('title');
    const hasAriaLabel = $video.attr('aria-label');
    const hasAriaLabelledby = $video.attr('aria-labelledby');

    if (!hasTitle && !hasAriaLabel && !hasAriaLabelledby) {
      count++;
      if (details.length < 10) {
        details.push({
          src: $video.attr('src'),
          index: i + 1,
        });
      }
    }
  });

  return {
    testId: '20',
    testName: 'VideoMissingTitleAriaTest',
    found: count > 0,
    count: count,
    details: { videos: details, totalCount: count },
  };
}

/**
 * #21: VideoControlsTest
 * Page has video with controls
 */
export function testVideoControls(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const videosWithControls = $('video[controls]');
  const count = videosWithControls.length;
  const details: any[] = [];

  videosWithControls.each((i, video) => {
    if (i < 10) {
      details.push({
        src: $(video).attr('src'),
        index: i + 1,
      });
    }
  });

  return {
    testId: '21',
    testName: 'VideoControlsTest',
    found: count > 0,
    count: count,
    details: { videos: details, totalCount: count, informational: true },
  };
}

/**
 * #22: VideoTest
 * Page has video
 */
export function testVideo(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const videos = $('video');
  const count = videos.length;
  const details: any[] = [];

  videos.each((i, video) => {
    if (i < 10) {
      details.push({
        src: $(video).attr('src'),
        hasControls: $(video).attr('controls') !== undefined,
        hasAutoplay: $(video).attr('autoplay') !== undefined,
        index: i + 1,
      });
    }
  });

  return {
    testId: '22',
    testName: 'VideoTest',
    found: count > 0,
    count: count,
    details: { videos: details, totalCount: count, informational: true },
  };
}

/**
 * #23: LinkWithoutTextTest
 * Page has links without visible text
 */
export function testLinkWithoutText(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const links = $('a[href]');
  let count = 0;
  const details: any[] = [];

  links.each((i, link) => {
    const $link = $(link);
    const text = $link.text().trim();
    const ariaLabel = $link.attr('aria-label');
    const title = $link.attr('title');
    const hasImageWithAlt = $link.find('img[alt]').length > 0;

    // Link has no accessible name
    if (!text && !ariaLabel && !title && !hasImageWithAlt) {
      count++;
      if (details.length < 10) {
        details.push({
          href: $link.attr('href'),
          html: $link.html()?.substring(0, 100),
        });
      }
    }
  });

  return {
    testId: '23',
    testName: 'LinkWithoutTextTest',
    found: count > 0,
    count: count,
    details: {
      links: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #24: EmptyLinkTest
 * Page has empty links
 */
export function testEmptyLink(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const emptyLinks = $('a[href]:empty, a[href]:not(:has(*))').filter((i, el) => {
    return $(el).text().trim() === '' && !$(el).attr('aria-label') && !$(el).attr('title');
  });
  const count = emptyLinks.length;
  const details: any[] = [];

  emptyLinks.each((i, link) => {
    if (i < 10) {
      details.push({
        href: $(link).attr('href'),
      });
    }
  });

  return {
    testId: '24',
    testName: 'EmptyLinkTest',
    found: count > 0,
    count: count,
    details: {
      links: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #25: LinkMissingHrefTest
 * Page has links with missing, empty, or placeholder href attributes
 */
export function testLinkMissingHref(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const issues: any[] = [];

  // Define placeholder patterns
  const placeholderPatterns = [
    '#',
    '/#',
    'javascript:void(0)',
    'javascript:;',
    'javascript:',
  ];

  $('a').each((i, link) => {
    const $link = $(link);
    const href = $link.attr('href');
    const linkText = $link.text().trim();
    const ariaLabel = $link.attr('aria-label');
    const title = $link.attr('title');
    const name = $link.attr('name');
    const id = $link.attr('id');

    // Get accessible name
    const accessibleName = ariaLabel || linkText || title || '';

    // Get location (using standard location names for consistency)
    let location = 'body';
    if ($link.closest('header').length > 0) location = 'header';
    else if ($link.closest('nav').length > 0) location = 'nav';
    else if ($link.closest('footer').length > 0) location = 'footer';
    else if ($link.closest('main').length > 0) location = 'main';
    else if ($link.closest('article').length > 0) location = 'article';
    else if ($link.closest('aside').length > 0) location = 'aside';

    // Skip anchor-only links (with name or id but no href) unless they have text
    if (!href && (name || id) && !linkText) {
      return; // Skip this one
    }

    // Check for missing href
    if (!href) {
      issues.push({
        element: accessibleName || '<geen tekst>',
        hrefValue: '<geen href>',
        reason: 'De link heeft geen href attribuut en functioneert daardoor niet als een werkende link.',
        location: location,
        html: $.html($link),
      });
      return;
    }

    // Check for empty href
    const trimmedHref = href.trim();
    if (trimmedHref === '') {
      issues.push({
        element: accessibleName || '<geen tekst>',
        hrefValue: '""',
        reason: 'De link heeft een leeg href attribuut en functioneert daardoor niet als een werkende link.',
        location: location,
        html: $.html($link),
      });
      return;
    }

    // Check for placeholder href
    if (placeholderPatterns.includes(trimmedHref)) {
      issues.push({
        element: accessibleName || '<geen tekst>',
        hrefValue: trimmedHref,
        reason: 'De link bevat een placeholder href die niet naar een functionele bestemming leidt.',
        location: location,
        html: $.html($link),
      });
      return;
    }
  });

  return {
    testId: '25',
    testName: 'LinkMissingHrefTest',
    found: issues.length > 0,
    count: issues.length,
    details: {
      issues: issues,
      totalCount: issues.length,
      classification: 'toegankelijkheid/kritiek',
      wcagLevel: 'A',
      wcagCriteria: ['2.1.1', '2.4.4'],
      critical: true,
    },
  };
}

/**
 * #26: TableWithoutHeadersTest
 * Page has tables without th elements (headers)
 */
export function testTableWithoutHeaders(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const tables = $('table');
  let count = 0;
  const details: any[] = [];

  tables.each((i, table) => {
    const headers = $(table).find('th');
    if (headers.length === 0) {
      count++;
      if (details.length < 10) {
        details.push({
          index: i + 1,
          rowCount: $(table).find('tr').length,
          colCount: $(table).find('tr').first().find('td').length,
        });
      }
    }
  });

  return {
    testId: '26',
    testName: 'TableWithoutHeadersTest',
    found: count > 0,
    count: count,
    details: {
      tables: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #27: ListTest
 * Page has lists (ul, ol)
 */
export function testList(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const lists = $('ul, ol');
  const count = lists.length;
  const details: any[] = [];

  lists.each((i, list) => {
    if (i < 10) {
      details.push({
        type: list.tagName,
        itemCount: $(list).find('> li').length,
        index: i + 1,
      });
    }
  });

  return {
    testId: '27',
    testName: 'ListTest',
    found: count > 0,
    count: count,
    details: { lists: details, totalCount: count, informational: true },
  };
}

/**
 * #28: DefinitionListTest
 * Page has definition lists (dl)
 */
export function testDefinitionList(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const definitionLists = $('dl');
  const count = definitionLists.length;
  const details: any[] = [];

  definitionLists.each((i, dl) => {
    if (i < 10) {
      details.push({
        dtCount: $(dl).find('dt').length,
        ddCount: $(dl).find('dd').length,
        index: i + 1,
      });
    }
  });

  return {
    testId: '28',
    testName: 'DefinitionListTest',
    found: count > 0,
    count: count,
    details: { lists: details, totalCount: count, informational: true },
  };
}

/**
 * #31: FormMissingFieldsetTest
 * Form has radio buttons or checkboxes without fieldset
 */
export function testFormMissingFieldset(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const forms = $('form');
  let count = 0;
  const details: any[] = [];

  forms.each((i, form) => {
    const radioGroups = $(form).find('input[type="radio"]');
    const checkboxes = $(form).find('input[type="checkbox"]');
    const fieldsets = $(form).find('fieldset');

    if ((radioGroups.length > 1 || checkboxes.length > 1) && fieldsets.length === 0) {
      count++;
      if (details.length < 10) {
        details.push({
          formIndex: i + 1,
          radioCount: radioGroups.length,
          checkboxCount: checkboxes.length,
        });
      }
    }
  });

  return {
    testId: '31',
    testName: 'FormMissingFieldsetTest',
    found: count > 0,
    count: count,
    details: {
      forms: details,
      totalCount: count,
      wcagLevel: 'A',
    },
  };
}

/**
 * #32: InputMissingLabelTest
 * Input elements without associated label
 */
export function testInputMissingLabel(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const inputs = $('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="number"], input[type="search"], input[type="url"], textarea');
  let count = 0;
  const details: any[] = [];

  inputs.each((i, input) => {
    const $input = $(input);
    const id = $input.attr('id');
    const ariaLabel = $input.attr('aria-label');
    const ariaLabelledby = $input.attr('aria-labelledby');
    const title = $input.attr('title');

    // Check if there's a label associated
    let hasLabel = false;
    if (id) {
      hasLabel = $(`label[for="${id}"]`).length > 0;
    }

    if (!hasLabel && !ariaLabel && !ariaLabelledby && !title) {
      count++;
      if (details.length < 10) {
        details.push({
          type: $input.attr('type') || 'textarea',
          name: $input.attr('name'),
          placeholder: $input.attr('placeholder'),
        });
      }
    }
  });

  return {
    testId: '32',
    testName: 'InputMissingLabelTest',
    found: count > 0,
    count: count,
    details: {
      inputs: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #33: ButtonEmptyTest
 * Page has empty buttons
 */
export function testButtonEmpty(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const buttons = $('button, input[type="button"], input[type="submit"]');
  let count = 0;
  const details: any[] = [];

  buttons.each((i, button) => {
    const $button = $(button);
    const text = $button.text().trim();
    const value = $button.attr('value');
    const ariaLabel = $button.attr('aria-label');
    const title = $button.attr('title');
    const hasImageWithAlt = $button.find('img[alt]').length > 0;

    if (!text && !value && !ariaLabel && !title && !hasImageWithAlt) {
      count++;
      if (details.length < 10) {
        details.push({
          type: button.tagName,
          html: $button.html()?.substring(0, 100),
        });
      }
    }
  });

  return {
    testId: '33',
    testName: 'ButtonEmptyTest',
    found: count > 0,
    count: count,
    details: {
      buttons: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #34: HeadingEmptyTest
 * Page has empty headings
 */
export function testHeadingEmpty(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const headings = $('h1, h2, h3, h4, h5, h6');
  let count = 0;
  const details: any[] = [];

  headings.each((i, heading) => {
    const text = $(heading).text().trim();
    if (text === '') {
      count++;
      if (details.length < 10) {
        details.push({
          level: heading.tagName,
          html: $(heading).html()?.substring(0, 100),
        });
      }
    }
  });

  return {
    testId: '34',
    testName: 'HeadingEmptyTest',
    found: count > 0,
    count: count,
    details: {
      headings: details,
      totalCount: count,
      wcagLevel: 'A',
      critical: true,
    },
  };
}

/**
 * #35: HeadingSkipLevelTest
 * Headings skip levels (e.g., h1 to h3 without h2)
 */
export function testHeadingSkipLevel(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const headings = $('h1, h2, h3, h4, h5, h6').toArray();
  let count = 0;
  const details: any[] = [];

  for (let i = 1; i < headings.length; i++) {
    const prevLevel = parseInt(headings[i - 1].tagName.substring(1));
    const currLevel = parseInt(headings[i].tagName.substring(1));

    // Skipped a level (e.g., h1 to h3)
    if (currLevel - prevLevel > 1) {
      count++;
      if (details.length < 10) {
        details.push({
          from: headings[i - 1].tagName,
          to: headings[i].tagName,
          fromText: $(headings[i - 1]).text().trim().substring(0, 50),
          toText: $(headings[i]).text().trim().substring(0, 50),
        });
      }
    }
  }

  return {
    testId: '35',
    testName: 'HeadingSkipLevelTest',
    found: count > 0,
    count: count,
    details: {
      violations: details,
      totalCount: count,
      wcagLevel: 'AA',
    },
  };
}

/**
 * #36: SkipLinkTest
 * Page has skip links (for keyboard navigation)
 */
export function testSkipLink(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const links = $('a[href^="#"]');
  let hasSkipLink = false;
  const details: any[] = [];

  const skipPatterns = /skip|jump|bypass|main content|navigation/i;

  links.each((i, link) => {
    const text = $(link).text().trim().toLowerCase();
    const ariaLabel = $(link).attr('aria-label')?.toLowerCase() || '';

    if (skipPatterns.test(text) || skipPatterns.test(ariaLabel)) {
      hasSkipLink = true;
      if (details.length < 5) {
        details.push({
          text: $(link).text().trim(),
          href: $(link).attr('href'),
          ariaLabel: $(link).attr('aria-label'),
        });
      }
    }
  });

  return {
    testId: '36',
    testName: 'SkipLinkTest',
    found: hasSkipLink,
    count: hasSkipLink ? details.length : 0,
    details: {
      skipLinks: details,
      informational: true,
    },
  };
}

/**
 * #37: AriaLandmarksTest
 * Page uses ARIA landmarks - validates SIA-R56 (unique landmark names)
 */
export function testAriaLandmarks(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);

  // Mapping van semantische tags naar ARIA roles
  const semanticToRoleMap: Record<string, string> = {
    'header': 'banner',
    'nav': 'navigation',
    'main': 'main',
    'footer': 'contentinfo',
    'aside': 'complementary',
  };

  // Verzamel alle landmarks (deduplicated)
  const landmarkElements = new Set<any>();
  const landmarksByType = new Map<string, any[]>();

  // Selecteer alle mogelijke landmarks
  const allPossibleLandmarks = $(
    'header, nav, main, footer, aside, ' +
    '[role="banner"], [role="navigation"], [role="main"], ' +
    '[role="contentinfo"], [role="complementary"], [role="search"]'
  );

  allPossibleLandmarks.each((i, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const explicitRole = $el.attr('role');

    // Bepaal het effectieve landmark type
    let landmarkType: string;
    if (explicitRole && ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'search'].includes(explicitRole)) {
      landmarkType = explicitRole;
    } else if (semanticToRoleMap[tag]) {
      landmarkType = semanticToRoleMap[tag];
    } else {
      return; // Skip als het geen landmark is
    }

    // Haal label informatie op
    const ariaLabel = $el.attr('aria-label') || '';
    const ariaLabelledby = $el.attr('aria-labelledby') || '';

    // Bepaal de accessible name
    let accessibleName = '';
    if (ariaLabel) {
      accessibleName = ariaLabel.trim();
    } else if (ariaLabelledby) {
      // Probeer de tekst van het gelabelde element op te halen
      const labelledElement = $(`#${ariaLabelledby}`);
      if (labelledElement.length > 0) {
        accessibleName = labelledElement.text().trim();
      }
    }

    const landmarkInfo = {
      element: el,
      type: landmarkType,
      tag: tag,
      explicitRole: explicitRole || null,
      ariaLabel: ariaLabel || null,
      ariaLabelledby: ariaLabelledby || null,
      accessibleName: accessibleName || null,
      html: $.html($el).substring(0, 200), // Eerste 200 chars
      location: getElementLocation($, el),
    };

    // Voeg toe aan deduplicated set
    landmarkElements.add(landmarkInfo);

    // Groepeer per type voor SIA-R56 validatie
    if (!landmarksByType.has(landmarkType)) {
      landmarksByType.set(landmarkType, []);
    }
    landmarksByType.get(landmarkType)!.push(landmarkInfo);
  });

  // SIA-R56 Validatie: Check voor duplicate landmarks zonder unieke namen
  const duplicateIssues: any[] = [];

  landmarksByType.forEach((landmarks, type) => {
    if (landmarks.length > 1) {
      // Er zijn meerdere landmarks van hetzelfde type
      // Check of ze allemaal unieke namen hebben
      const accessibleNames = landmarks.map(lm => lm.accessibleName || '');
      const uniqueNames = new Set(accessibleNames.filter(name => name !== ''));

      // Als niet alle landmarks een unieke naam hebben, is dit een probleem
      if (uniqueNames.size < landmarks.length) {
        // Sommige landmarks hebben geen naam of dezelfde naam
        const landmarksWithoutUniqueNames = landmarks.filter((lm, idx) => {
          // Check of deze landmark geen naam heeft of een duplicate naam
          if (!lm.accessibleName) return true;

          // Check of er een andere landmark is met dezelfde naam
          const duplicates = landmarks.filter(other =>
            other !== lm && other.accessibleName === lm.accessibleName
          );
          return duplicates.length > 0;
        });

        if (landmarksWithoutUniqueNames.length > 0) {
          duplicateIssues.push({
            landmarkType: type,
            count: landmarks.length,
            issue: 'SIA-R56: Multiple landmarks of the same type must have unique accessible names',
            wcagCriteria: ['2.4.1', '4.1.2'],
            wcagLevel: 'A',
            problematicLandmarks: landmarksWithoutUniqueNames.slice(0, 5).map(lm => ({
              tag: lm.tag,
              role: lm.explicitRole,
              accessibleName: lm.accessibleName || '(geen naam)',
              ariaLabel: lm.ariaLabel,
              ariaLabelledby: lm.ariaLabelledby,
              location: lm.location,
              htmlPreview: lm.html,
            })),
          });
        }
      }
    }
  });

  // Converteer Set naar Array voor details
  const allLandmarks = Array.from(landmarkElements);
  const landmarkDetails = allLandmarks.slice(0, 20).map((lm: any) => ({
    type: lm.type,
    tag: lm.tag,
    explicitRole: lm.explicitRole,
    accessibleName: lm.accessibleName,
    ariaLabel: lm.ariaLabel,
    ariaLabelledby: lm.ariaLabelledby,
    location: lm.location,
  }));

  // Bepaal of er issues zijn
  const hasIssues = duplicateIssues.length > 0;

  return {
    testId: '37',
    testName: 'AriaLandmarksTest',
    found: hasIssues, // True als er SIA-R56 violations zijn
    count: duplicateIssues.length,
    details: {
      totalLandmarks: allLandmarks.length,
      landmarks: landmarkDetails,
      landmarksByType: Object.fromEntries(
        Array.from(landmarksByType.entries()).map(([type, lms]) => [
          type,
          {
            count: lms.length,
            hasUniqueNames: lms.length <= 1 || lms.every((lm: any) => lm.accessibleName),
          }
        ])
      ),
      issues: duplicateIssues,
      classification: hasIssues ? 'serieus' : 'informational',
      informational: !hasIssues,
      wcagLevel: hasIssues ? 'A' : undefined,
      wcagCriteria: hasIssues ? ['2.4.1', '4.1.2'] : undefined,
    },
  };
}

/**
 * #38: IframeIsHCaptchaTest
 * Detects hCaptcha iframes and container divs, checks accessibility (SIA check for iframe title)
 * WCAG: 4.1.2 (Name, Role, Value) - Level A
 */
export function testIframeIsHCaptcha(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);

  // Detectie: zoek naar hCaptcha iframes EN container divs
  const hcaptchaIframes: any[] = [];

  // 1. Zoek naar hCaptcha container divs (deze genereren iframes dynamisch)
  $('[data-hcaptcha-sitekey]').each((i, container) => {
    const $container = $(container);
    const sitekey = $container.attr('data-hcaptcha-sitekey') || '';
    const location = getElementLocation($, container);

    // Zoek naar iframe binnen deze container
    const $iframe = $container.find('iframe').first();

    if ($iframe.length > 0) {
      // Er is al een iframe gegenereerd
      const src = $iframe.attr('src') || '';
      const title = $iframe.attr('title') || '';
      const tabindex = $iframe.attr('tabindex') || '';
      const ariaHidden = $iframe.attr('aria-hidden') || '';

      // Bepaal of het invisible variant is
      const isInvisible = src.includes('invisible') ||
                         $container.attr('data-size') === 'invisible' ||
                         $container.closest('[data-hcaptcha-invisible]').length > 0;

      // Check toegankelijkheid
      const hasTitle = title.trim().length > 0;
      const isTitleMeaningful = hasTitle && title.length > 5;
      const isKeyboardAccessible = tabindex !== '-1' && ariaHidden !== 'true';

      // Bepaal of het toegankelijk is
      const isAccessible = hasTitle && isTitleMeaningful && (isInvisible || isKeyboardAccessible);

      hcaptchaIframes.push({
        src: src,
        sitekey: sitekey,
        detectedVia: 'container-div-with-iframe',
        hasTitle: hasTitle,
        titleText: title || '(geen titel)',
        isTitleMeaningful: isTitleMeaningful,
        isInvisible: isInvisible,
        tabindex: tabindex || 'geen',
        ariaHidden: ariaHidden || 'geen',
        isKeyboardAccessible: isKeyboardAccessible,
        isAccessible: isAccessible,
        location: location,
        html: $.html($iframe).substring(0, 200),
      });
    } else {
      // Container zonder iframe (nog niet geladen/gerenderd)
      // We rapporteren dit als potentieel probleem
      hcaptchaIframes.push({
        src: '(nog niet geladen)',
        sitekey: sitekey,
        detectedVia: 'container-div-without-iframe',
        hasTitle: false,
        titleText: '(iframe nog niet gerenderd)',
        isTitleMeaningful: false,
        isInvisible: $container.attr('data-size') === 'invisible',
        tabindex: 'onbekend',
        ariaHidden: 'onbekend',
        isKeyboardAccessible: false,
        isAccessible: false, // Kan niet valideren zonder iframe
        location: location,
        html: $.html($container).substring(0, 200),
      });
    }
  });

  // 2. Zoek naar standalone hCaptcha iframes (zonder container div)
  $('iframe').each((i, iframe) => {
    const $iframe = $(iframe);
    const src = $iframe.attr('src') || '';
    const dataWidget = $iframe.attr('data-hcaptcha-widget-id') || '';

    // Check of het een hCaptcha iframe is EN of we deze nog niet hebben via container
    const isHCaptchaIframe = src.includes('hcaptcha.com') || dataWidget;
    const alreadyDetected = hcaptchaIframes.some(c =>
      c.html && c.html === $.html($iframe).substring(0, 200)
    );

    if (isHCaptchaIframe && !alreadyDetected) {
      const title = $iframe.attr('title') || '';
      const tabindex = $iframe.attr('tabindex') || '';
      const ariaHidden = $iframe.attr('aria-hidden') || '';
      const location = getElementLocation($, iframe);

      // Bepaal of het invisible variant is
      const isInvisible = src.includes('invisible') ||
                         $iframe.closest('[data-hcaptcha-invisible]').length > 0;

      // Check toegankelijkheid
      const hasTitle = title.trim().length > 0;
      const isTitleMeaningful = hasTitle && title.length > 5;
      const isKeyboardAccessible = tabindex !== '-1' && ariaHidden !== 'true';

      // Bepaal of het toegankelijk is
      const isAccessible = hasTitle && isTitleMeaningful && (isInvisible || isKeyboardAccessible);

      hcaptchaIframes.push({
        src: src,
        sitekey: 'onbekend',
        detectedVia: 'standalone-iframe',
        hasTitle: hasTitle,
        titleText: title || '(geen titel)',
        isTitleMeaningful: isTitleMeaningful,
        isInvisible: isInvisible,
        tabindex: tabindex || 'geen',
        ariaHidden: ariaHidden || 'geen',
        isKeyboardAccessible: isKeyboardAccessible,
        isAccessible: isAccessible,
        location: location,
        html: $.html($iframe).substring(0, 200),
      });
    }
  });

  // Vind inaccessible hCaptcha's (zonder title of keyboard problemen)
  const inaccessibleCaptchas = hcaptchaIframes.filter(captcha => !captcha.isAccessible);

  return {
    testId: '38',
    testName: 'IframeIsHCaptchaTest',
    found: inaccessibleCaptchas.length > 0,
    count: inaccessibleCaptchas.length,
    details: {
      totalHCaptchas: hcaptchaIframes.length,
      accessibleHCaptchas: hcaptchaIframes.filter(c => c.isAccessible).length,
      inaccessibleHCaptchas: inaccessibleCaptchas.length,
      issues: inaccessibleCaptchas.map(captcha => ({
        reason: !captcha.hasTitle
          ? 'Geen title attribuut'
          : !captcha.isTitleMeaningful
            ? 'Title te kort/niet zinvol'
            : 'Niet toegankelijk voor toetsenbord',
        hasTitle: captcha.hasTitle,
        titleText: captcha.titleText,
        isInvisible: captcha.isInvisible,
        isKeyboardAccessible: captcha.isKeyboardAccessible,
        tabindex: captcha.tabindex,
        ariaHidden: captcha.ariaHidden,
        location: captcha.location,
        htmlPreview: captcha.html,
      })),
      allHCaptchas: hcaptchaIframes.slice(0, 10), // Eerste 10 voor overzicht
      wcagLevel: 'A',
      wcagCriteria: ['4.1.2'],
      critical: inaccessibleCaptchas.length > 0,
      classification: inaccessibleCaptchas.length > 0 ? 'kritiek' : 'informational',
    },
  };
}

/**
 * Generic test generator for placeholders
 * This allows us to quickly scaffold all 130 tests
 */
function createGenericTest(
  testId: string,
  testName: string,
  selector: string,
  description: string
): (html: string) => CrawlerTestResult {
  return (html: string) => {
    const $ = cheerio.load(html);
    const elements = $(selector);
    const count = elements.length;

    return {
      testId,
      testName,
      found: count > 0,
      count,
      details: {
        description,
        informational: true,
      },
    };
  };
}

// Tests 38-130: Additional WCAG & Accessibility Tests
export const testElementHasTabindex = createGenericTest('38', 'Element has tabindex', '[tabindex]', 'Page has elements with tabindex');
export const testPageHasList = createGenericTest('39', 'Page has list', 'ul, ol', 'Page has lists');
export const testPageHasElementsWithAriaLabel = createGenericTest('40', 'Page has elements with aria-label', '[aria-label]', 'Elements with ARIA labels');
export const testPageHasElementsWithAriaExpanded = createGenericTest('41', 'Page has elements with aria-expanded', '[aria-expanded]', 'Expandable elements');
export const testPageHasPictures = createGenericTest('42', 'Page has pictures', 'picture', 'Page contains picture elements');
export const testPageHasImages = createGenericTest('43', 'Page has images', 'img', 'Page contains images');
export const testPageHasDecorativeImagesOrTextAlternativeIsMissing = createGenericTest('44', 'Page has decorative images or text alternative is missing', 'img[alt=""], img:not([alt])', 'Decorative or missing alt');
export const testPageHasElementsWithAriaDescribedby = createGenericTest('45', 'Page has elements with aria-describedby', '[aria-describedby]', 'Elements with descriptions');
export const testPageHasButtonWithAriaLabel = createGenericTest('46', 'Page has a button with aria-label', 'button[aria-label]', 'Buttons with ARIA labels');
export const testFormWithRequiredInputFieldsIsValidatedByBrowser = createGenericTest('47', 'Form with required input fields is validated by browser', 'input[required]', 'Browser-validated forms');
export const testPageHasElementsWithAriaLabelledby = createGenericTest('49', 'Page has elements with aria-labelledby', '[aria-labelledby]', 'Elements with labelledby');
export const testPageHasSvgImages = createGenericTest('52', 'Page has SVG-images', 'svg', 'Page contains SVG');
export const testPageHasElementsWithRoleMenu = createGenericTest('53', 'Page has elements with role=menu', '[role="menu"]', 'Menu elements');
export const testPageHasFieldsetWithoutLegend = createGenericTest('54', 'Page has fieldset without legend', 'fieldset:not(:has(legend))', 'Fieldsets missing legends');
export const testPageHasDialogOrModalWindow = createGenericTest('55', 'Page has dialog or modal window', '[role="dialog"], dialog', 'Dialog elements');
export const testPageHasInteractiveImage = createGenericTest('56', 'Page has interactive image', 'img[onclick], img[onkeypress]', 'Interactive images');
export const testPageHasAriaHiddenElement = createGenericTest('10', 'Page has aria-hidden element', '[aria-hidden="true"]', 'Hidden elements');
export const testPageHasInputFieldsWithAutocomplete = createGenericTest('58', 'Page has input fields with autocomplete', 'input[autocomplete]', 'Autocomplete fields');
export const testPageHasAriaInvalidElement = createGenericTest('59', 'Page has aria-invalid element', '[aria-invalid="true"]', 'Invalid elements');
export const testPageHasAriaRequiredElement = createGenericTest('60', 'Page has aria-required element', '[aria-required="true"]', 'Required elements');
export const testPageHasAccesskey = createGenericTest('61', 'Page has accesskey', '[accesskey]', 'Accesskey attributes');
export const testPageHasAriaLiveElement = createGenericTest('62', 'Page has aria-live element', '[aria-live]', 'Live regions');
export const testPageHasBr = createGenericTest('131', 'Page has br', 'br', 'Line breaks');
export const testPageHasStrongOrBold = createGenericTest('65', 'Page has strong or bold', 'strong, b', 'Bold text');
export const testPageHasEmOrItalic = createGenericTest('66', 'Page has em or italic', 'em, i', 'Italic text');
export const testPageHasPreformattedText = createGenericTest('67', 'Page has preformatted text', 'pre', 'Preformatted content');
export const testPageHasCodeBlock = createGenericTest('68', 'Page has code block', 'code', 'Code blocks');
export const testPageHasBlockquote = createGenericTest('69', 'Page has blockquote', 'blockquote', 'Quote blocks');
export const testPageHasAbbreviation = createGenericTest('70', 'Page has abbreviation', 'abbr', 'Abbreviations');
export const testPageHasCitation = createGenericTest('71', 'Page has citation', 'cite', 'Citations');
export const testPageHasMarkedText = createGenericTest('72', 'Page has marked text', 'mark', 'Highlighted text');
export const testPageHasSubscript = createGenericTest('73', 'Page has subscript', 'sub', 'Subscript text');
export const testPageHasSuperscript = createGenericTest('74', 'Page has superscript', 'sup', 'Superscript text');
export const testPageHasTime = createGenericTest('75', 'Page has time', 'time', 'Time elements');
export const testPageHasData = createGenericTest('76', 'Page has data', 'data', 'Data elements');
export const testPageHasDetails = createGenericTest('77', 'Page has details', 'details', 'Details elements');
export const testPageHasSummary = createGenericTest('78', 'Page has summary', 'summary', 'Summary elements');
export const testPageHasArticle = createGenericTest('79', 'Page has article', 'article', 'Article elements');
export const testPageHasSection = createGenericTest('80', 'Page has section', 'section', 'Section elements');
export const testPageHasNav = createGenericTest('81', 'Page has nav', 'nav', 'Navigation elements');
export const testPageHasAside = createGenericTest('82', 'Page has aside', 'aside', 'Aside elements');
export const testPageHasHeader = createGenericTest('83', 'Page has header', 'header', 'Header elements');
export const testPageHasFooter = createGenericTest('84', 'Page has footer', 'footer', 'Footer elements');
export const testPageHasMain = createGenericTest('85', 'Page has main', 'main', 'Main content');
export const testPageHasFigure = createGenericTest('86', 'Page has figure', 'figure', 'Figure elements');
export const testPageHasFigcaption = createGenericTest('87', 'Page has figcaption', 'figcaption', 'Figure captions');
export const testPageHasAddress = createGenericTest('88', 'Page has address', 'address', 'Address elements');
export const testPageHasProgress = createGenericTest('89', 'Page has progress', 'progress', 'Progress bars');
export const testPageHasMeter = createGenericTest('90', 'Page has meter', 'meter', 'Meter elements');
export const testPageHasOutput = createGenericTest('91', 'Page has output', 'output', 'Output elements');
export const testPageHasCanvas = createGenericTest('92', 'Page has canvas', 'canvas', 'Canvas elements');
export const testPageHasObject = createGenericTest('93', 'Page has object', 'object', 'Object embeds');
export const testPageHasEmbed = createGenericTest('94', 'Page has embed', 'embed', 'Embed elements');
export const testPageHasParam = createGenericTest('95', 'Page has param', 'param', 'Param elements');
export const testPageHasSource = createGenericTest('96', 'Page has source', 'source', 'Source elements');
export const testPageHasTrack = createGenericTest('97', 'Page has track', 'track', 'Track elements (captions)');
export const testPageHasMap = createGenericTest('98', 'Page has map', 'map', 'Image maps');
export const testPageHasArea = createGenericTest('99', 'Page has area', 'area', 'Map areas');
export const testPageHasSelect = createGenericTest('100', 'Page has select', 'select', 'Select dropdowns');
export const testPageHasOptgroup = createGenericTest('101', 'Page has optgroup', 'optgroup', 'Option groups');
export const testPageHasOption = createGenericTest('102', 'Page has option', 'option', 'Select options');
export const testPageHasTextarea = createGenericTest('103', 'Page has textarea', 'textarea', 'Text areas');
export const testPageHasKeygen = createGenericTest('104', 'Page has keygen', 'keygen', 'Keygen elements');
export const testPageHasDatalist = createGenericTest('105', 'Page has datalist', 'datalist', 'Data lists');
export const testPageHasInputTypeCheckbox = createGenericTest('106', 'Page has input type="checkbox"', 'input[type="checkbox"]', 'Checkboxes');
export const testPageHasInputTypeRadio = createGenericTest('107', 'Page has input type="radio"', 'input[type="radio"]', 'Radio buttons');
export const testPageHasInputTypeSubmit = createGenericTest('108', 'Page has input type="submit"', 'input[type="submit"]', 'Submit buttons');
export const testPageHasInputTypeReset = createGenericTest('109', 'Page has input type="reset"', 'input[type="reset"]', 'Reset buttons');
export const testPageHasInputTypeButton = createGenericTest('110', 'Page has input type="button"', 'input[type="button"]', 'Button inputs');
export const testPageHasInputTypeFile = createGenericTest('111', 'Page has input type="file"', 'input[type="file"]', 'File inputs');
export const testPageHasInputTypeHidden = createGenericTest('112', 'Page has input type="hidden"', 'input[type="hidden"]', 'Hidden inputs');
export const testPageHasInputTypeImage = createGenericTest('113', 'Page has input type="image"', 'input[type="image"]', 'Image buttons');
export const testPageHasInputTypeDate = createGenericTest('114', 'Page has input type="date"', 'input[type="date"]', 'Date pickers');
export const testPageHasInputTypeTime = createGenericTest('115', 'Page has input type="time"', 'input[type="time"]', 'Time pickers');
export const testPageHasInputTypeDatetimeLocal = createGenericTest('116', 'Page has input type="datetime-local"', 'input[type="datetime-local"]', 'Datetime pickers');
export const testPageHasInputTypeMonth = createGenericTest('117', 'Page has input type="month"', 'input[type="month"]', 'Month pickers');
export const testPageHasInputTypeWeek = createGenericTest('118', 'Page has input type="week"', 'input[type="week"]', 'Week pickers');
export const testPageHasInputTypeColor = createGenericTest('119', 'Page has input type="color"', 'input[type="color"]', 'Color pickers');
export const testPageHasInputTypeRange = createGenericTest('120', 'Page has input type="range"', 'input[type="range"]', 'Range sliders');
export const testPageHasInputTypeSearch = createGenericTest('121', 'Page has input type="search"', 'input[type="search"]', 'Search inputs');
export const testPageHasInputTypeTel = createGenericTest('122', 'Page has input type="tel"', 'input[type="tel"]', 'Telephone inputs');
export const testPageHasInputTypeUrl = createGenericTest('123', 'Page has input type="url"', 'input[type="url"]', 'URL inputs');
export const testPageHasInputTypeEmail = createGenericTest('124', 'Page has input type="email"', 'input[type="email"]', 'Email inputs');
export const testPageHasInputTypeNumber = createGenericTest('125', 'Page has input type="number"', 'input[type="number"]', 'Number inputs');
export const testPageHasInputTypePassword = createGenericTest('126', 'Page has input type="password"', 'input[type="password"]', 'Password fields');
export const testPageHasInputTypeText = createGenericTest('127', 'Page has input type="text"', 'input[type="text"], input:not([type])', 'Text inputs');
export const testPageHasLabel = createGenericTest('128', 'Page has label', 'label', 'Label elements');
export const testPageHasLegend = createGenericTest('129', 'Page has legend', 'legend', 'Legend elements');
export const testPageHasFieldset = createGenericTest('130', 'Page has fieldset', 'fieldset', 'Fieldset elements');

/**
 * Run all 131 tests on HTML content
 */
// Test mapping for running single tests
const TEST_MAP: Record<string, (html: string) => CrawlerTestResult> = {
  'LangAttributeMissingTest': testLangAttributeMissing,
  'TitleMissingTest': testTitleMissing,
  'TitleEmptyTest': testTitleEmpty,
  'ImgMissingAltTest': testImgMissingAlt,
  'FormMissingLabelsTest': testFormMissingLabels,
  'HeadingsAtLeastOneH1Test': testHeadingsAtLeastOneH1,
  'IframeMissingAccessibleNameTest': testIframeMissingAccessibleName,
  'TableTest': testTable,
  'FormTest': testForm,
  'ImgTest': testImg,
  'IframeIsVimeoVideoWithKeysDisabledTest': testIframeIsVimeoVideoWithKeysDisabled,
  'ImgAltTooLongTest': testImgAltTooLong,
  'ImgAltTooShortTest': testImgAltTooShort,
  'ViewportMetaRestrictsScalingTest': testViewportMetaRestrictsScaling,
  'ImageLinkMissingAccessibleNameTest': testImageLinkMissingAccessibleName,
  'PageContainsLinkReadMoreTest': testPageContainsLinkReadMore,
  'PageContainsMultipleSameLinksTest': testPageContainsMultipleSameLinks,
  'IframeIsYouTubeVideoWithKeysEnabledTest': testIframeIsYouTubeVideoWithKeysEnabled,
  'TableWithHeadingsTest': testTableWithHeadings,
  'IframeIsGoogleMapTest': testIframeIsGoogleMap,
  'IframeIsScribitVideoTest': testIframeIsScribitVideo,
  'IframeIsVimeoVideoWithKeysEnabledTest': testIframeIsVimeoVideoWithKeysEnabled,
  'IframeIsVimeoVideoTest': testIframeIsVimeoVideo,
  'IframeTest': testIframe,
  'AudioHasAutoplayTest': testAudioHasAutoplay,
  'AudioControlsTest': testAudioControls,
  'AudioTest': testAudio,
  'VideoHasAutoplayTest': testVideoHasAutoplay,
  'VideoMissingTitleAriaTest': testVideoMissingTitleAria,
  'VideoControlsTest': testVideoControls,
  'VideoTest': testVideo,
  'LinkWithoutTextTest': testLinkWithoutText,
  'EmptyLinkTest': testEmptyLink,
  'TableWithoutHeadersTest': testTableWithoutHeaders,
  'ListTest': testList,
  'DefinitionListTest': testDefinitionList,
  'FormMissingFieldsetTest': testFormMissingFieldset,
  'InputMissingLabelTest': testInputMissingLabel,
  'ButtonEmptyTest': testButtonEmpty,
  'HeadingEmptyTest': testHeadingEmpty,
  'HeadingSkipLevelTest': testHeadingSkipLevel,
  'SkipLinkTest': testSkipLink,
  'AriaLandmarksTest': testAriaLandmarks,
  'IframeIsHCaptchaTest': testIframeIsHCaptcha,
  'ElementHasTabindexTest': testElementHasTabindex,
  'PageHasListTest': testPageHasList,
  'PageHasElementsWithAriaLabelTest': testPageHasElementsWithAriaLabel,
  'PageHasElementsWithAriaExpandedTest': testPageHasElementsWithAriaExpanded,
  'PageHasPicturesTest': testPageHasPictures,
  'PageHasImagesTest': testPageHasImages,
  'PageHasDecorativeImagesOrTextAlternativeIsMissingTest': testPageHasDecorativeImagesOrTextAlternativeIsMissing,
  'PageHasElementsWithAriaDescribedbyTest': testPageHasElementsWithAriaDescribedby,
  'PageHasButtonWithAriaLabelTest': testPageHasButtonWithAriaLabel,
  'FormWithRequiredInputFieldsIsValidatedByBrowserTest': testFormWithRequiredInputFieldsIsValidatedByBrowser,
  'PageHasElementsWithAriaLabelledbyTest': testPageHasElementsWithAriaLabelledby,
  'PageHasSvgImagesTest': testPageHasSvgImages,
  'PageHasElementsWithRoleMenuTest': testPageHasElementsWithRoleMenu,
  'PageHasFieldsetWithoutLegendTest': testPageHasFieldsetWithoutLegend,
  'PageHasDialogOrModalWindowTest': testPageHasDialogOrModalWindow,
  'PageHasInteractiveImageTest': testPageHasInteractiveImage,
  'PageHasAriaHiddenElementTest': testPageHasAriaHiddenElement,
  'PageHasInputFieldsWithAutocompleteTest': testPageHasInputFieldsWithAutocomplete,
  'PageHasAriaInvalidElementTest': testPageHasAriaInvalidElement,
  'PageHasAriaRequiredElementTest': testPageHasAriaRequiredElement,
  'PageHasAccesskeyTest': testPageHasAccesskey,
  'PageHasAriaLiveElementTest': testPageHasAriaLiveElement,
  'PageHasStrongOrBoldTest': testPageHasStrongOrBold,
  'PageHasEmOrItalicTest': testPageHasEmOrItalic,
  'PageHasPreformattedTextTest': testPageHasPreformattedText,
  'PageHasCodeBlockTest': testPageHasCodeBlock,
  'PageHasBlockquoteTest': testPageHasBlockquote,
  'PageHasAbbreviationTest': testPageHasAbbreviation,
  'PageHasCitationTest': testPageHasCitation,
  'PageHasMarkedTextTest': testPageHasMarkedText,
  'PageHasSubscriptTest': testPageHasSubscript,
  'PageHasSuperscriptTest': testPageHasSuperscript,
  'PageHasTimeTest': testPageHasTime,
  'PageHasDataTest': testPageHasData,
  'PageHasDetailsTest': testPageHasDetails,
  'PageHasSummaryTest': testPageHasSummary,
  'PageHasArticleTest': testPageHasArticle,
  'PageHasSectionTest': testPageHasSection,
  'PageHasNavTest': testPageHasNav,
  'PageHasAsideTest': testPageHasAside,
  'PageHasHeaderTest': testPageHasHeader,
  'PageHasFooterTest': testPageHasFooter,
  'PageHasMainTest': testPageHasMain,
  'PageHasFigureTest': testPageHasFigure,
  'PageHasFigcaptionTest': testPageHasFigcaption,
  'PageHasAddressTest': testPageHasAddress,
  'PageHasProgressTest': testPageHasProgress,
  'PageHasMeterTest': testPageHasMeter,
  'PageHasOutputTest': testPageHasOutput,
  'PageHasCanvasTest': testPageHasCanvas,
  'PageHasObjectTest': testPageHasObject,
  'PageHasEmbedTest': testPageHasEmbed,
  'PageHasParamTest': testPageHasParam,
  'PageHasSourceTest': testPageHasSource,
  'PageHasTrackTest': testPageHasTrack,
  'PageHasMapTest': testPageHasMap,
  'PageHasAreaTest': testPageHasArea,
  'PageHasSelectTest': testPageHasSelect,
  'PageHasOptgroupTest': testPageHasOptgroup,
  'PageHasOptionTest': testPageHasOption,
  'PageHasTextareaTest': testPageHasTextarea,
  'PageHasKeygenTest': testPageHasKeygen,
  'PageHasDatalistTest': testPageHasDatalist,
  'PageHasInputTypeCheckboxTest': testPageHasInputTypeCheckbox,
  'PageHasInputTypeRadioTest': testPageHasInputTypeRadio,
  'PageHasInputTypeSubmitTest': testPageHasInputTypeSubmit,
  'PageHasInputTypeResetTest': testPageHasInputTypeReset,
  'PageHasInputTypeButtonTest': testPageHasInputTypeButton,
  'PageHasInputTypeFileTest': testPageHasInputTypeFile,
  'PageHasInputTypeHiddenTest': testPageHasInputTypeHidden,
  'PageHasInputTypeImageTest': testPageHasInputTypeImage,
  'PageHasInputTypeDateTest': testPageHasInputTypeDate,
  'PageHasInputTypeTimeTest': testPageHasInputTypeTime,
  'PageHasInputTypeDatetimeLocalTest': testPageHasInputTypeDatetimeLocal,
  'PageHasInputTypeMonthTest': testPageHasInputTypeMonth,
  'PageHasInputTypeWeekTest': testPageHasInputTypeWeek,
  'PageHasInputTypeColorTest': testPageHasInputTypeColor,
  'PageHasInputTypeRangeTest': testPageHasInputTypeRange,
  'PageHasInputTypeSearchTest': testPageHasInputTypeSearch,
  'PageHasInputTypeTelTest': testPageHasInputTypeTel,
  'PageHasInputTypeUrlTest': testPageHasInputTypeUrl,
  'PageHasInputTypeEmailTest': testPageHasInputTypeEmail,
  'PageHasInputTypeNumberTest': testPageHasInputTypeNumber,
  'PageHasInputTypePasswordTest': testPageHasInputTypePassword,
  'PageHasInputTypeTextTest': testPageHasInputTypeText,
  'PageHasLabelTest': testPageHasLabel,
  'PageHasLegendTest': testPageHasLegend,
  'PageHasFieldsetTest': testPageHasFieldset,
  'PageHasBrTest': testPageHasBr,
  'IframeIsYouTubeVideoWithKeysDisabledTest': testIframeIsYouTubeVideoWithKeysDisabled,
  'LinkMissingHrefTest': testLinkMissingHref,
  'StrongHasMoreThanFourWordsTest': testStrongHasMoreThanFourWords,
  'ElementsStyledWithStrongOrEmTest': testElementsStyledWithStrongOrEm,
};

/**
 * Get list of available test names
 */
export function getAvailableTests(): string[] {
  return Object.keys(TEST_MAP).sort();
}

/**
 * Run a single test by name
 */
export function runSingleTest(html: string, testName: string): CrawlerTestResult | null {
  const testFn = TEST_MAP[testName];
  if (!testFn) {
    return null;
  }
  return testFn(html);
}

export function runAllMVPTests(html: string): CrawlerTestResult[] {
  return [
    // Original 42 tests
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
    testIframeIsVimeoVideoWithKeysDisabled(html),
    testImgAltTooLong(html),
    testImgAltTooShort(html),
    testViewportMetaRestrictsScaling(html),
    testImageLinkMissingAccessibleName(html),
    testPageContainsLinkReadMore(html),
    testPageContainsMultipleSameLinks(html),
    testIframeIsYouTubeVideoWithKeysEnabled(html),
    testTableWithHeadings(html),
    testIframeIsGoogleMap(html),
    testIframeIsScribitVideo(html),
    testIframeIsVimeoVideoWithKeysEnabled(html),
    testIframeIsVimeoVideo(html),
    testIframe(html),
    testAudioHasAutoplay(html),
    testAudioControls(html),
    testAudio(html),
    testVideoHasAutoplay(html),
    testVideoMissingTitleAria(html),
    testVideoControls(html),
    testVideo(html),
    testLinkWithoutText(html),
    testEmptyLink(html),
    testLinkMissingHref(html),
    testTableWithoutHeaders(html),
    testList(html),
    testDefinitionList(html),
    testFormMissingFieldset(html),
    testInputMissingLabel(html),
    testButtonEmpty(html),
    testHeadingEmpty(html),
    testHeadingSkipLevel(html),
    testSkipLink(html),
    testAriaLandmarks(html),
    // New 88 tests (38-130)
    testElementHasTabindex(html),
    testPageHasList(html),
    testPageHasElementsWithAriaLabel(html),
    testPageHasElementsWithAriaExpanded(html),
    testPageHasPictures(html),
    testPageHasImages(html),
    testPageHasDecorativeImagesOrTextAlternativeIsMissing(html),
    testPageHasElementsWithAriaDescribedby(html),
    testPageHasButtonWithAriaLabel(html),
    testFormWithRequiredInputFieldsIsValidatedByBrowser(html),
    testPageHasElementsWithAriaLabelledby(html),
    testPageHasSvgImages(html),
    testPageHasElementsWithRoleMenu(html),
    testPageHasFieldsetWithoutLegend(html),
    testPageHasDialogOrModalWindow(html),
    testPageHasInteractiveImage(html),
    testPageHasAriaHiddenElement(html),
    testPageHasInputFieldsWithAutocomplete(html),
    testPageHasAriaInvalidElement(html),
    testPageHasAriaRequiredElement(html),
    testPageHasAccesskey(html),
    testPageHasAriaLiveElement(html),
    testPageHasStrongOrBold(html),
    testPageHasEmOrItalic(html),
    testPageHasPreformattedText(html),
    testPageHasCodeBlock(html),
    testPageHasBlockquote(html),
    testPageHasAbbreviation(html),
    testPageHasCitation(html),
    testPageHasMarkedText(html),
    testPageHasSubscript(html),
    testPageHasSuperscript(html),
    testPageHasTime(html),
    testPageHasData(html),
    testPageHasDetails(html),
    testPageHasSummary(html),
    testPageHasArticle(html),
    testPageHasSection(html),
    testPageHasNav(html),
    testPageHasAside(html),
    testPageHasHeader(html),
    testPageHasFooter(html),
    testPageHasMain(html),
    testPageHasFigure(html),
    testPageHasFigcaption(html),
    testPageHasAddress(html),
    testPageHasProgress(html),
    testPageHasMeter(html),
    testPageHasOutput(html),
    testPageHasCanvas(html),
    testPageHasObject(html),
    testPageHasEmbed(html),
    testPageHasParam(html),
    testPageHasSource(html),
    testPageHasTrack(html),
    testPageHasMap(html),
    testPageHasArea(html),
    testPageHasSelect(html),
    testPageHasOptgroup(html),
    testPageHasOption(html),
    testPageHasTextarea(html),
    testPageHasKeygen(html),
    testPageHasDatalist(html),
    testPageHasInputTypeCheckbox(html),
    testPageHasInputTypeRadio(html),
    testPageHasInputTypeSubmit(html),
    testPageHasInputTypeReset(html),
    testPageHasInputTypeButton(html),
    testPageHasInputTypeFile(html),
    testPageHasInputTypeHidden(html),
    testPageHasInputTypeImage(html),
    testPageHasInputTypeDate(html),
    testPageHasInputTypeTime(html),
    testPageHasInputTypeDatetimeLocal(html),
    testPageHasInputTypeMonth(html),
    testPageHasInputTypeWeek(html),
    testPageHasInputTypeColor(html),
    testPageHasInputTypeRange(html),
    testPageHasInputTypeSearch(html),
    testPageHasInputTypeTel(html),
    testPageHasInputTypeUrl(html),
    testPageHasInputTypeEmail(html),
    testPageHasInputTypeNumber(html),
    testPageHasInputTypePassword(html),
    testPageHasInputTypeText(html),
    testPageHasLabel(html),
    testPageHasLegend(html),
    testPageHasFieldset(html),
    testPageHasBr(html),
    // New test #132: YouTube with keyboard disabled
    testIframeIsYouTubeVideoWithKeysDisabled(html),
    // New test #133: Strong with more than 4 words
    testStrongHasMoreThanFourWords(html),
    // New test #134: Elements styled with strong/em
    testElementsStyledWithStrongOrEm(html),
  ];
}