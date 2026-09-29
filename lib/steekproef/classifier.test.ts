import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentHash, controleerAntwoorden, maakOpdracht } from './classifier';
import { effectiefAntwoord, VRAGEN } from './vragen';

/**
 * De naad met de aanbieder: dezelfde invoer geeft dezelfde sleutel (cache), een ander
 * antwoord dan de gesloten lijst wordt geweigerd, en laag is altijd twijfel.
 */

test('elke vraag heeft een twijfel-uitweg, uitleg per antwoord, en telt niet mee voor selectie', () => {
  for (const v of Object.values(VRAGEN)) {
    assert.ok(v.antwoorden.includes('twijfel' as never), `${v.id} mist twijfel`);
    for (const a of v.antwoorden) assert.ok((v.uitleg as any)[a], `${v.id}: geen uitleg bij ${a}`);
    assert.equal(v.gebruiktInSelectie, false);
  }
});

test('contentHash: sleutelvolgorde maakt niet uit, inhoud wel', () => {
  assert.equal(contentHash({ a: 1, b: [1, 2] }), contentHash({ b: [1, 2], a: 1 }));
  assert.notEqual(contentHash({ a: 1 }), contentHash({ a: 2 }));
});

test('zelfde onderwerp + invoer + vraag = zelfde sleutel; andere invoer = andere sleutel', () => {
  const a = maakOpdracht('paginarol', 'https://x.nl/a', { titel: 'A' });
  const b = maakOpdracht('paginarol', 'https://x.nl/a', { titel: 'A' });
  const c = maakOpdracht('paginarol', 'https://x.nl/a', { titel: 'A gewijzigd' });
  const d = maakOpdracht('dienstverlening', 'https://x.nl/a', { titel: 'A' });
  assert.equal(a.sleutel, b.sleutel);
  assert.notEqual(a.sleutel, c.sleutel);
  assert.notEqual(a.sleutel, d.sleutel);
});

test('een afbeelding telt mee in de hash: andere beeldpunten = nieuwe vraag', () => {
  const a = maakOpdracht('beeldcategorie', 'https://x.nl/i.jpg', { alt: 'x' }, { afbeeldingHash: 'aaa' });
  const b = maakOpdracht('beeldcategorie', 'https://x.nl/i.jpg', { alt: 'x' }, { afbeeldingHash: 'bbb' });
  assert.notEqual(a.sleutel, b.sleutel);
});

test('antwoorden buiten de gesloten lijst worden geweigerd, niet omgezet', () => {
  const o = maakOpdracht('dienstverlening', 'https://x.nl/a', { titel: 'A' });
  const r = controleerAntwoorden([o], [
    { sleutel: o.sleutel, antwoord: 'misschien', zekerheid: 'hoog', reden: '' },
    { sleutel: o.sleutel, antwoord: 'ja', zekerheid: 'zeker', reden: '' } as any,
    { sleutel: 'onbekend', antwoord: 'ja', zekerheid: 'hoog', reden: '' },
    { sleutel: o.sleutel, antwoord: 'ja', zekerheid: 'middel', reden: 'knop Aanvragen' },
  ]);
  assert.equal(r.geldig.length, 1);
  assert.equal(r.ongeldig.length, 3);
});

test('laag is altijd twijfel; middel en hoog blijven het ruwe antwoord', () => {
  assert.equal(effectiefAntwoord('ja', 'laag'), 'twijfel');
  assert.equal(effectiefAntwoord('ja', 'middel'), 'ja');
  assert.equal(effectiefAntwoord('product_dienst', 'hoog'), 'product_dienst');
});
