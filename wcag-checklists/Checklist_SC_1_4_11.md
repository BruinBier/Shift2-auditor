---
name: wcag-1-4-11-non-text-contrast
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.4.11 (Non-text Contrast) on Dutch government websites. Use when conducting accessibility audits to verify that user interface components and meaningful graphical objects have a contrast ratio of at least 3:1 against adjacent colors. Covers buttons, form fields, focus indicators, icons, charts, state indicators, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.4.11 Contrast van niet-tekstuele content — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.4.11 (Niveau AA):**
De visuele presentatie van het volgende heeft een contrastverhouding van ten minste 3:1 met aangrenzende kleuren:

1. **Componenten van de gebruikersinterface:** Visuele informatie die nodig is om componenten en toestanden van de gebruikersinterface te identificeren, behalve bij inactieve componenten of waar het uiterlijk door de user agent wordt bepaald en niet door de auteur is aangepast.
2. **Grafische objecten:** Delen van afbeeldingen die nodig zijn om de content te begrijpen, behalve wanneer een bepaalde presentatie van de afbeelding essentieel is voor de informatie die wordt overgebracht.

**Kernprincipe:** Net zoals tekst voldoende contrast moet hebben (SC 1.4.3), moeten ook niet-tekstuele elementen die informatie overbrengen of interactie mogelijk maken, voldoende zichtbaar zijn. De minimale contrastverhouding is **3:1** (lager dan de 4,5:1 voor normale tekst).

---

## Twee categorieën

### Categorie 1: Componenten van de gebruikersinterface

Alle visuele informatie die nodig is om:
- Te **identificeren** dat een component bestaat (bijv. de rand van een invoerveld)
- De **toestand** van een component te herkennen (bijv. focus, geselecteerd, aangevinkt)

```
Voorbeelden:
- Randen van invoervelden
- Knopranden of -achtergrond
- Focus-indicatoren (focusring)
- Checkbox: aangevinkt vs. niet-aangevinkt
- Radiobutton: geselecteerd vs. niet-geselecteerd
- Schakelaar (toggle): aan vs. uit
- Geselecteerde tab vs. niet-geselecteerde tab
- Slider-handle en -track
```

### Categorie 2: Grafische objecten

Delen van afbeeldingen die nodig zijn om de content te begrijpen:

```
Voorbeelden:
- Iconen die betekenis overbrengen (zoekicoon, downloadicoon)
- Lijnen in lijngrafieken
- Staven in staafdiagrammen
- Taartpunten in cirkeldiagrammen
- Pijlen in diagrammen
- Symbolen op kaarten
```

---

## De 3:1 contrastverhouding

De **3:1** verhouding is hetzelfde als voor grote tekst (SC 1.4.3). Meet het contrast tussen:

- Het niet-tekstuele element **en** de **aangrenzende kleur(en)**

### Wat is "aangrenzend"?

De kleur direct naast het element die de grens of scheiding vormt:

```
Invoerveld met rand:
┌─────────────────────┐
│                     │  ← De rand moet 3:1 contrast
└─────────────────────┘     hebben met de achtergrond
                            van de pagina OF met de
                            achtergrond van het veld
                            (minstens één kant)

Icoon op achtergrond:
  🔍  ← Het icoon moet 3:1 contrast hebben
        met de achtergrond waarop het staat
```

**Belangrijk nuance:** Bij een invoerveld met rand hoeft de rand niet 3:1 te hebben tegen **beide** zijden (veldbinnenachtergrond én pagina-achtergrond). Het gaat erom dat het veld als geheel visueel herkenbaar is. Als de rand 3:1 contrast heeft tegen minstens één aangrenzende kleur, is het veld identificeerbaar.

### Meerdere kleuren of verloop

Als een grafisch object meerdere kleuren of een kleurverloop heeft:
1. Kies het **minst contrasterende** gebied om te testen
2. Als dat gebied minder dan 3:1 heeft, neem dan aan dat dit onzichtbaar is
3. Is het grafisch object dan nog steeds begrijpelijk? → PASS
4. Zo niet → FAIL

---

## De uitzonderingen

### 1. Inactieve componenten

Elementen die niet beschikbaar zijn voor interactie (disabled/uitgeschakeld) hoeven niet aan de contrasteis te voldoen. Ze mogen "grayed out" zijn.

```html
<!-- Inactieve knop — geen contrasteis -->
<button disabled>Verzenden</button>

<!-- Actieve knop — wél 3:1 contrasteis -->
<button>Verzenden</button>
```

### 2. Door de user agent bepaald uiterlijk

