import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import path from 'path';
import { hoofddomein, zoekKlantdata } from './klantdata';
import { casusId, controleerCasus, controleerPatroon, lijst, patroonId } from './validatie';
import type { Seed } from './seed';
import { categorieenUitPrototype, groepeer, PROTOTYPEN } from './categorieen';

/**
 * De controles van het beheer: klantdata (besluit 13), criteria tegen
 * wcag_criteria (besluit 5) en vaststellen (besluit 1).
 */

const seed = JSON.parse(
  readFileSync(path.join(__dirname, '../../docs/bibliotheek/seed-bibliotheek.json'), 'utf8'),
) as Seed;
const domeinen = [{ domein: 'beverwijk.nl', onderzoek: 'BEV-01' }];

test('klantdata: e-mail op een echt domein wel, op voorbeeld.nl niet', () => {
  assert.equal(zoekKlantdata('mail info@beverwijk.nl', []).length, 1);
  assert.equal(zoekKlantdata('mail info@voorbeeld.nl of a@example.com', []).length, 0);
});

test('klantdata: het 14-nummer en verzonnen reeksen mogen', () => {
  assert.deepEqual(zoekKlantdata('Bel 14 010 of 14 0123', []), []);
  assert.deepEqual(zoekKlantdata('Bel 012-3456789 of 0612345678', []), []);
  assert.equal(zoekKlantdata('Bel 0251-256256', [])[0]?.soort, 'telefoon');
});

test('klantdata: een URL op het domein van een onderzoek, met het onderzoek erbij', () => {
  const m = zoekKlantdata('<a href="https://www.beverwijk.nl/afval">', domeinen);
  assert.equal(m.length, 1);
  assert.match(m[0].uitleg, /BEV-01/);
  assert.equal(zoekKlantdata('<a href="https://www.waterdam.nl/">', domeinen).length, 0);
  assert.equal(zoekKlantdata('<a href="https://www.youtube-nocookie.com/x">', domeinen).length, 0);
});

test('klantdata: de seed geeft geen enkele melding zonder klantdomeinen', () => {
  for (const c of seed.casussen) {
    const tekst = [c.html, c.css ?? '', c.js ?? '', c.correcteCode].join('\n');
    assert.deepEqual(zoekKlantdata(tekst, []), [], c.id);
  }
});

test('domein van een onderzoek is de host die het vaakst voorkomt', () => {
  assert.equal(
    hoofddomein(['https://www.beverwijk.nl/a', 'https://beverwijk.nl/b', 'https://youtube.com/x', null]),
    'beverwijk.nl',
  );
});

const criteria = new Set(['1.3.1', '4.1.2']);
const geldig = {
  titel: 'Rijkop als td',
  criteria: '1.3.1',
  oordeel: 'afkeur',
  herkomst: 'template',
  wcag: ['wcag_2_1', 'wcag_2_2'],
};

test('patroon: onbekend criterium wordt geweigerd met de code erbij', () => {
  const { fouten } = controleerPatroon({ ...geldig, criteria: '1.3.1, 4.1.1' }, criteria);
  assert.ok(fouten.some((f) => f.includes('4.1.1')));
});

test('patroon: vaststellen vraagt een naam en kan niet bij twijfel', () => {
  assert.ok(controleerPatroon({ ...geldig, status: 'vastgesteld' }, criteria).fouten.length > 0);
  assert.deepEqual(controleerPatroon({ ...geldig, status: 'vastgesteld', vastgesteldDoor: 'Frits' }, criteria).fouten, []);
  const twijfel = controleerPatroon({ ...geldig, oordeel: 'twijfel', status: 'vastgesteld', vastgesteldDoor: 'Frits' }, criteria);
  assert.ok(twijfel.fouten.some((f) => f.includes('twijfel')));
});

test('patroon: concept bewaart geen vaststeller', () => {
  assert.equal(controleerPatroon({ ...geldig, vastgesteldDoor: 'Frits' }, criteria).data.vastgesteldDoor, null);
});

test('lijsten uit tekst: komma of regel, zonder dubbele', () => {
  assert.deepEqual(lijst('F91, H51\nF91'), ['F91', 'H51']);
});

test('ids volgen de seed en botsen niet', () => {
  assert.equal(patroonId(['1.3.1'], 'Rijkop als td', new Set()), 'P-131-rijkop-als-td');
  assert.equal(patroonId(['1.3.1'], 'Rijkop als td', new Set(['P-131-rijkop-als-td'])), 'P-131-rijkop-als-td-2');
  assert.equal(casusId(['131'], new Set(['131-N1'])), '131-N2');
});

test('casus: onbekende oefenset en lege HTML worden geweigerd', () => {
  const { fouten } = controleerCasus({ titel: 'x', html: ' ', oefensets: ['XYZ'] }, new Set(['131']));
  assert.equal(fouten.length, 2);
});

test('categorieën: elke casus uit de seed staat in een categorie van zijn prototype', () => {
  const gevonden = new Map<string, string>();
  for (const [set, bestand] of Object.entries(PROTOTYPEN)) {
    const html = readFileSync(path.join(__dirname, '../../docs/bibliotheek/prototypes', bestand), 'utf8');
    categorieenUitPrototype(html, set).forEach((kop, id) => gevonden.set(id, kop));
  }
  assert.equal(gevonden.size, 78);
  for (const c of seed.casussen) assert.ok(gevonden.has(c.id), c.id);
  assert.equal(gevonden.get('131-K1'), 'Koppen');
  assert.equal(gevonden.get('131-V1'), 'Valkuilen');
});

test('groeperen: volgorde van eerste voorkomen, leeg wordt Overig', () => {
  const g = groepeer([{ categorie: 'Koppen' }, { categorie: null }, { categorie: 'Koppen' }, { categorie: 'Lijsten' }]);
  assert.deepEqual(g.map((x) => [x.titel, x.casussen.length]), [['Koppen', 2], ['Overig', 1], ['Lijsten', 1]]);
});
