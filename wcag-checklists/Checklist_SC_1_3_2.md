---
name: wcag-1-3-2-meaningful-sequence
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.3.2 (Meaningful Sequence) on Dutch government websites. Use when conducting accessibility audits to verify that the reading order of content is programmatically determinable and logically correct. Covers DOM order vs. visual order, CSS positioning issues, layout tables, flexbox/grid order manipulation, tabindex misuse, and screen reader testing. Relevant for gemeente websites built on Drupal/SIMsite CMS platforms. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.3.2 Betekenisvolle volgorde — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.3.2 (Niveau A):**
Wanneer de volgorde waarin content wordt gepresenteerd van invloed is op de betekenis ervan, kan een correcte leesvolgorde programmatisch worden bepaald.

**Kernprincipe:** Hulptechnologieën (zoals schermlezers) lezen content in de volgorde van de broncode (DOM). Als de visuele presentatie afwijkt van de DOM-volgorde en die volgorde is van belang voor de betekenis, moet de DOM-volgorde een logische leesvolgorde bieden.

**Twee kernvoorwaarden:**
1. **De volgorde doet ertoe** — als het verwisselen van contentblokken de betekenis verandert
2. **De correcte volgorde is programmatisch bepaalbaar** — de DOM-volgorde moet kloppen

**Voorbeeld: kolommen.** Wanneer twee kolommen tekst naast elkaar staan, is het belangrijk dat de tekst per kolom wordt gelezen, en niet per regel. Deze volgorde moet door software kunnen worden bepaald, zodat voorleessoftware de tekst per kolom voorleest.

**Wanneer doet de volgorde er NIET toe?**
Als onafhankelijke contentblokken in willekeurige volgorde gelezen kunnen worden zonder dat de betekenis verandert (bijv. twee losse nieuwsartikelen naast elkaar), dan is er geen "meaningful sequence" en is SC 1.3.2 niet van toepassing op de onderlinge volgorde.

---

## Scope

### Wel onder SC 1.3.2:

| Situatie | Voorbeeld |
|----------|-----------|
| Content met logische leesrichting | Artikel met koppen, alinea's, afbeeldingen |
| Stapsgewijze instructies | Formulier met stappen, handleiding |
| Navigatie gevolgd door hoofdcontent | Header → nav → main → footer |
| Multi-kolom layouts | Sidebar naast hoofdcontent |
| Tabelgegevens | Data in tabellen met rij/kolom-relaties |
| Formulieren met labels en invoervelden | Label moet bij het juiste veld staan |

### Niet onder SC 1.3.2 (volgorde doet er niet toe):

| Situatie | Waarom niet |
|----------|------------|
| Twee onafhankelijke nieuwsberichten naast elkaar | Volgorde verandert de betekenis niet |
| Onafhankelijke widgets in een sidebar | Onderlinge volgorde is niet relevant |
| Decoratieve elementen | Hebben geen betekenisvolle volgorde |

---

## Beslisboom

