import test from 'node:test';
import assert from 'node:assert/strict';
import { leesIntakeblok } from './intakeblok';

/** Het blok zoals Work het leverde voor de opdracht van gemeente Nissewaard. */
const NISSEWAARD = `{
  "kenmerk": "nis-01",
  "url": "https://www.thuisinnissewaard.nl",
  "opdrachtgeverNaam": "gemeente Nissewaard",
  "opdrachtgeverKenmerk": "nis",
  "contactnaam": "Rosalie Kruijmel",
  "contactEmail": "r.kruijmel@nissewaard.nl",
  "accountmanager": "Katja",
  "hasReinspection": true,
  "reinspectionWeeks": 12
}`;

test('leest het blok van Nissewaard en zet kenmerken in hoofdletters', () => {
  const uit = leesIntakeblok(NISSEWAARD);
  assert.equal(uit.ok, true);
  if (!uit.ok) return;
  assert.equal(uit.blok.kenmerk, 'NIS-01');
  assert.equal(uit.blok.opdrachtgeverKenmerk, 'NIS');
  assert.equal(uit.blok.opdrachtgeverNaam, 'gemeente Nissewaard');
  assert.equal(uit.blok.hasReinspection, true);
  assert.equal(uit.blok.reinspectionWeeks, 12);
  assert.deepEqual(uit.waarschuwingen, []);
});

test('pakt het blok uit een codeblok met uitleg eromheen', () => {
  const uit = leesIntakeblok(
    `Hier is het intakeblok:\n\n\`\`\`json\n${NISSEWAARD}\n\`\`\`\n\nHet CRM-nummer moet nog worden toegekend.`
  );
  assert.equal(uit.ok, true);
  if (!uit.ok) return;
  assert.equal(uit.blok.kenmerk, 'NIS-01');
});

test('waarschuwt over een planning in plaats van die stil te negeren', () => {
  const uit = leesIntakeblok(`{
    "kenmerk": "NIS-01",
    "url": "https://www.thuisinnissewaard.nl",
    "dateStart": "2026-09-15",
    "dateEnd": "2026-09-26"
  }`);
  assert.equal(uit.ok, true);
  if (!uit.ok) return;
  assert.equal(uit.waarschuwingen.length, 2);
  assert.match(uit.waarschuwingen[0], /dateStart/);
  assert.match(uit.waarschuwingen[0], /scopegesprek/);
});

test('weigert een blok zonder kenmerk of url', () => {
  const zonderUrl = leesIntakeblok('{ "kenmerk": "NIS-01" }');
  assert.equal(zonderUrl.ok, false);
  if (zonderUrl.ok) return;
  assert.match(zonderUrl.fout, /kenmerk.*url|url/);

  const zonderKenmerk = leesIntakeblok('{ "url": "https://example.nl" }');
  assert.equal(zonderKenmerk.ok, false);
});

test('weigert tekst die geen JSON is, met uitleg', () => {
  assert.equal(leesIntakeblok('').ok, false);
  assert.equal(leesIntakeblok('geen blok maar gewone tekst').ok, false);
  assert.equal(leesIntakeblok('{ kapot').ok, false);
  assert.equal(leesIntakeblok('[1, 2, 3]').ok, false);
});

test('negeert een hertesttermijn zonder hertest', () => {
  const uit = leesIntakeblok(`{
    "kenmerk": "NIS-01",
    "url": "https://example.nl",
    "reinspectionWeeks": 12
  }`);
  assert.equal(uit.ok, true);
  if (!uit.ok) return;
  assert.equal(uit.blok.reinspectionWeeks, undefined);
  assert.match(uit.waarschuwingen[0], /hertesttermijn/);
});

test('meldt een onbekend veld met zijn naam', () => {
  const uit = leesIntakeblok(`{
    "kenmerk": "NIS-01",
    "url": "https://example.nl",
    "factuurnummer": "E10478-101"
  }`);
  assert.equal(uit.ok, true);
  if (!uit.ok) return;
  assert.match(uit.waarschuwingen[0], /factuurnummer/);
});
