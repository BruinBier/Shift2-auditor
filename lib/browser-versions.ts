/**
 * Lees de geïnstalleerde browserversies uit van de machine waarop de app draait.
 *
 * De user agents in een rapport horen te beschrijven waarmee daadwerkelijk is
 * getest. Die versienummers werden met de hand bijgehouden en raakten daardoor
 * verouderd: bij Valkenswaard stond Chrome 148 in het rapport terwijl er met
 * 151 was getest. Daarom lezen we ze hier uit de geïnstalleerde executables.
 *
 * Alleen de major-versie is relevant voor een rapport ("versie 151"), niet het
 * volledige build-nummer.
 */
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type BrowserName = 'Google Chrome' | 'Mozilla Firefox' | 'Microsoft Edge';

export interface DetectedBrowser {
  name: BrowserName;
  majorVersion: number;
  fullVersion: string;
}

/**
 * Vaste hulpmiddelen waarvan de versie niet automatisch wordt uitgelezen.
 *
 * PAC krijgt het jaartal mee omdat er meerdere versies naast elkaar kunnen
 * staan: op de auditmachine staat PAC 2026 geïnstalleerd in AppData, maar er
 * wordt met PAC 2024 gewerkt vanuit een losse map. De geïnstalleerde versie is
 * hier dus niet de gebruikte versie; daarom staat dit hardgecodeerd en wordt
 * het niet gedetecteerd.
 */
const SUPPORTING_TOOLS = [
  'Adobe Acrobat Pro',
  'PDF Accessibility Checker (PAC) 2024',
  'Colour Contrast Analyser',
];

const SCREEN_READER = 'NVDA (Windows) in combinatie met Google Chrome';

/**
 * Kandidaat-locaties per browser. De eerste die bestaat wint.
 * `env` verwijst naar een omgevingsvariabele; ontbreekt die, dan slaan we het pad over.
 */
const BROWSER_PATHS: Record<BrowserName, Array<{ env: string; rest: string }>> = {
  'Google Chrome': [
    { env: 'ProgramFiles', rest: 'Google/Chrome/Application/chrome.exe' },
    { env: 'ProgramFiles(x86)', rest: 'Google/Chrome/Application/chrome.exe' },
    { env: 'LOCALAPPDATA', rest: 'Google/Chrome/Application/chrome.exe' },
  ],
  'Mozilla Firefox': [
    { env: 'ProgramFiles', rest: 'Mozilla Firefox/firefox.exe' },
    { env: 'ProgramFiles(x86)', rest: 'Mozilla Firefox/firefox.exe' },
  ],
  'Microsoft Edge': [
    { env: 'ProgramFiles(x86)', rest: 'Microsoft/Edge/Application/msedge.exe' },
    { env: 'ProgramFiles', rest: 'Microsoft/Edge/Application/msedge.exe' },
  ],
};

function resolveExecutable(browser: BrowserName): string | null {
  for (const { env, rest } of BROWSER_PATHS[browser]) {
    const base = process.env[env];
    if (!base) continue;
    const full = path.join(base, rest);
    if (existsSync(full)) return full;
  }
  return null;
}

/**
 * Lees de productversie van een Windows-executable via PowerShell.
 *
 * `chrome.exe --version` werkt niet betrouwbaar op Windows: Chrome geeft de
 * melding "Wordt geopend in een bestaande browsersessie" terug in plaats van
 * een versienummer wanneer er al een venster open staat. De VersionInfo van
 * het bestand zelf heeft dat probleem niet.
 */
async function readProductVersion(exePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `(Get-Item -LiteralPath ${JSON.stringify(exePath)}).VersionInfo.ProductVersion`,
      ],
      { timeout: 10_000, windowsHide: true }
    );
    const version = stdout.trim();
    return version.length > 0 ? version : null;
  } catch {
    return null;
  }
}

/** Detecteer alle browsers die op deze machine geïnstalleerd staan. */
export async function detectInstalledBrowsers(): Promise<DetectedBrowser[]> {
  if (process.platform !== 'win32') return [];

  const names = Object.keys(BROWSER_PATHS) as BrowserName[];
  const results = await Promise.all(
    names.map(async (name): Promise<DetectedBrowser | null> => {
      const exePath = resolveExecutable(name);
      if (!exePath) return null;

      const fullVersion = await readProductVersion(exePath);
      if (!fullVersion) return null;

      const major = parseInt(fullVersion.split('.')[0], 10);
      if (!Number.isFinite(major)) return null;

      return { name, majorVersion: major, fullVersion };
    })
  );

  return results.filter((r): r is DetectedBrowser => r !== null);
}

/**
 * Bouw de user-agents-lijst als HTML, met Chrome als primaire browser.
 *
 * Geeft `null` terug wanneer geen enkele browser gedetecteerd kon worden, zodat
 * de aanroeper de bestaande waarde kan laten staan in plaats van hem te wissen.
 */
export function buildUserAgentsHtml(browsers: DetectedBrowser[]): string | null {
  if (browsers.length === 0) return null;

  const order: BrowserName[] = ['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge'];
  const sorted = order
    .map((name) => browsers.find((b) => b.name === name))
    .filter((b): b is DetectedBrowser => b !== undefined);

  const items = sorted.map((b, index) => {
    const primary = index === 0 ? ' (primair)' : '';
    return `<li>${b.name}, versie ${b.majorVersion}${primary}</li>`;
  });

  for (const tool of SUPPORTING_TOOLS) {
    items.push(`<li>${tool}</li>`);
  }
  items.push(`<li>${SCREEN_READER}</li>`);

  return `<ul>\n${items.join('\n')}\n</ul>\n`;
}

/**
 * Detecteer de browsers en lever de user-agents-HTML op.
 * Geeft `null` terug wanneer detectie niets opleverde.
 */
export async function getCurrentUserAgentsHtml(): Promise<string | null> {
  const browsers = await detectInstalledBrowsers();
  return buildUserAgentsHtml(browsers);
}
