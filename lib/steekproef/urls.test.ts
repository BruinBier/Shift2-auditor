import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leesPagina, schoneTitel } from './aanwijzingen';
import { normaliseer, sitecontextVoor, uitgeslotenDoor, uitsluitregel, urlsUitTekstveld } from './urls';

/**
 * De normalisatie bepaalt wat "dezelfde pagina" is. Een regel die hier verschuift, laat
 * pagina's dubbel in de pool staan of voegt twee verschillende pagina's samen -- en dan
 * klopt geen enkele telling in de inventarisatie meer. Vandaar een test per regel.
 */

const ctx = sitecontextVoor('https://www.leudal.nl/', ['leudal.nl']);
const n = (u: string, basis = 'https://www.leudal.nl/') => normaliseer(u, basis, ctx)?.urlNorm ?? null;

test('afsluitende slash, anker en hoofdletters in de host', () => {
  assert.equal(n('https://WWW.Leudal.nl/paspoort/'), 'https://www.leudal.nl/paspoort');
  assert.equal(n('https://www.leudal.nl/paspoort#kosten'), 'https://www.leudal.nl/paspoort');
  assert.equal(n('https://www.leudal.nl/'), 'https://www.leudal.nl/');
  assert.equal(n('https://www.leudal.nl'), 'https://www.leudal.nl/');
});

test('relatieve links worden absoluut', () => {
  assert.equal(n('/paspoort', 'https://www.leudal.nl/burgerzaken'), 'https://www.leudal.nl/paspoort');
  assert.equal(n('paspoort', 'https://www.leudal.nl/burgerzaken/'), 'https://www.leudal.nl/burgerzaken/paspoort');
});

test('www en zonder www zijn alleen hetzelfde als dat bewezen is', () => {
  assert.equal(n('https://leudal.nl/paspoort'), 'https://www.leudal.nl/paspoort');
  const zonderAlias = sitecontextVoor('https://www.leudal.nl/');
  assert.equal(normaliseer('https://leudal.nl/paspoort', 'https://leudal.nl/', zonderAlias)?.urlNorm, 'https://leudal.nl/paspoort');
});

test('http naar https alleen voor de eigen site', () => {
  assert.equal(n('http://www.leudal.nl/paspoort'), 'https://www.leudal.nl/paspoort');
  assert.equal(n('http://example.org/a'), 'http://example.org/a');
});

test('ruisparameters weg, de rest op vaste volgorde', () => {
  assert.equal(n('https://www.leudal.nl/nieuws?utm_source=x&fbclid=1'), 'https://www.leudal.nl/nieuws');
  assert.equal(n('https://www.leudal.nl/zoeken?b=2&a=1'), 'https://www.leudal.nl/zoeken?a=1&b=2');
  assert.equal(n('https://www.leudal.nl/zoeken?a=1&b=2'), 'https://www.leudal.nl/zoeken?a=1&b=2');
});

test('achter een document telt de query niet: de cachebreker van SIMsite', () => {
  assert.equal(
    n('https://cuatro.sim-cdn.nl/leudal/uploads/Folder%20x_8.pdf?cb=TxD7HPkD'),
    'https://cuatro.sim-cdn.nl/leudal/uploads/Folder%20x_8.pdf',
  );
  assert.equal(
    n('https://cuatro.sim-cdn.nl/leudal/uploads/Folder x_8.pdf'),
    'https://cuatro.sim-cdn.nl/leudal/uploads/Folder%20x_8.pdf',
  );
  assert.equal(normaliseer('https://x.nl/a.PDF', 'https://x.nl/', ctx)?.soort, 'document');
});

test('een voorleeslink van ReadSpeaker is hetzelfde document', () => {
  const doel = 'https://cuatro.sim-cdn.nl/leudal/uploads/a.pdf?cb=1';
  assert.equal(
    n(`https://docreader.readspeaker.com/docreader/?cid=abc&url=${encodeURIComponent(doel)}`),
    'https://cuatro.sim-cdn.nl/leudal/uploads/a.pdf',
  );
});

