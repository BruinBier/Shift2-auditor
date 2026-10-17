/**
 * Acceptatietoets fase 1 van de oefenmodus, in een echte browser
 * (docs/bibliotheek/SPEC.md, Acceptatiecriteria fase 1).
 *
 *   npx tsx --test scripts/test-oefenmodus.ts
 *
 * Vraagt een draaiende dev-server (AUDIT_CLI_BASE_URL, standaard
 * http://localhost:3000) en een gevulde bibliotheek. Leest alleen; de
 * antwoorden die de toets aanklikt staan in het localStorage van een
 * wegwerpbrowser.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import axeCore from 'axe-core';
import { PrismaClient } from '@prisma/client';
import { juistAntwoord, oordeelUitDatabase, teltMee } from '../lib/bibliotheek/oefenen';

const BASIS = process.env.AUDIT_CLI_BASE_URL ?? 'http://localhost:3000';
const prisma = new PrismaClient();
let browser: Browser;

type Verwacht = { id: string; juist: 'afkeur' | 'geen-afkeur' };
let sets: { id: string; casussen: Verwacht[] }[] = [];

before(async () => {
  const oefensets = await prisma.oefenset.findMany({ orderBy: { id: 'asc' } });
  const casussen = await prisma.casus.findMany({ include: { patroon: { select: { oordeel: true } } } });
  sets = oefensets.map((s) => ({
    id: s.id,
    casussen: casussen
      .filter((c) => c.oefensets.includes(s.id) && teltMee(oordeelUitDatabase(c.patroon.oordeel)))
      .map((c) => ({ id: c.id, juist: juistAntwoord(oordeelUitDatabase(c.patroon.oordeel))! })),
  }));
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
});

after(async () => {
  await browser?.close();
  await prisma.$disconnect();
});

async function open(setId: string, breedte = 1280): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: breedte, height: 900 });
  await page.goto(`${BASIS}/oefenen/${setId}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  // Elk testgebied heeft zijn hoogte doorgegeven: dan heeft het iframe gerenderd.
  await page.waitForFunction(
    () => [...document.querySelectorAll('iframe')].every((f) => f.style.height !== '8rem'),
    { timeout: 20000 },
  );
  return page;
}

test('elke casus rendert in een eigen iframe, samen 78', async () => {
  let totaal = 0;
  for (const set of sets) {
    const page = await open(set.id);
    const ids = await page.$$eval('article.case', (els) => els.map((e) => e.id));
    assert.deepEqual([...ids].sort(), set.casussen.map((c) => c.id).sort(), `oefenset ${set.id}`);
    const hoogtes = await page.$$eval('iframe', (fs) => fs.map((f) => parseFloat(f.style.height)));
    assert.ok(hoogtes.every((h) => h > 0), `oefenset ${set.id}: hoogte doorgegeven`);
    totaal += ids.length;
    await page.close();
  }
  assert.equal(totaal, 78);
});

test('afbeeldingen in testgebieden laden', async () => {
  for (const set of sets) {
    const page = await open(set.id);
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      const kapot = await frame.evaluate(() =>
        [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      );
      // Een verwijzing naar iets dat geen afbeelding is (captcha.php als formulieractie) telt niet.
      assert.deepEqual(kapot, [], `oefenset ${set.id}: ${frame.url()}`);
    }
    await page.close();
  }
});

test('een casus kan geen app-gegevens lezen: sandbox zonder allow-same-origin', async () => {
  const page = await open(sets[0].id);
  const frames = await page.$$eval('iframe', (fs) =>
    fs.map((f) => ({ sandbox: f.getAttribute('sandbox'), leesbaar: f.contentDocument !== null })),
  );
  for (const f of frames) {
    assert.equal(f.sandbox, 'allow-scripts');
    assert.equal(f.leesbaar, false);
  }
  await page.close();
});

test('juist antwoord geeft Goed beoordeeld, verkeerd antwoord Niet goed, voor alle casussen', async () => {
  let getoetst = 0;
  for (const set of sets) {
    const page = await open(set.id);
    for (const c of set.casussen) {
      const fout = c.juist === 'afkeur' ? 'geen-afkeur' : 'afkeur';
      for (const [keuze, begin] of [
        [c.juist, 'Goed beoordeeld'],
        [fout, 'Niet goed'],
      ] as const) {
        await page.click(`[id="${c.id}"] input[value="${keuze}"]`);
        const tekst = await page.$eval(`[id="${c.id}"] [role="status"]`, (e) => e.textContent ?? '');
        assert.ok(tekst.startsWith(begin), `${c.id} (${keuze}): "${tekst}"`);
      }
      const bevindingOpen = await page.$eval(`[id="${c.id}"] details.finding-box`, (d) => (d as HTMLDetailsElement).open);
      assert.ok(bevindingOpen, `${c.id}: bevinding opent na kiezen`);
      getoetst++;
    }
    const score = await page.$eval('.score', (e) => e.textContent);
    assert.equal(score, `${set.casussen.length} van ${set.casussen.length} beoordeeld · 0 goed`);
    await page.close();
  }
  assert.equal(getoetst, 78);
});

test('broncode: bestandsnamen, geen data-URI, geen horizontale scroll bij 320 px', async () => {
  for (const set of sets) {
    const page = await open(set.id, 320);
    const broncode = await page.$$eval('details.src pre', (els) => els.map((e) => e.textContent ?? ''));
    assert.ok(broncode.every((t) => !t.includes('data:')), `oefenset ${set.id}: data-URI in broncode`);
    const { scroll, breedte } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      breedte: document.documentElement.clientWidth,
    }));
    assert.ok(scroll <= breedte, `oefenset ${set.id}: ${scroll}px breed bij ${breedte}px`);
    await page.close();
  }
});

test('casussen gebruiken de volle kolom, net als de kop', async () => {
  const page = await open(sets[0].id);
  const [kop, casus] = await page.$$eval('header.intro, article.case', (els) =>
    els.slice(0, 2).map((e) => Math.round(e.getBoundingClientRect().width)),
  );
  assert.equal(casus, kop);
  await page.close();
});

test('oefenmodus zelf: geen axe-fouten, koppen alleen van de pagina', async () => {
  for (const set of sets) {
    const page = await open(set.id);
    // Een antwoord gekozen, zodat ook feedback en bevinding meedoen.
    await page.click(`[id="${set.casussen[0].id}"] input[value="afkeur"]`);
    await page.evaluate(axeCore.source);
    // Testgebieden bevatten met opzet fouten en vallen buiten de toets: axe gaat niet de iframes in.
    const fouten = await page.evaluate(async () => {
      // @ts-expect-error axe is net in de pagina gezet
      const r = await axe.run(document, { iframes: false, runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] });
      return r.violations.map((v: { id: string; nodes: unknown[] }) => `${v.id} (${v.nodes.length})`);
    });
    assert.deepEqual(fouten, [], `oefenset ${set.id}`);
    const koppen = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) => els.map((e) => e.tagName));
    assert.equal(koppen[0], 'H1');
    assert.ok(koppen.slice(1).every((k) => k === 'H2'), `oefenset ${set.id}: ${koppen.join(',')}`);
    await page.close();
  }
});

test('volledig met toetsenbord: knoppen en oordeel per casus', async () => {
  const set = sets[0];
  const page = await open(set.id);
  const eerste = set.casussen[0];
  // Tab tot het eerste rondje van de eerste casus; de testgebieden liggen ertussen.
  let gevonden = false;
  for (let i = 0; i < 80 && !gevonden; i++) {
    await page.keyboard.press('Tab');
    gevonden = await page.evaluate(
      (id) => document.activeElement?.getAttribute('name') === `oordeel-${id}`,
      eerste.id,
    );
  }
  assert.ok(gevonden, 'oordeel van de eerste casus bereikbaar met Tab');
  await page.keyboard.press('Space');
  const tekst = await page.$eval(`[id="${eerste.id}"] [role="status"]`, (e) => e.textContent ?? '');
  assert.ok(tekst.length > 0, 'kiezen met spatie geeft feedback');
  await page.close();
});
