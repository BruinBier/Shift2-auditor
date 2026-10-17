import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import path from 'path';
import {
  casusDocument,
  dedent,
  feedbackTekst,
  GOED,
  juistAntwoord,
  korteId,
  oordeelUitDatabase,
  pillTekst,
  teltMee,
  type Antwoord,
} from './oefenen';
import { berekenOvereenstemming } from './overeenstemming';
import type { Seed } from './seed';

/**
 * De regels van de oefenmodus (SPEC.md, Oefenmodus en besluiten 6 en 7), en
 * de acceptatietoets van fase 1 voor alle casussen uit de seed: het juiste
 * antwoord geeft "Goed beoordeeld", het verkeerde "Niet goed".
 */

const seed = JSON.parse(
  readFileSync(path.join(__dirname, '../../docs/bibliotheek/seed-bibliotheek.json'), 'utf8'),
) as Seed;

test('afkeur heeft Afkeur als juist antwoord', () => {
  assert.equal(juistAntwoord('afkeur'), 'afkeur');
});

test('geen-afkeur en advies hebben Geen afkeur als juist antwoord (besluit 6)', () => {
  assert.equal(juistAntwoord('geen-afkeur'), 'geen-afkeur');
  assert.equal(juistAntwoord('advies'), 'geen-afkeur');
});

test('twijfel heeft geen juist antwoord en telt niet mee (besluit 7)', () => {
  assert.equal(juistAntwoord('twijfel'), null);
  assert.equal(teltMee('twijfel'), false);
  assert.equal(teltMee('advies'), true);
});

test('feedback bij een fout antwoord noemt het oordeel en het criterium', () => {
  assert.equal(feedbackTekst('afkeur', ['1.3.1'], 'geen-afkeur').tekst, 'Niet goed: dit is een afkeur (1.3.1).');
  assert.equal(feedbackTekst('geen-afkeur', ['1.3.1'], 'afkeur').tekst, 'Niet goed: dit is geen afkeur (1.3.1).');
  assert.equal(
    feedbackTekst('advies', ['1.3.1'], 'afkeur').tekst,
    'Niet goed: dit is geen afkeur op 1.3.1 (wel een advies).',
  );
});

test('de pill toont Advies, niet Geen afkeur', () => {
  assert.equal(pillTekst('advies', ['1.3.1']), 'Advies');
  assert.equal(pillTekst('afkeur', ['1.3.1', '4.1.2']), 'Afkeur 1.3.1, 4.1.2');
  assert.equal(pillTekst('geen-afkeur', ['1.3.1']), 'Geen afkeur');
});

test('enumwaarden uit de database worden weer woorden uit de spec', () => {
  assert.equal(oordeelUitDatabase('geen_afkeur'), 'geen-afkeur');
  assert.equal(oordeelUitDatabase('afkeur'), 'afkeur');
});

test('korte id zoals in het prototype', () => {
  assert.equal(korteId('131-K1', '131'), 'K1');
  assert.equal(korteId('HUW-R3', 'HUW'), 'R3');
  assert.equal(korteId('HUW-R3', '131'), 'HUW-R3');
});

test('dedent haalt gemeenschappelijke inspringing en lege randen weg', () => {
  assert.equal(dedent('\n    <p>a</p>\n      <b>b</b>\n'), '<p>a</p>\n  <b>b</b>');
});

test('het testgebied krijgt geen toegang tot de app en wijst afbeeldingen naar de route', () => {
  const doc = casusDocument({ casusId: 'X1', html: '<img src="logo.svg" alt="">', js: 'var a = "</script>";' });
  assert.match(doc, /<base href="\/api\/bibliotheek\/afbeelding\/">/);
  assert.match(doc, /<img src="logo.svg" alt="">/);
  // Een </script> in casus-JS mag het document niet openbreken.
  assert.doesNotMatch(doc, /var a = "<\/script>"/);
});

test('acceptatie fase 1: voor elke casus geeft het juiste antwoord Goed, het verkeerde Niet goed', () => {
  const patronen = new Map(seed.patronen.map((p) => [p.id, p]));
  let getoetst = 0;
  for (const casus of seed.casussen) {
    const p = patronen.get(casus.patroonId)!;
    if (!teltMee(p.oordeel)) continue;
    const juist = juistAntwoord(p.oordeel)!;
    const fout: Antwoord = juist === 'afkeur' ? 'geen-afkeur' : 'afkeur';
    const goed = feedbackTekst(p.oordeel, p.criteria, juist);
    const nietGoed = feedbackTekst(p.oordeel, p.criteria, fout);
    assert.ok(goed.goed && goed.tekst.startsWith(GOED), `${casus.id}: juist antwoord`);
    assert.ok(!nietGoed.goed && nietGoed.tekst.startsWith('Niet goed'), `${casus.id}: fout antwoord`);
    getoetst++;
  }
  assert.equal(getoetst, 78);
});

test('overeenstemming volgens de rekenregel, ook voor de seed', () => {
  const crit = ['1.3.1'];
  assert.equal(berekenOvereenstemming({ oordeel: 'afkeur', criteria: crit }, { oordeel: 'afkeur', criteria: crit }), 'eens');
  assert.equal(
    berekenOvereenstemming({ oordeel: 'afkeur', criteria: ['4.1.2'] }, { oordeel: 'afkeur', criteria: crit }),
    'ander-criterium',
  );
  assert.equal(berekenOvereenstemming({ oordeel: 'afkeur', criteria: crit }, { oordeel: 'advies', criteria: crit }), 'te-streng');
  assert.equal(
    berekenOvereenstemming({ oordeel: 'geen-afkeur', criteria: crit }, { oordeel: 'afkeur', criteria: crit }),
    'te-soepel',
  );
  const patronen = new Map(seed.patronen.map((p) => [p.id, p]));
  for (const r of seed.rapportBevindingen) {
    const p = patronen.get(r.patroonId)!;
    const berekend = berekenOvereenstemming(
      { oordeel: r.rapportOordeel, criteria: r.rapportCriteria },
      { oordeel: p.oordeel, criteria: p.criteria },
    );
    assert.equal(berekend, r.overeenstemming, r.id);
  }
});