```
Content-element gevonden op de pagina
│
├─ Is de volgorde van de content van invloed op de betekenis?
│  ├─ NEE → SC 1.3.2 is niet van toepassing op dit element
│  └─ JA ↓
│
├─ Komt de DOM-volgorde overeen met een logische leesvolgorde?
│  ├─ JA → PASS
│  └─ NEE ↓
│
├─ Wordt CSS gebruikt om de visuele volgorde te wijzigen
│  ten opzichte van de DOM?
│  ├─ JA → Is de DOM-volgorde nog steeds logisch?
│  │  ├─ JA → PASS (visuele afwijking is acceptabel)
│  │  └─ NEE → FAIL (F1)
│  └─ NEE ↓
│
└─ Worden andere technieken gebruikt die de volgorde beïnvloeden?
   (layout-tabellen, flexbox order, grid order, tabindex, whitespace)
   ├─ JA → Controleer linearisatie → logisch? → PASS / FAIL
   └─ NEE → Controleer DOM-volgorde → logisch? → PASS / FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Bepaal of de volgorde van belang is
Bekijk de pagina visueel. Zijn er elementen waarvan de volgorde de betekenis beïnvloedt?
- Stapsgewijze content (instructies, procedures)
- Content met logische hiërarchie (kop → tekst → afbeelding → bijschrift)
- Formulieren (label → invoerveld → foutmelding)
- Navigatie-structuur

### Stap 2: Schakel CSS uit en vergelijk
- Schakel CSS uit in de browser (DevTools: Elements → Computed → deactiveer stylesheets)
- Vergelijk de volgorde van de content zonder CSS met de visuele presentatie
- Is de content zonder CSS nog steeds logisch leesbaar?

### Stap 3: Controleer de DOM-volgorde
- Open de DevTools (F12) en bekijk de HTML-broncode
- Controleer of de DOM-volgorde overeenkomt met een logische leesvolgorde
- Let op CSS-eigenschappen die de visuele volgorde wijzigen: `float`, `position: absolute/relative`, `flexbox order`, `grid-row/grid-column`, `CSS Grid template areas`

### Stap 4: Test met een schermlezer
- Gebruik NVDA, VoiceOver of een andere schermlezer
- Navigeer door de pagina en controleer of de leesvolgorde logisch is
- Let op momenten waarop content in een onverwachte volgorde wordt voorgelezen

### Stap 5: Controleer op bekende foutpatronen
- Layout-tabellen die niet logisch lineariseren (F49)
- CSS-positionering die de betekenis verandert (F1)
- Whitespace-tekens voor opmaak (F32, F33, F34)
- Tabindex-waarden > 0 die de tabvolgorde veranderen

---

## De 7 auditgebieden

### 1. DOM-VOLGORDE VS. VISUELE VOLGORDE

**Kernregel:** De DOM-volgorde moet een logische leesvolgorde bieden, ongeacht de visuele presentatie.

```html
<!-- PASS: DOM-volgorde komt overeen met logische leesrichting -->
<article>
  <h2>Parkeervergunning aanvragen</h2>
  <p>U kunt een parkeervergunning aanvragen als u...</p>
  <h3>Stap 1: Inloggen met DigiD</h3>
  <p>Ga naar het aanvraagformulier en log in.</p>
  <h3>Stap 2: Gegevens invullen</h3>
  <p>Vul uw adres en kenteken in.</p>
</article>

<!-- FAIL (F1): CSS verandert de visuele volgorde op een
     manier die de betekenis beïnvloedt -->
<div class="step" style="position: absolute; top: 200px;">Stap 2: Gegevens invullen</div>
<div class="step" style="position: absolute; top: 100px;">Stap 1: Inloggen met DigiD</div>
<!-- Schermlezer leest Stap 2 vóór Stap 1 -->
```

### 2. CSS FLEXBOX EN GRID ORDER

**Probleem:** CSS `order`, `flex-direction: row-reverse`, `grid` properties kunnen de visuele volgorde wijzigen zonder de DOM aan te passen.

```html
<!-- FAIL: flexbox order verandert de visuele volgorde van stappen -->
<div style="display: flex;">
  <div style="order: 2;">Stap 1: Inloggen</div>
  <div style="order: 1;">Stap 2: Aanvragen</div>
  <div style="order: 3;">Stap 3: Betalen</div>
</div>
<!-- Visueel: Stap 2, Stap 1, Stap 3
     Schermlezer: Stap 1, Stap 2, Stap 3 (DOM-volgorde)
     → Visuele en programmatische volgorde komen niet overeen -->

<!-- PASS: flexbox order voor onafhankelijke elementen -->
<div style="display: flex;">
  <aside style="order: 2;">Sidebar met contactinfo</aside>
  <main style="order: 1;">Hoofdcontent</main>
</div>
<!-- De volgorde van sidebar en main beïnvloedt de
     betekenis niet → geen probleem -->
