/*
 * Paginaprofiel: objectieve kenmerken, gemeten IN DE BROWSER (steekproefselectie v2, fase 2).
 *
 * Dit bestand wordt als tekst ingelezen en ongewijzigd in de pagina uitgevoerd
 * (`page.evaluate`). Het gaat bewust niet door TypeScript of esbuild: die hangen `__name`
 * aan benoemde functies, en dat bestaat niet in de browser (zie getVideos in audit-cli.ts).
 * Dus: één functie-expressie, geen imports, geen modulesyntaxis.
 *
 * Wat het doet: vaststellen wat er op de pagina STAAT, met per kenmerk bewijs (een pad
 * naar het element, een stukje HTML, de tekst). Het oordeelt niet en kiest niets. Waar
 * het kan wordt binnen `main` gemeten; logo en iconen zonder tekst horen bij het sjabloon
 * en worden over de hele pagina gezocht.
 *
 * Detectie die elders al bestond, is hier overgenomen in plaats van opnieuw bedacht:
 *   - videoplaatshouders en geblokkeerde spelers: getVideos (audit-cli.ts);
 *   - spelers in shadow DOM: getVideosporen (audit-cli.ts);
 *   - zoekformulier herkennen: lib/steekproef/aanwijzingen.ts (fase 1).
 *
 * Wijzig je wat hier gemeten wordt, verhoog dan PROFIEL_VERSIE in lib/steekproef/profiel.ts.
 */
