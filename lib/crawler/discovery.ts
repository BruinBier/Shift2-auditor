import * as cheerio from 'cheerio';

export interface DiscoveredPage {
  url: string;
  title: string | null;
  isInternal: boolean;
  foundOn: string;
}

/**
 * Normalize a URL to ensure it's absolute and clean
 */
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);
    const normalized = new URL(url, baseUrl);

    // Remove fragment (hash)
    normalized.hash = '';

    // Remove trailing slash for consistency
    let path = normalized.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    normalized.pathname = path;

    return normalized.toString();
  } catch {
    return '';
  }
}

/**
 * Check if a URL is internal (same domain as base)
 */
function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);
    return urlObj.hostname === baseObj.hostname;
  } catch {
    return false;
  }
}

/**
 * Check if URL should be excluded (common patterns to skip)
 */
function shouldExcludeUrl(url: string): boolean {
  const lowercaseUrl = url.toLowerCase();

  // Skip common file types
  const excludedExtensions = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.tar', '.gz',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.mp4', '.avi', '.mov', '.mp3', '.wav',
    '.css', '.js', '.json', '.xml'
  ];

  if (excludedExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
    return true;
  }

  // Skip mailto, tel, javascript links
  if (lowercaseUrl.startsWith('mailto:') ||
      lowercaseUrl.startsWith('tel:') ||
      lowercaseUrl.startsWith('javascript:')) {
    return true;
  }

  return false;
}

/**
 * Discover all pages on a website starting from a URL
 * @param startUrl The URL to start discovering from
 * @param maxDepth Maximum depth to crawl (default: 2)
 * @param maxPages Maximum number of pages to discover (default: 100)
 */
export async function discoverSite(
  startUrl: string,
  maxDepth: number = 2,
  maxPages: number = 100
): Promise<DiscoveredPage[]> {
  const discovered = new Map<string, DiscoveredPage>();
  const toVisit: Array<{ url: string; depth: number; foundOn: string }> = [
    { url: startUrl, depth: 0, foundOn: startUrl }
  ];
  const visited = new Set<string>();

  console.log(`[DISCOVERY] Starting site discovery from ${startUrl}`);
  console.log(`[DISCOVERY] Max depth: ${maxDepth}, Max pages: ${maxPages}`);

  while (toVisit.length > 0 && discovered.size < maxPages) {
    const current = toVisit.shift();
    if (!current) break;

    const { url, depth, foundOn } = current;

    // Skip if already visited
    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`[DISCOVERY] Crawling ${url} (depth: ${depth})`);

    try {
      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Shift2-Auditor/1.0 (Site Discovery Bot)',
        },
      });

      if (!response.ok) {
        console.log(`[DISCOVERY] Failed to fetch ${url}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Get page title and clean it up
      let title = $('title').text().trim() || null;

      // Clean up title: remove trailing "Toegankelijkheid" or "Toegankelijk"
      if (title) {
        title = title.replace(/Toegankelijkheid$/gi, '');
        title = title.replace(/Toegankelijk$/gi, '');
        // Remove duplicate words at the end
        title = title.replace(/(\w{3,})\1+$/gi, '$1');
        // Remove trailing whitespace and periods
        title = title.trim().replace(/\s*\.\s*$/g, '');
        // If nothing left, set to null
        if (!title) title = null;
      }

      // Add current page to discovered
      discovered.set(url, {
        url,
        title,
        isInternal: isInternalUrl(url, startUrl),
        foundOn,
      });

      // If we haven't reached max depth, find more links
      if (depth < maxDepth) {
        const links = $('a[href]');

        links.each((_, element) => {
          const href = $(element).attr('href');
          if (!href) return;

          const absoluteUrl = normalizeUrl(href, url);
          if (!absoluteUrl) return;

          // Skip if excluded, external, or already visited/queued
          if (shouldExcludeUrl(absoluteUrl)) return;
          if (!isInternalUrl(absoluteUrl, startUrl)) return;
          if (visited.has(absoluteUrl)) return;
          if (toVisit.some(item => item.url === absoluteUrl)) return;

          // Add to queue
          toVisit.push({
            url: absoluteUrl,
            depth: depth + 1,
            foundOn: url,
          });
        });
      }

    } catch (error) {
      console.error(`[DISCOVERY] Error crawling ${url}:`, error);
    }
  }

  console.log(`[DISCOVERY] Completed. Discovered ${discovered.size} pages`);
  return Array.from(discovered.values());
}

/**
 * Discover pages from a single page (no recursion)
 */
export async function discoverLinksOnPage(url: string): Promise<DiscoveredPage[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Shift2-Auditor/1.0 (Link Discovery Bot)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const links = new Set<string>();
    const discovered: DiscoveredPage[] = [];

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      const absoluteUrl = normalizeUrl(href, url);
      if (!absoluteUrl) return;

      // Skip if excluded or already found
      if (shouldExcludeUrl(absoluteUrl)) return;
      if (links.has(absoluteUrl)) return;

      links.add(absoluteUrl);

      discovered.push({
        url: absoluteUrl,
        title: $(element).text().trim() || null,
        isInternal: isInternalUrl(absoluteUrl, url),
        foundOn: url,
      });
    });

    console.log(`[DISCOVERY] Found ${discovered.length} links on ${url}`);
    return discovered;

  } catch (error) {
    console.error(`[DISCOVERY] Error discovering links on ${url}:`, error);
    throw error;
  }
}