/**
 * Browser-based crawler tests — vereisen een gerenderde pagina (Puppeteer).
 *
 * In tegenstelling tot de HTML-only tests in `tests.ts` gebruiken deze
 * `page.evaluate()` om computed styles uit de echte browser te lezen.
 * Daarmee kunnen we WCAG-criteria testen die met enkel HTML-parsing
 * niet te bepalen zijn (kleurcontrast, computed display, etc).
 */

import type { Page } from 'puppeteer';

export interface ContrastIssue {
  selector: string;
  tagName: string;
  text: string; // eerste 80 tekens
  fontSize: number; // pixels
  fontWeight: number;
  isLargeText: boolean;
  color: string;
  backgroundColor: string;
  contrastRatio: number;
  required: number; // 4.5 of 3.0
  html: string; // eerste 200 tekens van outerHTML
}

export interface ContrastTestResult {
  testId: 'ColorContrast',
  testName: 'ColorContrastTest',
  found: boolean,
  count: number,
  details: {
    issues: ContrastIssue[],
    totalCount: number,
    truncated: boolean,
    elementsScanned: number,
    elementsWithUndeterminableBackground: number,
    wcagLevel: 'AA',
    wcagCriteria: ['1.4.3'],
    informational: false,
  },
}

/**
 * Draait in de browser zelf via page.evaluate.
 * Berekent contrast-ratio voor elk text-element op de pagina.
 */