test('geen kandidaat: mailto, tel, afbeeldingen, stylesheets', () => {
  for (const u of ['mailto:a@b.nl', 'tel:14075', 'javascript:void(0)', '#top', 'https://www.leudal.nl/logo.svg', 'https://www.leudal.nl/x.css']) {
    assert.equal(n(u), null, u);
  }
});

test('uitsluitregels: hele host of pad met alles eronder', () => {
  const heuvelrug = sitecontextVoor('https://www.heuvelrug.nl/');
  const regels = ['https://mijn.heuvelrug.nl/', 'https://www.heuvelrug.nl/archief'].map((r) => uitsluitregel(r, heuvelrug)!);
  assert.ok(uitgeslotenDoor('https://mijn.heuvelrug.nl/zaken/1', regels));
  assert.ok(uitgeslotenDoor('https://www.heuvelrug.nl/archief', regels));
  assert.ok(uitgeslotenDoor('https://www.heuvelrug.nl/archief/2019', regels));
  assert.equal(uitgeslotenDoor('https://www.heuvelrug.nl/archiefbeheer', regels), null);
  assert.equal(uitgeslotenDoor('https://www.heuvelrug.nl/', regels), null);
});

test('een regel met query sluit alleen die variant uit; zonder query werkt hij op het pad', () => {
  const heuvelrug = sitecontextVoor('https://www.heuvelrug.nl/');
  const metQuery = [uitsluitregel('https://heuvelrug.mijnafspraakmaken.nl/&?product=306', heuvelrug)!];
  assert.ok(uitgeslotenDoor('https://heuvelrug.mijnafspraakmaken.nl/&?product=306', metQuery));
  assert.equal(uitgeslotenDoor('https://heuvelrug.mijnafspraakmaken.nl/&?product=1', metQuery), null);
  assert.equal(uitgeslotenDoor('https://heuvelrug.mijnafspraakmaken.nl/&', metQuery), null);

  // Volgorde van parameters en ruis tellen niet: de regel wordt net zo genormaliseerd.
  const twee = [uitsluitregel('https://www.heuvelrug.nl/zoeken?b=2&a=1&utm_source=x', heuvelrug)!];
  assert.ok(uitgeslotenDoor('https://www.heuvelrug.nl/zoeken?a=1&b=2', twee));

  // Een hostregel met query is ook precies: de host blijft verder in beeld.
  const hostMetQuery = [uitsluitregel('https://www.heuvelrug.nl/?taal=en', heuvelrug)!];
  assert.ok(uitgeslotenDoor('https://www.heuvelrug.nl/?taal=en', hostMetQuery));
  assert.equal(uitgeslotenDoor('https://www.heuvelrug.nl/paspoort', hostMetQuery), null);

  // Zonder query: het pad, met elke query eronder.
  const zonder = [uitsluitregel('https://www.heuvelrug.nl/archief', heuvelrug)!];
  assert.ok(uitgeslotenDoor('https://www.heuvelrug.nl/archief?jaar=2019', zonder));
});

test('URL-lijst uit een planningveld, met opsommingstekens', () => {
  assert.deepEqual(urlsUitTekstveld('- https://a.nl/x\n* https://b.nl/y.\nGeen url\n'), ['https://a.nl/x', 'https://b.nl/y']);
});

