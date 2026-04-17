---
name: wcag-1-1-1-alt-text
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.1.1 (Non-text Content / Niet-tekstuele content) on Dutch government websites. Use when conducting accessibility audits on images, icons, SVGs, video thumbnails, charts, maps, infographics, and any non-textual content. Covers alt-text evaluation, decorative vs informative classification, hero images, teaser photos, logos, complex images, functional images, image-text combinations, and media. Trigger this skill when analyzing screenshots and HTML code for alt-text quality, missing alt attributes, or incorrect decorative/informative classification. Essential for gemeente website audits under the Dutch Toegankelijkheidswet. This is the meest voorkomende WCAG-schending.
---

# WCAG 1.1.1 Niet-tekstuele content — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.1.1 (Niveau A):**
Alle niet-tekstuele content die aan de gebruiker wordt gepresenteerd, heeft een tekstalternatief dat een gelijkwaardig doel dient.

**Kernprincipe:** Een gebruiker die de niet-tekstuele content niet kan waarnemen (blind, slechtziend, doof) moet via een tekstalternatief dezelfde informatie of functie kunnen verkrijgen.

**Dit is de meest voorkomende WCAG-schending** op het web en de meest geauditeerde.

**Relatie met andere criteria:**
- SC 4.1.2 (Naam, Rol, Waarde): functionele afbeeldingen moeten ook een programmatisch bepaalde naam hebben. 1.1.1 gaat over de *inhoudelijke kwaliteit* van het alternatief, 4.1.2 over de *technische levering*.
- SC 1.4.5 (Afbeeldingen van tekst): tekst mag niet als afbeelding worden weergegeven tenzij noodzakelijk.
- SC 1.2.x (Tijdgebonden media): ondertiteling en audiodescriptie vallen onder aparte criteria.

---

## Beslisboom: type niet-tekstuele content

```
START: Is het element niet-tekstueel?
(afbeelding, icoon, SVG, video-thumbnail, canvas, grafiek, kaart,
 knop met alleen icoon, audio-element)

├─ NEE → Niet van toepassing op SC 1.1.1
└─ JA → Wat is de FUNCTIE?
   │
   ├─ DECORATIEF (puur visueel, geen informatie)
   │  → alt="" (leeg, niet ontbrekend)
   │
   ├─ INFORMATIEF (brengt unieke informatie over)
   │  → Beschrijvende alt-tekst
   │
   ├─ ONDERSTEUNEND (informatie staat al in omringende tekst)
   │  → Meestal decoratief: alt=""
   │
   ├─ FUNCTIONEEL (link of knop)
   │  → Alt beschrijft doel/actie, NIET de afbeelding
   │
   ├─ COMPLEX (grafiek, kaart, infographic, organogram)
   │  → Korte alt + uitgebreide beschrijving
   │
   └─ TIJDGEBONDEN MEDIA (audio/video)
      → Minimaal beschrijvend tekstalternatief
```

### Decoratief vs. informatief bepalen

```
Afbeelding gevonden
│
├─ Bevat de afbeelding informatie die NIET in omringende tekst staat?
│  ├─ JA → INFORMATIEF
│  └─ NEE ↓
│
├─ Is de afbeelding puur voor decoratie/styling?
│  ├─ JA → DECORATIEF
│  └─ NEE ↓
│
├─ Is de afbeelding een link of knop?
│  ├─ JA → FUNCTIONEEL (beschrijf bestemming/actie)
│  └─ NEE ↓
│
├─ Helpt de afbeelding bij het begrijpen van de content?
│  ├─ JA → INFORMATIEF
│  └─ NEE → DECORATIEF
```

---

## De 9 auditgebieden

### 1. INFORMATIEVE AFBEELDINGEN

**Regel:** De alt-tekst beschrijft het doel of de betekenis van de afbeelding, niet het uiterlijk.