export async function testColorContrast(page: Page, maxIssues = 50): Promise<ContrastTestResult> {
  // Workaround: tsx/esbuild wrapt named functions in __name(); injecteer no-op in browser.
  await page.evaluate(() => { (window as any).__name = (fn: any) => fn; });

  const result = await page.evaluate((maxIssuesArg) => {
    // ---- helpers (binnen browser-context) — arrow functions ivm tsx/esbuild ----
    const parseRgb = (str: string): [number, number, number, number] | null => {
      const m = str.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
      if (parts.length < 3) return null;
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    };

    const relLum = (r: number, g: number, b: number): number => {
      const f = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };

    const contrast = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
      const l1 = relLum(rgb1[0], rgb1[1], rgb1[2]);
      const l2 = relLum(rgb2[0], rgb2[1], rgb2[2]);
      const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (a + 0.05) / (b + 0.05);
    };

    const effectiveBackground = (el: Element): { rgb: [number, number, number] | null; hasImage: boolean } => {
      let node: Element | null = el;
      while (node) {
        const style = window.getComputedStyle(node);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          return { rgb: null, hasImage: true };
        }
        const bg = parseRgb(style.backgroundColor);
        if (bg && bg[3] > 0.95) {
          return { rgb: [bg[0], bg[1], bg[2]], hasImage: false };
        }
        node = node.parentElement;
      }
      return { rgb: [255, 255, 255], hasImage: false };
    };

    const shortText = (s: string): string => {
      const t = (s || '').replace(/\s+/g, ' ').trim();
      return t.length > 80 ? t.slice(0, 80) + '…' : t;
    };

    const shortHtml = (s: string): string => {
      const t = (s || '').replace(/\s+/g, ' ').trim();
      return t.length > 200 ? t.slice(0, 200) + '…' : t;
    };

    const cssPath = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      let depth = 0;
      while (node && depth < 4) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          part += `#${node.id}`;
          parts.unshift(part);
          break;
        }
        const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) part += '.' + cls.join('.');
        parts.unshift(part);
        node = node.parentElement;
        depth++;
      }
      return parts.join(' > ');
    };

    // ---- main scan ----
    const issues: any[] = [];
    let scanned = 0;
    let undeterminable = 0;

    // Verzamel alle elementen die directe tekst-knooppunten bevatten.
    const all = document.querySelectorAll('body *');
    for (const el of Array.from(all)) {
      // Skip onzichtbare elementen
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      // Skip SVG <title> — accessible name voor SVG, niet visueel
      if (el.tagName === 'TITLE' || el.tagName === 'title' || el.closest('svg')) continue;

      // Skip visually-hidden / sr-only patronen (off-screen voor zienden)
      const cls = (el.getAttribute('class') || '').toLowerCase();
      if (
        cls.includes('visuallyhidden') ||
        cls.includes('visually-hidden') ||
        cls.includes('sr-only') ||
        cls.includes('screen-reader') ||
        cls.includes('screenreader')
      ) continue;

      // Heuristiek: position absolute + clip / clip-path = off-screen tekst
      if (style.position === 'absolute') {
        const clip = style.clip || '';
        const clipPath = style.clipPath || '';
        if (
          clip.includes('rect(0') || clip === 'rect(1px, 1px, 1px, 1px)' ||
          clipPath.includes('inset(50%)') || clipPath.includes('inset(100%)')
        ) continue;
        // Ook: width/height 1px combinatie
        const w = parseFloat(style.width);
        const h = parseFloat(style.height);
        if (w <= 1 && h <= 1) continue;
      }

      // Skip elementen zonder eigen tekst (alleen child-elements telt niet)
      let directText = '';
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          directText += (node.textContent || '');
        }
      }
      const trimmed = directText.trim();
      if (!trimmed) continue;

      scanned++;

      const fg = parseRgb(style.color);
      if (!fg) continue;

      const bg = effectiveBackground(el);
      if (bg.hasImage) {
        undeterminable++;
        continue;
      }
      if (!bg.rgb) continue;

      const ratio = contrast([fg[0], fg[1], fg[2]], bg.rgb);

      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight, 10) || 400;
      const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const required = isLargeText ? 3.0 : 4.5;

      if (ratio < required) {
        if (issues.length < maxIssuesArg) {
          issues.push({
            selector: cssPath(el),
            tagName: el.tagName.toLowerCase(),
            text: shortText(trimmed),
            fontSize: Math.round(fontSize * 10) / 10,
            fontWeight,
            isLargeText,
            color: `rgb(${fg[0]}, ${fg[1]}, ${fg[2]})`,
            backgroundColor: `rgb(${bg.rgb[0]}, ${bg.rgb[1]}, ${bg.rgb[2]})`,
            contrastRatio: Math.round(ratio * 100) / 100,
            required,
            html: shortHtml((el as HTMLElement).outerHTML || ''),
          });
        }
      }
    }

    return {
      issues,
      elementsScanned: scanned,
      elementsWithUndeterminableBackground: undeterminable,
      totalIssuesFound: issues.length, // truncated to maxIssues but we count below
    };
  }, maxIssues);

  // Voor accurate totaal-count: tweede pass die alleen telt (zonder details te bouwen)
  const totalCount = await page.evaluate(() => {
    const parseRgb = (str: string): [number, number, number, number] | null => {
      const m = str.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
      if (parts.length < 3) return null;
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    };
    const relLum = (r: number, g: number, b: number): number => {
      const f = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const contrast = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
      const l1 = relLum(rgb1[0], rgb1[1], rgb1[2]);
      const l2 = relLum(rgb2[0], rgb2[1], rgb2[2]);
      const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (a + 0.05) / (b + 0.05);
    };
    const effBg = (el: Element): [number, number, number] | null => {
      let node: Element | null = el;
      while (node) {
        const s = window.getComputedStyle(node);
        if (s.backgroundImage && s.backgroundImage !== 'none') return null;
        const bg = parseRgb(s.backgroundColor);
        if (bg && bg[3] > 0.95) return [bg[0], bg[1], bg[2]];
        node = node.parentElement;
      }
      return [255, 255, 255];
    };

    let n = 0;
    const all = document.querySelectorAll('body *');
    for (const el of Array.from(all)) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      // SVG title overslaan
      if (el.tagName === 'TITLE' || el.tagName === 'title' || el.closest('svg')) continue;
      // Visually-hidden patronen
      const cls = (el.getAttribute('class') || '').toLowerCase();
      if (
        cls.includes('visuallyhidden') ||
        cls.includes('visually-hidden') ||
        cls.includes('sr-only') ||
        cls.includes('screen-reader') ||
        cls.includes('screenreader')
      ) continue;
      if (style.position === 'absolute') {
        const clip = style.clip || '';
        const clipPath = style.clipPath || '';
        if (
          clip.includes('rect(0') || clip === 'rect(1px, 1px, 1px, 1px)' ||
          clipPath.includes('inset(50%)') || clipPath.includes('inset(100%)')
        ) continue;
        const w = parseFloat(style.width);
        const h = parseFloat(style.height);
        if (w <= 1 && h <= 1) continue;
      }
      let directText = '';
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) directText += (node.textContent || '');
      }
      if (!directText.trim()) continue;
      const fg = parseRgb(style.color);
      if (!fg) continue;
      const bg = effBg(el);
      if (!bg) continue;
      const ratio = contrast([fg[0], fg[1], fg[2]], bg);
      const fs = parseFloat(style.fontSize);
      const fw = parseInt(style.fontWeight, 10) || 400;
      const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const required = large ? 3.0 : 4.5;
      if (ratio < required) n++;
    }
    return n;
  });

  return {
    testId: 'ColorContrast',
    testName: 'ColorContrastTest',
    found: totalCount > 0,
    count: totalCount,
    details: {
      issues: result.issues,
      totalCount,
      truncated: totalCount > maxIssues,
      elementsScanned: result.elementsScanned,
      elementsWithUndeterminableBackground: result.elementsWithUndeterminableBackground,
      wcagLevel: 'AA',
      wcagCriteria: ['1.4.3'],
      informational: false,
    },
  };
}

