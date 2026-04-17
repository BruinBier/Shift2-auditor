---
name: wcag-1-4-5-images-of-text
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.4.5 (Images of Text) on Dutch government websites. Use when conducting accessibility audits to verify that text is used instead of images of text, unless a specific visual presentation is essential or the image can be customized by the user. Covers banners with tekst-in-afbeelding, infographics, flyers/posters als afbeelding, social media cards, gescande documenten, en logo's. Includes the two exceptions (essential presentation and customizable images), the distinction with SC 1.4.9 (No Exception), and practical audit methods for gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.4.5 Afbeeldingen van tekst — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.4.5 (Niveau AA):**
Als de gebruikte technologieën de visuele weergave kunnen bewerkstelligen, wordt tekst gebruikt om informatie over te brengen in plaats van afbeeldingen van tekst, behalve in de volgende gevallen:

- **Aanpasbaar:** De afbeelding van tekst kan visueel worden aangepast aan de eisen van de gebruiker.
- **Essentieel:** Een bepaalde weergave van tekst is essentieel voor de informatie die wordt overgebracht.

**Kernprincipe:** Gebruik echte tekst (HTML/CSS) in plaats van afbeeldingen van tekst. Bij standaardtekst op een pagina kan iemand een **eigen stylesheet** in de browser laden met voorkeuren voor lettergrootte, lettertype en (achtergrond)kleur. Deze stylesheets "overrulen" de stijleigenschappen van de website. Op het moment dat tekst in een afbeelding staat, is deze tekst niet met stylesheets of op andere manieren te manipuleren of aan te passen.

Door te zoomen kan tekst in een afbeelding wél groter worden (of juist **kleiner voor mensen met een kokervisie**), maar dat is niet altijd voldoende om tekst goed te kunnen lezen — de tekst wordt bij vergroting korrelig/pixelig.

**Definitie "afbeelding van tekst":** Tekst die is weergegeven in een niet-tekstvorm (bijv. een afbeelding) om een bepaald visueel effect te bereiken. Dit omvat NIET tekst die onderdeel is van een afbeelding die aanzienlijke andere visuele content bevat (bijv. een naambordje op een foto, tekst op een straatbord in een foto).

---

## Twee uitzonderingen

### 1. Aanpasbaar
De afbeelding van tekst kan visueel worden aangepast aan de eisen van de gebruiker (lettertype, grootte, kleur, achtergrond). Dit is in de praktijk zeldzaam op gemeente-websites.

### 2. Essentieel
Een bepaalde visuele weergave van tekst is essentieel voor de informatie. Voorbeelden:

| Essentieel (PASS) | Waarom |
|-------------------|--------|
| Logo's en merknamen | De visuele weergave is onderdeel van de identiteit |
| Lettertypevoorbeelden | Het lettertype zelf is de informatie (bijv. "Zo ziet Lucida Sans eruit") |
| Historische documenten | De originele weergave is essentieel |
| Handtekeningen | De visuele vorm is de informatie |
| Kunstwerken met tekst | De tekst is onderdeel van het kunstwerk |
| Font dat niet in HTML/CSS kan | Het lettertype is niet beschikbaar voor webgebruik of mag niet worden gedistribueerd |
| Verticale/diagonale/boog-tekst | Niet in alle browsers mogelijk met CSS |
| Plattegrond met tekst bij onderdelen | De positie van tekst t.o.v. grafische elementen is essentieel (bijv. tekst met lijntjes naar onderdelen) |
| Diagram/grafiek met tekst, titel en legenda | De tekst is onderdeel van de grafische weergave |
| Reclamecampagnemateriaal voor offline gebruik | Afbeelding van offline materiaal |
| Tekst die herkenbaarheid met logo moet oproepen | Bijv. een "Share"-icoon met tekst in hetzelfde lettertype als het logo |

**Let op: slogan vs. logo**
Een logo hoeft niet te voldoen, maar een **slogan wél**. Dit kan discussie oproepen. Bij twijfel kun je ervoor kiezen een slogan toch niet aan te merken als failure. Vermeld dit dan wel in het auditrapport.

---

## Wat is WEL en wat is NIET een "afbeelding van tekst"?

### WEL afbeelding van tekst:

