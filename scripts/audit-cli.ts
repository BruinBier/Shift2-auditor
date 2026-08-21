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
 *   tsx scripts/audit-cli.ts get-beweging <url> [--seconden=5] [--vanaf=3] [--klik=...]
 *   tsx scripts/audit-cli.ts get-flitsen <url> [--seconden=10] [--klik=...]
 *   tsx scripts/audit-cli.ts get-videosporen <url|video-url> [--max=5] [--klik=...]
 *   tsx scripts/audit-cli.ts get-links <url> [--scope=pagina|main] [--klik=...]
 *   tsx scripts/audit-cli.ts get-labelinnaam <url> [--scope=pagina|main] [--klik=...]
 *   tsx scripts/audit-cli.ts get-consistentie <projectId|url> [--max=12]
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
import { metingUitLogregel, vormVanMeting, opLeesvolgorde } from '../lib/verantwoording';

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
        stap: `De pagina opgehaald in een echte browser, zodat de JavaScript van de site heeft gedraaid: ${
          useFull ? 'de hele pagina inclusief header en footer, want dit is de homepage' : 'alleen de main-content, want dit is geen homepage'
        }. Dit is de pagina waarop alle oordelen hieronder rusten.`,
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
        // Een opname van de hele pagina is algemeen bewijs en komt onder elk criterium.
        // Een opname van één element is dat niet: die hoort bij het criterium waarvoor je
        // hem maakt, en zonder --voor is niet vast te stellen welk dat was. Zonder deze
        // vlag stond een uitsnede van het logo als bewijs onder 2.1.4.
        ...(flags.voor && flags.voor !== 'true'
          ? { criteria: flags.voor.split(',').map((c) => c.trim()).filter(Boolean) }
          : {}),
        argumenten: {
          ...(fullPage ? { 'full-page': 'true' } : {}),
          ...(selector ? { selector } : {}),
          ...(breedte ? { breedte: String(breedte) } : {}),
          ...(klik ? { klik } : {}),
          ...(flags.voor && flags.voor !== 'true' ? { voor: flags.voor } : {}),
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
        // Dit commando schakelt niets aan; het meet de pagina zoals hij komt. Zonder dit
        // veld zet de kaart er "weergave niet vastgelegd" bij, in oranje — een waarschuwing
        // voor een twijfel die hier niet bestaat.
        weergave: 'standaardweergave',
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
        // Dit commando schakelt niets aan; het meet de pagina zoals hij komt. Zonder dit
        // veld zet de kaart er "weergave niet vastgelegd" bij, in oranje — een waarschuwing
        // voor een twijfel die hier niet bestaat.
        weergave: 'standaardweergave',
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
    // Dezelfde vertaling als de meetknop op de kaart gebruikt, uit lib/verantwoording.ts.
    // Zou elk van de twee zelf bepalen welke velden meegaan, dan ziet dezelfde meting er
    // anders uit al naar gelang wie hem startte.
    const meting = metingUitLogregel(r);
    // Een schermafdruk van de hele pagina is algemeen bewijs: daar rust elk oordeel op.
    // Een schermafdruk met --selector is dat niet -- dat is een foto van één element,
    // genomen voor één criterium. Die onder alle criteria hangen levert onzin op: onder
    // 2.1.4 (sneltoetsen) stond een uitsnede van het logo.
    const gerichteOpname = r.commando === 'get-screenshot' && !!r.argumenten?.selector;
    if (!r.criteria.length && ALGEMEEN.has(r.commando) && !gerichteOpname) {
      if (!algemeenPerSample.has(sample.id)) algemeenPerSample.set(sample.id, new Map());
      algemeenPerSample.get(sample.id)!.set(r.commando, meting);
      continue;
    }
    if (!r.criteria.length) continue;

    // Waaraan je ziet of twee metingen dezelfde meting zijn, staat in lib/verantwoording.ts:
    // ook de meetknop op de kaart moet weten wanneer hij een regel vervangt in plaats van
    // toevoegt.
    const vorm = vormVanMeting(r.commando, r.argumenten ?? {});

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
        .map((g) => g.meting);
      // Van overzicht naar detail, volgens dezelfde regel als de meetknop op de kaart.
      const verantwoording = opLeesvolgorde([...algemeen, ...gericht]);
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
 * Loopt de ingesloten videospelers op een pagina af en leest per speler de parameter die de
 * sneltoetsen van één teken uitzet.
 *
 * Dit is de hoofdmeting voor SC 2.1.4. Een sneltoets van één teken zit op een gemeentesite
 * vrijwel nooit in de eigen JavaScript maar komt mee met een ingesloten speler: bij YouTube
 * pauzeert `k`, dempt `m`, springen `j` en `l` tien seconden. Die werken zodra de focus ergens
 * ín de speler staat -- ook op de volumeknop -- en dus gaat de uitweg "alleen actief bij focus"
 * niet op.
 *
 * Dat is te lezen, niet te meten: `disablekb=1` bij YouTube en `keyboard=0` bij Vimeo zetten de
 * sneltoetsen uit. Toetsen indrukken (`get-sneltoetsen`) is daarnaast de uitzondering, alleen
 * met een concrete aanleiding. Zie `wcag-regels/Shift2_Regels_SC_2_1_4.md`.
 *
 * De titel komt uit de video zelf en niet uit het `title`-attribuut van het iframe: veel CMS'en
 * zetten daar "YouTube video player" neer en dan heten alle video's op de site hetzelfde. Voor
 * YouTube wordt daarvoor de watchpagina geopend, dezelfde bron als bij 1.2.2. Voor Vimeo is nog
 * niet vastgelegd waar de titel vandaan komt; die blijft dus leeg, met de reden erbij.
 *
 * Ook plaatshouders tellen: staat de video achter een cookiescherm, dan is er geen iframe maar
 * wel een `data-src` of `data-video-id` met het adres erin. Zonder die controle levert een
 * pagina met een video ten onrechte "geen speler" op.
 */
async function getVideos(url: string, flags: Flags) {
  const alleenMain = flags.scope === 'main';
  // Een latere formulierstap bestaat niet als los adres: wie stap 2 rechtstreeks opvraagt,
  // komt terug op stap 1. Met --doorloop=<n> worden n stappen doorlopen -- velden gevuld met
  // herkenbaar testmateriaal, dan op "volgende" -- zodat de meting op de echte stap landt.
  // De verzendknop wordt nooit aangeraakt; zie de weigering hieronder.
  const doorloop = parseInt(flags.doorloop && flags.doorloop !== 'true' ? flags.doorloop : '0', 10);
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      const doorlopen: any[] = [];
      for (let stap = 0; stap < doorloop; stap++) {
        const gedaan = await page.evaluate(() => {
          // Geen benoemde hulpfuncties hierbinnen: esbuild hangt daar __name aan, en dat
          // bestaat niet in de browser waar deze functie draait.
          const ingevuld: string[] = [];
          for (const el of Array.from(document.querySelectorAll('input, textarea, select'))) {
            const e = el as HTMLInputElement;
            if (e.type === 'hidden' || e.disabled) continue;
            if (!(e.offsetWidth || e.offsetHeight || e.getClientRects().length)) continue;
            const soort = (e.type || e.tagName).toLowerCase();
            if (soort === 'radio' || soort === 'checkbox') {
              if (!e.checked) e.click();
            } else if (e.tagName.toLowerCase() === 'select') {
              const s = el as unknown as HTMLSelectElement;
              if (s.options.length > 1) s.selectedIndex = 1;
            } else if (soort === 'email') {
              e.value = 'toegankelijkheidsonderzoek@example.org';
            } else if (soort === 'tel') {
              e.value = '0612345678';
            } else if (soort === 'date') {
              e.value = '2026-01-01';
            } else if (soort === 'number') {
              e.value = '1';
            } else {
              // Kijk naar het label: een zin in een veld voor voorletters wordt afgekeurd, en
              // dan blijft het formulier op dezelfde stap staan zonder dat dat opvalt.
              const bij = e.id ? document.querySelector('label[for="' + e.id + '"]') : null;
              const wat = ((bij ? bij.textContent : '') + ' ' + (e.getAttribute('placeholder') || '')).toLowerCase();
              if (/voorletter|initial/.test(wat)) e.value = 'A.';
              else if (/postcode/.test(wat)) e.value = '1234AB';
              else if (/huisnummer|nummer/.test(wat)) e.value = '1';
              else if (/achternaam|naam/.test(wat)) e.value = 'Toegankelijkheidstest';
              else if (/plaats|woonplaats|straat/.test(wat)) e.value = 'Teststraat';
              else if (e.tagName.toLowerCase() === 'textarea')
                e.value = 'Testinvoer voor een toegankelijkheidsonderzoek. Niet verzenden.';
              else e.value = 'Testinvoer';
            }
            e.dispatchEvent(new Event('input', { bubbles: true }));
            e.dispatchEvent(new Event('change', { bubbles: true }));
            ingevuld.push(`${e.name || e.id || soort}`);
          }
          const teksten = Array.from(document.querySelectorAll('button, input[type="submit"]'))
            .filter((b) => {
              const e = b as HTMLElement;
              return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
            })
            .map((b) => ((b as HTMLInputElement).value || b.textContent || '').replace(/\s+/g, ' ').trim());
          return {
            ingevuld,
            knoppen: teksten,
            // "Controleren" is bij de SIMform-generator de knop naar het overzicht. Die hoort
            // erbij; verzenden gebeurt pas op het overzicht zelf en wordt hieronder geweigerd.
            volgendeTekst: teksten.find((t) => /volgende|verder|doorgaan|controleren/i.test(t)) || null,
          };
        });

        if (!gedaan.volgendeTekst) {
          doorlopen.push({
            stap: stap + 1,
            gestopt: 'geen volgende-knop gevonden',
            veldenIngevuld: gedaan.ingevuld.length,
            knoppen: gedaan.knoppen,
          });
          break;
        }
        // Harde weigering: een knop die verstuurt wordt niet ingedrukt, ook niet als hij
        // toevallig "volgende" in zijn tekst heeft.
        if (/verzend|verstuur|bevestig|afrond|indienen/i.test(gedaan.volgendeTekst)) {
          doorlopen.push({ stap: stap + 1, gestopt: `weigert te klikken op "${gedaan.volgendeTekst}"` });
          break;
        }

        const voorAdres = page.url();
        await page.evaluate(() => {
          const doel = Array.from(document.querySelectorAll('button, input[type="submit"]'))
            .filter((b) => {
              const e = b as HTMLElement;
              return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
            })
            .find((b) =>
              /volgende|verder|doorgaan|controleren/i.test(
                ((b as HTMLInputElement).value || b.textContent || '').replace(/\s+/g, ' ').trim()
              )
            );
          (doel as HTMLElement | undefined)?.click();
        });
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
        doorlopen.push({
          stap: stap + 1,
          geklikt: gedaan.volgendeTekst,
          veldenIngevuld: gedaan.ingevuld.length,
          velden: gedaan.ingevuld,
          van: voorAdres,
          naar: page.url(),
          titel: await page.title(),
        });
      }

      const gevonden = await page.evaluate((mainOnly: boolean) => {
        // Niet elke pagina heeft een <main>: de formulierstappen van de generator bijvoorbeeld
        // niet. Val dan terug op de hele pagina en meld dat, in plaats van niets te meten --
        // een lege uitkomst is hier niet te onderscheiden van "geen video".
        const main = mainOnly ? document.querySelector('main') : null;
        const geenMain = mainOnly && !main;
        const wortel = (main || document.body) as HTMLElement;
        // Geen hulpfunctie met een naam hierbinnen: esbuild hangt daar __name aan, en dat
        // bestaat niet in de browser waar deze functie wordt uitgevoerd.
        const spelers = Array.from(wortel.querySelectorAll('iframe'))
          .map((f) => f.getAttribute('src') || '')
          .filter((s) => /youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com/i.test(s));
        // Een video achter een cookiescherm heeft geen iframe maar wel het adres in een attribuut.
        const plaatshouders: string[] = [];
        for (const el of Array.from(wortel.querySelectorAll('[data-src], [data-url], [data-video-id], [data-youtube-id]'))) {
          const waarde =
            el.getAttribute('data-src') ||
            el.getAttribute('data-url') ||
            el.getAttribute('data-video-id') ||
            el.getAttribute('data-youtube-id') ||
            '';
          if (/youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com/i.test(waarde) || /^[\w-]{11}$/.test(waarde)) {
            plaatshouders.push(waarde);
          }
        }
        // Een geblokkeerd videovak: er staat een video, maar het adres staat nergens in de
        // HTML. Op valkenswaard.nl is dat een div met "videoContainer ... blocked" en een
        // toestemmingsscherm erin; het iframe wordt pas na toestemming ingevoegd. Zonder deze
        // herkenning levert zo'n pagina "0 video's" op terwijl er een video staat.
        const kandidaten = Array.from(
          wortel.querySelectorAll(
            '[class*="ideoContainer"], [class*="video-container"], [class*="video-embed"], [class*="ideoEmbed"]'
          )
        );
        const geblokkeerd = kandidaten
          .filter((el) => {
            const klasse = el.getAttribute('class') || '';
            return (
              /blocked|geblokkeerd/i.test(klasse) ||
              !!el.querySelector('[class*="onsent"], [class*="ookie"]') ||
              /video van een extern/i.test(el.textContent || '')
            );
          })
          // De consent-div zit vaak zelf ook in de lijst; alleen de buitenste telt.
          .filter((el, _i, lijst) => !lijst.some((a) => a !== el && a.contains(el)))
          .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120));

        return {
          spelers,
          plaatshouders,
          geblokkeerd,
          geenMain,
          eigenVideos: wortel.querySelectorAll('video').length,
          iframesTotaal: wortel.querySelectorAll('iframe').length,
        };
      }, alleenMain);

      const videoNummer = (src: string) => {
        const embed = src.match(/(?:embed|v|video)\/([\w-]{6,})/);
        if (embed) return embed[1];
        const query = src.match(/[?&]v=([\w-]{6,})/);
        if (query) return query[1];
        const kort = src.match(/youtu\.be\/([\w-]{6,})/);
        return kort ? kort[1] : null;
      };

      /** De titel zoals hij in de video zelf staat, uit ytInitialPlayerResponse op de watchpagina. */
      const youtubeTitel = async (id: string): Promise<string | null> => {
        try {
          const tab = await session.browser.newPage();
          try {
            await tab.goto(`https://www.youtube.com/watch?v=${id}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            return await tab.evaluate(() => {
              const w = window as any;
              const uit = w.ytInitialPlayerResponse?.videoDetails?.title;
              if (uit) return uit as string;
              const m = document.documentElement.innerHTML.match(/"videoDetails":\{[^}]*?"title":"(.*?)"/);
              return m ? m[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : null;
            });
          } finally {
            await tab.close();
          }
        } catch {
          return null;
        }
      };

      const adressen = [...gevonden.spelers, ...gevonden.plaatshouders];
      const videos: any[] = [];
      for (const src of adressen) {
        const youtube = /youtube\.com|youtube-nocookie\.com|youtu\.be/i.test(src) || /^[\w-]{11}$/.test(src);
        const parameter = youtube ? 'disablekb=1' : 'keyboard=0';
        const uitgezet = src.includes(parameter);
        const id = videoNummer(src) || (/^[\w-]{11}$/.test(src) ? src : null);
        videos.push({
          platform: youtube ? 'YouTube' : 'Vimeo',
          titel: youtube && id ? await youtubeTitel(id) : null,
          titelbron: youtube ? 'watchpagina' : 'nog niet vastgelegd voor Vimeo -- noem de video bij het nummer',
          videoNummer: id,
          adres: src,
          parameter,
          parameterAanwezig: uitgezet,
          oordeel: uitgezet ? 'in orde' : 'sneltoetsen van een teken staan aan -> afkeuring',
          plaatshouder: gevonden.plaatshouders.includes(src),
        });
      }

      const opname = await legOpnameVast(page, page.url(), 'videos');
      const afkeuringen = videos.filter((v) => !v.parameterAanwezig).length;
      const geblokkeerd = gevonden.geblokkeerd.length;
      // Een geblokkeerd vak maakt de uitkomst onbeslist: er staat een video, maar het adres is
      // niet te lezen. Dan is "0 video's" onwaar en hoort het criterium op niet_te_bepalen.
      const beslist = geblokkeerd === 0;

      // De stap in de woorden van de auditor, opgebouwd uit wat er werkelijk geteld is.
      const stapZin = (() => {
        const geklikt = doorlopen.filter((d) => d.geklikt).length;
        const heen = geklikt
          ? `${geklikt === 1 ? 'Eén formulierstap' : `${geklikt} formulierstappen`} doorlopen om op deze pagina te komen; de velden zijn met testmateriaal gevuld en er is niet verzonden. `
          : '';
        const waar = gevonden.geenMain
          ? 'de hele pagina (er is geen main)'
          : alleenMain
          ? 'de main-content'
          : 'de hele pagina';
        if (geblokkeerd) {
          return `${heen}Gekeken of er video's op ${waar} staan: ${geblokkeerd} videovak achter een toestemmingsscherm. Het adres staat niet in de code, dus niet vast te stellen of de sneltoetsen uitstaan.`;
        }
        if (!videos.length) {
          return `${heen}Gekeken of er video's op ${waar} staan: geen ingesloten YouTube- of Vimeo-speler en geen geblokkeerd videovak. Er is dus geen insluitcode om te lezen.`;
        }
        const per = videos
          .map(
            (v, i) =>
              `video ${i + 1} (${v.platform}${v.titel ? `, "${v.titel}"` : ''}): ${v.parameter} ${v.parameterAanwezig ? 'aanwezig' : 'ontbreekt'}`
          )
          .join('; ');
        const staanAan = afkeuringen === 1 ? 'Bij 1 video staan de sneltoetsen van een teken aan.' : `Bij ${afkeuringen} video's staan de sneltoetsen van een teken aan.`;
        return `${heen}Gekeken of er video's op ${waar} staan: ${videos.length === 1 ? '1 video' : `${videos.length} video's`} gevonden. Per video de insluitcode gelezen — ${per}. ${afkeuringen ? staanAan : 'Bij alle video\'s staan de sneltoetsen uit.'}`;
      })();

      legVast({
        commando: 'get-videos',
        stap: stapZin,
        argumenten: { ...(alleenMain ? { scope: 'main' } : {}), ...(doorloop ? { doorloop: String(doorloop) } : {}) },
        url: gevraagdeUrl,
        // Na een doorloop is de gemeten pagina een andere dan de geopende; het logboek moet
        // laten zien waar de meting werkelijk landde.
        eindUrl: doorloop ? page.url() : eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: 'standaardweergave',
        schermafdruk: opname,
        criteria: ['2.1.4'],
        uitkomst: {
          ...(doorloop ? { doorlopenStappen: doorlopen.length } : {}),
          gebied: gevonden.geenMain ? 'hele pagina (geen <main>)' : alleenMain ? 'main-content' : 'hele pagina',
          videos: videos.length,
          inOrde: videos.length - afkeuringen,
          afkeuringen,
          geblokkeerdeVideoplaatsen: geblokkeerd,
          eigenVideoElementen: gevonden.eigenVideos,
          beslist,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gebied: gevonden.geenMain
          ? 'hele pagina (er is geen <main> op deze pagina)'
          : alleenMain
          ? 'main-content'
          : 'hele pagina',
        gemeten_op: page.url(),
        doorlopen: doorloop ? doorlopen : undefined,
        aantal_videos: videos.length,
        videos: videos.length ? videos : 'geen leesbare YouTube- of Vimeo-speler',
        geblokkeerde_videoplaatsen: geblokkeerd,
        geblokkeerd_gevonden: geblokkeerd ? gevonden.geblokkeerd : undefined,
        eigen_video_elementen: gevonden.eigenVideos,
        iframes_totaal: gevonden.iframesTotaal,
        beslist,
        let_op: !beslist
          ? `Er ${geblokkeerd === 1 ? 'staat 1 videovak' : `staan ${geblokkeerd} videovakken`} achter een toestemmingsscherm. Het adres staat dan niet in de HTML, dus dit is GEEN "0 video's": accepteer de cookies eenmalig in de audit-sessie-Chrome (npm run chrome:debug) en meet opnieuw. Lukt dat niet, dan is 2.1.4 hier niet_te_bepalen.`
          : session.mode === 'cdp'
          ? 'Gemeten in de audit-sessie. Geen geblokkeerde videovakken, dus dit aantal is het aantal.'
          : 'Gedraaid ZONDER auditsessie. Er zijn geen geblokkeerde videovakken gevonden, maar een site kan een video ook op een andere manier achterhouden. Meet bij twijfel opnieuw met npm run chrome:debug.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Drukt losse toetsen in en kijkt of er iets gebeurt.
 *
 * SC 2.1.4 gaat over sneltoetsen die uit één teken bestaan: een letter, een cijfer of een
 * leesteken zonder Ctrl of Alt. Wie met spraak invoert of een motorische beperking heeft,
 * activeert die per ongeluk. Uit de HTML is dat niet te zien -- een attribuut als
 * `data-rsshortcut="play"` zegt dát er een sneltoets is, niet wélke -- maar in een browser
 * is het gewoon te meten: druk de toets in en kijk of de pagina verandert.
 *
 * De focus gaat eerst naar de body. Staat de focus in een invoerveld, dan typ je gewoon
 * letters en meet je niets.
 *
 * Na elke toets wordt de pagina vergeleken met de toestand ervoor: aantal elementen,
 * lengte van de tekst, welk element focus heeft, of er geluid speelt, en of er een
 * dialoogvenster bij is gekomen. Verandert er iets, dan deed die toets iets.
 *
 * Met `--in=<css>` wordt eerst een element binnen die selector gefocust. Dat beantwoordt de
 * tweede vraag van 2.1.4: werkt de sneltoets overal, of alleen wanneer dat onderdeel focus
 * heeft? Alleen-bij-focus is namelijk toegestaan.
 */
async function getSneltoetsen(url: string, flags: Flags) {
  const toetsen = (flags.toetsen && flags.toetsen !== 'true' ? flags.toetsen : 'abcdefghijklmnopqrstuvwxyz0123456789').split('');
  const binnen = flags.in && flags.in !== 'true' ? flags.in : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      const meetPunt = async () =>
        page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          const media = Array.from(document.querySelectorAll('audio, video')) as HTMLMediaElement[];
          return {
            elementen: document.querySelectorAll('*').length,
            tekst: (document.body.innerText || '').length,
            focus: el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') : '(geen)',
            media: media.length,
            speelt: media.some((m) => !m.paused),
            dialogen: document.querySelectorAll('[role="dialog"], [aria-modal="true"]').length,
            adres: location.href,
          };
        });

      const naarBeginpunt = async () => {
        if (binnen) {
          await page.evaluate((sel: string) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            el?.focus();
          }, binnen);
        } else {
          await page.evaluate(() => {
            (document.activeElement as HTMLElement | null)?.blur();
            document.body.setAttribute('tabindex', '-1');
            document.body.focus();
          });
        }
      };

      await naarBeginpunt();
      const startAdres = page.url();
      const reageerde: { toets: string; verschil: string[] }[] = [];

      for (const toets of toetsen) {
        const voor = await meetPunt();
        await page.keyboard.press(toets as any);
        await new Promise((r) => setTimeout(r, 350));
        const na = await meetPunt();

        const verschil: string[] = [];
        if (na.adres !== voor.adres) verschil.push(`ging naar ${na.adres}`);
        if (na.elementen !== voor.elementen) verschil.push(`${na.elementen - voor.elementen} elementen erbij`);
        if (Math.abs(na.tekst - voor.tekst) > 2) verschil.push(`tekst ${na.tekst - voor.tekst} tekens langer`);
        if (na.focus !== voor.focus) verschil.push(`focus naar ${na.focus}`);
        if (na.speelt && !voor.speelt) verschil.push('geluid begon te spelen');
        if (na.media !== voor.media) verschil.push(`${na.media - voor.media} mediaspelers erbij`);
        if (na.dialogen !== voor.dialogen) verschil.push(`${na.dialogen - voor.dialogen} dialoogvensters erbij`);

        if (verschil.length) reageerde.push({ toets, verschil });

        // Terug naar de uitgangstoestand, anders meet de volgende toets iets anders.
        if (na.adres !== startAdres) {
          await page.goto(startAdres, { waitUntil: 'networkidle2' });
        } else if (verschil.length) {
          await page.keyboard.press('Escape');
          await new Promise((r) => setTimeout(r, 250));
        }
        await naarBeginpunt();
      }

      const opname = await legOpnameVast(page, page.url(), 'sneltoetsen');

      legVast({
        commando: 'get-sneltoetsen',
        argumenten: {
          ...(flags.toetsen ? { toetsen: toetsen.join('') } : {}),
          ...(binnen ? { in: binnen } : {}),
        },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: 'standaardweergave',
        schermafdruk: opname,
        criteria: ['2.1.4'],
        uitkomst: {
          getest: toetsen.length,
          focusOp: binnen ?? 'de pagina zelf',
          reagerendeToetsen: reageerde.length,
          toetsen: reageerde.map((r) => r.toets).join('') || null,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        focus_op: binnen ?? 'de pagina zelf (body)',
        toetsen_getest: toetsen.length,
        toetsen_die_iets_deden: reageerde.length ? reageerde : 'geen',
        let_op:
          'Een toets die iets doet is pas een 2.1.4-afkeuring als hij niet uit te zetten of te herdefinieren is en ook werkt wanneer het onderdeel geen focus heeft. Draai daarom ook met --in=<css> op het onderdeel zelf: reageert de toets daar wel en op de pagina niet, dan is dat toegestaan.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
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
  // De hele pagina is de norm, niet de main-content.
  //
  // Een val in de header of de footer is net zo goed een val: wie daar vast komt te zitten
  // komt nooit bij de inhoud. Beperken tot de main hoort bij het rapporteren, niet bij het
  // meten — en het liet "Terug naar boven" onderaan buiten beeld. Met --scope=main kan het
  // nog steeds, maar dan omdat je het wilt.
  const heelDePagina = flags.scope !== 'main';
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

      // Het startpunt expliciet zetten, in plaats van het te laten gebeuren.
      //
      // `blur()` haalt de focus weg maar verzet het startpunt voor Tab niet: de browser
      // onthoudt waar je was en gaat daarvandaan verder. Daardoor begon de achteruit-ronde
      // halverwege de header en de typ-ronde bij de suggestielijst, en werd telkens maar een
      // stuk van de pagina afgelopen. Body focusbaar maken met tabindex="-1" zet het
      // startpunt wél terug naar het begin van het document.
      //
      // Bij achteruit moet je juist onderaan beginnen, anders ben je met de eerste
      // Shift+Tab het document al uit. En is er getypt, dan blijft de focus staan waar het
      // typen hem liet: dat is het hele punt van die ronde — kom je uit die widget weg.
      let beginpunt: string;
      if (flags['typ-in']) {
        beginpunt = `in ${flags['typ-in']}, waar het typen de focus liet`;
      } else if (achteruit) {
        beginpunt = 'onderaan het document';
        await page.evaluate(() => {
          const alle = Array.from(
            document.querySelectorAll<HTMLElement>('[data-shift2-tab]')
          );
          alle[alle.length - 1]?.focus();
        });
      } else {
        beginpunt = 'bovenaan het document';
        await page.evaluate(() => {
          (document.activeElement as HTMLElement | null)?.blur();
          document.body.setAttribute('tabindex', '-1');
          document.body.focus();
        });
      }

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

      // Alleen beeld als er iets te zien is.
      //
      // De regel "elke meting laat een schermafdruk achter" is hier te breed toegepast: vier
      // rondes leverden vier identieke paginaopnamen op waar niets aan af te lezen viel. Het
      // bewijs bij dit criterium is de tabvolgorde, en die staat hieronder als bestand. Bij
      // een val is beeld wél zinnig — dan wil je zien waar de focus blijft hangen.
      const opname = val
        ? await legOpnameVast(page, page.url(), 'toetsenbordval')
        : null;

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
            `Begonnen: ${beginpunt}, richting ${achteruit ? 'achteruit (Shift+Tab)' : 'vooruit (Tab)'}`,
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
          ...(heelDePagina ? {} : { scope: 'main' }),
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
          beginpunt,
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
        beginpunt,
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

/**
 * Vergelijkt twee opnamen van dezelfde pagina en zegt hoeveel er veranderd is en wáár.
 *
 * Dit is het enige zintuig dat niets hoeft te weten van de techniek erachter. Een
 * carrousel die met JavaScript schuift, een CSS-animatie, een canvas dat zichzelf
 * tekent, een filmpje in een kader van een ander domein -- die vier zijn van binnenuit
 * de pagina niet allemaal te zien (in een kader van een ander domein kun je niet
 * kijken), op het beeld alle vier.
 *
 * Het rekenen gebeurt op een verkleinde versie. Dat is niet om tijd te winnen maar om
 * ruis weg te halen: op ware grootte verschillen twee opnamen van dezelfde stilstaande
 * pagina al op duizenden beeldpunten door de randafwerking van letters. De uitkomst
 * wordt in vakjes geteld en niet in beeldpunten, om dezelfde reden: één afwijkend
 * beeldpunt is geen beweging, een blok van twaalf bij twaalf wel.
 *
 * De hulpfuncties staan bewust niet binnen `page.evaluate`: esbuild wikkelt elke
 * benoemde functie in een `__name`-aanroep die in de pagina niet bestaat. Zie de
 * uitleg bij `meetOmtrek`.
 */
async function vergelijkOpnamen(page: any, voor: string, na: string, drempel = 24) {
  return page.evaluate(
    async (voorB64: string, naB64: string, grens: number) => {
      const a = new Image();
      await new Promise<void>((klaar, mis) => {
        a.onload = () => klaar();
        a.onerror = () => mis(new Error('eerste opname niet te laden'));
        a.src = `data:image/png;base64,${voorB64}`;
      });
      const b = new Image();
      await new Promise<void>((klaar, mis) => {
        b.onload = () => klaar();
        b.onerror = () => mis(new Error('tweede opname niet te laden'));
        b.src = `data:image/png;base64,${naB64}`;
      });

      // Werd de pagina langer of korter, dan vergelijken we het stuk dat beide opnamen
      // hebben. Het hoogteverschil zelf gaat mee naar buiten: dat is een verandering,
      // en meestal een die tijdens het laden nog binnenkwam.
      const volBreedte = Math.min(a.width, b.width);
      const volHoogte = Math.min(a.height, b.height);
      const schaal = Math.min(1, 700 / volBreedte);
      const w = Math.max(1, Math.round(volBreedte * schaal));
      const h = Math.max(1, Math.round(volHoogte * schaal));

      const doekA = document.createElement('canvas');
      doekA.width = w;
      doekA.height = h;
      const ctxA = doekA.getContext('2d', { willReadFrequently: true })!;
      ctxA.drawImage(a, 0, 0, volBreedte, volHoogte, 0, 0, w, h);
      const doekB = document.createElement('canvas');
      doekB.width = w;
      doekB.height = h;
      const ctxB = doekB.getContext('2d', { willReadFrequently: true })!;
      ctxB.drawImage(b, 0, 0, volBreedte, volHoogte, 0, 0, w, h);

      const da = ctxA.getImageData(0, 0, w, h).data;
      const db = ctxB.getImageData(0, 0, w, h).data;

      const cel = 12;
      const kolommen = Math.ceil(w / cel);
      const rijen = Math.ceil(h / cel);
      const telling = new Int32Array(kolommen * rijen);
      let veranderdeBeeldpunten = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (
            Math.abs(da[i] - db[i]) > grens ||
            Math.abs(da[i + 1] - db[i + 1]) > grens ||
            Math.abs(da[i + 2] - db[i + 2]) > grens
          ) {
            veranderdeBeeldpunten++;
            telling[Math.floor(y / cel) * kolommen + Math.floor(x / cel)]++;
          }
        }
      }

      const raak = new Uint8Array(kolommen * rijen);
      let raakAantal = 0;
      for (let i = 0; i < telling.length; i++) {
        if (telling[i] >= 6) {
          raak[i] = 1;
          raakAantal++;
        }
      }

      // Aangrenzende vakjes worden één gebied. Anders levert één schuivende carrousel
      // een lijst van tachtig losse vakjes op en is er niets aan te zien.
      const gezien = new Uint8Array(kolommen * rijen);
      const gebieden: { x: number; y: number; w: number; h: number; vakjes: number }[] = [];
      for (let i = 0; i < raak.length; i++) {
        if (!raak[i] || gezien[i]) continue;
        const stapel = [i];
        gezien[i] = 1;
        let minK = kolommen;
        let maxK = -1;
        let minR = rijen;
        let maxR = -1;
        let aantal = 0;
        while (stapel.length) {
          const p = stapel.pop()!;
          const k = p % kolommen;
          const r = Math.floor(p / kolommen);
          aantal++;
          if (k < minK) minK = k;
          if (k > maxK) maxK = k;
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          for (let dk = -1; dk <= 1; dk++) {
            for (let dr = -1; dr <= 1; dr++) {
              const nk = k + dk;
              const nr = r + dr;
              if (nk < 0 || nr < 0 || nk >= kolommen || nr >= rijen) continue;
              const q = nr * kolommen + nk;
              if (raak[q] && !gezien[q]) {
                gezien[q] = 1;
                stapel.push(q);
              }
            }
          }
        }
        gebieden.push({
          x: Math.round((minK * cel) / schaal),
          y: Math.round((minR * cel) / schaal),
          w: Math.round(((maxK - minK + 1) * cel) / schaal),
          h: Math.round(((maxR - minR + 1) * cel) / schaal),
          vakjes: aantal,
        });
      }
      gebieden.sort((p, q) => q.vakjes - p.vakjes);

      return {
        hoogteVerschil: b.height - a.height,
        vergelekenTot: volHoogte,
        veranderdeBeeldpunten,
        veranderdeVakjes: raakAantal,
        totaalVakjes: kolommen * rijen,
        percentage: Math.round((raakAantal / (kolommen * rijen)) * 1000) / 10,
        gebieden: gebieden.slice(0, 8),
      };
    },
    voor,
    na,
    drempel
  );
}

/**
 * Snijdt één gebied uit een opname, zodat het veranderde stuk op ware grootte te zien is.
 *
 * Een percentage veranderde vakjes is geen bewijs; twee uitsnedes van dezelfde plek,
 * vóór en na, zijn dat wel. Wie ernaar kijkt ziet meteen of de carrousel is
 * doorgeschoven of dat er alleen een lui geladen foto is ingevallen.
 */
async function snijUit(
  page: any,
  b64: string,
  vak: { x: number; y: number; w: number; h: number },
  maxBreedte = 900
): Promise<string | null> {
  try {
    return await page.evaluate(
      async (bron: string, v: { x: number; y: number; w: number; h: number }, max: number) => {
        const beeld = new Image();
        await new Promise<void>((klaar, mis) => {
          beeld.onload = () => klaar();
          beeld.onerror = () => mis(new Error('opname niet te laden'));
          beeld.src = `data:image/png;base64,${bron}`;
        });
        const lucht = 16;
        const x = Math.max(0, v.x - lucht);
        const y = Math.max(0, v.y - lucht);
        const w = Math.min(beeld.width - x, v.w + lucht * 2);
        const h = Math.min(beeld.height - y, v.h + lucht * 2);
        if (w < 2 || h < 2) return null;
        const schaal = Math.min(1, max / w);
        const doek = document.createElement('canvas');
        doek.width = Math.round(w * schaal);
        doek.height = Math.round(h * schaal);
        const ctx = doek.getContext('2d')!;
        ctx.drawImage(beeld, x, y, w, h, 0, 0, doek.width, doek.height);
        return doek.toDataURL('image/png').split(',')[1];
      },
      b64,
      vak,
      maxBreedte
    );
  } catch {
    return null;
  }
}

/**
 * Kijkt of er op de pagina iets uit zichzelf beweegt, knippert, schuift of zich bijwerkt.
 *
 * Dit is de hoofdmeting voor SC 2.2.2. Dat criterium stelt een eis aan bewegende,
 * knipperende of automatisch bijwerkende informatie die langer dan vijf seconden duurt:
 * die moet te pauzeren, te stoppen of te verbergen zijn. Beweegt er niets uit zichzelf,
 * dan is de eis leeg en staat het criterium op `niet_aanwezig`.
 *
 * Uit opgehaalde HTML is dat niet te zien, en dat is precies het gevaar: "er is geen
 * carrousel" en "ik heb niet gekeken of er een carrousel is" leveren dezelfde zin op.
 * Een slider die om de vier seconden doorschuift, een teller die zichzelf bijwerkt, een
 * CSS-animatie die eeuwig doorloopt, een filmpje in een kader van YouTube -- niets
 * daarvan staat als zodanig in de code. Wat er wél is: tijd laten verstrijken en kijken
 * of er iets verandert.
 *
 * Vier zintuigen, want geen enkele ziet alles:
 *
 * | Zintuig | Ziet | Ziet niet |
 * |---|---|---|
 * | beeldvergelijking | alles wat zichtbaar verandert, ook in een kader van een ander domein en op een canvas | verandering buiten de opname |
 * | bijwerkingen in de code | tekst en elementen die veranderen, ook als het beeld nauwelijks verschilt | een canvas, een video, een ander domein |
 * | verplaatsingen | elementen die opschuiven of van maat veranderen | verandering zonder verplaatsing (kleur, tekst) |
 * | opgaaf van de pagina zelf | CSS-animaties, `<marquee>`, spelende media | wat met JavaScript wordt getekend |
 *
 * De tijdlijn volgt de grens van vijf seconden uit het criterium zelf:
 *
 *   binnenkomst ---- 3 s bezinken ---- venster van 5 s ---- einde
 *
 * De eerste drie seconden tellen apart, want daarin komt van alles binnen dat niets met
 * beweging te maken heeft: luie afbeeldingen, lettertypen die inschuiven, en het scrollen
 * dat de paginabrede opname zelf veroorzaakt. Het venster dáárna is het venster dat telt.
 * Verandert er in vijf seconden die drie seconden na het laden beginnen nog steeds iets,
 * dan duurt het langer dan vijf seconden en is de eis van 2.2.2 niet leeg.
 *
 * Wat dit commando NIET doet: oordelen. Het stelt vast dát er iets beweegt en waar; of
 * dat uit zichzelf begon, of het naast andere inhoud staat, en of de pauzeermogelijkheid
 * deugt, blijft werk van de auditor. Zie `wcag-regels/Shift2_Regels_SC_2_2_2.md`.
 */
async function getBeweging(url: string, flags: Flags) {
  // Vijf seconden is geen instelling maar de grens uit het criterium; korter mag niet.
  const venster = Math.max(5, parseInt(flags.seconden || '5', 10));
  const bezinken = Math.max(0, parseInt(flags.vanaf || '3', 10));
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      // Klikken vóór het meten, bijvoorbeeld om een cookiemelding weg te halen die de
      // halve pagina afdekt. Wat eronder zit is dan pas te zien.
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

      // Wat de pagina zelf opgeeft: animaties, media, en de knoppen waarmee je iets zou
      // kunnen stoppen. Meteen ook elk zichtbaar element merken, zodat een verplaatsing
      // straks aan een element te koppelen is en niet aan een plek in de lijst -- die
      // lijst verschuift zodra er ergens iets bijkomt.
      const opgaaf = await page.evaluate(() => {
        const w = window as any;
        let nr = 0;
        for (const el of Array.from(document.querySelectorAll('body *'))) {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          const s = getComputedStyle(el);
          if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0)
            continue;
          nr++;
          el.setAttribute('data-beweging-nr', String(nr));
        }

        const animaties: any[] = [];
        for (const el of Array.from(document.querySelectorAll('[data-beweging-nr]'))) {
          const s = getComputedStyle(el);
          if (!s.animationName || s.animationName === 'none') continue;
          const duren = s.animationDuration.split(',').map((d) => parseFloat(d) || 0);
          const herhalingen = s.animationIterationCount.split(',');
          let langste = 0;
          let eeuwig = false;
          for (let i = 0; i < duren.length; i++) {
            const keer = (herhalingen[i] || herhalingen[0] || '1').trim();
            if (keer === 'infinite') eeuwig = true;
            else langste = Math.max(langste, duren[i] * (parseFloat(keer) || 1));
          }
          animaties.push({
            element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            klasse: (el.getAttribute('class') || '').slice(0, 60) || null,
            nr: el.getAttribute('data-beweging-nr'),
            naam: s.animationName,
            duur: s.animationDuration,
            herhaling: s.animationIterationCount,
            draait: s.animationPlayState === 'running',
            langerDan5s: eeuwig || langste > 5,
          });
        }

        const media = Array.from(document.querySelectorAll('video, audio')).map((m) => {
          const v = m as HTMLMediaElement;
          return {
            element: m.tagName.toLowerCase(),
            bron: (v.currentSrc || v.getAttribute('src') || '').slice(0, 120) || null,
            autoplayAttribuut: v.hasAttribute('autoplay'),
            speeltNu: !v.paused && !v.ended,
            gedempt: v.muted || v.volume === 0,
            herhaalt: v.loop,
            bedieningZichtbaar: v.hasAttribute('controls'),
            duurSeconden: Number.isFinite(v.duration) ? Math.round(v.duration) : null,
            tijd: Math.round(v.currentTime * 100) / 100,
          };
        });

        // In een kader van een ander domein is niet te kijken; wat er wel van te lezen
        // valt is het adres, en daar staat vaak `autoplay=1` in.
        const kaders = Array.from(document.querySelectorAll('iframe'))
          .map((f) => f.getAttribute('src') || f.getAttribute('data-src') || '')
          .filter((s) => /autoplay=1|autoplay=true|auto_play=1/i.test(s))
          .map((s) => s.slice(0, 160));

        const ouderwets = Array.from(document.querySelectorAll('marquee, blink')).length;

        // Waarmee zou je het kunnen stoppen? Alleen kandidaten; of de knop werkt en of
        // hij bij de bewegende inhoud hoort, stelt de auditor vast.
        const knoppen = Array.from(
          document.querySelectorAll('button, a[href], [role="button"], input[type="button"]')
        )
          .map((k) => {
            const naam = (
              k.getAttribute('aria-label') ||
              k.textContent ||
              k.getAttribute('title') ||
              ''
            )
              .replace(/\s+/g, ' ')
              .trim();
            return { naam: naam.slice(0, 60), element: k.tagName.toLowerCase() };
          })
          .filter((k) =>
            /paus|stop|speel|afspel|play|animat|beweg|carrousel|carousel|slide|diavoorstelling/i.test(
              k.naam
            )
          )
          .slice(0, 12);

        // `prefers-reduced-motion` is geen pauzeermogelijkheid in de zin van 2.2.2, maar
        // het zegt wel of de makers aan beweging gedacht hebben. Als feit meegeven, niet
        // als oordeel. Stylesheets van een ander domein zijn niet te lezen; hoeveel dat
        // er zijn hoort erbij, anders leest "niet gevonden" als "er is niets".
        let verminderdeBeweging = false;
        let onleesbareStylesheets = 0;
        for (const blad of Array.from(document.styleSheets)) {
          try {
            for (const regel of Array.from((blad as CSSStyleSheet).cssRules)) {
              if (
                regel instanceof CSSMediaRule &&
                /prefers-reduced-motion/i.test(regel.conditionText)
              ) {
                verminderdeBeweging = true;
                break;
              }
            }
          } catch {
            onleesbareStylesheets++;
          }
        }

        // Vanaf nu bijhouden wat er in de pagina verandert. De merktekens staan er al op,
        // dus die veroorzaken zelf geen meldingen meer.
        w.__bewegingStart = performance.now();
        w.__bewegingMutaties = [];
        const kijker = new MutationObserver((meldingen) => {
          const log = w.__bewegingMutaties as any[];
          for (const m of meldingen) {
            if (log.length >= 400) return;
            if (m.type === 'attributes' && m.attributeName === 'data-beweging-nr') continue;
            const doel = (m.target.nodeType === 3 ? m.target.parentElement : m.target) as Element;
            if (!doel || !doel.tagName) continue;
            let drager: Element | null = doel;
            while (drager && !drager.getAttribute('data-beweging-nr')) drager = drager.parentElement;

            // Niet elke bijwerking is beweging.
            //
            // 2.2.2 gaat over informatie die beweegt, knippert of zichzelf bijwerkt --
            // iets dat een bezoeker merkt. Een attribuut dat omklapt zonder dat er iets
            // anders komt te staan is dat niet. Op heuvelrug.nl wisselden `name` en `type`
            // van het zoekveld zes keer in het venster, terwijl er van de 3658 vakjes op
            // het beeld geen enkele veranderde; zonder deze schifting leverde dat een
            // afkeuring op van iets wat niemand kan zien.
            //
            // Tekst en elementen die veranderen tellen wél, ook als ze alleen voor een
            // schermlezer bestaan: een gebied dat zichzelf bijwerkt is bijwerkende
            // informatie, ook als het beeld er niet van verandert. Vandaar de toets op de
            // opmaak (`display`, `visibility`) en niet op de afmeting.
            // Een raamwerk dat opnieuw tekent is geen bijwerking.
            //
            // React zet bij een hertekening dezelfde knopen opnieuw neer: tien
            // childList-meldingen op één milliseconde, allemaal op het kruimelpad, met
            // exact dezelfde tekst erin en nul veranderde beeldpunten. Dat is geen inhoud
            // die zichzelf bijwerkt, dat is hetzelfde nog eens. Vergelijken wat eruit ging
            // met wat erin kwam scheidt de twee, ongeacht waardoor de hertekening kwam.
            //
            // De naam van de knoop en zijn `src` gaan mee in de vergelijking: een
            // carrousel die een foto verwisselt zet ook "hetzelfde soort knoop" neer, maar
            // met een ander adres, en dat is wél een bijwerking.
            let zelfdeInhoud = false;
            if (m.type === 'childList') {
              let erbij = '';
              for (const n of Array.from(m.addedNodes)) {
                const e = n as Element;
                erbij += `${n.nodeName}${e.getAttribute ? e.getAttribute('src') || '' : ''}:${
                  (n.textContent || '').replace(/\s+/g, ' ').trim()
                }|`;
              }
              let eraf = '';
              for (const n of Array.from(m.removedNodes)) {
                const e = n as Element;
                eraf += `${n.nodeName}${e.getAttribute ? e.getAttribute('src') || '' : ''}:${
                  (n.textContent || '').replace(/\s+/g, ' ').trim()
                }|`;
              }
              zelfdeInhoud = erbij === eraf;
            }
            if (m.type === 'characterData') {
              zelfdeInhoud =
                (m.oldValue || '').replace(/\s+/g, ' ').trim() ===
                (m.target.textContent || '').replace(/\s+/g, ' ').trim();
            }
            if (m.type === 'attributes' && m.attributeName) {
              zelfdeInhoud = m.oldValue === doel.getAttribute(m.attributeName);
            }

            const stijl = doel.isConnected ? getComputedStyle(doel) : null;
            const zichtbaar = !!stijl && stijl.display !== 'none' && stijl.visibility !== 'hidden';
            const beeldbepalend =
              m.type !== 'attributes' ||
              [
                'class',
                'style',
                'src',
                'srcset',
                'poster',
                'hidden',
                'aria-hidden',
                'open',
                'value',
                'transform',
                'd',
                'points',
                'width',
                'height',
                'fill',
                'stroke-dashoffset',
                'stroke-dasharray',
                'offset-distance',
              ].includes(m.attributeName || '');
            log.push({
              tijd: Math.round(performance.now() - w.__bewegingStart),
              soort: m.type,
              attribuut: m.attributeName || null,
              element: doel.tagName.toLowerCase(),
              klasse: (doel.getAttribute('class') || '').slice(0, 40) || null,
              nr: drager ? drager.getAttribute('data-beweging-nr') : null,
              tekst: (doel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
              telt: zichtbaar && beeldbepalend && !zelfdeInhoud,
              // Waarom iets niet meetelt hoort erbij te staan. "10 bijwerkingen, waarvan 0
              // meetellend" zonder reden is niet na te kijken, en dan gelooft de volgende
              // lezer het getal of de meting niet.
              waarom: !zichtbaar
                ? 'element is niet zichtbaar'
                : !beeldbepalend
                ? 'attribuut zonder gevolg voor de weergave'
                : zelfdeInhoud
                ? 'zelfde inhoud opnieuw neergezet'
                : null,
            });
          }
        });
        kijker.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
          // De oude waarde erbij, anders is niet te zien of er iets veranderde of dat
          // dezelfde waarde opnieuw is gezet.
          attributeOldValue: true,
          characterDataOldValue: true,
        });
        w.__bewegingKijker = kijker;

        return {
          gemarkeerd: nr,
          animaties: animaties.slice(0, 40),
          animatiesTotaal: animaties.length,
          media,
          kadersMetAutoplay: kaders,
          ouderwets,
          knoppen,
          verminderdeBeweging,
          onleesbareStylesheets,
        };
      });

      // De plaats en de maat van elk gemerkt element. Drie keer gemeten, zodat een
      // verplaatsing kort na het laden te onderscheiden is van een verplaatsing daarna.
      // Eerst naar boven scrollen: bij een element dat aan het scherm vastzit hangt de
      // plek op de pagina af van hoe ver er gescrold is, en een opname van de hele pagina
      // scrolt. Zonder dit meldt elke plakkende koptekst een verplaatsing.
      const meetPlekken = async (): Promise<Record<string, number[]>> =>
        page.evaluate(() => {
          window.scrollTo(0, 0);
          const uit: Record<string, number[]> = {};
          for (const el of Array.from(document.querySelectorAll('[data-beweging-nr]'))) {
            const nr = el.getAttribute('data-beweging-nr')!;
            const r = el.getBoundingClientRect();
            if (r.width * r.height < 64) continue;
            const s = getComputedStyle(el);
            if (s.position === 'fixed' || s.position === 'sticky') continue;
            uit[nr] = [
              Math.round(r.left + window.scrollX),
              Math.round(r.top + window.scrollY),
              Math.round(r.width),
              Math.round(r.height),
            ];
          }
          return uit;
        });

      // Een opname van de hele pagina, en anders van wat er in beeld staat. Mislukt ook
      // dat, dan gaat de meting door zonder beeldvergelijking -- met de reden erbij.
      const opnemen = async (): Promise<string | null> => {
        try {
          return (await page.screenshot({ fullPage: true, encoding: 'base64' })) as string;
        } catch {
          try {
            return (await page.screenshot({ encoding: 'base64' })) as string;
          } catch {
            return null;
          }
        }
      };

      // De klok van de pagina zelf, op het moment dat de opname klaar is.
      //
      // De bijwerkingen worden bijgehouden vanaf het merken, maar het beeld wordt pas
      // vergeleken vanaf de tweede opname -- en een opname van een lange pagina duurt
      // ruim een seconde. Knip je de bijwerkingen op de bedoelde drie seconden en het
      // beeld op de opname, dan meten de twee zintuigen niet hetzelfde stuk tijd. Op
      // heuvelrug.nl vielen de knoppen van ReadSpeaker daardoor in het venster dat telt,
      // terwijl ze in werkelijkheid nog bij het inladen hoorden: nul veranderde vakjes op
      // het beeld, en toch "beweegt".
      const paginaKlok = async (): Promise<number> =>
        page.evaluate(() => performance.now() - (window as any).__bewegingStart);

      // De volgorde is hier het meetinstrument.
      //
      // Een opname van de hele pagina laat de browser scrollen en het venster van maat
      // veranderen, en een raamwerk als React tekent daarop opnieuw. Meet je de plekken en
      // de klok ná de opname, dan valt dat opnieuw tekenen ín het venster dat telt: op
      // heuvelrug.nl/archeologie leverde dat tien "bijwerkingen" op precies de milliseconde
      // van de derde opname, met nul veranderde beeldpunten. Dus: het venster opent ná de
      // tweede opname en sluit vóór de derde. Wat de opname zelf losmaakt, valt erbuiten.
      const plekken1 = await meetPlekken();
      const beeld1 = await opnemen();
      const klok1 = Date.now();

      await new Promise((r) => setTimeout(r, bezinken * 1000));
      const beeld2 = await opnemen();
      const plekken2 = await meetPlekken();
      const grensBegin = await paginaKlok();
      const klok2 = Date.now();

      await new Promise((r) => setTimeout(r, venster * 1000));
      const plekken3 = await meetPlekken();
      const grensEinde = await paginaKlok();
      const beeld3 = await opnemen();
      const klok3 = Date.now();

      const naloop = await page.evaluate(() => {
        const w = window as any;
        if (w.__bewegingKijker) w.__bewegingKijker.disconnect();
        const media = Array.from(document.querySelectorAll('video, audio')).map((m) => {
          const v = m as HTMLMediaElement;
          return {
            element: m.tagName.toLowerCase(),
            speeltNu: !v.paused && !v.ended,
            tijd: Math.round(v.currentTime * 100) / 100,
          };
        });
        return { mutaties: (w.__bewegingMutaties || []) as any[], media };
      });

      // Speelt er werkelijk iets? Dat is niet aan `paused` alleen af te lezen. Loopt de
      // speeltijd door tussen begin en eind, dan speelt hij.
      const media = opgaaf.media.map((m: any, i: number) => {
        const later = naloop.media[i];
        const gelopen = later ? Math.round((later.tijd - m.tijd) * 100) / 100 : 0;
        return {
          ...m,
          tijdAanHetEind: later ? later.tijd : null,
          speeltNogSteeds: later ? later.speeltNu : false,
          gelopenSeconden: gelopen,
          speeltUitZichzelf: gelopen > 0.5 && m.autoplayAttribuut,
        };
      });

      const verplaatst = (a: Record<string, number[]>, b: Record<string, number[]>) => {
        const uit: { nr: string; van: number[]; naar: number[] }[] = [];
        for (const nr of Object.keys(a)) {
          const p = a[nr];
          const q = b[nr];
          if (!q) continue;
          if (
            Math.abs(p[0] - q[0]) > 1 ||
            Math.abs(p[1] - q[1]) > 1 ||
            Math.abs(p[2] - q[2]) > 2 ||
            Math.abs(p[3] - q[3]) > 2
          ) {
            uit.push({ nr, van: p, naar: q });
          }
        }
        return uit;
      };
      const verplaatstVroeg = verplaatst(plekken1, plekken2);
      const verplaatstLaat = verplaatst(plekken2, plekken3);

      // De namen van de elementen die verplaatsten, en alleen die. Alle namen ophalen zou
      // bij elke meting duizenden regels heen en weer sturen.
      const nrs = Array.from(
        new Set([...verplaatstVroeg, ...verplaatstLaat].map((v) => v.nr))
      ).slice(0, 40);
      const namen: Record<string, string> = nrs.length
        ? await page.evaluate((lijst: string[]) => {
            const uit: Record<string, string> = {};
            for (const nr of lijst) {
              const el = document.querySelector(`[data-beweging-nr="${nr}"]`);
              if (!el) continue;
              const klassen = (el.getAttribute('class') || '').trim();
              uit[nr] =
                el.tagName.toLowerCase() +
                (el.id ? `#${el.id}` : '') +
                (klassen ? `.${klassen.split(/\s+/).slice(0, 2).join('.')}` : '') +
                ` "${(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}"`;
            }
            return uit;
          }, nrs)
        : {};
      const metNaam = (v: { nr: string; van: number[]; naar: number[] }) => ({
        element: namen[v.nr] || `element ${v.nr}`,
        van: `${v.van[0]},${v.van[1]} ${v.van[2]}x${v.van[3]}`,
        naar: `${v.naar[0]},${v.naar[1]} ${v.naar[2]}x${v.naar[3]}`,
      });

      const mutatiesVroeg = naloop.mutaties.filter((m: any) => m.tijd < grensBegin);
      const mutatiesLaat = naloop.mutaties.filter(
        (m: any) => m.tijd >= grensBegin && m.tijd <= grensEinde
      );
      // Alleen de bijwerkingen die iets aan de weergave veranderen tellen mee in het
      // oordeel. De rest blijft wel staan in het overzicht: wat weggelaten is hoort
      // zichtbaar te zijn, anders is niet na te gaan waarom het niet meetelde.
      const mutatiesLaatTellend = mutatiesLaat.filter((m: any) => m.telt);

      let verschilVroeg: any = null;
      let verschilLaat: any = null;
      let beeldFout: string | null = null;
      if (beeld1 && beeld2 && beeld3) {
        try {
          verschilVroeg = await vergelijkOpnamen(page, beeld1, beeld2);
          verschilLaat = await vergelijkOpnamen(page, beeld2, beeld3);
        } catch (e: any) {
          beeldFout = e?.message || 'beeldvergelijking niet gelukt';
        }
      } else {
        beeldFout = 'opname niet gelukt';
      }

      // Bewijs om naar te kijken: van elk veranderd gebied de plek vóór en ná.
      const dir = ensureOutputDir();
      const stempel = timestamp();
      const naam = slugifyUrl(page.url());
      const beelden: { pad: string; bijschrift: string }[] = [];
      if (verschilLaat && beeld2 && beeld3) {
        let n = 0;
        for (const gebied of verschilLaat.gebieden.slice(0, 3)) {
          n++;
          const voor = await snijUit(page, beeld2, gebied);
          const na = await snijUit(page, beeld3, gebied);
          const paren: [string | null, string, string][] = [
            [voor, 'voor', 'bij het begin van het venster'],
            [na, 'na', `${venster} seconden later`],
          ];
          for (const [b64, kant, wanneer] of paren) {
            if (!b64) continue;
            const pad = path.join(
              dir,
              `${stempel}-${naam}-beweging-gebied${n}-${kant}.png`
            );
            fs.writeFileSync(pad, Buffer.from(b64, 'base64'));
            beelden.push({
              pad,
              bijschrift: `Gebied ${n} (${gebied.w}x${gebied.h} op ${gebied.x},${gebied.y}) — ${wanneer}`,
            });
          }
        }
      }

      const hoofdBeeld = path.join(dir, `${stempel}-${naam}-beweging.png`);
      if (beeld3) fs.writeFileSync(hoofdBeeld, Buffer.from(beeld3, 'base64'));

      const draaiendeAnimaties = opgaaf.animaties.filter((a: any) => a.draait && a.langerDan5s);
      const spelendeMedia = media.filter((m: any) => m.speeltNogSteeds || m.speeltUitZichzelf);
      const beweegtInVenster =
        (verschilLaat ? verschilLaat.veranderdeVakjes > 0 : false) ||
        mutatiesLaatTellend.length > 0 ||
        verplaatstLaat.length > 0 ||
        spelendeMedia.length > 0 ||
        draaiendeAnimaties.length > 0 ||
        opgaaf.ouderwets > 0;

      // Onbeslist, niet "nee". Een speler met `autoplay` die op pauze staat kan door het
      // beleid van de browser zijn tegengehouden -- Chrome laat geluid niet uit zichzelf
      // beginnen. Op het scherm van een bezoeker die de site vaker bezoekt kan hij wel
      // aangaan. Dat als "er beweegt niets" wegschrijven is precies de fout die dit
      // commando moet voorkomen.
      const geblokkeerdeAutoplay = media.filter(
        (m: any) => m.autoplayAttribuut && !m.speeltNogSteeds && m.gelopenSeconden <= 0.5
      );
      const beslist = geblokkeerdeAutoplay.length === 0 && !beeldFout;

      const secondenTussen = Math.round((klok3 - klok2) / 100) / 10;
      const stapZin = (() => {
        const waar = klik ? `Na klikken op ${klik} de pagina` : 'De pagina';
        const hoe = `${waar} ${Math.round((klok3 - klok1) / 1000)} seconden in een echte browser laten staan en drie keer opgenomen: bij binnenkomst, na ${bezinken} seconden en ${secondenTussen} seconden daarna.`;
        if (beeldFout) {
          return `${hoe} De beeldvergelijking lukte niet (${beeldFout}); alleen gelezen wat de pagina zelf opgeeft: ${opgaaf.animatiesTotaal} CSS-animaties en ${media.length} mediaspelers.`;
        }
        const eerst = `In de eerste ${bezinken} seconden na het laden veranderde er ${
          verschilVroeg && verschilVroeg.veranderdeVakjes
            ? `nog wel iets (${verschilVroeg.veranderdeVakjes} vakjes) — dat is de pagina die inlaadt en telt niet mee`
            : 'niets'
        }.`;
        // Wat niet meetelde hoort in de zin, niet alleen in het bestand. Anders leest
        // "geen bijwerking" als "er gebeurde niets" terwijl er wel iets gebeurde dat
        // alleen niet zichtbaar was.
        const genegeerd =
          mutatiesLaat.length - mutatiesLaatTellend.length > 0
            ? mutatiesLaat.length - mutatiesLaatTellend.length === 1
              ? ' Daarnaast was er 1 bijwerking in de code die niets aan de weergave verandert (een attribuut dat omklapt); die telt niet mee.'
              : ` Daarnaast waren er ${
                  mutatiesLaat.length - mutatiesLaatTellend.length
                } bijwerkingen in de code die niets aan de weergave veranderen (attributen die omklappen); die tellen niet mee.`
            : '';
        const deel = beweegtInVenster
          ? `In het venster van ${secondenTussen} seconden veranderde er wél iets: ${verschilLaat.veranderdeVakjes} van de ${verschilLaat.totaalVakjes} vakjes op het beeld, ${verplaatstLaat.length} elementen verplaatsten, ${mutatiesLaatTellend.length} bijwerkingen in de weergave${
              draaiendeAnimaties.length
                ? `, ${draaiendeAnimaties.length} CSS-animaties die langer dan 5 seconden doorlopen`
                : ''
            }${
              spelendeMedia.length
                ? `, ${spelendeMedia.length} mediaspeler die uit zichzelf speelt`
                : ''
            }. Het duurt dus langer dan vijf seconden.`
          : `In het venster van ${secondenTussen} seconden veranderde er niets: geen van de ${verschilLaat.totaalVakjes} vakjes op het beeld verschilde, geen enkel element verplaatste, geen bijwerking in de weergave, en geen video of audio die uit zichzelf speelt.${
              opgaaf.animatiesTotaal
                ? ` Er staan ${opgaaf.animatiesTotaal} CSS-animaties in de opmaak, alle korter dan vijf seconden of stilstaand.`
                : ' Er staan geen CSS-animaties op de pagina.'
            }`;
        return `${hoe} ${eerst} ${deel}${genegeerd}`;
      })();

      // Het overzicht als tekstbestand erbij: de losse getallen zijn later niet meer na te
      // lopen, en een schermafdruk laat niet zien wat er níet gevonden is.
      let overzicht: string | null = path.join(dir, `${stempel}-${naam}-beweging.txt`);
      try {
        const regels = [
          `BEWEGING OP DE PAGINA — ${page.url()}`,
          `Gemeten: ${new Date().toLocaleString('nl-NL')} · ${
            session.mode === 'cdp' ? 'auditsessie' : 'headless'
          }`,
          `Weergave: ${klik ? `na klikken op ${klik}` : 'standaardweergave'}`,
          `Tijdlijn: binnenkomst → ${bezinken}s bezinken → venster van ${secondenTussen}s`,
          `Het venster loopt van ${Math.round(grensBegin) / 1000}s tot ${
            Math.round(grensEinde) / 1000
          }s na binnenkomst; beeld en bijwerkingen worden op dezelfde twee momenten geknipt.`,
          '',
          'BEELDVERGELIJKING (vakjes van 12x12 op een verkleinde opname)',
          ...(beeldFout
            ? [`  niet gelukt: ${beeldFout}`]
            : [
                `  eerste ${bezinken}s: ${verschilVroeg.veranderdeVakjes}/${verschilVroeg.totaalVakjes} vakjes (${verschilVroeg.percentage}%), hoogteverschil ${verschilVroeg.hoogteVerschil}px`,
                `  venster:      ${verschilLaat.veranderdeVakjes}/${verschilLaat.totaalVakjes} vakjes (${verschilLaat.percentage}%), hoogteverschil ${verschilLaat.hoogteVerschil}px`,
                ...verschilLaat.gebieden.map(
                  (g: any, i: number) =>
                    `  gebied ${i + 1}: ${g.w}x${g.h} op ${g.x},${g.y} (${g.vakjes} vakjes)`
                ),
              ]),
          '',
          `VERPLAATSINGEN (van ${opgaaf.gemarkeerd} gemerkte elementen)`,
          `  eerste ${bezinken}s: ${verplaatstVroeg.length}`,
          `  venster:      ${verplaatstLaat.length}`,
          ...verplaatstLaat.slice(0, 15).map((v: any) => {
            const m = metNaam(v);
            return `    ${m.element} — ${m.van} → ${m.naar}`;
          }),
          '',
          'BIJWERKINGEN IN DE CODE (telt = verandert iets aan de weergave)',
          `  eerste ${bezinken}s: ${mutatiesVroeg.length}`,
          `  venster:      ${mutatiesLaat.length}, waarvan meetellend: ${mutatiesLaatTellend.length}`,
          ...mutatiesLaat
            .slice(0, 20)
            .map(
              (m: any) =>
                `    ${m.telt ? 'telt ' : 'niet '} ${m.tijd}ms ${m.soort}${
                  m.attribuut ? ` (${m.attribuut})` : ''
                } ${m.element}${m.klasse ? `.${m.klasse}` : ''} "${m.tekst}"${
                  m.waarom ? ` — ${m.waarom}` : ''
                }`
            ),
          '',
          'WAT DE PAGINA ZELF OPGEEFT',
          `  CSS-animaties: ${opgaaf.animatiesTotaal} (draaiend en langer dan 5s: ${draaiendeAnimaties.length})`,
          ...opgaaf.animaties
            .slice(0, 15)
            .map(
              (a: any) =>
                `    ${a.element}${a.klasse ? `.${a.klasse}` : ''} — ${a.naam} ${a.duur} x${
                  a.herhaling
                } ${a.draait ? 'draait' : 'staat stil'}`
            ),
          `  marquee/blink: ${opgaaf.ouderwets}`,
          `  mediaspelers: ${media.length}`,
          ...media.map(
            (m: any) =>
              `    ${m.element} autoplay=${m.autoplayAttribuut} gedempt=${m.gedempt} speelde ${m.gelopenSeconden}s door, bediening=${m.bedieningZichtbaar}`
          ),
          `  kaders met autoplay in het adres: ${opgaaf.kadersMetAutoplay.length}`,
          ...opgaaf.kadersMetAutoplay.map((k: string) => `    ${k}`),
          `  prefers-reduced-motion in de opmaak: ${opgaaf.verminderdeBeweging} (onleesbare stylesheets: ${opgaaf.onleesbareStylesheets})`,
          '',
          'MOGELIJKE PAUZEERKNOPPEN (kandidaten, niet nagelopen)',
          ...(opgaaf.knoppen.length
            ? opgaaf.knoppen.map((k: any) => `  ${k.element} "${k.naam}"`)
            : ['  geen']),
        ];
        fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
      } catch {
        overzicht = null;
      }

      legVast({
        commando: 'get-beweging',
        stap: stapZin,
        argumenten: {
          ...(klik ? { klik } : {}),
          ...(flags.seconden ? { seconden: String(venster) } : {}),
          ...(flags.vanaf ? { vanaf: String(bezinken) } : {}),
        },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: fs.existsSync(hoofdBeeld) ? hoofdBeeld : null,
        schermafdrukken: beelden,
        artefact: overzicht,
        criteria: ['2.2.2'],
        uitkomst: {
          venster: `${secondenTussen}s vanaf ${bezinken}s na laden`,
          beeldVeranderdeVakjes: verschilLaat ? verschilLaat.veranderdeVakjes : null,
          verplaatsteElementen: verplaatstLaat.length,
          bijwerkingenInDeWeergave: mutatiesLaatTellend.length,
          bijwerkingenZonderZichtbaarGevolg: mutatiesLaat.length - mutatiesLaatTellend.length,
          draaiendeAnimatiesLangerDan5s: draaiendeAnimaties.length,
          mediaDieUitZichzelfSpeelt: spelendeMedia.length,
          beweegt: beweegtInVenster,
          beslist,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        waarschuwing_omleiding: omgeleid
          ? `De server stuurde door van ${gevraagdeUrl} naar ${eindUrl}. Dit is een andere pagina dan gevraagd; beoordeel hem niet als de gevraagde.`
          : undefined,
        tijdlijn: `binnenkomst → ${bezinken}s bezinken → venster van ${secondenTussen}s`,
        beweegt: beweegtInVenster,
        beslist,
        in_het_venster: {
          beeld_veranderde_vakjes: verschilLaat ? verschilLaat.veranderdeVakjes : null,
          beeld_totaal_vakjes: verschilLaat ? verschilLaat.totaalVakjes : null,
          veranderde_gebieden: verschilLaat ? verschilLaat.gebieden : null,
          verplaatste_elementen: verplaatstLaat.slice(0, 15).map(metNaam),
          bijwerkingen_in_de_weergave: mutatiesLaatTellend.length,
          bijwerkingen_zonder_zichtbaar_gevolg: mutatiesLaat.length - mutatiesLaatTellend.length,
          bijwerkingen: mutatiesLaat.slice(0, 15),
        },
        in_de_eerste_seconden: {
          beeld_veranderde_vakjes: verschilVroeg ? verschilVroeg.veranderdeVakjes : null,
          verplaatste_elementen: verplaatstVroeg.length,
          bijwerkingen_in_de_code: mutatiesVroeg.length,
          let_op:
            'Dit venster telt NIET mee voor 2.2.2. Een pagina die inlaadt, luie afbeeldingen en het scrollen dat de opname zelf veroorzaakt zitten hier in.',
        },
        css_animaties: opgaaf.animaties,
        css_animaties_totaal: opgaaf.animatiesTotaal,
        marquee_of_blink: opgaaf.ouderwets,
        mediaspelers: media,
        kaders_met_autoplay_in_het_adres: opgaaf.kadersMetAutoplay,
        prefers_reduced_motion_in_de_opmaak: opgaaf.verminderdeBeweging,
        onleesbare_stylesheets: opgaaf.onleesbareStylesheets,
        mogelijke_pauzeerknoppen: opgaaf.knoppen,
        schermafdruk: fs.existsSync(hoofdBeeld) ? hoofdBeeld : null,
        uitsnedes: beelden,
        overzicht,
        beeldvergelijking_mislukt: beeldFout || undefined,
        let_op: !beslist
          ? `Onbeslist. ${
              geblokkeerdeAutoplay.length
                ? `Er ${
                    geblokkeerdeAutoplay.length === 1
                      ? 'staat 1 speler'
                      : `staan ${geblokkeerdeAutoplay.length} spelers`
                  } met een autoplay-attribuut die niet heeft gespeeld. Chrome houdt geluid uit zichzelf tegen, dus dit is GEEN "speelt niet": bekijk de pagina in de audit-sessie (npm run chrome:debug) en meet opnieuw. `
                : ''
            }${
              beeldFout ? `De beeldvergelijking lukte niet: ${beeldFout}. ` : ''
            }Zet 2.2.2 niet op niet_aanwezig zolang dit openstaat.`
          : beweegtInVenster
          ? 'Er verandert iets dat langer dan vijf seconden doorgaat. Kijk de uitsnedes na: begon het uit zichzelf, staat het naast andere inhoud, en is er iets om het te pauzeren, te stoppen of te verbergen? Ontbreekt dat laatste, dan is het een afkeuring van 2.2.2.'
          : 'Er beweegt niets in het venster dat telt. Zonder automatisch bewegende, knipperende of bijwerkende inhoud is de eis van 2.2.2 leeg en hoort het criterium op niet_aanwezig, niet op voldoet. Kijk de opname na voordat je dat vastlegt.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Zoekt flitsende inhoud op een pagina. De meting voor SC 2.3.1.
 *
 * Dit criterium bestaat om aanvallen te voorkomen bij mensen met fotosensitieve
 * epilepsie. De grens: niet meer dan drie flitsen per seconde, tenzij de flits klein
 * genoeg of zwak genoeg is. Een flits is een paar tegengestelde helderheidssprongen van
 * minstens 10% van de schaal, waarbij het donkerste beeld onder 0,80 blijft. Voor
 * verzadigd rood geldt een aparte, strengere toets.
 *
 * WAAROM DIT NIET MET `get-beweging` KAN. Die meting maakt drie opnamen met seconden
 * ertussen. Een flits van drie per seconde zit dáártussen: staat een knipperend element
 * in beide opnamen toevallig aan, dan meet die nul verschil en zou er "er beweegt niets"
 * onder 2.3.1 komen te staan bij een pagina die stroboscopeert. Daarom een eigen meting,
 * met beeldjes op de snelheid waarmee de browser tekent.
 *
 * Twee eigenschappen van de tekenopnemer maken hem geschikt:
 *
 *   1. Hij stuurt alleen een beeldje als de pagina opnieuw tekent. Komen er in tien
 *      seconden geen beeldjes, dan is er niets veranderd, en dan KAN er niets geflitst
 *      hebben. Dat is een sterker bewijs dan opnamen vergelijken.
 *   2. Komen er wél beeldjes, dan is per beeldje de helderheid uit te rekenen en zijn de
 *      tegengestelde sprongen te tellen -- de toets zelf.
 *
 * DIT IS EEN ZEEF, GEEN KEURING. Het beeld wordt verkleind en met JPEG samengeperst, de
 * pagina wordt in blokken van gelijke maat bekeken, en de snelheid van de beeldjes is
 * niet gegarandeerd. Daarom meldt het commando de gehaalde snelheid en weigert het een
 * uitspraak zodra die te laag is om drie flitsen per seconde te kunnen zien. Voor een
 * videobestand blijft PEAT (Trace Center) de autoriteit: dat leest het bestand beeldje
 * voor beeldje. Wij kijken naar wat het scherm doet.
 *
 * Alleen wat in beeld staat wordt opgenomen. Wat onder de vouw flitst, ziet dit niet.
 */
/**
 * Het adres waarop een video zelf te bekijken is, met de speler aan.
 *
 * Een video die op een pagina staat is daar niet te meten: hij zit in een kader van een
 * ander domein, staat achter een toestemmingsscherm, of toont een stilstaand voorblad. De
 * tekenopnemer krijgt dan niets te zien en de uitkomst is "er gebeurt niets" — precies de
 * valse gerustheid die dit gereedschap moet voorkomen.
 *
 * De uitweg is de video op zijn eigen pagina openen. Het insluitadres, niet de watchpagina:
 * daar is de speler het hele document, dus het `video`-element is gewoon te bereiken en aan
 * te zetten. Gedempt, want geluid hoort niet bij deze meting en een browser laat een
 * gedempte video wél uit zichzelf beginnen.
 */
function videoSpeeladres(
  adres: string
): { platform: string; nummer: string; speeladres: string; paginaadres: string } | null {
  const youtube =
    adres.match(
      /(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{6,})/i
    ) || adres.match(/youtu\.be\/([\w-]{6,})/i);
  if (youtube) {
    return {
      platform: 'YouTube',
      nummer: youtube[1],
      speeladres: `https://www.youtube.com/embed/${youtube[1]}?autoplay=1&mute=1&playsinline=1&rel=0`,
      paginaadres: `https://www.youtube.com/watch?v=${youtube[1]}`,
    };
  }
  const vimeo = adres.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d{6,})/i);
  if (vimeo) {
    return {
      platform: 'Vimeo',
      nummer: vimeo[1],
      speeladres: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1`,
      paginaadres: `https://vimeo.com/${vimeo[1]}`,
    };
  }
  // Een kaal videonummer van elf tekens, zoals het in een data-attribuut van een
  // plaatshouder staat.
  if (/^[\w-]{11}$/.test(adres)) {
    return {
      platform: 'YouTube',
      nummer: adres,
      speeladres: `https://www.youtube.com/embed/${adres}?autoplay=1&mute=1&playsinline=1&rel=0`,
      paginaadres: `https://www.youtube.com/watch?v=${adres}`,
    };
  }
  return null;
}

async function getFlitsen(url: string, flags: Flags) {
  const seconden = Math.max(3, parseInt(flags.seconden || '10', 10));
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  // Blokken van gelijke maat over het beeld. Zestien bij twaalf is fijn genoeg om een
  // flitsend vlak te vinden en grof genoeg om ruis van de JPEG-compressie uit te middelen.
  const KOL = 16;
  const RIJ = 12;
  const BREED = 160;
  const HOOG = 120;
  /**
   * Hoe groot een flitsend gebied moet zijn om mee te tellen.
   *
   * WCAG rekent met een kwart van een gezichtsveld van tien graden: op een scherm van
   * 1024 bij 768 is dat 21.824 beeldpunten, oftewel 2,8% van het beeld. Als aandeel van
   * het venster gerekend, want een venster is niet altijd 1024 breed. "Een kwart van het
   * scherm", zoals het vaak wordt naverteld, is veel te ruim: een klein flitsend vlakje
   * zakt ook.
   */
  const GEBIEDSGRENS = 21824 / (1024 * 768);

  // Is het gevraagde adres een video, dan gaat de meting naar de video zelf.
  const video = videoSpeeladres(url);

  const session = await getBrowser();
  try {
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(
      session,
      video ? video.speeladres : url
    );
    try {
      // Klikken: een toestemmingsvenster weghalen, of juist een video starten. Zonder dat
      // laatste neem je een stilstaand voorblad op en meet je niets.
      const klikOp = async (wat: string) => {
        const woorden = wat.startsWith('tekst:') ? wat.slice(6) : null;
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
          wat
        );
        if (gelukt) await new Promise((r) => setTimeout(r, 1500));
        return gelukt;
      };

      // Bij een video wordt er verderop geklikt: dan staan we nog op het insluitadres en
      // verschijnt het toestemmingsvenster pas op de videopagina zelf.
      if (klik && !videoSpeeladres(url)) {
        if (!(await klikOp(klik))) throw new Error(`Niets om op te klikken: ${klik}`);
      }

      // De speler aanzetten. Zonder dit staat er een stilstaand voorblad en meet je niets.
      //
      // Eerst netjes vragen aan het video-element zelf; lukt dat niet, dan een klik midden
      // in beeld, waar bij YouTube de grote afspeelknop zit. Daarna nagaan of de speeltijd
      // werkelijk oploopt: `paused === false` is niet genoeg, een speler kan aanstaan en
      // toch stilliggen op een bufferend beeld.
      /**
       * Zet de speler aan en kijkt of de speeltijd werkelijk oploopt.
       *
       * `paused === false` is niet genoeg: een speler kan aanstaan en toch stilliggen op
       * een foutmelding. En er wordt niet gewacht op de belofte van `play()` — die lost
       * pas op als het afspelen begint, en begint het niet, dan lost hij nooit op. Daar
       * liep de meting op vast met "Runtime.callFunctionOn timed out".
       */
      const zetAan = async () =>
        page.evaluate(async () => {
          const v = document.querySelector('video') as HTMLVideoElement | null;
          if (!v) return { speler: false, speelt: false, gelopen: 0, duur: null as number | null };
          v.muted = true;
          try {
            const belofte = v.play();
            if (belofte && belofte.catch) belofte.catch(() => {});
          } catch {
            // Het beleid van de browser hield het tegen; dan proberen we het met een klik.
          }
          const begin = v.currentTime;
          await new Promise((r) => setTimeout(r, 1500));
          return {
            speler: true,
            speelt: !v.paused && !v.ended,
            gelopen: Math.round((v.currentTime - begin) * 100) / 100,
            duur: Number.isFinite(v.duration) ? Math.round(v.duration) : null,
          };
        });

      let videoStand: any = null;
      let videoAdres: string | null = null;
      if (video) {
        // Eerst het insluitadres, dan de videopagina zelf.
        //
        // YouTube weigert een insluiting in een kale browser geregeld met "Fout 153 --
        // fout bij configuratie van videospeler": de eigenaar staat insluiten niet toe, of
        // de speler mist de herkomst die hij verwacht. Dan is de pagina van de video zelf
        // de plek waar hij wél speelt. Daar kan een toestemmingsscherm voor staan; dat
        // wordt gemeld, niet weggeklikt -- akkoord geven namens de onderzoeker is niet aan
        // dit gereedschap.
        for (const adres of [video.speeladres, video.paginaadres]) {
          if (page.url() !== adres) {
            await page.goto(adres, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
            await new Promise((r) => setTimeout(r, 1500));
          }
          videoAdres = adres;
          // Nu pas klikken: hier staat het toestemmingsvenster dat de speler tegenhoudt.
          // Mislukken mag — op het insluitadres staat het er meestal niet.
          if (klik) await klikOp(klik);
          videoStand = await zetAan();
          if (!videoStand.speelt || videoStand.gelopen <= 0) {
            // Midden in beeld, waar bij YouTube de grote afspeelknop zit.
            const vak = await page.viewport();
            await page.mouse
              .click(Math.round((vak?.width ?? 1366) / 2), Math.round((vak?.height ?? 900) / 2))
              .catch(() => {});
            await new Promise((r) => setTimeout(r, 2000));
            videoStand = await zetAan();
          }
          if (videoStand.speelt && videoStand.gelopen > 0) break;
        }
      }

      // Een toestemmingsscherm is geen video. Wie daar meet, meet een dialoogvenster.
      //
      // Op het adres is dat niet te zien: YouTube blijft op /watch staan en legt er een
      // venster overheen ("Voordat je verdergaat naar YouTube"). Vandaar de tekst, niet de
      // URL.
      //
      // Het wordt gemeld en niet weggeklikt. Toestemming geven voor cookies is een keuze
      // van de onderzoeker, niet van een meetgereedschap — en in de audit-sessie zou die
      // keuze in zijn eigen browser blijven staan. Wil hij eromheen, dan kan dat met
      // --klik="tekst:Alles afwijzen".
      const toestemmingsscherm: string | null = await page.evaluate(() => {
        if (/consent\./i.test(location.hostname)) return 'een toestemmingspagina';
        const tekst = (document.body.innerText || '').slice(0, 4000);
        return /voordat je verdergaat|before you continue|alles accepteren|accept all|alles afwijzen|reject all/i.test(
          tekst
        )
          ? 'een toestemmingsvenster over de inhoud'
          : null;
      });

      // Wat er te zien valt dat zou kunnen flitsen. Niet om te oordelen, maar om te weten
      // of de opname ergens over gaat: een speler die op pauze staat tekent niet opnieuw,
      // en dan is "geen beeldjes" geen bewijs maar een gemiste meting.
      const media = await page.evaluate(() => {
        const spelers = Array.from(document.querySelectorAll('video, audio')).map((m) => {
          const v = m as HTMLMediaElement;
          return {
            element: m.tagName.toLowerCase(),
            speelt: !v.paused && !v.ended,
            inBeeld: (() => {
              const r = m.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
            })(),
          };
        });
        const kaders = Array.from(document.querySelectorAll('iframe'))
          .filter((f) => /youtube|vimeo|dailymotion|player/i.test(f.getAttribute('src') || ''))
          .map((f) => (f.getAttribute('src') || '').slice(0, 160));
        // Ook de plaatshouders: staat de video achter een toestemmingsscherm, dan is er geen
        // kader maar wel het adres in een attribuut. Zonder deze levert zo'n pagina "geen
        // video" op terwijl er een video staat die we niet gemeten hebben.
        const plaatshouders: string[] = [];
        for (const el of Array.from(
          document.querySelectorAll('[data-src], [data-url], [data-video-id], [data-youtube-id]')
        )) {
          const waarde =
            el.getAttribute('data-src') ||
            el.getAttribute('data-url') ||
            el.getAttribute('data-video-id') ||
            el.getAttribute('data-youtube-id') ||
            '';
          if (/youtube|vimeo/i.test(waarde) || /^[\w-]{11}$/.test(waarde)) {
            plaatshouders.push(waarde.slice(0, 160));
          }
        }
        const doeken = Array.from(document.querySelectorAll('canvas')).length;
        return { spelers, kaders, plaatshouders, doeken };
      });

      // De tekenopnemer van de browser. Elk beeldje moet bevestigd worden, anders stuurt
      // hij het volgende niet; dat bevestigen doen we meteen, zodat we zo dicht mogelijk
      // bij de echte tekensnelheid blijven.
      const cdp = await ((page as any).createCDPSession
        ? (page as any).createCDPSession()
        : page.target().createCDPSession());
      const beeldjes: { tijd: number; data: string }[] = [];
      cdp.on('Page.screencastFrame', async (f: any) => {
        beeldjes.push({ tijd: f.metadata?.timestamp ?? 0, data: f.data });
        try {
          await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId });
        } catch {
          // De opname is gestopt; dan hoeft er niets meer bevestigd te worden.
        }
      });
      await cdp.send('Page.enable').catch(() => {});
      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 70,
        maxWidth: 640,
        maxHeight: 400,
        everyNthFrame: 1,
      });
      await new Promise((r) => setTimeout(r, seconden * 1000));
      await cdp.send('Page.stopScreencast').catch(() => {});

      // De tijdstempels komen in seconden sinds het begin van de tijdrekening; omrekenen
      // naar seconden sinds het eerste beeldje leest een stuk prettiger.
      const begin = beeldjes.length ? beeldjes[0].tijd : 0;
      const tijden = beeldjes.map((b) => Math.round((b.tijd - begin) * 1000) / 1000);
      const duur = tijden.length > 1 ? tijden[tijden.length - 1] - tijden[0] : 0;
      const perSeconde = duur > 0 ? Math.round((beeldjes.length / duur) * 10) / 10 : 0;

      // Hoe hard de opname loopt zegt op zichzelf niets. Het gaat erom of hij hard genoeg
      // loopt voor wát er op de pagina gebeurt.
      //
      // De tekenopnemer stuurt een beeldje zodra de pagina opnieuw tekent. Voor iets dat
      // met JavaScript of CSS knippert betekent dat: elke wisseling levert een beeldje op,
      // en dan is een lage snelheid geen tekort maar de wisselsnelheid zelf. Een
      // testpagina die acht keer per seconde omklapt leverde 8,4 beeldjes per seconde op:
      // elke wisseling, geen enkele gemist.
      //
      // Anders ligt het bij een bron die dóórtekent -- een film, een canvas, een kader van
      // een ander domein. Die tekent tot zestig keer per seconde en dat halen wij niet.
      // Een snelle strobo kan dan bij toeval elke keer in dezelfde stand bemonsterd worden
      // en onzichtbaar blijven. Daar ligt de eis dus hoger, en haalt de opname dat niet,
      // dan is de uitkomst onbeslist en is PEAT de volgende stap.
      // De video's op deze pagina, met het commando om ze apart te meten.
      //
      // Een video in een kader van een ander domein is hier niet te meten: je kunt er niet
      // in kijken, hij staat achter een toestemmingsscherm, of hij toont een stilstaand
      // voorblad. Doorverwijzen naar de video zelf is dan het enige eerlijke antwoord —
      // en dat antwoord hoort een uitvoerbare regel te zijn, geen opmerking dat het niet kon.
      const videosOpDePagina = Array.from(
        new Map(
          [...media.kaders, ...media.plaatshouders]
            .map((a: string) => videoSpeeladres(a))
            .filter((v): v is NonNullable<typeof v> => !!v)
            .map((v) => [v.nummer, v])
        ).values()
      ).map((v) => ({
        platform: v.platform,
        nummer: v.nummer,
        meet: `npm run cli -- get-flitsen ${
          v.platform === 'YouTube'
            ? `https://www.youtube.com/watch?v=${v.nummer}`
            : `https://vimeo.com/${v.nummer}`
        }`,
      }));

      const stilleSpelers = media.spelers.filter((s: any) => s.inBeeld && !s.speelt).length;
      const doorlopendeBron =
        media.spelers.some((s: any) => s.inBeeld && s.speelt) ||
        media.doeken > 0 ||
        media.kaders.length > 0;
      const genoegSnel = doorlopendeBron
        ? perSeconde >= 20
        : beeldjes.length <= 2 || perSeconde >= 4;

      const dir = ensureOutputDir();
      const stempel = timestamp();
      const naam = slugifyUrl(page.url());

      // Per beeldje, per blok: de gemiddelde relatieve helderheid en het aandeel
      // verzadigd rood. In stukjes, anders staat er een halve minuut aan beeldjes in één
      // aanroep.
      const metingen: { lum: number[]; rood: number[] }[] = [];
      for (let i = 0; i < beeldjes.length; i += 25) {
        const stuk = beeldjes.slice(i, i + 25).map((b) => b.data);
        const uit = await page.evaluate(
          async (batch: string[], kol: number, rij: number, bw: number, bh: number) => {
            // Een opzoektabel voor het lineair maken van de kleurwaarden. Anders staat er
            // een machtsverheffing per beeldpunt per beeldje, en dat zijn er miljoenen.
            const lin: number[] = [];
            for (let i = 0; i < 256; i++) {
              const c = i / 255;
              lin.push(c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
            }
            const doek = document.createElement('canvas');
            doek.width = bw;
            doek.height = bh;
            const ctx = doek.getContext('2d', { willReadFrequently: true })!;
            const uit: { lum: number[]; rood: number[] }[] = [];
            for (const b64 of batch) {
              const beeld = new Image();
              await new Promise<void>((klaar, mis) => {
                beeld.onload = () => klaar();
                beeld.onerror = () => mis(new Error('beeldje niet te laden'));
                beeld.src = `data:image/jpeg;base64,${b64}`;
              });
              ctx.drawImage(beeld, 0, 0, bw, bh);
              const d = ctx.getImageData(0, 0, bw, bh).data;
              const lum = new Array(kol * rij).fill(0);
              const rood = new Array(kol * rij).fill(0);
              const aantal = new Array(kol * rij).fill(0);
              for (let y = 0; y < bh; y++) {
                const r0 = Math.min(rij - 1, Math.floor((y * rij) / bh));
                for (let x = 0; x < bw; x++) {
                  const k0 = Math.min(kol - 1, Math.floor((x * kol) / bw));
                  const i = (y * bw + x) * 4;
                  const vak = r0 * kol + k0;
                  lum[vak] += 0.2126 * lin[d[i]] + 0.7152 * lin[d[i + 1]] + 0.0722 * lin[d[i + 2]];
                  // Verzadigd rood volgens WCAG: het rode aandeel is minstens 0,8. De eis
                  // dat rood ook echt fel is, staat er zelf bij: zonder die grens telt een
                  // vrijwel zwarte roodtint mee, en die flitst niet.
                  const som = d[i] + d[i + 1] + d[i + 2];
                  if (som > 0 && d[i] >= 128 && d[i] / som >= 0.8) rood[vak]++;
                  aantal[vak]++;
                }
              }
              for (let v = 0; v < lum.length; v++) {
                lum[v] /= aantal[v] || 1;
                rood[v] /= aantal[v] || 1;
              }
              uit.push({ lum, rood });
            }
            return uit;
          },
          stuk,
          KOL,
          RIJ,
          BREED,
          HOOG
        );
        metingen.push(...uit);
      }

      /**
       * De sprongen in één blok, met hun tijdstip.
       *
       * Eerst de toppen en dalen bepalen, met een dode zone zodat de ruis van de
       * JPEG-compressie geen top wordt. Daarna telt elke sprong tussen twee opeenvolgende
       * uitersten mee als hij minstens 0,10 groot is en het donkerste beeld eromheen
       * onder 0,80 blijft -- de algemene flitsdrempel uit WCAG.
       *
       * Twee tegengestelde sprongen vormen samen één flits (aan én weer uit). Daarom
       * wordt er straks door twee gedeeld en niet per sprong geteld: anders telt een
       * strobo van vijf per seconde er tien.
       */
      const sprongenVan = (reeks: number[], roodReeks: number[]) => {
        const RUIS = 0.02;
        const ext: { i: number; v: number }[] = [];
        // Nog geen richting, stijgend, of dalend. Die drie toestanden moeten uit elkaar
        // gehouden worden: laat je "nog geen richting" openstaan voor beide kanten, dan
        // volgt de lus alleen de laatste waarde en wordt er nooit een top vastgelegd. Op
        // een pagina die tussen zwart en wit knippert leverde dat nul sprongen op.
        let richting: 0 | 1 | -1 = 0;
        let kandidaat = reeks[0] ?? 0;
        let kandidaatI = 0;
        for (let i = 1; i < reeks.length; i++) {
          const v = reeks[i];
          if (richting === 0) {
            if (v > kandidaat + RUIS) {
              richting = 1;
              kandidaat = v;
              kandidaatI = i;
            } else if (v < kandidaat - RUIS) {
              richting = -1;
              kandidaat = v;
              kandidaatI = i;
            }
          } else if (richting === 1) {
            if (v > kandidaat) {
              kandidaat = v;
              kandidaatI = i;
            } else if (v <= kandidaat - RUIS) {
              ext.push({ i: kandidaatI, v: kandidaat });
              richting = -1;
              kandidaat = v;
              kandidaatI = i;
            }
          } else {
            if (v < kandidaat) {
              kandidaat = v;
              kandidaatI = i;
            } else if (v >= kandidaat + RUIS) {
              ext.push({ i: kandidaatI, v: kandidaat });
              richting = 1;
              kandidaat = v;
              kandidaatI = i;
            }
          }
        }
        ext.push({ i: kandidaatI, v: kandidaat });

        const sprongen: { tijd: number; hoogte: number; rood: boolean }[] = [];
        for (let j = 1; j < ext.length; j++) {
          const a = ext[j - 1];
          const b = ext[j];
          const hoogte = Math.abs(b.v - a.v);
          const donkerste = Math.min(a.v, b.v);
          if (hoogte >= 0.1 && donkerste < 0.8) {
            sprongen.push({
              tijd: tijden[b.i] ?? 0,
              hoogte: Math.round(hoogte * 1000) / 1000,
              // Rood telt mee als het aan één van beide kanten van de sprong in het blok
              // aanwezig is. De rode toets is strenger dan de gewone; hem alleen toepassen
              // als het hele blok rood is, zou hem nooit laten aanslaan.
              rood: (roodReeks[a.i] ?? 0) >= 0.2 || (roodReeks[b.i] ?? 0) >= 0.2,
            });
          }
        }
        return sprongen;
      };

      const perBlok: { blok: number; sprongen: { tijd: number; hoogte: number; rood: boolean }[] }[] = [];
      for (let b = 0; b < KOL * RIJ; b++) {
        const reeks = metingen.map((m) => m.lum[b]);
        const roodReeks = metingen.map((m) => m.rood[b]);
        const sprongen = sprongenVan(reeks, roodReeks);
        if (sprongen.length) perBlok.push({ blok: b, sprongen });
      }

      /**
       * De drukste seconde: per blok, per venster van één seconde, hoeveel flitsen.
       *
       * Het venster schuift mee met elke sprong, zodat een reeks die niet netjes op een
       * hele seconde begint niet over twee vensters wordt uitgesmeerd.
       */
      let ergsteMoment = 0;
      let ergsteAantal = 0;
      let ergsteRood = 0;
      const blokkenBoven: Set<number> = new Set();
      const blokkenBovenRood: Set<number> = new Set();
      for (const { blok, sprongen } of perBlok) {
        for (const s of sprongen) {
          const raam = sprongen.filter((t) => t.tijd >= s.tijd && t.tijd < s.tijd + 1);
          const flitsen = Math.floor(raam.length / 2);
          const roodFlitsen = Math.floor(raam.filter((t) => t.rood).length / 2);
          if (flitsen > 3) blokkenBoven.add(blok);
          if (roodFlitsen > 3) blokkenBovenRood.add(blok);
          if (flitsen > ergsteAantal) {
            ergsteAantal = flitsen;
            ergsteMoment = s.tijd;
          }
          if (roodFlitsen > ergsteRood) ergsteRood = roodFlitsen;
        }
      }

      const aandeel = blokkenBoven.size / (KOL * RIJ);
      const aandeelRood = blokkenBovenRood.size / (KOL * RIJ);
      const teGroot = aandeel > GEBIEDSGRENS;
      const teGrootRood = aandeelRood > GEBIEDSGRENS;
      const verdacht = blokkenBoven.size > 0 || blokkenBovenRood.size > 0;

      // Bewijs om naar te kijken: de beeldjes rond het ergste moment. Een getal als "9
      // flitsen per seconde" is niet na te kijken; acht beeldjes op een rij wel.
      const beelden: { pad: string; bijschrift: string }[] = [];
      if (verdacht && beeldjes.length) {
        const rond = beeldjes
          .map((b, i) => ({ b, t: tijden[i] }))
          .filter((x) => x.t >= ergsteMoment - 0.5 && x.t <= ergsteMoment + 0.5)
          .slice(0, 8);
        let n = 0;
        for (const x of rond) {
          n++;
          const pad = path.join(dir, `${stempel}-${naam}-flits-${n}.jpg`);
          fs.writeFileSync(pad, Buffer.from(x.b.data, 'base64'));
          beelden.push({ pad, bijschrift: `Beeldje ${n} — ${x.t.toFixed(2)} s` });
        }
      }

      const hoofdBeeld = path.join(dir, `${stempel}-${naam}-flitsen.jpg`);
      if (beeldjes.length) {
        fs.writeFileSync(hoofdBeeld, Buffer.from(beeldjes[beeldjes.length - 1].data, 'base64'));
      }

      // Een speler die stilstaat maakt de meting waardeloos: die tekent niet, dus er komen
      // geen beeldjes, en dan lijkt een pagina met een flitsende film brandschoon.
      // Een video die niet gespeeld heeft is niet gemeten. Dat als "niets gezien"
      // wegschrijven is precies de valse gerustheid die dit commando moet voorkomen.
      const videoGespeeld = !video || (!!videoStand?.speelt && videoStand.gelopen > 0);
      const beslist =
        genoegSnel && stilleSpelers === 0 && videoGespeeld && !(video && toestemmingsscherm);

      const stapZin = (() => {
        const waar = video
          ? `De video zelf geopend op zijn insluitadres (${video.platform} ${video.nummer}) en gedempt afgespeeld, want in een kader op de pagina is hij niet te meten. `
          : klik
          ? `Na klikken op ${klik} `
          : '';
        if (video && !videoGespeeld) {
          return `${waar}De speler kwam niet op gang${
            toestemmingsscherm ? ' (er verscheen een toestemmingsscherm)' : ''
          }; er is dus niets gemeten.`;
        }
        // Eén beeldje is de tekening bij binnenkomst; die telt niet als verandering. Pas
        // vanaf het derde beeldje is er een reeks om iets over te zeggen.
        if (beeldjes.length <= 2) {
          return `${waar}${seconden} seconden lang de tekenopnemer van de browser meegelezen: de pagina heeft in die tijd ${
            beeldjes.length === 0
              ? 'geen enkele keer getekend'
              : `${beeldjes.length === 1 ? 'één keer getekend' : 'twee keer getekend'} — de tekening bij binnenkomst — en daarna niet meer`
          }. Wat niet opnieuw getekend wordt, kan niet flitsen.${
            stilleSpelers ? ` Let op: er ${stilleSpelers === 1 ? 'staat 1 speler' : `staan ${stilleSpelers} spelers`} stil in beeld; die is niet meegemeten.` : ''
          }`;
        }
        const hoe = `${waar}${seconden} seconden opgenomen met de tekenopnemer van de browser: ${beeldjes.length} beeldjes, ${perSeconde} per seconde. Per blok van het beeld de helderheid gevolgd en de tegengestelde sprongen geteld (10% van de schaal, donkerste onder 0,80).`;
        if (!genoegSnel) {
          return `${hoe} Er staat een bron op de pagina die doorlopend tekent (film, canvas of een kader van een ander domein) en daarvoor is deze snelheid te laag: een snelle flits kan dan tussen de beeldjes door vallen. Hieruit volgt geen uitspraak over 2.3.1.`;
        }
        if (!verdacht) {
          return `${hoe} Geen enkel blok kwam boven drie flitsen per seconde; de zwaarste seconde telde er ${ergsteAantal}.`;
        }
        return `${hoe} De drukste seconde begon op ${ergsteMoment.toFixed(
          2
        )} s en telde ${ergsteAantal} flitsen. ${blokkenBoven.size} van de ${KOL * RIJ} blokken kwam boven drie per seconde, samen ${(aandeel * 100).toFixed(1)}% van het beeld — ${
          teGroot ? 'boven' : 'onder'
        } de gebiedsgrens van ${(GEBIEDSGRENS * 100).toFixed(1)}%.${
          blokkenBovenRood.size ? ` Bij ${blokkenBovenRood.size} blokken ging het om verzadigd rood.` : ''
        }`;
      })();

      let overzicht: string | null = path.join(dir, `${stempel}-${naam}-flitsen.txt`);
      try {
        const regels = [
          `FLITSEN OP DE PAGINA — ${page.url()}`,
          `Gemeten: ${new Date().toLocaleString('nl-NL')} · ${
            session.mode === 'cdp' ? 'auditsessie' : 'headless'
          }`,
          `Weergave: ${klik ? `na klikken op ${klik}` : 'standaardweergave'}`,
          `Opname: ${seconden}s · ${beeldjes.length} beeldjes · ${perSeconde} per seconde · alleen wat in beeld stond`,
          `Blokken: ${KOL} x ${RIJ} · gebiedsgrens ${(GEBIEDSGRENS * 100).toFixed(1)}% van het beeld`,
          '',
          'UITKOMST',
          `  blokken boven 3 flitsen per seconde: ${blokkenBoven.size} (${(aandeel * 100).toFixed(1)}% van het beeld)`,
          `  waarvan verzadigd rood:              ${blokkenBovenRood.size} (${(aandeelRood * 100).toFixed(1)}%)`,
          `  drukste seconde:                     ${ergsteAantal} flitsen vanaf ${ergsteMoment.toFixed(2)}s`,
          `  boven de gebiedsgrens:               ${teGroot ? 'JA' : 'nee'}${teGrootRood ? ' (rood: JA)' : ''}`,
          `  bruikbare snelheid:                  ${genoegSnel ? 'ja' : 'NEE — te weinig beeldjes per seconde'}`,
          '',
          'WAT ER OP DE PAGINA STAAT DAT KAN FLITSEN',
          `  mediaspelers: ${media.spelers.length} (in beeld en stilstaand: ${stilleSpelers})`,
          `  videokaders van een ander domein: ${media.kaders.length}`,
          ...media.kaders.map((k: string) => `    ${k}`),
          `  canvas-elementen: ${media.doeken}`,
          '',
          'BLOKKEN MET SPRONGEN (blok, aantal sprongen, grootste sprong)',
          ...perBlok
            .slice(0, 20)
            .map(
              (b) =>
                `  blok ${b.blok} (kolom ${b.blok % KOL}, rij ${Math.floor(b.blok / KOL)}): ${
                  b.sprongen.length
                } sprongen, grootste ${Math.max(...b.sprongen.map((s) => s.hoogte)).toFixed(3)}`
            ),
          '',
          'LET OP',
          '  Dit is een zeef, geen keuring. Het beeld is verkleind en samengeperst, en er',
          '  wordt in blokken gerekend. Voor een videobestand is PEAT (Trace Center) de',
          '  autoriteit; die leest het bestand beeldje voor beeldje.',
        ];
        fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
      } catch {
        overzicht = null;
      }

      legVast({
        commando: 'get-flitsen',
        stap: stapZin,
        argumenten: {
          ...(klik ? { klik } : {}),
          ...(flags.seconden ? { seconden: String(seconden) } : {}),
        },
        // Het adres zoals het gevraagd werd, en waar de meting landde. Bij een video zijn
        // dat er twee: je vraagt om de watchpagina en er wordt op het insluitadres gemeten.
        url,
        eindUrl: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: video
          ? 'de video zelf, gedempt afgespeeld'
          : klik
          ? `na klikken op ${klik}`
          : 'standaardweergave',
        schermafdruk: fs.existsSync(hoofdBeeld) ? hoofdBeeld : null,
        schermafdrukken: beelden,
        artefact: overzicht,
        criteria: ['2.3.1'],
        uitkomst: {
          beeldjes: beeldjes.length,
          beeldjesPerSeconde: perSeconde,
          blokkenBovenDeGrens: blokkenBoven.size,
          aandeelVanHetBeeld: `${(aandeel * 100).toFixed(1)}%`,
          maxFlitsenPerSeconde: ergsteAantal,
          verzadigdRood: blokkenBovenRood.size,
          bovenDeGebiedsgrens: teGroot || teGrootRood,
          beslist,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        omgeleid,
        gevraagdeUrl: omgeleid ? gevraagdeUrl : undefined,
        opname: `${seconden}s · ${beeldjes.length} beeldjes · ${perSeconde} per seconde`,
        gebied: 'alleen wat in beeld stond; wat onder de vouw flitst is niet opgenomen',
        beeldjes: beeldjes.length,
        beeldjes_per_seconde: perSeconde,
        snelheid_bruikbaar: genoegSnel,
        blokken_boven_3_per_seconde: blokkenBoven.size,
        aandeel_van_het_beeld: `${(aandeel * 100).toFixed(1)}%`,
        gebiedsgrens: `${(GEBIEDSGRENS * 100).toFixed(1)}% van het beeld (een kwart van een gezichtsveld van 10 graden)`,
        boven_de_gebiedsgrens: teGroot,
        drukste_seconde: ergsteAantal,
        drukste_moment: `${ergsteMoment.toFixed(2)}s`,
        verzadigd_rood_blokken: blokkenBovenRood.size,
        verzadigd_rood_boven_de_grens: teGrootRood,
        gemeten_op: video ? `de video zelf (${video.platform} ${video.nummer})` : 'de pagina',
        video_speelde: video ? videoStand : undefined,
        toestemmingsscherm: toestemmingsscherm ?? undefined,
        mediaspelers: media.spelers.length,
        spelers_die_stilstaan: stilleSpelers,
        videokaders_van_een_ander_domein: media.kaders,
        // Wat hier niet te meten viel, met de regel die het wél meet.
        videos_apart_meten: videosOpDePagina.length ? videosOpDePagina : undefined,
        canvas_elementen: media.doeken,
        blokken_met_sprongen: perBlok.length,
        schermafdruk: fs.existsSync(hoofdBeeld) ? hoofdBeeld : null,
        beeldjes_rond_het_ergste_moment: beelden,
        overzicht,
        beslist,
        let_op: !beslist
          ? `Onbeslist. ${
              video && !videoGespeeld
                ? `De speler kwam niet op gang${
                    toestemmingsscherm
                      ? ', er verscheen een toestemmingsscherm. Accepteer die eenmalig in de audit-sessie (npm run chrome:debug) en meet opnieuw'
                      : ''
                  }. Er is dus niets van de video gezien. `
                : ''
            }${
              !genoegSnel
                ? `Er kwamen ${perSeconde} beeldjes per seconde binnen, en er is een bron die doorlopend tekent. Een snelle flits kan dan tussen de beeldjes door vallen. Gaat het om een videobestand, laat dat dan door PEAT halen. `
                : ''
            }${
              videosOpDePagina.length
                ? `Er ${
                    videosOpDePagina.length === 1 ? 'staat 1 video' : `staan ${videosOpDePagina.length} video's`
                  } op deze pagina die hier niet te meten ${
                    videosOpDePagina.length === 1 ? 'is' : 'zijn'
                  }: in een kader van een ander domein kun je niet kijken. Meet ze apart — ${videosOpDePagina
                    .map((v) => v.meet)
                    .join(' ; ')}. `
                : ''
            }${
              stilleSpelers
                ? `Er ${stilleSpelers === 1 ? 'staat 1 speler' : `staan ${stilleSpelers} spelers`} stil in beeld. Een speler die niet speelt tekent niet opnieuw, dus die is NIET gemeten: start hem met --klik en meet opnieuw. `
                : ''
            }Schrijf 2.3.1 niet op voldoet zolang dit openstaat.`
          : beeldjes.length <= 2
          ? 'De pagina heeft in dit venster niet opnieuw getekend. Wat niet getekend wordt kan niet flitsen, dus 2.3.1 voldoet — dat is de uitkomst voor een statische pagina, niet niet_aanwezig (het criterium eist dat er niets flitst, en daar houdt deze pagina zich aan).'
          : verdacht
          ? 'Er zit iets dat boven drie flitsen per seconde uitkomt. Leg de beeldjes rond het ergste moment naast elkaar voordat je iets afkeurt, en kijk of het gebied groot genoeg is. Gaat het om een videobestand, laat dat dan door PEAT halen: dit is een zeef, geen keuring.'
          : 'Geen enkel blok kwam boven drie flitsen per seconde. Dit is een zeef: het beeld is verkleind en samengeperst, en alleen wat in beeld stond is opgenomen. Staat er een film op de pagina, laat die dan door PEAT halen voor een echte keuring.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * De adressen van de video's op een pagina.
 *
 * Eén plek, want drie commando's hebben ze nodig: get-flitsen om te melden wat het hier
 * niet kan meten, get-videosporen om ze langs te gaan, en straks wat er nog bij komt.
 * Ook de plaatshouders tellen mee: staat een video achter een toestemmingsscherm, dan is
 * er geen kader maar staat het adres in een attribuut. Zonder die levert zo'n pagina
 * "geen video" op terwijl er een video staat die niemand gemeten heeft.
 */
async function videoAdressenOpPagina(page: any): Promise<string[]> {
  return page.evaluate(() => {
    const uit: string[] = [];
    for (const f of Array.from(document.querySelectorAll('iframe'))) {
      const src = f.getAttribute('src') || '';
      if (/youtube|youtu\.be|vimeo/i.test(src)) uit.push(src.slice(0, 200));
    }
    for (const el of Array.from(
      document.querySelectorAll('[data-src], [data-url], [data-video-id], [data-youtube-id]')
    )) {
      const waarde =
        el.getAttribute('data-src') ||
        el.getAttribute('data-url') ||
        el.getAttribute('data-video-id') ||
        el.getAttribute('data-youtube-id') ||
        '';
      if (/youtube|youtu\.be|vimeo/i.test(waarde) || /^[\w-]{11}$/.test(waarde)) {
        uit.push(waarde.slice(0, 200));
      }
    }
    // Ook gewone links naar een video. Op heuvelrug.nl/archeologie staan zes video's niet
    // ingesloten maar als link; voor de pagina zelf tellen die niet mee, maar wie de
    // video's beoordeelt moet weten dat ze bestaan.
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      const href = a.getAttribute('href') || '';
      if (/youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d/i.test(href)) uit.push(href.slice(0, 200));
    }
    return uit;
  });
}

/**
 * Leest de spelers op een pagina uit zoals een onderzoeker dat zou doen: kijken wat de
 * speler zelf aanbiedt.
 *
 * Nodig omdat lang niet elke video een YouTube- of Vimeo-video is. Een eigen speler --
 * Blue Billywig, JW Player, Bitmovin -- staat niet op een adres dat je kunt herkennen, en
 * biedt zijn sporen ook niet aan als `<track>`-elementen. De ondertiteling wordt door de
 * speler zelf getekend, precies zoals YouTube dat doet.
 *
 * Twee dingen maken het toch leesbaar:
 *
 *   1. **Shadow DOM openen.** De hele bediening van zo'n speler zit in een afgeschermde
 *      wortel. `document.querySelector` komt daar niet, en dan lijkt een pagina met een
 *      volledig toegankelijke speler een pagina zonder knoppen. Op de webinarpagina van
 *      Blue Billywig zaten in twee wortels: "Zet ondertitels uit", "Zet uitgeschreven
 *      tekst aan", en de uitgeschreven tekst zelf.
 *   2. **De knopnamen lezen.** Die zeggen wat er is én hoe het erbij staat: "Zet
 *      ondertitels uit" betekent dat ze aanstaan. Dat is een afleiding uit een tekst, geen
 *      meting van de ondertiteling zelf, en zo wordt het ook gemeld.
 *
 * Wat hier NIET uit komt: of de ondertiteling deugt, of het transcript volledig is, en of
 * tekst-in-beeld ook wordt uitgesproken. Dat blijft werk van de onderzoeker.
 */
async function leesSpelersOpPagina(page: any): Promise<any[]> {
  const uit: any[] = [];

  // Eerst langs de pagina scrollen en wachten tot er een speler staat.
  //
  // Een eigen speler wordt door een script neergezet, en vaak pas op het moment dat hij in
  // beeld komt. Direct na het laden is er dus niets te vinden, ook niet op een pagina waar
  // een video staat. Een bezoeker scrolt vanzelf; deze lus doet hetzelfde.
  const tel = () =>
    page.evaluate(() => {
      let aantal = document.querySelectorAll('video').length;
      const stapel: Element[] = Array.from(document.querySelectorAll('*'));
      let bekeken = 0;
      while (stapel.length && bekeken < 40000) {
        const el = stapel.pop()!;
        bekeken++;
        if (el.shadowRoot) {
          aantal += el.shadowRoot.querySelectorAll('video').length;
          stapel.push(...Array.from(el.shadowRoot.querySelectorAll('*')));
        }
      }
      return aantal;
    });
  for (let poging = 0; poging < 8; poging++) {
    if (await tel().catch(() => 0)) break;
    await page
      .evaluate((stap: number) => window.scrollTo(0, stap * 500), poging)
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 900));
  }
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await new Promise((r) => setTimeout(r, 500));

  // En dan wachten tot de speler zijn bediening heeft opgebouwd.
  //
  // Het video-element staat er eerder dan de knoppen eromheen. Lees je te vroeg, dan komt
  // er "geen ondertitelknop gevonden" uit bij een speler die er wel een heeft — en dat is
  // precies het soort onterechte bevinding dat deze meting moet voorkomen. De uitkomst
  // wisselde er per run door.
  for (let poging = 0; poging < 10; poging++) {
    const klaar = await page
      .evaluate(() => {
        const namen: string[] = [];
        const wortels: (Document | ShadowRoot)[] = [document];
        const stapel: Element[] = Array.from(document.querySelectorAll('*'));
        let bekeken = 0;
        while (stapel.length && bekeken < 40000) {
          const el = stapel.pop()!;
          bekeken++;
          if (el.shadowRoot) {
            wortels.push(el.shadowRoot);
            stapel.push(...Array.from(el.shadowRoot.querySelectorAll('*')));
          }
        }
        for (const w of wortels) {
          for (const b of Array.from(w.querySelectorAll('button, [role="button"]'))) {
            namen.push((b.getAttribute('aria-label') || b.textContent || '').trim());
          }
        }
        return namen.some((n) => /ondertitel|subtitle|uitgeschreven|transcript|afspelen|\bplay\b/i.test(n));
      })
      .catch(() => false);
    if (klaar) break;
    await new Promise((r) => setTimeout(r, 700));
  }

  for (const kader of page.frames()) {
    const gevonden = await kader
      .evaluate(() => {
        // Alles aflopen, inclusief afgeschermde wortels. Geen benoemde hulpfunctie: esbuild
        // hangt daar __name aan, en dat bestaat niet in de browser.
        const wortels: (Document | ShadowRoot)[] = [document];
        const stapel: Element[] = Array.from(document.querySelectorAll('*'));
        let bekeken = 0;
        while (stapel.length && bekeken < 40000) {
          const el = stapel.pop()!;
          bekeken++;
          if (el.shadowRoot) {
            wortels.push(el.shadowRoot);
            stapel.push(...Array.from(el.shadowRoot.querySelectorAll('*')));
          }
        }

        const spelers: any[] = [];
        // Eén regel per speler, niet per video-element.
        //
        // Een speler bestaat vaak uit meerdere video-elementen (de film, een reclame, een
        // voorbeeldbeeld) in verschillende afgeschermde wortels, en zijn knoppen zitten in
        // wéér een andere wortel dan de video. Per video-element rapporteren levert dan
        // twee regels op waarvan er één zegt "geen ondertitelknop gevonden" -- terwijl die
        // knop er wel is, één laag verderop. Vandaar: alles wat binnen dezelfde buitenste
        // gastheer zit, is één speler.
        const perGastheer = new Map<any, any>();
        for (const wortel of wortels) {
          for (const v of Array.from(wortel.querySelectorAll('video'))) {
            const el = v as HTMLVideoElement;
            const rect = el.getBoundingClientRect();
            let gastheer: any = null;
            let r: any = el.getRootNode();
            while (r && r.host) {
              gastheer = r.host;
              r = gastheer.getRootNode();
            }
            const gebied: any = gastheer ?? document.body;
            // Alle knoppen binnen die speler, ook in geneste wortels.
            const knopWortels: (Element | ShadowRoot)[] = [gebied];
            const knopStapel: Element[] = Array.from(gebied.querySelectorAll('*'));
            let knopBekeken = 0;
            while (knopStapel.length && knopBekeken < 20000) {
              const k = knopStapel.pop()!;
              knopBekeken++;
              if (k.shadowRoot) {
                knopWortels.push(k.shadowRoot);
                knopStapel.push(...Array.from(k.shadowRoot.querySelectorAll('*')));
              }
            }
            const knoppen = Array.from(
              new Set(
                knopWortels.flatMap((w) =>
                  Array.from(w.querySelectorAll('button, [role="button"], [role="menuitem"]')).map(
                    (b) =>
                      (b.getAttribute('aria-label') || b.textContent || '')
                        .replace(/\s+/g, ' ')
                        .trim()
                  )
                )
              )
            )
              .filter((t) => t && t.length < 60)
              .slice(0, 30);
            // Staan de knoppen niet binnen deze speler, dan staan ze elders op de pagina:
            // sommige spelers zetten hun bediening in een aparte laag buiten de gastheer.
            // Dan is dat de bron, mét vermelding — anders meldt de meting "geen
            // ondertitelknop" terwijl die er wel is, één laag verderop.
            let knoppenBron = 'de speler zelf';
            let knoppenVanDeSpeler = knoppen;
            if (!knoppen.length) {
              const alles: string[] = [];
              for (const w of wortels) {
                for (const b of Array.from(
                  w.querySelectorAll('button, [role="button"], [role="menuitem"]')
                )) {
                  const naam = (b.getAttribute('aria-label') || b.textContent || '')
                    .replace(/\s+/g, ' ')
                    .trim();
                  if (naam && naam.length < 60) alles.push(naam);
                }
              }
              knoppenVanDeSpeler = Array.from(new Set(alles)).slice(0, 30);
              knoppenBron = 'elders op de pagina';
            }

            const bestaand = perGastheer.get(gebied);
            // De grootste video van deze speler is de film; de rest is bijwerk.
            if (bestaand && bestaand.oppervlak >= rect.width * rect.height) continue;
            perGastheer.set(gebied, {
              oppervlak: rect.width * rect.height,
              duurSeconden: Number.isFinite(el.duration) ? Math.round(el.duration) : null,
              speeltNu: !el.paused && !el.ended,
              inSchaduw: wortel !== document,
              maat: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
              // De sporen die de speler wél aan de browser doorgeeft. Bij een speler die
              // zijn ondertiteling zelf tekent, is dit leeg -- en dat betekent dus niet
              // "geen ondertiteling".
              tekstsporen: Array.from(el.textTracks).map((t) => ({
                soort: t.kind,
                taal: t.language,
                naam: t.label,
                stand: t.mode,
              })),
              trackElementen: Array.from(el.querySelectorAll('track')).map((t) => ({
                soort: t.getAttribute('kind'),
                taal: t.getAttribute('srclang'),
                naam: t.getAttribute('label'),
              })),
              knoppen: knoppenVanDeSpeler,
              knoppenBron,
            });
          }
        }
        for (const speler of Array.from(perGastheer.values())) spelers.push(speler);

        // De uitgeschreven tekst, waar hij ook staat. Voor 1.2.3 is dat het alternatief
        // waar het om draait, dus de lengte telt: een kopje "Transcript" boven drie regels
        // is geen tekstalternatief.
        let transcript: any = null;
        for (const wortel of wortels) {
          for (const el of Array.from(wortel.querySelectorAll('*'))) {
            const tekst = (el.textContent || '').replace(/\s+/g, ' ').trim();
            // Beginnen mét het opschrift, niet het woord ergens tegenkomen. Anders wordt
            // een ondertitelregel waarin iemand "transcript" zegt aangezien voor een
            // transcript -- dat gebeurde op de webinarpagina, waar de spreker het woord
            // letterlijk uitspreekt. En lang genoeg om een tekstalternatief te kunnen zijn:
            // een kopje boven drie regels is dat niet.
            if (tekst.length < 400) continue;
            if (!/^(uitgeschreven tekst|transcript|tekstversie|leesversie)/i.test(tekst)) continue;
            // De kleinste houder die eraan voldoet, anders is het de hele pagina.
            if (transcript && transcript.tekens <= tekst.length) continue;
            transcript = {
              tekens: tekst.length,
              begin: tekst.slice(0, 200),
              inSchaduw: wortel !== document,
            };
          }
        }

        // De duur zoals de speler hem zelf toont ("00:00 / 34:19"). Het video-element geeft
        // die pas na het laden van de gegevens, en soms helemaal niet.
        let duurVolgensDeSpeler: string | null = null;
        for (const wortel of wortels) {
          const tekst = (wortel === document ? document.body : (wortel as ShadowRoot))
            .textContent || '';
          const m = tekst.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*\/\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
          if (m) {
            duurVolgensDeSpeler = m[2];
            break;
          }
        }
        return { spelers, transcript, duurVolgensDeSpeler };
      })
      .catch(() => null);

    if (!gevonden || !gevonden.spelers.length) continue;
    for (const s of gevonden.spelers) {
      // Wat de knoppen zeggen over ondertiteling en transcript. Een afleiding uit een
      // tekst: "Zet ondertitels uit" betekent dat ze aanstaan, "Zet ondertitels aan" dat
      // ze uitstaan. Zo staat het er ook bij, want dit is geen meting van de ondertiteling.
      const namen: string[] = s.knoppen ?? [];
      const ondertitelknop = namen.find((n) => /ondertitel|subtitle|closed caption|\bcc\b/i.test(n));
      const transcriptknop = namen.find((n) => /uitgeschreven|transcript|tekstversie/i.test(n));
      const audiodescriptieknop = namen.find((n) =>
        /audiodescriptie|audio description|gesproken beschrijving/i.test(n)
      );
      uit.push({
        ...s,
        // Een videovakje kleiner dan ongeveer 260 bij 150 is geen film maar een voorbeeldbeeldje
        // naast de speler. Meetellen levert een tweede "speler zonder ondertitelknop" op,
        // en dat leest als een tekort dat er niet is. Wel tellen hoeveel er zo zijn
        // overgeslagen: wat weggelaten is hoort zichtbaar te blijven.
        teKlein: s.oppervlak < 40000,
        waar: kader === page.mainFrame() ? 'de pagina zelf' : kader.url().slice(0, 120),
        ondertitelknop: ondertitelknop ?? null,
        ondertitelingStaatAanVolgensDeKnop: ondertitelknop
          ? /uit(zetten)?$|uit\b/i.test(ondertitelknop)
            ? true
            : /aan(zetten)?$|aan\b/i.test(ondertitelknop)
            ? false
            : null
          : null,
        transcriptknop: transcriptknop ?? null,
        audiodescriptieknop: audiodescriptieknop ?? null,
        transcript: gevonden.transcript,
        duurVolgensDeSpeler: gevonden.duurVolgensDeSpeler ?? null,
      });
    }
  }
  return uit;
}

