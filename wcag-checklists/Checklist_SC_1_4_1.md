---
name: wcag-1-4-1-use-of-color
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.4.1 (Use of Color) on Dutch government websites. Use when conducting accessibility audits to verify that color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element. Covers links without underline, form error indicators, required field markers, status indicators, charts/graphs, and calendar color-coding. Includes the special link rule (F73/G183 with 3:1 contrast), the visited link exception, and the distinction with SC 1.3.3 (sensory characteristics). Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.4.1 Gebruik van kleur — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.4.1 (Niveau A):**
Kleur wordt niet als het enige visuele middel gebruikt om informatie over te brengen, een actie aan te geven, tot een reactie op te roepen, of een visueel element te onderscheiden.

**Kernprincipe:** Alle informatie die door kleur wordt overgebracht, moet ook op een andere visuele manier beschikbaar zijn — via tekst, iconen, patronen, onderstreping, vet, vorm, of andere niet-kleur visuele aanwijzingen.

**Belangrijk:** Dit criterium ontmoedigt het gebruik van kleur NIET. Kleur is een waardevol middel voor ontwerp, bruikbaarheid en toegankelijkheid. Het vereist alleen dat kleur niet het ENIGE middel is.

**Noot:** Dit succescriterium behandelt specifiek kleurperceptie. Andere vormen van perceptie worden behandeld in Richtlijn 1.3, waaronder programmatische toegang tot kleur en andere visuele presentatiecodering.

---

## Vier functies van kleur (scope)

SC 1.4.1 is van toepassing wanneer kleur wordt gebruikt voor één of meer van deze vier functies:

| Functie | Voorbeeld van fout |
|---------|-------------------|
| **Informatie overbrengen** | "Verplichte velden zijn rood" (alleen kleur) |
| **Een actie aangeven** | Een link die alleen door kleur van omringende tekst verschilt |
| **Tot een reactie oproepen** | Foutmelding alleen door rode rand om invoerveld |
| **Een visueel element onderscheiden** | Grafieklijnen die alleen door kleur van elkaar verschillen |

---

## Beslisboom

```
Visueel element gevonden dat kleur gebruikt
│
├─ Wordt kleur gebruikt om informatie/actie/onderscheid over te brengen?
│  ├─ NEE → SC 1.4.1 is niet van toepassing
│  └─ JA ↓
│
├─ Is kleur het ENIGE visuele middel?
│  ├─ NEE (er is tekst, icoon, patroon, onderstreping, vet, vorm, etc.)
│  │  → PASS
│  └─ JA (alleen kleur) ↓
│
├─ Is het een LINK in lopende tekst?
│  ├─ JA → Speciale linkregel (zie sectie hieronder)
│  └─ NEE → FAIL
│
Speciale linkregel:
├─ Heeft de link 3:1 contrastverhouding met omringende tekst?
│  ├─ NEE → FAIL (F73)
│  └─ JA ↓
│
├─ Krijgt de link een extra visuele aanwijzing bij hover EN focus?
│  (onderstreping, vet, cursief, etc.)
│  ├─ NEE → FAIL (G183 niet volledig toegepast)
│  └─ JA → PASS (maar onderstreping blijft de voorkeur)
```

---

## Stapsgewijze auditprocedure

### Stap 1: Bekijk de pagina in grijswaarden
Schakel de pagina om naar grijswaarden (via browser DevTools, OS-instellingen, of een kleurenblindheid-simulator). Controleer: is alle informatie nog begrijpelijk?

### Stap 2: Zoek elementen waar kleur informatie draagt
Scan de pagina op:
- Links in lopende tekst (alleen kleur, geen onderstreping?)
- Formuliervelden met foutindicatie (alleen rode rand?)
- Verplichte velden (alleen met kleur gemarkeerd?)
- Status-indicatoren (groen = actief, rood = inactief?)
- Grafieken, diagrammen, kalenders met kleurcodering
- Instructies die naar kleur verwijzen ("klik op de groene knop")

### Stap 3: Controleer per element of er een aanvullend visueel middel is
Voor elk element waar kleur informatie draagt:
- Is er een tekstueel alternatief? (label, beschrijving)
- Is er een icoon of symbool? (vinkje, kruisje, uitroepteken)
- Is er een patroon of textuur? (bij grafieken)
- Is er een vormverschil? (onderstreping, vet, rand)

### Stap 4: Test links specifiek
Voor links in lopende tekst zonder onderstreping:
- Meet de contrastverhouding tussen linktekst en omringende tekst (niet achtergrond)
- Controleer of er een visuele aanwijzing verschijnt bij hover en focus

