import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oordeelUitChecks } from './criterion-assessment';

/**
 * De rekenregel die van de oordelen per pagina één projectoordeel maakt.
 *
 * Vastgesteld met Frits op 2026-08-02, aangescherpt op 2026-08-03. Hij staat op één
 * plek en wordt vanaf twee kanten aangeroepen: bij het opslaan van de sampleoordelen
 * en door de knop `derive-assessments`. Liepen die uit elkaar, dan gaf de knop een
 * ander antwoord dan de audit zelf net had weggeschreven, en dat verschil zie je pas
 * in het rapport.
 */

test('een afkeuring ergens maakt het criterium failed', () => {
  assert.equal(oordeelUitChecks(['voldoet', 'afgekeurd']), 'failed');
  assert.equal(oordeelUitChecks(['opmerking', 'afgekeurd']), 'failed');
  assert.equal(oordeelUitChecks(['niet_aanwezig', 'afgekeurd']), 'failed');
});

test('alleen voldoet, eventueel met opmerkingen, is passed', () => {
  assert.equal(oordeelUitChecks(['voldoet', 'voldoet']), 'passed');
  assert.equal(oordeelUitChecks(['voldoet', 'opmerking']), 'passed');
});

test('een opmerking is geen WCAG-schending', () => {
  assert.equal(oordeelUitChecks(['opmerking']), 'passed');
});

test('overal niet aanwezig is not_present, niet passed', () => {
  assert.equal(oordeelUitChecks(['niet_aanwezig', 'niet_aanwezig']), 'not_present');
});

test('één pagina waar het wel speelt maakt het passed', () => {
  assert.equal(oordeelUitChecks(['niet_aanwezig', 'voldoet']), 'passed');
});

test('niet_te_bepalen levert geen tegenbewijs en telt niet mee', () => {
  // Daar is niets gevonden dat het criterium schendt, alleen iets dat niet te toetsen
  // viel. Is 1.3.2 op de HTML-pagina's in orde en bij een ongetagde PDF niet te bepalen,
  // dan is het projectoordeel gewoon passed; de ontbrekende tags gaan via 1.3.1.
  assert.equal(oordeelUitChecks(['niet_te_bepalen', 'voldoet']), 'passed');
  assert.equal(oordeelUitChecks(['niet_te_bepalen', 'afgekeurd']), 'failed');
  assert.equal(oordeelUitChecks(['niet_te_bepalen', 'niet_aanwezig']), 'not_present');
});

test('staat alles op niet_te_bepalen, dan is er geen oordeel', () => {
  // Null en niet 'passed': er is werkelijk niets vastgesteld. Het criterium blijft
  // onbeslist en blokkeert het afronden.
  assert.equal(oordeelUitChecks(['niet_te_bepalen', 'niet_te_bepalen']), null);
});

test('zonder oordelen valt er niets af te leiden', () => {
  assert.equal(oordeelUitChecks([]), null);
});

/**
 * Een pagina zonder oordeel is niet hetzelfde als `niet_te_bepalen`: daar heeft nog niemand
 * gekeken. LEU-01, 3 oktober 2026: dertien pagina's op `niet_aanwezig` via het videovinkje,
 * HackShield met video en nog geen audit, en 1.2.3 stond al op "niet aanwezig".
 */
test('een pagina zonder oordeel houdt het criterium open', () => {
  const dertien = Array(13).fill('niet_aanwezig');
  assert.equal(oordeelUitChecks(dertien, 1), null);
  assert.equal(oordeelUitChecks(['voldoet', 'voldoet'], 1), null);
  assert.equal(oordeelUitChecks([], 3), null);
});

test('een afkeuring blijft staan, ook met pagina\'s zonder oordeel', () => {
  assert.equal(oordeelUitChecks(['niet_aanwezig', 'afgekeurd'], 2), 'failed');
});

test('zonder ontbrekende pagina\'s geldt de oude regel', () => {
  assert.equal(oordeelUitChecks(Array(13).fill('niet_aanwezig'), 0), 'not_present');
  assert.equal(oordeelUitChecks(['niet_te_bepalen', 'voldoet'], 0), 'passed');
});
