---
name: wcag-1-3-1-info-and-relationships
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.3.1 (Info and Relationships) on Dutch government websites. Use when conducting accessibility audits on page structure, semantic HTML, headings, lists, tables, forms, landmarks, emphasis, paragraphs, citations, and visual grouping. Trigger this skill when analyzing screenshots and HTML code for structural issues — checking if visual structure (headings, lists, tables, form labels, groupings) is also programmatically conveyed in the HTML. This is the broadest and most commonly failing WCAG criterion. Essential for gemeente website audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.3.1 Info en Relaties — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.3.1 (Niveau A):**
Informatie, structuur en relaties overgebracht door presentatie kunnen door software worden bepaald of zijn beschikbaar in tekst.

**Kernprincipe:** Alles wat visueel structuur of betekenis overbrengt, moet ook programmatisch (in de HTML-code) beschikbaar zijn. Een screenreader-gebruiker moet dezelfde structurele informatie krijgen als een ziende gebruiker.

**Dit is het breedste WCAG-criterium** en de meest voorkomende bron van toegankelijkheidsissues.

## Scope: de 13 auditgebieden

SC 1.3.1 bestrijkt de volgende structurele aspecten:

1. Koppen (headings)
2. Koppenhiërarchie
3. Lege koppen en alinea's
4. Koppen gevolgd door inhoud
5. Lijsten
6. Geneste lijsten
7. Tabellen
8. Formulieren
9. Landmarks
10. Nadruk (vet/cursief)
11. Alinea's en regelafbrekingen
12. Citaten
13. Visuele relaties en groepering

---

## Screenshot + HTML analyse workflow

Wanneer een screenshot en/of HTML-code wordt aangeleverd, volg dit proces:

### Stap 1: Inventariseer visuele structuur (screenshot)

Scan het screenshot op:
- **Koppen:** grotere, vetgedrukte of afwijkende tekst die visueel als kop fungeert
- **Lijsten:** opsommingen met bullets, nummers, streepjes
- **Tabellen:** gegevens in rij/kolom-structuur
- **Formulieren:** invoervelden met labels, groepen velden
- **Paginadelen:** header, navigatie, hoofdcontent, sidebar, footer
- **Nadruk:** vetgedrukte of cursieve tekst
- **Citaten:** vrijstaande aangehaalde tekst
- **Groepering:** elementen die visueel bij elkaar horen (afbeelding+bijschrift, icoon+tekst)

### Stap 2: Vergelijk met HTML-code

Voor elk visueel element, controleer of de HTML-code de juiste semantiek bevat.

### Stap 3: Rapporteer per auditgebied

### Stap 4: Raadpleeg grensgevallen

Raadpleeg `Richtlijnen_Grensgevallen_SC_1_3_1.md` voor bekende grensgevallen voordat je bevindingen schrijft.

---

## De 13 auditgebieden in detail

### 1. KOPPEN

**Regel:** Tekst die visueel als kop is opgemaakt moet een heading-element (`h1`–`h6`) zijn. Omgekeerd: een heading-element mag niet worden gebruikt voor tekst die geen kop is.

**In de screenshot:** zoek naar grotere, vetgedrukte of afwijkende tekst die secties inleidt.

**In de HTML:** controleer of deze tekst in `<h1>` t/m `<h6>` staat.

```html
<!-- FAIL: visueel een kop maar geen heading-element -->
<p class="large-bold">Hoe werkt het</p>
<div style="font-size:24px; font-weight:bold">Kosten</div>

<!-- PASS: heading-element -->
<h2>Hoe werkt het</h2>
<h2>Kosten</h2>

<!-- FAIL: heading gebruikt voor niet-kop (styling misbruik) -->
<h3>Let op: breng uw paspoort mee.</h3>  <!-- geen kop maar waarschuwing -->
```

**Veelvoorkomend op gemeente-websites:**
- CMS-gegenereerde koppen die `<div>` of `<p>` met CSS-class gebruiken
- Koppen in sidebars die `<strong>` gebruiken i.p.v. heading-elementen

### 2. KOPPENHIËRARCHIE

**Regel:** Koppen moeten in logische volgorde staan. Begin met `<h1>` voor de hoofdtitel. Sla geen niveaus over.

**Controleer:** `h1` → `h2` → `h3` → etc. Geen `h4` na `h2` zonder `h3` ertussen.

```html
<!-- FAIL: niveau overgeslagen -->
<h1>Geboorteaangifte doen</h1>
<h2>Hoe werkt het</h2>
<h4>Wie doet aangifte?</h4>  <!-- h3 overgeslagen -->

<!-- PASS: logische hiërarchie -->
<h1>Geboorteaangifte doen</h1>
<h2>Hoe werkt het</h2>
<h3>Wie doet aangifte?</h3>
```