```

**Let op:** `flex-direction: row-reverse` en `column-reverse` keren de visuele volgorde om maar niet de DOM-volgorde. Dit is een FAIL als de volgorde betekenisvol is.

### 3. LAYOUT-TABELLEN (GEEN TABEL VOOR STYLING)

**Regel:** Het is niet de bedoeling dat een tabel wordt gebruikt voor de styling van een pagina. Dat kan ervoor zorgen dat de verschillende onderdelen een verkeerde volgorde in de code krijgen. Het gevolg is dat de inhoud verkeerd wordt voorgelezen. Zo kan het gebeuren dat eerst alle titels worden voorgelezen, en daarna pas alle berichten — in plaats van de titel en daarna direct het bijbehorende bericht.

**Voor tabelgegevens moet het `<table>` element worden gebruikt.** Dan leest voorleessoftware het in een logische volgorde voor. Er mogen geen spaties of tabs worden gebruikt om een tabel te maken.

```html
<!-- FAIL (F49): layout-tabel die niet logisch lineariseert -->
<table>
  <tr>
    <td>Stap 1: Inloggen</td>
    <td>Stap 3: Betalen</td>
  </tr>
  <tr>
    <td>Stap 2: Aanvragen</td>
    <td>Stap 4: Bevestiging</td>
  </tr>
</table>
<!-- Gelineariseerd: Stap 1, Stap 3, Stap 2, Stap 4 → onlogisch -->

<!-- PASS: layout-tabel die logisch lineariseert -->
<table>
  <tr>
    <td>Stap 1: Inloggen</td>
    <td>Stap 2: Aanvragen</td>
  </tr>
  <tr>
    <td>Stap 3: Betalen</td>
    <td>Stap 4: Bevestiging</td>
  </tr>
</table>
<!-- Gelineariseerd: Stap 1, Stap 2, Stap 3, Stap 4 → logisch -->
```

### 4. WHITESPACE EN TEKST-OPMAAK

**Probleem:** Het gebruik van spaties, tabs of regeleinden om tekst visueel te positioneren (in plaats van CSS) kan de leesvolgorde verstoren.

```html
<!-- FAIL (F32): spaties binnen een woord voor visueel effect -->
<p>G E M E E N T E &nbsp; V O O R N E &nbsp; A A N &nbsp; Z E E</p>
<!-- Schermlezer leest individuele letters, niet het woord -->

<!-- PASS: CSS letter-spacing voor visueel effect -->
<p style="letter-spacing: 0.5em;">GEMEENTE VOORNE AAN ZEE</p>
<!-- Schermlezer leest het woord correct -->

<!-- FAIL (F33): spaties voor kolommen in platte tekst -->
<pre>
Naam            Functie           Afdeling
Jan de Vries    Wethouder         Ruimtelijke ordening
</pre>
<!-- Beter: gebruik een <table> element -->
```

### 5. FORMULIEREN EN LABELS

**Probleem:** Als formulierlabels en invoervelden in de DOM niet bij elkaar staan, kan de schermlezer het label niet correct aan het veld koppelen.

```html
<!-- FAIL: labels en velden gescheiden in de DOM -->
<div class="labels">
  <label for="naam">Naam:</label>
  <label for="email">E-mail:</label>
</div>
<div class="fields">
  <input type="text" id="naam">
  <input type="email" id="email">
</div>
<!-- Visueel naast elkaar via CSS, maar DOM-volgorde is:
     Label Naam, Label E-mail, Input Naam, Input E-mail -->

<!-- PASS: label direct bij het invoerveld -->
<div>
  <label for="naam">Naam:</label>
  <input type="text" id="naam">
</div>
<div>
  <label for="email">E-mail:</label>
  <input type="email" id="email">
</div>
```

**Let op:** Zelfs als `for`/`id` koppeling correct is, is de DOM-volgorde nog steeds belangrijk voor de algehele leesvolgorde van het formulier.

### 6. DYNAMISCHE CONTENT EN JAVASCRIPT

**Probleem:** Dynamisch ingevoegde content (via JavaScript) kan op de verkeerde plek in de DOM terechtkomen.

```html
<!-- FAIL: foutmelding wordt onderaan de pagina ingevoegd -->
<form>
  <label for="naam">Naam:</label>
  <input type="text" id="naam">
  <button type="submit">Verstuur</button>
</form>
<!-- ... veel andere content ... -->
<div id="errors">
  <!-- JavaScript voegt hier foutmeldingen toe,
       ver van het formulier in de DOM -->
</div>

<!-- PASS: foutmelding direct bij het formulierveld -->
<form>
  <label for="naam">Naam:</label>
  <input type="text" id="naam" aria-describedby="naam-error">
  <span id="naam-error" role="alert">Vul een naam in.</span>
  <button type="submit">Verstuur</button>
