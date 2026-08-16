import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUserAgentsHtml, type DetectedBrowser } from './browser-versions';

const chrome: DetectedBrowser = {
  name: 'Google Chrome',
  majorVersion: 151,
  fullVersion: '151.0.7922.109',
};
const firefox: DetectedBrowser = {
  name: 'Mozilla Firefox',
  majorVersion: 153,
  fullVersion: '153.0.1',
};
const edge: DetectedBrowser = {
  name: 'Microsoft Edge',
  majorVersion: 150,
  fullVersion: '150.0.4078.99',
};

test('zet de major-versie in de lijst, niet het volledige buildnummer', () => {
  const html = buildUserAgentsHtml([chrome]) ?? '';
  assert.ok(html.includes('<li>Google Chrome, versie 151 (primair)</li>'));
  assert.ok(!html.includes('7922'));
});

test('markeert alleen de eerste browser als primair', () => {
  const html = buildUserAgentsHtml([chrome, firefox, edge]) ?? '';
  assert.equal(html.match(/\(primair\)/g)?.length, 1);
  assert.ok(html.includes('<li>Mozilla Firefox, versie 153</li>'));
});

test('houdt Chrome vooraan ongeacht de detectievolgorde', () => {
  const html = buildUserAgentsHtml([edge, firefox, chrome]) ?? '';
  assert.ok(html.indexOf('Google Chrome') < html.indexOf('Mozilla Firefox'));
  assert.ok(html.indexOf('Mozilla Firefox') < html.indexOf('Microsoft Edge'));
});

test('voegt de vaste hulpmiddelen en de schermlezer toe', () => {
  const html = buildUserAgentsHtml([chrome]) ?? '';
  assert.ok(html.includes('Adobe Acrobat Pro'));
  assert.ok(html.includes('PDF Accessibility Checker (PAC) 2024'));
  assert.ok(html.includes('Colour Contrast Analyser'));
  assert.ok(html.includes('NVDA (Windows) in combinatie met Google Chrome'));
});

test('slaat een browser over die niet gevonden is', () => {
  const html = buildUserAgentsHtml([chrome, edge]) ?? '';
  assert.ok(!html.includes('Firefox, versie'));
});

test('geeft null als er niets is gedetecteerd, zodat de bestaande waarde blijft staan', () => {
  assert.equal(buildUserAgentsHtml([]), null);
});