Als het uiterlijk volledig door de browser wordt bepaald en niet door de auteur is aangepast, geldt de eis niet. Maar zodra de auteur het uiterlijk aanpast via CSS, geldt SC 1.4.11 wél.

```css
/* Standaard browser-stijl: geen eis */
input[type="text"] { }

/* Aangepaste stijl: wél eis */
input[type="text"] {
  border: 1px solid #ccc; /* Is dit 3:1? */
}
```

### 3. Essentiële presentatie (grafische objecten)

Als een specifieke kleurpresentatie essentieel is voor de informatie:
- Foto's van de werkelijkheid
- Vlaggen
- Heatmaps
- Medische beelden
- Afbeeldingen waar kleurverandering de betekenis verandert

### 4. Decoratieve elementen

Grafische elementen die puur decoratief zijn en geen informatie overbrengen, vallen niet onder SC 1.4.11.

### 5. Logo's

Elementen die deel uitmaken van een logo of merknaam zijn uitgezonderd.

---

## Tekst als symbool

Als teksttekens worden gebruikt als visueel symbool (niet als taal), vallen ze onder SC 1.4.11 (niet-tekstueel contrast), niet onder SC 1.4.3 (tekstcontrast):

```
Voorbeelden:
- "×" als sluiten-symbool
- ">" als pijl-symbool
- "+" als toevoegen-symbool
- "☰" als hamburger-menu

Deze moeten 3:1 contrast hebben als niet-tekst.
```

---

## Beslisboom

```
Niet-tekstueel element gevonden
│
├─ Is het een UI-component?
│  │
│  ├─ Is het inactief (disabled)?
│  │  └─ JA → Geen contrasteis (uitzondering)
│  │
│  ├─ Is het uiterlijk ongewijzigd door de auteur?
│  │  └─ JA → Geen contrasteis (user agent bepaalt)
│  │
│  └─ Heeft de visuele indicator 3:1 contrast
│     met aangrenzende kleur(en)?
│     ├─ JA → PASS
│     └─ NEE → FAIL
│
├─ Is het een grafisch object?
│  │
│  ├─ Is het decoratief?
│  │  └─ JA → Geen contrasteis
│  │
│  ├─ Wordt dezelfde informatie al in tekst gegeven?
│  │  └─ JA → Geen contrasteis
│  │
│  ├─ Is de kleurpresentatie essentieel?
│  │  └─ JA → Geen contrasteis (uitzondering)
│  │
│  └─ Heeft het object 3:1 contrast met
│     aangrenzende kleur(en)?
│     ├─ JA → PASS
│     ├─ NEE, maar het object is nog steeds
│     │  begrijpelijk zonder dat gebied → PASS
│     └─ NEE, en onbegrijpelijk → FAIL
│
└─ Is het geen van beide?
   └─ SC 1.4.11 niet van toepassing
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer UI-componenten

Doorloop de pagina en identificeer alle interactieve elementen:
- Knoppen (randen, achtergrond)
- Invoervelden (randen)
- Checkboxen en radiobuttons
- Schakelaars (toggles)
- Sliders
- Tabs
- Links (als ze een visuele indicator hebben anders dan tekst)

### Stap 2: Controleer toestanden

Per component, controleer de visuele indicator in elke toestand:
- **Default** (standaardweergave)
- **Focus** (toetsenbordfocus)
- **Hover** (muisaanwijzer)
- **Geselecteerd/actief**
- **Fout** (foutstatus)

### Stap 3: Identificeer grafische objecten

Doorloop de pagina en identificeer betekenisvolle grafische elementen:
- Iconen die informatie overbrengen
- Grafieken en diagrammen
- Infographics
- Kaart-symbolen

### Stap 4: Meet het contrast

Gebruik een contrastchecker (bijv. Colour Contrast Analyser, browser DevTools):
- Meet het contrast van het element tegen de aangrenzende kleur
- Noteer de contrastverhouding
- Is het 3:1 of hoger? → PASS

---

## De 6 auditgebieden

### 1. INVOERVELDEN

```
Invoervelden kunnen op drie manieren voldoende
contrast hebben:

1. De RAND van het invoerveld heeft ≥3:1 contrast
   t.o.v. de achtergrond van het container-element
2. De ACHTERGROND van het invoerveld heeft ≥3:1
   contrast t.o.v. de rand van het invoerveld
3. Als het invoerveld GEEN RAND heeft: de achtergrond
   van het invoerveld heeft ≥3:1 contrast t.o.v.
   de achtergrond van het container-element