**Checklist:**
- Heeft de afbeelding een `alt`-attribuut?
- Beschrijft de alt-tekst het **doel** of de **betekenis**?
- Is de alt-tekst inhoudelijk, niet puur visueel?
- Is de alt-tekst beknopt (richtlijn ±125 tekens)?
- Wordt "afbeelding van..." vermeden? (screenreaders melden al dat het een afbeelding is)

```html
<!-- FAIL: puur visuele beschrijving -->
<img src="uitreiking.jpg" alt="Man in pak schudt hand">

<!-- PASS: inhoudelijke beschrijving -->
<img src="uitreiking.jpg" alt="Wethouder reikt toegankelijkheidscertificaat 2024 uit">

<!-- FAIL: begint met "afbeelding van" -->
<img src="park.jpg" alt="Afbeelding van een park">

<!-- PASS: directe beschrijving -->
<img src="park.jpg" alt="Stadspark met vijver en speeltuin">

<!-- FAIL: bestandsnaam als alt -->
<img src="IMG_2024_0312.jpg" alt="IMG_2024_0312">

<!-- PASS: inhoudelijke alt -->
<img src="IMG_2024_0312.jpg" alt="Nieuwe schoolgebouw met zonnepanelen">
```

### 2. DECORATIEVE AFBEELDINGEN

**Regel:** Decoratieve afbeeldingen krijgen `alt=""` (leeg, niet ontbrekend). Geen beschrijving toevoegen.

**Wanneer decoratief:**
- Puur visueel (randen, lijnen, achtergronden)
- Informatie staat al volledig in de omringende tekst
- Geen betekenis of functie
- Sfeerbeelden zonder informatieve waarde

```html
<!-- FAIL: decoratief met overbodige alt -->
<img src="decoratieve-lijn.png" alt="Horizontale lijn">

<!-- PASS: decoratief met lege alt -->
<img src="decoratieve-lijn.png" alt="">

<!-- FAIL: sfeerbeeld met beschrijving terwijl info al in tekst staat -->
<h2>Nieuw zwembad geopend</h2>
<img src="zwembad.jpg" alt="Foto van het nieuwe zwembad">
<p>Het nieuwe zwembad is vandaag geopend door wethouder Jansen.</p>
<!-- De kop + tekst geven al alle informatie -->

<!-- PASS: sfeerbeeld als decoratief -->
<h2>Nieuw zwembad geopend</h2>
<img src="zwembad.jpg" alt="">
<p>Het nieuwe zwembad is vandaag geopend door wethouder Jansen.</p>
```

### 3. FUNCTIONELE AFBEELDINGEN

**Regel:** Als een afbeelding een link of knop is, beschrijft de alt-tekst het **doel of de actie**, niet de afbeelding zelf.

**Relatie met SC 4.1.2:** Een technisch aanwezige maar inhoudelijk slechte naam kan nog steeds falen op 1.1.1. Voorbeeld: een pdf-icoon-link met `alt="icoon"` is technisch aanwezig (4.1.2) maar niet begrijpelijk (1.1.1).

```html
<!-- FAIL: beschrijft icoon, niet functie -->
<a href="/contact">
  <img src="envelope.png" alt="Envelop icoon">
</a>

<!-- PASS: beschrijft bestemming -->
<a href="/contact">
  <img src="envelope.png" alt="Contact">
</a>

<!-- FAIL: beschrijft icoon bij downloadlink -->
<a href="/brochure.pdf">
  <img src="pdf-icon.png" alt="PDF">
</a>

<!-- PASS: beschrijft document + bestandstype -->
<a href="/brochure.pdf">
  <img src="pdf-icon.png" alt="Brochure downloaden (PDF)">
</a>
```

### 4. LOGO'S

**Regel:** Logo's zijn informatief — de alt-tekst bevat de organisatienaam.

```html
<!-- PASS: logo met organisatienaam -->
<img src="logo.svg" alt="Logo Gemeente IJsselstein">

<!-- PASS: logo als link naar homepage -->
<a href="/">
  <img src="logo.png"
       alt="Logo van de Gemeente IJsselstein, link naar de Homepagina">
</a>

<!-- PASS: herhaling van logo elders op pagina → decoratief -->
<img src="logo.svg" alt="">
<!-- Alleen als de organisatienaam al elders prominent zichtbaar is -->
```

