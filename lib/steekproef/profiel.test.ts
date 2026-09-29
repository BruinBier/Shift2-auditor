import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALLEEN_SEMANTISCH, CODE_REGELS, ELDERS_GEMETEN, herkenGebieden } from './dekking';
import { kiesDocumenten, kiesPaginas, schatDocumentSoort, STANDAARD_CONFIG, type KandidaatInvoer } from './profielkeuze';
import { browserVondMeer } from './profiel';

/**
 * Twee dingen die niet stil mogen verschuiven:
 *   1. elk gebied uit de dekkingslijst heeft een plek (code, elders, of semantisch);
 *   2. dezelfde inventarisatie + dezelfde configuratie geeft dezelfde te profileren pagina's.
 */

const DEKKINGSLIJST = readFileSync(join(__dirname, '..', '..', 'wcag-regels', 'Shift2_Dekkingslijst_Steekproef.md'), 'utf8');
const idsInLijst = [...DEKKINGSLIJST.matchAll(/<!-- gebied: (G\d\d) -->/g)].map((m) => m[1]);

test('de dekkingslijst heeft 32 gebieden met een vaste id', () => {
  assert.equal(idsInLijst.length, 32);
  assert.equal(new Set(idsInLijst).size, 32);
});

test('elk gebied valt in precies één soort: code, elders of semantisch', () => {
  const code = new Set(CODE_REGELS.map((r) => r.gebied));
  const elders = new Set(Object.keys(ELDERS_GEMETEN));
  const sem = new Set(Object.keys(ALLEEN_SEMANTISCH));
  for (const id of idsInLijst) {
    const n = [code.has(id as any), elders.has(id), sem.has(id)].filter(Boolean).length;
    assert.equal(n, 1, `${id} staat in ${n} soorten`);
  }
  for (const id of [...code, ...elders, ...sem]) assert.ok(idsInLijst.includes(id), `${id} staat niet in de dekkingslijst`);
});

test('herkenGebieden: een lege meting geeft niets, en is geen "niet aanwezig"', () => {
  assert.deepEqual(herkenGebieden({}, { htmlTaal: 'nl' }), []);
});

test('herkenGebieden: een kaart achter een toestemmingsscherm telt, met die mededeling', () => {
  const t = herkenGebieden({ geblokkeerd: [{ soort: 'kaart', pad: 'div' }], iframeSoorten: {}, kaartenZonderIframe: [] }, { htmlTaal: 'nl' });
  const kaart = t.find((x) => x.gebied === 'G29');
  assert.ok(kaart);
  assert.match(kaart!.bewijs, /toestemmingsscherm/);
});

const pagina = (pad: string, a: KandidaatInvoer['aanwijzingen'] = {}, bronnen = ['sitemap']): KandidaatInvoer => ({
  urlNorm: `https://www.x.nl${pad}`,
  soort: 'html',
  status: 'kandidaat',
  bronnen,
  aanwijzingen: a,
});

const pool: KandidaatInvoer[] = [
  pagina('/'),
  pagina('/klant', {}, ['klant', 'sitemap']),
  ...Array.from({ length: 30 }, (_, i) => pagina(`/formulier-${i}`, { formulieren: 1 })),
  ...Array.from({ length: 5 }, (_, i) => pagina(`/tabel-${i}`, { tabellen: 2 })),
  pagina('/video', { video: 1 }),
  ...Array.from({ length: 100 }, (_, i) => pagina(`/stil-${i}`)),
  { ...pagina('/uitgesloten'), status: 'uitgesloten' },
];

test('laag A gaat altijd mee: homepage en klantpagina', () => {
  const { gekozen } = kiesPaginas(pool, 'https://www.x.nl/', STANDAARD_CONFIG);
  const a = gekozen.filter((g) => g.laag === 'A').map((g) => g.urlNorm);
  assert.deepEqual(a.sort(), ['https://www.x.nl/', 'https://www.x.nl/klant']);
  assert.ok(gekozen.find((g) => g.urlNorm === 'https://www.x.nl/')!.redenen.includes('HOMEPAGE'));
});