### Stap 5: Controleer afbeeldingen met kleurinformatie
Voor afbeeldingen (grafieken, diagrammen, kaarten):
- Bevat het alt-tekst de informatie die door kleur wordt overgebracht?
- Is er een tekstuele legenda of tabel als alternatief?

---

## De 8 auditgebieden

### 1. LINKS IN LOPENDE TEKST

Dit is het meest voorkomende issue op gemeente-websites. Links die alleen door kleur van omringende tekst worden onderscheiden, zonder onderstreping of ander visueel verschil.

**Standaardregel:** Links moeten visueel herkenbaar zijn zonder kleurzicht.

**Optie A: Onderstreping (aanbevolen)**
```html
<!-- PASS: link met onderstreping -->
<p>Meer informatie vindt u op de pagina
   <a href="/contact" style="text-decoration: underline;">
     Contact</a>.</p>
```

**Optie B: 3:1 contrast + hover/focus indicatie (G183)**
Als onderstreping niet wordt gebruikt, moet:
1. De link minimaal 3:1 contrastverhouding hebben met de omringende tekst (niet de achtergrond)
2. Er moet een extra visuele aanwijzing verschijnen bij hover EN focus (bijv. onderstreping, vet, cursief)

```html
<!-- PASS via G183: 3:1 contrast + underline on hover/focus -->
<style>
  a { color: #3366CC; text-decoration: none; }
  /* Zwarte tekst (#000000) vs blauw (#3366CC) = 3.9:1 contrast */
  a:hover, a:focus { text-decoration: underline; }
</style>
<p>Meer informatie vindt u op de pagina
   <a href="/contact">Contact</a>.</p>
```

**Let op:** G183 is een "sufficient technique" maar NIET de voorkeurstechniek. Onderstreping blijft de beste keuze, vooral:
- Voor gebruikers met volledige kleurenblindheid (zwart-wit zicht)
- Op touchscreens waar hover niet beschikbaar is

```html
<!-- FAIL (F73): link alleen herkenbaar door kleur -->
<style>
  a { color: blue; text-decoration: none; }
</style>
<p>Meer informatie vindt u op de pagina
   <a href="/contact">Contact</a>.</p>
<!-- Geen onderstreping, geen 3:1 contrast met tekst,
     geen hover/focus indicatie -->

<!-- FAIL: visuele aanwijzing alleen bij hover -->
<style>
  a { color: blue; text-decoration: none; }
  a:hover { text-decoration: underline; }
  /* a:focus heeft GEEN visuele aanwijzing! */
</style>
<!-- Hover alleen is niet voldoende (ook focus nodig) -->
```

**Uitzondering: Visited links**
Het onderscheid tussen bezochte en niet-bezochte links op basis van alleen kleur is GEEN failure van SC 1.4.1. Browsers beperken om privacyredenen welke stijlen auteurs kunnen toepassen op visited links. Omdat dit buiten de controle van de auteur valt, wordt het niet als een failure beschouwd.

**Tabfocus mag ook niet alleen met kleur:**
Als de focus op een link of ander interactief element komt en de kleur is het enige dat wijzigt, dan is dit niet voldoende. Naast kleur moet er een andere visuele aanwijzing zijn waardoor duidelijk wordt dat de focus op het element staat (bijv. outline, onderstreping, vetgedrukt).

```html
<!-- FAIL: focus alleen via kleurverandering -->
<style>
  a:focus { color: red; outline: none; }
</style>

<!-- PASS: focus via kleur + outline -->
<style>
  a:focus { color: red; outline: 2px solid red; }
</style>
```

**Noot over rood/roze en helderheid:**
Rood en roze zijn dezelfde kleur (tint/hue) maar verschillen in helderheid (lightness). Helderheid is geen kleur. Dus rood en roze zouden voldoen aan "niet alleen onderscheiden door kleur" — mits het verschil in helderheid (contrast) 3:1 of meer is.

### 2. FORMULIER-FOUTINDICATIE

**Fout:** Foutieve invoervelden alleen markeren met een rode rand of rode achtergrond.

**Belangrijk:** Zelfs als er tekst naast kleur wordt gebruikt, moet de foutmelding duidelijk aangeven dat er een fout is gemaakt. "Vul een geldige plaats in" is geen goede foutmelding, omdat het niet duidelijk is dat er een fout is gemaakt. "U heeft geen geldige plaats ingevuld" is wél een foutmelding. Als de foutmelding niet duidelijk is, is de informatie namelijk nog steeds alleen van kleur afhankelijk.

