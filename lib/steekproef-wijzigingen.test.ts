import assert from 'node:assert/strict';
import test from 'node:test';
import {
  steekproefMetWijzigingen,
  STATUS_TOEGEVOEGD,
  STATUS_VERVALLEN,
  telWijzigingen,
} from './steekproef-wijzigingen';
import { samenvattingHtml } from './samenvatting';

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

test('telWijzigingen telt nieuwe en vervallen pagina\'s', () => {
  const regels = steekproefMetWijzigingen(
    [p('https://a.nl/nieuw'), p('https://a.nl/blijft'), p('https://a.nl/ook-nieuw')],
    [p('https://a.nl/weg'), p('https://a.nl/blijft')]
  );
  assert.deepEqual(telWijzigingen(regels), { nieuw: 2, vervallen: 1 });
});

test('samenvatting heronderzoek: "dezelfde" alleen zonder vervangen pagina\'s', () => {
  const basis = {
    project: { checkPhase: 'herinspectie', parentProjectId: 'p1' } as any,
    totalPages: 21,
    uniqueForms: 21,
    totalCriteria: 30,
    passedCriteria: 19,
    failedCriteria: 11,
    dateStart: '7 oktober 2026',
    dateEnd: '14 oktober 2026',
  };
  const zonder = samenvattingHtml(basis);
  assert.match(zonder, /dezelfde 21 gepubliceerde webpagina's opnieuw beoordeeld/);

  const met = samenvattingHtml({ ...basis, steekproefNieuw: 2, steekproefVervallen: 2 });
  assert.doesNotMatch(met, /dezelfde 21/);
  assert.match(met, /zijn 21 gepubliceerde webpagina's beoordeeld\. Daarvan zijn er 2 nieuw: ze vervangen pagina's uit/);

  const een = samenvattingHtml({ ...basis, steekproefNieuw: 1, steekproefVervallen: 1 });
  assert.match(een, /Daarvan is er 1 nieuw: die vervangt een pagina uit .* die niet meer bestond\./);
});