test('laag B wisselt af per aanwijzing: de talrijke formulieren eten het budget niet op', () => {
  const { gekozen } = kiesPaginas(pool, 'https://www.x.nl/', STANDAARD_CONFIG);
  const b = gekozen.filter((g) => g.laag === 'B');
  assert.ok(b.some((g) => g.redenen[0] === 'VIDEO_AANWIJZING'));
  assert.equal(b.filter((g) => g.redenen[0] === 'TABEL_AANWIJZING').length, 5);
  assert.ok(b.filter((g) => g.redenen[0] === 'FORMULIER_AANWIJZING').length < 30);
});

test('laag C krijgt zijn gereserveerde deel, uit pagina’s zonder aanwijzing', () => {
  const { gekozen, uitleg } = kiesPaginas(pool, 'https://www.x.nl/', STANDAARD_CONFIG);
  const c = gekozen.filter((g) => g.laag === 'C');
  assert.equal(c.length, Math.ceil(STANDAARD_CONFIG.budget * STANDAARD_CONFIG.aandeelGespreid));
  assert.ok(c.every((g) => g.urlNorm.includes('/stil-') && g.redenen.join() === 'GESPREIDE_AANVULLING'));
  assert.equal(gekozen.length, STANDAARD_CONFIG.budget);
  assert.equal(uitleg.budget, 40);
});

test('reproduceerbaar: zelfde invoer en seed geeft dezelfde lijst; een andere seed niet', () => {
  const a = kiesPaginas(pool, 'https://www.x.nl/', STANDAARD_CONFIG).gekozen;
  const b = kiesPaginas([...pool].reverse(), 'https://www.x.nl/', STANDAARD_CONFIG).gekozen;
  assert.deepEqual(a.map((g) => g.urlNorm).sort(), b.map((g) => g.urlNorm).sort());
  const c = kiesPaginas(pool, 'https://www.x.nl/', { ...STANDAARD_CONFIG, seed: 'anders' }).gekozen;
  assert.notDeepEqual(a.filter((g) => g.laag === 'C').map((g) => g.urlNorm).sort(), c.filter((g) => g.laag === 'C').map((g) => g.urlNorm).sort());
});

test('uitgesloten pagina’s en extra’s', () => {
  const { gekozen } = kiesPaginas(pool, 'https://www.x.nl/', STANDAARD_CONFIG, ['https://www.x.nl/uitgesloten', 'https://www.x.nl/stil-99']);
  assert.ok(!gekozen.some((g) => g.urlNorm.endsWith('/uitgesloten')));
  const extra = gekozen.find((g) => g.urlNorm.endsWith('/stil-99'));
  assert.ok(extra && (extra.laag === 'extra' || extra.laag === 'C'));
});

test('een kleine site wordt helemaal geprofileerd', () => {
  const klein = pool.slice(0, 5);
  assert.equal(kiesPaginas(klein, 'https://www.x.nl/', STANDAARD_CONFIG).gekozen.length, 5);
});

test('documenten: klant altijd, verder gespreid over geschatte soorten', () => {
  const doc = (naam: string, bronnen = ['link']): KandidaatInvoer => ({ urlNorm: `https://cdn.nl/${naam}.pdf`, soort: 'document', status: 'kandidaat', bronnen, aanwijzingen: null });
  const docs = [doc('klant-besluit', ['klant']), ...['aanvraagformulier', 'raadsbesluit', 'folder-afval', 'jaarverslag', 'beleidsnota'].flatMap((n) => [doc(`${n}-1`), doc(`${n}-2`)])];
  const k = kiesDocumenten(docs, { ...STANDAARD_CONFIG, documentBudget: 6 });
  assert.equal(k[0].redenen[0], 'DOCUMENT_KLANT');
  assert.equal(new Set(k.slice(1).map((d) => d.geschatteSoort)).size, 5);
  assert.equal(schatDocumentSoort('https://x.nl/Aanvraagformulier%20parkeren.pdf'), 'formulier');
});

test('browserVondMeer: statisch nul, gemeten meer', () => {
  assert.deepEqual(
    browserVondMeer({ formulier: 0, tabel: 1, video: 0, iframe: 0, kaart: 0, documentlinks: 0 }, { formulier: 0, tabel: 1, video: 1, iframe: 0, kaart: 0, documentlinks: 2 }),
    ['video', 'documentlinks'],
  );
});