</form>
```

### 7. LIJSTEN EN VOLGORDESEMANTIEK

**Regel:** Voor genummerde lijsten moet een `<ol>` element worden gebruikt. Zo weet voorleessoftware dat de volgorde van belang is. Bij een `<ul>` weet de hulpsoftware dat de volgorde niet van belang is.

```html
<!-- PASS: genummerde stappen in een <ol> -->
<h2>Parkeervergunning aanvragen</h2>
<ol>
  <li>Log in met DigiD</li>
  <li>Vul uw gegevens in</li>
  <li>Betaal de leges</li>
  <li>Ontvang de bevestiging</li>
</ol>

<!-- FAIL: genummerde stappen in een <ul> of losse <p> elementen -->
<h2>Parkeervergunning aanvragen</h2>
<ul>
  <li>1. Log in met DigiD</li>
  <li>2. Vul uw gegevens in</li>
  <li>3. Betaal de leges</li>
</ul>
<!-- Voorleessoftware weet niet dat de volgorde van belang is -->
```

### Patroon A: SIMsite/Drupal paginalayout

Gemeente-websites op SIMsite (Next.js/Drupal) gebruiken een standaard layout:
```
Header → Navigatie → Breadcrumb → Hoofdcontent → Sidebar → Footer
```

**Controleer:**
- Komt de DOM-volgorde overeen met deze logische structuur?
- Wordt de sidebar via CSS naast de hoofdcontent geplaatst?
- Is de DOM-volgorde: header → nav → main → aside → footer?

**Veelvoorkomend probleem:** Sidebar-content staat in de DOM vóór de hoofdcontent maar wordt visueel rechts getoond. Als de sidebar onafhankelijk is van de hoofdcontent, is dit geen probleem. Als de sidebar contextuele informatie bevat die bij de hoofdcontent hoort, kan dit wél een probleem zijn.

### Patroon B: Nieuwsoverzicht met kaarten

**Belangrijk probleem:** Vaak wordt een afbeelding of datum bij een nieuwsbericht boven of links van de titel getoond. Als deze nieuwsberichten in een lijst staan, moet duidelijk zijn welke afbeelding/datum bij welk bericht hoort. Als dat niet het geval is, moet dit zowel bij SC 1.3.2 als bij SC 1.3.1 worden afgekeurd.

```html
<!-- FAIL: afbeeldingen en datums niet duidelijk gekoppeld aan berichten -->
<div class="news-list">
  <img src="nieuws1.jpg" alt="...">
  <img src="nieuws2.jpg" alt="...">
  <span class="date">15 januari 2025</span>
  <span class="date">20 januari 2025</span>
  <h3><a href="/nieuws/1">Nieuwe parkeerregels</a></h3>
  <h3><a href="/nieuws/2">Subsidie woningisolatie</a></h3>
</div>
<!-- Schermlezer: alle afbeeldingen, dan alle datums, dan alle koppen
     → niet duidelijk wat bij wat hoort -->

<!-- PASS: elk nieuwsbericht als geheel bij elkaar in de DOM -->
<ul class="news-list">
  <li class="card">
    <img src="nieuws1.jpg" alt="">
    <span class="date">15 januari 2025</span>
    <h3><a href="/nieuws/1">Nieuwe parkeerregels</a></h3>
    <p>Vanaf maart gelden nieuwe regels...</p>
  </li>
  <li class="card">
    <img src="nieuws2.jpg" alt="">
    <span class="date">20 januari 2025</span>
    <h3><a href="/nieuws/2">Subsidie woningisolatie</a></h3>
    <p>Eigenaren kunnen subsidie aanvragen...</p>
  </li>
</ul>
<!-- Elk bericht is een <li>: afbeelding, datum, kop en teaser
     zijn duidelijk bij elkaar gegroepeerd -->
