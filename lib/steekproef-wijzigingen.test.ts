import assert from 'node:assert/strict';
import test from 'node:test';
import {
  steekproefMetWijzigingen,
  STATUS_TOEGEVOEGD,
  STATUS_VERVALLEN,
} from './steekproef-wijzigingen';

const p = (url: string) => ({ url, title: url });

test('BEV-01: vervallen pagina achteraan, vervangende pagina gemarkeerd', () => {
  const nulmeting = [p('https://www.beverwijk.nl/'), p('https://www.beverwijk.nl/groene-verhalen')];
  const huidig = [
    p('https://www.beverwijk.nl/wat-te-doen-bij-een-noodsituatie'),
    p('https://www.beverwijk.nl/'),
  ];
  assert.deepEqual(
    steekproefMetWijzigingen(huidig, nulmeting).map((r) => [r.item.url, r.status]),
    [
      ['https://www.beverwijk.nl/wat-te-doen-bij-een-noodsituatie', STATUS_TOEGEVOEGD],
      ['https://www.beverwijk.nl/', null],
      ['https://www.beverwijk.nl/groene-verhalen', STATUS_VERVALLEN],
    ]
  );
});

test('zonder nulmeting geen labels', () => {
  const huidig = [p('https://a.nl/x')];
  assert.deepEqual(steekproefMetWijzigingen(huidig, null), [{ item: huidig[0], status: null }]);
});

test('slash aan het eind, hoofdletters in de host en een anker tellen niet als verschil', () => {
  const regels = steekproefMetWijzigingen(
    [p('https://WWW.Beverwijk.nl/contact/#openingstijden')],
    [p('https://www.beverwijk.nl/contact')]
  );
  assert.deepEqual(regels.map((r) => r.status), [null]);
});

test('de querystring telt wel: een ander PDF-bestand is een andere pagina', () => {
  const regels = steekproefMetWijzigingen(
    [p('https://cdn.nl/doc.pdf?cb=B')],
    [p('https://cdn.nl/doc.pdf?cb=A')]
  );
  assert.deepEqual(regels.map((r) => r.status), [STATUS_TOEGEVOEGD, STATUS_VERVALLEN]);
});

test('een pagina zonder URL wordt op titel vergeleken', () => {
  const regels = steekproefMetWijzigingen(
    [{ url: null, title: 'Formulier stap 2' }],
    [{ url: null, title: 'Formulier stap 2' }]
  );
  assert.deepEqual(regels.map((r) => r.status), [null]);
});
