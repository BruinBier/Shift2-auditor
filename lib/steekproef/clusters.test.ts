import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bouwDendrogram, gelijkenis, snij, type ClusterInvoer } from './clusters';
import { maakVingerafdruk, normaliseerKlasse, type Vingerafdruk } from './vingerafdruk';

/**
 * Wat de vingerafdruk NIET mag zien (tekst, ids, hashes, aantallen, redactionele inhoud)
 * en wat de clustering moet doen (deterministisch, geen ketens).
 */

const pagina = (main: string, cms?: { type: string; paragrafen: string[]; intro?: boolean }) =>
  `<html><body><header><nav>menu</nav></header><main>${main}</main>${
    cms
      ? `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
          props: {
            pageProps: {
              contentDetails: {
                data: {
                  route: {
                    nodeContext: {
                      __typename: 'NodePage',
                      entityBundle: cms.type,
                      fieldIntroduction: cms.intro ? { value: 'x' } : null,
                      fieldParagraphs: cms.paragrafen.map((b) => ({ entity: { __typename: 'Paragraph', entityBundle: b } })),
                    },
                  },
                },
              },
            },
          },
        })}</script>`
      : ''
  }</body></html>`;

test('klassen: CSS-modulehash, nummers en utility vallen weg', () => {
  assert.equal(normaliseerKlasse('ParagraphList-module-scss-module__1h4Lfq__items'), 'ParagraphList__items');
  assert.equal(normaliseerKlasse('item_0'), null);
  assert.equal(normaliseerKlasse('col-3'), null);
  assert.equal(normaliseerKlasse('mt-4'), null);
  assert.equal(normaliseerKlasse('content-wrapper'), 'content-wrapper');
});

test('tekst, ids en het aantal lijstitems veranderen de vingerafdruk niet', () => {
  const a = maakVingerafdruk(pagina('<article id="n123"><h1>Paspoort</h1><ul class="lijst"><li>een</li><li>twee</li></ul></article>'));
  const b = maakVingerafdruk(pagina('<article id="n987"><h1>Rijbewijs</h1><ul class="lijst"><li>a</li><li>b</li><li>c</li><li>d</li></ul></article>'));
  assert.deepEqual(a.dom, b.dom);
  assert.deepEqual(a.kop, b.kop);
  assert.equal(gelijkenis(a, b), 1);
});

test('de binnenkant van een redactioneel tekstveld telt niet; het veld zelf wel', () => {
  const kaal = maakVingerafdruk(pagina('<article><h1>T</h1><div class="text-container"><p>x</p></div></article>'));
  const rijk = maakVingerafdruk(
    pagina('<article><h1>T</h1><div class="text-container"><h2>a</h2><h3>b</h3><table><tr><td>1</td></tr></table><div class="VideoContainer">v</div></div></article>'),
  );
  assert.deepEqual(kaal.dom, rijk.dom);
  assert.deepEqual(kaal.kop, rijk.kop);
  const zonderVeld = maakVingerafdruk(pagina('<article><h1>T</h1></article>'));
  assert.notDeepEqual(kaal.dom, zonderVeld.dom);
});

test('CMS-data: inhoudstype, componenten in volgorde, structurele velden; geen inhoud', () => {
  const v = maakVingerafdruk(pagina('<article></article>', { type: 'page', paragrafen: ['text', 'text', 'dynamic_map'], intro: true }));
  assert.equal(v.versie, 1, 'de opgeslagen vingerafdruk draagt zijn eigen versie');
  assert.equal(v.inhoudstype, 'page');
  assert.equal(v.componenten, 'text > dynamic_map');
  assert.ok(v.cms.includes('comp:dynamic_map'));
  assert.ok(v.cms.includes('volg:text>dynamic_map'));
  assert.ok(v.cms.includes('veld:fieldIntroduction'));
});

test('ander inhoudstype, of CMS tegenover geen CMS: gelijkenis 0', () => {
  const a = maakVingerafdruk(pagina('<article></article>', { type: 'page', paragrafen: ['text'] }));
  const b = maakVingerafdruk(pagina('<article></article>', { type: 'news', paragrafen: ['text'] }));
  const c = maakVingerafdruk(pagina('<article></article>'));
  assert.equal(gelijkenis(a, b), 0);
  assert.equal(gelijkenis(a, c), 0);
});

// Kunstmatige vingerafdrukken om de clustering los te testen.
const vf = (dom: string[]): Vingerafdruk => ({ versie: 1, inhoudstype: null, cms: [], componenten: null, dom, skelet: [], kop: [], bereik: 'main' });
const inv = (u: string, dom: string[]): ClusterInvoer => ({ urlNorm: `https://x.nl/${u}`, titel: null, vingerafdruk: vf(dom) });

test('complete linkage: een keten A~B~C met A en C ongelijk wordt geen cluster', () => {
  // Gelijkenis (0,8 dom + 0,2 lege koppen): A~B 0,73, B~C 0,73, A~C 0,54. Single linkage
  // zou bij 0,6 alle drie samenvoegen via B; complete linkage niet.
  const A = inv('a', ['1', '2', '3', '4', '5']);
  const B = inv('b', ['1', '2', '3', '4', '6']);
  const C = inv('c', ['1', '2', '3', '6', '7']);
  const d = bouwDendrogram([A, B, C]);
  const c = snij(d, 0.6);
  assert.ok(c.every((x) => x.leden.length < 3), 'A, B en C mogen bij 0,6 niet samen');
  assert.equal(snij(d, 0.5).length, 1, 'bij 0,5 is A~C hoog genoeg');
});

test('deterministisch: volgorde van invoer maakt niet uit; drempels delen één boom', () => {
  const pag = ['a', 'b', 'c', 'd', 'e', 'f'].map((u, i) => inv(u, i < 3 ? ['x', 'y', 'z', String(i)] : ['p', 'q', 'r', String(i)]));
  const een = snij(bouwDendrogram(pag), 0.5);
  const twee = snij(bouwDendrogram([...pag].reverse()), 0.5);
  assert.deepEqual(een, twee);
  assert.equal(een.length, 2);
  assert.equal(een[0].representant, 'https://x.nl/a');
  // Een hogere drempel splitst alleen verder, voegt nooit samen.
  const hoog = snij(bouwDendrogram(pag), 0.95);
  assert.ok(hoog.length >= een.length);
});