```

### Patroon C: Formulieren met meerdere stappen

```html
<!-- Controleer: worden stappen in de juiste volgorde gepresenteerd? -->
<div class="step active" id="step-1">Stap 1: Persoonsgegevens</div>
<div class="step" id="step-2">Stap 2: Adresgegevens</div>
<div class="step" id="step-3">Stap 3: Bevestiging</div>
```

**Controleer:** Worden stappen in de DOM in de juiste volgorde weergegeven? Bij single-page formulieren met JavaScript: wordt alleen de actieve stap getoond (de rest verborgen)?

### Patroon D: Accordion/collapse content

```html
<!-- Controleer: staat de inhoud direct na de knop in de DOM? -->
<button aria-expanded="false" aria-controls="faq-1">
  Hoe vraag ik een vergunning aan?
</button>
<div id="faq-1" hidden>
  <p>U kunt een vergunning aanvragen via...</p>
</div>
```

**Controleer:** De verborgen content moet in de DOM direct na de bijbehorende knop staan, niet elders op de pagina.

### Patroon E: Cookie-banner/melding

```html
<!-- Controleer: waar staat de cookiemelding in de DOM? -->
<!-- Als de cookiemelding onderaan de DOM staat maar visueel
     bovenaan verschijnt, is dat geen probleem mits:
     - focus correct wordt beheerd
     - de melding met aria-live of role="alert" wordt aangekondigd -->
```

### Patroon F: Tabs/tabpanelen

**Belangrijk:** Bij tabbladen moet eerst de kop van het tabblad worden voorgelezen en dan de content die bij dat tabblad hoort. Het is niet de bedoeling dat eerst alle tabbladkoppen worden voorgelezen en pas daarna alle content.

```html
<!-- FAIL: eerst alle tabkoppen, dan alle content -->
<div role="tablist">
  <button role="tab" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-controls="panel-2">Tab 2</button>
  <button role="tab" aria-controls="panel-3">Tab 3</button>
</div>
<div role="tabpanel" id="panel-1">Inhoud tab 1</div>
<div role="tabpanel" id="panel-2" hidden>Inhoud tab 2</div>
<div role="tabpanel" id="panel-3" hidden>Inhoud tab 3</div>
<!-- Dit is wél acceptabel als alleen het actieve paneel zichtbaar
     is en de inactieve panelen hidden zijn → schermlezer slaat
     hidden content over. Maar als ALLE panelen zichtbaar zijn,
     worden eerst alle koppen en dan alle content voorgelezen. -->

<!-- PASS: tabpaneel direct na de tablijst, alleen actief paneel zichtbaar -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1">Inhoud tab 1</div>
<div role="tabpanel" id="panel-2" hidden>Inhoud tab 2</div>
```

---

## Testtechnieken

### Test 1: CSS uitschakelen
1. Open DevTools (F12)
2. Ga naar het "Elements" tabblad
3. Schakel alle stylesheets uit
4. Controleer of de content nog steeds in een logische volgorde staat

### Test 2: Linearisatie
1. Kopieer de zichtbare tekst van de pagina (Ctrl+A → Ctrl+C)
2. Plak in een tekstbestand
3. Lees de tekst door — is de volgorde logisch?

### Test 3: Schermlezer
1. Start NVDA (Windows) of VoiceOver (Mac)
2. Navigeer door de pagina met pijltoetsen
3. Controleer of de leesvolgorde logisch en begrijpelijk is
4. Let op: springen, verwarrende volgorde, ontbrekende context

### Test 4: Tab-volgorde (aanvullend, raakt ook SC 2.4.3)
1. Navigeer met Tab door de interactieve elementen
2. Controleer of de tabvolgorde logisch is
3. Let op: tabindex > 0 kan de verwachte volgorde verstoren

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G57 | Content in een betekenisvolle volgorde ordenen |
| C6 | Content positioneren op basis van structurele markup |
| C8 | CSS letter-spacing gebruiken voor afstand binnen woorden |
| H34 | Unicode RLM/LRM gebruiken voor gemengde tekstrichting |
| H56 | Het `dir` attribuut gebruiken voor geneste tekstrichtingen |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F1 | De betekenis van content veranderen door CSS-positionering |
| F32 | Whitespace-tekens gebruiken om afstand binnen een woord te regelen |
| F33 | Whitespace-tekens gebruiken om meerdere kolommen te maken in platte tekst |
| F34 | Whitespace-tekens gebruiken om tabellen op te maken in platte tekst |
| F49 | HTML layout-tabel gebruiken die niet logisch lineariseert |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-7: DOM vs. visueel | flexbox/grid |
                  layout-tabellen | whitespace | formulieren |
                  dynamische content | lijsten]
Element:         [beschrijving van het element]
Locatie:         [positie op pagina / CSS selector / XPath]
Beoordeling:     [PASS | FAIL | N.v.t.]

DOM-volgorde:    [beschrijf de volgorde in de broncode]
Visuele volgorde: [beschrijf de visuele presentatie]
Verschil:        [ja/nee — beschrijf het verschil]
Betekenis:       [beïnvloedt het verschil de betekenis? ja/nee]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [W3C failure/sufficient technique code]
Aanbeveling:     [concrete oplossing]
```

