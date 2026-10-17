/**
 * Browsertoets van de patronenbibliotheek en de casuseditor (fase 1).
 *
 *   npx tsx --test scripts/test-bibliotheek-beheer.ts
 *
 * Vraagt een draaiende dev-server en een gevulde bibliotheek. Schrijft niets
 * weg: de editor wordt geopend, de klantdata-waarschuwing opgeroepen en weer
 * gesloten, de vaststeldialoog geannuleerd.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const BASIS = process.env.AUDIT_CLI_BASE_URL ?? 'http://localhost:3000';
const prisma = new PrismaClient();
let browser: Browser;

before(async () => {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
});
after(async () => {
  await browser?.close();
  await prisma.$disconnect();
});

async function open(pad: string): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(`${BASIS}${pad}`, { waitUntil: 'networkidle0' });
  return page;
}

const rijen = (page: Page) => page.$$eval('tbody tr', (trs) => trs.filter((t) => t.querySelector('a')).length);

test('lijst: alle patronen, filters en zoeken in casuscode', async () => {
  const totaal = await prisma.patroon.count();
  const advies = await prisma.patroon.count({ where: { oordeel: 'advies' } });
  const wijktAf = await prisma.patroon.count({ where: { rapportBevindingen: { some: { overeenstemming: { not: 'eens' } } } } });
  const page = await open('/admin/bibliotheek');
  assert.equal(await rijen(page), totaal);

  await page.select('#f-oordeel', 'advies');
  assert.equal(await rijen(page), advies);
  await page.select('#f-oordeel', '');

  await page.click('input[type="checkbox"]');
  assert.equal(await rijen(page), wijktAf);
  await page.click('input[type="checkbox"]');

  // 'fake-h' staat alleen in casus-HTML, niet in titels.
  await page.type('#zoek', 'fake-h');
  assert.ok((await rijen(page)) >= 1);

  // Standaard: meeste rapportbevindingen bovenaan.
  await page.click('#zoek', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  const aantallen = await page.$$eval('tbody tr td:nth-child(6)', (tds) => tds.map((t) => parseInt(t.textContent ?? '0')));
  assert.deepEqual(aantallen, [...aantallen].sort((a, b) => b - a));
  await page.close();
});

test('in rapporten: een vertrouwelijke bron toont geen organisatie', async () => {
  const rb = await prisma.rapportBevinding.findFirst({ where: { bron: { vertrouwelijk: true } }, include: { bron: true } });
  assert.ok(rb, 'seed heeft een vertrouwelijke bron met een rapportbevinding');
  const page = await open(`/admin/bibliotheek/${encodeURIComponent(rb!.patroonId)}?tab=rapporten`);
  const tekst = await page.$eval('main', (m) => m.textContent ?? '');
  assert.match(tekst, /vertrouwelijk/);
  assert.doesNotMatch(tekst, /\(klant, vertrouwelijk\)/);
  await page.close();
});

test('vaststellen vraagt bevestiging met de naam vooraf ingevuld', async () => {
  const p = await prisma.patroon.findFirst({ where: { status: 'concept' } });
  const page = await open(`/admin/bibliotheek/${encodeURIComponent(p!.id)}`);
  await page.click('xpath/.//button[contains(., "Vaststellen…")]');
  assert.equal(await page.$eval('dialog', (d) => (d as HTMLDialogElement).open), true);
  assert.equal(await page.$eval('#vaststeller', (i) => (i as HTMLInputElement).value), 'Frits');
  await page.click('xpath/.//dialog//button[contains(., "Annuleren")]');
  assert.equal(await page.$eval('dialog', (d) => (d as HTMLDialogElement).open), false);
  assert.equal((await prisma.patroon.findUnique({ where: { id: p!.id } }))!.status, 'concept');
  await page.close();
});

test('casuseditor: codevelden, afgeschermd voorbeeld en klantdata-waarschuwing', async () => {
  const casus = await prisma.casus.findFirst({ orderBy: { id: 'asc' } });
  const voor = casus!.html;
  const page = await open(`/admin/bibliotheek/${encodeURIComponent(casus!.patroonId)}?tab=casussen`);
  await page.click(`button[aria-label="Casus ${casus!.id} bewerken"]`);
  await page.waitForSelector('.cm-content');
  assert.equal(await page.$$eval('.cm-content', (e) => e.length), 4, 'HTML, CSS, JS en correcte code');

  const sandbox = await page.$eval('iframe[title="Live voorbeeld van het testgebied"]', (f) => f.getAttribute('sandbox'));
  assert.equal(sandbox, 'allow-scripts');

  // Een e-mailadres in de HTML: opslaan geeft eerst een waarschuwing.
  await page.click('.cm-content');
  await page.keyboard.down('Control');
  await page.keyboard.press('End');
  await page.keyboard.up('Control');
  await page.keyboard.type('\n<p>info@heerlen.nl</p>');
  await page.click('xpath/.//button[normalize-space()="Opslaan"]');
  await page.waitForSelector('[role="alert"]');
  const waarschuwing = await page.$eval('[role="alert"]', (e) => e.textContent ?? '');
  assert.match(waarschuwing, /klantdata/);
  assert.match(waarschuwing, /info@heerlen\.nl/);
  await page.click('xpath/.//button[contains(., "Terug naar de code")]');
  await page.click('xpath/.//button[normalize-space()="Annuleren"]');

  assert.equal((await prisma.casus.findUnique({ where: { id: casus!.id } }))!.html, voor, 'niets opgeslagen');
  await page.close();
});

test('api weigert een onbekend criterium zonder iets te schrijven', async () => {
  const voor = await prisma.patroon.count();
  const res = await fetch(`${BASIS}/api/bibliotheek/patronen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titel: 'x', criteria: '9.9.9', oordeel: 'afkeur', herkomst: 'content', wcag: ['wcag_2_2'] }),
  });
  assert.equal(res.status, 400);
  assert.match(JSON.stringify(await res.json()), /9\.9\.9/);
  assert.equal(await prisma.patroon.count(), voor);
});