test('aanwijzingen tellen binnen main, niet het zoekveld in de header', () => {
  const html = `<html lang="nl"><head><title>Paspoort | Gemeente Leudal</title><link rel="canonical" href="/paspoort"></head><body>
    <header><form role="search"><input name="q"></form><img src="logo.png"></header>
    <main><form action="/verstuur"><input name="naam"><input name="email"></form>
    <table><tr><td>1</td></tr></table><table role="presentation"></table>
    <iframe src="https://www.youtube-nocookie.com/embed/x"></iframe>
    <a href="/uploads/a.pdf?cb=1">PDF</a></main></body></html>`;
  const l = leesPagina(html, 'https://www.leudal.nl/paspoort');
  assert.equal(l.titel, 'Paspoort');
  assert.equal(l.canonical, 'https://www.leudal.nl/paspoort');
  assert.equal(l.aanwijzingen.bereik, 'main');
  assert.equal(l.aanwijzingen.formulieren, 1);
  assert.equal(l.aanwijzingen.zoekformulieren, 0);
  assert.equal(l.aanwijzingen.tabellen, 1);
  assert.equal(l.aanwijzingen.video, 1);
  assert.equal(l.aanwijzingen.documentlinks, 1);
  assert.equal(l.aanwijzingen.afbeeldingen, 0);
});

const metNextData = (contentDetails: unknown, rest: Record<string, unknown> = {}) =>
  `<html><body><main><p>Tekst</p></main><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { contentDetails, ...rest } },
  })}</script></body></html>`;

test('paginadata: een YouTube-embed in de inhoud is een video-aanwijzing, geen iframe-aanwijzing', () => {
  const html = metNextData({
    fieldParagraphs: [{ __typename: 'ParagraphText', text: '<p><iframe src="https://www.youtube.com/embed/Ft9Nj-SqM9E?feature=oembed"></iframe></p>' }],
  });
  const p = leesPagina(html, 'https://www.leudal.nl/trainees').aanwijzingen.paginadata;
  assert.equal(p.bron, 'next-data');
  assert.equal(p.video, 1);
  assert.equal(p.iframe, 0);
  assert.equal(p.bewijs[0].reden, 'embed-url');
});

test('paginadata: ParagraphDynamicMap is een kaart; ParagraphMapMarker alleen niet', () => {
  const kaart = leesPagina(metNextData({ p: [{ __typename: 'ParagraphDynamicMap' }, { __typename: 'ParagraphMapMarker' }] }), 'https://x.nl/a').aanwijzingen.paginadata;
  assert.equal(kaart.kaart, 1);
  assert.equal(kaart.componenten.ParagraphMapMarker, 1);
  const alleenMarker = leesPagina(metNextData({ p: [{ __typename: 'ParagraphMapMarker' }] }), 'https://x.nl/a').aanwijzingen.paginadata;
  assert.equal(alleenMarker.kaart, 0);
});

test('paginadata: een andere iframe (widget) is een iframe-aanwijzing', () => {
  const p = leesPagina(metNextData({ t: '<iframe src="https://atlas.apps.geodan.nl/stookwijzer/widget?x=1"></iframe>' }), 'https://x.nl/a').aanwijzingen.paginadata;
  assert.equal(p.iframe, 1);
  assert.equal(p.video, 0);
});

test('paginadata: losse woorden, menu en configuratie tellen niet', () => {
  const p = leesPagina(
    metNextData(
      { t: 'Bekijk de video over de kaart van de gemeente', link: 'https://www.youtube.com/watch?v=abcdefghijk' },
      { state: { menu: [{ url: 'https://www.youtube.com/embed/abcdefghijk' }] }, paragraphLists: [{ __typename: 'ParagraphDynamicMap' }] },
    ),
    'https://x.nl/a',
  ).aanwijzingen.paginadata;
  assert.deepEqual([p.video, p.kaart, p.iframe], [0, 0, 0]);
});

test('paginadata: schema.org VideoObject telt, zonder Next-data', () => {
  const html = '<html><body><script type="application/ld+json">{"@type":"VideoObject","name":"x"}</script></body></html>';
  assert.equal(leesPagina(html, 'https://x.nl/a').aanwijzingen.paginadata.video, 1);
});

test('schone titel', () => {
  assert.equal(schoneTitel('Contact en openingstijden | Gemeente Beverwijk'), 'Contact en openingstijden');
  assert.equal(schoneTitel('Home'), 'Home');
});