// ============================================================================
// WCAG 2.5.3 — Label in name
// ============================================================================

export interface LabelInNameIssue {
  selector: string;
  tagName: string;
  visibleText: string;
  accessibleName: string;
  nameSource: 'aria-label' | 'aria-labelledby';
  html: string;
}

export interface LabelInNameTestResult {
  testId: 'LabelInName',
  testName: 'LabelInNameTest',
  found: boolean,
  count: number,
  details: {
    issues: LabelInNameIssue[],
    totalCount: number,
    truncated: boolean,
    elementsScanned: number,
    wcagLevel: 'A',
    wcagCriteria: ['2.5.3'],
    informational: false,
  },
}

/**
 * Detecteert elementen waar de zichtbare tekst NIET in de toegankelijke naam zit.
 * Voorbeeld fout: <button aria-label="Search">Zoeken</button> — spraakbesturing
 * "klik Zoeken" werkt niet, want de a11y-naam is "Search".
 */
export async function testLabelInName(page: Page, maxIssues = 50): Promise<LabelInNameTestResult> {
  // Workaround: tsx/esbuild wrapt named functions in __name(); injecteer no-op in browser.
  await page.evaluate(() => { (window as any).__name = (fn: any) => fn; });

  const scan = await page.evaluate((maxIssuesArg) => {
    const normalize = (s: string): string => {
      return (s || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        // Verwijder typische "ornament"-tekens die voor screenreaders genegeerd worden
        .replace(/[>›»→\-–—|:·]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const shortText = (s: string): string => {
      const t = (s || '').replace(/\s+/g, ' ').trim();
      return t.length > 80 ? t.slice(0, 80) + '…' : t;
    };

    const shortHtml = (s: string): string => {
      const t = (s || '').replace(/\s+/g, ' ').trim();
      return t.length > 200 ? t.slice(0, 200) + '…' : t;
    };

    const cssPath = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      let depth = 0;
      while (node && depth < 4) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          part += `#${node.id}`;
          parts.unshift(part);
          break;
        }
        const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) part += '.' + cls.join('.');
        parts.unshift(part);
        node = node.parentElement;
        depth++;
      }
      return parts.join(' > ');
    };

    // Selecteer interactieve elementen die een zichtbaar label EN een accessible name kunnen hebben
    const selector = [
      'button',
      'a[href]',
      'input[type="submit"]',
      'input[type="button"]',
      'input[type="reset"]',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="checkbox"]',
      '[role="radio"]',
    ].join(', ');

    const all = document.querySelectorAll(selector);
    const issues: any[] = [];
    let scanned = 0;
    let total = 0;

    for (const el of Array.from(all)) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');

      // Element moet een EXPLICIETE accessible name hebben — anders is er geen mismatch mogelijk
      let accessibleName = '';
      let nameSource: 'aria-label' | 'aria-labelledby' | null = null;

      if (ariaLabel && ariaLabel.trim()) {
        accessibleName = ariaLabel;
        nameSource = 'aria-label';
      } else if (ariaLabelledby && ariaLabelledby.trim()) {
        // Resolve aria-labelledby naar tekst
        const ids = ariaLabelledby.split(/\s+/);
        const texts: string[] = [];
        for (const id of ids) {
          const ref = document.getElementById(id);
          if (ref) texts.push(ref.textContent || '');
        }
        accessibleName = texts.join(' ');
        nameSource = 'aria-labelledby';
      }

      if (!nameSource || !accessibleName.trim()) continue;

      // Zichtbare tekst van het element
      const visibleText = (el as HTMLElement).innerText || el.textContent || '';
      if (!visibleText.trim()) continue;

      scanned++;

      const normVisible = normalize(visibleText);
      const normAccessible = normalize(accessibleName);

      if (!normVisible) continue;

      // Check: zit de zichtbare tekst in de accessible name?
      if (!normAccessible.includes(normVisible)) {
        total++;
        if (issues.length < maxIssuesArg) {
          issues.push({
            selector: cssPath(el),
            tagName: el.tagName.toLowerCase(),
            visibleText: shortText(visibleText),
            accessibleName: shortText(accessibleName),
            nameSource,
            html: shortHtml((el as HTMLElement).outerHTML || ''),
          });
        }
      }
    }

    return { issues, elementsScanned: scanned, totalCount: total };
  }, maxIssues);

  return {
    testId: 'LabelInName',
    testName: 'LabelInNameTest',
    found: scan.totalCount > 0,
    count: scan.totalCount,
    details: {
      issues: scan.issues,
      totalCount: scan.totalCount,
      truncated: scan.totalCount > maxIssues,
      elementsScanned: scan.elementsScanned,
      wcagLevel: 'A',
      wcagCriteria: ['2.5.3'],
      informational: false,
    },
  };
}

