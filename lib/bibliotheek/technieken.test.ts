import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import path from 'path';
import { herkenTechnieken } from './technieken';

test('herkent codes in vrije tekst, zonder dubbelen en zonder onbekende', () => {
  const r = herkenTechnieken('F65, Situatie A: G94 met H37, XYZ9, F65');
  assert.deepEqual(r.map((t) => t.code), ['F65', 'G94', 'H37']);
  assert.equal(r[0].url, 'https://www.w3.org/WAI/WCAG22/Techniques/failures/F65');
  assert.equal(herkenTechnieken('ARIA 1.2: iets').length, 0);
  assert.ok(herkenTechnieken('ARIA22')[0].url.endsWith('/aria/ARIA22'));
});

test('elke code in de seed heeft een uitleg', () => {
  const seed = JSON.parse(readFileSync(path.join(process.cwd(), 'docs/bibliotheek/seed-bibliotheek.json'), 'utf-8'));
  const codes = new Set<string>();
  for (const p of seed.patronen) {
    for (const t of p.technieken as string[]) for (const m of Array.from(t.matchAll(/\b(?:ARIA|C|F|G|H)\d{1,3}\b/g))) codes.add(m[0]);
  }
  const bekend = new Set(herkenTechnieken(Array.from(codes).join(' ')).map((t) => t.code));
  assert.deepEqual(Array.from(codes).filter((c) => !bekend.has(c)), []);
});

test('herkent de situaties in het techniekenveld', async () => {
  const { herkenSituaties } = await import('./technieken');
  assert.deepEqual(herkenSituaties('F65, Situatie A: G94 met H37, Situatie F: H67 of C9, Situatie A').map((s) => s.letter), ['A', 'F']);
  assert.equal(herkenSituaties('Correct').length, 0);
});
