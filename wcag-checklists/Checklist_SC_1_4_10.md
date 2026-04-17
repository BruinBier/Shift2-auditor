---
name: wcag-1-4-10-reflow
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.4.10 (Reflow) on Dutch government websites. Use when conducting accessibility audits to verify that content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions, at a width of 320 CSS pixels (vertical scrolling content) or a height of 256 CSS pixels (horizontal scrolling content). Covers responsive design testing, sticky/fixed elements, disappearing content (F102), overflow issues, data tables, and the exceptions for 2D-layout content. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.4.10 Reflow — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.4.10 (Niveau AA):**
Content kan worden weergegeven zonder verlies van informatie of functionaliteit, en zonder dat scrollen in twee dimensies vereist is voor:

- **Verticaal scrollende content** bij een breedte van **320 CSS pixels**
- **Horizontaal scrollende content** bij een hoogte van **256 CSS pixels**

Behalve voor onderdelen van de content die een tweedimensionale layout vereisen voor gebruik of betekenis.

**Kernprincipe:** Gebruikers die inzoomen tot 400% op een 1280px breed scherm krijgen effectief een viewport van 320px breed. De content moet dan "reflow"-en naar één kolom, zonder dat horizontaal scrollen nodig is om een regel tekst te lezen.

**Waar komen de maten vandaan?**
- 320 CSS pixels = 1280px desktop bij 400% zoom (1280 ÷ 4 = 320)
- 256 CSS pixels = 1024px desktop bij 400% zoom (1024 ÷ 4 = 256)
- 320px is tevens de breedte van een klein mobiel scherm (iPhone 5/SE)

---

## De twee voorwaarden

### 1. Zonder verlies van informatie of functionaliteit
Alle content en functionaliteit die bij volledige breedte (bijv. 1280px) beschikbaar is, moet ook beschikbaar zijn bij 320px. Content mag worden verplaatst (bijv. naar een hamburgermenu), maar mag NIET volledig verdwijnen.

### 2. Zonder scrollen in twee dimensies
Bij 320px breed mag de gebruiker alleen **verticaal** scrollen. Horizontaal scrollen mag niet nodig zijn om content te lezen.

**Let op:** Secties binnen de pagina mogen wél horizontaal scrollen (bijv. een tabel in een scrollbaar container), zolang de pagina zelf maar niet horizontaal scrollt.

---

## Uitzonderingen: tweedimensionale layout

De volgende content is uitgezonderd omdat een 2D-layout essentieel is voor gebruik of betekenis:

| Uitgezonderd | Waarom |
|-------------|--------|
| Datatabellen | Rijen en kolommen zijn essentieel voor de betekenis |
| Afbeeldingen | Niet zinvol om een afbeelding in één kolom te "reflow"-en |
| Kaarten/plattegronden | 2D-layout is essentieel |
| Diagrammen | Visuele ruimtelijke relaties |
| Video | Vast beeldformaat |
| Games | 2D-interactie essentieel |
| Presentaties | Slides hebben vaste dimensies |
| Interfaces met toolbars | Toolbars moeten zichtbaar blijven bij content-bewerking |

**Belangrijk bij datatabellen:** De tabel zelf is uitgezonderd, maar als een brede tabel de héle pagina horizontaal laat scrollen, is dat wél een failure. Oplossing: de tabel in een scrollbaar container plaatsen (`overflow-x: auto`) zodat alleen de tabel scrollt, niet de pagina. Een tabel kán passend gemaakt worden op een klein scherm, maar dan wordt de tekst zo klein dat het niet meer bruikbaar is — daarom is de uitzondering terecht.

