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
 *   tsx scripts/audit-cli.ts get-contrast <url> [--selector=...] [--klik=...]
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
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
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
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
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
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
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
  // Klik iets aan voordat de opname wordt gemaakt: een hoogcontrastknop, een
  // uitklapmenu, een tabblad. Zonder dit is alles wat pas na een handeling verschijnt
  // niet te beoordelen, en dat is precies waar de moeilijke criteria zitten.
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
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

      let geklikt: string | null = null;
      if (klik) {
        // Op tekst zoeken mag ook: --klik="tekst:Contrast verhogen". Een klasse als
        // AccessibilityBar-module-scss-module__-yiL0G__abButton verandert bij elke
        // build van de site, de knoptekst niet.
        if (klik.startsWith('tekst:')) {
          const woorden = klik.slice(6);
          const gevonden = await page.evaluate((zoek: string) => {
            const kandidaten = Array.from(
              document.querySelectorAll('button, a, [role="button"], summary, input[type="button"]')
            );
            const el = kandidaten.find((k) =>
              (k.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().includes(zoek.toLowerCase())
            );
            if (!el) return null;
            (el as HTMLElement).click();
            return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
          }, woorden);
          if (!gevonden) throw new Error(`Geen klikbaar element met de tekst "${woorden}"`);
          geklikt = gevonden;
        } else {
          const handle = await page.$(klik);
          if (!handle) throw new Error(`Selector niet gevonden om op te klikken: ${klik}`);
          await handle.click();
          geklikt = klik;
        }
        // De pagina moet de omschakeling kunnen doorvoeren.
        await new Promise((r) => setTimeout(r, 1200));
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
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
        geklikt,
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
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
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
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
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

/**
 * Meet het contrast van een element op de opgemaakte pagina.
 *
 * Voor 1.4.3 en 1.4.11, die allebei om gemeten kleuren vragen. Uit de code alleen
 * zijn die niet te halen: kleuren staan in externe opmaakbestanden, vaak achter
 * variabelen, en een knop erft zijn achtergrond meestal van een ouder.
 *
 * Meet op het element dat de tekst zelf bevat. Een <a> met een <span> erin heeft
 * vaak een andere kleur dan de span die je ziet; die verwarring leverde eerder een
 * niet-bestaande afkeuring van 1,25:1 op.
 *
 * `--klik` schakelt eerst iets aan, zodat ook een hoogcontrastweergave te meten is.
 */
async function getContrast(url: string, flags: Flags) {
  // Zonder --selector wordt de hele pagina gemeten. Eén element tegelijk is genoeg om
  // een vermoeden te toetsen, maar niet om te zeggen dat een pagina in orde is — en
  // dat laatste is wat een oordeel beweert.
  if (!flags.selector || flags.selector === 'true') {
    return getContrastAlles(url, flags);
  }
  const doel = requireFlag(flags, 'selector');
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      if (klik) {
        const woorden = klik.startsWith('tekst:') ? klik.slice(6) : null;
        const gelukt = await page.evaluate(
          (zoek: string | null, sel: string) => {
            const el = zoek
              ? Array.from(
                  document.querySelectorAll('button, a, [role="button"], summary')
                ).find((k) =>
                  (k.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().includes(zoek.toLowerCase())
                )
              : document.querySelector(sel);
            if (!el) return false;
            (el as HTMLElement).click();
            return true;
          },
          woorden,
          klik
        );
        if (!gelukt) throw new Error(`Niets om op te klikken: ${klik}`);
        await new Promise((r) => setTimeout(r, 1200));
      }

      // De pagina levert alleen ruwe waarden; het rekenwerk gebeurt hieronder in Node.
      // Een benoemde functie binnen page.evaluate wordt door de bundler in een helper
      // gewikkeld die in de browser niet bestaat (__name is not defined).
      const ruw = await page.evaluate((sel: string) => {
        const zoekTekst = sel.startsWith('tekst:') ? sel.slice(6).toLowerCase() : null;
        const el = zoekTekst
          ? Array.from(document.querySelectorAll('*')).find(
              (k) =>
                k.children.length === 0 &&
                (k.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === zoekTekst
            )
          : document.querySelector(sel);
        if (!el) return null;

        const stijl = window.getComputedStyle(el);
        const achtergronden: string[] = [];
        let achtergrondAfbeelding: string | null = null;
        let n: Element | null = el;
        while (n) {
          const s = window.getComputedStyle(n);
          if (!achtergrondAfbeelding && s.backgroundImage && s.backgroundImage !== 'none') {
            achtergrondAfbeelding = s.backgroundImage.slice(0, 60);
          }
          achtergronden.push(s.backgroundColor);
          n = n.parentElement;
        }

        return {
          tekst: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          element: el.tagName.toLowerCase(),
          kleur: stijl.color,
          achtergronden,
          fontSize: parseFloat(stijl.fontSize),
          fontWeight: stijl.fontWeight,
          achtergrondAfbeelding,
        };
      }, doel);

      if (!ruw) throw new Error(`Element niet gevonden: ${doel}`);

      const ontleed = (kleur: string): number[] | null => {
        const m = kleur.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const d = m[1].split(',').map((x) => parseFloat(x.trim()));
        return [d[0], d[1], d[2], d.length > 3 ? d[3] : 1];
      };
      const helderheid = (rgb: number[]) => {
        const k = rgb.slice(0, 3).map((v) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
      };
      const hex = (rgb: number[]) =>
        '#' + rgb.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

      const voor = ontleed(ruw.kleur);
      if (!voor) throw new Error(`Tekstkleur niet te lezen: ${ruw.kleur}`);

      // Eerste ondoorzichtige achtergrond in de voorouderketen. Een knop erft die
      // meestal van een ouder, en een doorzichtige achtergrond zegt niets.
      let achter = [255, 255, 255, 1];
      for (const kandidaat of ruw.achtergronden) {
        const c = ontleed(kandidaat);
        if (c && c[3] > 0) {
          achter = c;
          break;
        }
      }

      const l1 = helderheid(voor);
      const l2 = helderheid(achter);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const vet = parseInt(ruw.fontWeight, 10) >= 700;
      const groot = ruw.fontSize >= 24 || (vet && ruw.fontSize >= 18.66);
      const eis = groot ? 3 : 4.5;

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
        geklikt: klik,
        tekst: ruw.tekst,
        element: ruw.element,
        tekstkleur: hex(voor),
        achtergrondkleur: hex(achter),
        fontSize: `${ruw.fontSize}px`,
        fontWeight: ruw.fontWeight,
        grote_tekst: groot,
        contrast: `${Math.round(ratio * 100) / 100}:1`,
        eis: `${eis}:1`,
        voldoet: ratio >= eis,
        let_op: ruw.achtergrondAfbeelding
          ? 'Er ligt een achtergrondafbeelding achter dit element. De gemeten achtergrondkleur is dan niet wat je ziet; controleer op de schermafdruk.'
          : null,
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Het contrast van elke tekst op de pagina.
 *
 * Eén element meten toetst een vermoeden; dit toetst een oordeel. "De pagina voldoet"
 * is een uitspraak over alles wat erop staat, en die is niet te doen door één knop te
 * meten en de rest aan te nemen.
 *
 * Gelijke combinaties van kleur, achtergrond en lettergrootte worden samengevoegd: een
 * pagina met tweehonderd links levert anders tweehonderd regels op die allemaal
 * hetzelfde zeggen. Wat je wilt zien is hoeveel verschillende combinaties er zijn en
 * welke daarvan tekortschieten.
 */
async function getContrastAlles(url: string, flags: Flags) {
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      if (klik) {
        const woorden = klik.startsWith('tekst:') ? klik.slice(6) : null;
        const gelukt = await page.evaluate(
          (zoek: string | null, sel: string) => {
            const el = zoek
              ? Array.from(document.querySelectorAll('button, a, [role="button"], summary')).find(
                  (k) =>
                    (k.textContent || '')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .toLowerCase()
                      .includes(zoek.toLowerCase())
                )
              : document.querySelector(sel);
            if (!el) return false;
            (el as HTMLElement).click();
            return true;
          },
          woorden,
          klik
        );
        if (!gelukt) throw new Error(`Niets om op te klikken: ${klik}`);
        await new Promise((r) => setTimeout(r, 1200));
      }

      const ruw = await page.evaluate(() => {
        const uit: {
          tekst: string;
          tag: string;
          kleur: string;
          achtergronden: string[];
          fontSize: number;
          fontWeight: string;
          afbeeldingErachter: boolean;
        }[] = [];

        for (const el of Array.from(document.querySelectorAll('*'))) {
          // Alleen eigen tekst: anders meet je een container met de kleur van zijn
          // omhulsel terwijl de tekst die je ziet in een kind zit.
          const eigen = Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (!eigen) continue;

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.top < -500 || rect.left < -500) continue;
          const stijl = window.getComputedStyle(el);
          if (stijl.visibility === 'hidden' || stijl.display === 'none') continue;
          if (parseFloat(stijl.opacity) === 0) continue;

          const achtergronden: string[] = [];
          let afbeeldingErachter = false;
          let n: Element | null = el;
          while (n) {
            const s = window.getComputedStyle(n);
            if (s.backgroundImage && s.backgroundImage !== 'none') afbeeldingErachter = true;
            achtergronden.push(s.backgroundColor);
            n = n.parentElement;
          }

          uit.push({
            tekst: eigen.slice(0, 50),
            tag: el.tagName.toLowerCase(),
            kleur: stijl.color,
            achtergronden,
            fontSize: parseFloat(stijl.fontSize),
            fontWeight: stijl.fontWeight,
            afbeeldingErachter,
          });
        }
        return uit;
      });

      const ontleed = (kleur: string): number[] | null => {
        const m = kleur.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const d = m[1].split(',').map((x) => parseFloat(x.trim()));
        return [d[0], d[1], d[2], d.length > 3 ? d[3] : 1];
      };
      const helderheid = (rgb: number[]) => {
        const k = rgb.slice(0, 3).map((v) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
      };
      const hex = (rgb: number[]) =>
        '#' + rgb.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

      const groepen = new Map<string, any>();
      let overgeslagen = 0;

      for (const r of ruw) {
        const voor = ontleed(r.kleur);
        if (!voor) {
          overgeslagen++;
          continue;
        }
        let achter = [255, 255, 255, 1];
        for (const kandidaat of r.achtergronden) {
          const c = ontleed(kandidaat);
          if (c && c[3] > 0) {
            achter = c;
            break;
          }
        }
        const ratio =
          (Math.max(helderheid(voor), helderheid(achter)) + 0.05) /
          (Math.min(helderheid(voor), helderheid(achter)) + 0.05);
        const vet = parseInt(r.fontWeight, 10) >= 700;
        const groot = r.fontSize >= 24 || (vet && r.fontSize >= 18.66);
        const eis = groot ? 3 : 4.5;

        const sleutel = `${hex(voor)}|${hex(achter)}|${r.fontSize}|${vet}`;
        const bestaand = groepen.get(sleutel);
        if (bestaand) {
          bestaand.aantal++;
          if (bestaand.voorbeelden.length < 3) bestaand.voorbeelden.push(r.tekst);
          bestaand.afbeeldingErachter = bestaand.afbeeldingErachter || r.afbeeldingErachter;
        } else {
          groepen.set(sleutel, {
            tekstkleur: hex(voor),
            achtergrondkleur: hex(achter),
            fontSize: `${r.fontSize}px`,
            vet,
            grote_tekst: groot,
            contrast: Math.round(ratio * 100) / 100,
            eis,
            voldoet: ratio >= eis,
            aantal: 1,
            voorbeelden: [r.tekst],
            afbeeldingErachter: r.afbeeldingErachter,
          });
        }
      }

      const alle = Array.from(groepen.values()).sort((a, b) => a.contrast - b.contrast);
      const tekort = alle.filter((g) => !g.voldoet);

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
        geklikt: klik,
        gemeten_elementen: ruw.length,
        overgeslagen,
        combinaties: alle.length,
        onvoldoende: tekort.length,
        tekortschietend: tekort,
        laagste_die_wel_voldoet: alle.find((g) => g.voldoet) ?? null,
        let_op:
          tekort.some((g) => g.afbeeldingErachter) || alle.some((g) => g.afbeeldingErachter)
            ? 'Bij sommige combinaties ligt er een achtergrondafbeelding achter de tekst. De gemeten achtergrondkleur is dan niet wat je ziet; controleer die op de schermafdruk.'
            : null,
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Reflow: past de pagina op een smal scherm zonder horizontaal scrollen?
 *
 * Voor SC 1.4.10. De eis is 320 CSS-pixels breed — dat komt overeen met 400% zoom op
 * een scherm van 1280. Niet af te leiden uit de code of uit een schermafdruk op
 * normale breedte: het hangt af van mediaqueries, minimumbreedtes en vaste
 * pixelmaten die pas op die breedte in de knel komen.
 *
 * Levert naast het oordeel een schermafdruk op, zodat een mens kan bevestigen wat
 * de meting zegt. Een getal als "overschrijdt met 47 pixels" is geen bewijs dat er
 * iets stuk is; het beeld erbij wel.
 */
async function getReflow(url: string, flags: Flags) {
  const breedte = parseInt(flags.breedte || '320', 10);
  const hoogte = parseInt(flags.hoogte || '1024', 10);
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      // Eerst de breedte zetten, dan opnieuw laden: mediaqueries en scripts die op
      // de beginbreedte reageren moeten die smalle breedte zien, niet de brede.
      await page.setViewport({ width: breedte, height: hoogte, deviceScaleFactor: 1 });
      await page.reload({ waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1200));

      const meting = await page.evaluate((vp: number) => {
        const doc = document.documentElement;
        const teBreed: { tag: string; tekst: string; rechts: number; breedte: number }[] = [];
        let ingeslotenAantal = 0;

        for (const el of Array.from(document.querySelectorAll('*'))) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const s = window.getComputedStyle(el);
          if (s.visibility === 'hidden' || s.display === 'none') continue;
          // Buiten beeld geparkeerde elementen (skiplinks) tellen niet mee.
          if (rect.left < -500) continue;
          if (rect.right <= vp + 1) continue;

          // Steekt het element buiten een voorouder die afknipt of zelf schuift, dan
          // is dat geen reflow-probleem van de pagina. Twee gevallen, allebei goed:
          // een brede tabel in een vak met overflow-x auto — de toegestane oplossing
          // voor iets dat een tweedimensionale opmaak nodig heeft — en inhoud in een
          // dichtgeklapt uitklapblok, dat nog wel afmetingen heeft maar niet in beeld
          // staat. Zonder deze uitzondering meldde buitenspelen.nl 304 te brede
          // elementen terwijl er op het scherm niets uitsteekt.
          let ingesloten = false;
          let o: Element | null = el.parentElement;
          while (o) {
            const os = window.getComputedStyle(o);
            const orect = o.getBoundingClientRect();
            const knipt = /auto|scroll|hidden|clip/.test(os.overflowX);
            if (knipt && orect.right <= vp + 1) {
              ingesloten = true;
              break;
            }
            o = o.parentElement;
          }
          if (ingesloten) {
            ingeslotenAantal++;
            continue;
          }

          teBreed.push({
            tag: el.tagName.toLowerCase(),
            tekst: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 45),
            rechts: Math.round(rect.right),
            breedte: Math.round(rect.width),
          });
        }

        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          horizontaalScrollen: doc.scrollWidth > doc.clientWidth + 1,
          teBreed: teBreed.slice(0, 40),
          aantalTeBreed: teBreed.length,
          ingeslotenAantal,
        };
      }, breedte);

      const dir = ensureOutputDir();
      const bestand = path.join(
        dir,
        `${timestamp()}-${slugifyUrl(page.url())}-reflow-${breedte}px.png`
      );
      await page.screenshot({ path: bestand as `${string}.png`, fullPage: true });

      // De buitenste elementen eerst: die veroorzaken de overschrijding meestal, de
      // rest wordt meegesleept.
      const opvallend = meting.teBreed
        .sort((a, b) => b.rechts - a.rechts)
        .slice(0, 8);

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
        breedte: `${breedte}px`,
        paginabreedte: `${meting.scrollWidth}px`,
        vensterbreedte: `${meting.clientWidth}px`,
        horizontaal_scrollen: meting.horizontaalScrollen,
        overschrijding: meting.horizontaalScrollen
          ? `${meting.scrollWidth - meting.clientWidth}px`
          : null,
        elementen_te_breed: meting.aantalTeBreed,
        in_een_schuivend_of_afgeknipt_vak: meting.ingeslotenAantal,
        breedste_elementen: opvallend,
        schermafdruk: bestand,
        oordeel: meting.horizontaalScrollen
          ? 'Er is horizontaal gescroll nodig. Bekijk de schermafdruk en stel vast of er ook informatie of functionaliteit wegvalt.'
          : 'Geen horizontaal gescroll. Bekijk de schermafdruk nog wel op weggevallen of overlappende inhoud.',
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
    case 'get-contrast':
      return getContrast(requirePositional(positional, 0, 'url'), flags);
    case 'get-reflow':
      return getReflow(requirePositional(positional, 0, 'url'), flags);
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
