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
 *   tsx scripts/audit-cli.ts get-screenshot <url> [--full-page] [--selector=...] [--breedte=320] [--klik=...]
 *   tsx scripts/audit-cli.ts get-leesvolgorde <url> [--zonder-css]
 *   tsx scripts/audit-cli.ts get-contrast <url> [--selector=...] [--klik=...]
 *   tsx scripts/audit-cli.ts get-reflow <url> [--breedte=320]
 *   tsx scripts/audit-cli.ts koppel-logboek <projectId> [--drooglopen]
 *   tsx scripts/audit-cli.ts capture-sample-evidence <projectId> <sampleId>
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
import { legVast, leesLogboek } from './lib/audit-log';
import {
  lintFinding,
  formatLintIssues,
  type FindingDraft,
} from '../lib/finding-lint';
import { getAuditEvidencePaths, isHomepageUrl } from '../lib/audit-evidence';

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
      // De beschrijving draagt wat er bijzonder is aan deze pagina en dat is soms
      // beslissend: dat een stap van een formulier niet met een los adres te openen
      // is, bijvoorbeeld. Zonder dit veld hier ziet geen enkele agent het.
      description: s.description || null,
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

/**
 * Schrijft de beoordelingen van één sample weg (alle criteria van het onderzoekstype).
 *
 * Voedt zich uit een JSON-bestand met de vorm die de audit-samples-workflow teruggeeft:
 *   { "assessments": [{ "code": "1.3.1", "status": "afgekeurd", "reden": "..." }] }
 * of rechtstreeks een array van diezelfde objecten.
 *
 * De workflow zelf schrijft bewust niets naar de database; dit commando doet dat achteraf,
 * zodat na een run vastligt dat het sample volledig is nagelopen.
 */