// ============================================================================
// WCAG 2.2.1 — Timing adjustable (auto-refresh/redirect zonder waarschuwing)
// ============================================================================

export interface AutoRefreshIssue {
  type: 'meta-refresh' | 'meta-redirect' | 'http-redirect';
  source: 'rendered-dom' | 'raw-response' | 'http-status';
  delaySeconds: number;
  target: string | null; // URL bij redirect, null bij refresh
  html: string;
}

export interface AutoRefreshTestResult {
  testId: 'AutoRefresh',
  testName: 'AutoRefreshTest',
  found: boolean,
  count: number,
  details: {
    issues: AutoRefreshIssue[],
    totalCount: number,
    wcagLevel: 'A',
    wcagCriteria: ['2.2.1', '2.2.4', '3.2.5'],
    informational: false,
  },
}

/**
 * Detecteert auto-refresh/redirect zonder waarschuwing.
 *
 * Onderzoekt:
 * - HTTP 3xx redirects op de oorspronkelijke URL (server-side redirect)
 * - <meta http-equiv="refresh"> in de eerste response body
 * - <meta http-equiv="refresh"> in de gerenderde DOM (na redirects)
 *
 * Puppeteer volgt redirects automatisch, dus de gerenderde DOM mist meestal
 * de redirect-meta. Daarom doen we daarnaast een raw fetch met redirect:'manual'.
 *
 * WCAG 2.2.1: tijdslimieten moeten uitschakelbaar/verlengbaar zijn (uitzondering
 * >20 uur). 0 = directe redirect — apart geval, ook gerapporteerd voor analyse.
 */