| Situatie | Voorbeeld |
|----------|-----------|
| Banner/header met tekst als afbeelding | Een PNG/JPG met de tekst "Welkom in onze gemeente" |
| Knop als afbeelding | Een afbeelding van een knop met tekst erop |
| Titel als afbeelding | Een heading die als afbeelding is opgemaakt i.p.v. HTML+CSS |
| Infographic met veel tekst | Een afbeelding met grafieken EN uitgebreide tekst |
| Flyer/poster als afbeelding | Een JPG van een evenementenposter met tekst |
| Social media card als afbeelding | Een afbeelding met tekst die ook als HTML had gekund |
| Gescand document (niet-OCR) | Een PDF die een scan is van papier |

### NIET afbeelding van tekst (valt NIET onder SC 1.4.5):

| Situatie | Waarom niet |
|----------|------------|
| Foto met tekst die echt ín de foto zit | Tekst is onderdeel van een "picture" met significante andere visuele content |
| Straatbord, naambordje op een foto | Tekst zit in de originele foto |
| Schilderij, tekening met tekst | Offline kunstwerk — "picture" |
| Voorkant van een tijdschrift | Afbeelding van offline materiaal |
| Screenshot van een applicatie | Bevat significante andere visuele content |
| Grafiek/diagram met labels, titel en legenda | Tekst is onderdeel van de visuele grafiek |
| Plattegrond met tekst bij onderdelen | Positie van tekst t.o.v. grafiek is essentieel |
| Logo | Uitzondering "essentieel" |

**Belangrijk onderscheid: foto met originele tekst vs. later toegevoegde tekst**

- Tekst die echt **ín de originele foto** zit (straatbord, naambordje, belettering op een gevel) → NIET onder SC 1.4.5
- Tekst die **later aan de foto is toegevoegd** met bewerking (titel, datum, evenementinfo over de foto heen geplaatst) → WEL onder SC 1.4.5. De tekst moet eruit gehaald worden en als HTML op de pagina worden geplaatst.

**Het onderscheid "picture" vs. "image":**
In het Engels wordt onderscheid gemaakt tussen "picture" (een visuele weergave die in de echte wereld bestaat: schilderij, tekening, foto, tijdschriftcover) en "image" (een digitale afbeelding). Een "picture" met significante andere visuele content vormt een uitzondering. Een digitaal gemaakte "image" met alleen tekst (zoals een banner of knop) is wél een afbeelding van tekst.

---

## Beslisboom

```
Afbeelding met tekst gevonden
│
├─ Bevat de afbeelding significante andere visuele content
│  naast de tekst? (foto, grafiek, diagram, screenshot)
│  └─ JA → Geen "afbeelding van tekst" → SC 1.4.5 n.v.t.
│
├─ Is de visuele weergave essentieel?
│  (logo, lettertype-voorbeeld, historisch document, handtekening)
│  └─ JA → Uitzondering "essentieel" → PASS
│
├─ Kan de afbeelding van tekst worden aangepast door de gebruiker?
│  (lettertype, grootte, kleur, regelafstand)
│  └─ JA → Uitzondering "aanpasbaar" → PASS
│
├─ Kan hetzelfde visuele effect worden bereikt met HTML/CSS?
│  ├─ JA → Gebruik tekst i.p.v. afbeelding → huidige situatie = FAIL
│  └─ NEE (bijv. font niet beschikbaar, font niet distribueerbaar)
│     → Afbeelding van tekst toegestaan → PASS
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle afbeeldingen met tekst
Scan de pagina op afbeeldingen die tekst bevatten:
- Banners, headers, hero-afbeeldingen met tekst
- Knoppen die als afbeelding zijn opgemaakt
- Titels of koppen als afbeelding
- Infographics, flyers, posters
- Social media cards
- Gescande documenten

### Stap 2: Bepaal of het een "afbeelding van tekst" is
Per afbeelding: bevat deze significante andere visuele content naast de tekst?
- JA (foto, grafiek, screenshot) → geen "afbeelding van tekst" → n.v.t.
- NEE (de afbeelding bestaat hoofdzakelijk uit tekst) → is een "afbeelding van tekst"

### Stap 3: Controleer de uitzonderingen
- Is het een logo of merknaam? → uitzondering "essentieel"
- Is de specifieke visuele weergave essentieel? → uitzondering
- Kan de gebruiker de afbeelding aanpassen? → uitzondering

### Stap 4: Controleer of CSS het visuele effect kan bereiken
- Kan dezelfde weergave met HTML en CSS worden bereikt?
- JA → de afbeelding van tekst is een FAIL
- NEE (bijv. font niet beschikbaar) → PASS

### Stap 5: Controleer of er een toegankelijk tekstalternatief is
Zelfs als de afbeelding van tekst een FAIL is op SC 1.4.5, controleer ook:
- Is er een alt-tekst? (SC 1.1.1)
- Bevat de alt-tekst dezelfde informatie als de tekst in de afbeelding?

---

## De 6 auditgebieden

### 1. BANNERS EN HEADERS MET TEKST

Het meest voorkomende issue op gemeente-websites.

```html
<!-- FAIL: tekst als afbeelding in banner -->
<div class="banner">
  <img src="welkom-banner.jpg"
       alt="Welkom in gemeente IJsselstein">
