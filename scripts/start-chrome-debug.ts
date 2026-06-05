/**
 * Start een Chrome-instance met remote debugging aan, zodat de audit-CLI
 * (`get-html` / `get-screenshot`) hierop kan aansluiten en jouw cookies,
 * login-sessies en VPN-context kan hergebruiken.
 *
 * Gebruik:
 *   npm run chrome:debug
 *
 * - Eigen user-data-dir (chrome-audit-profile in je home-folder), zodat je
 *   normale Chrome-profiel niet wordt gestoord.
 *   Override via env: CHROME_AUDIT_PROFILE_DIR
 * - Debug-poort 9222, override via env: CHROME_DEBUG_PORT
 *
 * Eenmalig: log in deze Chrome-instance op de sites die login/VPN vereisen.
 * Daarna pakt de CLI nieuwe tabs en behoudt je sessie.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const PORT = process.env.CHROME_DEBUG_PORT || '9222';
const PROFILE_DIR =
  process.env.CHROME_AUDIT_PROFILE_DIR || path.join(os.homedir(), 'chrome-audit-profile');

function findChrome(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
        ]
      : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const chromePath = findChrome();
if (!chromePath) {
  console.error(
    'Kon Chrome niet vinden. Zet CHROME_PATH naar het volledige pad van chrome.exe en probeer opnieuw.',
  );
  process.exit(1);
}

if (!fs.existsSync(PROFILE_DIR)) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
}

console.log(`Start Chrome met remote debugging:`);
console.log(`  binary : ${chromePath}`);
console.log(`  port   : ${PORT}`);
console.log(`  profile: ${PROFILE_DIR}`);
console.log(``);
console.log(`Log in deze venster eenmalig in op sites die dat nodig hebben.`);
console.log(`De CLI (get-html / get-screenshot) verbindt automatisch op http://localhost:${PORT}.`);
console.log(``);
console.log(`Stop met Ctrl+C of door de Chrome-vensters te sluiten.`);

const child = spawn(
  chromePath,
  [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
  { stdio: 'inherit' },
);

child.on('exit', (code) => process.exit(code ?? 0));