```html
<!-- FAIL (F81): fout alleen via kleur -->
<label for="email">E-mailadres:</label>
<input type="email" id="email" style="border: 2px solid red;">
<!-- Alleen rode rand, geen tekst, geen icoon -->

<!-- PASS: kleur + tekst + icoon -->
<label for="email">E-mailadres:</label>
<input type="email" id="email"
       aria-describedby="email-error"
       style="border: 2px solid red;">
<span id="email-error" style="color: red;">
  ⚠ Vul een geldig e-mailadres in.
</span>
<!-- Rode rand + foutmeldingtekst + waarschuwingsicoon -->
```

### 3. VERPLICHTE VELDEN

**Fout:** Verplichte velden alleen aanduiden met kleur (bijv. rood label).

```html
<!-- FAIL (F81): alleen kleur voor verplicht -->
<p style="color: red;">Verplichte velden zijn rood.</p>
<label for="naam" style="color: red;">Naam:</label>
<input type="text" id="naam">

<!-- PASS: kleur + tekst + symbool -->
<p>Verplichte velden zijn gemarkeerd met een
   <span style="color: red;">* (asterisk)</span>.</p>
<label for="naam">
  Naam <span style="color: red;" aria-hidden="true">*</span>
  <span class="sr-only">(verplicht)</span>
</label>
<input type="text" id="naam" required>
```

### 4. STATUS-INDICATOREN

**Fout:** Status alleen via kleur weergeven (groen = beschikbaar, rood = niet beschikbaar).

```html
<!-- FAIL: status alleen via kleur -->
<span style="color: green;">●</span> Paspoort aanvragen
<span style="color: red;">●</span> Rijbewijs vernieuwen

<!-- PASS: kleur + tekst -->
<span style="color: green;">●</span> Paspoort aanvragen —
  <strong>Beschikbaar</strong>
<span style="color: red;">●</span> Rijbewijs vernieuwen —
  <strong>Tijdelijk niet beschikbaar</strong>

<!-- PASS: kleur + icoon + tekst -->
<span style="color: green;">✓</span> Paspoort aanvragen — Beschikbaar
<span style="color: red;">✗</span> Rijbewijs vernieuwen — Niet beschikbaar
```

### 5. GRAFIEKEN EN DIAGRAMMEN

**Fout:** Grafieklijnen of taartdiagram-segmenten die alleen door kleur van elkaar te onderscheiden zijn.

```
Goede aanvullende visuele middelen bij grafieken:
- Verschillende lijnstijlen (doorgetrokken, gestippeld, streep)
- Verschillende vormen voor datapunten (cirkel, vierkant, driehoek)
- Patronen/texturen in vlakken (gestreept, gestippeld, gekruist)
- Labels direct bij de datareeks (niet alleen in een kleurlegenda)
- Nummering van datareeksen
```

```html
<!-- FAIL: legenda alleen met kleur -->
<p>
  <span style="color: red;">■</span> Inwoners 2023
  <span style="color: blue;">■</span> Inwoners 2024
</p>
<!-- Kleurenblinde gebruikers zien hetzelfde blokje -->

<!-- PASS: kleur + patroon/tekst -->
<p>
  <span style="color: red;">■ (gestreept)</span> Inwoners 2023
  <span style="color: blue;">■ (effen)</span> Inwoners 2024
</p>
```

### 6. KALENDERS EN AGENDA'S

**Fout:** Kalenders die alleen kleur gebruiken om datumtypes aan te geven.

```html
<!-- FAIL: alleen kleurcodering in kalender -->
<!-- Groene dagen = beschikbaar, rode dagen = vol, gele = bijna vol -->

<!-- PASS: kleur + tekst/symbool -->
<!-- Groene dagen met ✓, rode dagen met ✗, gele dagen met "!" -->
<!-- Plus een tekstuele legenda -->
```

### 7. ACTIEVE COMPONENTEN IN EEN REEKS

**Fout:** Actief menu-item, actieve tab, of huidige stap in een proces die alleen door kleur van de overige items te onderscheiden is.