**Snelle check:** maak een outline van alle headings in de HTML en controleer de volgorde.

### 3. LEGE KOPPEN EN ALINEA'S

**Regel:** Koppen en alinea's zonder inhoud zijn niet toegestaan. Screenreaders melden lege elementen terwijl er niets te vinden is.

```html
<!-- FAIL: lege kop -->
<h2></h2>
<h3> </h3>

<!-- FAIL: lege alinea (vaak voor witruimte) -->
<p></p>
<p>&nbsp;</p>
<p><br></p>
```

**Veelvoorkomend op gemeente-websites:** CMS-editors die lege alinea's invoegen voor witruimte.

### 4. KOPPEN GEVOLGD DOOR INHOUD

**Regel:** Een kop moet worden gevolgd door inhoud (tekst, afbeeldingen, lijsten). Een kop zonder inhoud eronder heeft geen functie.

```html
<!-- FAIL: kop zonder inhoud -->
<h2>Downloads</h2>
<h2>Contact</h2>  <!-- "Downloads" heeft geen inhoud -->

<!-- PASS: kop met inhoud -->
<h2>Downloads</h2>
<ul><li><a href="...">Formulier (PDF)</a></li></ul>
<h2>Contact</h2>
```

### 5. LIJSTEN

**Regel:** Visuele opsommingen moeten als `<ul>` of `<ol>` zijn gemarkeerd. Geen lijsten opgebouwd met `<br>`, streepjes of losse `<div>`s.

```html
<!-- FAIL: nep-lijst -->
<p>- Paspoort<br>- Rijbewijs<br>- Identiteitskaart</p>

<!-- FAIL: divs als lijst -->
<div>• Item 1</div>
<div>• Item 2</div>

<!-- PASS: semantische lijst -->
<ul>
  <li>Paspoort</li>
  <li>Rijbewijs</li>
  <li>Identiteitskaart</li>
</ul>
```

### 6. GENESTE LIJSTEN

**Regel:** Geneste lijsten moeten correct zijn opgebouwd: een `<ul>` of `<ol>` binnen een `<li>` van de bovenliggende lijst.

```html
<!-- FAIL: geneste lijst buiten <li> -->
<ul>
  <li>Hoofditem</li>
  <ul>
    <li>Subitem</li>
  </ul>
</ul>

<!-- PASS: correct genest -->
<ul>
  <li>Hoofditem
    <ul>
      <li>Subitem</li>
    </ul>
  </li>
</ul>
```

### 7. TABELLEN

**Regel:** Tabeldata moet in een `<table>` staan met `<th>` voor koppen en `<td>` voor data. Gebruik `scope="col"` of `scope="row"` op `<th>`. Tabellen mogen niet voor layout worden gebruikt.

```html
<!-- FAIL: tabel zonder headers -->
<table>
  <tr><td>Maandag</td><td>Donderdag</td></tr>
</table>

<!-- FAIL: th zonder scope -->
<table>
  <tr><th>Geboorte op:</th><th>Aangifte op:</th></tr>
</table>

<!-- PASS: correcte tabel -->
<table>
  <thead>
    <tr>
      <th scope="col">Geboorte op:</th>
      <th scope="col">Aangifte op:</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Maandag</td><td>Donderdag</td></tr>
  </tbody>
</table>

<!-- FAIL: layout-tabel -->
<table>
  <tr>
    <td><img src="logo.png"></td>
    <td>Gemeente IJsselstein</td>
  </tr>
</table>
```

**Complexe tabellen:** bij tabellen met meerdere niveaus headers, gebruik `headers` en `id` attributen.

### 8. FORMULIEREN

**Regel:** Invoervelden moeten een gekoppeld `<label>` hebben (via `for`/`id`). Gerelateerde velden moeten gegroepeerd zijn met `<fieldset>` en `<legend>`. Instructies en foutmeldingen moeten programmatisch gekoppeld zijn.

```html
<!-- FAIL: label niet gekoppeld -->
<label>Naam</label>
<input type="text">

<!-- FAIL: placeholder als enig label -->
<input type="text" placeholder="Uw naam">

<!-- PASS: label gekoppeld via for/id -->
<label for="naam">Naam</label>
<input type="text" id="naam" name="naam">

<!-- PASS: groepering met fieldset -->
<fieldset>
  <legend>Uw gegevens</legend>
  <label for="voornaam">Voornaam</label>
  <input type="text" id="voornaam">
  <label for="achternaam">Achternaam</label>
  <input type="text" id="achternaam">
</fieldset>

<!-- PASS: foutmelding gekoppeld -->
<label for="email">E-mail</label>
<input type="email" id="email" aria-describedby="email-fout">
<span id="email-fout" class="error">Voer een geldig e-mailadres in.</span>
```