### 5. HERO-AFBEELDINGEN

**Standaardregel op gemeente-websites: DECORATIEF (`alt=""`), tenzij de afbeelding specifieke informatie communiceert.**

```
Hero-afbeelding check:
├─ Bevat tekst (slogan, titel)? → INFORMATIEF (tekst in alt)
├─ Bevat logo's? → INFORMATIEF (beschrijf logo's)
├─ Generieke foto (gebouw, landschap, sfeer)? → DECORATIEF
└─ Specifieke informatie essentieel voor begrip? → INFORMATIEF
```

```html
<!-- Meest voorkomend: decoratief -->
<img src="hero-gemeentehuis.jpg" alt="">

<!-- Met tekst erin: informatief -->
<img src="hero-banner.jpg"
     alt="Banner met tekst: Samen bouwen aan IJsselstein">
```

### 6. TEASERFOTO'S IN NIEUWSOVERZICHTEN

**Standaardregel op gemeente-websites: DECORATIEF (`alt=""`), tenzij de afbeelding tekst bevat die niet in de kop of teaser staat.**

De kop en teaser geven al de context. Consistentie is essentieel.

```html
<!-- PASS: decoratief (kop geeft context) -->
<a href="/nieuws/artikel1">
  <img src="foto.jpg" alt="">
  <h3>Wethouder opent nieuw stadspark</h3>
  <p>Het nieuwe park aan de Hollandse IJssel is vandaag geopend.</p>
</a>

<!-- Bij inconsistente alt-teksten in een nieuwsoverzicht: -->
<!-- Bied standaardbevinding aan met concrete voorbeelden van -->
<!-- wel/niet alt, en adviseer consistent alt="" te gebruiken -->
```

### 7. COMPLEXE AFBEELDINGEN

**Regel:** Korte alt-tekst die het onderwerp benoemt + een uitgebreide beschrijving die direct bereikbaar is.

**Voorbeelden:** grafieken, diagrammen, infographics, organogrammen, kaarten.

```html
<!-- PASS: korte alt + uitgebreide beschrijving -->
<img src="grafiek-inwoners.png"
     alt="Grafiek bevolkingsgroei IJsselstein 2000-2024"
     aria-describedby="grafiek-beschrijving">
<div id="grafiek-beschrijving">
  <p>De grafiek toont een stijging van 32.000 inwoners in 2000
     naar 41.000 in 2024, met de sterkste groei tussen 2015 en 2020.</p>
</div>

<!-- PASS: infographic met tekstuele uitwerking -->
<img src="infographic.png"
     alt="Infographic aantal likes per partij — zie uitgeschreven versie hieronder">
<div>
  <!-- Volledige tekstuele uitwerking van alle data -->
</div>
```

**Checklist complexe afbeeldingen:**
- Heeft de afbeelding een korte alt-tekst die het onderwerp benoemt?
- Is er een uitgebreide beschrijving beschikbaar?
- Is deze beschrijving direct bereikbaar (bij voorkeur onder de afbeelding)?
- Kan een gebruiker zonder visuele waarneming dezelfde informatie verkrijgen?

### 8. KAARTEN

**Kaarten mogen visueel complex zijn**, mits essentiële informatie volledig als tekst beschikbaar is.

```html
<!-- PASS: kaart met volledig tekstalternatief -->
<img src="kaart-locaties.png"
     alt="Kaart met 6 locaties in de gemeente"
     aria-describedby="kaart-beschrijving">
<div id="kaart-beschrijving">
  <h3>Locaties</h3>
  <ul>
    <li>Gemeentehuis — Overtoom 1</li>
    <li>Bibliotheek — Benschopperstraat 15</li>
    <!-- etc. -->
  </ul>
</div>

<!-- PASS: kaart als decoratief omdat tekst volledig is -->
<img src="kaart.png" alt="">
<h3>Locaties</h3>
<ul>
  <li>Gemeentehuis — Overtoom 1</li>
  <!-- volledig tekstueel alternatief -->
</ul>
```