(opties) => {
  // Midden in een doorverwijzing is er nog geen body. Dan niet meten maar het zeggen; de
  // CLI probeert het dan opnieuw.
  if (!document.body) throw new Error('de pagina had nog geen body (doorverwijzing bezig?)');
  const MAX = (opties && opties.maxBewijs) || 5;
  const vw = window.innerWidth || 1366;

  const tekstVan = (el) => ((el && (el.innerText || el.textContent)) || '').replace(/\s+/g, ' ').trim();
  const zichtbaar = (el) => {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 && r.height <= 0 && !el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) !== 0;
  };
  // Tekst die je ZIET. `innerText` telt ook visueel verborgen tekst mee (sr-only, clip,
  // links buiten beeld), en dan lijkt een icoonlink met een verborgen naam een link met tekst.
  const zichtbareTekst = (el) => {
    let uit = '';
    const lopen = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = lopen.nextNode())) {
      const t = (n.nodeValue || '').trim();
      if (!t) continue;
      const ouder = n.parentElement;
      if (!ouder) continue;
      const r = ouder.getBoundingClientRect();
      const cs = getComputedStyle(ouder);
      const verstopt =
        r.width <= 2 ||
        r.height <= 2 ||
        r.right < 0 ||
        r.left < -999 ||
        /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip || '') ||
        /inset\(50%\)/.test(cs.clipPath || '') ||
        cs.visibility === 'hidden' ||
        Number(cs.opacity) === 0;
      if (!verstopt) uit += t + ' ';
    }
    return uit.trim();
  };
  // Dichtgeklapt is niet hetzelfde als afwezig: een tabel in een gesloten <details> telt mee.
  const dichtgeklapt = (el) => !!(el.closest && el.closest('details:not([open])'));
  const pad = (el) => {
    const delen = [];
    let e = el;
    while (e && e.nodeType === 1 && delen.length < 5) {
      let s = e.tagName.toLowerCase();
      if (e.id && !/\d{4,}/.test(e.id)) {
        delen.unshift(s + '#' + e.id);
        break;
      }
      const kl = (e.getAttribute('class') || '')
        .trim()
        .split(/\s+/)
        .filter((c) => c && c.length < 30 && !/\d{3,}/.test(c))
        .slice(0, 2);
      if (kl.length) s += '.' + kl.join('.');
      delen.unshift(s);
      e = e.parentElement || (e.getRootNode && e.getRootNode().host) || null;
    }
    return delen.join(' > ');
  };
  const vak = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), b: Math.round(r.width), h: Math.round(r.height) };
  };
  const bewijs = (el, extra) =>
    Object.assign(
      {
        pad: pad(el),
        html: (el.outerHTML || '').replace(/\s+/g, ' ').slice(0, 220),
        tekst: tekstVan(el).slice(0, 100),
        zichtbaar: zichtbaar(el),
        dichtgeklapt: dichtgeklapt(el),
        vak: vak(el),
      },
      extra || {},
    );
  const eerste = (lijst) => lijst.slice(0, MAX);

  // ---- Het bereik: main, anders de body zonder sjabloononderdelen --------------------
  let wortel = document.querySelector('main') || document.querySelector('[role=main]');
  let bereik = 'main';
  if (!wortel) {
    bereik = 'body';
    wortel = document.body;
  }
  const SJABLOON = 'header, footer, nav, [role=banner], [role=contentinfo], [role=navigation]';
  const inBereik = (el) => {
    let host = el;
    // Een element in shadow DOM: kijk naar zijn host.
    while (host && host.getRootNode && host.getRootNode() !== document && host.getRootNode().host) host = host.getRootNode().host;
    if (!wortel.contains(host)) return false;
    if (bereik === 'body' && host.closest(SJABLOON)) return false;
    return true;
  };
  const zoek = (sel) => Array.from(wortel.querySelectorAll(sel)).filter(inBereik);

  // Alle wortels, ook in shadow DOM: een eigen speler (Blue Billywig, JW Player) verstopt
  // zijn video en knoppen daarin, en een gewone querySelector komt er niet.
  const wortels = [document];
  {
    const stapel = Array.from(document.querySelectorAll('*'));
    while (stapel.length) {
      const el = stapel.pop();
      if (el.shadowRoot) {
        wortels.push(el.shadowRoot);
        for (const k of Array.from(el.shadowRoot.querySelectorAll('*'))) stapel.push(k);
      }
    }
  }
  const zoekOveral = (sel) => {
    const uit = [];
    for (const w of wortels) for (const el of Array.from(w.querySelectorAll(sel))) uit.push(el);
    return uit;
  };

  // ---- Formulieren -------------------------------------------------------------------
  const VELD = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), textarea, select';
  const isZoekformulier = (f) => {
    if ((f.getAttribute('role') || '').toLowerCase() === 'search') return true;
    if (f.closest('[role=search], search')) return true;
    if (/zoek|search/i.test(f.getAttribute('action') || '')) return true;
    const v = Array.from(f.querySelectorAll(VELD));
    if (v.length === 1) {
      const naam = (v[0].name || '') + ' ' + (v[0].id || '') + ' ' + (v[0].type || '') + ' ' + (v[0].getAttribute('placeholder') || '');
      if (/(^|\W)(q|s|search|zoek\w*|query|keyword|term)(\W|$)/i.test(naam) || v[0].type === 'search') return true;
    }
    return false;
  };
  const veldnaam = (v) =>
    (v.labels && v.labels[0] ? tekstVan(v.labels[0]) : '') || v.getAttribute('aria-label') || v.getAttribute('placeholder') || v.name || v.type;
  const formEls = zoek('form');
  const formulieren = formEls
    .filter((f) => !isZoekformulier(f))
    .map((f) => {
      const v = Array.from(f.querySelectorAll(VELD));
      const knoppen = Array.from(f.querySelectorAll('button, input[type=submit]')).map((b) => (b.value || tekstVan(b)).slice(0, 40));
      return bewijs(f, { action: f.getAttribute('action'), velden: v.length, veldnamen: v.slice(0, 6).map(veldnaam), knoppen: knoppen.slice(0, 4) });
    });
  const zoekformulieren = formEls.filter(isZoekformulier).length;
  // Velden buiten een form-element (formulieren die met JavaScript zijn gebouwd).
  const losseVelden = zoek(VELD).filter((v) => !v.closest('form') && zichtbaar(v) && v.type !== 'search');

  // ---- Tabellen ----------------------------------------------------------------------
  const tabellen = zoek('table, [role=table], [role=grid]')
    .filter((t) => !/^(presentation|none)$/i.test(t.getAttribute('role') || ''))
    .filter((t) => !(t.tagName === 'TABLE' && t.parentElement && t.parentElement.closest('table')))
    .map((t) => {
      const rijen = t.tagName === 'TABLE' ? Array.from(t.rows) : Array.from(t.querySelectorAll('[role=row]'));
      const kolommen = rijen.reduce((m, r) => Math.max(m, r.cells ? r.cells.length : r.querySelectorAll('[role=cell],[role=gridcell],[role=columnheader]').length), 0);
      return bewijs(t, {
        rijen: rijen.length,
        kolommen,
        koppen: t.querySelectorAll('th, [role=columnheader], [role=rowheader]').length,
        bijschrift: t.caption ? tekstVan(t.caption).slice(0, 80) : null,
        // Eén rij of één kolom is vaak opmaak en geen gegevenstabel. Wel meetellen, maar zeggen.
        mogelijkOpmaak: rijen.length < 2 || kolommen < 2,
      });
    });

  // ---- Video en audio ----------------------------------------------------------------
  const SPELER = /(youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|bluebillywig|bbvms\.com|jwplayer|jwplatform|jwpcdn|kaltura|dailymotion|scribit|qbrick|brightcove|vidyard|wistia|mediasite|companywebcast|twentythree|23video|vixyvideo)/i;
  const AUDIO = /(soundcloud\.com|spotify\.com|anchor\.fm|podbean|buzzsprout|podcast)/i;
  const provider = (s) => {
    const m = String(s).match(SPELER);
    if (!m) return null;
    const p = m[1].toLowerCase();
    if (/youtu/.test(p)) return 'youtube';
    if (/vimeo/.test(p)) return 'vimeo';
    if (/bluebillywig|bbvms/.test(p)) return 'bluebillywig';
    if (/jw/.test(p)) return 'jwplayer';
    return p.replace(/\..*$/, '');
  };
  const videoId = (s) => {
    const t = String(s);
    let m = t.match(/(?:embed\/|v=|youtu\.be\/|vimeo\.com\/(?:video\/)?)([\w-]{6,})/);
    if (m) return m[1];
    if (/^[\w-]{11}$/.test(t)) return t;
    return null;
  };
  const videos = [];
  const videoEls = [];
  const gezienVideo = new Set();
  const voegVideoToe = (el, soort, bron, extra) => {
    const p = provider(bron) || (soort === 'video-element' ? 'eigen' : null);
    const id = videoId(bron);
    const sleutel = (p || '') + '|' + (id || bron || pad(el));
    if (gezienVideo.has(sleutel)) return;
    // Een container en het toestemmingsscherm erin zijn één video, niet twee.
    if (videoEls.some((x) => x.contains(el) || el.contains(x))) return;
    gezienVideo.add(sleutel);
    videoEls.push(el);
    videos.push(bewijs(el, Object.assign({ soort, provider: p, videoId: id, bron: String(bron || '').slice(0, 200) }, extra || {})));
  };
  for (const v of zoekOveral('video').filter(inBereik)) {
    voegVideoToe(v, 'video-element', v.currentSrc || v.getAttribute('src') || (v.querySelector('source') && v.querySelector('source').getAttribute('src')) || '', {
      gedempt: v.muted,
      automatisch: v.autoplay,
      herhaalt: v.loop,
      bediening: v.controls,
      sporen: v.querySelectorAll('track').length,
    });
  }
  for (const f of zoekOveral('iframe').filter(inBereik)) {
    const src = f.getAttribute('src') || f.getAttribute('data-src') || '';
    if (SPELER.test(src)) voegVideoToe(f, f.getAttribute('src') ? 'iframe' : 'iframe-plaatshouder', src);
  }
  for (const el of zoek('[data-src], [data-url], [data-video-id], [data-youtube-id], [data-vimeo-id], [data-embed]')) {
    const w =
      el.getAttribute('data-src') ||
      el.getAttribute('data-url') ||
      el.getAttribute('data-video-id') ||
      el.getAttribute('data-youtube-id') ||
      el.getAttribute('data-vimeo-id') ||
      el.getAttribute('data-embed') ||
      '';
    if (SPELER.test(w) || (/^[\w-]{11}$/.test(w) && el.hasAttribute('data-youtube-id'))) voegVideoToe(el, 'plaatshouder', w);
  }
  // Een speler achter een toestemmingsscherm: geen iframe, wel een container die het zegt.
  for (const el of zoek('[class*="ideoContainer"], [class*="video-container"], [class*="video-embed"], [class*="ideoEmbed"], [class*="bluebillywig"], [class*="jwplayer"], [class*="video-js"], [class*="plyr"], [class*="mediaplayer"]')) {
    const klasse = el.getAttribute('class') || '';
    // Zit de iframe of video er al in, dan is hij hierboven al geteld.
    if (el.querySelector('iframe, video') || (el.shadowRoot && el.shadowRoot.querySelector('video'))) continue;
    const geblokkeerd = /blocked|geblokkeerd/i.test(klasse) || !!el.querySelector('[class*="onsent"], [class*="ookie"]') || /video van een extern|toestemming|cookies/i.test(tekstVan(el));
    voegVideoToe(el, geblokkeerd ? 'geblokkeerde-speler' : 'spelercontainer', klasse, { geblokkeerd });
  }
  // Een link naar een video is geen video op de pagina; wel informatie.
  const videolinks = zoek('a[href]')
    .map((a) => a.getAttribute('href') || '')
    .filter((h) => /(youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d)/i.test(h));

  const audio = [];
  for (const a of zoekOveral('audio').filter(inBereik)) audio.push(bewijs(a, { soort: 'audio-element' }));
  for (const f of zoek('iframe')) {
    const src = f.getAttribute('src') || f.getAttribute('data-src') || '';
    if (AUDIO.test(src)) audio.push(bewijs(f, { soort: 'iframe', bron: src.slice(0, 200) }));
  }

  // ---- Iframes en kaarten ------------------------------------------------------------
  const KAART = /(google\.[a-z.]+\/maps|maps\.google|openstreetmap|arcgis|mapbox|leaflet|smartmap|kaart|plattegrond|geoweb|geo\.|pdok|maps\.)/i;
  const FORMULIERDIENST = /(form|formulier|typeform|jotform|formdesk|mijnafspraak|afspraak|enquete|survey|questionpro|surveymonkey)/i;
  const hostVan = (s) => {
    try {
      return new URL(s, location.href).hostname.toLowerCase();
    } catch (e) {
      return null;
    }
  };
  const iframes = zoek('iframe').map((f) => {
    const src = f.getAttribute('src') || '';
    const dataSrc = f.getAttribute('data-src') || '';
    const doel = src || dataSrc;
    const host = hostVan(doel);
    const soort = SPELER.test(doel) ? 'video' : AUDIO.test(doel) ? 'audio' : KAART.test(doel) ? 'kaart' : FORMULIERDIENST.test(doel) ? 'formulier' : 'overig';
    return bewijs(f, {
      bron: doel.slice(0, 200),
      host,
      titel: f.getAttribute('title'),
      soort,
      plaatshouder: !src && !!dataSrc,
      eigenDomein: host === location.hostname,
    });
  });
  // Inhoud van buiten achter een toestemmingsscherm: er staat nog geen iframe, alleen een
  // scherm dat zegt wat er zou komen ("Op deze plek staat een kaart van een externe
  // website"). Dat is geen afwezigheid: de inhoud is er, maar laadt pas na een keuze.
  // Het soort komt uit de omringende container (DynamicMap, VideoContainer) of de tekst.
  const geblokkeerdEls = zoek('[class*="onsentScreen"], [class*="consent-screen"], [class*="cookie-consent"], [class*="CookieConsent"], [class*="consent-placeholder"], [class*="cookiewall"], [data-cookieconsent]')
    .filter((el, i, l) => !l.some((a) => a !== el && a.contains(el)))
    .map((el) => {
      const omgeving = ((el.parentElement && el.parentElement.getAttribute('class')) || '') + ' ' + (el.getAttribute('class') || '') + ' ' + tekstVan(el);
      const soort = /map|kaart/i.test(omgeving) ? 'kaart' : /video|youtube|vimeo/i.test(omgeving) ? 'video' : /formul|form\b/i.test(omgeving) ? 'formulier' : 'overig';
      return { el, soort };
    });
  for (const g of geblokkeerdEls) if (g.soort === 'video') voegVideoToe(g.el, 'geblokkeerde-speler', 'toestemmingsscherm', { geblokkeerd: true });
  const geblokkeerd = geblokkeerdEls.map((g) => bewijs(g.el, { soort: g.soort }));

  // Kaarten zonder iframe: Leaflet, OpenLayers, Mapbox, Google Maps JavaScript, en de
  // kaartcontainer van SIMsite (DynamicMap), ook als er nog een toestemmingsscherm in staat.
  const kaartenZonderIframe = zoek('.leaflet-container, .ol-viewport, .mapboxgl-map, .gm-style, [class*="esri-view"], [class*="cesium"], [class*="DynamicMap"], [class*="mapContainer"], [class*="map-container"]')
    .filter((el, i, l) => !l.some((a) => a !== el && a.contains(el)))
    .map((el) => bewijs(el, { soort: 'kaart' }));

  // ---- Documentlinks -----------------------------------------------------------------
  const DOC = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf)$/i;
  const documentlinks = [];
  const gezienDoc = new Set();
  for (const a of zoek('a[href]')) {
    let href = a.getAttribute('href') || '';
    let u;
    try {
      u = new URL(href, location.href);
    } catch (e) {
      continue;
    }
    if (/readspeaker\.com$/i.test(u.hostname) && u.searchParams.get('url')) {
      try {
        u = new URL(u.searchParams.get('url'));
      } catch (e) {
        continue;
      }
    }
    const m = u.pathname.match(DOC);
    if (!m) continue;
    const sleutel = u.origin + u.pathname;
    if (gezienDoc.has(sleutel)) continue;
    gezienDoc.add(sleutel);
    documentlinks.push({ url: sleutel, soort: m[1].toLowerCase(), tekst: tekstVan(a).slice(0, 100) });
  }
  // Een lijst waarvan minstens de helft van de links naar een document gaat: een downloadlijst.
  const downloadlijsten = zoek('ul, ol')
    .filter((l) => {
      const links = Array.from(l.querySelectorAll('a[href]'));
      if (links.length < 2) return false;
      const docs = links.filter((a) => DOC.test((a.getAttribute('href') || '').split(/[?#]/)[0]) || /readspeaker/.test(a.getAttribute('href') || ''));
      return docs.length / links.length >= 0.5;
    })
    .map((l) => bewijs(l, { links: l.querySelectorAll('a[href]').length }));

  // ---- Afbeeldingen ------------------------------------------------------------------
  const isIcoon = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.width <= 40 && r.height <= 40;
  };
  const logoSelector = 'a[href="/"], a[href="./"], a[href="' + location.origin + '"], a[href="' + location.origin + '/"], [class*="logo"], [id*="logo"]';
  const isLogo = (el) => {
    const alt = (el.getAttribute('alt') || '') + ' ' + (el.getAttribute('src') || '') + ' ' + (el.getAttribute('class') || '');
    return /logo/i.test(alt) || !!el.closest(logoSelector);
  };
  // Een icoonlettertype (<span class="fa fa-linkedin" role="img">) is een icoon, geen afbeelding.
  const afbeeldingen = zoek('img, [role=img]')
    .filter((i) => i.tagName === 'IMG' || !/(^|\s)(fa[bsr]?|fa-[\w-]+|icon[\w-]*|icoon[\w-]*)(\s|$)/i.test(i.getAttribute('class') || ''))
    .filter((i) => zichtbaar(i) || dichtgeklapt(i));
  const inLinkOfKnop = afbeeldingen
    .filter((i) => i.closest('a[href], button') && !isLogo(i) && !isIcoon(i))
    .map((i) => bewijs(i, { alt: i.getAttribute('alt'), doel: (i.closest('a') && i.closest('a').getAttribute('href')) || null }));
  const inFiguur = zoek('figure')
    .filter((f) => f.querySelector('img, svg, picture, [role=img]'))
    .map((f) => bewijs(f, { onderschrift: f.querySelector('figcaption') ? tekstVan(f.querySelector('figcaption')).slice(0, 100) : null }));
  const gifs = afbeeldingen.filter((i) => /\.gif(\?|$)/i.test(i.getAttribute('src') || '')).map((i) => bewijs(i, { src: i.getAttribute('src') }));

  // Hero: een grote afbeelding of achtergrondafbeelding bovenaan de pagina. Die staat vaak
  // boven main, dus hier kijken we over de hele pagina, alleen niet in de footer.
  const heroKandidaten = [];
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    if (el.closest('footer, [role=contentinfo], nav')) continue;
    const r = el.getBoundingClientRect();
    const top = r.top + scrollY;
    if (top > 700 || r.width < vw * 0.55 || r.height < 160) continue;
    const isImg = el.tagName === 'IMG' || el.tagName === 'PICTURE' || el.tagName === 'VIDEO';
    const achtergrond = !isImg && /url\(/.test(getComputedStyle(el).backgroundImage || '');
    if (!isImg && !achtergrond) continue;
    if (!zichtbaar(el)) continue;
    heroKandidaten.push({ el, r, achtergrond });
    if (heroKandidaten.length > 3) break;
  }
  const hero = heroKandidaten.length
    ? (() => {
        const h = heroKandidaten[0];
        const r = h.r;
        // Tekst eroverheen: zichtbare tekstelementen waarvan het midden binnen de hero valt.
        const erover = [];
        for (const t of Array.from(document.querySelectorAll('h1, h2, h3, p, a, span, div'))) {
          if (h.el.contains(t) && !h.achtergrond) continue;
          if (t.children.length && Array.from(t.children).some((c) => tekstVan(c))) continue;
          const tekst = tekstVan(t);
          if (!tekst || tekst.length < 3 || !zichtbaar(t)) continue;
          const q = t.getBoundingClientRect();
          const mx = q.left + q.width / 2;
          const my = q.top + q.height / 2;
          if (mx > r.left && mx < r.right && my > r.top && my < r.bottom && q.width < r.width) {
            // Staat de tekst op een eigen, niet-doorzichtige achtergrond, dan staat hij op een vlak en niet op de foto.
            let opVlak = false;
            let e = t;
            while (e && e !== h.el && e !== document.body) {
              const bg = getComputedStyle(e).backgroundColor;
              if (bg && !/rgba\(.*,\s*0\)|transparent/.test(bg)) {
                opVlak = true;
                break;
              }
              e = e.parentElement;
            }
            erover.push({ tekst: tekst.slice(0, 80), opVlak, pad: pad(t) });
            if (erover.length >= MAX) break;
          }
        }
        return Object.assign(bewijs(h.el, { achtergrond: h.achtergrond }), { tekstErover: erover });
      })()
    : null;

  // Logo: een afbeelding of svg in een link naar de homepage, of met "logo" in naam/klasse.
  const logo = (() => {
    for (const el of Array.from(document.querySelectorAll('header img, header svg, [role=banner] img, [role=banner] svg, a img, a svg, img, svg'))) {
      if (!zichtbaar(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.top + scrollY > 400) continue;
      if (isLogo(el)) return bewijs(el, { alt: el.getAttribute('alt') });
    }
    return null;
  })();

  // Iconen zonder tekst ernaast: een link of knop met een afbeelding of svg en geen zichtbare
  // tekst. Over de hele pagina, want sociale-media-iconen staan meestal in de footer.
  const iconenZonderTekst = Array.from(document.querySelectorAll('a[href], button, [role=button]'))
    .filter((el) => zichtbaar(el) && !zichtbareTekst(el) && el.querySelector('svg, img, i, [class*="icon"], [class*="icoon"], [class*="fa-"]'))
    .filter((el) => !isLogo(el))
    .map((el) => bewijs(el, { naam: el.getAttribute('aria-label') || el.getAttribute('title') || null, inSjabloon: !!el.closest(SJABLOON) }));

  // Overzicht met kaartjes: een lijst of raster met minstens twee gelijke kinderen die elk
  // een link en een kop of afbeelding hebben. Gelijk = zelfde tag en klasse.
  const overzichten = [];
  for (const c of zoek('ul, ol, div, section')) {
    const kinderen = Array.from(c.children).filter((k) => zichtbaar(k));
    if (kinderen.length < 2) continue;
    // Genummerde klassen (item_0, item_1, col-3) tellen niet: die maken elk kind uniek.
    const sleutel = (k) =>
      k.tagName +
      '.' +
      (k.getAttribute('class') || '')
        .split(/\s+/)
        .filter((c) => c && !/\d+$/.test(c))
        .sort()
        .join('.');
    const eersteSleutel = sleutel(kinderen[0]);
    const gelijk = kinderen.filter((k) => sleutel(k) === eersteSleutel);
    if (gelijk.length < 2 || gelijk.length / kinderen.length < 0.8) continue;
    // Een kaartje: een link plus een kop, een afbeelding of een datum. Een link met alleen
    // een toelichting erbij is een gewone lijst, geen overzicht met doorklikkers.
    const DATUM = /\b\d{1,2}[ -](jan|feb|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?[ -]\d{2,4}|\b\d{1,2}-\d{1,2}-\d{4}\b/i;
    const kaartjes = gelijk.filter(
      (k) =>
        k.querySelector('a[href]') &&
        (k.querySelector('h2, h3, h4, img, picture, time') || DATUM.test(tekstVan(k))),
    );
    if (kaartjes.length < 2) continue;
    // Uitklapblokken met een kop en een link zijn geen kaartjes (bomen-kappen: "10 kaartjes").
    if (kaartjes.some((k) => k.matches('details') || k.querySelector('details, summary, [aria-expanded]'))) continue;
    if (overzichten.some((o) => o.el.contains(c) || c.contains(o.el))) continue;
    overzichten.push({
      el: c,
      kaartjes: kaartjes.length,
      metAfbeelding: kaartjes.filter((k) => k.querySelector('img, picture')).length,
      metDatum: kaartjes.filter((k) => k.querySelector('time') || /\b\d{1,2}[ -](jan|feb|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)|\d{1,2}-\d{1,2}-\d{4}/i.test(tekstVan(k))).length,
    });
  }

  // Foto in de lopende tekst: een afbeelding van enige omvang, niet in een link, niet in een
  // kaartje, met lopende tekst ernaast.
  const fotoInTekst = afbeeldingen
    .filter((i) => {
      if (i.closest('a[href], button, figure')) return false;
      if (hero && hero.pad === pad(i)) return false;
      // Een kopafbeelding staat niet in de lopende tekst, ook als hij te smal is voor een hero.
      if (i.closest('header, [class*="hero"], [class*="Hero"]')) return false;
      const r = i.getBoundingClientRect();
      if (r.width < 120 || r.height < 80) return false;
      // Een banner over (bijna) de volle breedte staat niet ín de tekst.
      if (r.width > vw * 0.8) return false;
      const blok = i.closest('p, div, section, article');
      if (!blok) return false;
      const tekst = tekstVan(blok.parentElement || blok);
      return tekst.length > 150 && !overzichten.some((o) => o.el.contains(i));
    })
    .map((i) => bewijs(i, { alt: i.getAttribute('alt') }));

  // Fotogalerij: minstens vier afbeeldingen als gelijke broers en zussen, of een bekende galerijklasse.
  const galerijen = [];
  for (const c of zoek('ul, ol, div, section')) {
    // Een galerij-item is vooral beeld: hooguit een kort onderschrift. Een nieuwskaartje met
    // foto en titel is een overzicht (G05), geen galerij.
    const metBeeld = Array.from(c.children).filter(
      (k) => (k.tagName === 'IMG' || k.querySelector('img, picture')) && !k.querySelector('h2, h3, h4') && zichtbareTekst(k).length < 40,
    );
    const klasse = /(galler|galerij|lightbox|fancybox|photoswipe|masonry)/i.test(c.getAttribute('class') || '');
    // Een overzicht met kaartjes (hierboven al gevonden) is geen galerij, ook als de titels kort zijn.
    if (!klasse && overzichten.some((o) => o.el === c || o.el.contains(c) || c.contains(o.el))) continue;
    if (metBeeld.length >= 4 || (klasse && c.querySelectorAll('img').length >= 2)) {
      if (galerijen.some((g) => g.contains(c) || c.contains(g))) continue;
      galerijen.push(c);
    }
  }

  const carrousels = zoek('[aria-roledescription="carousel"], .swiper, .swiper-container, .slick-slider, .splide, .glide, .owl-carousel, .carousel, [class*="slider"]')
    .filter((el, i, l) => !l.some((a) => a !== el && a.contains(el)) && zichtbaar(el))
    .map((el) => bewijs(el));

  // ---- Structuur ---------------------------------------------------------------------
  const koppen = zoek('h1, h2, h3, h4, h5, h6, [role=heading]').map((h) => Number(h.getAttribute('aria-level') || h.tagName.replace(/\D/g, '')) || 2);
  const lijsten = zoek('ul, ol').filter((l) => !l.closest('nav'));
  const geneste = lijsten.filter((l) => l.parentElement && l.parentElement.closest('li'));
  const citaten = zoek('blockquote, q').map((q) => bewijs(q));
  // Voorlees- en toegankelijkheidsbalken (ReadSpeaker en dergelijke) staan op elke pagina en
  // horen volgens de dekkingslijst niet mee te tellen; hun menuknop heeft wel aria-expanded.
  const GEEN_UITKLAP = 'nav, [class*="rsbtn"], [id^="readspeaker"], [class*="readspeaker"], [class*="toolbar"], [class*="share"]';
  const echteUitklap = (b) => !b.closest(GEEN_UITKLAP) && (zichtbaar(b) || dichtgeklapt(b));
  const uitklap = {
    details: zoek('details').filter(echteUitklap).length,
    ariaExpanded: zoek('[aria-expanded]').filter((b) => b.tagName !== 'DETAILS' && !b.closest('details') && echteUitklap(b)).length,
    tablist: zoek('[role=tablist]').filter(echteUitklap).length,
    voorbeelden: eerste(zoek('details, [role=tablist], [aria-expanded]').filter(echteUitklap).map((b) => bewijs(b))),
  };
  const htmlTaal = (document.documentElement.getAttribute('lang') || '').toLowerCase();
  const anderstalig = zoek('[lang]')
    .filter((el) => (el.getAttribute('lang') || '').toLowerCase().slice(0, 2) !== htmlTaal.slice(0, 2))
    .map((el) => bewijs(el, { lang: el.getAttribute('lang') }));
  const canvas = zoek('canvas').filter(zichtbaar).map((c) => bewijs(c));
  const grafieken = zoek('[class*="highcharts"], [class*="chartjs"], [class*="recharts"], [class*="apexcharts"], [class*="chart-container"], [class*="grafiek"]')
    .filter((el, i, l) => !l.some((a) => a !== el && a.contains(el)))
    .map((el) => bewijs(el));

  // ---- Toestand van de meting --------------------------------------------------------
  // Een cookiescherm dat een groot deel van het venster bedekt: dan zijn spelers en kaarten
  // mogelijk niet geladen, en is een "niet gevonden" geen bewijs van afwezigheid.
  const cookiescherm = (() => {
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (!zichtbaar(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.width * r.height) / (vw * (window.innerHeight || 900)) < 0.15) continue;
      const t = tekstVan(el);
      if (/cookie|toestemming|consent|privacy/i.test(t)) return { tekst: t.slice(0, 120), dekking: Math.round(((r.width * r.height) / (vw * (window.innerHeight || 900))) * 100) };
    }
    return null;
  })();
  const gehydrateerd = Array.from(document.querySelectorAll('body *')).some((e) => Object.keys(e).some((k) => k.startsWith('__react') || k.startsWith('__vue')));

  return {
    url: location.href,
    titel: document.title,
    bereik,
    htmlTaal: htmlTaal || null,
    gehydrateerd,
    cookiescherm,
    kenmerken: {
      formulieren: eerste(formulieren),
      aantalFormulieren: formulieren.length,
      zoekformulieren,
      losseVelden: losseVelden.length,
      losseVeldenVoorbeeld: eerste(losseVelden.map((v) => bewijs(v, { naam: veldnaam(v) }))),
      tabellen: eerste(tabellen),
      aantalTabellen: tabellen.length,
      videos: eerste(videos),
      aantalVideos: videos.length,
      videolinks: videolinks.slice(0, MAX),
      audio: eerste(audio),
      iframes: eerste(iframes),
      aantalIframes: iframes.length,
      iframeSoorten: iframes.reduce((m, f) => ((m[f.soort] = (m[f.soort] || 0) + 1), m), {}),
      kaartenZonderIframe: eerste(kaartenZonderIframe),
      geblokkeerd: eerste(geblokkeerd),
      documentlinks: documentlinks.slice(0, 10),
      aantalDocumentlinks: documentlinks.length,
      downloadlijsten: eerste(downloadlijsten),
      aantalAfbeeldingen: afbeeldingen.length,
      afbeeldingInLinkOfKnop: eerste(inLinkOfKnop),
      aantalAfbeeldingInLinkOfKnop: inLinkOfKnop.length,
      figuren: eerste(inFiguur),
      aantalFiguren: inFiguur.length,
      gifs: eerste(gifs),
      hero,
      logo,
      iconenZonderTekst: eerste(iconenZonderTekst),
      aantalIconenZonderTekst: iconenZonderTekst.length,
      overzichten: eerste(overzichten.map((o) => bewijs(o.el, { kaartjes: o.kaartjes, metAfbeelding: o.metAfbeelding, metDatum: o.metDatum }))),
      fotoInTekst: eerste(fotoInTekst),
      galerijen: eerste(galerijen.map((g) => bewijs(g, { afbeeldingen: g.querySelectorAll('img').length }))),
      carrousels: eerste(carrousels),
      koppen,
      aantalLijsten: lijsten.length,
      aantalGenesteLijsten: geneste.length,
      genesteLijstVoorbeeld: eerste(geneste.map((l) => bewijs(l))),
      citaten: eerste(citaten),
      uitklap,
      anderstalig: eerste(anderstalig),
      canvas: eerste(canvas),
      grafieken: eerste(grafieken),
    },
  };
}
