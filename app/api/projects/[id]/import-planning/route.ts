import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

/**
 * Import the project's planning-email fields (scopeInScope, scopeOutOfScope,
 * sampleClientPages) into real records:
 *   - scopeInScope     -> ProjectScopeUrl (inScope: true)
 *   - scopeOutOfScope  -> ProjectScopeUrl (inScope: false)
 *   - sampleClientPages-> SampleItem (sampleType: structured)
 *
 * Each field is a newline-separated list of URLs (optionally with a "- " bullet
 * prefix). Lines that don't contain a URL are skipped. URLs that already exist
 * on the project (as scope URL / sample item respectively) are skipped, so this
 * endpoint is safe to call multiple times.
 */

/** Parse a planning textarea into a clean list of URLs. */
function parseUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    // Strip a leading "- " / "* " bullet and surrounding whitespace.
    let url = line.replace(/^\s*[-*]\s*/, '').trim();
    if (!url) continue;
    // Only accept lines that look like a URL.
    if (!/^https?:\/\//i.test(url)) continue;
    // Drop a single trailing slash for dedup consistency (but keep root "/").
    const normalized = url.replace(/(?<!\/)\/$/, '');
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(url);
  }
  return urls;
}

/** Best-effort fetch of a page <title>. Mirrors scope-urls/route.ts. */
/**
 * Strip the site-name suffix and noise from a raw page title.
 * e.g. "Contact en openingstijden | Gemeente Beverwijk" -> "Contact en openingstijden"
 */
function cleanTitle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let title = raw.replace(/\s+/g, ' ').trim();
  // Remove a trailing site-name segment after the last " | " / " - " / " · "
  // separator, but only when there are multiple segments (keep single-segment titles).
  const parts = title.split(/\s+[|–—·-]\s+/);
  if (parts.length > 1) {
    const first = parts[0].trim();
    if (first.length >= 3) title = first;
  }
  // Drop common loading/placeholder noise and trailing junk.
  title = title.replace(/loading\.*$/i, '').trim();
  title = title.replace(/\s*\.\s*$/g, '').trim();
  if (!title || /^toegankelijk(heid)?$/i.test(title)) return null;
  return title;
}

async function fetchTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Shift2-Auditor/1.0 (Title Fetcher)' },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);

    // Use ONLY the real document title in <head>. Pages can contain stray extra
    // <title> elements (SVG icons, loading widgets), so $('title').text() would
    // concatenate them into junk. Fall back to og:title, then the first <h1>.
    const headTitle = cleanTitle($('head > title').first().text());
    if (headTitle) return headTitle;

    const ogTitle = cleanTitle($('meta[property="og:title"]').attr('content'));
    if (ogTitle) return ogTitle;

    const h1 = cleanTitle($('h1').first().text());
    if (h1) return h1;

    return null;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        scopeInScope: true,
        scopeOutOfScope: true,
        sampleClientPages: true,
        scopeUrls: { select: { url: true } },
        sampleItems: { select: { url: true, orderIndex: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const inScope = parseUrls(project.scopeInScope);
    const outOfScope = parseUrls(project.scopeOutOfScope);
    const clientPages = parseUrls(project.sampleClientPages);

    // Existing URLs to avoid duplicates (compare on trailing-slash-normalized form).
    const norm = (u: string) => u.trim().replace(/(?<!\/)\/$/, '');
    const existingScope = new Set(project.scopeUrls.map((s) => norm(s.url)));
    const existingSample = new Set(
      project.sampleItems.map((s) => (s.url ? norm(s.url) : '')).filter(Boolean)
    );

    const result = {
      scopeInScopeCreated: 0,
      scopeOutOfScopeCreated: 0,
      sampleItemsCreated: 0,
      skipped: 0,
    };

    // --- Scope URLs (in scope) ---
    for (const url of inScope) {
      if (existingScope.has(norm(url))) {
        result.skipped++;
        continue;
      }
      const title = await fetchTitle(url);
      await prisma.projectScopeUrl.create({
        data: { projectId, url, title: title || '', inScope: true },
      });
      existingScope.add(norm(url));
      result.scopeInScopeCreated++;
    }

    // --- Scope URLs (out of scope) ---
    for (const url of outOfScope) {
      if (existingScope.has(norm(url))) {
        result.skipped++;
        continue;
      }
      const title = await fetchTitle(url);
      await prisma.projectScopeUrl.create({
        data: { projectId, url, title: title || '', inScope: false },
      });
      existingScope.add(norm(url));
      result.scopeOutOfScopeCreated++;
    }

    // --- Sample items (client-provided pages) ---
    // Continue the existing orderIndex sequence.
    let nextOrder =
      project.sampleItems.reduce((max, s) => Math.max(max, s.orderIndex ?? -1), -1) + 1;
    for (const url of clientPages) {
      if (existingSample.has(norm(url))) {
        result.skipped++;
        continue;
      }
      const title = (await fetchTitle(url)) || url;
      await prisma.sampleItem.create({
        data: {
          projectId,
          sampleType: 'structured',
          title,
          url,
          description: 'Door klant aangedragen pagina',
          orderIndex: nextOrder++,
        },
      });
      existingSample.add(norm(url));
      result.sampleItemsCreated++;
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('Error importing planning:', error);
    return NextResponse.json(
      {
        error: 'Failed to import planning',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