**PDF-documenten:** SC 1.4.10 geldt ook voor PDF-documenten. Een PDF die niet reflow-t bij inzoomen (wat bij de meeste PDF's het geval is) kan een probleem zijn. Tagged PDF's met een goede structuur kunnen in sommige PDF-viewers reflow-en.

---

## Beslisboom

```
Content bij viewport 320px breed
│
├─ Vereist het content-type een 2D-layout?
│  (tabel, afbeelding, kaart, diagram, video)
│  └─ JA → Uitzondering → Niet toetsen op reflow
│         (maar tabel mag niet de hele pagina laten scrollen)
│
├─ Is er horizontale scrollbar op de pagina?
│  ├─ JA → FAIL (tenzij alleen op een uitgezonderd element)
│  └─ NEE → Ga door
│
├─ Is er content verdwenen t.o.v. de brede viewport?
│  ├─ JA → Is de content bereikbaar via menu/disclosure/link?
│  │  ├─ JA → PASS
│  │  └─ NEE → FAIL (F102)
│  └─ NEE → Ga door
│
├─ Wordt content afgekapt of overlapt door sticky elementen?
│  ├─ JA → FAIL
│  └─ NEE → PASS
```

---

## Stapsgewijze auditprocedure

### Methode A: Viewport verkleinen (aanbevolen)

1. Open de pagina in Chrome
2. Open DevTools (F12)
3. Klik op het device-icoon (Toggle Device Toolbar) of druk Ctrl+Shift+M
4. Stel de viewport in op **320 × 256 pixels** (of 320px breed, hoogte variabel)
5. Controleer:
   - Is er een horizontale scrollbar op de pagina?
   - Is content verdwenen?
   - Wordt content afgekapt of overlapt?
   - Zijn alle functies bereikbaar?

### Methode B: Zoomen op desktop

1. Open de pagina in Chrome op een 1280px breed scherm
2. Zoom in tot **400%** (Ctrl + '+' meerdere malen)
3. De browser presenteert de content nu alsof het viewport 320px breed is
4. Controleer dezelfde punten als bij Methode A

**Let op:** Bij zoom op desktop speelt de schermhoogte ook mee — sticky headers/footers nemen bij 400% zoom relatief veel ruimte in.

### Methode C: Responsieve test met browser-extensie

Gebruik een extensie zoals "Web Developer" (Chris Pederick) om de viewport-breedte exact in te stellen op 320px.

---

## De 8 auditgebieden

### 1. HORIZONTALE SCROLLBAR

Het meest directe teken van een reflow-probleem.

```
Controleer:
- Is er een horizontale scrollbar op de pagina bij 320px?
  → JA → FAIL
- Is de scrollbar alleen op een tabel/afbeelding in een container?
  → De container mag scrollen, de pagina niet
```

### 2. VERDWIJNENDE CONTENT (F102)

Content die bij brede viewport zichtbaar is maar bij 320px verdwijnt.

```
Veelvoorkomende F102-failures:
- Sidebar met links/navigatie verdwijnt volledig (display: none)
  zonder dat de links elders beschikbaar zijn
- Zoekfunctie verdwijnt zonder alternatief (zoekicoon, menu-item)
- Labels worden vervangen door placeholder-tekst die bij focus verdwijnt
- Afbeeldingen verdwijnen zonder alternatief
- Bloglinks/gerelateerde content verdwijnt volledig
```

**Acceptabel:** Content mag worden verplaatst naar een hamburgermenu, disclosure-widget, of vergelijkbaar mechanisme — zolang het bereikbaar blijft.

### 3. STICKY/FIXED ELEMENTEN

Elementen met `position: sticky` of `position: fixed` die bij smalle viewport of hoge zoom veel ruimte innemen.

```
Controleer:
- Sticky header: hoeveel van het viewport neemt deze in bij 320px?
- Sticky footer/cookie-banner: idem
- Chat-widgets: bedekken deze content?
- Fixed advertenties: blokkeren deze de content?

Red flags (niet altijd een technische failure, maar ernstig
voor gebruikers):
- Sticky header + sticky footer samen > 50% van het viewport
- Sticky element dat de gefocuste content bedekt
- Geen manier om het sticky element te sluiten
```

**Beste aanpak (C34):** Sticky elementen "un-fixeren" bij smalle viewports met media queries.

### 4. AFGEKAPTE/OVERFLOW CONTENT

Content die wordt afgekapt door `overflow: hidden` op containers.

```css
/* FAIL: content verdwijnt bij reflow */
.container {
  overflow: hidden;
  width: 100%;
  height: 200px;
}

/* PASS: content scrollbaar binnen container */
.container {
  overflow-x: auto;
  width: 100%;
}
```

### 5. VASTE BREEDTES

Elementen met vaste pixel-breedtes die niet meeschalen.

```css
/* FAIL: vaste breedte forceert horizontale scroll */
.main-content {
  width: 1200px;
}

/* PASS: flexibele breedte */
.main-content {
  max-width: 1200px;
  width: 100%;
}
```

### 6. LANGE STRINGS ZONDER WRAPPING

URL's, e-mailadressen en lange woorden die hun container doorbreken.

```css
/* FAIL: lange URL breekt de layout */
<a href="...">https://www.gemeente-ijsselstein.nl/heel-lang-pad/...</a>

/* PASS: tekst wraps binnen container */
.content {
  overflow-wrap: break-word;
  word-break: break-word;
}
```

### 7. FORMULIEREN

Formuliervelden en labels die bij smalle viewport problemen geven.

```
Controleer:
- Staan labels boven de velden (niet naast)?
- Passen invoervelden binnen de viewport?
- Zijn knoppen niet breder dan het viewport?
- Worden labels niet vervangen door placeholder-tekst (F102)?
```

### 8. NAVIGATIE

Hoe de navigatie zich gedraagt bij 320px.

```
Controleer:
- Wordt de navigatie een hamburgermenu?
  → Prima, mits alle items bereikbaar blijven
- Verdwijnt de navigatie geheel?
  → FAIL (F102)
- Is het hamburgermenu bedienbaar met toetsenbord?
  → Zo niet: probleem voor SC 2.1.1, niet direct SC 1.4.10
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: SIMsite/Drupal responsive layout

De meeste SIMsite-gebaseerde gemeente-websites zijn responsive. Controleer of:
- De navigatie reflow-t naar een hamburgermenu
- De sidebar-content (toptaken, gerelateerde links) naar onder verplaatst
- De zoekfunctie bereikbaar blijft
- Hero-banners schalen

### Patroon B: Toptaken op de homepage

Toptaken worden vaak in een grid weergegeven. Bij 320px moeten ze stapelen naar één kolom.

### Patroon C: Cookie-banner

Cookie-banners nemen bij 320px vaak veel ruimte in. Controleer:
- Kan de banner worden gesloten?
- Bedekt de banner niet de hele content?
- Zijn alle knoppen bereikbaar?

### Patroon D: Datatabellen

Gemeente-websites bevatten vaak tabellen (openingstijden, tarieven). De tabel zelf is uitgezonderd, maar:
- De tabel moet in een scrollbaar container staan
- De pagina mag niet horizontaal scrollen door de tabel

### Patroon E: Ingesloten kaarten/video

Google Maps embeds en video-iframes moeten meeschalen met het viewport. Controleer:
- Heeft het iframe een responsive container?
- Forceert de embed geen vaste breedte?

### Patroon F: PDF-viewers

Inline PDF-viewers zijn uitgezonderd (2D-layout), maar:
- Er moet een link zijn om de PDF apart te openen
- De viewer zelf mag niet de pagina laten scrollen

---

## Onderscheid met andere SC's

| SC | Relatie met 1.4.10 |
|----|------------------|
| **1.4.4** | Tekst herschalen (200%). Overlapt maar is apart: 1.4.4 gaat over lettergrootte, 1.4.10 over layout. |
| **1.4.10** | **Reflow — layout bij 320px zonder horizontaal scrollen** |
| **1.4.12** | Tekstafstand. Kan ook layout-problemen veroorzaken bij smalle viewport. |
| **1.3.1** | Informatie en relaties. Na reflow moet de visuele volgorde logisch blijven. |
| **2.4.7** | Focus zichtbaar. Sticky elementen mogen de focus-indicator niet bedekken. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| C32 | Media queries en CSS grid gebruiken voor reflow van kolommen |
| C31 | CSS flexbox gebruiken voor reflow |
| C33 | Lange URL's en tekst laten wrappen |
| C38 | CSS width, max-width en flexbox gebruiken voor reflow |
| G206 | Optie bieden om te wisselen naar een layout zonder horizontaal scrollen |
| G224 | Rekening houden met tekstinspringing en reflow |
| G225 | Horizontaal scrollende secties ontwerpen om binnen 320px te passen |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| C34 | Media queries gebruiken om sticky headers/footers te "un-fixen" |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F102 | Content verdwijnt en is niet meer beschikbaar na reflow |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-8: horizontale scroll | verdwijnende content |
                  sticky/fixed | afgekapt/overflow | vaste breedtes |
                  lange strings | formulieren | navigatie]
Element:         [beschrijving van het element]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL | N.v.t. (uitzondering)]

Testmethode:     [viewport 320px / zoom 400% / beide]
Bij brede
viewport:        [wat zichtbaar is bij 1280px]
Bij 320px:       [wat er gebeurt: verdwijnt / overlapt / scrollt]
Uitzondering:    [geen / tabel / afbeelding / kaart / video]

Probleem:        [specifieke beschrijving]
Technique:       [C32/C31/C33/C34/C38/G206/F102]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Sidebar die volledig verdwijnt** (F102) — gerelateerde content of navigatie die display:none krijgt
2. **Zoekfunctie verdwijnt** (F102) — zonder alternatief icoon of menu-item
3. **Cookie-banner bedekt alles** — neemt bij 320px het hele viewport in
4. **Brede tabel zonder scroll-container** — forceert horizontale scroll op de hele pagina
5. **Hero-banner met vaste breedte** — schaalt niet mee
6. **Sticky header te groot** — neemt bij 400% zoom >30% van het viewport in
7. **Vaste breedte op formuliervelden** — velden breder dan viewport
8. **Ingesloten Google Maps zonder responsive container** — forceert horizontale scroll

### Technisch of redactioneel issue?

SC 1.4.10 is vrijwel altijd een **technisch issue**:
- Responsive CSS en media queries zijn template/developer-verantwoordelijkheid
- Bij Shift2-audits valt dit onder de **technische audit** (Cardan/template)

**Uitzondering:** Als een redacteur een tabel in de content plaatst zonder scroll-container, is dat deels een redactioneel issue (het CMS zou dit automatisch moeten afhandelen).

### Wie heeft er baat bij?

- **Slechtzienden** — zoomen regelmatig in tot 400%; horizontaal scrollen maakt lezen zeer moeilijk
- **Mensen met cognitieve beperkingen** — het tegelijk horizontaal en verticaal scrollen is cognitief belastend
- **Mobiele gebruikers** — profiteren van responsive layouts
- **Iedereen** — responsive design verbetert de ervaring op alle schermformaten

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.4.10 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 1.4.10:** https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- **Failure F102 (content verdwijnt):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F102
- **Technique C32 (media queries + grid):** https://www.w3.org/WAI/WCAG22/Techniques/css/C32
- **Technique C31 (flexbox):** https://www.w3.org/WAI/WCAG22/Techniques/css/C31
- **Technique C33 (tekst wrapping):** https://www.w3.org/WAI/WCAG22/Techniques/css/C33
- **Technique C34 (un-fix sticky):** https://www.w3.org/WAI/WCAG22/Techniques/css/C34
- **Eric Eggert — Resize Text vs. Reflow:** https://yatil.net/blog/resize-text-reflow
- **TPGI — Reflow Red Flags:** https://www.tpgi.com/reflow-red-flags/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
