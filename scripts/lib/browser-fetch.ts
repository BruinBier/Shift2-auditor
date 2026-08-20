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
  /** Het adres dat gevraagd werd. */
  gevraagdeUrl: string;
  /** Het adres waar de browser werkelijk uitkwam. */
  eindUrl: string;
  /**
   * Waar of de server ons naar een andere pagina heeft gestuurd.
   *
   * Dit is geen zeldzaamheid maar een valstrik. Een formulier met stappen geeft elke
   * stap een eigen adres, maar laat je er alleen komen als de vorige stap is ingevuld;
   * kom je binnen zonder sessie, dan sta je weer bij stap 1. De pagina die je
   * terugkrijgt ziet er niet uit als een fout — het is een keurige, werkende pagina met
   * de goede titel. Wie dan beschrijft wat hij ziet, beschrijft de verkeerde pagina en
   * merkt daar niets van.
   *
   * Op heuvelrug.nl leiden zowel stap 2 als stap 3 van het contactformulier terug naar
   * stap 1. Zonder dit veld zou een auditronde daar 33 oordelen over stap 1 wegschrijven
   * onder de naam van stap 2.
   */
  omgeleid: boolean;
}

/**
 * Vergelijkt twee adressen zonder te struikelen over onbeduidende verschillen:
 * http tegenover https, wel of geen www, en een afsluitende schuine streep. Een
 * ander pad telt wel — dat is een andere pagina.
 */
function zelfdePagina(a: string, b: string): boolean {
  const kaal = (u: string) => {
    try {
      const x = new URL(u);
      return (
        x.host.replace(/^www\./, '').toLowerCase() +
        x.pathname.replace(/\/+$/, '').toLowerCase() +
        x.search
      );
    } catch {
      return u;
    }
  };
  return kaal(a) === kaal(b);
}

/**
 * Wekt een pagina die zijn scripts uitstelt tot de bezoeker iets doet.
 *
 * Versnellers als WP Rocket voeren geen enkel script uit tot er een muisbeweging, een
 * toetsaanslag of een scroll komt. Voor een bezoeker is dat onzichtbaar. Voor een meting
 * is het fataal: er staat dan geen videospeler, geen uitklapmenu en geen widget op de
 * pagina, en dat ziet er precies zo uit als "die zijn er niet".
 *
 * Aangetroffen op de webinarpagina van Blue Billywig: vijftien scripts stonden te wachten,
 * de HTML bevatte geen enkele speler, en `gehydrateerd` stond op false. Na één muisbeweging
 * laadden er 36 scripts en stond de video er gewoon.
 *
 * Alleen doen als er werkelijk iets te wekken valt, anders kost elke meting extra tijd. En
 * terugscrollen naar boven, zodat de volgende meting op een pagina in ruststand begint.
 */
export async function maakWakker(page: Page): Promise<boolean> {
  const tel = () =>
    page.evaluate(
      () =>
        document.querySelectorAll(
          'script[type="rocketlazyloadscript"], script[data-rocket-src], script[type="text/lazyload"], script[type="text/rocketlazyloadscript"]'
        ).length
    );
  let wachtend = 0;
  try {
    wachtend = await tel();
  } catch {
    return false;
  }
  if (!wachtend) return false;

  process.stderr.write(
    `[browser] ${wachtend} scripts staan te wachten op een handeling van de bezoeker; pagina wakker maken\n`
  );
  try {
    await page.mouse.move(200, 300);
    await page.mouse.move(420, 520);
    await page.evaluate(() => {
      window.scrollTo(0, 400);
      for (const soort of ['mousemove', 'keydown', 'touchstart', 'wheel', 'scroll']) {
        window.dispatchEvent(new Event(soort, { bubbles: true }));
        document.dispatchEvent(new Event(soort, { bubbles: true }));
      }
    });
    for (let poging = 0; poging < 14; poging++) {
      await new Promise((r) => setTimeout(r, 500));
      if (!(await tel())) break;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 800));
  } catch {
    // Wakker maken mag een meting niet laten mislukken; wat er staat, staat er.
  }
  return true;
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
  await maakWakker(page);
  const eindUrl = page.url();
  return {
    page,
    gevraagdeUrl: url,
    eindUrl,
    omgeleid: !zelfdePagina(url, eindUrl),
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
