import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';

const DEBUG_URL = process.env.AUDIT_CLI_CHROME_DEBUG_URL || 'http://localhost:9222';
const PROJECT_DIR = process.cwd();

export const dynamic = 'force-dynamic';

async function isChromeUp(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const res = await fetch(`${DEBUG_URL}/json/version`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST() {
  // Productie heeft hier geen zin: er staat geen Chrome op een Vercel-server.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Audit-sessie kan alleen vanaf de lokale dev-server gestart worden.' },
      { status: 400 },
    );
  }

  if (await isChromeUp()) {
    return NextResponse.json({ ok: true, alreadyRunning: true });
  }

  // Spawnen losgekoppeld van het Next-proces, zodat het blijft draaien als deze
  // request klaar is. We roepen direct het Chrome-binary aan en omzeilen tsx, want
  // Node 20+ op Windows weigert .cmd-scripts zonder shell: true en shell: true
  // breekt detached-werking.
  const isWindows = process.platform === 'win32';
  const port = process.env.CHROME_DEBUG_PORT || '9222';
  const profileDir =
    process.env.CHROME_AUDIT_PROFILE_DIR ||
    path.join(process.env.USERPROFILE || process.env.HOME || PROJECT_DIR, 'chrome-audit-profile');

  function findChromePath(): string | null {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    const fs = require('fs') as typeof import('fs');
    const candidates = isWindows
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(
            process.env.USERPROFILE || '',
            'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
          ),
        ]
      : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
    return candidates.find((p) => fs.existsSync(p)) || null;
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Chrome niet gevonden op een standaardlocatie. Zet de omgevingsvariabele CHROME_PATH naar het volledige pad van chrome.exe.',
      },
      { status: 500 },
    );
  }

  try {
    const fs = require('fs') as typeof import('fs');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    const child = spawn(
      chromePath,
      [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
      {
        cwd: PROJECT_DIR,
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      },
    );
    child.unref();
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: `Kon Chrome niet starten: ${err?.message ?? err}` },
      { status: 500 },
    );
  }

  // Poll tot debug-poort up is (max ~20s)
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isChromeUp()) {
      return NextResponse.json({ ok: true, alreadyRunning: false });
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        'Chrome werd gestart maar de debug-poort 9222 reageerde niet binnen 20 seconden. Controleer of Chrome geïnstalleerd is en niet al via een ander profiel draait.',
    },
    { status: 504 },
  );
}
