/**
 * Audit CLI — roept de Next.js API van deze app aan zodat Claude (of jij) direct
 * projecten kan inspecteren en bevindingen kan toevoegen zonder de UI.
 *
 * Vereist: dev server draait (npm run dev) op BASE_URL (default http://localhost:3000).
 *
 * Voorbeelden:
 *   tsx scripts/audit-cli.ts list-projects
 *   tsx scripts/audit-cli.ts get-project <projectId>
 *   tsx scripts/audit-cli.ts list-criteria
 *   tsx scripts/audit-cli.ts search-quick-findings <keyword>
 *   tsx scripts/audit-cli.ts create-sample-item <projectId> --url=... --title=... --type=random
 *   tsx scripts/audit-cli.ts create-finding <projectId> --criterion=<id> --description=... --advice=... [--impact=matig] [--sample-items=id1,id2]
 *   tsx scripts/audit-cli.ts create-finding-from-quick <projectId> <quickFindingId> [--sample-items=id1,id2]
 *   tsx scripts/audit-cli.ts set-assessment <projectId> --criterion=<id> --status=failed [--explanation=...]
 *   tsx scripts/audit-cli.ts get-html <url> [--full] [--text]
 *   tsx scripts/audit-cli.ts get-screenshot <url> [--full-page] [--selector=...]
 *   tsx scripts/audit-cli.ts get-leesvolgorde <url> [--zonder-css]
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getBrowser,
  openPage,
  ensureOutputDir,
  slugifyUrl,
  timestamp,
} from './lib/browser-fetch';
import {
  lintFinding,
  formatLintIssues,
  type FindingDraft,
} from '../lib/finding-lint';

const BASE_URL = process.env.AUDIT_CLI_BASE_URL || 'http://localhost:3000';

type Flags = Record<string, string>;

function parseArgs(argv: string[]): { positional: string[]; flags: Flags } {
  const positional: string[] = [];
  const flags: Flags = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      flags[key] = rest.join('=') || 'true';
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

function print(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

function requireFlag(flags: Flags, name: string): string {
  const v = flags[name];
  if (!v || v === 'true') {
    throw new Error(`Missing required flag --${name}=<value>`);
  }
  return v;
}

function requirePositional(positional: string[], index: number, name: string): string {
  const v = positional[index];
  if (!v) {
    throw new Error(`Missing required argument #${index + 1}: <${name}>`);
  }
  return v;
}

async function listProjects() {
  const projects = await api('/api/projects');
  const slim = (Array.isArray(projects) ? projects : []).map((p: any) => ({
    id: p.id,
    kenmerk: p.kenmerk,
    title: p.title,
    version: p.version,
    status: p.status,
    researchType: p.researchType,
    counts: p._count,
  }));
  print(slim);
}

async function getProject(projectId: string) {
  // Deelverzamelingen mogen ontbreken, maar niet stilzwijgend: een lege lijst
  // door een mislukte aanroep is niet te onderscheiden van een lege lijst in de
  // database. De assessments-route had jarenlang geen GET; de CLI meldde daardoor
  // stelselmatig nul oordelen. De waarschuwing gaat naar stderr, zodat stdout
  // pure JSON blijft.
  const zachtFalen = (naam: string) => (err: unknown) => {
    console.error(`[audit-cli] waarschuwing: ${naam} ophalen mislukte — ${String(err)}`);
    return [] as unknown[];
  };

  const [allProjects, scopeUrls, sampleItems, findings, assessments] = await Promise.all([
    api('/api/projects'),
    api(`/api/projects/${projectId}/scope-urls`).catch(zachtFalen('scope-urls')),
    api(`/api/projects/${projectId}/sample-items`).catch(zachtFalen('sample-items')),
    api(`/api/projects/${projectId}/findings`).catch(zachtFalen('findings')),
    api(`/api/projects/${projectId}/assessments`).catch(zachtFalen('assessments')),
  ]);
  const project = (Array.isArray(allProjects) ? allProjects : []).find((p: any) => p.id === projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }
  print({
    project: {
      id: project.id,
      kenmerk: project.kenmerk,
      title: project.title,
      version: project.version,
      status: project.status,
      researchType: project.researchType,
      standard: project.standard,
      level: project.level,
    },
    scopeUrls: (Array.isArray(scopeUrls) ? scopeUrls : []).map((s: any) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      inScope: s.inScope,
    })),
    sampleItems: (Array.isArray(sampleItems) ? sampleItems : []).map((s: any) => ({
      id: s.id,
      sampleType: s.sampleType,
      title: s.title,
      url: s.url,
    })),
    findings: (Array.isArray(findings) ? findings : []).map((f: any) => ({
      id: f.id,
      findingCode: f.findingCode,
      status: f.status,
      impact: f.impact,
      criterion: f.wcagCriterion?.code,
      description: truncate(f.description, 120),
    })),
    assessments: (Array.isArray(assessments) ? assessments : []).map((a: any) => ({
      id: a.id,
      criterion: a.wcagCriterion?.code ?? a.wcagCriterionId,
      status: a.status,
    })),
  });
}

function truncate(s: string | null | undefined, n: number) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + '…' : s;
}

async function listCriteria() {
  const criteria = await api('/api/wcag-criteria');
  const slim = (Array.isArray(criteria) ? criteria : []).map((c: any) => ({
    id: c.id,
    code: c.code,
    level: c.level,
    title: c.title,
  }));
  print(slim);
}

async function searchQuickFindings(keyword: string) {
  const all = await api('/api/quick-findings');
  const needle = keyword.toLowerCase();
  const hits = (Array.isArray(all) ? all : []).filter((qf: any) => {
    const hay = [qf.title, qf.description, qf.advice, qf.criterionCode, qf.keywords]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(needle);
  });
  print(hits.map((qf: any) => ({
    id: qf.id,
    title: qf.title,
    criterionCode: qf.criterionCode,
    impact: qf.impact,
    responsibility: qf.responsibility,
    description: truncate(qf.description, 120),
  })));
}

async function createSampleItem(projectId: string, flags: Flags) {
  const body = {
    sampleType: flags.type || 'random',
    title: requireFlag(flags, 'title'),
    url: flags.url || null,
    description: flags.description || '',
    makeScreenshot: flags.screenshot === 'true',
  };
  const result = await api(`/api/projects/${projectId}/sample-items`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  print(result);
}

/**
 * Bouwt een FindingDraft uit de CLI-flags en haalt de criterium-code op waar
 * die nodig is voor criterium-specifieke schrijfregels.
 */