```html
<!-- FAIL: actief menu-item alleen via kleur -->
<nav>
  <a href="/" style="color: blue;">Home</a>
  <a href="/diensten" style="color: red;">Diensten</a>
  <!-- "Diensten" is actief, maar alleen herkenbaar door rode kleur -->
</nav>

<!-- PASS: kleur + vet + onderstreping -->
<nav>
  <a href="/">Home</a>
  <a href="/diensten" aria-current="page"
     style="color: red; font-weight: bold; border-bottom: 2px solid;">
    Diensten
  </a>
</nav>

<!-- FAIL: actieve tab alleen via achtergrondkleur -->
<div role="tablist">
  <button role="tab" style="background: white;">Tab 1</button>
  <button role="tab" aria-selected="true"
          style="background: blue; color: white;">Tab 2</button>
  <!-- Alleen kleurverschil -->
</div>

<!-- PASS: kleur + vet + border -->
<div role="tablist">
  <button role="tab">Tab 1</button>
  <button role="tab" aria-selected="true"
          style="background: blue; color: white;
                 font-weight: bold; border-bottom: 3px solid white;">
    Tab 2
  </button>
</div>
```

### 8. AFBEELDINGEN MET KLEURINFORMATIE (F13)

**Fout:** Een afbeelding die kleurverschillen gebruikt om informatie over te brengen, maar het tekstalternatief bevat deze informatie niet.