async function saveSampleChecks(sampleId: string, bestand: string, flags: Flags) {
  const ruw = JSON.parse(fs.readFileSync(bestand, 'utf8'));
  const lijst: any[] = Array.isArray(ruw)
    ? ruw
    : Array.isArray(ruw.assessments)
    ? ruw.assessments
    : Array.isArray(ruw.checks)
    ? ruw.checks
    : [];
  if (!lijst.length) {
    throw new Error(
      `Geen beoordelingen gevonden in ${bestand}. Verwacht een array, of een object met "assessments" of "checks".`,
    );
  }

  const bron = flags.bron || 'workflow';
  const checks = lijst.map((a) => ({
    criterionCode: a.code ?? a.criterionCode,
    status: a.status,
    reden: a.reden ?? a.toelichting ?? null,
    bron,
    // Een voorstel-bevinding is voorgelegd zodra hij bestaat; akkoord volgt later.
    akkoord:
      a.akkoord ??
      (a.status === 'afgekeurd' || a.status === 'opmerking' ? 'voorgesteld' : undefined),
  }));

  const result = await api(`/api/sample-items/${sampleId}/criterion-checks`, {
    method: 'PUT',
    body: JSON.stringify({ checks }),
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

/** Toont de dekking van één sample: hoeveel criteria beoordeeld, wat staat er nog open. */
async function getSampleChecks(sampleId: string, flags: Flags) {
  const result = await api(`/api/sample-items/${sampleId}/criterion-checks`);
  if (flags.full === 'true') {
    print(result);
    return;
  }
  print({
    sampleItemId: result.sampleItemId,
    totaal: result.totaal,
    telling: result.telling,
    wachtOpAkkoord: result.wachtOpAkkoord,
    openstaandeVragen: result.openstaandeVragen,
  });
}

/**
 * Dekkingscontrole over het hele project: is elk criterium op elk sample nagelopen?
 *
 * Zonder --full alleen de samenvatting en de gaten; de volledige lijst per sample is bij
 * twintig samples en 33 criteria te lang om in één keer te lezen.
 */
async function getDekking(projectId: string, flags: Flags) {
  const result = await api(`/api/projects/${projectId}/dekking`);
  if (flags.full === 'true') {
    print(result);
    return;
  }
  print({
    project: result.project,
    samenvatting: result.samenvatting,
    dekkingCompleet: result.dekkingCompleet,
    // De gaten zelf, want daar gaat het om. Samples die compleet zijn hoeven niet in beeld.
    onvolledigeSamples: (result.perSample || [])
      .filter((s: any) => !s.volledig)
      .map((s: any) => ({ titel: s.titel, beoordeeld: `${s.beoordeeld}/${s.verwacht}`, mist: s.ontbrekendeCodes })),
    ontbrekend: result.ontbrekend,
    zonderOnderbouwing: result.zonderOnderbouwing,
    openVragen: result.openVragen,
  });
}

/**
 * Markeert één beoordeling als akkoord of afgewezen, nadat de onderzoeker erop heeft gereageerd.
 */
async function setCheckAkkoord(sampleId: string, code: string, flags: Flags) {
  const akkoord = requireFlag(flags, 'akkoord');
  const huidig = await api(`/api/sample-items/${sampleId}/criterion-checks`);
  const check = (huidig.checks || []).find((c: any) => c.wcagCriterion?.code === code);
  if (!check) throw new Error(`Geen beoordeling gevonden voor ${code} op dit steekproefitem`);

  const result = await api(`/api/sample-items/${sampleId}/criterion-checks`, {
    method: 'PUT',
    body: JSON.stringify({
      checks: [
        {
          criterionCode: code,
          status: check.status,
          reden: check.reden,
          bron: check.bron,
          akkoord,
        },
      ],
    }),
  });
  print(result);
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

      // En een opname van dezelfde pagina, in dezelfde toestand.
      //
      // Zonder dit levert het ophalen van een pagina alleen een tekstbestand op, en daar
      // kan een onderzoeker geen oordeel op nakijken. De browser staat hier toch al open
      // met deze pagina erin, dus dit is de goedkoopste manier om bewijs mee te leveren.
      const beeld = path.join(dir, `${timestamp()}-${slugifyUrl(finalUrl)}-pagina.png`);
      try {
        await page.screenshot({ path: beeld as `${string}.png`, fullPage: true });
      } catch {
        // Een te lange pagina kan de opname laten mislukken; dat mag het ophalen niet
        // ongeldig maken.
      }
      const beeldGelukt = fs.existsSync(beeld);

      // Geen criteria: de pagina ophalen dient elk criterium, niet één in het
      // bijzonder. Dat staat zo in het logboek en dat is de eerlijke weergave.
      legVast({
        commando: 'get-html',
        // Alleen de vlaggen die werkelijk zijn meegegeven. `useFull` volgt uit de
        // homepage-detectie en niet uit een vlag; die hier opnemen maakt de regel
        // onbruikbaar om over te typen, want dan zet je iets aan wat de CLI zelf
        // bepaalt. De uitkomst vermeldt de scope wél, want dat is een meetresultaat.
        argumenten: { ...(wantFull ? { full: 'true' } : {}), ...(wantText ? { text: 'true' } : {}) },
        url: url,
        eindUrl: finalUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        artefact: file,
        schermafdruk: beeldGelukt ? beeld : null,
        // Dit commando schakelt niets aan; het haalt de pagina op zoals hij komt. Dat
        // expliciet vastleggen scheelt de vraag waarom er onder een hoogcontrastoordeel
        // een opname in gewone kleuren staat.
        weergave: 'standaardweergave',
        uitkomst: { scope: useFull ? 'document' : 'main', bytes: content.length },
      });

      print({
        url: finalUrl,
        requestedUrl: url,
        title: pageTitle,
        scope: useFull ? 'document' : 'main',
        homepageDetected: isHomepage,
        format: wantText ? 'text' : 'html',
        bytes: Buffer.byteLength(content, 'utf8'),
        file,
        schermafdruk: beeldGelukt ? beeld : null,
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
  // Een breedte meegeven, zodat een handeling op een smal scherm te toetsen is.
  // 1.4.10 eist dat de inhoud past zonder verlies van informatie of functionaliteit;
  // of een uitklapmenu op 320 pixels nog opengaat hoort dus bij dat criterium, en
  // dat is alleen vast te stellen door op die breedte te klikken.
  const breedte = flags.breedte ? parseInt(flags.breedte, 10) : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      if (breedte) {
        // Eerst de breedte, dan opnieuw laden: mediaqueries en scripts die op de
        // beginbreedte reageren moeten de smalle versie zien.
        await page.setViewport({ width: breedte, height: 1024, deviceScaleFactor: 1 });
        await page.reload({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      }
      const pageTitle = await page.title();
      const finalUrl = page.url();
      const dir = ensureOutputDir();
      const file = path.join(
        dir,
        `${timestamp()}-${slugifyUrl(finalUrl)}${breedte ? `-${breedte}px` : ''}.png`
      );

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
      legVast({
        commando: 'get-screenshot',
        argumenten: {
          ...(fullPage ? { 'full-page': 'true' } : {}),
          ...(selector ? { selector } : {}),
          ...(breedte ? { breedte: String(breedte) } : {}),
          ...(klik ? { klik } : {}),
        },
        url: url,
        eindUrl: finalUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        artefact: file,
        schermafdruk: file,
        uitkomst: { bytes: stat.size },
      });

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

      legVast({
        commando: 'get-leesvolgorde',
        argumenten: zonderCss ? { 'zonder-css': 'true' } : {},
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        artefact: schermafdruk ?? tekstBestand,
        schermafdruk: schermafdruk ?? null,
        uitkomst: { elementen: data.length, afwijkingen: afwijkingen.length },
      });

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

        // De rand erbij, voor 1.4.11. Dat criterium gaat over niet-tekstuele content:
        // de omranding van een invoerveld, een pictogram, de rand van een knop. Die
        // hebben geen tekstkleur, dus zonder dit valt er niets te meten en bleef 1.4.11
        // altijd een vraag voor de onderzoeker.
        //
        // De eerste zijde met een zichtbare rand telt. Een rand van 0 pixels of
        // 'none' is geen rand, ook als er een kleur bij staat.
        const zijden = ['Top', 'Right', 'Bottom', 'Left'] as const;
        let randkleur: string | null = null;
        let randbreedte: number | null = null;
        for (const z of zijden) {
          const stijlNaam = (stijl as any)[`border${z}Style`];
          const breedte = parseFloat((stijl as any)[`border${z}Width`] || '0');
          if (stijlNaam && stijlNaam !== 'none' && breedte > 0) {
            randkleur = (stijl as any)[`border${z}Color`];
            randbreedte = breedte;
            break;
          }
        }

        return {
          tekst: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          element: el.tagName.toLowerCase(),
          kleur: stijl.color,
          randkleur,
          randbreedte,
          eigenAchtergrond: stijl.backgroundColor,
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

      // Zonder tekst is er geen tekstcontrast.
      //
      // Dit commando rekende `color` tegen de achtergrond ook uit voor een element dat geen
      // letter bevat — een pictogramomhulsel bijvoorbeeld — en meldde dan "contrast 21:1,
      // voldoet aan 4,5:1". Dat getal meet niets: er staat geen tekst om te lezen. Op de
      // kaart las het als bewijs, en het hing het oordeel bovendien aan 1.4.3 vast, een
      // criterium waar dat element helemaal niet onder valt.
      const heeftTekst = !!(ruw.tekst || '').trim();

      /**
       * De rand tegen wat erachter ligt — dat is 1.4.11, en die eis is 3:1.
       *
       * De achtergrond van de rand is niet die van het element zelf maar die van zijn
       * omgeving: een wit zoekveld met een grijze rand op een groene balk moet die rand
       * tegen het groen halen, niet tegen het wit binnenin. Daarom de voorouderketen
       * vanaf de OUDER, niet vanaf het element.
       */
      let rand: Record<string, unknown> | null = null;
      const randVoor = ruw.randkleur ? ontleed(ruw.randkleur) : null;
      if (randVoor && randVoor[3] > 0) {
        let randAchter = [255, 255, 255, 1];
        for (const kandidaat of ruw.achtergronden.slice(1)) {
          const c = ontleed(kandidaat);
          if (c && c[3] > 0) {
            randAchter = c;
            break;
          }
        }
        const rl1 = helderheid(randVoor);
        const rl2 = helderheid(randAchter);
        const rratio = (Math.max(rl1, rl2) + 0.05) / (Math.min(rl1, rl2) + 0.05);
        rand = {
          randkleur: hex(randVoor),
          randbreedte: `${ruw.randbreedte}px`,
          erachter: hex(randAchter),
          contrast: `${Math.round(rratio * 100) / 100}:1`,
          eis: '3:1 (1.4.11)',
          voldoet: rratio >= 3,
        };
      }

      const opname = await legOpnameVast(page, page.url(), 'contrast', doel);

      legVast({
        commando: 'get-contrast',
        argumenten: { selector: doel, ...(klik ? { klik } : {}) },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: opname,
        // Alleen aan 1.4.11 hangen als er werkelijk een rand is gemeten.
        //
        // Dit commando meet in de eerste plaats tekst tegen achtergrond, en dat is 1.4.3.
        // Hing elke aanroep ook aan 1.4.11, dan vulde het spoor onder dat criterium zich
        // met metingen die er niets over zeggen — en dan lijkt het alsof er een reeks
        // niet-tekstuele elementen is nagelopen terwijl er alleen teksten zijn gemeten.
        // Precies die verwarring leverde op de homepage vijf "bewijsstukken" op waar
        // niemand voor gekozen had.
        criteria: [...(heeftTekst ? ['1.4.3'] : []), ...(rand ? ['1.4.11'] : [])],
        uitkomst: {
          ...(heeftTekst
            ? {
                tekstkleur: hex(voor),
                achtergrondkleur: hex(achter),
                contrast: Math.round(ratio * 100) / 100,
                eis,
                voldoet: ratio >= eis,
              }
            : { tekst: 'dit element bevat geen tekst; niets te meten voor 1.4.3' }),
          // De randmeting hoort in het logboek, anders is aan de regel niet te zien
          // waarom hij wel of niet voor 1.4.11 meetelt.
          ...(rand
            ? { randkleur: rand.randkleur, randContrast: rand.contrast, randVoldoet: rand.voldoet }
            : { rand: 'geen zichtbare rand gevonden' }),
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        schermafdruk: opname,
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde. Bij een formulier met stappen kom je hier terecht als de vorige stap niet is ingevuld.`
          : undefined,
        geklikt: klik,
        tekst: ruw.tekst,
        element: ruw.element,
        ...(heeftTekst
          ? {
              tekstkleur: hex(voor),
              achtergrondkleur: hex(achter),
              fontSize: `${ruw.fontSize}px`,
              fontWeight: ruw.fontWeight,
              grote_tekst: groot,
              contrast: `${Math.round(ratio * 100) / 100}:1`,
              eis: `${eis}:1`,
            }
          : {
              tekstcontrast:
                'Niet gemeten: dit element bevat geen tekst. Rekenen met de tekstkleur levert hier een getal op dat niets betekent.',
            }),
        rand,
        voldoet: heeftTekst ? ratio >= eis : rand ? rand.voldoet : null,
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

      const opname = await legOpnameVast(page, page.url(), 'contrast-pagina');

      legVast({
        commando: 'get-contrast',
        argumenten: klik ? { klik } : {},
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: opname,
        // De paginabrede variant meet uitsluitend teksten. Geen enkele rand, dus geen
        // enkele uitspraak over 1.4.11.
        criteria: ['1.4.3'],
        uitkomst: {
          gemetenElementen: ruw.length,
          combinaties: alle.length,
          onvoldoende: tekort.length,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        schermafdruk: opname,
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

      legVast({
        commando: 'get-reflow',
        argumenten: { breedte: String(breedte) },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        artefact: bestand,
        schermafdruk: bestand,
        uitkomst: {
          paginabreedte: meting.scrollWidth,
          vensterbreedte: meting.clientWidth,
          horizontaalScrollen: meting.horizontaalScrollen,
          elementenTeBreed: meting.aantalTeBreed,
        },
      });

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

async function captureSampleEvidence(projectId: string, sampleId: string, flags: Flags) {
  const samples = await api(`/api/projects/${projectId}/sample-items`);
  const sample = samples.find((item: any) => item.id === sampleId);
  if (!sample) throw new Error(`Steekproefitem ${sampleId} bestaat niet in project ${projectId}`);
  if (!sample.url) throw new Error('Dit steekproefitem heeft geen URL');
  if (sample.sampleType === 'pdf') {
    throw new Error('PDF-items gebruiken een aparte documentworkflow; browserbewijs is alleen voor webpagina\'s');
  }

  const session = await getBrowser();
  try {
    const { page, cleanup } = await openPage(session, sample.url);
    try {
      const finalUrl = page.url();
      const fullDocument = flags.full === 'true' || isHomepageUrl(finalUrl);
      const html = await page.evaluate((useFull) => {
        const target = useFull
          ? document.documentElement
          : document.querySelector('main') || document.documentElement;
        return useFull ? '<!doctype html>\n' + target.outerHTML : target.outerHTML;
      }, fullDocument);

      const capturedAt = new Date();
      const paths = getAuditEvidencePaths({
        cwd: process.cwd(),
        projectId,
        sampleId,
        timestamp: capturedAt.toISOString(),
      });
      fs.mkdirSync(paths.diskDir, { recursive: true });
      fs.writeFileSync(paths.htmlDiskPath, html, 'utf8');

      if (flags['keep-cookie-banner'] !== 'true') {
        await page.addStyleTag({
          content: `[class*="cookie" i][class*="modal" i], [class*="cookie" i][class*="banner" i],
            [id*="cookie" i][role="dialog"], [aria-label*="cookie" i][role="dialog"] {
              display: none !important; visibility: hidden !important;
            }`,
        });
      }
      await page.screenshot({ path: paths.screenshotDiskPath as `${string}.png`, fullPage: true });

      const updated = await api(`/api/sample-items/${sampleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          makeScreenshot: true,
          screenshotPath: paths.screenshotPublicPath,
          screenshotAlt: sample.title,
          auditHtmlPath: paths.htmlPublicPath,
          auditCapturedAt: capturedAt.toISOString(),
        }),
      });

      print({
        projectId,
        sampleId,
        title: sample.title,
        requestedUrl: sample.url,
        url: finalUrl,
        scope: fullDocument ? 'document' : 'main',
        htmlBytes: Buffer.byteLength(html, 'utf8'),
        screenshotBytes: fs.statSync(paths.screenshotDiskPath).size,
        htmlPath: updated.auditHtmlPath,
        screenshotPath: updated.screenshotPath,
        capturedAt: updated.auditCapturedAt,
        browser: session.mode,
        findingCreated: false,
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Koppelt het logboek aan de sampleoordelen: waarop rust elk oordeel?
 *
 * Dit doet de CLI en niet een agent. Zou een agent het logboek overtypen in zijn
 * antwoord, dan is het weer een bewering — hij kan een regel verzinnen of er een
 * weglaten. Hier wordt gelezen wat er staat en weggeschreven wat erbij hoort.
 *
 * Per sample krijgt elk criterium: de algemene ophaalacties op die pagina (get-html,
 * get-screenshot, de kale weergave) plus de metingen die voor dat criterium bestaan
 * (get-reflow voor 1.4.10, get-contrast voor 1.4.3 en 1.4.11, get-leesvolgorde voor
 * 1.3.2). De algemene acties staan bij elk criterium, want daar rust elk oordeel
 * werkelijk op; alleen de laatste per soort, anders wordt de kaart onleesbaar.
 *
 * Oordelen zonder enige meting blijven leeg. Dat is informatie: er kwam geen
 * gereedschap aan te pas.
 */
async function koppelLogboek(projectId: string, flags: Flags) {
  const regels = leesLogboek();
  if (!regels.length) {
    print({ gekoppeld: 0, melding: 'Het logboek is leeg; niets te koppelen.' });
    return;
  }

  const samples: any[] = await api(`/api/projects/${projectId}/sample-items`);
  const checks: any[] = await api(`/api/projects/${projectId}/criterion-checks`);

  // Adres naar sample. Vergelijken zonder afsluitende schuine streep en zonder www,
  // net als bij het vaststellen van een omleiding.
  const kaal = (u: string) => {
    try {
      const x = new URL(u);
      return x.host.replace(/^www\./, '').toLowerCase() + x.pathname.replace(/\/+$/, '').toLowerCase();
    } catch {
      return u;
    }
  };
  const sampleVanUrl = new Map<string, any>();
  for (const s of samples) if (s.url) sampleVanUrl.set(kaal(s.url), s);

  const ALGEMEEN = new Set(['get-html', 'get-screenshot', 'get-leesvolgorde']);
  // Per sample: laatste algemene actie per commando, en alle gerichte metingen per code.
  const algemeenPerSample = new Map<string, Map<string, any>>();
  /** Per sample: per meting de laatste run, met de criteria van díe run. */
  const gerichtPerSample = new Map<string, Map<string, { meting: any; criteria: string[] }>>();

  for (const r of regels) {
    const sample = sampleVanUrl.get(kaal(r.eindUrl || r.url || ''));
    if (!sample) continue;
    const meting = {
      commando: r.commando,
      argumenten: r.argumenten,
      url: r.url,
      tijd: r.tijd,
      browser: r.browser,
      weergave: r.weergave ?? null,
      artefact: r.artefact,
      // Oudere regels hebben dit veld niet. Staat er alleen een artefact en is dat een
      // afbeelding, dan is dát het beeld — anders had de kaart voor alles wat vóór
      // vandaag gemeten is geen schermafdruk meer.
      schermafdruk:
        r.schermafdruk ?? (r.artefact && /\.(png|jpe?g)$/i.test(r.artefact) ? r.artefact : null),
      schermafdrukken: r.schermafdrukken ?? [],
      uitkomst: r.uitkomst,
    };
    if (!r.criteria.length && ALGEMEEN.has(r.commando)) {
      if (!algemeenPerSample.has(sample.id)) algemeenPerSample.set(sample.id, new Map());
      algemeenPerSample.get(sample.id)!.set(r.commando, meting);
      continue;
    }
    if (!r.criteria.length) continue;

    // Op commando plus wát er gemeten is, zodat dezelfde meting maar één keer op de
    // kaart komt. Wie een meting herhaalt levert geen nieuw bewijs; alleen de laatste
    // telt. Zonder dit vulde de kaart zich met zes identieke reflow-regels — mijn
    // eigen testklikken op "Nog eens meten" — en was niet meer te zien wat er
    // werkelijk was gedaan.
    //
    // `klik` telt bewust NIET mee in de sleutel. Meet je hetzelfde element eerst in de
    // standaardweergave en daarna in de hoogcontrastweergave, dan is dat tweede een
    // correctie op het eerste en geen tweede bewijsstuk. Bleef de eerste staan, dan
    // stonden er onder een hoogcontrastoordeel opnamen in gewone kleuren die nergens
    // meer op sloegen.
    //
    // `breedte` telt wél mee: een reflow-meting op 320 en op 1280 zijn twee metingen,
    // niet dezelfde meting overgedaan.
    const { klik: _klik, ...watGemeten } = r.argumenten ?? {};
    const vorm = `${r.commando}|${JSON.stringify(watGemeten)}`;

    // Eerst per sample verzamelen, en pas daarna over de criteria verdelen — op basis
    // van de criteria van de LAATSTE run.
    //
    // Anders blijft een oude regel eeuwig hangen onder een criterium waar hij niet meer
    // bij hoort. `get-contrast` hing tot vandaag aan 1.4.3 én 1.4.11, ook als er geen
    // rand te meten viel; een nieuwe run die alleen nog 1.4.3 opgeeft, verwijderde de
    // oude regel onder 1.4.11 niet. Op de homepage stonden daardoor vijf tekstmetingen
    // als bewijs onder een criterium dat over niet-tekstuele onderdelen gaat.
    if (!gerichtPerSample.has(sample.id)) gerichtPerSample.set(sample.id, new Map());
    const bestaand = gerichtPerSample.get(sample.id)!.get(vorm);
    gerichtPerSample.get(sample.id)!.set(vorm, {
      meting: { ...meting, keer: (bestaand?.meting.keer ?? 0) + 1 },
      criteria: r.criteria,
    });
  }

  const teSchrijven = checks
    .map((c) => {
      const algemeen = Array.from(algemeenPerSample.get(c.sampleItemId)?.values() ?? []);
      const gericht = Array.from(gerichtPerSample.get(c.sampleItemId)?.values() ?? [])
        .filter((g) => g.criteria.includes(c.criterionCode))
        .map((g) => g.meting)
        // Op reikwijdte, niet op tijd.
        //
        // Een meting die de hele pagina afloopt zegt wát er onder dit criterium valt; de
        // metingen van losse elementen zijn de uitwerking daarvan. Op tijd gesorteerd
        // belandde `get-nietteksten` onderaan omdat hij toevallig het laatst gedraaid was,
        // en las de kaart van detail naar overzicht. Elementmetingen houden onderling wel
        // hun volgorde: sort in JavaScript is stabiel.
        .sort((a, b) => {
          const breed = (m: any) => (m.argumenten?.selector ? 1 : 0);
          return breed(a) - breed(b);
        });
      const verantwoording = [...algemeen, ...gericht];
      if (!verantwoording.length) return null;
      return {
        sampleItemId: c.sampleItemId,
        criterionCode: c.criterionCode,
        status: c.status,
        reden: c.reden,
        // Het akkoord expliciet meesturen: de API laat een akkoord vervallen als de
        // reden verandert, en die sturen we hier ongewijzigd mee. Zonder dit zou een
        // koppelactie de goedkeuringen van de onderzoeker kunnen intrekken.
        akkoord: c.akkoord,
        // En de bestaande bron. Dit commando hangt alleen het meetspoor aan een oordeel
        // dat er al ligt; waar dat oordeel vandaan kwam verandert daar niet door. Zonder
        // dit stempelde elke koppelactie alles als 'workflow', en stond er op de kaart
        // dat de workflow iets niet had gedaan bij een oordeel uit een gesprek.
        bron: c.bron ?? 'workflow',
        verantwoording,
      };
    })
    .filter(Boolean);

  if (flags.drooglopen === 'true') {
    print({
      drooglopen: true,
      logboekregels: regels.length,
      zouSchrijven: teSchrijven.length,
      voorbeeld: teSchrijven[0] ?? null,
    });
    return;
  }

  const result = await api(`/api/projects/${projectId}/criterion-checks`, {
    method: 'POST',
    body: JSON.stringify({ bron: 'workflow', checks: teSchrijven }),
  });
  print({ logboekregels: regels.length, gekoppeld: teSchrijven.length, ...result });
}

/**
 * Legt vast hoe de pagina erbij stond toen er gemeten werd.
 *
 * Elke meting die een pagina opent hoort een beeld achter te laten. Een oordeel met
 * alleen een getal eronder is niet na te kijken, en een oordeel met alleen een
 * tekstbestand eronder evenmin — dat was precies wat er misging: `get-html --text` liet
 * een .txt achter en `get-contrast` helemaal niets.
 *
 * Met een selector wordt het element zelf genomen, met wat lucht eromheen. Zonder
 * selector de hele pagina. Mislukt het, dan levert dit `null` en gaat de meting gewoon
 * door; bewijs dat er niet is verzinnen we niet, maar een mislukte opname mag geen
 * geldige meting weggooien.
 */
async function legOpnameVast(
  page: any,
  url: string,
  achtervoegsel: string,
  selector?: string | null
): Promise<string | null> {
  try {
    const dir = ensureOutputDir();
    const bestand = path.join(dir, `${timestamp()}-${slugifyUrl(url)}-${achtervoegsel}.png`);
    // `tekst:`-selectors zijn geen CSS; die kan puppeteer niet opzoeken, dus dan de
    // hele pagina.
    const bruikbaar = selector && !selector.startsWith('tekst:') ? selector : null;
    if (bruikbaar) {
      const el = await page.$(bruikbaar);
      if (el) {
        const vak = await el.boundingBox();
        if (vak && vak.width > 0 && vak.height > 0) {
          const lucht = 24;
          await page.screenshot({
            path: bestand,
            clip: {
              x: Math.max(0, vak.x - lucht),
              y: Math.max(0, vak.y - lucht),
              width: vak.width + lucht * 2,
              height: vak.height + lucht * 2,
            },
          });
          return fs.existsSync(bestand) ? bestand : null;
        }
      }
    }
    await page.screenshot({ path: bestand, fullPage: true });
    return fs.existsSync(bestand) ? bestand : null;
  } catch {
    return null;
  }
}

/**
 * Loopt de pagina af met de Tab-toets en kijkt of de focus ergens vast blijft zitten.
 *
 * SC 2.1.2 is niet uit opgehaalde HTML te bepalen — een val ontstaat door gedrag, niet door
 * opmaak — maar wél met een echte toetsenbordtest. Zonder dit commando bleef het criterium
 * staan op `niet_te_bepalen` met een vraag aan de onderzoeker, terwijl de browser het gewoon
 * kan uitvoeren.
 *
 * Elk focusbaar element krijgt vooraf een merkteken. Dat is nodig om een val te herkennen:
 * zes sociale links zien er in een beschrijving identiek uit, en dan lijkt een normale
 * doorloop op een cyclus van één element.
 *
 * De maat voor "geen val" is dat de focus het gebied uit eigen beweging verlaat. Blijft hij
 * binnen en herhaalt zich een korte reeks terwijl er meer focusbare elementen zijn, dan zit
 * de focus vast en staan de betrokken elementen in de uitkomst.
 */
async function getToetsenbordval(url: string, flags: Flags) {
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const heelDePagina = flags.scope === 'pagina';
  // Een val kan één kant op zitten: eruit met Tab lukt wel, met Shift+Tab niet. Het
  // criterium vraagt dat je weg kunt komen, niet dat je vooruit weg kunt komen.
  const achteruit = flags.achteruit === 'true';
  const max = parseInt(flags.max || '200', 10);
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

      // Eerst typen, als daarom gevraagd is.
      //
      // Een suggestielijst onder een zoekveld bestaat pas nadat er iets is ingetypt, en juist
      // zo'n lijst is een klassieke val: de pijltjes gaan erin, en Tab komt er soms niet uit.
      // Zonder deze stap test je een pagina waarop die lijst er niet eens is.
      if (flags['typ-in']) {
        const veld = requireFlag(flags, 'typ-in');
        const tekst = flags.typ && flags.typ !== 'true' ? flags.typ : 'a';
        await page.click(veld);
        await page.type(veld, tekst, { delay: 90 });
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Merktekens zetten en tegelijk de risicoconstructies inventariseren.
      const voorbereiding = await page.evaluate((heel: boolean) => {
        const gebied =
          (!heel &&
            (document.querySelector('main') ||
              document.querySelector('#skip-links-content'))) ||
          document.body;
        (gebied as HTMLElement).setAttribute('data-shift2-gebied', 'ja');

        const focusbaar = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable="true"]'
          )
        ).filter((el) => {
          const st = getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden') return false;
          if ((el as HTMLInputElement).disabled) return false;
          if (el.getAttribute('tabindex') === '-1') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        focusbaar.forEach((el, i) => el.setAttribute('data-shift2-tab', String(i)));

        // De constructies waar een val vrijwel altijd vandaan komt.
        const risico: { wat: string; waar: string }[] = [];
        for (const el of Array.from(
          gebied.querySelectorAll('iframe, embed, object, video[controls], audio[controls]')
        )) {
          risico.push({
            wat: el.tagName.toLowerCase(),
            waar: el.getAttribute('src') || el.getAttribute('title') || '(zonder bron)',
          });
        }
        for (const el of Array.from(gebied.querySelectorAll('[tabindex]'))) {
          const t = parseInt(el.getAttribute('tabindex') || '0', 10);
          if (t > 0) {
            risico.push({
              wat: `positieve tabindex (${t})`,
              waar: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            });
          }
        }
        for (const el of Array.from(
          gebied.querySelectorAll('[role="dialog"], [aria-modal="true"]')
        )) {
          risico.push({
            wat: 'dialoog of modaal venster',
            waar: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
          });
        }

        const inGebied = focusbaar.filter((el) => gebied.contains(el)).length;
        return { focusbaar: focusbaar.length, inGebied, risico };
      }, heelDePagina);

      if (!voorbereiding.inGebied) {
        throw new Error(
          heelDePagina
            ? 'Geen focusbare elementen op deze pagina.'
            : 'Geen focusbare elementen in de main-content. Draai met --scope=pagina om de hele pagina te testen.'
        );
      }

      // Vanaf de bovenkant van het document tabben.
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        document.body.focus();
      });

      const stappen: { merk: number | null; beschrijving: string; inGebied: boolean }[] = [];
      let binnenGeweest = false;
      let verliet = false;
      let escapeGetest: { waar: string; hielp: boolean } | null = null;

      for (let i = 0; i < max; i++) {
        if (achteruit) {
          await page.keyboard.down('Shift');
          await page.keyboard.press('Tab');
          await page.keyboard.up('Shift');
        } else {
          await page.keyboard.press('Tab');
        }
        const nu = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) {
            return { merk: null, beschrijving: '(buiten de pagina)', inGebied: false, inDialoog: false };
          }
          const gebied = document.querySelector('[data-shift2-gebied]');
          const merkAttr = el.getAttribute('data-shift2-tab');
          const naam =
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) ||
            (el as HTMLInputElement).placeholder ||
            '';
          return {
            merk: merkAttr === null ? null : parseInt(merkAttr, 10),
            beschrijving: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${
              naam ? ` "${naam}"` : ''
            }`,
            inGebied: !!gebied && gebied.contains(el),
            inDialoog: !!el.closest('[role="dialog"], [aria-modal="true"]'),
          };
        });

        stappen.push({ merk: nu.merk, beschrijving: nu.beschrijving, inGebied: nu.inGebied });

        // Bij een dialoog hoort Escape eruit te helpen; dat is de tweede vraag van dit
        // criterium en niet dezelfde als of Tab je eruit krijgt.
        if (nu.inDialoog && !escapeGetest) {
          await page.keyboard.press('Escape');
          await new Promise((r) => setTimeout(r, 400));
          const eruit = await page.evaluate(
            () =>
              !(document.activeElement as HTMLElement | null)?.closest(
                '[role="dialog"], [aria-modal="true"]'
              )
          );
          escapeGetest = { waar: nu.beschrijving, hielp: eruit };
        }

        if (nu.inGebied) binnenGeweest = true;
        else if (binnenGeweest) {
          verliet = true;
          break;
        }
      }

      // Een val: de focus komt niet uit het gebied en de laatste stappen herhalen een korte
      // reeks terwijl er meer focusbare elementen zijn.
      const bezocht = new Set(stappen.filter((s) => s.inGebied).map((s) => s.merk));
      const staart = stappen.slice(-12).map((s) => s.merk);
      const staartUniek = new Set(staart);
      const val =
        !verliet &&
        binnenGeweest &&
        staartUniek.size < Math.min(4, voorbereiding.inGebied) &&
        bezocht.size < voorbereiding.inGebied;

      const vastAan = val
        ? Array.from(staartUniek)
            .map((m) => stappen.find((s) => s.merk === m)?.beschrijving ?? `merk ${m}`)
            .slice(0, 4)
        : [];

      const opname = await legOpnameVast(page, page.url(), 'toetsenbordval');

      let volgorde: string | null = null;
      try {
        const dir = ensureOutputDir();
        volgorde = path.join(
          dir,
          `${timestamp()}-${slugifyUrl(page.url())}-tabvolgorde.txt`
        );
        fs.writeFileSync(
          volgorde,
          [
            `Tab-volgorde op ${page.url()}`,
            `Gebied: ${heelDePagina ? 'de hele pagina' : 'de main-content'}`,
            `Focusbaar in het gebied: ${voorbereiding.inGebied} van ${voorbereiding.focusbaar} op de pagina`,
            '',
            ...stappen.map(
              (s, i) => `${String(i + 1).padStart(3)} ${s.inGebied ? 'in ' : 'uit'} ${s.beschrijving}`
            ),
          ].join('\n'),
          'utf8'
        );
      } catch {
        volgorde = null;
      }

      legVast({
        commando: 'get-toetsenbordval',
        argumenten: {
          ...(klik ? { klik } : {}),
          ...(heelDePagina ? { scope: 'pagina' } : {}),
          ...(flags.max ? { max: String(max) } : {}),
          ...(flags['typ-in'] ? { 'typ-in': flags['typ-in'] } : {}),
          ...(flags.typ ? { typ: flags.typ } : {}),
          ...(achteruit ? { achteruit: 'true' } : {}),
        },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: opname,
        artefact: volgorde,
        criteria: ['2.1.2'],
        uitkomst: {
          gebied: heelDePagina ? 'hele pagina' : 'main-content',
          focusbaarInGebied: voorbereiding.inGebied,
          tabsGebruikt: stappen.length,
          uniekBezocht: bezocht.size,
          focusVerlietHetGebied: verliet,
          risicoconstructies: voorbereiding.risico.length,
          val,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        omgeleid,
        gebied: heelDePagina ? 'de hele pagina' : 'de main-content',
        getypt: flags['typ-in'] ? `"${flags.typ ?? 'a'}" in ${flags['typ-in']}` : null,
        focusbare_elementen_in_het_gebied: voorbereiding.inGebied,
        focusbaar_op_de_hele_pagina: voorbereiding.focusbaar,
        risicoconstructies: voorbereiding.risico.length
          ? voorbereiding.risico
          : 'geen iframes, mediaspelers, positieve tabindex of dialoogvensters',
        richting: achteruit ? 'achteruit (Shift+Tab)' : 'vooruit (Tab)',
        tabs_gebruikt: stappen.length,
        uniek_bezocht: bezocht.size,
        focus_verliet_het_gebied: verliet,
        escape_bij_een_dialoog: escapeGetest ?? 'geen dialoog tegengekomen',
        toetsenbordval: val,
        zit_vast_aan: val ? vastAan : undefined,
        tabvolgorde: volgorde,
        schermafdruk: opname,
        let_op:
          'Dit toetst of je met Tab overal weer wegkomt. Of de focus zichtbaar is valt onder 2.4.7 en wordt hier niet gemeten. Een val die alleen optreedt in een schermlezermodus vind je hier ook niet.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Meet een pictogram tegen zijn achtergrond, op de werkelijke beeldpunten.
 *
 * Een omtrekmeting deugt hier niet. Een pictogramknop is meestal een doorzichtig linkvak om
 * een svg heen: dat vak heeft geen rand en geen vulling, dus de omtrek meet achtergrond tegen
 * achtergrond en levert 1:1 op elk van de vier zijden. Bij de eerste sweep over de homepage
 * kwamen op die manier acht afkeuringen uit die geen van alle bestonden.
 *
 * Wat wél de vraag is: springt de tekening eruit tegen wat eromheen ligt. Dus wordt de
 * achtergrond bepaald uit de rand van de uitsnede, en de tekening uit de beeldpunten daarbinnen
 * die daar duidelijk van afwijken. De meest voorkomende afwijkende kleur is de tekening;
 * losse extreme beeldpunten zijn kartelranden en tellen niet als kleur mee.
 *
 * Getoetst wordt tegen het ONGUNSTIGSTE stuk achtergrond, niet tegen het gemiddelde: een wit
 * pictogram op een foto valt weg op de lichte plek, en juist daar gaat het om.
 */
async function meetPictogram(
  page: any,
  vak: { x: number; y: number; w: number; h: number },
  marge: number
) {
  const clip = {
    x: Math.max(0, Math.floor(vak.x - marge)),
    y: Math.max(0, Math.floor(vak.y - marge)),
    width: Math.ceil(vak.w + marge * 2),
    height: Math.ceil(vak.h + marge * 2),
  };
  const opname = (await page.screenshot({ clip, encoding: 'base64' })) as string;

  const ruw = await page.evaluate(
    async (base64: string, marge: number) => {
      const beeld = new Image();
      await new Promise<void>((klaar, mis) => {
        beeld.onload = () => klaar();
        beeld.onerror = () => mis(new Error('opname niet te laden'));
        beeld.src = `data:image/png;base64,${base64}`;
      });
      const doek = document.createElement('canvas');
      doek.width = beeld.width;
      doek.height = beeld.height;
      const ctx = doek.getContext('2d')!;
      ctx.drawImage(beeld, 0, 0);
      const d = ctx.getImageData(0, 0, doek.width, doek.height).data;
      const b = doek.width;
      const h = doek.height;

      // De rand van de uitsnede is de achtergrond: dat ligt buiten het element.
      const achterlijst: number[][] = [];
      for (let x = 0; x < b; x++) {
        for (const y of [0, 1, h - 2, h - 1]) {
          if (y < 0 || y >= h) continue;
          const i = (y * b + x) * 4;
          achterlijst.push([d[i], d[i + 1], d[i + 2]]);
        }
      }
      for (let y = 0; y < h; y++) {
        for (const x of [0, 1, b - 2, b - 1]) {
          if (x < 0 || x >= b) continue;
          const i = (y * b + x) * 4;
          achterlijst.push([d[i], d[i + 1], d[i + 2]]);
        }
      }

      // Alles binnen het element, dus binnen de marge.
      const binnenlijst: number[][] = [];
      for (let y = marge; y < h - marge; y++) {
        for (let x = marge; x < b - marge; x++) {
          const i = (y * b + x) * 4;
          binnenlijst.push([d[i], d[i + 1], d[i + 2]]);
        }
      }
      return { achterlijst, binnenlijst, breedte: b, hoogte: h };
    },
    opname,
    marge
  );

  const sleutel = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;
  /** De meest voorkomende kleur uit een lijst. */
  const vaakste = (lijst: number[][]) => {
    const telling = new Map<string, number>();
    for (const c of lijst) telling.set(sleutel(c), (telling.get(sleutel(c)) ?? 0) + 1);
    let beste = '';
    let n = 0;
    for (const [k, v] of Array.from(telling.entries())) if (v > n) [beste, n] = [k, v];
    return { kleur: beste ? beste.split(',').map(Number) : [0, 0, 0], aantal: n };
  };
  const afstand = (a: number[], b: number[]) =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

  const achtergrond = vaakste(ruw.achterlijst);
  // Alleen beeldpunten die duidelijk van de achtergrond afwijken zijn de tekening. De grens
  // van 60 (opgeteld over de drie kanalen) laat kartelranden en lichte ruis buiten beschouwing
  // zonder een echte tekening te missen.
  const tekeningPunten = ruw.binnenlijst.filter((c: number[]) => afstand(c, achtergrond.kleur) > 60);
  if (!tekeningPunten.length) {
    return {
      clip,
      opname,
      gevonden: false as const,
      achtergrond: achtergrond.kleur,
      dekking: 0,
    };
  }
  const tekening = vaakste(tekeningPunten);

  // Tegen het ongunstigste stuk achtergrond, niet tegen het gemiddelde.
  let slechtste = Infinity;
  let slechtsteAchter = achtergrond.kleur;
  for (const a of ruw.achterlijst) {
    const v = verhoudingTussen(tekening.kleur, a);
    if (v < slechtste) {
      slechtste = v;
      slechtsteAchter = a;
    }
  }

  return {
    clip,
    opname,
    gevonden: true as const,
    tekening: tekening.kleur,
    achtergrond: achtergrond.kleur,
    tegenVaakste: verhoudingTussen(tekening.kleur, achtergrond.kleur),
    tegenOngunstigste: slechtste,
    ongunstigsteAchtergrond: slechtsteAchter,
    dekking: Math.round((tekeningPunten.length / Math.max(1, ruw.binnenlijst.length)) * 100),
  };
}

/** Helderheid volgens WCAG, en de verhouding tussen twee kleuren. */
function helderheidVanRgb(rgb: number[]) {
  const k = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}

function verhoudingTussen(a: number[], b: number[]) {
  const l1 = helderheidVanRgb(a);
  const l2 = helderheidVanRgb(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function naarHex(rgb: number[]) {
  return (
    '#' + rgb.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  );
}

/**
 * Zoekt zelf op wat er op een pagina onder 1.4.11 valt, en meet het.
 *
 * Bestaat omdat een oordeel over 1.4.11 anders rust op wat er toevallig gemeten is. Op de
 * homepage van heuvelrug.nl stonden vier metingen onder dat criterium; niemand had ze
 * gekozen en niemand had vastgesteld dat het de juiste vier waren. Eén element meten toetst
 * een vermoeden, maar een oordeel beweert iets over alles wat op de pagina staat.
 *
 * Drie soorten worden opgezocht, precies de gevallen uit Shift2_Regels_SC_1_4_11.md:
 *
 * - `pictogram`: een bedieningselement zonder zichtbare tekst. Het pictogram is dan de enige
 *   aanduiding van de functie en moet 3:1 halen.
 * - `veldrand`: een invoerveld, keuzelijst of tekstvak. De rand is nodig om te zien waar je
 *   moet typen.
 * - `focus`: de focusindicator, nodig om bij toetsenbordbediening te zien waar je bent.
 *
 * Wat er NIET in zit is even belangrijk: een knop mét tekst is te herkennen aan die tekst,
 * opsommingstekens dragen geen informatie, en decoratieve vlakken evenmin. Die worden
 * overgeslagen met de reden erbij, zodat te zien is dat ze bekeken zijn en waarom ze
 * afvallen — een lege lijst en een lijst die niets bevat zien er anders hetzelfde uit.
 *
 * Zichtbare tekst wordt in de browser bepaald, niet uit de HTML. Een knop met een
 * `sr-only`-tekst erin heeft in de code tekst en op het scherm niet, en telt hier dus als
 * pictogram. Dat verschil is in opgehaalde HTML niet te zien.
 */
async function getNietTeksten(url: string, flags: Flags) {
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const max = parseInt(flags.max || '40', 10);
  const marge = parseInt(flags.marge || '6', 10);
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

      // De inventarisatie. Geen benoemde functies binnen page.evaluate: esbuild wikkelt die
      // in een __name-aanroep die in de browser niet bestaat.
      const kandidaten = await page.evaluate(() => {
        const gevonden: any[] = [];
        let onzichtbaar = 0;
        // Een merkteken per kandidaat, zodat hetzelfde element straks is aan te wijzen om
        // eroverheen te zweven. Een pad als `a.SocialLink…` komt zes keer voor op deze
        // pagina; daarmee zou de muis zes keer over dezelfde link gaan.
        let teller = 0;
        const overgeslagen: any[] = [];
        const bedienbaar = Array.from(
          document.querySelectorAll(
            'a, button, summary, [role="button"], [role="link"], input, select, textarea'
          )
        );

        for (let i = 0; i < bedienbaar.length; i++) {
          const el = bedienbaar[i] as HTMLElement;
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);

          // Onzichtbaar, buiten beeld of te klein om te meten telt niet mee -- maar wordt wel
          // geteld. Vallen elementen stil weg, dan tellen de aantallen in de uitkomst niet op
          // en is niet te zien of er iets is overgeslagen.
          if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) {
            onzichtbaar++;
            continue;
          }
          if (r.width < 4 || r.height < 4) {
            onzichtbaar++;
            continue;
          }
          if (r.right < 0 || r.bottom < 0 || r.left > document.documentElement.scrollWidth) {
            onzichtbaar++;
            continue;
          }

          // Een pad naar het element, zodat de meting terug te vinden en te herhalen is.
          let pad = el.tagName.toLowerCase();
          if (el.id) pad += `#${el.id}`;
          else if (el.className && typeof el.className === 'string') {
            const eerste = el.className.trim().split(/\s+/)[0];
            if (eerste) pad += `.${eerste}`;
          }

          const naam =
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            (el as HTMLInputElement).placeholder ||
            '';

          const tag = el.tagName.toLowerCase();
          const soortInvoer = (el.getAttribute('type') || '').toLowerCase();

          // Invoervelden: de rand is nodig om te zien waar je moet typen.
          if (
            tag === 'select' ||
            tag === 'textarea' ||
            (tag === 'input' &&
              !['hidden', 'submit', 'button', 'reset', 'image'].includes(soortInvoer))
          ) {
            el.setAttribute('data-shift2-nt', String(teller));
            gevonden.push({
              soort: 'veldrand',
              pad,
              merk: teller++,
              naam,
              vak: { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height },
              ronding: Math.max(
                parseFloat(st.borderTopLeftRadius) || 0,
                parseFloat(st.borderTopRightRadius) || 0,
                parseFloat(st.borderBottomLeftRadius) || 0,
                parseFloat(st.borderBottomRightRadius) || 0
              ),
            });
            continue;
          }

          // Zichtbare tekst bepalen. Niet via textContent: een sr-only-tekst staat wel in de
          // code maar niet op het scherm, en juist dat onderscheid is hier de hele vraag.
          let heeftZichtbareTekst = false;
          const loper = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let knoop: Node | null;
          while ((knoop = loper.nextNode())) {
            if (!(knoop.textContent || '').trim()) continue;
            const ouder = knoop.parentElement;
            if (!ouder) continue;
            const os = getComputedStyle(ouder);
            if (os.display === 'none' || os.visibility === 'hidden') continue;
            const orect = ouder.getBoundingClientRect();
            // Het klassieke wegstop-patroon: een vak van een beeldpunt, ver buiten beeld,
            // of weggeknipt.
            if (orect.width <= 1 || orect.height <= 1) continue;
            if (orect.right < 0 || orect.bottom < 0) continue;
            if (os.clipPath && os.clipPath !== 'none' && os.position === 'absolute') continue;
            heeftZichtbareTekst = true;
            break;
          }

          const heeftPictogram = !!el.querySelector('svg, img, i, [role="img"]');

          if (heeftZichtbareTekst) {
            overgeslagen.push({ pad, naam, reden: 'heeft zichtbare tekst; die wijst de functie aan' });
            continue;
          }
          if (!heeftPictogram) {
            overgeslagen.push({ pad, naam, reden: 'geen tekst en geen pictogram; niets om te meten' });
            continue;
          }
          // Logo's en merknamen zijn uitgezonderd in 1.4.11.
          //
          // Kijk daarvoor ook in de afbeelding zélf: het logo van heuvelrug.nl zit in een
          // link `a.active` met als titel "Ga naar de homepage" — daar staat nergens "logo"
          // in, terwijl het bestand heuvelruglogo.jpg heet. Zonder die tweede blik werd het
          // logo gemeten als was het een gewoon pictogram.
          const afbeelding = el.querySelector('img, picture source');
          const afbeeldingTekst = afbeelding
            ? [
                afbeelding.getAttribute('src') || '',
                afbeelding.getAttribute('srcset') || '',
                afbeelding.getAttribute('alt') || '',
                (afbeelding as HTMLElement).className || '',
              ].join(' ')
            : '';
          const isLogo = /logo|brand|merk|beeldmerk/i.test(pad + ' ' + naam + ' ' + afbeeldingTekst);
          if (isLogo) {
            overgeslagen.push({ pad, naam, reden: 'logo of merknaam; uitgezonderd in 1.4.11' });
            continue;
          }

          el.setAttribute('data-shift2-nt', String(teller));
          gevonden.push({
            soort: 'pictogram',
            pad,
            merk: teller++,
            naam,
            vak: { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height },
            ronding: Math.max(
              parseFloat(st.borderTopLeftRadius) || 0,
              parseFloat(st.borderTopRightRadius) || 0,
              parseFloat(st.borderBottomLeftRadius) || 0,
              parseFloat(st.borderBottomRightRadius) || 0
            ),
          });
        }
        return { gevonden, overgeslagen, onzichtbaar, bekeken: bedienbaar.length };
      });

      // Meten, één voor één. Bij meer kandidaten dan `max` wordt afgekapt, en dat staat
      // in de uitkomst: een stille afkapping leest als "alles nagelopen".
      const teMeten = kandidaten.gevonden.slice(0, max);
      const uitkomsten: any[] = [];
      /** De uitsneden die bij deze sweep horen, met bijschrift. */
      const beelden: { pad: string; bijschrift: string }[] = [];
      /**
       * Eén element meten in de toestand waarin het nu staat.
       *
       * Twee verschillende vragen, dus twee verschillende metingen. Bij een invoerveld gaat
       * het om de begrenzing: waar houdt het veld op. Bij een pictogram om de tekening zelf
       * — dat linkvak eromheen heeft vaak geen rand en geen vulling, en een omtrekmeting
       * geeft daar achtergrond tegen achtergrond.
       */
      const meetKandidaat = async (
        k: any,
        vak: { x: number; y: number; w: number; h: number }
      ) => {
        if (k.soort === 'pictogram') {
          const p = await meetPictogram(page, vak, marge);
          if (!p.gevonden) return null;
          return {
            slechtste: Math.round(p.tegenOngunstigste * 100) / 100,
            opname: p.opname,
            bijzonderheden: {
              tekening: naarHex(p.tekening),
              achtergrond: naarHex(p.achtergrond),
              tegen_de_gewone_achtergrond: `${Math.round(p.tegenVaakste * 100) / 100}:1`,
              tegen_het_ongunstigste_punt: `${
                Math.round(p.tegenOngunstigste * 100) / 100
              }:1 (${naarHex(p.ongunstigsteAchtergrond)})`,
              dekking: `${p.dekking}% van het vak`,
            },
          };
        }
        const omtrek = await meetOmtrek(page, { ...vak, ronding: k.ronding }, marge);
        return {
          slechtste: Math.round(omtrek.meting.verhouding * 100) / 100,
          opname: omtrek.opname,
          bijzonderheden: {
            per_zijde: Object.fromEntries(
              Object.entries(omtrek.perZijde).map(([z, v]: [string, any]) => [
                z,
                Math.round(v.verhouding * 100) / 100,
              ])
            ),
          },
        };
      };

      for (const k of teMeten) {
        try {
          const rust = await meetKandidaat(k, k.vak);
          if (!rust) {
            uitkomsten.push({
              soort: k.soort,
              element: k.pad,
              naam: k.naam || null,
              fout:
                'Geen tekening gevonden die van de achtergrond afwijkt. Mogelijk laadt het pictogram niet, of staat het buiten het gemeten vak.',
            });
            continue;
          }

          // En dezelfde meting terwijl de muis erop staat.
          //
          // 1.4.11 gaat ook over de toestanden van een element. Een knop die op zweven van
          // kleur wisselt heeft dan een tweede weergave die de eis net zo goed moet halen,
          // en die wordt in de ruststand niet gezien. De muis gaat na afloop weer weg,
          // anders staat het volgende element te meten terwijl dit nog oplicht.
          let zweef: Awaited<ReturnType<typeof meetKandidaat>> = null;
          let zweefVak: { x: number; y: number; w: number; h: number } | null = null;
          try {
            await page.hover(`[data-shift2-nt="${k.merk}"]`);
            await new Promise((r) => setTimeout(r, 300));
            // Het vak opnieuw uitlezen: zweven kan een element laten groeien of verschuiven.
            zweefVak = await page.evaluate((merk: number) => {
              const el = document.querySelector(`[data-shift2-nt="${merk}"]`);
              if (!el) return null;
              const r = el.getBoundingClientRect();
              // Bij de opname zijn de coordinaten paginabreed, bij getBoundingClientRect
              // gelden ze binnen het venster. page.hover scrollt het element in beeld, dus
              // vanaf dat moment lopen die twee uiteen -- en fotografeer je een leeg stuk
              // achtergrond dat toevallig 1:1 oplevert.
              return {
                x: r.left + window.scrollX,
                y: r.top + window.scrollY,
                w: r.width,
                h: r.height,
              };
            }, k.merk);
            if (zweefVak && zweefVak.w >= 4 && zweefVak.h >= 4) {
              zweef = await meetKandidaat(k, zweefVak);
            }
          } catch {
            // Niet kunnen zweven mag de ruststandmeting niet ongeldig maken.
          } finally {
            await page.mouse.move(0, 0).catch(() => {});
            await new Promise((r) => setTimeout(r, 150));
          }

          // Het strengste van de twee toestanden bepaalt het oordeel: allebei moeten ze de
          // eis halen, dus de slechtste telt.
          const slechtste = zweef ? Math.min(rust.slechtste, zweef.slechtste) : rust.slechtste;
          const bijzonderheden = {
            rust: { verhouding: `${rust.slechtste}:1`, ...rust.bijzonderheden },
            zweef: zweef
              ? { verhouding: `${zweef.slechtste}:1`, ...zweef.bijzonderheden }
              : 'niet gemeten',
          };
          const ruweOpname =
            zweef && zweef.slechtste < rust.slechtste ? zweef.opname : rust.opname;

          // Elk gemeten element krijgt zijn opnamen, in beide toestanden, ongeacht de
          // uitkomst.
          //
          // Hier stond eerst "alleen bij een tekort". Dat was een regel die ik zelf had
          // bedacht om de map niet vol te laten lopen, en dat is de verkeerde afweging: bij
          // "voldoet" viel er dan niets na te kijken, en juist een uitkomst van 21:1 of
          // 6,69:1 is er een die iemand moet kunnen wantrouwen. Een meting zonder beeld is
          // een bewering, of ze nu goed of slecht uitpakt.
          // De opnamen worden hier nog niet weggeschreven; dat gebeurt na afloop, per
          // groep. Zes sociale pictogrammen met dezelfde uitkomst leverden anders zes
          // identieke paren op, en dan zoekt niemand meer wat er te zien valt.
          uitkomsten.push({
            soort: k.soort,
            element: k.pad,
            naam: k.naam || null,
            slechtste: `${slechtste}:1`,
            ...bijzonderheden,
            voldoet: slechtste >= 3,
            _rust: rust.opname,
            _zweef: zweef?.opname ?? null,
          });
        } catch (err) {
          uitkomsten.push({
            soort: k.soort,
            element: k.pad,
            naam: k.naam || null,
            fout: String(err).slice(0, 160),
          });
        }
      }

      // Eén voorbeeldpaar per groep, niet per element.
      //
      // Een pagina met zes sociale pictogrammen die alle zes hetzelfde doen, leverde twaalf
      // opnamen op waarvan er tien niets toevoegden. Groeperen op wat er gemeten is én wat
      // eruit kwam: verschilt er iets, dan is het een eigen groep en krijgt het een eigen
      // voorbeeld. Het aantal gaat mee, zodat de zes niet wegvallen achter het ene beeld.
      //
      // Beide toestanden blijven staan waar ze verschillen. Alleen de zweefopname bewaren
      // klinkt zuiniger, maar een grijs pictogram zegt op zichzelf niets — het gaat om het
      // verschil met de ruststand ernaast.
      const groepen = new Map<string, { voorbeeld: any; aantal: number }>();
      for (const u of uitkomsten) {
        if (u.fout) continue;
        const sleutel = `${u.soort}|${u.element}|${u.slechtste}|${
          typeof u.zweef === 'string' ? u.zweef : u.zweef?.verhouding
        }|${u.rust?.verhouding}`;
        const bestaand = groepen.get(sleutel);
        if (bestaand) bestaand.aantal++;
        else groepen.set(sleutel, { voorbeeld: u, aantal: 1 });
      }
      for (const { voorbeeld, aantal } of Array.from(groepen.values())) {
        const wat = voorbeeld.naam || voorbeeld.element;
        const erbij = aantal > 1 ? ` (${aantal} elementen, zelfde uitkomst)` : '';
        const bewaar = (base64: string, achtervoegsel: string, bijschrift: string) => {
          try {
            const dir = ensureOutputDir();
            const bestand = path.join(
              dir,
              `${timestamp()}-${slugifyUrl(page.url())}-${voorbeeld.soort}-${beelden.length}-${achtervoegsel}.png`
            );
            fs.writeFileSync(bestand, Buffer.from(base64, 'base64'));
            beelden.push({ pad: bestand, bijschrift });
          } catch {
            /* een mislukte opname mag de meting niet ongeldig maken */
          }
        };
        const zweefVerhouding =
          typeof voorbeeld.zweef === 'string' ? null : voorbeeld.zweef?.verhouding;
        const verschilt = zweefVerhouding && zweefVerhouding !== voorbeeld.rust?.verhouding;
        bewaar(
          voorbeeld._rust,
          'rust',
          `${wat} — ${verschilt ? 'rust' : 'rust en muis erop gelijk'}, ${voorbeeld.rust?.verhouding}${erbij}`
        );
        if (verschilt && voorbeeld._zweef) {
          bewaar(voorbeeld._zweef, 'zweef', `${wat} — muis erop, ${zweefVerhouding}${erbij}`);
        }
        voorbeeld.aantalGelijk = aantal;
      }
      // De ruwe opnamen horen niet in de uitvoer; die zijn nu bestanden.
      for (const u of uitkomsten) {
        delete u._rust;
        delete u._zweef;
      }

      const tekort = uitkomsten.filter((u) => u.voldoet === false);
      const mislukt = uitkomsten.filter((u) => u.fout);

      const opname = await legOpnameVast(page, page.url(), 'nietteksten');

      // Het volledige overzicht als bestand erbij.
      //
      // In het logboek passen alleen tellingen, en daarmee bereikt de uitkomst per element
      // de kaart niet: daar stond wel "gemeten: 7" maar nergens wat er per element uitkwam,
      // en dus ook niet dat er in twee toestanden is gemeten. Dit bestand hangt als artefact
      // aan de meting, net als de opgehaalde tekst bij get-html.
      let overzicht: string | null = null;
      try {
        const dir = ensureOutputDir();
        overzicht = path.join(
          dir,
          `${timestamp()}-${slugifyUrl(page.url())}-nietteksten.txt`
        );
        const regels = [
          `Niet-tekstuele onderdelen op ${page.url()}`,
          `Weergave: ${klik ? `na klikken op ${klik}` : 'standaardweergave'}`,
          `Bekeken: ${kandidaten.bekeken} · niet zichtbaar: ${kandidaten.onzichtbaar} · overgeslagen: ${kandidaten.overgeslagen.length} · valt eronder: ${kandidaten.gevonden.length}`,
          '',
          'GEMETEN (rust / met de muis erop, eis 3:1)',
          ...uitkomsten.map((u) =>
            u.fout
              ? `  ${u.soort} ${u.naam || u.element} — niet gelukt: ${u.fout}`
              : `  ${u.voldoet ? 'ok    ' : 'TEKORT'} ${u.soort} ${u.naam || u.element} — rust ${
                  u.rust?.verhouding ?? '?'
                }, zweef ${
                  typeof u.zweef === 'string' ? u.zweef : (u.zweef?.verhouding ?? '?')
                }`
          ),
          '',
          'OVERGESLAGEN, MET REDEN',
          ...kandidaten.overgeslagen.map(
            (o: any) => `  ${o.naam || o.pad} — ${o.reden}`
          ),
        ];
        fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
      } catch {
        overzicht = null;
      }

      const strengerOpZweven = uitkomsten.filter(
        (u) => u.zweef && typeof u.zweef !== 'string' && u.zweef.verhouding !== u.rust?.verhouding
      ).length;
      const slechtsteElement = uitkomsten
        .filter((u) => !u.fout)
        .sort((a, b) => parseFloat(a.slechtste) - parseFloat(b.slechtste))[0];

      legVast({
        commando: 'get-nietteksten',
        argumenten: { ...(klik ? { klik } : {}), ...(flags.max ? { max: String(max) } : {}) },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: opname,
        schermafdrukken: beelden,
        artefact: overzicht,
        criteria: ['1.4.11'],
        uitkomst: {
          bedienbareElementenBekeken: kandidaten.bekeken,
          nietZichtbaar: kandidaten.onzichtbaar,
          onderDitCriterium: kandidaten.gevonden.length,
          gemeten: uitkomsten.length,
          // Zonder deze twee is op de kaart niet te zien dat er in twee toestanden is
          // gemeten, en dat is nu net het punt van die tweede meting.
          ookMetDeMuisErop: uitkomsten.filter((u) => u.zweef && typeof u.zweef !== 'string')
            .length,
          andersOpZweven: strengerOpZweven,
          slechtste: slechtsteElement
            ? `${slechtsteElement.naam || slechtsteElement.element} ${slechtsteElement.slechtste}`
            : null,
          onvoldoende: tekort.length,
          nietGelukt: mislukt.length,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        omgeleid,
        bedienbare_elementen_bekeken: kandidaten.bekeken,
        niet_zichtbaar_of_te_klein: kandidaten.onzichtbaar,
        valt_onder_1_4_11: kandidaten.gevonden.length,
        gemeten: uitkomsten.length,
        niet_gemeten: kandidaten.gevonden.length - uitkomsten.length,
        onvoldoende: tekort.length,
        metingen: uitkomsten,
        overgeslagen_met_reden: kandidaten.overgeslagen,
        schermafdruk: opname,
        let_op:
          'Dit zoekt bedieningselementen zonder zichtbare tekst en de randen van invoervelden, en meet ze in ruststand en met de muis erop -- 1.4.11 geldt ook voor de toestanden van een element. Het strengste van de twee bepaalt het oordeel. Focusindicatoren zitten er NOG NIET in. Loop de overgeslagen lijst na: staat daar iets tussen dat wel betekenis draagt, dan meet je dat alsnog met get-pixelcontrast.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Meet de omtrek van een element op de werkelijke beeldpunten.
 *
 * Losgemaakt uit get-pixelcontrast omdat de sweep over alle niet-tekstuele onderdelen
 * (get-nietteksten) hetzelfde meetwerk per element nodig heeft. Één plek waar bepaald
 * wordt wat een rand is, hoe diep het bandje gaat en welke hoeken buiten beschouwing
 * blijven — anders drijven twee metingen van hetzelfde uit elkaar.
 */
async function meetOmtrek(
  page: any,
  vak: { x: number; y: number; w: number; h: number; ronding: number },
  marge: number
) {
    // Het gebied plus een marge, zodat er aan beide zijden van de rand beeld is.
    const clip = {
      x: Math.max(0, Math.floor(vak.x - marge)),
      y: Math.max(0, Math.floor(vak.y - marge)),
      width: Math.ceil(vak.w + marge * 2),
      height: Math.ceil(vak.h + marge * 2),
    };
    const opname = (await page.screenshot({ clip, encoding: 'base64' })) as string;

    // De browser leest alleen de beeldpunten uit; het rekenen gebeurt in Node.
    //
    // Dat is niet uit smaak. esbuild wikkelt elke benoemde functie in een `__name`-aanroep
    // die binnen page.evaluate niet bestaat, dus hulpfuncties zijn hier onmogelijk. Deze
    // lus staat daarom in losse indexrekening, zonder één functiedefinitie.
    // De hoeken blijven buiten de meting.
    //
    // Bij een afgeronde hoek kijkt een rechte omtrek langs het element heen: binnen én
    // buiten wijzen dan naar de achtergrond, en er komt 1:1 uit op een element dat verder
    // prima contrasteert. De ronding staat in de opmaak, dus die overslaan is geen
    // aanname maar rekenen met wat de pagina zelf opgeeft.
    const hoek = Math.min(
      Math.ceil(vak.ronding) + 2,
      Math.floor(Math.min(vak.w, vak.h) * 0.3)
    );

    const banden = await page.evaluate(
      async (base64: string, marge: number, hoek: number) => {
        const beeld = new Image();
        await new Promise<void>((klaar, mis) => {
          beeld.onload = () => klaar();
          beeld.onerror = () => mis(new Error('opname niet te laden'));
          beeld.src = `data:image/png;base64,${base64}`;
        });
        const doek = document.createElement('canvas');
        doek.width = beeld.width;
        doek.height = beeld.height;
        const ctx = doek.getContext('2d')!;
        ctx.drawImage(beeld, 0, 0);
        const d = ctx.getImageData(0, 0, doek.width, doek.height).data;
        const b = doek.width;
        const h = doek.height;
        // Een bandje aftasten, geen los punt.
        //
        // Een besturingselement is te onderscheiden door zijn randlijn óf door zijn
        // vulling, dus beide moeten meetellen: keur je op de randpixel alleen, dan valt
        // een element af op de ene plek waar de achtergrond net zo licht is als een grijs
        // lijntje, terwijl het witte vlak erbinnen het veld daar prima aanwijst.
        //
        // En het moet een band zijn, geen twee vaste punten. Een rand van één beeldpunt
        // ligt bij een element dat op een halve beeldpunt begint niet waar je hem
        // verwacht, en dan mis je hem volledig. Dat gebeurde bij de onderrand van de
        // zoekbalk in hoogcontrast: de meting las daar wit tegen lichtgrijs en meldde
        // 1,86:1, terwijl op de uitsnede een zwarte lijn staat die het gewoon goed doet.
        //
        // Vandaar: de eerste vijf beeldpunten binnen de rand, en daarvan telt de beste.
        const bandDiepte = 5;
        const buitenrand = Math.max(0, marge - 3);
        const paren: {
          zijde: string;
          band: number[][];
          buiten: number[];
          /** Plaats in de opname, zodat de slechtste plek terug te vinden is. */
          px: number;
          py: number;
        }[] = [];

        // Elke twee beeldpunten; elke pixel is overdaad.
        for (let x = marge + hoek; x < b - marge - hoek; x += 2) {
          const bovenBand: number[][] = [];
          const onderBand: number[][] = [];
          for (let k = 0; k < bandDiepte; k++) {
            const bo = ((marge + k) * b + x) * 4;
            bovenBand.push([d[bo], d[bo + 1], d[bo + 2]]);
            const on = ((h - 1 - marge - k) * b + x) * 4;
            onderBand.push([d[on], d[on + 1], d[on + 2]]);
          }
          let j = (buitenrand * b + x) * 4;
          paren.push({
            zijde: 'boven',
            band: bovenBand,
            buiten: [d[j], d[j + 1], d[j + 2]],
            px: x,
            py: marge,
          });
          j = ((h - 1 - buitenrand) * b + x) * 4;
          paren.push({
            zijde: 'onder',
            band: onderBand,
            buiten: [d[j], d[j + 1], d[j + 2]],
            px: x,
            py: h - 1 - marge,
          });
        }
        for (let y = marge + hoek; y < h - marge - hoek; y += 2) {
          const linksBand: number[][] = [];
          const rechtsBand: number[][] = [];
          for (let k = 0; k < bandDiepte; k++) {
            const li = (y * b + marge + k) * 4;
            linksBand.push([d[li], d[li + 1], d[li + 2]]);
            const re = (y * b + (b - 1 - marge - k)) * 4;
            rechtsBand.push([d[re], d[re + 1], d[re + 2]]);
          }
          let j = (y * b + buitenrand) * 4;
          paren.push({
            zijde: 'links',
            band: linksBand,
            buiten: [d[j], d[j + 1], d[j + 2]],
            px: marge,
            py: y,
          });
          j = (y * b + (b - 1 - buitenrand)) * 4;
          paren.push({
            zijde: 'rechts',
            band: rechtsBand,
            buiten: [d[j], d[j + 1], d[j + 2]],
            px: b - 1 - marge,
            py: y,
          });
        }
        // Een dwarsdoorsnede door het midden van de bovenrand, van buiten naar binnen.
        // Hiermee is te controleren of de gemeten punten werkelijk aan weerszijden van
        // de rand liggen; zonder die controle meet je twee keer de achtergrond en komt
        // er een verhouding van 1:1 uit die niets betekent.
        const profiel: string[] = [];
        const midden = Math.floor(b / 2);
        for (let y = 0; y < Math.min(h, marge * 2 + 4); y++) {
          const i = (y * b + midden) * 4;
          profiel.push(
            '#' +
              [d[i], d[i + 1], d[i + 2]]
                .map((v) => v.toString(16).padStart(2, '0'))
                .join('')
          );
        }
        return { paren, opnameBreedte: b, opnameHoogte: h, profiel, dpr: window.devicePixelRatio };
      },
      opname,
      marge,
      hoek
    );

    const helder = (rgb: number[]) => {
      const k = rgb.map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
    };

    const tegen = (a: number[], b: number[]) => {
      const l1 = helder(a);
      const l2 = helder(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    /** De beste verhouding binnen het bandje, en op welke diepte die zat. */
    const besteInBand = (band: number[][], buiten: number[]) => {
      let beste = 0;
      let diepte = 0;
      for (let k = 0; k < band.length; k++) {
        const v = tegen(band[k], buiten);
        if (v > beste) {
          beste = v;
          diepte = k;
        }
      }
      return { verhouding: beste, diepte, kleur: band[diepte] ?? [0, 0, 0] };
    };

    let meting = {
      verhouding: Infinity,
      diepte: 0,
      binnen: [0, 0, 0],
      buiten: [0, 0, 0],
      zijde: '',
      px: 0,
      py: 0,
    };
    for (const p of banden.paren) {
      const b = besteInBand(p.band, p.buiten);
      if (b.verhouding < meting.verhouding) {
        meting = {
          verhouding: b.verhouding,
          diepte: b.diepte,
          binnen: b.kleur,
          buiten: p.buiten,
          zijde: p.zijde,
          px: p.px,
          py: p.py,
        };
      }
    }
    if (!banden.paren.length) throw new Error('Geen randpunten gevonden om te meten');

    // Ook per zijde, want het totaal zegt niet welke begrenzing tekortkomt. Een veld dat
    // aan drie zijden ruim voldoet en aan één zijde wegvalt tegen een foto is een ander
    // gesprek dan een veld dat overal wegvalt.
    const perZijde: Record<
      string,
      { verhouding: number; diepte: number; px: number; py: number; buiten: number[]; binnen: number[] }
    > = {};
    for (const p of banden.paren) {
      const b = besteInBand(p.band, p.buiten);
      const huidig = perZijde[p.zijde];
      if (!huidig || b.verhouding < huidig.verhouding) {
        perZijde[p.zijde] = {
          verhouding: b.verhouding,
          diepte: b.diepte,
          px: p.px,
          py: p.py,
          buiten: p.buiten,
          binnen: b.kleur,
        };
      }
    }

    const hex = (rgb: number[]) =>
      '#' + rgb.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    const verhouding = Math.round(meting.verhouding * 100) / 100;

  return { clip, opname, banden, meting, perZijde, verhouding, hoek, hex, besteInBand, tegen };
}

/**
 * Contrast op de werkelijke beeldpunten, langs de rand van een element.
 *
 * Voor de gevallen waar stijlwaarden niets opleveren: een wit zoekveld op een foto, een
 * icoon op een verloop, een half doorzichtige laag. `getComputedStyle` geeft daar geen
 * bruikbare achtergrondkleur — vaak `rgba(0,0,0,0)` — en rekenen met die waarden levert
 * ten onrechte "voldoet" op. De 1.4.3-regel beschrijft dat al bij shift2.nl.
 *
 * Geen extra bibliotheek nodig. Puppeteer maakt een opname van het gebied, die gaat als
 * data-URL terug de pagina in, en daar leest een canvas de beeldpunten uit. Een data-URL
 * geldt niet als andere herkomst, dus dat mag — bij de foto zelf zou het canvas
 * besmet raken en weigeren.
 *
 * Getoetst wordt het SLECHTSTE punt langs de rand, niet het gemiddelde: één lichte plek
 * in een foto is genoeg om een witte begrenzing te laten wegvallen, en juist daar gaat
 * het om.
 */
async function getPixelContrast(url: string, flags: Flags) {
  const doel = requireFlag(flags, 'selector');
  const marge = parseInt(flags.marge || '6', 10);
  const breedte = flags.breedte ? parseInt(flags.breedte, 10) : null;
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      // Eerst de breedte, dan pas klikken: het instellen van de breedte laadt de pagina
      // opnieuw, en dat zou een schakelaar die alleen in het geheugen van de pagina staat
      // weer uitzetten.
      if (breedte) {
        await page.setViewport({ width: breedte, height: 1024, deviceScaleFactor: 1 });
        await page.reload({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      }

      // Schakelen vóór het meten.
      //
      // Heeft de site een hoogcontrastknop die zelf voldoet, dan wordt de standaardweergave
      // niet meer inhoudelijk op contrast getoetst en gaat het om de weergave ná het
      // aanzetten. Zonder deze vlag meet dit commando altijd de verkeerde weergave.
      // Zie de testvolgorde in Shift2_Regels_SC_1_4_3.md.
      if (klik) {
        const woorden = klik.startsWith('tekst:') ? klik.slice(6) : null;
        const gelukt = await page.evaluate(
          (zoek: string | null, sel: string) => {
            const el = zoek
              ? Array.from(
                  document.querySelectorAll('button, a, [role="button"], summary')
                ).find((k) =>
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

      const vak = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        const rondingen = [
          st.borderTopLeftRadius,
          st.borderTopRightRadius,
          st.borderBottomLeftRadius,
          st.borderBottomRightRadius,
        ].map((v) => parseFloat(v) || 0);
        return {
          x: r.left + window.scrollX,
          y: r.top + window.scrollY,
          w: r.width,
          h: r.height,
          ronding: Math.max(...rondingen),
        };
      }, doel);
      if (!vak) throw new Error(`Element niet gevonden: ${doel}`);
      if (vak.w < 2 || vak.h < 2) throw new Error('Element is te klein om een rand te meten');

      const omtrek = await meetOmtrek(page, vak, marge);
      const { clip, opname, banden, meting, perZijde, verhouding, hoek, hex } = omtrek;

      const dir = ensureOutputDir();
      const bestand = path.join(
        dir,
        `${timestamp()}-${slugifyUrl(page.url())}-pixelrand.png`
      );
      fs.writeFileSync(bestand, Buffer.from(opname, 'base64'));

      // En een uitsnede rond elke zijde die tekortkomt.
      //
      // Een afkeuring op 1,03:1 is niet te controleren op een opname van 800 beeldpunten
      // breed: daar is de plek waar het wegvalt één streepje. Uitgeklapt op acht keer is het
      // te zien, en dat is wat de onderzoeker nodig heeft om te bevestigen dat het klopt.
      // Per zijde, want een balk die aan één zijde wegvalt tegen een foto is een ander
      // gesprek dan een balk die overal wegvalt — en dat moet allebei te zien zijn.
      const uitsneden: Record<string, string> = {};
      const zoom = 20;
      try {
        const vp = page.viewport();
        await page.setViewport({
          width: breedte || vp?.width || 1280,
          height: vp?.height || 1024,
          deviceScaleFactor: 8,
        });
        await new Promise((r) => setTimeout(r, 400));
        for (const [zijde, punt] of Object.entries(perZijde)) {
          if (punt.verhouding >= 3) continue;
          const detailBestand = bestand.replace(/\.png$/, `-detail-${zijde}.png`);
          const detail = (await page.screenshot({
            clip: {
              x: Math.max(0, clip.x + punt.px - zoom),
              y: Math.max(0, clip.y + punt.py - zoom),
              width: zoom * 2,
              height: zoom * 2,
            },
            encoding: 'base64',
          })) as string;
          fs.writeFileSync(detailBestand, Buffer.from(detail, 'base64'));
          uitsneden[zijde] = detailBestand;
        }
      } catch {
        // Een mislukte uitsnede mag de meting niet ongeldig maken.
      }

      legVast({
        commando: 'get-pixelcontrast',
        argumenten: {
          selector: doel,
          ...(breedte ? { breedte: String(breedte) } : {}),
          ...(klik ? { klik } : {}),
        },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        artefact: bestand,
        schermafdruk: bestand,
        criteria: ['1.4.11'],
        uitkomst: {
          slechtsteVerhouding: verhouding,
          zijde: meting.zijde,
          binnen: hex(meting.binnen),
          diepte: meting.diepte,
          buiten: hex(meting.buiten),
          perZijde: Object.fromEntries(
            Object.entries(perZijde).map(([z, v]) => [z, Math.round(v.verhouding * 100) / 100])
          ),
          voldoet: verhouding >= 3,
        },
      });

      const rond = (v: number) => Math.round(v * 100) / 100;
      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        selector: doel,
        breedte: breedte ? `${breedte}px` : '(standaard)',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        slechtste_punt: {
          zijde: meting.zijde,
          buiten_het_element: hex(meting.buiten),
          binnen_het_element: `${hex(meting.binnen)} (${meting.diepte} beeldpunt${
            meting.diepte === 1 ? '' : 'en'
          } naar binnen)`,
          contrast: `${verhouding}:1`,
          plek_op_de_pagina: `${clip.x + meting.px}, ${clip.y + meting.py}`,
        },
        slechtste_per_zijde: Object.fromEntries(
          Object.entries(perZijde).map(([z, v]) => [
            z,
            `${rond(v.verhouding)}:1 — ${hex(v.binnen)} op ${v.diepte} naar binnen, tegen ${hex(v.buiten)}`,
          ])
        ),
        eis: '3:1 (1.4.11)',
        voldoet: verhouding >= 3,
        uitlijning: {
          vak: `${Math.round(vak.w)}x${Math.round(vak.h)}`,
          opname: `${banden.opnameBreedte}x${banden.opnameHoogte}`,
          hoekronding: `${vak.ronding}px — ${hoek}px per zijde overgeslagen`,
          gemeten_punten: banden.paren.length,
          beeldpuntverhouding: banden.dpr,
          dwarsdoorsnede_bovenrand: banden.profiel,
        },
        schermafdruk: bestand,
        uitsneden_per_zijde_onder_de_eis: uitsneden,
        let_op:
          'Getoetst is het slechtste punt langs de omtrek, niet het gemiddelde: één lichte plek in de achtergrond laat een begrenzing wegvallen, en daar gaat het om. Per plek wordt een bandje van vijf beeldpunten naar binnen afgetast en telt de beste daarvan, want een element mag zich onderscheiden door zijn randlijn of door zijn vulling en een rand van één beeldpunt ligt zelden precies waar je hem verwacht. Leg altijd de uitsnede ernaast voordat je afkeurt.',
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
    case 'koppel-logboek':
      return koppelLogboek(requirePositional(positional, 0, 'projectId'), flags);
    case 'get-checks':
      return getChecks(requirePositional(positional, 0, 'projectId'));
    case 'save-sample-checks':
      return saveSampleChecks(
        requirePositional(positional, 0, 'sampleId'),
        requirePositional(positional, 1, 'bestand'),
        flags,
      );
    case 'get-sample-checks':
      return getSampleChecks(requirePositional(positional, 0, 'sampleId'), flags);
    case 'get-dekking':
      return getDekking(requirePositional(positional, 0, 'projectId'), flags);
    case 'set-check-akkoord':
      return setCheckAkkoord(
        requirePositional(positional, 0, 'sampleId'),
        requirePositional(positional, 1, 'criteriumCode'),
        flags,
      );
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
    case 'get-toetsenbordval':
      return getToetsenbordval(requirePositional(positional, 0, 'url'), flags);
    case 'get-nietteksten':
      return getNietTeksten(requirePositional(positional, 0, 'url'), flags);
    case 'get-pixelcontrast':
      return getPixelContrast(requirePositional(positional, 0, 'url'), flags);
    case 'capture-sample-evidence':
      return captureSampleEvidence(
        requirePositional(positional, 0, 'projectId'),
        requirePositional(positional, 1, 'sampleId'),
        flags,
      );
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
        `  capture-sample-evidence <projectId> <sampleId> [--full] [--keep-cookie-banner]  # legt DOM + volledige screenshot vast; maakt geen bevinding\n` +
        `  run-tests <url> [--verbose] [--only-found] [--with-browser]  # crawler-tests; --with-browser voegt contrast-test toe\n` +
        `  test-samples <projectId> [--with-browser=false]  # crawler op alle sample-items van project; opslag in DB\n` +
        `  save-sample-checks <sampleId> <bestand.json> [--bron=workflow|gesprek|handmatig]  # dekking per criterium wegschrijven\n` +
        `  get-sample-checks <sampleId> [--full]            # hoeveel criteria beoordeeld, wat staat nog open\n` +
        `  get-dekking <projectId> [--full]                 # dekkingscontrole: waar is niet gekeken, welke goedkeuring is niet onderbouwd\n` +
        `  set-check-akkoord <sampleId> <code> --akkoord=akkoord|afgewezen|voorgesteld\n`
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err?.message || err);
  process.exit(1);
});