**Checklist kaarten:**
- Is essentiële informatie volledig als tekst beschikbaar?
- Staat het tekstalternatief direct bij de kaart?
- Heeft de gebruiker de kaart NIET nodig om de informatie te begrijpen?

### 9. VIDEO, AUDIO EN OVERIGE MEDIA

**Regel:** Minimaal een beschrijvend tekstalternatief dat aangeeft waar de media over gaat.

```html
<!-- PASS: video met beschrijvende tekst -->
<video poster="thumbnail.jpg" ...>
  <p>Video: Uitleg over het aanvragen van een paspoort bij de gemeente.</p>
</video>

<!-- PASS: audio met beschrijving -->
<audio ...>
  <p>Geluidsopname van de raadsvergadering van 15 januari 2025.</p>
</audio>
```

**Let op:** Ondertiteling (SC 1.2.2), audiodescriptie (SC 1.2.3/1.2.5) en transcripties (SC 1.2.1) vallen onder andere succescriteria.

---

## Aanvullende checks

### Afbeeldingen van tekst

Tekst mag niet als afbeelding worden weergegeven als het technisch mogelijk is om echte tekst te gebruiken.

```html
<!-- FAIL: tekst als afbeelding -->
<img src="openingstijden.png" alt="Openingstijden: ma-vr 9:00-17:00">
<!-- De tekst kan gewoon als HTML worden weergegeven -->

<!-- PASS: echte tekst -->
<p>Openingstijden: ma-vr 9:00-17:00</p>
```

### SVG-afbeeldingen

```html
<!-- Informatieve SVG -->
<svg role="img" aria-labelledby="svg-title">
  <title id="svg-title">Toegankelijkheid</title>
  <path d="..."/>
</svg>

<!-- Decoratieve SVG -->
<svg aria-hidden="true" focusable="false">
  <path d="..."/>
</svg>
```

### Icoonknoppen en icoonfonts

```html
<!-- FAIL: icoonknop zonder naam -->
<button><span class="fa fa-search"></span></button>

<!-- PASS: icoonknop met aria-label -->
<button aria-label="Zoeken">
  <span class="fa fa-search" aria-hidden="true"></span>
</button>

<!-- PASS: icoonknop met verborgen tekst -->
<button>
  <span class="fa fa-search" aria-hidden="true"></span>
  <span class="visually-hidden">Zoeken</span>
</button>
```

### CSS-achtergrondafbeeldingen

CSS-achtergrondafbeeldingen zijn niet toegankelijk voor screenreaders. Als de afbeelding informatief is, moet er een alternatief in de HTML staan.

---

## Technische controle

Voer altijd deze checks uit:

1. **Elk `<img>` heeft een `alt`-attribuut** (gevuld of leeg, niet ontbrekend)
2. **Geen ontbrekende alt-attributen** (`<img src="...">` zonder alt)
3. **SVG's** hebben een toegankelijke naam indien informatief (`role="img"` + `<title>` of `aria-label`)
4. **Icoonknoppen** hebben een `aria-label` of zichtbare tekst
5. **Geen bestandsnamen als alt-tekst**
6. **Geen "afbeelding van..." als prefix**

---

## Regels voor het schrijven van alt-tekst

### WEL:
- Beknopt (richtlijn ±125 tekens)
- Beschrijf relevante inhoud/betekenis
- Gebruik normale zinnen
- Geef context bij links/knoppen (beschrijf bestemming/actie)
- Neem belangrijke details op

### NIET:
- Begin met "afbeelding van", "foto van", "plaatje van"
- Gebruik bestandsnamen
- Herhaal omringende tekst
- Maak te lang (gebruik `aria-describedby` voor uitgebreide beschrijvingen)
- Gebruik technisch jargon tenzij nodig

---

## Rapportageformat

Voor elke bevinding:

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-9: informatief | decoratief | functioneel | logo |
                  hero | teaser | complex | kaart | media]