</div>
<!-- De tekst "Welkom in gemeente IJsselstein" had als
     HTML-tekst met CSS-styling gekund -->

<!-- PASS: echte tekst over achtergrondafbeelding -->
<div class="banner"
     style="background-image: url('foto.jpg');">
  <h1>Welkom in gemeente IJsselstein</h1>
</div>
<!-- Tekst is echte HTML, kan worden aangepast door de gebruiker -->
```

### 2. KNOPPEN ALS AFBEELDING

```html
<!-- FAIL: knop als afbeelding -->
<a href="/afspraak">
  <img src="maak-afspraak-knop.png" alt="Maak een afspraak">
</a>

<!-- PASS: echte knop met CSS-styling -->
<a href="/afspraak" class="btn btn-primary">
  Maak een afspraak
</a>
```

### 3. INFOGRAPHICS EN FLYERS

Infographics bevatten vaak een mix van grafieken en tekst. De beoordeling hangt af van de verhouding:

```
Infographic met VEEL tekst en weinig grafisch:
→ De tekst had als HTML gekund → FAIL
→ Bied naast de infographic een toegankelijk HTML-alternatief

Infographic met WEINIG tekst en veel grafisch:
→ Tekst is onderdeel van significante visuele content → N.v.t.
→ Wel alt-tekst nodig (SC 1.1.1)
```

**Flyers en posters:**
Gemeente-websites plaatsen vaak flyers/posters als afbeelding. De tekst op deze afbeeldingen kan meestal als HTML worden weergegeven.

```html
<!-- FAIL: evenementenposter als afbeelding -->
<img src="kermis-poster.jpg"
     alt="Kermis IJsselstein, 15-18 juni 2025,
          op het Kronenburgplantsoen, gratis toegang">
<!-- De informatie had als HTML-tekst gekund -->

<!-- PASS: evenementsinformatie als HTML -->
<article class="evenement">
  <h2>Kermis IJsselstein</h2>
  <p>15-18 juni 2025</p>
  <p>Kronenburgplantsoen</p>
  <p>Gratis toegang</p>
  <img src="kermis-sfeer.jpg" alt=""
       role="presentation">
</article>
```

### 4. SOCIAL MEDIA CARDS

Gedeelde social media berichten die als afbeelding op de website staan.

```html
<!-- FAIL: social media post als screenshot -->
<img src="tweet-screenshot.png"
     alt="Tweet: Morgen start de week van de
          toegankelijkheid!">

<!-- PASS: tekst als HTML weergeven -->
<blockquote class="social-post">
  <p>Morgen start de week van de toegankelijkheid!</p>
  <cite>— @GemeenteIJsselstein</cite>
</blockquote>
```

### 5. GESCANDE DOCUMENTEN

PDF's die scans zijn van papieren documenten bevatten afbeeldingen van tekst.

```
Gescand document zonder OCR:
→ FAIL op SC 1.4.5 (en ook op 1.1.1, 1.3.1, etc.)
→ Oplossing: OCR toepassen (Technique PDF7) of
   tekst als doorzoekbare PDF aanbieden

Gescand document met OCR:
→ De onderliggende tekst is beschikbaar
→ Maar de visuele weergave is nog steeds een afbeelding
→ Beoordeling: als de tekst ook als HTML-pagina
   beschikbaar is → PASS
```

### 6. TEKST IN DECORATIEVE AFBEELDINGEN

Tekst die puur decoratief is en geen informatie draagt.

```html
<!-- PASS: decoratieve tekst die geen informatie draagt -->
<div style="background-image: url('watermark.png');">
  <!-- Achtergrondpatroon met herhaalde woorden,
       puur decoratief -->
</div>
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Hero-banner met tekst

Veel gemeente-websites hebben een hero-banner met tekst. De vraag is: is de tekst een afbeelding of echte HTML?

**Audit:** Inspecteer de HTML. Als de tekst een `<h1>` of `<p>` is → echte tekst → PASS. Als de tekst in een `<img>` zit → afbeelding van tekst → beoordeel de uitzonderingen.

