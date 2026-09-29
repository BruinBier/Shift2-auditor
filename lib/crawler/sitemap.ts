import * as cheerio from 'cheerio';

/**
 * Sitemaps van een site lezen: /sitemap.xml, /sitemap_index.xml en de Sitemap-regels
 * uit robots.txt, met sitemap-indexen recursief.
 *
 * Geeft ALLE adressen terug, zonder selectie. De steekproef-workflow v1 liet een agent
 * "gespreid" 86 van de 577 adressen kiezen, en dat leverde elke run een andere pool op.
 * Een sitemap van een paar duizend regels is in één keer te lezen; kiezen is iets voor later.
 */

export interface SitemapResultaat {
  /** De adressen uit alle gelezen sitemaps, in volgorde van lezen, zonder dubbelen. */
  urls: string[];
  /** Welke sitemaps gelezen zijn, met hun uitkomst. */
  gelezen: { url: string; status: number | null; aantal: number; fout?: string }[];
  /** De Sitemap-regels uit robots.txt. */
  uitRobots: string[];
  robotsGevonden: boolean;
}

type Ophaler = (url: string) => Promise<{ status: number; tekst: string; contentType: string } | { fout: string }>;

const MAX_SITEMAPS = 50;

export async function leesSitemaps(startUrl: string, haalOp: Ophaler): Promise<SitemapResultaat> {
  const oorsprong = new URL(startUrl).origin;
  const res: SitemapResultaat = { urls: [], gelezen: [], uitRobots: [], robotsGevonden: false };

  const robots = await haalOp(`${oorsprong}/robots.txt`);
  if (!('fout' in robots) && robots.status === 200 && !/html/i.test(robots.contentType)) {
    res.robotsGevonden = true;
    for (const regel of robots.tekst.split(/\r?\n/)) {
      const m = regel.match(/^\s*sitemap:\s*(\S+)/i);
      if (m) res.uitRobots.push(m[1]);
    }
  }

  // Robots eerst, dan de twee gangbare paden. Bestaat een pad niet, dan staat er een 404
  // in `gelezen` -- dat is informatie, geen fout.
  const wachtrij = [...res.uitRobots, `${oorsprong}/sitemap.xml`, `${oorsprong}/sitemap_index.xml`];
  const gezien = new Set<string>();
  const urls = new Set<string>();

  while (wachtrij.length && res.gelezen.length < MAX_SITEMAPS) {
    const sm = wachtrij.shift()!;
    if (gezien.has(sm)) continue;
    gezien.add(sm);
    if (/\.gz$/i.test(sm)) {
      res.gelezen.push({ url: sm, status: null, aantal: 0, fout: 'gecomprimeerde sitemap (.gz) wordt niet gelezen' });
      continue;
    }
    const r = await haalOp(sm);
    if ('fout' in r) {
      res.gelezen.push({ url: sm, status: null, aantal: 0, fout: r.fout });
      continue;
    }
    if (r.status !== 200 || !/<(urlset|sitemapindex)[\s>]/i.test(r.tekst)) {
      res.gelezen.push({ url: sm, status: r.status, aantal: 0, ...(r.status === 200 ? { fout: 'geen sitemap-XML' } : {}) });
      continue;
    }
    const $ = cheerio.load(r.tekst, { xmlMode: true });
    const isIndex = $('sitemapindex').length > 0;
    let aantal = 0;
    $(isIndex ? 'sitemap > loc' : 'url > loc').each((_, el) => {
      const loc = $(el).text().trim();
      if (!loc) return;
      aantal++;
      if (isIndex) wachtrij.push(loc);
      else urls.add(loc);
    });
    res.gelezen.push({ url: sm, status: r.status, aantal });
  }

  res.urls = [...urls];
  return res;
}
