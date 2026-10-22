// Draait IN de pagina (page.evaluate), niet in Node. Gewoon JavaScript en als tekst
// ingelezen door zeef-paginas.ts: een functie die tsx eerst omzet krijgt hulpfuncties als
// __name erin, en die bestaan in de pagina niet.
//
// Dit is een zeef en geen keuring. Elke treffer is een plek waar iemand moet kijken; de
// echte meting en het oordeel komen daarna met audit-criterium. Daarom liever een treffer
// te veel dan een te weinig, maar wel met genoeg tekst erbij om zonder de pagina te zien
// te kunnen zeggen of het de moeite waard is.
(function meet(opties) {
  const heel = !!opties.heelDePagina;
  const main = heel ? null : document.querySelector('main');
  const wortel = main || document.body;
  const kaal = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const kort = (s, n = 160) => {
    const t = kaal(s);
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  const zichtbaar = (el) => {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const verborgenVoorHulpsoftware = (el) => !!el.closest('[aria-hidden="true"], [hidden]');
  // Onderdelen van het sjabloon die toevallig binnen main staan: de voorleesknop van
  // ReadSpeaker en het kruimelpad. Die worden één keer beoordeeld, niet op elke pagina.
  const sjabloon = (el) => !!el.closest('[id^="readspeaker"], .rsbtn, nav[aria-label*="ruimel" i], [class*="readcrumb"]');
  const pad = (el) => {
    const delen = [];
    let e = el;
    while (e && e !== document.body && delen.length < 4) {
      let s = e.tagName.toLowerCase();
      if (e.id) {
        s += '#' + e.id;
        delen.unshift(s);
        break;
      }
      const klasse = (e.getAttribute('class') || '').split(/\s+/).filter(Boolean)[0];
      if (klasse) s += '.' + klasse;
      delen.unshift(s);
      e = e.parentElement;
    }
    return delen.join(' > ');
  };

  // ---- Kleur ---------------------------------------------------------------
  const rgb = (s) => {
    const m = (s || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const d = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: d[0], g: d[1], b: d[2], a: d.length > 3 ? d[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const contrast = (a, b) => {
    const la = lum(a);
    const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const treffers = {
    '1.1.1': [],
    '1.3.1': [],
    '1.3.3': [],
    '1.4.1': [],
    '1.4.5': [],
    '1.4.11': [],
    '2.4.2': [],
    '2.4.4': [],
    '2.4.6': [],
    '2.5.3': [],
    '3.1.2': [],
    // Geen WCAG: functionele fouten die naar /technische-issues gaan (zie CLAUDE.md,
    // "Technische issues"). Een kapotte mailkoppeling is geen 2.4.4-bevinding.
    technisch: [],
  };
  const voeg = (sc, soort, details) => {
    // Per soort niet meer dan acht voorbeelden: daarna zegt een extra regel niets meer,
    // het aantal staat in `aantal`.
    const lijst = treffers[sc];
    const bestaand = lijst.find((t) => t.soort === soort);
    if (bestaand) {
      bestaand.aantal++;
      if (bestaand.voorbeelden.length < 8) bestaand.voorbeelden.push(details);
    } else {
      lijst.push({ soort, aantal: 1, voorbeelden: [details] });
    }
  };

  // ---- 2.4.2 Paginatitel ------------------------------------------------------
  const titel = kaal(document.title);
  const h1 = kaal((document.querySelector('h1') || {}).textContent || '');
  if (!titel) voeg('2.4.2', 'geen titel', { titel });
  else if (opties.sitenaam && titel.toLowerCase() === opties.sitenaam.toLowerCase())
    voeg('2.4.2', 'alleen de sitenaam', { titel });
  if (titel && h1 && !titel.toLowerCase().includes(h1.toLowerCase().slice(0, 25)))
    voeg('2.4.2', 'titel noemt de h1 niet', { titel, h1 });

  // ---- Afbeeldingen: 1.1.1, 1.4.5, 1.4.11 ------------------------------------
  const BESTANDSNAAM = /(\.(jpe?g|png|gif|webp|svg|bmp|tiff?)$)|^(img|dsc|image|foto|pxl|whatsapp)[\s_-]?\d+/i;
  const NIETSZEGGEND = /^(afbeelding|foto|plaatje|image|picture|img|icon|icoon|logo|banner|header|grafiek)\.?$/i;
  const TEKSTBEELD = /poster|flyer|affiche|folder|uitnodiging|programma|infographic|infografiek|banner|aankondiging|tijdlijn|stappenplan|schema/i;
  const GRAFISCH = /grafiek|diagram|infographic|infografiek|kaart|plattegrond|schema|tijdlijn|stappenplan|chart/i;
  let afbeeldingen = 0;
  for (const img of Array.from(wortel.querySelectorAll('img, input[type="image"], [role="img"], svg'))) {
    if (img.tagName.toLowerCase() === 'svg' && img.closest('[role="img"]') && img.closest('[role="img"]') !== img) continue;
    if (verborgenVoorHulpsoftware(img) || !zichtbaar(img)) continue;
    const r = img.getBoundingClientRect();
    const isSvg = img.tagName.toLowerCase() === 'svg';
    const heeftAlt = img.hasAttribute('alt');
    const alt = isSvg
      ? kaal(img.getAttribute('aria-label') || (img.querySelector('title') || {}).textContent || '')
      : kaal(img.getAttribute('alt') || img.getAttribute('aria-label') || '');
    const src = (img.currentSrc || img.getAttribute('src') || '').split('?')[0];
    const bestand = decodeURIComponent(src.split('/').pop() || '');
    const link = img.closest('a, button');
    const linkTekst = link ? kaal(link.textContent) : '';
    afbeeldingen++;

    if (isSvg) {
      // Een svg zonder naam is meestal een pictogram naast tekst. Alleen in een link of knop
      // zonder andere tekst draagt hij de betekenis; dan is het een 1.1.1- en 1.4.11-plek.
      if (link && !linkTekst && !alt && !link.getAttribute('aria-label'))
        voeg('1.1.1', 'pictogram als enige inhoud van link of knop, zonder naam', { pad: pad(link), href: link.getAttribute('href') || '' });
      if (link && r.width <= 48) voeg('1.4.11', 'pictogram in link of knop in de inhoud', { pad: pad(link), naam: alt || link.getAttribute('aria-label') || linkTekst });
      continue;
    }

    if (!heeftAlt && img.tagName.toLowerCase() === 'img')
      voeg('1.1.1', 'geen alt-attribuut', { src: bestand, pad: pad(img) });
    else if (alt && BESTANDSNAAM.test(alt)) voeg('1.1.1', 'alt is een bestandsnaam', { alt, src: bestand });
    else if (alt && NIETSZEGGEND.test(alt)) voeg('1.1.1', 'alt zegt niets', { alt, src: bestand });
    else if (!alt && link && !linkTekst && !link.getAttribute('aria-label'))
      voeg('1.1.1', 'lege alt in link zonder andere tekst', { src: bestand, href: link.getAttribute('href') || '' });
    else if (alt && alt.length > 150) voeg('1.1.1', 'lange alt (beschrijft mogelijk het beeld in plaats van de functie)', { alt: kort(alt, 200), src: bestand });
    else if (alt && link && linkTekst && linkTekst.toLowerCase().includes(alt.toLowerCase()) && alt.length > 3)
      voeg('1.1.1', 'alt herhaalt de linktekst', { alt, linkTekst: kort(linkTekst, 80) });
    else if (!alt && !link && r.width >= window.innerWidth * 0.9)
      // Het CMS laat de alt van een hero altijd leeg (regelbestand 1.1.1). Alleen een probleem
      // als er tekst of informatie in het beeld staat; dat zie je alleen door te kijken.
      voeg('1.1.1', 'hero met lege alt (alleen een probleem als er tekst in staat)', { src: bestand, adres: img.currentSrc || src });
    else if (!alt && r.width >= 250 && r.height >= 150 && !link)
      voeg('1.1.1', 'grote afbeelding met lege alt (decoratief of informatief?)', { src: bestand, adres: img.currentSrc || src, maat: Math.round(r.width) + 'x' + Math.round(r.height) });

    // Tekst in beeld is niet uit de code te lezen. Kandidaten: grote afbeeldingen waarvan
    // naam of alt op drukwerk wijst, of met een alt die zelf al een halve alinea is.
    const groot = r.width >= 300 && r.height >= 150;
    if (groot && (TEKSTBEELD.test(bestand) || TEKSTBEELD.test(alt) || alt.length >= 80))
      voeg('1.4.5', 'grote afbeelding die waarschijnlijk tekst bevat', { src: bestand, alt: kort(alt, 120), maat: Math.round(r.width) + 'x' + Math.round(r.height) });

    if (GRAFISCH.test(bestand) || GRAFISCH.test(alt))
      voeg('1.4.11', 'grafiek, kaart of schema als afbeelding', { src: bestand, alt: kort(alt, 120) });
  }

  // ---- Koppen: 1.3.1, 2.4.6 ------------------------------------------------
  const koppen = [];
  const kopEls = Array.from(wortel.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')).filter(
    (k) => !verborgenVoorHulpsoftware(k)
  );
  let vorigNiveau = heel ? 0 : 1;
  const GENERIEKE_KOP = /^(inleiding|informatie|meer informatie|algemeen|overig(e)?|tekst|titel|kop|nieuws|links|downloads?|documenten|bijlagen?|zie ook)\.?$/i;
  for (let i = 0; i < kopEls.length; i++) {
    const k = kopEls[i];
    const niveau = k.getAttribute('aria-level')
      ? Number(k.getAttribute('aria-level'))
      : /^h\d$/i.test(k.tagName)
        ? Number(k.tagName[1])
        : 2;
    const tekst = kaal(k.textContent);
    if (koppen.length < 60) koppen.push({ niveau, tekst: kort(tekst, 100) });
    if (!tekst && !k.querySelector('img[alt]:not([alt=""])')) voeg('1.3.1', 'lege kop', { niveau, pad: pad(k) });
    if (vorigNiveau && niveau > vorigNiveau + 1)
      voeg('1.3.1', 'kopniveau overgeslagen', { van: 'h' + vorigNiveau, naar: 'h' + niveau, kop: kort(tekst, 80) });
    vorigNiveau = niveau;
    if (tekst && GENERIEKE_KOP.test(tekst)) voeg('2.4.6', 'kop die niet zegt waar het over gaat', { niveau, kop: tekst });
    // Een kop waar meteen een kop van hetzelfde of een hoger niveau op volgt, heeft niets
    // onder zich staan.
    const volgende = kopEls[i + 1];
    if (volgende && tekst) {
      const nNiveau = /^h\d$/i.test(volgende.tagName) ? Number(volgende.tagName[1]) : 2;
      const range = document.createRange();
      range.setStartAfter(k);
      range.setEndBefore(volgende);
      const tussen = kaal(range.toString());
      const tussenBeeld = range.cloneContents().querySelector && range.cloneContents().querySelector('img, table, ul, ol, iframe, video, form');
      if (!tussen && !tussenBeeld && nNiveau <= niveau)
        voeg('2.4.6', 'kop zonder inhoud eronder', { kop: kort(tekst, 80), volgende: kort(volgende.textContent, 80) });
    }
  }
  if (!heel && main && !main.querySelector('h1') && !document.querySelector('h1'))
    voeg('1.3.1', 'geen h1 op de pagina', {});

  // Dubbele koppen op een rij met dezelfde tekst.
  for (let i = 1; i < koppen.length; i++)
    if (koppen[i].tekst && koppen[i].tekst === koppen[i - 1].tekst)
      voeg('2.4.6', 'twee koppen achter elkaar met dezelfde tekst', { kop: koppen[i].tekst });

  // ---- Structuur in de lopende tekst: 1.3.1 ----------------------------------
  for (const p of Array.from(wortel.querySelectorAll('p'))) {
    if (!zichtbaar(p)) continue;
    const tekst = kaal(p.textContent);
    if (!tekst) continue;
    // Vetgedrukte alinea die als kop dient: de hele alinea is strong/b, kort, en er volgt
    // gewone tekst op.
    const vet = Array.from(p.querySelectorAll('strong, b')).map((s) => kaal(s.textContent)).join(' ');
    const fw = Number(getComputedStyle(p).fontWeight) || 400;
    const helemaalVet = (vet && kaal(vet) === tekst) || fw >= 600;
    if (helemaalVet && tekst.length <= 90 && !/[.:;]$/.test(tekst) && !p.closest('li, td, th, label, button, a')) {
      const na = p.nextElementSibling;
      if (na && /^(p|ul|ol|table|div)$/i.test(na.tagName) && kaal(na.textContent).length > 0)
        voeg('1.3.1', 'vetgedrukte alinea als tussenkop', { tekst: kort(tekst, 90) });
    }
    // Nep-lijst: regels die met een streepje, bolletje of nummer beginnen, in een alinea.
    const regels = (p.innerText || '').split(/\n/).map(kaal).filter(Boolean);
    const opsomming = regels.filter((r) => /^([-–•*·▪►]|\d{1,2}[.)])\s+\S/.test(r));
    if (opsomming.length >= 2) voeg('1.3.1', 'opsomming zonder lijst', { regels: opsomming.slice(0, 3).map((r) => kort(r, 70)) });
    else if (regels.length === 1 && /^([-–•*·▪►])\s+\S/.test(tekst)) {
      const vorige = p.previousElementSibling;
      if (vorige && vorige.tagName === 'P' && /^([-–•*·▪►])\s+\S/.test(kaal(vorige.textContent)))
        voeg('1.3.1', 'opsomming zonder lijst', { regels: [kort(kaal(vorige.textContent), 70), kort(tekst, 70)] });
    }
  }
  for (const lijst of Array.from(wortel.querySelectorAll('ul, ol'))) {
    if (!zichtbaar(lijst) || lijst.closest('nav')) continue;
    const items = Array.from(lijst.children).filter((c) => c.tagName === 'LI');
    if (items.length === 1) voeg('1.3.1', 'lijst met één item (opmerking)', { item: kort(items[0].textContent, 80) });
  }
  for (const t of Array.from(wortel.querySelectorAll('table'))) {
    if (!zichtbaar(t)) continue;
    const rijen = t.querySelectorAll('tr').length;
    const heeftTh = !!t.querySelector('th');
    const rolPresentatie = /presentation|none/.test(t.getAttribute('role') || '');
    if (!heeftTh && !rolPresentatie && rijen >= 2)
      voeg('1.3.1', 'tabel zonder kopcellen', { rijen, eersteRij: kort((t.querySelector('tr') || {}).textContent || '', 100) });
    if (heeftTh && rolPresentatie) voeg('1.3.1', 'tabel met kopcellen op role=presentation', { rijen });
  }
  const em = wortel.querySelectorAll('em, i:not([class*="icon"]):not([class*="fa-"])');
  if (em.length) {
    const metTekst = Array.from(em).filter((e) => kaal(e.textContent).length > 0);
    if (metTekst.length)
      voeg('1.3.1', 'cursief met em of i', { aantal: metTekst.length, voorbeeld: kort(metTekst[0].textContent, 80) });
  }

  // ---- Lopende tekst: 1.3.3 en 3.1.2 ----------------------------------------
  const blokken = Array.from(wortel.querySelectorAll('p, li, td, th, h1, h2, h3, h4, h5, h6, figcaption, blockquote, dd, dt')).filter(
    (b) => zichtbaar(b) && !verborgenVoorHulpsoftware(b) && !b.querySelector('p, li')
  );
  const ZINTUIG = [
    /\b(klik|druk|tik|kies|gebruik|selecteer)\s+(op\s+)?(de|het|een)\s+(rode|groene|blauwe|oranje|gele|grijze|paarse|zwarte|witte|ronde|vierkante|grote|kleine)\s+\w+/i,
    /\b(de|het)\s+(rode|groene|blauwe|oranje|gele|grijze|paarse)\s+(knop|vak|vlak|tekst|woord|woorden|balk|blok|lijn|stip|pijl|icoon|markering|gebied|gebieden)\b/i,
    /\b(rechts|links)\s*(boven|onder)(aan|in)?\b/i,
    /\b(rechtsboven|linksboven|rechtsonder|linksonder)\b/i,
    /\b(aan|in|op)\s+de\s+(rechter|linker)\s*(kant|zijde|kolom)\b/i,
    /\b(in|met)\s+(het\s+)?(rood|groen|blauw|oranje|geel|grijs|paars)\s+(aangegeven|gemarkeerd|weergegeven|gekleurd)\b/i,
    /\b(rood|groen|blauw|oranje|geel)\s+(gemarkeerde|gekleurde|aangegeven)\b/i,
    /\b(het|de)\s+(icoon|symbool|pictogram)\s+(met|van)\s+(de|het|een)\b/i,
    /\b(hieronder|hierboven|onderstaande|bovenstaande)\b/i,
  ];
  const KLEURWOORD = /\b(rood|rode|groen|groene|blauw|blauwe|oranje|geel|gele|paars|paarse)\b/i;
  const EN = ['the', 'and', 'of', 'to', 'is', 'for', 'with', 'you', 'your', 'this', 'that', 'are', 'on', 'be', 'or', 'from', 'will', 'can', 'we', 'our', 'it', 'have', 'not'];
  const DE = ['der', 'die', 'das', 'und', 'ist', 'nicht', 'mit', 'für', 'sie', 'wir', 'ein', 'eine', 'auf', 'den', 'dem', 'sind', 'auch', 'ich', 'zu', 'bei'];
  const NL = ['de', 'het', 'een', 'en', 'van', 'is', 'dat', 'voor', 'met', 'je', 'niet', 'op', 'in', 'u', 'uw', 'wij', 'we', 'zijn', 'ook', 'naar', 'bij', 'of', 'te', 'aan'];
  const tel = (woorden, lijst) => woorden.filter((w) => lijst.includes(w)).length;
  const paginaTaal = (document.documentElement.getAttribute('lang') || '').toLowerCase().slice(0, 2);
  for (const b of blokken) {
    const tekst = kaal(b.textContent);
    if (tekst.length < 12) continue;
    for (const re of ZINTUIG) {
      const m = tekst.match(re);
      if (m) {
        const zwak = /hieronder|hierboven|onderstaande|bovenstaande/i.test(m[0]);
        voeg('1.3.3', zwak ? 'verwijzing naar boven of onder (meestal in orde)' : 'verwijzing naar vorm, kleur of plek', {
          gevonden: m[0],
          zin: kort(tekst.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60), 180),
        });
        break;
      }
    }
    const taalEl = b.closest('[lang]');
    const taal = taalEl ? (taalEl.getAttribute('lang') || '').toLowerCase().slice(0, 2) : paginaTaal;
    if (taal !== 'nl' || tekst.length < 30) continue;
    const woorden = tekst.toLowerCase().replace(/[^a-zà-ÿß\s'-]/g, ' ').split(/\s+/).filter(Boolean);
    if (woorden.length < 5) continue;
    const en = tel(woorden, EN);
    const de = tel(woorden, DE);
    const nl = tel(woorden, NL);
    // Een gemarkeerd stuk binnen het blok telt niet mee.
    const gemarkeerd = b.querySelector('[lang]:not([lang^="nl"])');
    if (gemarkeerd) continue;
    if (en >= 3 && en > nl) voeg('3.1.2', 'Engelse tekst zonder lang', { tekst: kort(tekst, 160) });
    else if (de >= 3 && de > nl) voeg('3.1.2', 'Duitse tekst zonder lang', { tekst: kort(tekst, 160) });
  }
  // Losse Engelse termen in koppen en linkteksten: kort, dus de woordtelling ziet ze niet.
  for (const el of Array.from(wortel.querySelectorAll('a, button, h1, h2, h3, h4, h5, h6'))) {
    if (sjabloon(el)) continue;
    const t = kaal(el.textContent);
    if (/^(read more|click here|more info|learn more|download|newsletter|contact us|about us|subscribe|sign up|log ?in|follow us|share)$/i.test(t) && !el.closest('[lang]:not([lang^="nl"])'))
      voeg('3.1.2', 'Engelse term (uitzondering of niet?)', { tekst: t, element: el.tagName.toLowerCase() });
  }

  // ---- 1.4.1 Links in lopende tekst die alleen met kleur opvallen ---------------
  let linksInTekst = 0;
  for (const a of Array.from(wortel.querySelectorAll('p a[href], li a[href], td a[href], dd a[href]'))) {
    if (!zichtbaar(a)) continue;
    const houder = a.closest('p, li, td, dd');
    const houderTekst = kaal(houder.textContent);
    const linkTekst = kaal(a.textContent);
    // Alleen een link mét tekst eromheen hoeft zich van die tekst te onderscheiden.
    if (!linkTekst || houderTekst.length - linkTekst.length < 15) continue;
    linksInTekst++;
    const sa = getComputedStyle(a);
    const sh = getComputedStyle(houder);
    const onderstreept = /underline/.test(sa.textDecorationLine) || /underline/.test(getComputedStyle(a.firstElementChild || a).textDecorationLine);
    const rand = parseFloat(sa.borderBottomWidth) > 0 && sa.borderBottomStyle !== 'none';
    const vetter = (Number(sa.fontWeight) || 400) - (Number(sh.fontWeight) || 400) >= 300;
    if (onderstreept || rand || vetter) continue;
    const ca = rgb(sa.color);
    const ch = rgb(sh.color);
    if (!ca || !ch) continue;
    const c = contrast(ca, ch);
    if (c < 3) voeg('1.4.1', 'link in tekst zonder onderstreping, minder dan 3:1 tegen de tekst', { link: kort(linkTekst, 60), verhouding: Math.round(c * 100) / 100, linkkleur: sa.color, tekstkleur: sh.color });
  }
  // Tekst die alleen met kleur iets betekent: een gekleurd stuk zonder vet, cursief of
  // onderstreping, of een zin die zelf over kleur gaat.
  for (const s of Array.from(wortel.querySelectorAll('span[style*="color"], font[color], mark'))) {
    if (!zichtbaar(s) || s.closest('a, button, h1, h2, h3, h4, h5, h6')) continue;
    const st = getComputedStyle(s);
    const ouder = getComputedStyle(s.parentElement);
    if (st.color !== ouder.color && (Number(st.fontWeight) || 400) === (Number(ouder.fontWeight) || 400) && st.fontStyle === ouder.fontStyle)
      voeg('1.4.1', 'gekleurde tekst zonder andere markering', { tekst: kort(s.textContent, 80), kleur: st.color });
  }
  for (const b of blokken) {
    const t = kaal(b.textContent);
    if (KLEURWOORD.test(t) && /\b(betekent|staat voor|geeft aan|zijn aangegeven|is aangegeven|legenda)\b/i.test(t))
      voeg('1.4.1', 'tekst die uitlegt wat een kleur betekent', { zin: kort(t, 160) });
  }

  // ---- 2.4.4 Linkdoel en 2.5.3 Label in naam ----------------------------------
  // Dezelfde naamberekening als get-links (scripts/audit-cli.ts), vereenvoudigd: het is
  // een zeef. Weeg een treffer altijd met get-links zelf.
  const GENERIEK = /^(lees meer|meer|meer info(rmatie)?|meer lezen|lees verder|verder|klik hier|hier|klik|bekijk|bekijk hier|download|link|deze pagina|read more|click here|more)\.?$/i;
  const PLATFORM = /^(facebook|instagram|linkedin|youtube|twitter|x|mastodon|tiktok|whatsapp)$/i;
  const naamVan = (a) => {
    const lb = a.getAttribute('aria-labelledby');
    if (lb) {
      const t = kaal(lb.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' '));
      if (t) return { naam: t, bron: 'aria-labelledby' };
    }
    const al = kaal(a.getAttribute('aria-label'));
    if (al) return { naam: al, bron: 'aria-label' };
    const kloon = a.cloneNode(true);
    kloon.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
    kloon.querySelectorAll('img[alt]').forEach((img) => img.replaceWith(document.createTextNode(' ' + img.getAttribute('alt') + ' ')));
    const t = kaal(kloon.textContent);
    if (t) return { naam: t, bron: 'inhoud' };
    const ti = kaal(a.getAttribute('title'));
    if (ti) return { naam: ti, bron: 'title' };
    return { naam: '', bron: 'geen' };
  };
  const zichtbareTekst = (el) => kaal(el.innerText || '');
  const perNaam = new Map();
  let aantalLinks = 0;
  for (const a of Array.from(wortel.querySelectorAll('a[href]'))) {
    const st = getComputedStyle(a);
    if (st.display === 'none' || st.visibility === 'hidden' || verborgenVoorHulpsoftware(a) || sjabloon(a)) continue;
    if (/^(button|menuitem|tab)$/.test(a.getAttribute('role') || '')) continue;
    aantalLinks++;
    const { naam, bron } = naamVan(a);
    const href = a.href;
    const houder = a.closest('p, li, td, th, dd');
    const houderTekst = houder ? kaal(houder.textContent) : '';
    const context = houderTekst.length > naam.length + 10;
    if (!naam) voeg('2.4.4', 'link zonder naam', { href, pad: pad(a) });
    else if (bron === 'title') voeg('2.4.4', 'naam alleen uit title', { naam, href });
    else if (GENERIEK.test(naam)) voeg('2.4.4', context ? 'generieke tekst, met context in hetzelfde element' : 'generieke tekst zonder context', { naam, href, context: context ? kort(houderTekst, 140) : '' });
    else if (PLATFORM.test(naam)) voeg('2.4.4', 'alleen de platformnaam', { naam, href });
    else if (/^(https?:\/\/|www\.)/i.test(naam) && naam.length > 40) voeg('2.4.4', 'webadres als linktekst', { naam: kort(naam, 80), href });
    else if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(naam) && !/^mailto:/i.test(a.getAttribute('href') || ''))
      voeg('technisch', 'e-maillink zonder mailto', { naam, href: a.getAttribute('href') || '' });
    else if (/^[\d\s().+/-]{10,}$/.test(naam) && !/^tel:/i.test(a.getAttribute('href') || ''))
      voeg('technisch', 'telefoonlink zonder tel', { naam, href: a.getAttribute('href') || '' });
    if (naam) {
      const sleutel = naam.toLowerCase();
      const doelen = perNaam.get(sleutel) || new Set();
      doelen.add(href.replace(/#.*$/, '').replace(/\/$/, ''));
      perNaam.set(sleutel, doelen);
    }
    // 2.5.3: een aria-label die de zichtbare tekst niet bevat.
    const zicht = zichtbareTekst(a);
    if (bron === 'aria-label' && zicht && zicht.length > 1 && !naam.toLowerCase().includes(zicht.toLowerCase()))
      voeg('2.5.3', 'aria-label bevat de zichtbare tekst niet', { zichtbaar: kort(zicht, 60), naam: kort(naam, 80), element: 'a' });
  }
  for (const [naam, doelen] of perNaam)
    if (doelen.size > 1 && !GENERIEK.test(naam))
      voeg('2.4.4', 'zelfde linktekst, verschillende bestemming', { naam, doelen: Array.from(doelen).slice(0, 3) });
  for (const el of Array.from(wortel.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], summary, [role="tab"], [role="menuitem"], a[role]'))) {
    if (!zichtbaar(el) || verborgenVoorHulpsoftware(el) || sjabloon(el)) continue;
    const label = kaal(el.getAttribute('aria-label'));
    const lb = el.getAttribute('aria-labelledby');
    const naam = label || (lb ? kaal(lb.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ')) : '');
    const zicht = el.tagName === 'INPUT' ? kaal(el.value) : zichtbareTekst(el);
    if (naam && zicht && zicht.length > 1 && !naam.toLowerCase().includes(zicht.toLowerCase()))
      voeg('2.5.3', 'naam bevat de zichtbare tekst niet', { zichtbaar: kort(zicht, 60), naam: kort(naam, 80), element: el.tagName.toLowerCase() });
    if (el.closest('main') && !heel) voeg('1.4.11', 'knop in de inhoud', { tekst: kort(zicht || naam, 60), pad: pad(el) });
  }
  // Formuliervelden en ingesloten kaders in de inhoud: hun randen en bediening vallen onder
  // 1.4.11, en ze horen niet bij het sjabloon.
  const velden = wortel.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  const veldenZichtbaar = Array.from(velden).filter(zichtbaar);
  if (veldenZichtbaar.length) {
    voeg('1.4.11', 'formuliervelden in de inhoud', { aantal: veldenZichtbaar.length });
    for (const v of veldenZichtbaar) {
      const naam = kaal(v.getAttribute('aria-label'));
      const lbl = v.id ? document.querySelector('label[for="' + CSS.escape(v.id) + '"]') : v.closest('label');
      const zicht = lbl ? kaal(lbl.innerText) : kaal(v.getAttribute('placeholder'));
      if (naam && zicht && !naam.toLowerCase().includes(zicht.replace(/\s*\*$/, '').toLowerCase()))
        voeg('2.5.3', 'naam bevat het zichtbare label niet', { zichtbaar: kort(zicht, 60), naam: kort(naam, 80), element: v.tagName.toLowerCase() });
    }
  }
  const kaders = Array.from(wortel.querySelectorAll('iframe')).filter(zichtbaar);
  if (kaders.length)
    voeg('1.4.11', 'ingesloten kader in de inhoud', { bronnen: kaders.slice(0, 3).map((f) => (f.getAttribute('src') || '').split('?')[0]) });

  const tekst = kaal(wortel.innerText || '');
  return {
    titel,
    h1,
    taal: paginaTaal,
    geenMain: !heel && !main,
    telling: {
      woorden: tekst ? tekst.split(' ').length : 0,
      afbeeldingen,
      links: aantalLinks,
      linksInTekst,
      koppen: kopEls.length,
    },
    koppen,
    treffers,
  };
})
