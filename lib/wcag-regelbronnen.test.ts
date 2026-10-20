import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  haalWcagRegelbronnen,
  lijstCriteriumRegelCodes,
  regelBestandsnaam,
} from './wcag-regelbronnen';
import { bouwStand } from '../app/admin/projects/[id]/tabs/WaarStaIk/gegevens';

const ROOT = process.cwd();

function codeUitBestand(bestand: string, voorvoegsel: string): string | null {
  const match = bestand.match(new RegExp(`^${voorvoegsel}_(\\d+)_(\\d+)_(\\d+)\\.md$`));
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}

test('de regelmap bevat de volledige set van 33 contentcriteria', async () => {
  const codes = await lijstCriteriumRegelCodes();

  assert.equal(codes.length, 33);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) assert.match(code, /^\d\.\d{1,2}\.\d{1,2}$/);
});

test('ieder checklistcriterium heeft een criteriumregelbestand', async () => {
  const [regelCodes, checklistBestanden] = await Promise.all([
    lijstCriteriumRegelCodes(),
    readdir(path.join(ROOT, 'wcag-checklists')),
  ]);
  const checklistCodes = checklistBestanden
    .map((bestand) => codeUitBestand(bestand, 'Checklist_SC'))
    .filter((code): code is string => code !== null);

  const ontbrekend = checklistCodes.filter((code) => !regelCodes.includes(code));
  assert.deepEqual(ontbrekend, []);
  // 1.2.4 heeft wel Shift2-regels maar geen losse oude checklist. Dat is geen ontbrekend
  // criteriumregelbestand en wordt daarom bewust alleen aan deze kant gerapporteerd.
  assert.deepEqual(regelCodes.filter((code) => !checklistCodes.includes(code)), ['1.2.4']);
});

test('elk contentcriterium levert criteriumregels plus de drie algemene bronnen', async () => {
  for (const code of await lijstCriteriumRegelCodes()) {
    const bronnen = await haalWcagRegelbronnen(code);

    assert.equal(bronnen.bestandsnaam, regelBestandsnaam(code));
    assert.ok(bronnen.regels?.includes(code), `${code}: criteriumregels ontbreken`);
    assert.ok(bronnen.schrijfregels?.trim(), `${code}: schrijfgids ontbreekt`);
    assert.ok(bronnen.scope?.trim(), `${code}: scope ontbreekt`);
    assert.ok(bronnen.bewijsvoering?.trim(), `${code}: bewijsvoering ontbreekt`);
    assert.deepEqual(bronnen.ontbrekendeBronnen, []);
    assert.match(bronnen.bronversie, /^[a-f0-9]{12}$/);
  }
});

test('alle broncriteria blijven als aanklikbare rij en cel in het UI-model aanwezig', async () => {
  const codes = await lijstCriteriumRegelCodes();
  const criteria = codes.map((code) => ({
    id: `criterium-${code}`,
    code,
    titleNl: code,
    level: 'AA',
  }));
  const project = {
    sampleItems: [
      {
        id: 'sample-1',
        title: 'Voorbeeldpagina',
        sampleType: 'webpage',
        url: 'https://example.test/',
        criterionChecks: criteria.map((criterium) => ({
          wcagCriterionId: criterium.id,
          status: 'niet_te_bepalen',
          reden: `Open vraag voor ${criterium.code}`,
        })),
      },
    ],
    findings: [],
  };

  const stand = bouwStand(project, criteria);
  assert.deepEqual(stand.criteria.map((criterium) => criterium.code), codes);
  for (const code of codes) {
    assert.ok(stand.celVoor('sample-1', code), `${code}: geen aanklikbare matrixcel`);
  }
});

test('een criterium zonder regelbestand houdt de algemene bronnen en meldt wat ontbreekt', async () => {
  const bronnen = await haalWcagRegelbronnen('9.9.9');

  assert.equal(bronnen.regels, null);
  assert.deepEqual(bronnen.ontbrekendeBronnen, [
    'wcag-regels/Shift2_Regels_SC_9_9_9.md',
  ]);
  assert.ok(bronnen.schrijfregels?.trim());
  assert.ok(bronnen.scope?.trim());
  assert.ok(bronnen.bewijsvoering?.trim());
});

