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
 * Page contains multiple links with the same link purpose
 */
export function testPageContainsMultipleSameLinks(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const links = $('a');
  const linkMap = new Map<string, number>();
  const details: any[] = [];

  links.each((i, link) => {
    const text = $(link).text().trim();
    if (text) {
      linkMap.set(text, (linkMap.get(text) || 0) + 1);
    }
  });

  let count = 0;
  linkMap.forEach((occurrences, text) => {
    if (occurrences > 1) {
      count += occurrences;
      if (details.length < 10) {
        details.push({ text, occurrences });
      }
    }
  });

  return {
    testId: '6',
    testName: 'PageContainsMultipleSameLinksTest',
    found: count > 0,
    count: count,
    details: { duplicateLinks: details, totalCount: count },
  };
}

/**
 * #8: IframeIsYouTubeVideoWithKeysEnabledTest
 * Page has YouTube video with single character keys enabled
 */
export function testIframeIsYouTubeVideoWithKeysEnabled(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const youtubeIframes = $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
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
    details: { iframes: details, totalCount: count },
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
 * Page uses ARIA landmarks
 */
export function testAriaLandmarks(html: string): CrawlerTestResult {
  const $ = cheerio.load(html);
  const landmarks = $('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="search"]');
  const semanticLandmarks = $('header, nav, main, footer, aside');
  const count = landmarks.length + semanticLandmarks.length;

  const details: any[] = [];

  landmarks.each((i, el) => {
    if (details.length < 10) {
      details.push({
        type: 'aria-role',
        role: $(el).attr('role'),
        tag: el.tagName,
      });
    }
  });

  semanticLandmarks.each((i, el) => {
    if (details.length < 10) {
      details.push({
        type: 'semantic',
        tag: el.tagName,
      });
    }
  });

  return {
    testId: '37',
    testName: 'AriaLandmarksTest',
    found: count > 0,
    count: count,
    details: {
      landmarks: details,
      totalCount: count,
      informational: true,
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
 * Run all 130 tests on HTML content
 */
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
  ];
}