Typen invoervelden:
- Tekstinvoer
- Combobox / select-element
- Radio-buttons
- Checkboxen

Controleer ALLE statussen:
- Inactief (standaard, zonder focus)
- Geactiveerd (met focus)
- Aangevinkt (voor radio-buttons en checkboxen)
- Niet-aangevinkt (voor radio-buttons en checkboxen)

Veelvoorkomende failures (met gemeten waarden):
✗ Lichtgrijze rand op wit: 1,3:1
✗ Witte rand op roze achtergrond: 1,7:1
✗ Lichtblauwe rand op wit: 1,5:1
✗ Invoerveld zonder rand op witte achtergrond: < 1,1:1
✗ Combobox: oranje "carrot" als indicator: 2,9:1
  (net niet voldoende)

Let op: zelfgemaakte radio-buttons en checkboxen
(met CSS gestylde grafische objecten in plaats van
standaard HTML-elementen) moeten ook voldoende
contrast hebben in alle statussen ('aan' en 'uit').

Correcte implementatie:
✓ Donkerdere rand (#767676) op wit (#fff): 4,5:1
✓ Achtergrond invoerveld (#e8e8e8) op witte
  container (#fff): 3,1:1
```

### 1b. KNOPPEN (relatie met invoervelden)

```
Knoppen zijn geen invoervelden, maar horen
bij formulieren.

Belangrijk onderscheid:
- Knop MET TEKST: de tekst valt onder SC 1.4.3
  (tekstcontrast). De knop zelf heeft dan géén
  extra contrasteis onder 1.4.11.
- Knop MET ICOON (bijv. vergrootglas als submit):
  het icoon valt onder SC 1.4.11 (3:1 contrast).
```

### 2. KNOPPEN

```
Controleer:
- Heeft de knop een visueel herkenbare grens?
  (rand of achtergrondkleur)
- Heeft die grens 3:1 contrast met de omgeving?

Veelvoorkomende failure:
Lichtblauwe knop (#a8d4f0) op witte achtergrond (#fff)
Contrast: 1,8:1 → FAIL

Correcte implementatie:
Donkerblauwe knop (#0066cc) op witte achtergrond (#fff)
Contrast: 5,9:1 → PASS

Opmerking: als een knop wordt geïdentificeerd door
tekst alleen (bijv. onderstreepte link-achtige knop),
valt de tekst onder SC 1.4.3, niet 1.4.11.
```

### 3. FOCUS-INDICATOREN

```
We beoordelen het contrast van de focus-indicator
alleen als deze is AANGEPAST met CSS. De standaard
browser-focusindicator laten we buiten beschouwing.

Controleer:
- Is de standaard focusindicator aangepast?
- Heeft de aangepaste focusindicator ≥3:1 contrast
  met de aangrenzende kleur?

Van toepassing op:
- Links
- Knoppen
- Invoervelden
- Andere interactieve elementen (tabs, accordions)

Bij links is bijvoorbeeld de kleur van de
onderstreping of achtergrondkleur bij focus
belangrijk. Als de focus-onderstreping niet te zien
is door te laag contrast, lijkt de link gewone tekst.

Toetsmethode (aangepaste focusindicator):
1. Open Chrome DevTools → Inspector
2. Selecteer een interactief element (bijv. link)
3. Klik bij 'Styles' op ':hov'
4. Vink ':focus' aan, controleer ook ':focus-visible'
5. Zoek in Styles op 'focus' → alle CSS voor focus
6. Als de 'user agent stylesheet' regels zijn
   doorgehaald → de focusindicator is aangepast
7. Noteer de kleurcode van de aangepaste indicator
8. Meet het contrast met CCA

Veelvoorkomende failure:
De standaard focus-indicator wordt aangepast via CSS,
maar het contrastverschil is daarna onvoldoende.

Opmerking: SC 2.4.11 en 2.4.12 (WCAG 2.2) stellen
strengere eisen aan de focusindicator. SC 1.4.11
is de basislijn.
```

### 4. TOESTANDEN (STATES)

```
Controleer per toestand:
- Checkbox aangevinkt vs. niet-aangevinkt:
  is het verschil 3:1?
- Radiobutton geselecteerd vs. niet-geselecteerd:
  is de vulling 3:1?
- Toggle aan vs. uit: is het verschil 3:1?
- Tab actief vs. inactief: is het verschil 3:1?

Veelvoorkomende failure:
Checkbox: vinkje in lichtgrijs (#999) op witte
achtergrond (#fff) → contrast 2,8:1 → FAIL

Correcte implementatie:
Checkbox: vinkje in donkerblauw (#0066cc) op witte
achtergrond (#fff) → contrast 5,9:1 → PASS

Opmerking: als de toestanden variëren per kleur,
moeten de kleuren onderling óók 3:1 verschil
hebben, OF er moet een ander visueel verschil zijn
(bijv. icoon, vorm, positie).
```

### 5. ICONEN

```
Controleer:
- Heeft het icoon 3:1 contrast met de achtergrond?
- Draagt het icoon informatie over?
  (decoratieve iconen zijn uitgezonderd)

Veelvoorkomende failure:
Lichtgrijs icoon (#bbb) op witte achtergrond (#fff)
Contrast: 1,5:1 → FAIL

Correcte implementatie:
Donkergrijs icoon (#595959) op witte achtergrond (#fff)
Contrast: 7:1 → PASS

Iconen die enkel ter decoratie zijn:
geen contrasteis.
```

### 6. GRAFIEKEN EN DIAGRAMMEN

```
Controleer:
- Hebben de dataelementen (staven, lijnen,
  taartpunten) 3:1 contrast met aangrenzende kleuren?
- Als er meerdere datareeksen zijn: hebben
  aangrenzende reeksen 3:1 contrast onderling?
- Wordt dezelfde informatie ook in tekst gegeven?
  (bijv. datalabels met waarden) → dan minder streng

Veelvoorkomende failure:
Staafdiagram met lichtgekleurde staven die
nauwelijks zichtbaar zijn op lichte achtergrond

Correcte implementatie:
Staven met voldoende contrast, eventueel
aangevuld met datalabels

Infographics falen vaak op meerdere SC's.
Een langere beschrijving (alt of uitgebreide tekst)
kan als alternatief dienen.
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Formulieren

- Invoervelden met lichtgrijze randen op witte achtergrond → meet contrast
- Placeholder-tekst: valt onder SC 1.4.3 (tekstcontrast), niet 1.4.11
- Verplicht-veld-indicator (sterretje): als het een symbool is → meet contrast

### Patroon B: Zoekbalk

- Zoekicoon (vergrootglas): 3:1 contrast nodig
- Zoekveld-rand: 3:1 contrast nodig
- Zoekknop: 3:1 contrast nodig

### Patroon C: Navigatie

- Actieve/geselecteerde menu-item: is de visuele indicator 3:1?
- Hamburger-menu-icoon: 3:1 contrast
- Dropdown-pijltjes: 3:1 contrast

### Patroon D: Kaarten en plattegronden

- Interactieve kaart-elementen (markers, routes): 3:1 contrast
- Let op: realistische kaarten/foto's vallen onder de "essentieel"-uitzondering

### Patroon E: Cookie-banner

- Knoppen ("Accepteren", "Weigeren"): 3:1 contrast voor randen/achtergrond
- Sluiten-kruisje (×): 3:1 contrast als symbool

---

## Relatie met andere SC's

| SC | Relatie met 1.4.11 |
|----|-------------------|
| **1.4.1** | Gebruik van kleur: informatie niet alleen door kleur overbrengen. Als toestanden alleen per kleur variëren, moet er óók een ander verschil zijn. |
| **1.4.3** | Contrast (minimum): 4,5:1 voor tekst. 1.4.11 gaat over niet-tekst (3:1). |
| **2.4.7** | Focus zichtbaar: focus-indicator moet zichtbaar zijn. 1.4.11 voegt contrasteis toe. |
| **2.4.11** | Focus Appearance (AAA): strengere eisen aan focus-indicator. |
| **1.4.11** | **Niet-tekstueel contrast: 3:1 voor UI-componenten en grafische objecten.** |

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: UI-componenten en toestanden**

| Code | Beschrijving |
|------|-------------|
| G195 | Een door de auteur geleverde, goed zichtbare focus-indicator gebruiken |
| G174 | Een schakelaar bieden waarmee de gebruiker kan wisselen naar voldoende contrast |

**Situatie B: Grafische objecten**

| Code | Beschrijving |
|------|-------------|
| G207 | 3:1 contrastverhouding voor iconen waarborgen |
| G209 | Voldoende contrast bij grenzen tussen aangrenzende kleuren bieden |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F78 | Focus-indicator verwijderd of onzichtbaar gemaakt via styling |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-6: invoervelden | knoppen |
                  focus-indicatoren | toestanden |
                  iconen | grafieken]
Element:         [beschrijving van het element]
Toestand:        [default / focus / hover / geselecteerd / fout]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL | N.v.t.]

Kleur element:   [hex-code]
Kleur aangrenzend:[hex-code]
Contrastverhouding:[x:1]
Vereist:         [3:1]

Uitzondering:    [inactief / user agent / essentieel /
                  decoratief / logo / geen]
Probleem:        [specifieke beschrijving]
Technique:       [G195 / G207 / G209 / F78]
Aanbeveling:     [concrete oplossing met kleurvoorstel]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Lichtgrijze invoerveldranden** — #ccc of lichter op witte achtergrond → onvoldoende contrast
2. **Lichtgekleurde focus-indicatoren** — te dun of te licht om zichtbaar te zijn
3. **Iconen met onvoldoende contrast** — social media iconen, navigatiepijlen, zoekvergrootglas in lichtgrijs
4. **Custom checkboxen/radiobuttons** — lichtgekleurde vinkjes of stippencirkels
5. **Actieve tab niet duidelijk te onderscheiden** — verschil alleen in kleurschakering met te weinig contrast
6. **Grafieken met lichte kleuren** — staven of lijnen die nauwelijks zichtbaar zijn

### Snelle audit-methode

1. Gebruik de **Colour Contrast Analyser** (desktop tool) met de pipet om kleuren te meten
2. Controleer **invoervelden**: meet rand tegen achtergrond
3. Controleer **knoppen**: meet rand/achtergrond tegen pagina-achtergrond
4. Tab door de pagina: is de **focus-indicator** duidelijk zichtbaar? Meet het contrast
5. Controleer **iconen**: meet icoonkleur tegen achtergrond
6. Als er grafieken zijn: meet de **dataelementen** tegen hun achtergrond

### Hulpmiddelen

- **Colour Contrast Analyser (CCA):** desktop tool met pipet, meet elke kleur op het scherm
- **Browser DevTools:** inspect element → computed styles → kleurwaarden opzoeken
- **WCAG Contrast Checker (online):** voer twee hex-codes in, krijg de verhouding
- Let op: voor niet-tekst geldt **3:1**, niet 4,5:1
- **Contrastmetingen altijd in Chrome** (in verband met mogelijke browserverschillen)

### Meetrichtlijnen

- **Noteer contrastwaarden altijd met 1 decimaal**, ook bij ronde getallen: schrijf 3,0:1, niet 3:1
- Bij Engelstalige rapporten: 3.0:1 (punt i.p.v. komma)
- Als het contrast heel minimaal is: noteer als "minder dan 1,1:1" (1,0:1 = helemaal geen contrast)
- Als je met CCA niet de juiste pixel kunt pakken, gebruik dan de browserinspector om de kleurcode te achterhalen

### Thematische verdeling bij audits

SC 1.4.11 is breed en wordt in de praktijk vaak opgesplitst in thema's:
- **Thema C:** Niet-tekstuele links, knoppen en grafische objecten (iconen, grafieken)
- **Thema E:** Invoervelden (tekstvelden, combobox, radio-buttons, checkboxen)
- **Thema F:** Focus-indicator (alleen aangepaste focus via CSS)

### Automatische tools zijn beperkt

SC 1.4.11 kan **niet volledig geautomatiseerd** worden getest. Automatische tools kunnen:
- Wel: kleurwaarden uit CSS halen
- Niet: beoordelen of een element "visuele informatie die nodig is om te identificeren" is
- Niet: meerdere toestanden testen (focus, hover, geselecteerd)
- Niet: grafische objecten beoordelen op betekenis vs. decoratief

**Handmatige beoordeling is essentieel.**

### Technisch of redactioneel issue?

SC 1.4.11 is een **technisch en design issue**:
- Kleuren worden bepaald in CSS en design-systemen
- Bij Shift2: valt onder de **technische audit** (Cardan/template/design)

### Wie heeft er baat bij?

- **Mensen met matig slechtziendheid** — kunnen UI-elementen en grafische objecten beter waarnemen
- **Mensen met kleurenblindheid** — contrast helpt bij het onderscheiden van elementen, ook als kleuren moeilijk te onderscheiden zijn
- **Alle gebruikers** — beter contrast maakt interfaces duidelijker voor iedereen

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.4.11 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 1.4.11:** https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **Technique G195 (focus-indicator):** https://www.w3.org/WAI/WCAG22/Techniques/general/G195
- **Technique G207 (icooncontrast):** https://www.w3.org/WAI/WCAG22/Techniques/general/G207
- **Technique G209 (aangrenzende kleuren):** https://www.w3.org/WAI/WCAG22/Techniques/general/G209
- **Eric Eggert — Non-text Contrast in Detail:** https://yatil.net/blog/non-text-contrast-in-detail-ui-components
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