export async function testAutoRefresh(page: Page, originalUrl?: string): Promise<AutoRefreshTestResult> {
  await page.evaluate(() => { (window as any).__name = (fn: any) => fn; });

  // 1. Check de gerenderde DOM (zeldzaam, maar mogelijk)
  const scanDom = await page.evaluate(() => {
    const issues: any[] = [];
    const metas = document.querySelectorAll('meta[http-equiv]');
    for (const meta of Array.from(metas)) {
      const equiv = (meta.getAttribute('http-equiv') || '').toLowerCase();
      if (equiv !== 'refresh') continue;
      const content = meta.getAttribute('content') || '';
      const m = content.match(/^\s*(\d+(?:\.\d+)?)\s*(?:;\s*url=(.+))?\s*$/i);
      if (!m) continue;
      const delay = parseFloat(m[1]);
      const target = m[2] ? m[2].trim() : null;
      issues.push({
        type: target ? 'meta-redirect' : 'meta-refresh',
        source: 'rendered-dom',
        delaySeconds: delay,
        target,
        html: meta.outerHTML,
      });
    }
    return issues;
  });

  // 2. Raw fetch op de originele URL, zonder redirects te volgen
  const rawIssues: any[] = [];
  if (originalUrl) {
    try {
      const res = await fetch(originalUrl, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Shift2-AuditCLI/1.0)',
        },
      });

      // HTTP-redirect
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        rawIssues.push({
          type: 'http-redirect',
          source: 'http-status',
          delaySeconds: 0,
          target: location,
          html: `HTTP ${res.status} → ${location || '(no Location header)'}`,
        });
      } else {
        // 200: check body voor meta-refresh
        const body = await res.text();
        const metaRefreshRegex = /<meta\s+[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi;
        const matches = body.match(metaRefreshRegex);
        if (matches) {
          for (const tag of matches) {
            const contentMatch = tag.match(/content\s*=\s*["']?\s*(\d+(?:\.\d+)?)\s*(?:;\s*url=([^"'>\s]+))?/i);
            if (!contentMatch) continue;
            const delay = parseFloat(contentMatch[1]);
            const target = contentMatch[2] ? contentMatch[2].trim() : null;
            rawIssues.push({
              type: target ? 'meta-redirect' : 'meta-refresh',
              source: 'raw-response',
              delaySeconds: delay,
              target,
              html: tag,
            });
          }
        }
      }
    } catch (err: any) {
      // Stil falen — als raw fetch niet werkt, gebruik je alleen DOM-detectie
    }
  }

  // Combineer + dedupe op (type, delay, target)
  const all = [...scanDom, ...rawIssues];
  const seen = new Set<string>();
  const deduped = all.filter((i) => {
    const key = `${i.type}|${i.delaySeconds}|${i.target || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    testId: 'AutoRefresh',
    testName: 'AutoRefreshTest',
    found: deduped.length > 0,
    count: deduped.length,
    details: {
      issues: deduped,
      totalCount: deduped.length,
      wcagLevel: 'A',
      wcagCriteria: ['2.2.1', '2.2.4', '3.2.5'],
      informational: false,
    },
  };
}

// ============================================================================
// WCAG 4.1.2 — Hidden element heeft focusable content (browser-versie)
// ============================================================================

export interface HiddenFocusableIssue {
  selector: string;
  tagName: string;
  reason: string;
  focusableCount: number;
  sampleFocusables: string[];
}

export interface HiddenFocusableTestResult {
  testId: 'HiddenWithFocusableContent',
  testName: 'HiddenWithFocusableContentTest',
  found: boolean,
  count: number,
  details: {
    issues: HiddenFocusableIssue[],
    totalCount: number,
    truncated: boolean,
    wcagLevel: 'A',
    wcagCriteria: ['4.1.2'],
    informational: false,
  },
}

/**
 * Detecteert elementen die VISUEEL ZICHTBAAR zijn maar aria-hidden="true"
 * hebben, en focusbare content bevatten. De combinatie zichtbaar + hidden
 * voor hulpsoftware + bereikbaar via Tab is een echte WCAG 4.1.2-bug.
 *
 * Elementen die volledig verborgen zijn (display:none, visibility:hidden)
 * worden NIET geflagd — daar is aria-hidden="true" juist correct.
 */
export async function testHiddenWithFocusableContent(
  page: Page,
  maxIssues = 50,
): Promise<HiddenFocusableTestResult> {
  await page.evaluate(() => {
    (window as any).__name = (fn: any) => fn;
  });

  const scan = await page.evaluate((maxIssuesArg) => {
    const isVisuallyVisible = (el: Element): boolean => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (parseFloat(style.opacity) === 0) return false;
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return true;
    };

    const cssPath = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      let depth = 0;
      while (node && depth < 4) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          part += `#${node.id}`;
          parts.unshift(part);
          break;
        }
        const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) part += '.' + cls.join('.');
        parts.unshift(part);
        node = node.parentElement;
        depth++;
      }
      return parts.join(' > ');
    };

    const shortHtml = (s: string): string => {
      const t = (s || '').replace(/\s+/g, ' ').trim();
      return t.length > 100 ? t.slice(0, 100) + '…' : t;
    };

    const focusableSelector = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const issues: any[] = [];
    let total = 0;

    const hiddenContainers = document.querySelectorAll('[aria-hidden="true"]');
    for (const el of Array.from(hiddenContainers)) {
      if (!isVisuallyVisible(el)) continue;

      // Verzamel echt focusbare kinderen
      const candidates = el.querySelectorAll(focusableSelector);
      const trulyFocusable: Element[] = [];
      for (const f of Array.from(candidates)) {
        const tabindex = f.getAttribute('tabindex');
        if (tabindex === '-1') continue;
        // Sla over als ook deze focusbare niet zichtbaar is
        if (!isVisuallyVisible(f)) continue;
        trulyFocusable.push(f);
      }
      if (trulyFocusable.length === 0) continue;

      total++;
      if (issues.length < maxIssuesArg) {
        issues.push({
          selector: cssPath(el),
          tagName: el.tagName.toLowerCase(),
          reason: 'aria-hidden="true" terwijl element visueel zichtbaar is',
          focusableCount: trulyFocusable.length,
          sampleFocusables: trulyFocusable.slice(0, 3).map((f) => shortHtml((f as HTMLElement).outerHTML)),
        });
      }
    }

    return { issues, totalCount: total };
  }, maxIssues);

  return {
    testId: 'HiddenWithFocusableContent',
    testName: 'HiddenWithFocusableContentTest',
    found: scan.totalCount > 0,
    count: scan.totalCount,
    details: {
      issues: scan.issues,
      totalCount: scan.totalCount,
      truncated: scan.totalCount > maxIssues,
      wcagLevel: 'A',
      wcagCriteria: ['4.1.2'],
      informational: false,
    },
  };
}

