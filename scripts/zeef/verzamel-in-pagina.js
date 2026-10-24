// Draait IN de pagina (page.evaluate), net als meet-in-pagina.js, maar oordeelt niet: het
// verzamelt alle koppen, linkteksten en ingevulde alt-teksten van de inhoud (main). Bij een
// pagecheck worden die daarna per UNIEKE tekst gewogen; dezelfde kop of linktekst op honderd
// pagina's krijgt zo één oordeel in plaats van honderd.
(function verzamel(opties) {
  const main = opties.heelDePagina ? null : document.querySelector('main');
  const wortel = main || document.body;
  const kaal = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const kort = (s, n) => {
    const t = kaal(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  const verborgen = (el) => {
    if (el.closest('[aria-hidden="true"], [hidden]')) return true;
    const st = getComputedStyle(el);
    return st.display === 'none' || st.visibility === 'hidden';
  };
  // Sjabloononderdelen binnen main: één keer beoordeeld, niet per pagina.
  const sjabloon = (el) => !!el.closest('[id^="readspeaker"], .rsbtn, nav[aria-label*="ruimel" i], [class*="readcrumb"]');

  const koppen = [];
  const kopEls = Array.from(wortel.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')).filter(
    (k) => !verborgen(k) && !sjabloon(k)
  );
  for (let i = 0; i < kopEls.length; i++) {
    const k = kopEls[i];
    const niveau = /^h\d$/i.test(k.tagName) ? Number(k.tagName[1]) : Number(k.getAttribute('aria-level') || 2);
    // Wat eronder staat, tot de volgende kop: daaraan moet de kop beschrijven wat volgt.
    let eronder = '';
    const volgende = kopEls[i + 1];
    const r = document.createRange();
    r.setStartAfter(k);
    if (volgende) r.setEndBefore(volgende);
    else r.setEndAfter(wortel.lastChild || wortel);
    eronder = kort(r.toString(), 160);
    koppen.push({ niveau, tekst: kaal(k.textContent), eronder });
  }

  const naamVan = (a) => {
    const lb = a.getAttribute('aria-labelledby');
    if (lb) {
      const t = kaal(lb.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' '));
      if (t) return t;
    }
    const al = kaal(a.getAttribute('aria-label'));
    if (al) return al;
    const kloon = a.cloneNode(true);
    kloon.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
    kloon.querySelectorAll('img[alt]').forEach((img) => img.replaceWith(document.createTextNode(' ' + img.getAttribute('alt') + ' ')));
    kloon.querySelectorAll('[role="img"][aria-label]').forEach((x) => x.replaceWith(document.createTextNode(' ' + x.getAttribute('aria-label') + ' ')));
    return kaal(kloon.textContent) || kaal(a.getAttribute('title'));
  };
  const links = [];
  for (const a of Array.from(wortel.querySelectorAll('a[href]'))) {
    if (verborgen(a) || sjabloon(a)) continue;
    const naam = naamVan(a);
    const houder = a.closest('p, li, td, th, dd');
    const context = houder ? kort(houder.textContent, 200) : '';
    links.push({ naam, href: a.href.replace(/#.*$/, ''), context: context === naam ? '' : context });
  }

  const afbeeldingen = [];
  for (const img of Array.from(wortel.querySelectorAll('img[alt]'))) {
    if (verborgen(img) || sjabloon(img)) continue;
    const alt = kaal(img.getAttribute('alt'));
    if (!alt) continue;
    const r = img.getBoundingClientRect();
    const link = img.closest('a');
    afbeeldingen.push({
      alt,
      adres: (img.currentSrc || img.getAttribute('src') || '').split('?')[0],
      maat: Math.round(r.width) + 'x' + Math.round(r.height),
      inLink: link ? kort(link.textContent, 80) : null,
    });
  }

  return { titel: kaal(document.title), koppen, links, afbeeldingen };
})