Element:         [beschrijving]
Locatie:         [positie op pagina / HTML-selector]
Beoordeling:     [PASS | FAIL]
HTML-code:       [relevante code snippet]
Huidige alt:     [huidige alt-tekst of "ONTBREEKT"]
Classificatie:   [decoratief | informatief | functioneel | complex]

Probleem:        [alleen bij FAIL]
Aanbeveling:     [concrete oplossing met voorgestelde alt-tekst]
```

---

## Veelvoorkomende patronen op gemeente-websites (SIMsite/Drupal)

| Patroon | Classificatie | Correcte alt | Toelichting |
|---------|--------------|-------------|-------------|
| Logo in header | Informatief | "Logo Gemeente X, link naar Homepagina" | Bevat org-naam + linkdoel |
| Hero (generiek) | Decoratief | `alt=""` | Sfeerbeeld zonder specifieke info |
| Hero (met tekst) | Informatief | Tekst in afbeelding overnemen | Tekst moet beschikbaar zijn |
| Teaserfoto nieuwsoverzicht | Decoratief | `alt=""` | Kop+teaser geven al context |
| Contentfoto in artikel | Informatief | Beschrijf betekenis | Niet het uiterlijk |
| PDF-icoon bij download | Functioneel | "Document X downloaden (PDF)" | Beschrijf document, niet icoon |
| Social media icoon | Functioneel | `aria-hidden` + tekst | Icoon decoratief, tekst beschrijft platform |
| Kaart met locaties | Complex | Korte alt + tekstlijst locaties | Alle data ook als tekst |
| Video thumbnail | Informatief | "Video: onderwerp" | Minimaal onderwerp benoemen |
| Decoratieve rand/scheidslijn | Decoratief | `alt=""` | Geen informatie |

---

## Veelgemaakte fouten (expert-niveau)

1. **Alt beschrijft uiterlijk i.p.v. betekenis** — "Man in pak" i.p.v. "Wethouder bij opening stadspark"
2. **Te lange alt-tekst** — Complexe informatie hoort in aparte beschrijving via `aria-describedby`
3. **Decoratief met overbodige alt** — Sfeerbeeld met `alt="Foto van het gemeentehuis"` terwijl info al in tekst staat
4. **Functioneel beschrijft icoon** — `alt="Pijltje"` bij een link i.p.v. `alt="Volgende pagina"`
5. **Complexe data zonder tekstuitwerking** — Grafiek met alleen korte alt, geen uitgeschreven data
6. **Kaart zonder volledig tekstalternatief** — Alleen `alt="Kaart"` zonder locatielijst
7. **Inconsistente teaserfoto-behandeling** — Sommige wel, sommige geen alt in hetzelfde overzicht
8. **Alt ontbreekt volledig** — `<img src="...">` zonder alt-attribuut

---

## Doel van dit criterium

Niet-tekstuele content moet begrijpelijk zijn voor gebruikers die deze niet visueel of auditief kunnen waarnemen. Het tekstalternatief moet gelijkwaardig zijn in betekenis en doel, zodat hulpsoftware de inhoud correct kan overbrengen.

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.1.1 is Niveau A:**
- Verplicht voor compliance
- Meest voorkomende toegankelijkheidsissue
- Relatief eenvoudig op te lossen
- Vaak redactioneel issue (alt-tekst aanpassen in CMS)

**Van toepassing op:**
- Gemeenten, provincies, waterschappen
- Rijksoverheid
- Publieke instellingen
- Ook afbeeldingen in PDF-documenten

## Bronnen

- **WCAG 2.2 Understanding 1.1.1:** https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html
- **W3C Alt Decision Tree:** https://www.w3.org/WAI/tutorials/images/decision-tree/
- **W3C Images Tutorial:** https://www.w3.org/WAI/tutorials/images/
- **Technique H37 (alt on img):** https://www.w3.org/WAI/WCAG22/Techniques/html/H37
- **Technique H67 (decorative):** https://www.w3.org/WAI/WCAG22/Techniques/html/H67
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