// ============================================================================
// WCAG 1.3.1 — Tabelkop-cel mist een koptekst-rol (browser-versie)
// ============================================================================

export interface TableHeaderVisuallyStyledIssue {
  cellSelector: string;
  cellText: string;
  signals: string[];
  fontWeight: number;
  backgroundColor: string;
  position: 'first-cell-of-row' | 'in-first-column' | 'in-first-row' | 'other';
}

export interface TableHeaderVisuallyStyledTestResult {
  testId: 'TableHeaderCellVisuallyStyled',
  testName: 'TableHeaderCellMissingHeaderRoleTest',
  found: boolean,
  count: number,
  details: {
    issues: TableHeaderVisuallyStyledIssue[],
    totalCount: number,
    truncated: boolean,
    tablesScanned: number,
    wcagLevel: 'A',
    wcagCriteria: ['1.3.1'],
    informational: false,
  },
}

/**
 * Detecteert td-cellen die visueel als kopcel zijn opgemaakt maar geen th
 * zijn en geen role="columnheader"/"rowheader" hebben.
 *
 * Signalen die we combineren via computed styles:
 *   1. font-weight >= 600 terwijl de meeste andere cellen in dezelfde rij
 *      een lager font-weight hebben
 *   2. background-color anders dan de meeste andere cellen in dezelfde rij
 *   3. positie: eerste cel van elke rij, of alle cellen in de eerste rij/kolom
 *
 * Bij 2 of meer signalen → flag.
 */