---

## Relatie met andere SC's

| SC | Naam | Niveau | Relatie met 1.3.2 |
|----|------|--------|------------------|
| 1.3.1 | Info en relaties | A | Structuur correct opgemaakt |
| **1.3.2** | **Betekenisvolle volgorde** | **A** | **Leesvolgorde klopt** |
| 1.3.3 | Zintuiglijke kenmerken | A | Niet alleen op positie vertrouwen |
| 2.4.3 | Focusvolgorde | A | Tabvolgorde komt overeen met leesvolgorde |
| 4.1.1 | Parsing | — | Geldige HTML-structuur |

**Belangrijke relatie met SC 2.4.3 (Focusvolgorde):**
SC 1.3.2 gaat over de **leesvolgorde** (hoe content wordt voorgelezen). SC 2.4.3 gaat over de **focusvolgorde** (hoe interactieve elementen via Tab worden bereikt). In de praktijk overlappen ze vaak: als de DOM-volgorde niet klopt, zijn vaak beide criteria geschonden.

---

## Praktische audittips

### Realiteit op gemeente-websites

Moderne gemeente-websites (SIMsite, Drupal) gebruiken doorgaans semantische HTML en CSS Flexbox/Grid voor layout. De DOM-volgorde is meestal correct. Veelvoorkomende problemen:

1. **Sidebar vóór hoofdcontent in de DOM** — vaak door CMS-templating
2. **Cookie-banner ver van de visuele positie in de DOM** — moet correct worden afgehandeld met focus management
3. **Visuele herschikking via CSS** — `order` property in Flexbox of Grid
4. **Formulieren met gescheiden labels en velden** — visueel naast elkaar via CSS
5. **Responsive design** — content die bij mobiel anders wordt gestapeld dan bij desktop

### Veelgemaakte fouten

1. **CSS `order` gebruiken voor betekenisvolle content** — de visuele volgorde wijkt af van de DOM
2. **`float: right` voor content die logisch links hoort** — de DOM-volgorde klopt niet meer
3. **`position: absolute` om content te herpositioneren** — de DOM-volgorde wordt genegeerd
4. **Spaties in woorden voor visueel effect** — `G E M E E N T E` in plaats van CSS letter-spacing
5. **Layout-tabellen met onlogische celindeling** — linearisatie levert onzin op

### Best practices voor gemeente-websites

1. **Zorg dat de DOM-volgorde logisch is** — pas daarna CSS toe voor visuele presentatie
2. **Vermijd CSS `order` voor betekenisvolle volgorde** — alleen voor onafhankelijke blokken
3. **Gebruik CSS `letter-spacing` in plaats van spaties in woorden**
4. **Gebruik geen layout-tabellen** — gebruik CSS Flexbox of Grid
5. **Test regelmatig met een schermlezer**

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.3.2 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 1.3.2:** https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html
- **Technique G57 (Betekenisvolle volgorde):** https://www.w3.org/WAI/WCAG22/Techniques/general/G57
- **Technique C6 (Positionering op basis van structuur):** https://www.w3.org/WAI/WCAG22/Techniques/css/C6
- **Failure F1 (CSS-positionering):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F1
- **Failure F32 (Whitespace in woorden):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F32
- **Failure F33 (Whitespace kolommen):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F33
- **Failure F34 (Whitespace tabellen):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F34
- **Failure F49 (Layout-tabel linearisatie):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F49
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