async function draftFromFlags(flags: Flags): Promise<FindingDraft> {
  let criterionCode: string | null = null;
  if (flags.criterion) {
    try {
      const criteria = await api('/api/wcag-criteria');
      const match = (Array.isArray(criteria) ? criteria : []).find(
        (c: any) => c.id === flags.criterion || c.code === flags.criterion,
      );
      criterionCode = match?.code ?? null;
    } catch {
      // Zonder criterium-code draaien alleen de algemene regels. Geen blocker.
    }
  }
  return {
    description: flags.description,
    advice: flags.advice,
    impact: flags.impact ?? null,
    responsibility: flags.responsibility ?? null,
    status: flags.status || 'open',
    criterionCode,
    isPdf: flags.pdf === 'true' || flags.pdf === '1',
  };
}

async function lintFindingCommand(flags: Flags) {
  const draft = await draftFromFlags(flags);
  const issues = lintFinding(draft);
  if (flags.json === 'true') {
    print({ issues, errors: issues.filter((i) => i.severity === 'error').length });
    return;
  }
  console.log(formatLintIssues(issues));
}

async function createFinding(projectId: string, flags: Flags) {
  const body: Record<string, unknown> = {
    criterionId: requireFlag(flags, 'criterion'),
    description: requireFlag(flags, 'description'),
    advice: requireFlag(flags, 'advice'),
    // Standaard een voorstel: deze CLI wordt door agents gebruikt, en wat een
    // agent vindt hoort langs de onderzoeker voordat het meetelt. Wie bewust een
    // bevinding wil aanmaken geeft --status=open mee.
    // Zie docs/adr/0001-akkoord-als-poort.md.
    status: flags.status || 'voorstel',
  };
  if (flags.impact) body.impact = flags.impact;
  if (flags.responsibility) body.responsibility = flags.responsibility;
  if (flags.evidence) body.evidence = flags.evidence;
  if (flags['sample-items']) {
    body.sampleItemIds = flags['sample-items'].split(',').map((s) => s.trim()).filter(Boolean);
  }

  // Schrijfregel-check vóór het wegschrijven. Harde fouten blokkeren; twijfel-
  // gevallen worden alleen getoond. Omzeilen kan met --skip-lint.
  if (flags['skip-lint'] !== 'true') {
    const issues = lintFinding(await draftFromFlags(flags));
    const errors = issues.filter((i) => i.severity === 'error');
    if (issues.length > 0) {
      console.error(formatLintIssues(issues));
      console.error('');
    }
    if (errors.length > 0) {
      throw new Error(
        `Bevinding niet aangemaakt: ${errors.length} schrijfregel-fout(en). Pas de tekst aan, of gebruik --skip-lint als de linter er hier naast zit.`,
      );
    }
  }

  const result = await api(`/api/projects/${projectId}/findings`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  print(result);
}

async function createFindingFromQuick(projectId: string, quickFindingId: string, flags: Flags) {
  // Haal QuickFinding op, zoek WCAG-criterion via criterionCode, en roep de normale finding-route aan.
  // (De bestaande /findings/from-crawler route gebruikt ScopeUrls; wij willen FindingOccurrence + SampleItem.)
  const qf = await api(`/api/quick-findings/${quickFindingId}`);
  const criteria = await api('/api/wcag-criteria');
  const criterion = (Array.isArray(criteria) ? criteria : []).find((c: any) => c.code === qf.criterionCode);
  if (!criterion) {
    throw new Error(`No WCAG criterion found for code "${qf.criterionCode}" from QuickFinding`);
  }
  const body: Record<string, unknown> = {
    criterionId: criterion.id,
    description: qf.description,
    advice: qf.advice,
    status: qf.status || 'open',
    impact: qf.impact ?? undefined,
    responsibility: qf.responsibility ?? undefined,
  };
  if (flags['sample-items']) {
    body.sampleItemIds = flags['sample-items'].split(',').map((s) => s.trim()).filter(Boolean);
  }
  const result = await api(`/api/projects/${projectId}/findings`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  print(result);
}

/**
 * Sampleoordelen wegschrijven: het oordeel per criterium voor een pagina.
 *
 * De oordelen komen via stdin binnen als JSON, niet als vlaggen — het gaat om
 * tientallen regels per sample, met redenen die vaak meerdere zinnen beslaan.
 *
 *   npm run cli -- save-checks <projectId> --bron=workflow < oordelen.json
 *
 * Verwacht formaat:
 *   [{ "sampleItemId": "...", "criterionCode": "1.4.3",
 *      "status": "voldoet", "reden": "..." }]
 */
async function saveChecks(projectId: string, flags: Flags) {
  const invoer = await leesStdin();
  if (!invoer.trim()) {
    throw new Error('Geen invoer op stdin. Gebruik: save-checks <projectId> < oordelen.json');
  }

  let checks: unknown;
  try {
    // Een BOM aan het begin sloopt JSON.parse. PowerShell schrijft die er bij
    // `Out-File -Encoding utf8` standaard voor, dus dit komt op Windows vaak voor.
    checks = JSON.parse(invoer.replace(/^﻿/, ''));
  } catch (err) {
    throw new Error(`Kon de invoer niet als JSON lezen: ${String(err)}`);
  }
  if (!Array.isArray(checks)) {
    throw new Error('De invoer moet een JSON-array van oordelen zijn.');
  }

  const result = await api(`/api/projects/${projectId}/criterion-checks`, {
    method: 'POST',
    body: JSON.stringify({ bron: flags.bron || 'workflow', checks }),
  });
  print(result);
}

function leesStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function getChecks(projectId: string) {
  print(await api(`/api/projects/${projectId}/criterion-checks`));
}

async function setAssessment(projectId: string, flags: Flags) {
  const body: Record<string, unknown> = {
    wcagCriterionId: requireFlag(flags, 'criterion'),
    status: requireFlag(flags, 'status'),
  };
  if (flags.explanation) body.explanation = flags.explanation;
  const result = await api(`/api/projects/${projectId}/assessments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  print(result);
}

async function getHtml(url: string, flags: Flags) {
  const wantFull = flags.full === 'true';
  const wantText = flags.text === 'true';
  const session = await getBrowser();
  try {
    const { page, cleanup } = await openPage(session, url);
    try {
      const pageTitle = await page.title();
      const finalUrl = page.url();

      // Bepaal of we de hele pagina pakken of alleen <main>.
      // Voor homepage (path === '/' of leeg) altijd volledig — daar staat de
      // belangrijke content vaak in de header/footer.
      const parsed = new URL(finalUrl);
      const isHomepage = parsed.pathname === '' || parsed.pathname === '/';
      const useFull = wantFull || isHomepage;

      const content = await page.evaluate(
        ({ useFull, wantText }) => {
          const target =
            useFull
              ? document.documentElement
              : (document.querySelector('main') as HTMLElement | null) || document.documentElement;
          if (wantText) {
            return (target as HTMLElement).innerText || '';
          }
          return useFull ? '<!doctype html>\n' + target.outerHTML : target.outerHTML;
        },
        { useFull, wantText },
      );

      // Leeft deze pagina? Op een React-site die niet hydrateert staat de HTML er
      // wel, maar hangt er geen enkele klikafhandelaar aan. Elke interactieve
      // toets levert dan een vals negatief op dat er precies uitziet als een
      // echte bevinding: de knop doet niets, de suggesties verschijnen niet, het
      // menu klapt niet uit. Zonder dit veld is dat niet te onderscheiden van
      // een site die werkelijk stuk is.
      const gehydrateerd = await page.evaluate(() =>
        Array.from(document.querySelectorAll('body *')).some((e) =>
          Object.keys(e).some((k) => k.startsWith('__react') || k.startsWith('__vue')),
        ),
      );

      const dir = ensureOutputDir();
      const ext = wantText ? 'txt' : 'html';
      const file = path.join(dir, `${timestamp()}-${slugifyUrl(finalUrl)}.${ext}`);
      fs.writeFileSync(file, content, 'utf8');

      print({
        url: finalUrl,
        requestedUrl: url,
        title: pageTitle,
        scope: useFull ? 'document' : 'main',
        homepageDetected: isHomepage,
        format: wantText ? 'text' : 'html',
        bytes: Buffer.byteLength(content, 'utf8'),
        file,
        browser: session.mode,
        gehydrateerd,
        waarschuwing: gehydrateerd
          ? undefined
          : 'De JavaScript van deze pagina draait niet: er hangen geen klikafhandelaars aan. Trek hieruit GEEN conclusies over interactieve criteria (toetsenbord, uitklapmenu, zoeksuggesties, schakelknoppen). Start de audit-Chrome met `npm run chrome:debug` en haal de pagina opnieuw op.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

async function testSamples(projectId: string, flags: Flags) {
  const withBrowser = flags['with-browser'] !== 'false'; // standaard AAN voor dit commando

  // Haal sample-items op via het bestaande endpoint
  const samples = await api(`/api/projects/${projectId}/sample-items`);

  // Project-titel ophalen voor de log (best effort)
  let projectTitle = projectId;
  try {
    const allProjects = await api('/api/projects');
    const p = allProjects.find((x: any) => x.id === projectId);
    if (p) projectTitle = p.title;
  } catch {}

  process.stderr.write(`[test-samples] project: ${projectTitle}\n`);
  process.stderr.write(`[test-samples] ${samples.length} sample-items gevonden\n\n`);

  const summary: any[] = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.url) {
      process.stderr.write(`[${i + 1}/${samples.length}] ${sample.title} — SKIP (geen URL, type=${sample.sampleType})\n`);
      summary.push({ sample: sample.title, skipped: true, reason: 'no url' });
      continue;
    }

    process.stderr.write(`[${i + 1}/${samples.length}] ${sample.title} (${sample.url})\n`);

    try {
      const res = await api(`/api/sample-items/${sample.id}/crawler`, {
        method: 'POST',
        body: JSON.stringify({ withBrowser }),
      });
      process.stderr.write(`            → ${res.testsRun} tests gedraaid, ${res.testsFound} positief\n\n`);
      summary.push({
        sample: sample.title,
        url: sample.url,
        testsRun: res.testsRun,
        testsFound: res.testsFound,
      });
    } catch (err: any) {
      process.stderr.write(`            ✗ FOUT: ${err.message}\n\n`);
      summary.push({ sample: sample.title, error: err.message });
    }
  }

  process.stderr.write(`\n[test-samples] Klaar. Resultaten opgeslagen in DB. Bekijk de Richtlijnen-tab:\n`);
  process.stderr.write(`              ${BASE_URL}/admin/projects/${projectId}?tab=richtlijnen\n`);

  print({
    projectId,
    projectTitle,
    samplesProcessed: summary.length,
    summary,
  });
}

async function runTests(url: string, flags: Flags) {
  const verbose = flags.verbose === 'true';
  const onlyFound = flags['only-found'] === 'true';
  const withBrowser = flags['with-browser'] === 'true';

  process.stderr.write(`[run-tests] ophalen ${url} ...\n`);
  const session = await getBrowser();
  let html = '';
  let finalUrl = url;
  let browserTestResults: any[] = [];
  try {
    const { page, cleanup } = await openPage(session, url);
    try {
      finalUrl = page.url();
      html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);

      if (withBrowser) {
        process.stderr.write(`[run-tests] browser-tests draaien (contrast, label-in-naam, auto-refresh)...\n`);
        const { testColorContrast, testLabelInName, testAutoRefresh, testHiddenWithFocusableContent, testTableHeaderCellMissingHeaderRole } = await import('../lib/crawler/browser-tests');
        const contrastResult = await testColorContrast(page);
        browserTestResults.push(contrastResult);
        const labelResult = await testLabelInName(page);
        browserTestResults.push(labelResult);
        const refreshResult = await testAutoRefresh(page, url);
        browserTestResults.push(refreshResult);
        const hiddenFocusableResult = await testHiddenWithFocusableContent(page);
        browserTestResults.push(hiddenFocusableResult);
        const tableHeaderResult = await testTableHeaderCellMissingHeaderRole(page);
        browserTestResults.push(tableHeaderResult);
      }
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
  process.stderr.write(`[run-tests] HTML opgehaald (${Buffer.byteLength(html, 'utf8')} bytes). HTML-tests draaien...\n`);

  const { runAllMVPTests } = await import('../lib/crawler/tests');
  const all = runAllMVPTests(html);
  // Filter inventarisatie-tests (testId 38-130) EN tests met details.informational=true.
  const inventoryIds = new Set<string>();
  for (let i = 38; i <= 131; i++) inventoryIds.add(String(i));
  inventoryIds.add('10'); // testPageHasAriaHiddenElement
  const specific = all.filter((r) => {
    if (inventoryIds.has(r.testId)) return false;
    if (r.details && (r.details as any).informational === true) return false;
    return true;
  });

  // Combineer HTML-tests met browser-tests (contrast etc.)
  const combined = [...specific, ...browserTestResults];
  const issues = combined.filter((r) => r.found);
  const passed = combined.filter((r) => !r.found);

  // Live status naar stderr (jij ziet dit) — stdout krijgt straks JSON
  process.stderr.write(`\n[run-tests] ${combined.length} pass/fail-tests gedraaid op ${finalUrl}\n`);
  process.stderr.write(`[run-tests] ${issues.length} issues gevonden, ${passed.length} OK\n\n`);
  if (verbose || issues.length > 0) {
    process.stderr.write('ISSUES:\n');
    for (const r of issues) {
      process.stderr.write(`  [FAIL] ${r.testName} (${r.count} voorvallen)\n`);
    }
  }
  if (verbose) {
    process.stderr.write('\nOK:\n');
    for (const r of passed) {
      process.stderr.write(`  [PASS] ${r.testName}\n`);
    }
  }

  const output = {
    url: finalUrl,
    requestedUrl: url,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
    totalTests: combined.length,
    issuesFound: issues.length,
    results: onlyFound ? issues : combined,
  };
  print(output);
}

async function getScreenshot(url: string, flags: Flags) {
  const fullPage = flags['full-page'] === 'true';
  const selector = flags.selector && flags.selector !== 'true' ? flags.selector : null;
  const keepCookieBanner = flags['keep-cookie-banner'] === 'true';
  const session = await getBrowser();
  try {
    const { page, cleanup } = await openPage(session, url);
    try {
      const pageTitle = await page.title();
      const finalUrl = page.url();
      const dir = ensureOutputDir();
      const file = path.join(dir, `${timestamp()}-${slugifyUrl(finalUrl)}.png`);

      if (!keepCookieBanner) {
        // Verberg cookie-modals, banners en andere gebruikelijke overlays via CSS
        // Alleen visueel — de DOM blijft ongewijzigd (relevant voor eventuele parallelle HTML-inspecties).
        await page.addStyleTag({
          content: `
            [class*="CookieModal" i],
            [class*="CookieBanner" i],
            [class*="cookie-modal" i],
            [class*="cookie-banner" i],
            [class*="cookieOverlay" i],
            [id*="cookie" i][class*="modal" i],
            [id*="cookie" i][class*="banner" i],
            [id*="cookiebar" i],
            [id*="cookieconsent" i],
            [class*="CookieConsent" i],
            [aria-label*="cookie" i][role="dialog"] {
              display: none !important;
              visibility: hidden !important;
            }
          `,
        });
      }

      if (selector) {
        const handle = await page.$(selector);
        if (!handle) {
          throw new Error(`Selector niet gevonden op pagina: ${selector}`);
        }
        await handle.screenshot({ path: file as `${string}.png` });
      } else {
        await page.screenshot({ path: file as `${string}.png`, fullPage });
      }

      const stat = fs.statSync(file);
      print({
        url: finalUrl,
        requestedUrl: url,
        title: pageTitle,
        mode: selector ? `selector:${selector}` : fullPage ? 'full-page' : 'viewport',
        bytes: stat.size,
        file,
        browser: session.mode,
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * De leesvolgorde van een pagina, en waar die afwijkt van de kijkvolgorde.
 *
 * Voor SC 1.3.2. Dat criterium is niet te beoordelen op opgehaalde HTML: de
 * code-volgorde vertelt je de ene helft, de opmaak de andere. Een kaart met de
 * afbeelding in de code na de titel kan hem op het scherm erboven zetten met
 * `order`, `row-reverse`, `grid-area` of absolute positionering, en dat staat in
 * externe stylesheets die je niet ophaalt.
 *
 * De Web Developer-extensie lost dit op door de opmaak uit te zetten en je zelf te
 * laten kijken. Hier gaat het een stap verder: de browser weet van elk element waar
 * het staat, dus het verschil is uit te rekenen in plaats van te bekijken.
 *
 * Twee elementen liggen op dezelfde regel als hun verticale bereik overlapt. Staat
 * het volgende element in de code visueel bóven het vorige, of links ervan op
 * dezelfde regel, dan is de volgorde omgedraaid en komt het in de lijst.
 */
async function getLeesvolgorde(url: string, flags: Flags) {
  const zonderCss = flags['zonder-css'] === 'true';
  const session = await getBrowser();
  try {
    const { page, cleanup } = await openPage(session, url);
    try {
      const finalUrl = page.url();
      const pageTitle = await page.title();

      const data = await page.evaluate(() => {
        const SELECTOR =
          'h1,h2,h3,h4,h5,h6,p,li,a,button,img,input,select,textarea,summary,figcaption,td,th';
        const items: {
          tag: string;
          tekst: string;
          top: number;
          bottom: number;
          left: number;
          keten: string;
        }[] = [];

        for (const el of Array.from(document.querySelectorAll(SELECTOR))) {
          // Bij een link of span die over twee regels afbreekt, omvat het omhullende
          // vak beide regels en begint het links onderaan. Dat leest als "staat links
          // van zijn voorganger" terwijl het er gewoon achter loopt. Het eerste
          // regelvak is waar het element werkelijk begint.
          const vakken = el.getClientRects();
          const rect = vakken.length ? vakken[0] : el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const stijl = window.getComputedStyle(el);
          if (stijl.visibility === 'hidden' || stijl.display === 'none') continue;
          if (el.closest('[aria-hidden="true"]')) continue;

          // Buiten het doek geparkeerd: de gebruikelijke manier om een skiplink of
          // een schermlezerlabel te verbergen (top:-9999px, left:-999999px, of een
          // clip van 1 bij 1). Zulke elementen hebben wel een positie, maar die zegt
          // niets over de kijkvolgorde — meenemen levert verschillen van miljoenen
          // pixels op en verstopt de echte omkeringen.
          if (rect.top < -500 || rect.left < -500) continue;
          if (rect.width <= 1 || rect.height <= 1) continue;
          if (stijl.clipPath === 'inset(50%)' || stijl.clip === 'rect(0px, 0px, 0px, 0px)') continue;

          const tag = el.tagName.toLowerCase();
          let tekst = '';
          if (tag === 'img') {
            tekst = `[afbeelding: ${(el as HTMLImageElement).alt || 'leeg tekstalternatief'}]`;
          } else if (['input', 'select', 'textarea'].includes(tag)) {
            tekst = `[formulierveld ${(el as HTMLInputElement).type || tag}]`;
          } else if (['a', 'button', 'summary'].includes(tag)) {
            // Hele tekst, ook uit onderliggende elementen. Bij een link of knop zit de
            // tekst vaak in een span, naast een icoon-span. Alleen de eigen tekstknopen
            // lezen laat zo'n link als leeg gelden en dan valt hij weg — op heuvelrug.nl
            // verdwenen daardoor de zes toptaken uit de meting. Dubbeltelling dreigt niet:
            // span staat niet in de selectie, dus die tekst wordt nergens anders geteld.
            tekst = (el.textContent || '').replace(/\s+/g, ' ').trim();
          } else {
            // Alleen eigen tekst, zodat een omhullend element niet herhaalt wat de
            // links en koppen erin al bijdragen.
            tekst = Array.from(el.childNodes)
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent || '')
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          if (!tekst) continue;

          // Voorouderketen, om te bepalen of twee elementen bij elkaar horen. Bewust
          // hier uitgerekend en niet in een eigen functie: de bundler wikkelt benoemde
          // functies in een helper die in de browser niet bestaat (__name is not defined).
          const pad: string[] = [];
          let n: Element | null = el;
          while (n && n !== document.body) {
            const ouder: Element | null = n.parentElement;
            pad.unshift(ouder ? String(Array.prototype.indexOf.call(ouder.children, n)) : '0');
            n = ouder;
          }

          items.push({
            tag,
            tekst: tekst.slice(0, 80),
            top: Math.round(rect.top + window.scrollY),
            bottom: Math.round(rect.bottom + window.scrollY),
            left: Math.round(rect.left),
            keten: pad.join('/'),
          });
        }
        return items;
      });

      /**
       * Op dezelfde regel als hun verticale bereik overlapt — maar alleen bij
       * vergelijkbare hoogte. Een hero-afbeelding van 500 pixels overlapt met alles
       * wat eroverheen ligt; die naast een knop van 40 pixels leggen en concluderen
       * dat er iets links van staat, levert alleen ruis op. Dat is een omhulsel, geen
       * buur.
       */
      const zelfdeRegel = (a: (typeof data)[0], b: (typeof data)[0]) => {
        if (!(a.top < b.bottom - 4 && b.top < a.bottom - 4)) return false;
        const ha = a.bottom - a.top;
        const hb = b.bottom - b.top;
        return Math.max(ha, hb) <= Math.min(ha, hb) * 3;
      };

      const afwijkingen: {
        positie: number;
        staatInCodeNa: string;
        maarVisueelBoven: string;
        verschil: string;
      }[] = [];

      /**
       * Horen deze twee bij elkaar? Een pagina met kolommen levert anders eindeloos
       * valse meldingen: kolom 1 staat in de code voor kolom 2 en visueel ernaast, dus
       * begint kolom 2 "hoger". Dat is geen omgekeerde leesvolgorde maar de normale
       * manier waarop kolommen werken — je leest ze na elkaar, en dat doet de code ook.
       *
       * Een echte omkering zit binnen een blok: de afbeelding boven de titel van
       * dezelfde kaart. Daarom alleen vergelijken als de twee dicht bij elkaar in de
       * boom staan.
       */
      const horenBijElkaar = (a: (typeof data)[0], b: (typeof data)[0]) => {
        const pa = a.keten.split('/');
        const pb = b.keten.split('/');
        let gemeenschappelijk = 0;
        while (
          gemeenschappelijk < pa.length &&
          gemeenschappelijk < pb.length &&
          pa[gemeenschappelijk] === pb[gemeenschappelijk]
        ) {
          gemeenschappelijk++;
        }
        return pa.length - gemeenschappelijk <= 3 && pb.length - gemeenschappelijk <= 3;
      };

      for (let i = 0; i < data.length - 1; i++) {
        const a = data[i];
        const b = data[i + 1];
        if (!horenBijElkaar(a, b)) continue;
        // Staat het volgende element flink naar rechts en hoger, dan lees je geen
        // omgekeerde volgorde maar een volgende kolom. Kolommen na elkaar doorlopen is
        // juist goed, en dat doet de code ook. Een echte omkering staat recht boven zijn
        // voorganger: de afbeelding boven de titel van dezelfde kaart.
        const volgendeKolom = !zelfdeRegel(a, b) && b.left > a.left + 100;

        const omgekeerd = zelfdeRegel(a, b)
          ? b.left < a.left - 4
          : b.top < a.top - 4 && !volgendeKolom;
        if (!omgekeerd) continue;
        afwijkingen.push({
          positie: i + 1,
          staatInCodeNa: `${a.tag}: ${a.tekst}`,
          maarVisueelBoven: `${b.tag}: ${b.tekst}`,
          verschil: zelfdeRegel(a, b)
            ? `${a.left - b.left}px naar links op dezelfde regel`
            : `${a.top - b.top}px hoger op de pagina`,
        });
      }

      const dir = ensureOutputDir();
      const basis = `${timestamp()}-${slugifyUrl(finalUrl)}-leesvolgorde`;

      // De volgorde van de ZICHTBARE onderdelen als platte tekst.
      //
      // Bewust niet "voorleesvolgorde" genoemd. Wat hulpsoftware doorloopt is meer dan
      // dit: skiplinks, verborgen koppen en schermlezerlabels staan buiten het scherm
      // geparkeerd en vallen hier af, terwijl ze wel worden voorgelezen. Op heuvelrug.nl
      // is de h1 'Home' zo'n geval. Voor het vergelijken van kijkvolgorde met codevolgorde
      // moeten die er juist uit — ze hebben geen zinnige positie — maar dan mag het
      // resultaat niet doen alsof het de volledige voorleesvolgorde is.
      const tekstBestand = path.join(dir, `${basis}.txt`);
      fs.writeFileSync(
        tekstBestand,
        data.map((d, i) => `${String(i + 1).padStart(4)}. ${d.tag.padEnd(8)} ${d.tekst}`).join('\n'),
        'utf8'
      );

      let schermafdruk: string | null = null;
      if (zonderCss) {
        // Wat de Web Developer-extensie "Disable All Styles" noemt.
        await page.evaluate(() => {
          document.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => n.remove());
          document.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
          for (const blad of Array.from(document.styleSheets)) {
            try {
              (blad as CSSStyleSheet).disabled = true;
            } catch {
              // Stylesheet van een ander domein; die is al met de link verwijderd.
            }
          }
        });
        schermafdruk = path.join(dir, `${basis}-zonder-css.png`);
        await page.screenshot({ path: schermafdruk as `${string}.png`, fullPage: true });
      }

      print({
        url: finalUrl,
        title: pageTitle,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        elementen: data.length,
        afwijkingen: afwijkingen.length,
        omkeringen: afwijkingen.slice(0, 25),
        zichtbareVolgorde: tekstBestand,
        schermafdrukZonderCss: schermafdruk,
        let_op:
          session.mode === 'cdp'
            ? null
            : 'Gedraaid zonder auditsessie. Voor een pagina achter een login of met een cookiekeuze: start eerst npm run chrome:debug.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);

  switch (command) {
    case 'list-projects':
      return listProjects();
    case 'get-project':
      return getProject(requirePositional(positional, 0, 'projectId'));
    case 'list-criteria':
      return listCriteria();
    case 'search-quick-findings':
      return searchQuickFindings(requirePositional(positional, 0, 'keyword'));
    case 'create-sample-item':
      return createSampleItem(requirePositional(positional, 0, 'projectId'), flags);
    case 'lint-finding':
      return lintFindingCommand(flags);
    case 'create-finding':
      return createFinding(requirePositional(positional, 0, 'projectId'), flags);
    case 'create-finding-from-quick':
      return createFindingFromQuick(
        requirePositional(positional, 0, 'projectId'),
        requirePositional(positional, 1, 'quickFindingId'),
        flags,
      );
    case 'set-assessment':
      return setAssessment(requirePositional(positional, 0, 'projectId'), flags);
    case 'save-checks':
      return saveChecks(requirePositional(positional, 0, 'projectId'), flags);
    case 'get-checks':
      return getChecks(requirePositional(positional, 0, 'projectId'));
    case 'get-html':
      return getHtml(requirePositional(positional, 0, 'url'), flags);
    case 'get-screenshot':
      return getScreenshot(requirePositional(positional, 0, 'url'), flags);
    case 'get-leesvolgorde':
      return getLeesvolgorde(requirePositional(positional, 0, 'url'), flags);
    case 'run-tests':
      return runTests(requirePositional(positional, 0, 'url'), flags);
    case 'test-samples':
      return testSamples(requirePositional(positional, 0, 'projectId'), flags);
    default:
      console.error(
        `Unknown or missing command: ${command ?? '(none)'}\n\n` +
        `Available commands:\n` +
        `  list-projects\n` +
        `  get-project <projectId>\n` +
        `  list-criteria\n` +
        `  search-quick-findings <keyword>\n` +
        `  create-sample-item <projectId> --title=... [--url=...] [--type=structured|random|pdf] [--description=...] [--screenshot=true]\n` +
        `  lint-finding --description=... [--advice=...] [--impact=...] [--responsibility=...] [--status=...] [--criterion=<id|code>] [--pdf] [--json]\n` +
        `  create-finding <projectId> --criterion=<id> --description=... --advice=... [--impact=klein|matig|serieus|kritiek|onbekend] [--responsibility=redacteur|ontwikkelaar|ontwerper|onbekend] [--status=voorstel|open|published|resolved] [--evidence=...] [--sample-items=id1,id2] [--skip-lint]\n` +
        `  create-finding-from-quick <projectId> <quickFindingId> [--sample-items=id1,id2]\n` +
        `  set-assessment <projectId> --criterion=<id> --status=passed|failed|not_present|unknown|not_tested [--explanation=...]\n` +
        `  save-checks <projectId> [--bron=workflow|gesprek|handmatig] < oordelen.json   # sampleoordelen wegschrijven\n` +
        `  get-checks <projectId>                           # de opgeslagen sampleoordelen\n` +
        `  get-html <url> [--full] [--text]                # default: alleen <main>; homepage altijd volledig\n` +
        `  get-screenshot <url> [--full-page] [--selector=css] [--keep-cookie-banner]\n` +
        `  run-tests <url> [--verbose] [--only-found] [--with-browser]  # crawler-tests; --with-browser voegt contrast-test toe\n` +
        `  test-samples <projectId> [--with-browser=false]  # crawler op alle sample-items van project; opslag in DB\n`
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err?.message || err);
  process.exit(1);
});