export async function testTableHeaderCellMissingHeaderRole(
  page: Page,
  maxIssues = 50,
): Promise<TableHeaderVisuallyStyledTestResult> {
  await page.evaluate(() => {
    (window as any).__name = (fn: any) => fn;
  });

  const scan = await page.evaluate((maxIssuesArg) => {
    const cssPath = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      let depth = 0;
      while (node && depth < 4) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          part += `#${node.id}`;
          parts.unshift(part);
          break;
        }
        const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2);
        if (cls.length) part += '.' + cls.join('.');
        parts.unshift(part);
        node = node.parentElement;
        depth++;
      }
      return parts.join(' > ');
    };

    const issues: any[] = [];
    let total = 0;
    let tablesScanned = 0;

    const tables = document.querySelectorAll('table');
    for (const table of Array.from(tables)) {
      tablesScanned++;

      // Skip layout-tabellen (role=presentation/none)
      const tableRole = table.getAttribute('role');
      if (tableRole === 'presentation' || tableRole === 'none') continue;

      // Pak alle rijen (echte rijen via tr, ongeacht of in thead/tbody)
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) continue; // te klein om patroon te detecteren

      // Per rij: alle td's analyseren
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const tds = Array.from(row.querySelectorAll(':scope > td'));
        if (tds.length === 0) continue;

        // Verzamel font-weights en backgrounds van alle td's in deze rij
        const cellInfo = tds.map((td) => {
          const style = window.getComputedStyle(td);
          return {
            el: td,
            fontWeight: parseInt(style.fontWeight, 10) || 400,
            backgroundColor: style.backgroundColor,
            text: (td.textContent || '').trim(),
          };
        });

        // Bepaal de "normale" font-weight en background voor deze rij
        // (modus = meest voorkomende waarde)
        const weightCounts = new Map<number, number>();
        const bgCounts = new Map<string, number>();
        for (const c of cellInfo) {
          weightCounts.set(c.fontWeight, (weightCounts.get(c.fontWeight) || 0) + 1);
          bgCounts.set(c.backgroundColor, (bgCounts.get(c.backgroundColor) || 0) + 1);
        }
        const modeWeight = Array.from(weightCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 400;
        const modeBg = Array.from(bgCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

        // Per cel beoordelen
        for (let cellIdx = 0; cellIdx < cellInfo.length; cellIdx++) {
          const c = cellInfo[cellIdx];
          const role = (c.el.getAttribute('role') || '').toLowerCase();
          // Skip als het al expliciet als kop is gemarkeerd
          if (role === 'columnheader' || role === 'rowheader') continue;
          if (!c.text) continue; // lege cellen overslaan

          const signals: string[] = [];

          // Signaal 1: vetgedrukt + zwaarder dan modus
          if (c.fontWeight >= 600 && c.fontWeight > modeWeight) {
            signals.push(`font-weight ${c.fontWeight} (rest van rij: ${modeWeight})`);
          }

          // Signaal 2: andere achtergrond dan modus
          if (c.backgroundColor && c.backgroundColor !== modeBg && c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent') {
            signals.push(`background-color ${c.backgroundColor} (rest van rij: ${modeBg})`);
          }

          // Signaal 3: positie (eerste cel van rij die >1 cel heeft, eerste rij)
          let position: string = 'other';
          if (cellIdx === 0 && cellInfo.length > 1) {
            signals.push('eerste cel van de rij (mogelijk rij-kop)');
            position = 'first-cell-of-row';
          } else if (rowIdx === 0) {
            position = 'in-first-row';
          }

          // 2+ signalen = flag
          if (signals.length >= 2) {
            total++;
            if (issues.length < maxIssuesArg) {
              issues.push({
                cellSelector: cssPath(c.el),
                cellText: c.text.slice(0, 60),
                signals,
                fontWeight: c.fontWeight,
                backgroundColor: c.backgroundColor,
                position,
              });
            }
          }
        }
      }
    }

    return { issues, totalCount: total, tablesScanned };
  }, maxIssues);

  return {
    testId: 'TableHeaderCellVisuallyStyled',
    testName: 'TableHeaderCellMissingHeaderRoleTest',
    found: scan.totalCount > 0,
    count: scan.totalCount,
    details: {
      issues: scan.issues,
      totalCount: scan.totalCount,
      truncated: scan.totalCount > maxIssues,
      tablesScanned: scan.tablesScanned,
      wcagLevel: 'A',
      wcagCriteria: ['1.3.1'],
      informational: false,
    },
  };
}