/**
 * Leest per video uit welke sporen erbij zitten: ondertiteling, audiosporen, transcript.
 *
 * Dit is de meting voor SC 1.2.3 (audiodescriptie óf een tekstalternatief) en SC 1.2.5
 * (audiodescriptie). Beide vragen of er náást beeld en geluid nog iets is voor wie het
 * beeld niet ziet -- en dat is uit te lezen, niet te schatten.
 *
 * Waar het vandaan komt: `ytInitialPlayerResponse`, de gegevens die de YouTube-speler zelf
 * gebruikt. Daar staat per video welke ondertitelsporen er zijn en of ze automatisch
 * gegenereerd zijn (`kind: "asr"`), en welke audiosporen er zijn. Een video met
 * audiodescriptie heeft daar een tweede audiospoor met een naam als "descriptive" of
 * "beschrijvend". Staat dat er niet, dan is er geen audiodescriptiespoor.
 *
 * DE VIDEO WORDT OP ZIJN EIGEN PAGINA GELEZEN, niet op de pagina van de gemeente. In een
 * kader van een ander domein kun je niet kijken, en achter een toestemmingsscherm al
 * helemaal niet. Geef dus een videoadres mee, of een pagina-adres -- dan worden de video's
 * die erop staan één voor één langsgegaan.
 *
 * WAT DIT NIET ZIET, en dat is de valkuil uit `Shift2_Werkwijze_Video.md`: **open**
 * ondertiteling zit in het beeld gebrand en staat in geen enkele gegevensbron. Alleen op de
 * speler afgaan levert dan onterechte bevindingen op. Daarom worden er drie beeldjes uit de
 * lopende video vastgelegd, verspreid over de duur: daarop is te zien of er tekst in beeld
 * staat. Speelt de video niet (toestemmingsscherm), dan komen die beeldjes er niet en zegt
 * het commando dat.
 *
 * En het beslist niets. Of een tekstalternatief volledig is, of de audiodescriptie deugt,
 * en of tekst-in-beeld ook wordt uitgesproken -- dat blijft werk van de onderzoeker.
 */