### Patroon B: Toptaken-iconen met tekst

Sommige gemeente-websites gebruiken iconen met tekst erin als afbeelding.

**Audit:** Als de tekst ("Paspoort aanvragen", "Afspraak maken") als afbeelding is weergegeven i.p.v. als HTML-tekst → FAIL.

### Patroon C: Nieuws met plaatjes van flyers

Gemeenten plaatsen vaak flyers, posters of uitnodigingen als afbeelding bij nieuwsberichten.

**Audit:** Bevat de afbeelding tekst die ook als HTML had gekund? → FAIL. Bied een HTML-tekstalternatief naast de afbeelding.

### Patroon D: PDF als scan

Gemeente-websites bieden soms gescande brieven, vergunningen of besluiten aan als PDF.

**Audit:** Is de PDF een scan zonder OCR? → FAIL. Is de PDF doorzoekbaar (met OCR)? → Beter, maar de informatie zou bij voorkeur ook als HTML-pagina beschikbaar moeten zijn.

### Patroon E: Carrousel-slides met tekst

Carrousels/sliders bevatten soms afbeeldingen met tekst erop (bijv. "Gemeenteraadsverkiezingen 2026").

**Audit:** Als de tekst als onderdeel van de afbeelding is opgenomen → FAIL. Als de tekst als HTML over de afbeelding heen staat → PASS.

### Patroon F: Gemeente-logo

Het gemeentelogo met de naam erin is een uitzondering ("essentieel").

**Audit:** Logo met tekst → PASS (uitzondering). Wel alt-tekst nodig (SC 1.1.1).

---

## Waarom is echte tekst beter?

| Eigenschap | Echte tekst (HTML/CSS) | Afbeelding van tekst |
|-----------|----------------------|---------------------|
| Vergroten/inzoomen | Blijft scherp | Wordt korrelig/pixelig |
| Lettertype aanpassen | Mogelijk via browser/OS | Niet mogelijk |
| Kleur aanpassen | Mogelijk (hoog contrast modus) | Niet mogelijk |
| Regelafstand aanpassen | Mogelijk | Niet mogelijk |
| Kopiëren/plakken | Mogelijk | Niet mogelijk |
| Vertalen (browser) | Mogelijk | Niet mogelijk |
| Screenreader | Leest direct | Afhankelijk van alt-tekst |
| Zoeken (Ctrl+F) | Vindt de tekst | Vindt niets |
| Responsive/mobiel | Past zich aan | Vaste grootte |

---

## Onderscheid met andere SC's

| SC | Relatie met 1.4.5 |
|----|------------------|
| **1.1.1** | Alt-tekst voor de afbeelding. SC 1.4.5 gaat erover of de afbeelding überhaupt als afbeelding had moeten worden aangeboden. |
| **1.4.4** | Tekst herschalen (200%). Echte tekst kan worden herschaald; afbeeldingen van tekst worden korrelig. |
| **1.4.5** | **Gebruik tekst i.p.v. afbeeldingen van tekst** |
| **1.4.9** | Afbeeldingen van tekst (geen uitzondering) — Niveau AAA. Strenger: alleen logo's als uitzondering. Bij 1.4.5 is "essentieel" breder. |
| **1.4.3** | Contrast van tekst. Geldt ook voor tekst IN afbeeldingen. |
| **1.4.12** | Tekstafstand. Alleen van toepassing op echte tekst, niet op afbeeldingen van tekst. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| C22 | CSS gebruiken om de visuele weergave van tekst te regelen |
| C30 | CSS gebruiken om tekst te vervangen door afbeeldingen van tekst, met schakelaar om te wisselen |
| G140 | Informatie en structuur scheiden van presentatie |
| PDF7 | OCR uitvoeren op een gescand PDF-document om echte tekst te bieden |

### Advisory Techniques

| Beschrijving |
|-------------|
| CSS gebruiken voor decoratieve effecten (schaduwen, randen, lettertypen) i.p.v. afbeeldingen |
| Webfonts gebruiken zodat specifieke lettertypen als echte tekst worden weergegeven |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-6: banners/headers | knoppen | infographics/flyers |
                  social media | gescande documenten | decoratief]
Element:         [beschrijving van de afbeelding]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL | N.v.t.]

