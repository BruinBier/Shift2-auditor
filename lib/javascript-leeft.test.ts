import test from 'node:test';
import assert from 'node:assert/strict';
import { beoordeelJavascript, type JavascriptWaarneming } from './javascript-leeft';

const basis: JavascriptWaarneming = {
  actiefFramework: null,
  sporen: [],
  scripts: 3,
  jsBediening: 4,
  afhandelaars: { elementen: 0, document: 0, window: 0 },
};

test('React-site die draait: gehydrateerd', () => {
  const o = beoordeelJavascript({ ...basis, actiefFramework: 'React', sporen: ['Next.js'], afhandelaars: null });
  assert.equal(o.javascript, 'gehydrateerd');
  assert.equal(o.gehydrateerd, true);
  assert.equal(o.waarschuwing, undefined);
});

test('Next.js-HTML zonder React-sleutels (heuvelrug.nl, 15 aug 2026): waarschuwing', () => {
  const o = beoordeelJavascript({ ...basis, sporen: ['Next.js'], afhandelaars: { elementen: 0, document: 2, window: 1 } });
  assert.equal(o.javascript, 'niet-gehydrateerd');
  assert.equal(o.gehydrateerd, false);
  assert.match(o.waarschuwing!, /GEEN conclusies/);
});

test('gewone JavaScript met afhandelaars (oefensite 2.4.7, 16 okt 2026): geen waarschuwing', () => {
  const o = beoordeelJavascript({ ...basis, afhandelaars: { elementen: 5, document: 1, window: 0 } });
  assert.equal(o.javascript, 'geen-framework');
  assert.equal(o.gehydrateerd, true);
  assert.equal(o.waarschuwing, undefined);
});

test('alleen een gedelegeerde afhandelaar op document telt ook', () => {
  const o = beoordeelJavascript({ ...basis, afhandelaars: { elementen: 0, document: 1, window: 0 } });
  assert.equal(o.gehydrateerd, true);
});

test('statische pagina zonder iets dat JavaScript nodig heeft: geen waarschuwing', () => {
  const o = beoordeelJavascript({ ...basis, scripts: 0, jsBediening: 0 });
  assert.equal(o.javascript, 'geen-framework');
  assert.equal(o.gehydrateerd, true);
});

test('uitklapknoppen en scripts, maar nergens een afhandelaar: waarschuwing', () => {
  const o = beoordeelJavascript(basis);
  assert.equal(o.javascript, 'geen-afhandelaars');
  assert.equal(o.gehydrateerd, false);
  assert.match(o.waarschuwing!, /GEEN conclusies/);
});

test('afhandelaars niet te tellen: geen vals alarm', () => {
  const o = beoordeelJavascript({ ...basis, afhandelaars: null });
  assert.equal(o.gehydrateerd, true);
});