async function getVideosporen(url: string, flags: Flags) {
  const max = Math.max(1, parseInt(flags.max || '5', 10));
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const session = await getBrowser();
  try {
    const eersteAdres = videoSpeeladres(url);
    const { page, cleanup, gevraagdeUrl, eindUrl, omgeleid } = await openPage(session, url);
    try {
      // Eén video, of een pagina waar video's op staan.
      let adressen: string[] = [];
      let paginaTekstalternatief: any = null;
      let eigenSpelers: any[] = [];
      let kleineSpelers = 0;
      if (eersteAdres) {
        adressen = [url];
      } else {
        adressen = await videoAdressenOpPagina(page);
        // Spelers die geen YouTube of Vimeo zijn. Die staan op geen herkenbaar adres en
        // verstoppen hun bediening in shadow DOM; zonder deze stap levert een pagina met
        // een volledig toegankelijke speler "geen video gevonden" op.
        const alleSpelers = await leesSpelersOpPagina(page);
        eigenSpelers = alleSpelers.filter((sp: any) => !sp.teKlein);
        kleineSpelers = alleSpelers.length - eigenSpelers.length;
        // Wat er op de pagina zelf staat dat een tekstalternatief kán zijn. Voor 1.2.3 mag
        // dat namelijk: een uitgeschreven tekst die ook beschrijft wat er te zien is,
        // telt. Alleen kandidaten -- of de tekst volledig is, leest de onderzoeker na.
        paginaTekstalternatief = await page.evaluate(() => {
          const treffers: { soort: string; tekst: string; adres?: string }[] = [];
          for (const el of Array.from(document.querySelectorAll('a[href], summary, h2, h3, button'))) {
            const tekst = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (!tekst || tekst.length > 120) continue;
            if (/transcript|tekstversie|uitgeschreven|tekstalternatief|leesversie/i.test(tekst)) {
              treffers.push({
                soort: el.tagName.toLowerCase(),
                tekst,
                adres: el.getAttribute('href') || undefined,
              });
            }
          }
          return treffers.slice(0, 10);
        });
      }

      const alleUnieke = Array.from(
        new Map(
          adressen
            .map((a) => videoSpeeladres(a))
            .filter((v): v is NonNullable<typeof v> => !!v)
            .map((v) => [v.nummer, v])
        ).values()
      );
      const uniek = alleUnieke.slice(0, max);
      // Wat de begrenzing heeft afgekapt, hoort zichtbaar te zijn. Vijf van de zes video's
      // niet bekeken en toch "beslist" melden, is dezelfde fout als een schone uitkomst die
      // niet van niet-gekeken-hebben te onderscheiden is.
      const nietBekeken = alleUnieke.length - uniek.length;

      const dir = ensureOutputDir();
      const stempel = timestamp();
      const beelden: { pad: string; bijschrift: string }[] = [];
      const videos: any[] = [];

      for (const v of uniek) {
        if (v.platform !== 'YouTube') {
          // Voor Vimeo is nog niet vastgelegd waar de sporen vandaan komen. Dat als "geen
          // ondertiteling" wegschrijven zou een bevinding verzinnen; dus met de reden erbij.
          videos.push({
            platform: v.platform,
            nummer: v.nummer,
            adres: v.paginaadres,
            leesbaar: false,
            reden:
              'Voor Vimeo is nog niet vastgelegd hoe de sporen uit te lezen zijn. Beoordeel deze video met de hand.',
          });
          continue;
        }

        await page.goto(v.paginaadres, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
        if (klik) {
          await page
            .evaluate((zoek: string) => {
              const woorden = zoek.startsWith('tekst:') ? zoek.slice(6).toLowerCase() : null;
              const el = woorden
                ? Array.from(document.querySelectorAll('button, a, [role="button"]')).find((k) =>
                    (k.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().includes(woorden)
                  )
                : document.querySelector(zoek);
              if (el) (el as HTMLElement).click();
            }, klik)
            .catch(() => {});
          await new Promise((r) => setTimeout(r, 1500));
        }

        const gegevens = await page.evaluate(() => {
          const w = window as any;
          const pr = w.ytInitialPlayerResponse;
          const toestemming = /voordat je verdergaat|before you continue|alles accepteren/i.test(
            (document.body.innerText || '').slice(0, 3000)
          );
          if (!pr) return { leesbaar: false, toestemming };
          const sporen = pr.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
          const formaten = pr.streamingData?.adaptiveFormats || [];
          const audio: Record<string, any> = {};
          for (const f of formaten) if (f.audioTrack) audio[f.audioTrack.id] = f.audioTrack;
          return {
            leesbaar: true,
            toestemming,
            titel: pr.videoDetails?.title ?? null,
            duurSeconden: pr.videoDetails?.lengthSeconds ? Number(pr.videoDetails.lengthSeconds) : null,
            live: !!pr.videoDetails?.isLiveContent,
            ondertiteling: sporen.map((c: any) => ({
              taal: c.languageCode,
              naam: c.name?.simpleText || c.name?.runs?.[0]?.text || null,
              // 'asr' = automatic speech recognition: door de machine gemaakt.
              automatisch: c.kind === 'asr',
            })),
            audiosporen: Object.values(audio).map((a: any) => ({
              naam: a.displayName,
              standaard: !!a.audioIsDefault,
            })),
            // Zonder formaten is er niets over de audiosporen te zeggen. Dan is "geen
            // audiodescriptie" een gok en geen meting.
            audioAfleesbaar: formaten.length > 0,
            transcriptKnop: /transcript/i.test((document.body.innerText || '').slice(0, 6000)),
          };
        });

        // Drie beeldjes uit de lopende video: het enige middel om open ondertiteling te
        // zien, want die staat in geen enkele gegevensbron.
        //
        // Elk beeldje vraagt een eigen laadbeurt met `&t=<seconden>s` in het adres. Dat is
        // omslachtiger dan even doorspoelen, maar doorspoelen werkt hier niet: zowel
        // `currentTime` als de eigen `seekTo` van de speler blijft eeuwig op `seeking`
        // staan met readyState 1 -- de beelden voor die plek worden nooit opgehaald. Via
        // het adres laadt de speler wél op de goede plek, met readyState 4.
        const opnamen: string[] = [];
        let speelt = false;
        if (gegevens.leesbaar && gegevens.duurSeconden) {
          for (const deel of [0.25, 0.5, 0.75]) {
            const seconde = Math.max(1, Math.floor(gegevens.duurSeconden * deel));
            await page
              .goto(`${v.paginaadres}&t=${seconde}s`, { waitUntil: 'networkidle2', timeout: 30000 })
              .catch(() => {});
            await new Promise((r) => setTimeout(r, 1200));
            if (klik) {
              await page
                .evaluate((zoek: string) => {
                  const woorden = zoek.startsWith('tekst:') ? zoek.slice(6).toLowerCase() : null;
                  const el = woorden
                    ? Array.from(document.querySelectorAll('button, a, [role="button"]')).find((k) =>
                        (k.textContent || '')
                          .replace(/\s+/g, ' ')
                          .trim()
                          .toLowerCase()
                          .includes(woorden)
                      )
                    : document.querySelector(zoek);
                  if (el) (el as HTMLElement).click();
                }, klik)
                .catch(() => {});
              await new Promise((r) => setTimeout(r, 1200));
            }
            const vak = await page.evaluate(async () => {
              const el = document.querySelector('video') as HTMLVideoElement | null;
              if (!el) return null;
              el.muted = true;
              try {
                const belofte = el.play();
                if (belofte && belofte.catch) belofte.catch(() => {});
              } catch {
                // Het beleid van de browser hield het tegen; blijkt hieronder.
              }
              // readyState 3 betekent: er is beeld om te tonen. Zonder deze wachtlus staat
              // er een laadtekentje op een zwart vlak, en daar is geen ondertiteling op te
              // zien -- terwijl dat de hele reden is dat deze beeldjes gemaakt worden.
              for (let poging = 0; poging < 25; poging++) {
                await new Promise((r) => setTimeout(r, 400));
                if (el.readyState >= 3 && !el.seeking) break;
              }
              if (el.readyState < 3) return null;
              await new Promise((r) => setTimeout(r, 400));
              const r = el.getBoundingClientRect();
              return { x: r.x, y: r.y, w: r.width, h: r.height, tijd: Math.round(el.currentTime) };
            });
            if (!vak || vak.w < 10 || vak.h < 10) continue;
            speelt = true;
            const pad = path.join(dir, `${stempel}-${v.nummer}-beeld-${Math.round(deel * 100)}.jpg`);
            try {
              // Alleen de speler, niet de halve YouTube-pagina eromheen: het gaat om wat er
              // in het beeld van de film staat.
              await page.screenshot({
                path: pad as `${string}.jpg`,
                type: 'jpeg',
                quality: 80,
                clip: {
                  x: Math.max(0, Math.floor(vak.x)),
                  y: Math.max(0, Math.floor(vak.y)),
                  width: Math.floor(vak.w),
                  height: Math.floor(vak.h),
                },
              });
              opnamen.push(pad);
              beelden.push({
                pad,
                bijschrift: `${v.nummer} op ${vak.tijd}s (${Math.round(
                  deel * 100
                )}%) — kijk of er tekst in beeld staat`,
              });
            } catch {
              // Een mislukte opname mag de meting niet ongeldig maken.
            }
          }
        }

        const ondertiteling = gegevens.ondertiteling ?? [];
        const audiosporen = gegevens.audiosporen ?? [];
        const beschrijvend = audiosporen.filter((a: any) =>
          /descript|beschrijv|audiodescriptie/i.test(a.naam || '')
        );
        videos.push({
          platform: v.platform,
          nummer: v.nummer,
          adres: v.paginaadres,
          leesbaar: gegevens.leesbaar,
          toestemmingsscherm: gegevens.toestemming || undefined,
          titel: gegevens.titel ?? null,
          duurSeconden: gegevens.duurSeconden ?? null,
          live: gegevens.live ?? null,
          ondertitelsporen: ondertiteling,
          alleenAutomatischeOndertiteling:
            ondertiteling.length > 0 && ondertiteling.every((o: any) => o.automatisch),
          geenOndertiteling: ondertiteling.length === 0,
          audiosporen,
          audioAfleesbaar: gegevens.audioAfleesbaar ?? false,
          // "Geen apart spoor" is niet hetzelfde als "geen audiodescriptie".
          //
          // In Nederland wordt audiodescriptie vrijwel altijd als LOSSE VIDEO gepubliceerd
          // en niet als tweede audiospoor: op YouTube heten die "... met audiodescriptie".
          // Een steekproef over de video's van KRO-NCRV, Bartiméus en LuckyTV met
          // audiodescriptie in de titel gaf bij alle zes één audiospoor. Zou hier "geen"
          // staan, dan leest dat als een afkeuring terwijl de beschreven versie er wel is,
          // ergens anders. Het meerspoorsysteem bestaat wél (de video's van MrBeast hebben
          // er twintig), dus deze meting slaat aan als er iets te vinden is.
          audiodescriptiespoor: !gegevens.audioAfleesbaar
            ? 'niet af te lezen'
            : beschrijvend.length
            ? beschrijvend.map((a: any) => a.naam).join(', ')
            : 'geen apart audiospoor in deze speler',
          transcriptGenoemdOpYoutube: gegevens.transcriptKnop ?? false,
          beeldjes: opnamen,
          beeldjesGelukt: speelt,
        });
      }

      const zonderAudiodescriptie = videos.filter(
        (v) => v.leesbaar && v.audiodescriptiespoor === 'geen apart audiospoor in deze speler'
      ).length;
      const nietAfTeLezen = videos.filter((v) => !v.leesbaar || v.audiodescriptiespoor === 'niet af te lezen').length;
      const zonderBeeldjes = videos.filter((v) => v.leesbaar && !v.beeldjesGelukt).length;

      // Een opname van de pagina zelf, als er geen beeldjes uit een video kwamen.
      //
      // Elke meting hoort een beeld achter te laten -- dat staat op de kaart zelf als eis.
      // Bij "geen video gevonden" is dat juist het bewijsstuk dat telt: hier is gekeken, en
      // dit stond er. Zonder opname staat er een oordeel met alleen een tekstbestand eronder.
      let paginaOpname: string | null = null;
      if (!beelden.length) {
        try {
          const pad = path.join(dir, `${stempel}-videosporen-pagina.jpg`);
          await page.screenshot({ path: pad as `${string}.jpg`, type: 'jpeg', quality: 70 });
          if (fs.existsSync(pad)) paginaOpname = pad;
        } catch {
          // Een mislukte opname mag de meting niet ongeldig maken.
        }
      }
      // Geen video gevonden is een uitkomst, geen tekort.
      //
      // Staat er niets, dan is er niets te lezen en zijn 1.2.3 en 1.2.5 niet van toepassing;
      // dat is beslist. Onbeslist is het alleen als er aanwijzingen zijn dat er wél een
      // video staat die we niet konden lezen: een adres dat we vonden maar niet konden
      // uitlezen, of een speler waarvan de sporen niet af te lezen waren. Zou "geen video"
      // hier onbeslist heten, dan zou elke pagina zonder video een openstaande vraag
      // opleveren -- twintig per onderzoek, allemaal zonder antwoord.
      const gevondenMaarNietGelezen = adressen.length > 0 && videos.length === 0;
      const beslist = nietAfTeLezen === 0 && !gevondenMaarNietGelezen && nietBekeken === 0;

      const stapZin = (() => {
        if (!videos.length) {
          if (eigenSpelers.length) {
            // Een eigen speler levert geen sporen op die de browser doorgeeft; wat hij
            // aanbiedt staat in zijn eigen bediening. Dat is de zin die de kaart nodig heeft.
            const per = eigenSpelers
              .map((s) => {
                const duur = s.duurVolgensDeSpeler ?? (s.duurSeconden ? `${s.duurSeconden}s` : '?');
                const ot = s.ondertitelknop
                  ? `ondertiteling ${
                      s.ondertitelingStaatAanVolgensDeKnop === true
                        ? 'staat aan'
                        : s.ondertitelingStaatAanVolgensDeKnop === false
                        ? 'staat uit'
                        : 'aanwezig'
                    } (knop: "${s.ondertitelknop}")`
                  : 'geen ondertitelknop gevonden';
                const tr = s.transcript
                  ? `uitgeschreven tekst aanwezig (${s.transcript.tekens} tekens)`
                  : s.transcriptknop
                  ? `knop "${s.transcriptknop}", tekst niet uitgelezen`
                  : 'geen uitgeschreven tekst gevonden';
                return `speler van ${duur}: ${ot}, ${tr}, ${
                  s.audiodescriptieknop
                    ? `audiodescriptieknop "${s.audiodescriptieknop}"`
                    : 'geen audiodescriptieknop'
                }`;
              })
              .join('; ');
            return `Geen video van YouTube of Vimeo op deze pagina, maar wel ${
              eigenSpelers.length === 1 ? 'een eigen speler' : `${eigenSpelers.length} eigen spelers`
            }. Die geeft zijn sporen niet aan de browser door, dus is zijn eigen bediening uitgelezen — ${per}.`;
          }
          return `Gekeken welke video's er te beoordelen zijn: geen enkele gevonden op ${
            eersteAdres ? 'dit adres' : 'deze pagina'
          }, dus er zijn geen sporen om uit te lezen.`;
        }
        const per = videos
          .map((v) => {
            if (!v.leesbaar) return `${v.nummer}: niet uit te lezen (${v.reden ?? 'geen spelergegevens'})`;
            const ot = v.geenOndertiteling
              ? 'geen ondertiteling'
              : v.alleenAutomatischeOndertiteling
              ? `alleen automatische ondertiteling (${v.ondertitelsporen.map((o: any) => o.taal).join(', ')})`
              : `ondertiteling ${v.ondertitelsporen.map((o: any) => o.taal).join(', ')}`;
            return `"${v.titel ?? v.nummer}" (${v.duurSeconden ?? '?'}s): ${ot}, audiodescriptiespoor ${v.audiodescriptiespoor}`;
          })
          .join('; ');
        return `De ${
          videos.length === 1 ? 'video' : `${videos.length} video's`
        } op hun eigen pagina geopend en de sporen van de speler uitgelezen — ${per}.${
          zonderBeeldjes
            ? ` Van ${zonderBeeldjes} ${zonderBeeldjes === 1 ? 'video' : "video's"} kwamen geen beeldjes: de speler kwam niet op gang, dus open ondertiteling is niet nagekeken.`
            : ' Van elke video zijn drie beeldjes vastgelegd om open ondertiteling te kunnen zien.'
        }`;
      })();

      let overzicht: string | null = path.join(dir, `${stempel}-videosporen.txt`);
      try {
        const regels = [
          `VIDEOSPOREN — ${gevraagdeUrl}`,
          `Gemeten: ${new Date().toLocaleString('nl-NL')} · ${
            session.mode === 'cdp' ? 'auditsessie' : 'headless'
          }`,
          `Gevonden video's: ${uniek.length}${adressen.length > uniek.length ? ` (uit ${adressen.length} adressen)` : ''}`,
          '',
          ...videos.flatMap((v) => [
            `VIDEO ${v.nummer} — ${v.titel ?? '(titel niet gelezen)'}`,
            `  adres:            ${v.adres}`,
            `  duur:             ${v.duurSeconden ?? '?'} s${v.live ? ' (live)' : ''}`,
            `  ondertiteling:    ${
              v.leesbaar
                ? v.ondertitelsporen.length
                  ? v.ondertitelsporen
                      .map((o: any) => `${o.taal}${o.automatisch ? ' (automatisch)' : ''}`)
                      .join(', ')
                  : 'geen'
                : 'niet uit te lezen'
            }`,
            `  audiosporen:      ${
              v.leesbaar ? (v.audiosporen.length ? v.audiosporen.map((a: any) => a.naam).join(', ') : 'één spoor') : '?'
            }`,
            `  audiodescriptie:  ${v.audiodescriptiespoor ?? '?'}`,
            `  transcript op YouTube genoemd: ${v.transcriptGenoemdOpYoutube ? 'ja' : 'nee'}`,
            `  beeldjes:         ${v.beeldjes?.length ?? 0}${v.beeldjesGelukt ? '' : ' (speler kwam niet op gang)'}`,
            '',
          ]),
          'TEKSTALTERNATIEF OP DE PAGINA (kandidaten, niet nagelopen)',
          ...(paginaTekstalternatief?.length
            ? paginaTekstalternatief.map((t: any) => `  ${t.soort} "${t.tekst}"${t.adres ? ` → ${t.adres}` : ''}`)
            : ['  geen']),
          '',
          'LET OP',
          '  Open ondertiteling zit in het beeld gebrand en staat in geen enkele gegevensbron.',
          '  Bekijk de beeldjes; zie Shift2_Werkwijze_Video.md en scripts/video-scan.mjs.',
        ];
        fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
      } catch {
        overzicht = null;
      }

      legVast({
        commando: 'get-videosporen',
        stap: stapZin,
        argumenten: { ...(klik ? { klik } : {}), ...(flags.max ? { max: String(max) } : {}) },
        url,
        eindUrl: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: 'de video zelf, op zijn eigen pagina',
        schermafdruk: beelden[0]?.pad ?? paginaOpname,
        schermafdrukken: beelden,
        artefact: overzicht,
        criteria: ['1.2.3', '1.2.5'],
        uitkomst: {
          videos: videos.length,
          eigenSpelers: eigenSpelers.length,
          zonderAudiodescriptiespoor: zonderAudiodescriptie,
          nietAfTeLezen,
          zonderBeeldjes,
          beslist,
        },
      });

      print({
        url: gevraagdeUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gevonden_adressen: adressen.length,
        beoordeelde_videos: videos.length,
        niet_bekeken_door_de_grens: nietBekeken || undefined,
        videos,
        eigen_spelers: eigenSpelers.length ? eigenSpelers : undefined,
        kleine_videovakjes_overgeslagen: kleineSpelers || undefined,
        tekstalternatief_op_de_pagina: paginaTekstalternatief ?? undefined,
        schermafdruk: beelden[0]?.pad ?? paginaOpname,
        overzicht,
        beslist,
        let_op: !videos.length && !eigenSpelers.length
          ? 'Geen video op deze pagina. Dan is er niets uit te lezen en zijn 1.2.3 en 1.2.5 niet van toepassing. Kijk de opname na: staat er wel een video maar achter een toestemmingsscherm, dan zit het adres niet in de code en is dit geen "geen video" -- bekijk de pagina dan in de audit-sessie (npm run chrome:debug).'
          : !beslist
          ? `Onbeslist. ${
              nietAfTeLezen
                ? `Van ${nietAfTeLezen} ${nietAfTeLezen === 1 ? 'video' : "video's"} waren de sporen niet uit te lezen; zonder die gegevens is "geen audiodescriptie" een gok. `
                : ''
            }${
              nietBekeken
                ? `${nietBekeken} ${nietBekeken === 1 ? 'video is' : "video's zijn"} niet bekeken door de grens van --max=${max}; verhoog die of beoordeel ze apart. `
                : ''
            }${
              gevondenMaarNietGelezen
                ? 'Er staan video-adressen op de pagina die niet uit te lezen waren. '
                : ''
            }Meet opnieuw in de audit-sessie, of beoordeel met de hand.`
          : `Uitgelezen, niet geoordeeld. Voor 1.2.5 is audiodescriptie nodig; voor 1.2.3 mag dat ook een tekstalternatief zijn dat beschrijft wat er te zien is. LET OP: audiodescriptie wordt in Nederland meestal als LOSSE video gepubliceerd en niet als tweede audiospoor, dus "geen apart audiospoor" is geen afkeuring — zoek ook naar een variant met "audiodescriptie" in de titel${
              paginaTekstalternatief?.length ? ' — er staan kandidaten op de pagina, loop die na' : ''
            }. Bekijk de beeldjes op open ondertiteling: die staat in geen enkele gegevensbron en is de klassieke bron van onterechte bevindingen. Automatisch gegenereerde ondertiteling telt niet als ondertiteling.`,
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Loopt alle links af en bepaalt per link zijn toegankelijke naam. De meting voor SC 2.4.4.
 *
 * Dit criterium gaat over wat een schermlezer voorleest, niet over wat je op het scherm
 * ziet. Dat verschil is precies waar het misgaat: het icoon in een sociale-media-link staat
 * op `aria-hidden` en telt niet mee, een `sr-only`-span die je nergens ziet telt wél mee, en
 * een `title` die alleen bij aanwijzen met de muis verschijnt telt níet als voldoende naam.
 * Uit een schermafdruk is daar niets van af te leiden, en uit een blik in de HTML te weinig:
 * je moet de naam uitrekenen zoals de browser dat doet.
 *
 * De volgorde komt uit `wcag-regels/Shift2_Regels_SC_2_4_4.md`:
 *
 *   1. `aria-labelledby` -- de tekst van de elementen waarnaar verwezen wordt
 *   2. `aria-label`
 *   3. de tekst binnen de link, waarbij alles met `aria-hidden="true"` wegvalt, plus het
 *      tekstalternatief van een afbeelding erin
 *   4. `title` -- en een naam die HIER vandaan komt is onvoldoende en blijft een afkeuring
 *
 * Aanleiding: op heuvelrug.nl heeft de logolink alleen `title="Ga naar de homepage"` en een
 * afbeelding met een leeg tekstalternatief. De auditronde noteerde "in orde: het linkdoel is
 * duidelijk ondanks het lege tekstalternatief" en gaf 2.4.4 `voldoet` -- in strijd met de
 * eigen regel, en zonder dat er iets was nagemeten.
 *
 * WAT DIT NIET DOET: oordelen over de vraag of een naam duidelijk genoeg is. "Meer over
 * paspoorten" is een naam die een mens moet wegen. Wat hier uit komt zijn de mechanische
 * gevallen -- geen naam, alleen een title, een generieke tekst zonder context in hetzelfde
 * element, een telefoonnummer dat naar een webpagina wijst -- plus de volledige lijst, zodat
 * de rest te wegen valt.
 */
async function getLinks(url: string, flags: Flags) {
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  // Zelfde afbakening als de rest van het onderzoek: op de homepage telt de hele pagina,
  // elders alleen de main-content. Zie Shift2_Scope_Per_Sample.md.
  const isHome = isHomepageUrl(url);
  const heelDePagina = flags.scope ? flags.scope === 'pagina' : isHome;
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

      const gevonden = await page.evaluate((allesTelt: boolean) => {
        const main = allesTelt ? null : document.querySelector('main');
        const geenMain = !allesTelt && !main;
        const wortel = (main || document.body) as HTMLElement;

        const links: any[] = [];
        for (const a of Array.from(wortel.querySelectorAll('a'))) {
          const rect = a.getBoundingClientRect();
          const stijl = getComputedStyle(a);
          // Onzichtbaar is niet hetzelfde als afwezig: een skiplink staat buiten beeld maar
          // wordt wel voorgelezen en telt dus mee. Alleen wat echt niet bestaat voor
          // hulpsoftware valt af.
          if (stijl.display === 'none' || stijl.visibility === 'hidden') continue;
          if (a.getAttribute('aria-hidden') === 'true') continue;

          // De toegankelijke naam, in de volgorde van de regels.
          let naam = '';
          let bron = 'geen';

          const verwijzing = a.getAttribute('aria-labelledby');
          if (verwijzing) {
            const stukken: string[] = [];
            for (const id of verwijzing.split(/\s+/)) {
              const doel = document.getElementById(id);
              if (doel) stukken.push((doel.textContent || '').replace(/\s+/g, ' ').trim());
            }
            const samen = stukken.join(' ').trim();
            if (samen) {
              naam = samen;
              bron = 'aria-labelledby';
            }
          }

          if (!naam) {
            const label = (a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
            if (label) {
              naam = label;
              bron = 'aria-label';
            }
          }

          if (!naam) {
            // De tekst binnen de link, met alles wat verborgen is voor hulpsoftware eruit,
            // en met het tekstalternatief van een afbeelding erin. Geen benoemde
            // hulpfunctie hierbinnen: esbuild hangt daar __name aan.
            let tekst = '';
            let alt = '';
            const stapel: Node[] = Array.from(a.childNodes);
            let bekeken = 0;
            while (stapel.length && bekeken < 3000) {
              const knoop = stapel.pop()!;
              bekeken++;
              if (knoop.nodeType === 3) {
                tekst += ' ' + (knoop.textContent || '');
                continue;
              }
              if (knoop.nodeType !== 1) continue;
              const el = knoop as Element;
              if (el.getAttribute('aria-hidden') === 'true') continue;
              if (el.hasAttribute('hidden')) continue;
              const es = getComputedStyle(el);
              if (es.display === 'none' || es.visibility === 'hidden') continue;
              if (el.tagName === 'IMG') {
                alt += ' ' + (el.getAttribute('alt') || '');
                continue;
              }
              if (el.tagName === 'SVG' || el.tagName === 'svg') {
                const t = el.querySelector('title');
                if (t) alt += ' ' + (t.textContent || '');
                continue;
              }
              stapel.push(...Array.from(el.childNodes));
            }
            const samen = `${tekst} ${alt}`.replace(/\s+/g, ' ').trim();
            if (samen) {
              naam = samen;
              bron = tekst.trim() ? 'tekst in de link' : 'tekstalternatief van de afbeelding';
            }
          }

          if (!naam) {
            const title = (a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            if (title) {
              naam = title;
              bron = 'title';
            }
          }

          // De context: de tekst van het element waarin de link staat, zonder de link zelf.
          // De regels zijn hier streng -- een kop erboven die niet in hetzelfde element zit
          // geeft GEEN context -- dus alleen de eigen houder telt.
          let houder: Element | null = a.parentElement;
          while (houder && !/^(P|LI|TD|TH|DD|DT|FIGCAPTION|H1|H2|H3|H4|H5|H6)$/.test(houder.tagName)) {
            houder = houder.parentElement;
          }
          const houderTekst = houder
            ? (houder.textContent || '').replace(/\s+/g, ' ').trim()
            : '';
          const naamInHouder = houderTekst.replace(naam, '').trim();

          // Waar de link werkelijk heen gaat, uitgerekend door de browser. Nodig om de
          // logolink naar de eigen homepage te herkennen; die is een uitzondering.
          let naarEigenHomepage = false;
          try {
            const doelAdres = new URL((a as HTMLAnchorElement).href);
            naarEigenHomepage =
              doelAdres.origin === location.origin &&
              (doelAdres.pathname === '/' || doelAdres.pathname === '') &&
              !doelAdres.search;
          } catch {
            // Geen bruikbaar adres (mailto:, tel:, javascript:); dan is het geen logolink.
          }

          links.push({
            naam,
            bron,
            naarEigenHomepage,
            // Een subsite herken je aan een andere hostnaam dan de hoofdsite: duurzaam.,
            // open., mijn. Daar zegt "Ga naar de homepage" het verkeerde.
            //
            // Grens van deze herkenning: een hoofdsite die zelf op een subdomein staat
            // zonder www (gemeente.amsterdam.nl) telt hier ten onrechte als subsite. Dat
            // valt alleen op bij een logolink met alleen een title, en de melding vraagt om
            // een oordeel in plaats van er een te geven -- maar weet dat het kan gebeuren.
            opEenSubsite: /^(?!www\.)[a-z0-9-]+\.[a-z0-9-]+\.[a-z.]+$/i.test(location.hostname),
            bevatAlleenEenAfbeelding: !a.textContent?.trim() && !!a.querySelector('img, svg'),
            href: (a.getAttribute('href') || '').slice(0, 200),
            doel: a.getAttribute('target') || null,
            zichtbaar: rect.width > 0 && rect.height > 0,
            houder: houder ? houder.tagName.toLowerCase() : null,
            // Alleen wat er nog meer in dezelfde houder staat. Is dat leeg, dan staat de
            // link daar in zijn eentje en is er geen context in hetzelfde element.
            contextInHouder: naamInHouder.slice(0, 160),
            plek: Math.round(rect.top + window.scrollY),
          });
        }
        return { links, geenMain, aantalOpDePagina: document.querySelectorAll('a').length };
      }, heelDePagina);

      // De schifting gebeurt in Node, niet in de pagina: hier is hij te lezen en te
      // veranderen zonder dat er een browser aan te pas komt.
      const GENERIEK =
        /^(lees meer|meer|meer info(rmatie)?|meer lezen|lees verder|verder|klik hier|hier|klik|bekijk|bekijk hier|download|link|deze pagina|read more|click here|more)\.?$/i;
      const TELEFOON = /^[\d\s().+/-]{8,}$/;
      const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
      const WEBADRES = /^(https?:\/\/|www\.)/i;
      const PLATFORM = /facebook|instagram|linkedin|youtube|twitter|x\.com|mastodon|tiktok|whatsapp/i;

      const links = gevonden.links.map((l: any) => {
        const naam = (l.naam || '').trim();
        const href = l.href || '';
        const platformInHref = (href.match(PLATFORM) || [])[0]?.toLowerCase() ?? null;
        const platformNaam = /^(facebook|instagram|linkedin|youtube|twitter|x|mastodon|tiktok)$/i.test(
          naam
        );
        return {
          ...l,
          // Geen naam: hulpsoftware kondigt de link aan zonder te kunnen zeggen waarheen.
          // Ook een afkeuring onder 4.1.2; dat zijn twee aparte bevindingen.
          geenNaam: !naam,
          // Een naam die alleen uit title komt is niet automatisch fout en niet automatisch
          // goed. De vraag is of hij zijn werk doet: zegt hij waar de link heen gaat?
          //
          // De logolink naar de eigen homepage is de bekende uitzondering: naam, rol en
          // waarde zijn er, en "Ga naar de homepage" dekt de bestemming. Op een SUBSITE
          // dekt diezelfde title de bestemming juist niet -- de bezoeker denkt naar de
          // hoofdsite te gaan. Die regel is op 18 augustus 2026 vastgelegd in
          // Shift2_Regels_SC_4_1_2.md; dit commando keurde het logo van elke gemeentesite
          // af zolang het die uitzondering niet kende.
          naamAlleenUitTitle: !!naam && l.bron === 'title',
          logolinkNaarDeEigenHomepage:
            !!naam &&
            l.bron === 'title' &&
            l.naarEigenHomepage &&
            l.bevatAlleenEenAfbeelding &&
            !l.opEenSubsite,
          titelNaamOpEenSubsite:
            !!naam && l.bron === 'title' && l.naarEigenHomepage && l.opEenSubsite,
          // Een naam die alleen het linktype noemt is geen naam voor de link.
          naamNoemtAlleenHetLinktype:
            !!naam && /^\(?(externe link|nieuw venster|pdf|link|document|download)\)?\.?$/i.test(naam),
          // Generiek, en de vraag is dan of er context in HETZELFDE element staat.
          generiek: GENERIEK.test(naam),
          zonderContextInHetzelfdeElement: GENERIEK.test(naam) && !l.contextInHouder,
          // Alleen de platformnaam bij een link naar een organisatiepagina.
          socialeMediaZonderOrganisatie: platformNaam && !!platformInHref,
          // Naam noemt een ander platform dan de bestemming.
          platformKlopptNietMetBestemming:
            !!platformInHref &&
            PLATFORM.test(naam) &&
            !naam.toLowerCase().includes(platformInHref.replace('.com', '')),
          // Een telefoonnummer of e-mailadres als tekst hoort te bellen of te mailen. Wijst
          // het naar een échte andere bestemming, dan voorspelt de tekst het verkeerde doel.
          //
          // Een leeg adres, een `#` of een `javascript:`-koppeling telt daar NIET onder. Het
          // scharnier zit bij de bedoeling en niet bij de techniek: zo'n link is nog steeds
          // bedoeld om te bellen en de koppeling is stuk, en dat is een functioneel probleem
          // (Shift2_Regels_SC_2_4_4.md). Zonder deze uitzondering leverde heuvelrug.nl twee
          // afkeuringen op voor twee telefoonnummers met href="/#".
          belofteKloptNiet:
            !/^(#|\/#|javascript:|)$/i.test(href.trim()) &&
            ((TELEFOON.test(naam) && !/^tel:/i.test(href)) ||
              (EMAIL.test(naam) && !/^mailto:/i.test(href))),
          // Wel melden, apart: een belknop die nergens heen gaat is iets om na te lopen,
          // alleen niet onder dit criterium.
          belofteZonderWerkendeKoppeling:
            /^(#|\/#|javascript:|)$/i.test(href.trim()) && (TELEFOON.test(naam) || EMAIL.test(naam)),
          naamIsEenWebadres: WEBADRES.test(naam),
        };
      });

      // Dezelfde naam naar verschillende bestemmingen: dan zegt de naam niet waar je
      // uitkomt. Een signaal, geen automatische afkeuring -- twee keer "Aanvragen" onder
      // twee koppen kan in orde zijn.
      const perNaam = new Map<string, Set<string>>();
      for (const l of links) {
        if (!l.naam) continue;
        const sleutel = l.naam.toLowerCase();
        if (!perNaam.has(sleutel)) perNaam.set(sleutel, new Set());
        perNaam.get(sleutel)!.add(l.href);
      }
      const dubbelzinnig = Array.from(perNaam.entries())
        .filter(([, hrefs]) => hrefs.size > 1)
        .map(([naam, hrefs]) => ({ naam, bestemmingen: Array.from(hrefs).slice(0, 6) }))
        .slice(0, 15);

      const telling = {
        links: links.length,
        zonderNaam: links.filter((l: any) => l.geenNaam).length,
        naamAlleenUitTitle: links.filter((l: any) => l.naamAlleenUitTitle).length,
        waarvanDeLogolinkNaarDeHomepage: links.filter((l: any) => l.logolinkNaarDeEigenHomepage)
          .length,
        titelNaamOpEenSubsite: links.filter((l: any) => l.titelNaamOpEenSubsite).length,
        naamNoemtAlleenHetLinktype: links.filter((l: any) => l.naamNoemtAlleenHetLinktype).length,
        generiek: links.filter((l: any) => l.generiek).length,
        generiekZonderContext: links.filter((l: any) => l.zonderContextInHetzelfdeElement).length,
        socialeMediaZonderOrganisatie: links.filter((l: any) => l.socialeMediaZonderOrganisatie)
          .length,
        platformKlopptNiet: links.filter((l: any) => l.platformKlopptNietMetBestemming).length,
        belofteKloptNiet: links.filter((l: any) => l.belofteKloptNiet).length,
        naamIsEenWebadres: links.filter((l: any) => l.naamIsEenWebadres).length,
        belknopZonderWerkendeKoppeling: links.filter((l: any) => l.belofteZonderWerkendeKoppeling)
          .length,
        dezelfdeNaamAndereBestemming: dubbelzinnig.length,
      };
      const opvallend = links.filter(
        (l: any) =>
          l.geenNaam ||
          (l.naamAlleenUitTitle && !l.logolinkNaarDeEigenHomepage) ||
          l.naamNoemtAlleenHetLinktype ||
          l.zonderContextInHetzelfdeElement ||
          l.socialeMediaZonderOrganisatie ||
          l.platformKlopptNietMetBestemming ||
          l.belofteKloptNiet ||
          l.naamIsEenWebadres
      );

      const opname = await legOpnameVast(page, page.url(), 'links');

      const dir = ensureOutputDir();
      const stempel = timestamp();
      const naamBestand = slugifyUrl(page.url());
      let overzicht: string | null = path.join(dir, `${stempel}-${naamBestand}-links.txt`);
      try {
        const regels = [
          `LINKS EN HUN TOEGANKELIJKE NAAM — ${page.url()}`,
          `Gemeten: ${new Date().toLocaleString('nl-NL')} · ${
            session.mode === 'cdp' ? 'auditsessie' : 'headless'
          }`,
          `Gebied: ${
            gevonden.geenMain
              ? 'hele pagina (er is geen main)'
              : heelDePagina
              ? 'hele pagina'
              : 'main-content'
          } · ${links.length} van de ${gevonden.aantalOpDePagina} links op de pagina`,
          '',
          'OPVALLEND',
          ...(opvallend.length
            ? opvallend.map(
                (l: any) =>
                  `  ${
                    l.geenNaam
                      ? 'GEEN NAAM  '
                      : l.naamAlleenUitTitle
                      ? 'ALLEEN TITLE'
                      : l.belofteKloptNiet
                      ? 'BELOFTE    '
                      : l.socialeMediaZonderOrganisatie
                      ? 'PLATFORM   '
                      : l.platformKlopptNietMetBestemming
                      ? 'MISMATCH   '
                      : l.naamIsEenWebadres
                      ? 'WEBADRES   '
                      : 'GENERIEK   '
                  } "${l.naam}" [${l.bron}] → ${l.href}${
                    l.contextInHouder ? ` · context: "${l.contextInHouder}"` : ' · geen context in hetzelfde element'
                  }`
              )
            : ['  niets']),
          '',
          'DEZELFDE NAAM, ANDERE BESTEMMING',
          ...(dubbelzinnig.length
            ? dubbelzinnig.map((d) => `  "${d.naam}" → ${d.bestemmingen.join(' | ')}`)
            : ['  geen']),
          '',
          'ALLE LINKS (naam [bron] → href)',
          ...links.map(
            (l: any) => `  "${l.naam}" [${l.bron}] → ${l.href}`
          ),
        ];
        fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
      } catch {
        overzicht = null;
      }

      const stapZin = (() => {
        const waar = gevonden.geenMain
          ? 'de hele pagina (er is geen main)'
          : heelDePagina
          ? 'de hele pagina'
          : 'de main-content';
        const delen: string[] = [];
        if (telling.zonderNaam) delen.push(`${telling.zonderNaam} zonder enige naam`);
        const titelZonderUitzondering =
          telling.naamAlleenUitTitle - telling.waarvanDeLogolinkNaarDeHomepage;
        if (titelZonderUitzondering > 0)
          delen.push(
            `${titelZonderUitzondering} met een naam die alleen uit title komt (dekt die de bestemming?)`
          );
        if (telling.titelNaamOpEenSubsite)
          delen.push(
            `${telling.titelNaamOpEenSubsite} logolink op een subsite met een title die de hoofdsite belooft`
          );
        if (telling.naamNoemtAlleenHetLinktype)
          delen.push(`${telling.naamNoemtAlleenHetLinktype} die alleen het linktype noemt`);
        if (telling.generiekZonderContext)
          delen.push(
            `${telling.generiekZonderContext} met een generieke tekst zonder context in hetzelfde element`
          );
        if (telling.socialeMediaZonderOrganisatie)
          delen.push(
            `${telling.socialeMediaZonderOrganisatie} sociale-media-link${
              telling.socialeMediaZonderOrganisatie === 1 ? '' : 's'
            } met alleen de platformnaam`
          );
        if (telling.belofteKloptNiet)
          delen.push(
            `${telling.belofteKloptNiet} waarvan de tekst een ander doel belooft dan de bestemming`
          );
        if (telling.naamIsEenWebadres)
          delen.push(`${telling.naamIsEenWebadres} met een webadres als naam`);
        return `Alle ${links.length} links in ${waar} afgelopen en per link de toegankelijke naam uitgerekend zoals een schermlezer die opbouwt: aria-labelledby, dan aria-label, dan de tekst zonder wat op aria-hidden staat, dan title. ${
          delen.length
            ? `Opvallend: ${delen.join('; ')}.`
            : 'Elke link heeft een naam die niet uit title alleen komt, en geen generieke tekst staat zonder context in hetzelfde element.'
        }${
          telling.dezelfdeNaamAndereBestemming
            ? ` ${telling.dezelfdeNaamAndereBestemming} namen komen meer dan eens voor met een andere bestemming.`
            : ''
        }`;
      })();

      legVast({
        commando: 'get-links',
        stap: stapZin,
        argumenten: {
          ...(klik ? { klik } : {}),
          ...(flags.scope ? { scope: flags.scope } : {}),
        },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: opname,
        artefact: overzicht,
        criteria: ['2.4.4'],
        uitkomst: telling,
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gebied: gevonden.geenMain
          ? 'hele pagina (er is geen main)'
          : heelDePagina
          ? 'hele pagina'
          : 'main-content',
        links_beoordeeld: links.length,
        links_op_de_hele_pagina: gevonden.aantalOpDePagina,
        telling,
        opvallend: opvallend.slice(0, 40).map((l: any) => ({
          naam: l.naam,
          bron: l.bron,
          href: l.href,
          context_in_hetzelfde_element: l.contextInHouder || null,
          waarom: [
            l.geenNaam ? 'geen naam' : null,
            l.titelNaamOpEenSubsite
              ? 'title zegt homepage, maar dit is een subsite'
              : l.naamAlleenUitTitle
              ? 'naam komt alleen uit title -- dekt hij de bestemming?'
              : null,
            l.naamNoemtAlleenHetLinktype ? 'noemt alleen het linktype' : null,
            l.zonderContextInHetzelfdeElement ? 'generieke tekst zonder context' : null,
            l.socialeMediaZonderOrganisatie ? 'alleen de platformnaam' : null,
            l.platformKlopptNietMetBestemming ? 'naam noemt een ander platform' : null,
            l.belofteKloptNiet ? 'tekst belooft een ander doel dan de bestemming' : null,
            l.naamIsEenWebadres ? 'webadres als naam' : null,
          ].filter(Boolean),
        })),
        dezelfde_naam_andere_bestemming: dubbelzinnig,
        schermafdruk: opname,
        overzicht,
        belknoppen_zonder_werkende_koppeling: links
          .filter((l: any) => l.belofteZonderWerkendeKoppeling)
          .map((l: any) => ({ naam: l.naam, href: l.href })),
        let_op:
          'Uitgerekend, niet geoordeeld. Een link zonder enige naam is een afkeuring, en bovendien een aparte bevinding onder 4.1.2. Een naam die alleen uit title komt is dat NIET automatisch: de vraag is of hij de bestemming dekt. De logolink naar de eigen homepage met "Ga naar de homepage" voldoet en staat daarom apart geteld; dezelfde link op een subsite is wel een afkeuring. Bij een generieke tekst beslist de context IN HETZELFDE ELEMENT: een kop erboven telt niet. De rest van de lijst staat in het overzicht, want een naam als "Meer over paspoorten" moet een mens wegen.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * Vergelijkt per bedieningselement de zichtbare tekst met de toegankelijke naam. De meting
 * voor SC 2.5.3.
 *
 * De kern van dit criterium is één vergelijking: wat er op de knop staat, moet vóórkomen in
 * de naam die hulpsoftware voorleest. Wie met spraak bedient zegt "klik zoeken"; staat er in
 * de code `aria-label="Vind informatie op deze site"`, dan gebeurt er niets.
 *
 * `Shift2_Regels_SC_2_5_3.md` schrijft deze meting al voor en verwees naar een los script in
 * `tmp/`. Die map wordt opgeruimd, en daarmee verdween het gereedschap; op de kaart stond
 * daardoor twintig keer een oordeel zonder vergelijking eronder. Vandaar dit commando.
 *
 * De twee gevallen die de vergelijking NIET dekt, worden apart geteld en genoemd, want die
 * horen volgens de regels naar de onderzoeker te gaan in plaats van stilzwijgend als
 * "voldoet" te eindigen:
 *
 *   - een zichtbaar label dat in een afbeelding staat; die tekst is niet uit te lezen
 *   - een samengestelde `aria-labelledby` (meerdere verwijzingen, of een verwijzing naar een
 *     element dat zelf een `aria-label` heeft)
 *
 * Elementen zonder zichtbare tekst -- alleen een pictogram -- vallen buiten 2.5.3. Dat is
 * een kwestie van 4.1.2 en wordt hier alleen geteld.
 */
async function getLabelInNaam(url: string, flags: Flags) {
  const klik = flags.klik && flags.klik !== 'true' ? flags.klik : null;
  const isHome = isHomepageUrl(url);
  const heelDePagina = flags.scope ? flags.scope === 'pagina' : isHome;
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

      // Wachten tot de bediening compleet is.
      //
      // Widgets van derden komen later binnen dan de pagina zelf: de voorleesbalk van
      // ReadSpeaker stond er pas na een seconde of drie. Wie meteen leest, meet een pagina
      // zonder die knoppen en meldt "geen mismatches" over een deel van het scherm. Tellen
      // tot het aantal twee keer achter elkaar gelijk is.
      let vorigAantal = -1;
      for (let poging = 0; poging < 10; poging++) {
        const nu = await page
          .evaluate(
            () =>
              document.querySelectorAll(
                'button, a[href], [role="button"], [role="link"], input, select, textarea, summary'
              ).length
          )
          .catch(() => vorigAantal);
        if (nu === vorigAantal) break;
        vorigAantal = nu;
        await new Promise((r) => setTimeout(r, 700));
      }

      const gevonden = await page.evaluate((allesTelt: boolean) => {
        const main = allesTelt ? null : document.querySelector('main');
        const geenMain = !allesTelt && !main;
        const wortel = (main || document.body) as HTMLElement;

        const KIEZER =
          'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="radio"], input, select, textarea, summary';

        const elementen: any[] = [];
        for (const el of Array.from(wortel.querySelectorAll(KIEZER))) {
          const soort = (el.getAttribute('type') || '').toLowerCase();
          if (el.tagName === 'INPUT' && (soort === 'hidden' || soort === 'image')) continue;
          const rect = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
          if (el.getAttribute('aria-hidden') === 'true') continue;

          // De zichtbare tekst: wat een ziende gebruiker leest. Alles wat voor het oog
          // verborgen is valt eruit, en alles wat voor hulpsoftware verborgen is ook.
          let zichtbaar = '';
          let labelInAfbeelding = false;
          let afbeelding: any = null;
          let isLogo = false;
          let logoZonderAlt = false;
          const stapel: Node[] = Array.from(el.childNodes);
          let bekeken = 0;
          while (stapel.length && bekeken < 3000) {
            const knoop = stapel.pop()!;
            bekeken++;
            if (knoop.nodeType === 3) {
              // Meet wat de tekst werkelijk in beeld inneemt. Tekst kan onzichtbaar zijn
              // zonder dat er een span omheen zit: de zoekknop van heuvelrug.nl heeft
              // `font-size: 0` en het woord "Zoeken" rendert op nul bij nul. Dat als
              // zichtbaar label tellen zou 2.5.3 van toepassing verklaren op een knop die
              // alleen een pictogram toont -- en bij een afwijkende aria-label zou daar
              // een afkeuring uit komen die er niet is.
              if (!(knoop.textContent || '').trim()) continue;
              const bereik = document.createRange();
              bereik.selectNodeContents(knoop);
              const tr = bereik.getBoundingClientRect();
              if (tr.width <= 0 || tr.height <= 0) continue;
              zichtbaar += ' ' + (knoop.textContent || '');
              continue;
            }
            if (knoop.nodeType !== 1) continue;
            const kind = knoop as Element;
            if (kind.getAttribute('aria-hidden') === 'true') continue;
            const ks = getComputedStyle(kind);
            if (ks.display === 'none' || ks.visibility === 'hidden') continue;
            const krect = kind.getBoundingClientRect();
            const klasse = kind.getAttribute('class') || '';
            // Visueel verborgen tekst leest een schermlezer wel voor, maar een ziende
            // gebruiker ziet hem niet. Voor 2.5.3 telt hij dus niet als zichtbaar label.
            const weggestopt =
              /sr-only|visually-hidden|visuallyhidden|screen-?reader|hidden-visually/i.test(klasse) ||
              krect.width <= 1 ||
              krect.height <= 1 ||
              krect.right < 0 ||
              krect.left < -999 ||
              /inset\(50%\)|rect\(0(px)?, ?0(px)?, ?0(px)?, ?0(px)?\)/.test(ks.clipPath + ks.clip);
            if (weggestopt) continue;
            if (kind.tagName === 'IMG') {
              // Staat de knoptekst in een plaatje, dan is die tekst niet uit te lezen en
              // moet een mens ernaar kijken.
              //
              // Een leeg `alt` betekent NIET dat er geen tekst in staat. Het logo van
              // heuvelrug.nl heeft `alt=""` en toont "GEMEENTE UTRECHTSE HEUVELRUG"; de
              // link eromheen heet "Ga naar de homepage". Wie hier op het alt afgaat, ziet
              // het beeldmerk van elke gemeentesite over het hoofd. Daarom de afmeting: een
              // woordmerk is breed, een pictogram niet.
              const ir = kind.getBoundingClientRect();
              if ((kind.getAttribute('alt') || '').trim() || ir.width >= 60) {
                labelInAfbeelding = true;
                afbeelding = {
                  alt: kind.getAttribute('alt') || '',
                  bron: (kind.getAttribute('src') || '').slice(0, 120),
                  maat: `${Math.round(ir.width)}x${Math.round(ir.height)}`,
                };
                // Een logo dat de organisatienaam toont met een LEEG tekstalternatief is
                // een afkeuring, ook hier: de zichtbare tekst is het woordmerk, en met een
                // leeg alt komt die nergens in de naam terecht -- die komt dan uit de title
                // van de link en zegt iets anders. Krijgt het logo wel een alt, dan wordt
                // dat de naam en is 2.5.3 vanzelf hersteld; dan is het hier alleen nog een
                // geval om naar te kijken, want wat er in het plaatje staat is niet te
                // lezen. Vastgelegd door Frits op 2026-08-20; zie Shift2_Regels_SC_2_5_3.md.
                let naarDeEigenHomepage = false;
                try {
                  const a = el.closest('a') as HTMLAnchorElement | null;
                  if (a) {
                    const u = new URL(a.href);
                    naarDeEigenHomepage =
                      u.origin === location.origin && (u.pathname === '/' || u.pathname === '');
                  }
                } catch {
                  // Geen bruikbaar adres; dan is het geen logolink.
                }
                const noemtZichLogo = /logo/i.test(
                  `${kind.getAttribute('src') || ''} ${kind.getAttribute('class') || ''} ${
                    kind.getAttribute('alt') || ''
                  }`
                );
                if (naarDeEigenHomepage || noemtZichLogo) isLogo = true;
                if (isLogo && !(kind.getAttribute('alt') || '').trim()) logoZonderAlt = true;
              }
              continue;
            }
            if (kind.tagName.toLowerCase() === 'svg') continue;
            stapel.push(...Array.from(kind.childNodes));
          }
          zichtbaar = zichtbaar.replace(/\s+/g, ' ').trim();

          // Bij een formulierveld is het zichtbare label het gekoppelde <label>.
          let labelTekst = '';
          if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
            const id = el.getAttribute('id');
            const bij = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
            const om = el.closest('label');
            const bron = bij || om;
            if (bron) labelTekst = (bron.textContent || '').replace(/\s+/g, ' ').trim();
            if (!zichtbaar) zichtbaar = labelTekst;
          }

          // De toegankelijke naam, in de volgorde uit de regels.
          let naam = '';
          let naamBron = 'geen';
          let samengesteldeVerwijzing = false;
          const verwijzing = el.getAttribute('aria-labelledby');
          if (verwijzing) {
            const ids = verwijzing.split(/\s+/).filter(Boolean);
            const stukken: string[] = [];
            for (const id of ids) {
              const doel = document.getElementById(id);
              if (!doel) continue;
              if (doel.getAttribute('aria-label')) samengesteldeVerwijzing = true;
              stukken.push((doel.textContent || '').replace(/\s+/g, ' ').trim());
            }
            if (ids.length > 1) samengesteldeVerwijzing = true;
            const samen = stukken.join(' ').trim();
            if (samen) {
              naam = samen;
              naamBron = 'aria-labelledby';
            }
          }
          if (!naam) {
            const l = (el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
            if (l) {
              naam = l;
              naamBron = 'aria-label';
            }
          }
          if (!naam && labelTekst) {
            naam = labelTekst;
            naamBron = 'gekoppeld label';
          }
          if (!naam) {
            let inhoud = '';
            const s2: Node[] = Array.from(el.childNodes);
            let b2 = 0;
            while (s2.length && b2 < 3000) {
              const k = s2.pop()!;
              b2++;
              if (k.nodeType === 3) {
                inhoud += ' ' + (k.textContent || '');
                continue;
              }
              if (k.nodeType !== 1) continue;
              const kind = k as Element;
              if (kind.getAttribute('aria-hidden') === 'true') continue;
              if (kind.tagName === 'IMG') {
                inhoud += ' ' + (kind.getAttribute('alt') || '');
                continue;
              }
              s2.push(...Array.from(kind.childNodes));
            }
            const samen = inhoud.replace(/\s+/g, ' ').trim();
            if (samen) {
              naam = samen;
              naamBron = 'inhoud van het element';
            }
          }
          if (!naam) {
            const t = (el.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            if (t) {
              naam = t;
              naamBron = 'title';
            }
          }
          if (!naam && el.tagName === 'INPUT') {
            const p = (el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim();
            if (p) {
              naam = p;
              naamBron = 'placeholder';
            }
          }

          elementen.push({
            element:
              el.tagName.toLowerCase() +
              (soort ? `[type=${soort}]` : '') +
              (el.getAttribute('id') ? `#${el.getAttribute('id')}` : ''),
            zichtbaar,
            naam,
            naamBron,
            labelInAfbeelding,
            isLogo,
            logoZonderAlt,
            afbeelding,
            samengesteldeVerwijzing,
            inBeeld: rect.width > 0 && rect.height > 0,
          });
        }
        return { elementen, geenMain };
      }, heelDePagina);

      // Normaliseren zoals de regels voorschrijven: hoofdletters, dubbele spaties, harde
      // spaties en aanhalingstekens. Het rekenwerk in Node, zodat het hier na te lezen is.
      const kaal = (t: string) =>
        (t || '')
          .replace(/ /g, ' ')
          .replace(/[’‘'"“”]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

      const alles = gevonden.elementen;
      const metZichtbareTekst = alles.filter((e: any) => e.zichtbaar);
      const zonderZichtbareTekst = alles.length - metZichtbareTekst.length;
      const beoordeeld = metZichtbareTekst.map((e: any) => ({
        ...e,
        past: kaal(e.naam).includes(kaal(e.zichtbaar)),
        // Voor spraakbesturing helpt het als de zichtbare tekst vooraan staat. Geen eis
        // van 2.5.3, dus alleen ter informatie.
        vooraan: kaal(e.naam).startsWith(kaal(e.zichtbaar)),
      }));
      // Een logo met een leeg tekstalternatief telt als mismatch: de zichtbare tekst is
      // het woordmerk en die staat nergens in de naam. Zie Shift2_Regels_SC_2_5_3.md.
      const mismatches = [
        ...beoordeeld.filter((e: any) => !e.past && !e.samengesteldeVerwijzing),
        ...alles.filter((e: any) => !e.zichtbaar && e.logoZonderAlt),
      ];
      // Ook de elementen zonder zichtbare tekst maar mét een afbeelding die tekst kan
      // bevatten. Die vallen buiten de vergelijking en horen juist daarom genoemd te
      // worden: het logo van heuvelrug.nl toont de organisatienaam en heet "Ga naar de
      // homepage".
      const nietTeVergelijken = [
        ...beoordeeld.filter(
          (e: any) => e.samengesteldeVerwijzing || (e.labelInAfbeelding && !e.logoZonderAlt)
        ),
        ...alles
          .filter((e: any) => !e.zichtbaar && e.labelInAfbeelding && !e.logoZonderAlt)
          .map((e: any) => ({ ...e, past: false })),
      ];

      const opname = await legOpnameVast(page, page.url(), 'labelinnaam');
      const dir = ensureOutputDir();
      const stempel = timestamp();
      const naamBestand = slugifyUrl(page.url());
      let overzicht: string | null = path.join(dir, `${stempel}-${naamBestand}-labelinnaam.txt`);
      try {
        const regels = [
          `LABEL IN NAAM — ${page.url()}`,
          `Gemeten: ${new Date().toLocaleString('nl-NL')} · ${
            session.mode === 'cdp' ? 'auditsessie' : 'headless'
          }`,
          `Gebied: ${
            gevonden.geenMain ? 'hele pagina (er is geen main)' : heelDePagina ? 'hele pagina' : 'main-content'
          }`,
          `Bedieningselementen: ${alles.length} · met zichtbare tekst: ${metZichtbareTekst.length} · alleen een pictogram: ${zonderZichtbareTekst}`,
          '',
          'MISMATCHES (zichtbare tekst komt niet voor in de naam)',
          ...(mismatches.length
            ? mismatches.map(
                (e: any) => `  ${e.element}: ziet "${e.zichtbaar}" — heet "${e.naam}" [${e.naamBron}]`
              )
            : ['  geen']),
          '',
          'NIET TE VERGELIJKEN — hoort naar de onderzoeker',
          ...(nietTeVergelijken.length
            ? nietTeVergelijken.map(
                (e: any) =>
                  `  ${e.element}: ${
                    e.labelInAfbeelding ? 'label staat in een afbeelding' : 'samengestelde aria-labelledby'
                  } — ziet "${e.zichtbaar}", heet "${e.naam}"`
              )
            : ['  geen']),
          '',
          'ALLE ELEMENTEN MET ZICHTBARE TEKST (ziet → heet [bron])',
          ...beoordeeld.map(
            (e: any) =>
              `  ${e.past ? 'ok    ' : 'MIS   '} "${e.zichtbaar}" → "${e.naam}" [${e.naamBron}]${
                e.past && !e.vooraan ? ' (niet vooraan)' : ''
              }`
          ),
        ];
        fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
      } catch {
        overzicht = null;
      }

      const stapZin = (() => {
        const waar = gevonden.geenMain
          ? 'de hele pagina (er is geen main)'
          : heelDePagina
          ? 'de hele pagina'
          : 'de main-content';
        const staart = mismatches.length
          ? `${mismatches.length} keer komt de zichtbare tekst niet voor in de naam: ${mismatches
              .slice(0, 5)
              .map((e: any) => `"${e.zichtbaar}" heet "${e.naam}"`)
              .join('; ')}.`
          : 'Bij alle vergeleken elementen komt de zichtbare tekst voor in de naam.';
        const rest = nietTeVergelijken.length
          ? ` ${nietTeVergelijken.length} ${
              nietTeVergelijken.length === 1 ? 'element is' : 'elementen zijn'
            } niet automatisch te vergelijken (label in een afbeelding of een samengestelde aria-labelledby); die horen met de hand nagekeken te worden.`
          : '';
        return `In ${waar} ${alles.length} bedieningselementen bekeken; ${metZichtbareTekst.length} hebben zichtbare tekst en ${zonderZichtbareTekst} tonen alleen een pictogram en vallen buiten dit criterium. Per element de zichtbare tekst vergeleken met de toegankelijke naam. ${staart}${rest}`;
      })();

      const beslist = nietTeVergelijken.length === 0;

      legVast({
        commando: 'get-labelinnaam',
        stap: stapZin,
        argumenten: { ...(klik ? { klik } : {}), ...(flags.scope ? { scope: flags.scope } : {}) },
        url: gevraagdeUrl,
        eindUrl,
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        weergave: klik ? `na klikken op ${klik}` : 'standaardweergave',
        schermafdruk: opname,
        artefact: overzicht,
        criteria: ['2.5.3'],
        uitkomst: {
          bedieningselementen: alles.length,
          metZichtbareTekst: metZichtbareTekst.length,
          alleenEenPictogram: zonderZichtbareTekst,
          mismatches: mismatches.length,
          nietTeVergelijken: nietTeVergelijken.length,
          logoZonderTekstalternatief: alles.filter((e: any) => e.logoZonderAlt).length,
          beslist,
        },
      });

      print({
        url: page.url(),
        browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
        omgeleid,
        gebied: gevonden.geenMain
          ? 'hele pagina (er is geen main)'
          : heelDePagina
          ? 'hele pagina'
          : 'main-content',
        bedieningselementen: alles.length,
        met_zichtbare_tekst: metZichtbareTekst.length,
        alleen_een_pictogram: zonderZichtbareTekst,
        mismatches: mismatches.map((e: any) => ({
          element: e.element,
          ziet: e.logoZonderAlt ? 'het woordmerk in het logo (afbeelding met leeg alt)' : e.zichtbaar,
          heet: e.naam,
          naam_uit: e.naamBron,
          ...(e.logoZonderAlt ? { afbeelding: e.afbeelding, ook_onder: '1.1.1' } : {}),
        })),
        niet_te_vergelijken: nietTeVergelijken.map((e: any) => ({
          element: e.element,
          reden: e.labelInAfbeelding
            ? 'label staat in een afbeelding'
            : 'samengestelde aria-labelledby',
          ziet: e.zichtbaar,
          heet: e.naam,
        })),
        zichtbare_tekst_niet_vooraan: beoordeeld
          .filter((e: any) => e.past && !e.vooraan)
          .map((e: any) => ({ ziet: e.zichtbaar, heet: e.naam })),
        schermafdruk: opname,
        overzicht,
        beslist,
        let_op: mismatches.length
          ? 'Een mismatch is een afkeuring: wie met spraak bedient kan het element niet activeren met wat hij ziet staan. Leg de zichtbare tekst en de naam naast elkaar voordat je schrijft.'
          : nietTeVergelijken.length
          ? 'Geen mismatch in wat te vergelijken viel, maar er staan elementen tussen die deze meting niet dekt. Kijk die met de hand na in de toegankelijkheidsboom; laat 2.5.3 niet stilzwijgend op voldoet staan.'
          : 'Bij elk element met zichtbare tekst komt die tekst voor in de naam. Elementen met alleen een pictogram vallen buiten 2.5.3; die horen bij 4.1.2. Staat de zichtbare tekst niet vooraan in de naam, dan is dat geen afkeuring maar wel lastiger voor spraakbesturing.',
      });
    } finally {
      await cleanup();
    }
  } finally {
    await session.dispose();
  }
}

/**
 * De onderdelen op een pagina, met hun toegankelijke naam en een sleutel om ze op
 * verschillende pagina's terug te vinden.
 *
 * Gebruikt door `get-consistentie`, dat pagina's naast elkaar legt. De sleutel is het punt:
 * om te kunnen zeggen dat "hetzelfde onderdeel" op twee pagina's anders heet, moet je eerst
 * kunnen bepalen dat het hetzelfde onderdeel ís.
 *
 *   - een link herken je aan zijn bestemming. Twee links naar /contact zijn hetzelfde
 *     onderdeel, hoe ze ook heten. Dat is de sterkste sleutel die er is.
 *   - een knop heeft geen bestemming. Daar is het zijn `id`, en anders zijn klassenaam uit
 *     het sjabloon. Dat is zwakker: het is code-identiteit en geen functie-identiteit, en zo
 *     wordt het ook gemeld.
 */
async function leesOnderdelen(page: any, alleenMain: boolean): Promise<any> {
  return page.evaluate((mainOnly: boolean) => {
    const main = mainOnly ? document.querySelector('main') : null;
    const geenMain = mainOnly && !main;
    const wortel = (main || document.body) as HTMLElement;

    const uit: any[] = [];
    let zonderBestemming = 0;
    for (const el of Array.from(
      wortel.querySelectorAll('a[href], button, [role="button"], input[type="submit"], summary')
    )) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;

      // De toegankelijke naam, in de volgorde uit Shift2_Regels_SC_2_4_4.md.
      let naam = '';
      let bron = 'geen';
      const verwijzing = el.getAttribute('aria-labelledby');
      if (verwijzing) {
        const stukken: string[] = [];
        for (const id of verwijzing.split(/\s+/)) {
          const doel = document.getElementById(id);
          if (doel) stukken.push((doel.textContent || '').replace(/\s+/g, ' ').trim());
        }
        const samen = stukken.join(' ').trim();
        if (samen) {
          naam = samen;
          bron = 'aria-labelledby';
        }
      }
      if (!naam) {
        const l = (el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        if (l) {
          naam = l;
          bron = 'aria-label';
        }
      }
      if (!naam) {
        let tekst = '';
        let alt = '';
        const stapel: Node[] = Array.from(el.childNodes);
        let bekeken = 0;
        while (stapel.length && bekeken < 3000) {
          const knoop = stapel.pop()!;
          bekeken++;
          if (knoop.nodeType === 3) {
            tekst += ' ' + (knoop.textContent || '');
            continue;
          }
          if (knoop.nodeType !== 1) continue;
          const kind = knoop as Element;
          if (kind.getAttribute('aria-hidden') === 'true') continue;
          if (kind.tagName === 'IMG') {
            alt += ' ' + (kind.getAttribute('alt') || '');
            continue;
          }
          stapel.push(...Array.from(kind.childNodes));
        }
        const samen = `${tekst} ${alt}`.replace(/\s+/g, ' ').trim();
        if (samen) {
          naam = samen;
          bron = tekst.trim() ? 'tekst in het element' : 'tekstalternatief van de afbeelding';
        }
      }
      if (!naam) {
        const t = (el.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
        if (t) {
          naam = t;
          bron = 'title';
        }
      }

      // De sleutel waarop dit onderdeel op een andere pagina terug te vinden is.
      // In welk deel van de pagina het staat.
      //
      // Twee links naar dezelfde bestemming zijn niet vanzelf hetzelfde onderdeel: het logo
      // in de header en "Home" in het kruimelpad gaan allebei naar de startpagina, maar het
      // zijn twee onderdelen met elk een eigen naam. Zonder dit onderscheid meldt elke
      // gemeentesite hier een inconsistentie die er niet is. Het deel van de pagina is het
      // beste houvast dat de code biedt; een sluitende definitie van "component" bestaat
      // niet, en dat is punt 5 van W3C-issue #5225.
      let gebied = 'elders';
      let o: Element | null = el;
      while (o) {
        const t = o.tagName.toLowerCase();
        const rol = o.getAttribute('role') || '';
        if (t === 'header' || rol === 'banner') {
          gebied = 'header';
          break;
        }
        if (t === 'footer' || rol === 'contentinfo') {
          gebied = 'footer';
          break;
        }
        if (t === 'nav' || rol === 'navigation') {
          gebied = 'navigatie';
          break;
        }
        if (t === 'main' || rol === 'main') {
          gebied = 'main';
          break;
        }
        if (t === 'aside') {
          gebied = 'zijbalk';
          break;
        }
        o = o.parentElement;
      }

      let sleutel: string | null = null;
      let soort = 'knop';
      if (el.tagName === 'A') {
        soort = 'link';
        const rauw = (el.getAttribute('href') || '').trim();
        // Een link zonder bestemming heeft niets om op te koppelen: twee kapotte
        // belknoppen in de footer zijn geen "hetzelfde onderdeel dat anders heet". Ze
        // vallen buiten de vergelijking en worden apart geteld, zodat ze niet
        // stilzwijgend verdwijnen.
        if (!rauw || rauw === '#' || rauw === '/#' || /^javascript:/i.test(rauw)) {
          zonderBestemming++;
          continue;
        }
        if (rauw.startsWith('#')) {
          // Een sprong binnen de pagina: het doel verschilt per pagina, de functie niet.
          sleutel = `sprong:${rauw}|${gebied}`;
        } else {
          try {
            const u = new URL((el as HTMLAnchorElement).href);
            // Mailto en tel hebben geen herkomst; hun bestemming is het adres zelf. Een
            // deel-via-mail-link zonder adres (mailto:?subject=...) heeft helemaal geen
            // bestemming: die links heten per pagina anders omdat de paginanaam erin
            // staat, en dat is geen inconsistentie maar de bedoeling.
            if (u.protocol === 'mailto:' || u.protocol === 'tel:') {
              const adres = u.pathname.trim();
              if (!adres) {
                zonderBestemming++;
                continue;
              }
              sleutel = `${u.protocol}${adres}|${gebied}`;
            } else {
              // Een kaal pad wordt "/" en niet de lege tekenreeks; anders vallen de
              // startpagina en alles wat daarheen wijst in dezelfde emmer.
              const pad = u.pathname.replace(/\/+$/, '') || '/';
              sleutel =
                u.origin === location.origin
                  ? `pad:${pad}${u.search}${u.hash}|${gebied}`
                  : `extern:${u.origin}${pad}|${gebied}`;
            }
          } catch {
            sleutel = `adres:${rauw}|${gebied}`;
          }
        }
      } else {
        const id = el.getAttribute('id');
        const klasse = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean)[0] || '';
        // Sjabloonklassen krijgen vaak een gegenereerd stuk mee dat per bouw verschilt;
        // alleen het leesbare deel gebruiken.
        const kaal = klasse.replace(/[-_][A-Za-z0-9]{6,}.*$/, '');
        sleutel = id ? `id:${id}|${gebied}` : kaal ? `klasse:${kaal}|${gebied}` : null;
      }
      if (!sleutel) continue;

      // Het icoon van dit onderdeel, als vingerafdruk.
      //
      // 3.2.4 gaat niet alleen over de naam. Een icoon staat vrijwel altijd op
      // `aria-hidden` en valt dus buiten de toegankelijke naam, terwijl juist mensen die op
      // herkenbare beelden varen erdoor in de war raken als het per pagina verschilt. Dat
      // is punt 4 van W3C-issue #5225.
      //
      // Vergeleken wordt waaraan het icoon te herkennen is: de bestandsnaam, de vorm van de
      // svg, of de klasse van een icoonlettertype. Niet het beeld zelf; twee verschillende
      // bestanden kunnen hetzelfde vergrootglas tonen. Het is dus een signaal en geen bewijs.
      let icoon: string | null = null;
      const plaatje = el.querySelector('img');
      const tekening = el.querySelector('svg');
      if (plaatje) {
        const bron2 = (plaatje.getAttribute('src') || '').split('?')[0];
        icoon = `afbeelding:${bron2.split('/').pop()}`;
      } else if (tekening) {
        const gebruik = tekening.querySelector('use');
        const lijn = tekening.querySelector('path');
        icoon = `svg:${
          gebruik
            ? gebruik.getAttribute('href') || gebruik.getAttribute('xlink:href') || ''
            : lijn
            ? (lijn.getAttribute('d') || '').slice(0, 40)
            : tekening.getAttribute('class') || ''
        }`;
      } else {
        for (const k of Array.from(el.querySelectorAll('span, i'))) {
          const kl = k.getAttribute('class') || '';
          const m = kl.match(/(?:^|\s)(fa[a-z]?-[a-z0-9-]+|icon-[a-z0-9-]+|material-icons[a-z-]*)/i);
          if (m) {
            icoon = `klasse:${m[1]}`;
            break;
          }
        }
      }

      uit.push({
        soort,
        sleutel,
        naam,
        bron,
        icoon,
        href: el.getAttribute('href') || null,
      });
    }
    // Een sleutel die op deze pagina meer dan één element aanwijst, wijst geen onderdeel
    // aan. Twintig uitklapkoppen delen dezelfde sjabloonklasse; die als "één onderdeel met
    // twintig namen" rapporteren levert een lijst op waar niemand iets aan heeft. Alleen
    // sleutels die hier precies één element aanwijzen blijven staan.
    const geteld = new Map<string, number>();
    for (const o of uit) geteld.set(o.sleutel, (geteld.get(o.sleutel) ?? 0) + 1);
    const eenduidig = uit.filter((o) => geteld.get(o.sleutel) === 1);
    const meervoudig = uit.length - eenduidig.length;

    return {
      onderdelen: eenduidig,
      nietEenduidigOpDezePagina: meervoudig,
      geenMain,
      zonderBestemming,
      titel: document.title,
    };
  }, alleenMain);
}

/**
 * Legt de pagina's van een onderzoek naast elkaar en zoekt onderdelen die op de ene pagina
 * anders heten dan op de andere. De meting voor SC 3.2.4.
 *
 * Dit is de eerste meting die meer dan één pagina bekijkt, en dat is geen toeval: 3.2.4 gaat
 * over een sét webpagina's. Consistentie is aan één pagina niet te zien. Een oordeel per
 * pagina is hier dus geen kleine onnauwkeurigheid maar een categoriefout -- en toch stond het
 * op alle twintig kaarten van UTHEU-02, negen keer zelfs met een vergelijking bínnen één
 * pagina, wat `Shift2_Regels_SC_3_2_4.md` uitdrukkelijk uitsluit.
 *
 * Geef een projectnummer mee, of het adres van een sample; in dat laatste geval wordt het
 * onderzoek opgezocht waar die pagina bij hoort. Zo werkt de knop op de kaart ook: die stuurt
 * het adres van het sample mee.
 *
 * WAT HET NIET BESLIST: of twee namen echt van elkaar verschillen in de zin van dit
 * criterium. "Zoeken" en "Zoek" zijn twee tekenreeksen; of dat een inconsistentie is, is punt
 * 1 van W3C-issue #5225 en blijft een oordeel. Het commando zet ze naast elkaar met de
 * pagina's erbij.
 */
async function getConsistentie(doel: string, flags: Flags) {
  const max = Math.max(2, parseInt(flags.max || '12', 10));
  const alleenMain = flags.scope === 'main';

  // Het onderzoek en zijn pagina's ophalen. Een adres mag ook: dan zoeken we op welk
  // onderzoek deze pagina in de steekproef heeft.
  const isProjectId = /^[0-9a-f-]{30,}$/i.test(doel);
  let projectId = doel;
  let samples: any[] = [];
  if (isProjectId) {
    samples = await api(`/api/projects/${projectId}/sample-items`);
  } else {
    const projecten: any[] = await api('/api/projects');
    const kaal = (u: string) => {
      try {
        const x = new URL(u);
        return x.host.replace(/^www\./, '').toLowerCase() + x.pathname.replace(/\/+$/, '');
      } catch {
        return u;
      }
    };
    for (const p of projecten) {
      const lijst: any[] = await api(`/api/projects/${p.id}/sample-items`);
      if (lijst.some((s) => s.url && kaal(s.url) === kaal(doel))) {
        projectId = p.id;
        samples = lijst;
        break;
      }
    }
    if (!samples.length) {
      throw new Error(
        `Geen onderzoek gevonden waarin ${doel} als sample staat. Geef anders het projectnummer mee.`
      );
    }
  }

  const bruikbaar = samples.filter((s) => s.url && s.sampleType !== 'pdf');
  const teDoen = bruikbaar.slice(0, max);
  const overgeslagen = bruikbaar.length - teDoen.length;
  if (teDoen.length < 2) {
    throw new Error(
      'Voor 3.2.4 zijn minstens twee pagina\'s nodig; consistentie is aan één pagina niet te zien.'
    );
  }

  const session = await getBrowser();
  const perPagina: any[] = [];
  const mislukt: any[] = [];
  try {
    for (const sample of teDoen) {
      const { page, cleanup, eindUrl, omgeleid } = await openPage(session, sample.url);
      try {
        const gevonden = await leesOnderdelen(page, alleenMain);
        perPagina.push({
          sample: sample.title,
          url: sample.url,
          omgeleid,
          eindUrl,
          onderdelen: gevonden.onderdelen,
          nietEenduidig: gevonden.nietEenduidigOpDezePagina ?? 0,
          zonderBestemming: gevonden.zonderBestemming ?? 0,
        });
      } catch (e: any) {
        mislukt.push({ sample: sample.title, url: sample.url, fout: e?.message || 'niet gelukt' });
      } finally {
        await cleanup();
      }
    }
  } finally {
    await session.dispose();
  }

  // Een omgeleide pagina is de pagina niet.
  //
  // Stap 2 en stap 3 van het contactformulier op heuvelrug.nl sturen je terug naar stap 1
  // als je ze rechtstreeks opvraagt. Reken je die mee, dan staat dezelfde pagina drie keer
  // in de vergelijking onder drie namen, en dan lijkt "het logo heet op drie pagina's
  // anders" iets over drie pagina's te zeggen terwijl het er één is. Ze gaan er dus uit,
  // en ze worden genoemd: twee samples niet onderzocht is iets om te weten, geen detail.
  const omgeleid = perPagina.filter((p) => p.omgeleid);
  const bruikbarePaginas = perPagina.filter((p) => !p.omgeleid);

  // Per sleutel de namen die op de verschillende pagina's gevonden zijn.
  const perSleutel = new Map<string, Map<string, string[]>>();
  for (const p of bruikbarePaginas) {
    for (const o of p.onderdelen) {
      if (!perSleutel.has(o.sleutel)) perSleutel.set(o.sleutel, new Map());
      const namen = perSleutel.get(o.sleutel)!;
      // Hoofdletters tellen niet mee: een schermlezer leest "Zoeken" en "zoeken" hetzelfde.
      const kaal = o.naam.toLowerCase();
      if (!namen.has(kaal)) namen.set(kaal, []);
      if (!namen.get(kaal)!.includes(p.sample)) namen.get(kaal)!.push(p.sample);
    }
  }

  // Op hoeveel VERSCHILLENDE pagina's een onderdeel voorkomt. Twee keer op dezelfde pagina
  // is niet "op meerdere pagina's"; zonder dit onderscheid telde de paginering van een
  // nieuwsoverzicht mee als iets wat over de site heen vergeleken kan worden.
  const paginasVan = (namen: Map<string, string[]>) =>
    new Set(Array.from(namen.values()).flat());
  const opMeerderePaginas = Array.from(perSleutel.entries()).filter(
    ([, namen]) => paginasVan(namen).size > 1
  );

  /**
   * Twee namen op verschillende pagina's, of twee namen op dezelfde pagina?
   *
   * Dat is hier het hele onderscheid. 3.2.4 gaat over een set pagina's: hetzelfde onderdeel
   * dat op pagina A anders heet dan op pagina B. Twee links naast elkaar in dezelfde footer
   * die allebei naar WhatsApp gaan en anders heten, is iets binnen één pagina -- en
   * `Shift2_Regels_SC_3_2_4.md` sluit dat uitdrukkelijk uit.
   *
   * Aan de namen alleen is dat niet te zien: allebei leveren ze twee namen over vier
   * pagina's op. Het verschil zit in de vraag of dezelfde pagina meer dan één naam draagt.
   */
  const alleVerschillen = opMeerderePaginas
    .filter(([, namen]) => namen.size > 1)
    .map(([sleutel, namen]) => {
      const perPaginaAantal = new Map<string, number>();
      for (const paginas of Array.from(namen.values())) {
        for (const pagina of paginas) {
          perPaginaAantal.set(pagina, (perPaginaAantal.get(pagina) ?? 0) + 1);
        }
      }
      const binnenEenPagina = Array.from(perPaginaAantal.values()).some((n) => n > 1);
      return {
        onderdeel: sleutel,
        binnenEenPagina,
        namen: Array.from(namen.entries()).map(([naam, paginas]) => ({
          naam,
          paginas: paginas.slice(0, 6),
          aantal: paginas.length,
        })),
      };
    });
  const verschillend = alleVerschillen.filter((v) => !v.binnenEenPagina);
  const binnenEenPagina = alleVerschillen.filter((v) => v.binnenEenPagina);

  // Hetzelfde voor de iconen. Een onderdeel dat overal hetzelfde heet maar niet overal
  // hetzelfde beeld draagt, is voor wie op beelden vaart net zo verwarrend.
  const perSleutelIcoon = new Map<string, Map<string, string[]>>();
  for (const p of bruikbarePaginas) {
    for (const o of p.onderdelen) {
      if (!o.icoon) continue;
      if (!perSleutelIcoon.has(o.sleutel)) perSleutelIcoon.set(o.sleutel, new Map());
      const iconen = perSleutelIcoon.get(o.sleutel)!;
      if (!iconen.has(o.icoon)) iconen.set(o.icoon, []);
      if (!iconen.get(o.icoon)!.includes(p.sample)) iconen.get(o.icoon)!.push(p.sample);
    }
  }
  const anderIcoon = Array.from(perSleutelIcoon.entries())
    .filter(([, iconen]) => iconen.size > 1 && paginasVan(iconen).size > 1)
    .map(([sleutel, iconen]) => ({
      onderdeel: sleutel,
      iconen: Array.from(iconen.entries()).map(([icoon, paginas]) => ({
        icoon,
        paginas: paginas.slice(0, 6),
        aantal: paginas.length,
      })),
    }));

  // Onderdelen die niet overal staan. Dat is 3.2.3 (consistente navigatie) en geen 3.2.4;
  // wel melden, want anders lijkt het alsof er niets aan de hand is.
  const nietOveral = opMeerderePaginas
    .map(([sleutel, namen]) => ({
      onderdeel: sleutel,
      opPaginas: paginasVan(namen).size,
    }))
    .filter((x) => x.opPaginas > 1 && x.opPaginas < bruikbarePaginas.length)
    .slice(0, 20);

  const dir = ensureOutputDir();
  const stempel = timestamp();
  let overzicht: string | null = path.join(dir, `${stempel}-consistentie.txt`);
  try {
    const regels = [
      `CONSISTENTE IDENTIFICATIE OVER DE SAMPLES — onderzoek ${projectId}`,
      `Gemeten: ${new Date().toLocaleString('nl-NL')} · ${
        session.mode === 'cdp' ? 'auditsessie' : 'headless'
      }`,
      `Pagina's vergeleken: ${perPagina.length} van de ${bruikbaar.length}${
        overgeslagen ? ` (${overgeslagen} niet bekeken door --max=${max})` : ''
      }`,
      `Gebied: ${alleenMain ? 'main-content' : 'hele pagina'}`,
      '',
      'ONDERDELEN DIE ANDERS HETEN OP EEN ANDERE PAGINA',
      ...(verschillend.length
        ? verschillend.flatMap((v) => [
            `  ${v.onderdeel}`,
            ...v.namen.map((n) => `      "${n.naam}" op ${n.paginas.join(', ')}`),
          ])
        : ['  geen']),
      '',
      'STAAT NIET OP ELKE PAGINA (dat is 3.2.3, niet 3.2.4)',
      ...(nietOveral.length
        ? nietOveral.map((x) => `  ${x.onderdeel} — op ${x.opPaginas} van de ${perPagina.length}`)
        : ['  geen']),
      '',
      'ANDER ICOON BIJ HETZELFDE ONDERDEEL',
      ...(anderIcoon.length
        ? anderIcoon.flatMap((v) => [
            `  ${v.onderdeel}`,
            ...v.iconen.map((i: any) => `      ${i.icoon} op ${i.paginas.join(', ')}`),
          ])
        : ['  geen']),
      '',
      // De matrix uit stap 4 van de werkwijze: onderdelen in de rijen, pagina's in de
      // kolommen. De losse lijsten hierboven laten zien wát er verschilt; hier zie je in
      // één blik waar een onderdeel staat, waar het ontbreekt, en of een afwijking op één
      // pagina zit of op de helft.
      'MATRIX — welk onderdeel heet waar hoe',
      `  kolommen: ${bruikbarePaginas
        .map((p: any, i: number) => `P${i + 1}=${p.sample}`)
        .join(' · ')}`,
      '  in de rij: het nummer van de naamvariant, een punt als het onderdeel er niet staat',
      '',
      ...Array.from(perSleutel.entries())
        .filter(([, namen]) => paginasVan(namen).size > 1)
        .flatMap(([sleutel, namen]) => {
          const varianten = Array.from(namen.keys());
          const rij = bruikbarePaginas
            .map((p: any) => {
              const plek = varianten.findIndex((v) => namen.get(v)!.includes(p.sample));
              return plek < 0 ? '.' : String(plek + 1);
            })
            .join('');
          return [
            `  ${rij}  ${sleutel}`,
            ...(varianten.length > 1
              ? varianten.map((v, i) => `        ${i + 1} = "${v}"`)
              : []),
          ];
        }),
      '',
      "PAGINA'S",
      ...perPagina.map(
        (p) => `  ${p.sample}: ${p.onderdelen.length} onderdelen${p.omgeleid ? ' (OMGELEID)' : ''}`
      ),
      ...mislukt.map((m) => `  ${m.sample}: niet gelukt — ${m.fout}`),
    ];
    fs.writeFileSync(overzicht, regels.join('\n'), 'utf8');
  } catch {
    overzicht = null;
  }

  const omgeleidTekst = omgeleid.length
    ? ` ${omgeleid.length} ${
        omgeleid.length === 1 ? 'sample is' : 'samples zijn'
      } niet meegenomen omdat de server doorstuurde naar een andere pagina: ${omgeleid
        .map((p: any) => p.sample)
        .join(', ')}.`
    : '';

  const stapZin = `${bruikbarePaginas.length} pagina's van de steekproef naast elkaar gelegd en per onderdeel de toegankelijke naam vergeleken. Links zijn gekoppeld op hun bestemming, knoppen op hun id of sjabloonklasse. ${
    verschillend.length
      ? `${verschillend.length} ${
          verschillend.length === 1 ? 'onderdeel heet' : 'onderdelen heten'
        } op de ene pagina anders dan op de andere: ${verschillend
          .slice(0, 4)
          .map((v) => `${v.onderdeel} (${v.namen.map((n) => `"${n.naam}"`).join(' / ')})`)
          .join('; ')}.`
      : 'Elk onderdeel dat op meer dan één pagina voorkomt, heet daar overal hetzelfde.'
  }${overgeslagen ? ` ${overgeslagen} pagina's zijn niet bekeken door de grens van --max=${max}.` : ''}${omgeleidTekst}`;

  // Een omgeleid sample is niet onderzocht. Dat maakt de vergelijking van de rest niet
  // ongeldig, maar wel onvolledig, en dat hoort de kaart te zeggen.
  const beslist = overgeslagen === 0 && mislukt.length === 0 && omgeleid.length === 0;

  legVast({
    commando: 'get-consistentie',
    stap: stapZin,
    argumenten: { ...(flags.max ? { max: String(max) } : {}), ...(flags.scope ? { scope: flags.scope } : {}) },
    url: teDoen[0]?.url ?? null,
    browser: session.mode === 'cdp' ? 'auditsessie' : 'headless',
    weergave: 'standaardweergave',
    artefact: overzicht,
    criteria: ['3.2.4'],
    uitkomst: {
      paginas: bruikbarePaginas.length,
      omgeleid: omgeleid.length,
      vanDeSteekproef: bruikbaar.length,
      onderdelenOpMeerderePaginas: opMeerderePaginas.length,
      andersBenoemd: verschillend.length,
      anderIcoon: anderIcoon.length,
      nietOveralAanwezig: nietOveral.length,
      beslist,
    },
  });

  print({
    onderzoek: projectId,
    paginas_vergeleken: bruikbarePaginas.map((p: any) => p.sample),
    omgeleid_niet_meegenomen: omgeleid.length
      ? omgeleid.map((p: any) => ({ sample: p.sample, gevraagd: p.url, uitgekomen_op: p.eindUrl }))
      : undefined,
    paginas_niet_bekeken: overgeslagen || undefined,
    niet_gelukt: mislukt.length ? mislukt : undefined,
    gebied: alleenMain ? 'main-content' : 'hele pagina',
    // Wat buiten de vergelijking viel, en waarom. Stil weglaten leest als "er was niets".
    niet_te_koppelen: {
      meer_dan_een_element_met_dezelfde_sleutel: perPagina.reduce((n: number, p: any) => n + (p.nietEenduidig || 0), 0),
      links_zonder_bestemming: perPagina.reduce((n: number, p: any) => n + (p.zonderBestemming || 0), 0),
    },
    onderdelen_op_meerdere_paginas: opMeerderePaginas.length,
    anders_benoemd: verschillend,
    anders_benoemd_binnen_een_pagina: binnenEenPagina,
    ander_icoon_bij_hetzelfde_onderdeel: anderIcoon,
    staat_niet_op_elke_pagina: nietOveral,
    overzicht,
    beslist,
    let_op: verschillend.length
      ? 'Deze onderdelen heten niet overal hetzelfde. Weeg zelf of het een inconsistentie is in de zin van 3.2.4: "Zoeken" en "Zoek" zijn twee tekenreeksen, maar of dat verschil telt is punt 1 van W3C-issue #5225. Knoppen zijn gekoppeld op hun id of klasse, dus controleer of het werkelijk hetzelfde onderdeel is.'
      : 'Geen onderdeel dat op de ene pagina anders heet dan op de andere. Let op wat hier NIET in zit: onderdelen die maar op één pagina voorkomen zijn niet te vergelijken, en of iets overal aanwezig is valt onder 3.2.3.',
  });
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
    case 'get-videos':
      return getVideos(requirePositional(positional, 0, 'url'), flags);
    case 'get-sneltoetsen':
      return getSneltoetsen(requirePositional(positional, 0, 'url'), flags);
    case 'get-toetsenbordval':
      return getToetsenbordval(requirePositional(positional, 0, 'url'), flags);
    case 'get-nietteksten':
      return getNietTeksten(requirePositional(positional, 0, 'url'), flags);
    case 'get-pixelcontrast':
      return getPixelContrast(requirePositional(positional, 0, 'url'), flags);
    case 'get-beweging':
      return getBeweging(requirePositional(positional, 0, 'url'), flags);
    case 'get-flitsen':
      return getFlitsen(requirePositional(positional, 0, 'url'), flags);
    case 'get-videosporen':
      return getVideosporen(requirePositional(positional, 0, 'url'), flags);
    case 'get-links':
      return getLinks(requirePositional(positional, 0, 'url'), flags);
    case 'get-labelinnaam':
      return getLabelInNaam(requirePositional(positional, 0, 'url'), flags);
    case 'get-consistentie':
      return getConsistentie(requirePositional(positional, 0, 'projectId of url'), flags);
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
        `  get-beweging <url> [--seconden=5] [--vanaf=3] [--klik=...]   # 2.2.2: kijkt of er iets uit zichzelf beweegt of bijwerkt\n` +
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