**Controleer ook:**
- `aria-required="true"` of `required` bij verplichte velden
- `aria-describedby` voor instructies en foutmeldingen
- Radio buttons en checkboxes in `<fieldset>` met `<legend>`

### 9. LANDMARKS

**Regel:** Visueel herkenbare paginadelen moeten als zodanig gemarkeerd zijn.

```html
<!-- Vereiste landmarks -->
<header>     <!-- of role="banner" -->
<nav>        <!-- of role="navigation" -->
<main>       <!-- of role="main" -->
<footer>     <!-- of role="contentinfo" -->
<aside>      <!-- of role="complementary" -->

<!-- Meerdere nav's: gebruik aria-label -->
<nav aria-label="Hoofdmenu">...</nav>
<nav aria-label="Kruimelpad">...</nav>
<nav aria-label="Footermenu">...</nav>
```

**Controleer:**
- Is er een `<main>` of `role="main"`?
- Is er een `<header>` of `role="banner"`?
- Is er een `<nav>` voor elk navigatieblok?
- Is er een `<footer>` of `role="contentinfo"`?
- Hebben meerdere landmarks van hetzelfde type een uniek `aria-label`?

### 10. NADRUK (VET/CURSIEF)

**Regel:** `<strong>` alleen voor inhoudelijk belangrijke tekst. `<em>` alleen voor inhoudelijke nadruk. Niet voor puur visuele opmaak — gebruik daarvoor CSS.

```html
<!-- FAIL: strong voor visuele styling -->
<p><strong>Openingstijden</strong></p>  <!-- dit is eigenlijk een kop -->

<!-- PASS: strong voor nadruk -->
<p>U moet <strong>binnen 3 dagen</strong> aangifte doen.</p>

<!-- FAIL: em/strong voor hele alinea's -->
<p><strong>Neem uw paspoort mee. U kunt ook een rijbewijs gebruiken.</strong></p>

<!-- PASS: CSS voor visuele styling -->
<p class="bold-text">Openingstijden</p>
```

**Controleer ook op onnodig gebruik van `<strong>` binnen andere semantische elementen:**

```html
<!-- AANDACHTSPUNT: strong binnen heading — voegt geen semantische waarde toe -->
<h2><strong>Gemeente IJsselstein</strong></h2>
<!-- Beter: -->
<h2>Gemeente IJsselstein</h2>  <!-- vetgedrukt via CSS -->

<!-- AANDACHTSPUNT: strong binnen link/button — voegt geen semantische waarde toe -->
<a class="call-to-action" href="/contact"><strong>Contact en openingstijden</strong></a>
<a class="call-to-action2" href="/nieuwsbrief"><strong>Meld u aan voor de nieuwsbrief</strong></a>
<!-- Beter: -->
<a class="call-to-action" href="/contact">Contact en openingstijden</a>  <!-- vetgedrukt via CSS -->
```

**Veelvoorkomend op gemeente-websites (SIMsite/Drupal):**
- Footerkoppen met `<h2><strong>...</strong></h2>` — het heading-element is al semantisch, `<strong>` is overbodig
- Call-to-action-links met `<a><strong>...</strong></a>` — de linktekst hoeft geen extra nadruk; visuele vetgedrukte styling hoort in CSS
- Screenreaders kunnen in sommige gevallen de nadruk dubbel aankondigen, wat verwarrend is voor gebruikers

### 11. ALINEA'S EN REGELAFBREKINGEN

**Regel:** Alinea's moeten met `<p>` worden gemarkeerd. `<br>` mag niet worden gebruikt om witregels/alinea's te simuleren. `<br>` is acceptabel binnen adressen of gedichten.

```html
<!-- FAIL: br voor alinea's -->
<p>Eerste alinea.<br><br>Tweede alinea.</p>

<!-- PASS: aparte p-elementen -->
<p>Eerste alinea.</p>
<p>Tweede alinea.</p>

<!-- PASS: br in adres -->
<p>Overtoom 1<br>3401 BK IJsselstein</p>
```

### 12. CITATEN

**Regel:** Vrijstaande citaten moeten in een `<blockquote>` staan. Inline citaten worden met aanhalingstekens weergegeven.

```html
<!-- FAIL: citaat zonder blockquote -->
<p class="quote-style">"De gemeente staat voor u klaar."</p>

<!-- PASS: blockquote -->
<blockquote>
  <p>"De gemeente staat voor u klaar."</p>
</blockquote>
```

### 13. VISUELE RELATIES EN GROEPERING

**Regel:** Elementen die visueel bij elkaar horen moeten ook programmatisch gekoppeld zijn.

