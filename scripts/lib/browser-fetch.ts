/**
 * Browser helper voor de audit-CLI.
 *
 * Verbindt bij voorkeur met een al draaiende Chrome op localhost:9222
 * (zie `npm run chrome:debug`). Daar zijn jouw login-sessies, cookies en
 * netwerk-/VPN-context al aanwezig — onmisbaar voor sites die niet
 * publiek bereikbaar zijn vanuit een verse headless browser.
 *
 * Lukt het verbinden niet, dan vallen we terug op een lokale headless
 * Puppeteer-instance (prima voor publieke sites).
 *
 * Elke aanroep krijgt zijn eigen tab; jouw andere tabs blijven met rust.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const DEBUG_URL = process.env.AUDIT_CLI_CHROME_DEBUG_URL || 'http://localhost:9222';
export const OUTPUT_DIR = path.resolve(process.cwd(), 'tmp', 'audit-cli');

export type BrowserMode = 'cdp' | 'headless';

export interface BrowserSession {
  browser: Browser;
  mode: BrowserMode;
  /** Roep dit aan zodra je klaar bent. Bij CDP wordt de Chrome NIET afgesloten. */
  dispose(): Promise<void>;
}

async function tryConnectCdp(): Promise<BrowserSession | null> {
  try {
    const browser = await puppeteer.connect({
      browserURL: DEBUG_URL,
      defaultViewport: null,
    });
    return {
      browser,
      mode: 'cdp',
      async dispose() {
        // Disconnecten, niet sluiten — anders gaat de gebruiker zijn Chrome dicht.
        browser.disconnect();
      },
    };
  } catch {
    return null;
  }
}

async function launchHeadless(): Promise<BrowserSession> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return {
    browser,
    mode: 'headless',
    async dispose() {
      await browser.close();
    },
  };
}

export async function getBrowser(): Promise<BrowserSession> {
  const cdp = await tryConnectCdp();
  if (cdp) {
    process.stderr.write(`[browser] Verbonden met Chrome op ${DEBUG_URL} (sessies/cookies behouden)\n`);
    return cdp;
  }
  process.stderr.write(
    `[browser] Geen Chrome op ${DEBUG_URL} — val terug op headless. ` +
      `Start anders 'npm run chrome:debug' voor sites die login of VPN vereisen.\n`,
  );
  return launchHeadless();
}

export interface OpenPageResult {
  page: Page;
  cleanup: () => Promise<void>;
}

/**
 * Open een verse tab op `url`, wacht tot het netwerk rustig is + 1s buffer
 * voor late JS-rendering. Geeft een cleanup-functie terug die alleen de tab
 * sluit (niet de hele browser).
 */
export async function openPage(session: BrowserSession, url: string, timeoutMs = 30000): Promise<OpenPageResult> {
  const page = await session.browser.newPage();
  // Realistische user agent + viewport voor zo natuurlijk mogelijke rendering
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
  } catch (err) {
    // Sommige sites blijven netwerk-actief; probeer dan tenminste DOM-load
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
  }
  await new Promise((r) => setTimeout(r, 1000));
  return {
    page,
    cleanup: async () => {
      await page.close().catch(() => {});
    },
  };
}

export function ensureOutputDir(): string {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  return OUTPUT_DIR;
}

/** Maakt van een URL een veilige bestandsnaam-component. */
export function slugifyUrl(url: string, maxLen = 60): string {
  try {
    const u = new URL(url);
    const raw = `${u.hostname}${u.pathname}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    return raw.slice(0, maxLen) || 'page';
  } catch {
    return 'page';
  }
}

export function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}