Type afbeelding: [PNG/JPG/SVG/PDF]
Tekst in
afbeelding:      [de tekst die in de afbeelding staat]
Essentieel:      [ja/nee — waarom]
Aanpasbaar:      [ja/nee]
Bereikbaar
met CSS:         [ja/nee — waarom wel/niet]
Alt-tekst
aanwezig:        [ja/nee — welke tekst]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [C22 / C30 / G140 / PDF7]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Flyers/posters als afbeelding** — veruit de meest voorkomende fout; evenementinformatie als JPG i.p.v. HTML
2. **Banner-tekst als afbeelding** — welkomsttekst of slagzin als PNG in de hero-sectie
3. **Knoppen als afbeelding** — call-to-action knoppen als PNG/JPG
4. **Carrousel-slides met ingebakken tekst** — slides met tekst als onderdeel van de afbeelding
5. **Gescande PDF's zonder OCR** — brieven, besluiten, vergunningen als scan
6. **Infographics zonder HTML-alternatief** — complexe infographics met veel tekst zonder toegankelijke versie

### Snelle audit-methode

1. **Ctrl+A (alles selecteren) — PRIMAIRE METHODE:** Selecteer alles op de pagina. Echte tekst wordt blauw gemarkeerd; tekst in afbeeldingen wordt NIET apart geselecteerd. Zo zie je direct welke tekst in HTML staat en welke in een afbeelding. **Let hierbij ook op knoppen** — hier worden soms afbeeldingen gebruikt in plaats van tekst.
2. **Rechtermuisklik → Inspecteren:** Als je op tekst klikt en het blijkt een `<img>` te zijn (of achtergrondafbeelding), is het een afbeelding van tekst
3. **Ctrl+F (zoeken):** Zoek naar een woord dat op de pagina zichtbaar is. Als het niet gevonden wordt, is het mogelijk een afbeelding van tekst
4. **CSS uitschakelen:** Afbeeldingen van tekst blijven zichtbaar; echte tekst verandert van stijl

Controleer vervolgens of één van de uitzonderingen van toepassing is. Zo ja, dan is het goed; anders is het fout.

### Technisch of redactioneel issue?

SC 1.4.5 is vaak een **redactioneel issue**:
- De gemeente/redacteur upload een flyer of poster als afbeelding
- De oplossing is de tekst als HTML op de pagina te plaatsen

Soms is het een **technisch/template issue**:
- Het template gebruikt afbeeldingen voor knoppen of koppen
- De oplossing vereist een template-aanpassing

### Wie heeft er baat bij?

- **Slechtzienden** — moeite met het gekozen font, grootte en/of kleur; kunnen tekst in afbeeldingen niet vergroten zonder kwaliteitsverlies; kunnen eigen stylesheet niet toepassen
- **Mensen met kokervisie** — moeten juist inzoomen om tekst kleiner te maken; afbeeldingen van tekst laten zich niet goed verkleinen
- **Mensen met visuele tracking-problemen** — kunnen regelafstand (line spacing) en uitlijning niet aanpassen in afbeeldingen van tekst
- **Mensen met cognitieve beperkingen, waaronder dyslexie** — kunnen lettertype, grootte, kleur en woordafstand niet aanpassen aan hun leesbehoeften (bijv. speciaal dyslexie-lettertype)
- **Kleurenblinden** — kunnen achtergrondkleur en tekstkleur niet aanpassen via eigen stylesheet
- **Mobiele gebruikers** — afbeeldingen van tekst passen zich niet aan aan het schermformaat
- **Iedereen** — echte tekst is doorzoekbaar, kopieerbaar en vertaalbaar

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.4.5 is Niveau AA — dus verplicht.**

SC 1.4.9 (Afbeeldingen van tekst - Geen uitzondering) is Niveau AAA en niet verplicht. Het verschil: bij 1.4.9 geldt de uitzondering "essentieel" alleen voor logo's, niet voor andere situaties.

---

## Bronnen

- **WCAG 2.2 Understanding 1.4.5:** https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html
- **Technique C22 (CSS voor tekst):** https://www.w3.org/WAI/WCAG22/Techniques/css/C22
- **Technique C30 (CSS + schakelaar):** https://www.w3.org/WAI/WCAG22/Techniques/css/C30
- **Technique G140 (Scheiding structuur/presentatie):** https://www.w3.org/WAI/WCAG22/Techniques/general/G140
- **Technique PDF7 (OCR op gescand PDF):** https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF7
- **SC 1.4.9 Understanding (No Exception):** https://www.w3.org/WAI/WCAG22/Understanding/images-of-text-no-exception.html
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