```html
<!-- FAIL (F13): alt-tekst mist kleurinformatie -->
<img src="chemisch-diagram.png"
     alt="Chemisch diagram van H2O">
<!-- De afbeelding gebruikt kleuren om elementen aan te duiden,
     maar de alt-tekst vermeldt dit niet -->

<!-- PASS: alt-tekst bevat de informatie uit de kleuren -->
<img src="chemisch-diagram.png"
     alt="Chemisch diagram van H2O: zuurstof (rood)
          in het midden, twee waterstof-atomen (wit)
          aan weerszijden">
<!-- OF beter: een tekstuele tabel als alternatief -->
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Links in content zonder onderstreping

Veel gemeente-websites (inclusief SIMsite-templates) gebruiken links die alleen door kleur van omringende tekst verschillen.

**Audit:** Controleer in de WYSIWYG-content of links onderstreept zijn. Dit is vaak een template-instelling (CSS), niet een redactionele keuze.

### Patroon B: Formulier-validatie

Foutmeldingen bij formulieren die alleen een rode rand tonen.

**Audit:** Vul een formulier fout in en controleer of er naast de kleurverandering ook een tekstuele foutmelding verschijnt.

### Patroon C: Afspraakplanner/kalender

Beschikbaarheidskalenders die kleuren gebruiken voor vrije/bezette tijdslots.

**Audit:** Controleer of er naast kleur ook tekst of symbolen worden gebruikt.

### Patroon D: Nieuwsoverzichten met categorieën

Sommige gemeente-websites gebruiken gekleurde labels voor nieuwscategorieën (bijv. groen = "Duurzaamheid", blauw = "Verkeer").

**Audit:** Controleer of de categorienaam ook als tekst zichtbaar is (niet alleen als kleur).

### Patroon E: Waarschuwingsbanners

Banners die alleen via achtergrondkleur de ernst aangeven (oranje = waarschuwing, rood = noodgeval).

**Audit:** Controleer of er naast de kleur ook een icoon en/of tekst staat die de ernst aangeeft (bijv. "⚠ Waarschuwing" of "🔴 Noodmelding").

### Patroon F: Disabled formulierelementen

Uitgeschakelde formulierelementen die via markup of scripting zijn uitgeschakeld, worden door de user agent grijs weergegeven en inactief gemaakt. De kleurverandering en het verlies van focus bieden samen redundante visuele informatie over de status van het element. Hulptechnologie kan de status programmatisch bepalen. Dit is GEEN failure van SC 1.4.1.

---

## Onderscheid met andere SC's

| SC | Relatie met 1.4.1 |
|----|------------------|
| **1.3.3** | Zintuiglijke eigenschappen: instructies die afhankelijk zijn van vorm, omvang, locatie, oriëntatie, geluid. Kleur valt NIET onder 1.3.3 maar onder 1.4.1. Echter: als een instructie verwijst naar kleur + vorm zonder tekstuele aanvulling, kan het beide SC's schenden. |
| **1.4.1** | **Kleur niet als enige visuele middel** |
| **1.4.3** | Contrast (minimum): contrastverhouding van tekst tegen achtergrond. SC 1.4.1 gaat over kleur als informatie-drager; 1.4.3 over leesbaarheid van tekst. |
| **1.4.11** | Niet-tekstueel contrast: contrastverhouding van UI-componenten en grafische objecten. Gerelateerd maar ander focus. |

**Belangrijk onderscheid 1.4.1 vs. 1.3.3:**
- SC 1.3.3: "Verwijst een *instructie* naar vorm/locatie/geluid zonder aanvulling?"
- SC 1.4.1: "Wordt *kleur* gebruikt als enige visuele middel om informatie over te brengen?"

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: Kleur wordt gebruikt om informatie in tekst over te brengen**

| Code | Beschrijving |
|------|-------------|
| G14 | Informatie die door kleurverschillen wordt overgebracht, ook beschikbaar in tekst |
| G205 | Tekstaanduiding toevoegen voor gekleurde formulierlabels |
| G182 | Aanvullende visuele aanwijzingen wanneer tekst-kleurverschillen worden gebruikt |
| G183 | 3:1 contrastverhouding met omringende tekst + visuele aanwijzing bij hover/focus (voor links) |

**Situatie B: Kleur wordt gebruikt in een afbeelding**

| Code | Beschrijving |
|------|-------------|
| G111 | Kleur en patroon gebruiken |
| G14 | Informatie ook beschikbaar in tekst |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| C15 | CSS gebruiken om presentatie te wijzigen bij focus |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F13 | Tekstalternatief van afbeelding bevat niet de informatie die door kleurverschillen wordt overgebracht |
| F73 | Links die niet visueel herkenbaar zijn zonder kleurzicht |
| F81 | Verplichte of foutvelden alleen identificeren via kleurverschillen |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-8: links | formulier-fout | verplichte velden |
                  status | grafieken | kalenders |
                  actieve componenten | afbeeldingen]
Element:         [beschrijving van het element]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL | N.v.t.]

Kleurgebruik:    [welke kleur wordt gebruikt en waarvoor]
Aanvullend
visueel middel:  [tekst / icoon / patroon / onderstreping / vet / geen]

Link-specifiek
(indien van toepassing):
  Contrast link
  vs. tekst:     [X:1 verhouding]
  Hover-effect:  [ja/nee — beschrijf]
  Focus-effect:  [ja/nee — beschrijf]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [F13 / F73 / F81 / G14 / G182 / G183]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Links zonder onderstreping** — veruit de meest voorkomende fout; links alleen herkenbaar door kleur (F73)
2. **Foutindicatie alleen via rode rand** — geen tekstuele foutmelding bij formulierfouten (F81)
3. **Verplichte velden alleen rood** — "Verplichte velden zijn rood" zonder sterretje of ander symbool (F81)
4. **Status-iconen alleen in kleur** — groen/rood bolletjes zonder tekst
5. **Grafieken zonder patronen** — kleurlegenda zonder patronen of labels bij datareeksen
6. **Kalenders met alleen kleurcodering** — beschikbaarheid alleen via groen/rood
7. **Actieve componenten alleen via kleur** — actief menu-item, tab of processtap alleen door kleur onderscheiden
8. **Tabfocus alleen via kleurverandering** — focus-indicatie zonder outline of ander vormverschil

### Snelle grijswaarden-test

**Chrome DevTools:**
1. Open DevTools (F12)
2. Ctrl+Shift+P → zoek "Emulate achromatopsia"
3. Bekijk de pagina in grijswaarden
4. Controleer: is alle informatie nog begrijpelijk?

**Of gebruik een browser-extensie** zoals "Colorblinding" of "NoCoffee Vision Simulator".

### Wie heeft er baat bij?

- **Kleurenblinden** — ca. 1 op 12 mannen en 1 op 200 vrouwen heeft een vorm van kleurenblindheid
- **Slechtzienden** — beperkt kleurzicht
- **Ouderen** — verminderd kleurzicht
- **Gebruikers van monochrome schermen** — tekst-only of beperkt-kleur displays

**Let op: SC 1.4.1 richt zich op slechtzienden en kleurenblinden, NIET op blinden!** Kleurinformatie moet ook aan blinde gebruikers worden overgebracht, maar dat wordt beoordeeld onder:
- SC 1.1.1 (voor afbeeldingen met kleurinformatie)
- SC 1.3.1 (overige kleurinformatie, programmatisch)
- SC 4.1.2 (statusinformatie door middel van kleur)

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.4.1 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 1.4.1:** https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- **Technique G14 (Kleur + tekst):** https://www.w3.org/WAI/WCAG22/Techniques/general/G14
- **Technique G183 (3:1 contrast + hover):** https://www.w3.org/WAI/WCAG22/Techniques/general/G183
- **Failure F13 (Alt-tekst mist kleurinfo):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F13
- **Failure F73 (Links alleen door kleur):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F73
- **Failure F81 (Verplicht/fout alleen kleur):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F81
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