```html
<!-- FAIL: afbeelding met bijschrift niet gekoppeld -->
<img src="foto.jpg" alt="Gemeentehuis">
<p class="caption">Het nieuwe gemeentehuis</p>

<!-- PASS: figure/figcaption -->
<figure>
  <img src="foto.jpg" alt="Gemeentehuis">
  <figcaption>Het nieuwe gemeentehuis</figcaption>
</figure>

<!-- FAIL: icoon en tekst niet gekoppeld -->
<span class="icon-phone"></span>
<span>14 030</span>

<!-- PASS: icoon decoratief, tekst als link -->
<a href="tel:14030">
  <span class="icon-phone" aria-hidden="true"></span>
  14 030
</a>
```

---

## Officiële W3C Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F2 | Presentatie-wijzigingen gebruiken om info over te brengen zonder markup |
| F33 | Witruimte gebruiken om kolommen te maken in platte tekst |
| F43 | Structurele markup gebruiken die relaties in content niet weergeeft |
| F46 | `<th>` gebruiken in layout-tabellen |
| F48 | `<pre>` gebruiken voor tabeldata |
| F87 | `::before`/`::after` met `content` gebruiken voor niet-decoratieve content |
| F90 | `headers`/`id` incorrect koppelen in tabellen |
| F91 | Tabelheaders niet correct markeren |
| F92 | `role="presentation"` gebruiken op content met semantische betekenis |

## Sufficient Techniques (belangrijkste)

| Code | Beschrijving |
|------|-------------|
| H42 | Heading-elementen gebruiken voor koppen |
| H48 | `<ol>` en `<ul>` gebruiken voor lijsten |
| H51 | Tabelmarkup gebruiken voor tabeldata |
| H44 | Labels koppelen aan formuliervelden |
| H71 | `<fieldset>` en `<legend>` voor groepen velden |
| H101 | Semantische HTML-elementen voor paginaregio's |
| ARIA11 | ARIA landmarks voor paginaregio's |
| G115 | Semantische elementen voor structuur |
| G140 | Informatie en structuur scheiden van presentatie |

---

## Rapportageformat

Voor elke bevinding:

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-13: koppen | hiërarchie | lege elementen | etc.]
Element:         [beschrijving van het element]
Locatie:         [CSS-selector / HTML-regel]
Beoordeling:     [PASS | FAIL]
HTML-code:       [relevante code snippet]

Probleem:        [alleen bij FAIL]
Technique:       [W3C failure/sufficient technique code]
Aanbeveling:     [concrete oplossing met code-voorbeeld]
```

---

## Veelvoorkomende patronen op gemeente-websites (SIMsite/Drupal)

| Patroon | Waar | Veelgemaakte fout | Oplossing |
|---------|------|-------------------|-----------|
| CMS-koppen | Content | `<div class="title">` i.p.v. heading | Gebruik `<h2>`–`<h6>` |
| Lege alinea's | Content | `<p>&nbsp;</p>` voor witruimte | Verwijder, gebruik CSS margin |
| Nep-lijsten | Content | Items met `<br>` gescheiden | Gebruik `<ul>` of `<ol>` |
| Tabellen | Content | Ontbrekende `<th>` of `scope` | Voeg `<th scope="col/row">` toe |
| Formulieren | Aanvraag | Label niet gekoppeld | `<label for="">` + `id` |
| Navigatie | Header | Meerdere `<nav>` zonder label | Voeg `aria-label` toe |
| Footer-koppen | Footer | `<strong>` i.p.v. heading | Gebruik `<h2>` in footer |
| Footer-koppen | Footer | `<h2><strong>...</strong></h2>` | Verwijder `<strong>`, gebruik CSS |
| CTA-links | Footer | `<a><strong>...</strong></a>` | Verwijder `<strong>`, gebruik CSS |
| Iconen | Overal | Icoon zonder `aria-hidden` | `aria-hidden="true"` + tekstlabel |
| Adres | Footer | Correct gebruik van `<br>` | `<br>` is hier toegestaan |
| Inline nadruk | Content | `<strong>` voor hele alinea | Beperk tot key woorden |

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.3.1 is Niveau A:**
- Vereist voor compliance
- Meest voorkomende bron van accessibility-issues
- Vaak gerelateerd aan CMS-configuratie en redactionele keuzes
- Oplossingen variëren van eenvoudig (koppen toevoegen) tot complex (formulierstructuur)

## Bronnen

- **WCAG 2.2 Understanding 1.3.1:** https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html
- **Technique H42 (Headings):** https://www.w3.org/WAI/WCAG22/Techniques/html/H42
- **Technique H48 (Lists):** https://www.w3.org/WAI/WCAG22/Techniques/html/H48
- **Technique H51 (Tables):** https://www.w3.org/WAI/WCAG22/Techniques/html/H51
- **Technique H44 (Labels):** https://www.w3.org/WAI/WCAG22/Techniques/html/H44
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
