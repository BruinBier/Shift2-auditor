---
name: wcag-2-4-4-link-purpose
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.4.4 (Link Purpose - In Context) on Dutch government websites. Use when conducting accessibility audits on links, checking if link text is descriptive or if context makes the link purpose clear. Covers all link types on gemeente websites including text links, image links, icon links, button-styled links, CTA's, breadcrumbs, footer links, social media links, download links, and "Lees meer" patterns. Trigger this skill when analyzing screenshots and HTML code for link quality — examining accessible names, duplicate link texts, empty links, image-only links, and context-dependent links. Essential for gemeente website audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.4.4 Linkdoel (In context) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.4.4 (Niveau A):**
Het doel van elke link kan worden bepaald uit de linktekst alleen, of uit de linktekst samen met de programmatisch bepaalde linkcontext, behalve wanneer het doel van de link voor gebruikers in het algemeen ambigu zou zijn.

**Kernprincipe:** Een gebruiker die op een link landt (via Tab, screenreader-linklijst, of visueel) moet kunnen begrijpen waar de link naartoe leidt, hetzij uit de linktekst zelf, hetzij uit de direct omringende context.

**Programmatisch bepaalde linkcontext omvat:**
- Dezelfde zin als de link
- Dezelfde alinea (`<p>`) als de link
- Hetzelfde lijstitem (`<li>`) als de link
- Dezelfde tabelcel (`<td>`) of tabelheader (`<th>`) als de link
- De voorgaande kop (`<h1>`–`<h6>`)
- ARIA-attributen: `aria-label`, `aria-labelledby`, `aria-describedby`

**Wat NIET als context telt:**
- Tekst in een andere alinea dan de link
- Tekst in een ander lijstitem
- Visuele nabijheid zonder programmatische koppeling
- Tekst die alleen met CSS "in de buurt" staat

---

## Scope: de 8 auditgebieden

1. Duidelijke linktekst
2. Contextueel bepaald linkdoel
3. Identieke linkteksten
4. Linklijst-test
5. Afbeelding als link
6. Icoonlinks of lege links
7. Gebruik van title-attribuut
8. Bestandslinks

---

## Screenshot + HTML analyse workflow

### Stap 1: Inventariseer alle links (screenshot + HTML)

**Visuele scan (screenshot):**
- Onderstreepte/gekleurde tekst (tekstlinks)
- Knoppen met tekst (CTA-links)
- Afbeeldingen die klikbaar lijken
- Iconen (social media, telefoon, zoeken)
- Navigatie-elementen (menu, breadcrumb)
- "Lees meer", "Meer info", "Klik hier" patronen
- Download-links (PDF-iconen, bestandsnamen)

**HTML-scan:**
Zoek naar alle `<a href="...">` elementen en bepaal per link:

```
De ACCESSIBLE NAME van een link wordt als volgt berekend:
1. aria-labelledby (als aanwezig, verwijst naar id van ander element)
2. aria-label (als aanwezig)
3. Inhoud van het <a>-element:
   - Zichtbare tekst
   - alt-tekst van <img> binnen de link
   - Visueel verborgen tekst (bijv. class="visually-hidden")
   - Tekst van geneste elementen
4. title-attribuut (alleen als fallback, onbetrouwbaar)
```

### Stap 2: Classificeer elke link

Voor elke link, bepaal:
- Wat is de accessible name?
- Is het linkdoel duidelijk uit alleen die naam?
- Zo niet: is er programmatisch bepaalde context die het doel verduidelijkt?
- Zijn er dubbele linkteksten met verschillende bestemmingen?

### Stap 3: Beoordeel per auditgebied

### Stap 4: Rapporteer bevindingen

---

## De 8 auditgebieden in detail

### 1. DUIDELIJKE LINKTEKST

**Regel:** De linktekst moet beschrijven waar de link naartoe leidt of wat er gebeurt. Vermijd generieke teksten tenzij context het doel duidelijk maakt.

**Generieke linkteksten die een rode vlag zijn:**
- "Klik hier"
- "Lees meer"
- "Meer informatie"
- "Hier"
- "Link"
- "Meer"
- "Download"
- "Ga naar"
- "Bekijk"

```html
<!-- FAIL: generiek zonder context -->
<p>Voor informatie over geboorteaangifte.</p>
<p><a href="/geboorteaangifte">Lees meer</a></p>
<!-- "Lees meer" staat in aparte <p>, dus geen programmatische context -->

<!-- PASS: generiek MET context in dezelfde zin -->
<p>Voor informatie over geboorteaangifte kunt u
<a href="/geboorteaangifte">hier meer lezen</a>.</p>
<!-- Context "informatie over geboorteaangifte" staat in dezelfde zin -->

<!-- PASS: beschrijvende linktekst -->
<a href="/geboorteaangifte">Geboorteaangifte doen</a>

<!-- PASS: CTA-knop met beschrijvende tekst -->
<a class="btn" href="/afspraak">Plan een afspraak</a>
```

**Let op:** SC 2.4.4 staat context toe (in tegenstelling tot SC 2.4.9 dat vereist dat elke link op zichzelf begrijpelijk is). Maar de context moet **programmatisch gekoppeld** zijn.

### 2. CONTEXTUEEL BEPAALD LINKDOEL

**Regel:** Wanneer linktekst niet zelfstandig beschrijvend is, moet de context het doel verduidelijken. De context moet programmatisch aan de link gekoppeld zijn.

**Geldige contextbronnen (in volgorde van betrouwbaarheid):**

| Contextbron | HTML-verband | Voorbeeld |
|-------------|-------------|-----------|
| Dezelfde zin | Link binnen `<p>` of inline tekst | "Lees over <a>geboorteaangifte</a> op onze site." |
| Hetzelfde lijstitem | Link binnen `<li>` | `<li>Geboorteaangifte: <a>meer info</a></li>` |
| Dezelfde tabelcel | Link binnen `<td>` | `<td><a>Bekijk</a> de aanvraag</td>` |
| Tabelheader | `<th>` gekoppeld aan de cel met de link | Header "Actie" boven cel met "Bekijk" link |
| Voorgaande kop | `<h2>` gevolgd door `<p>` met link | `<h2>Kosten</h2><p><a>Meer info</a></p>` |
| ARIA-label | `aria-label` op het `<a>`-element | `<a href="..." aria-label="Meer info over kosten">Meer</a>` |
| ARIA-labelledby | Verwijzing naar ander element | `<a aria-labelledby="kop1">Meer</a>` |

```html
<!-- FAIL: context in andere alinea -->
<p>Meer informatie over geboorteaangifte.</p>
<p><a href="/geboorteaangifte">Klik hier</a></p>
<!-- De context staat in een ANDERE <p>, dus niet programmatisch gekoppeld -->

<!-- PASS: context in dezelfde alinea -->
<p>Meer informatie over
<a href="/geboorteaangifte">geboorteaangifte</a>.</p>

<!-- PASS: context via voorgaande kop (aanvullende techniek H80) -->
<h2>Geboorteaangifte</h2>
<p><a href="/geboorteaangifte">Meer informatie</a></p>
<!-- Kop "Geboorteaangifte" geeft context aan "Meer informatie" -->

<!-- PASS: context via aria-label -->
<a href="/geboorteaangifte" aria-label="Meer informatie over geboorteaangifte">
  Meer informatie
</a>
```

### 3. IDENTIEKE LINKTEKSTEN

**Regel:** Links met dezelfde tekst moeten naar dezelfde bestemming leiden. Verschillende bestemmingen met dezelfde linktekst veroorzaken verwarring, vooral in een screenreader-linklijst.

```html
<!-- FAIL: zelfde tekst, verschillende bestemming -->
<a href="/geboorteaangifte">Meer informatie</a>
...
<a href="/trouwen">Meer informatie</a>
...
<a href="/overlijden">Meer informatie</a>
<!-- Screenreader-linklijst toont drie keer "Meer informatie" -->

<!-- PASS: unieke linkteksten -->
<a href="/geboorteaangifte">Meer over geboorteaangifte</a>
<a href="/trouwen">Meer over trouwen</a>
<a href="/overlijden">Meer over overlijden</a>

<!-- PASS: context maakt het verschil (via aria-label) -->
<a href="/geboorteaangifte" aria-label="Meer informatie over geboorteaangifte">
  Meer informatie</a>
<a href="/trouwen" aria-label="Meer informatie over trouwen">
  Meer informatie</a>
```

**Uitzondering:** Identieke tekst naar dezelfde bestemming is uiteraard toegestaan (bijv. logo-link en "Home" link die beide naar `/` gaan).

### 4. LINKLIJST-TEST

**Regel:** Test of links begrijpelijk zijn wanneer ze uit hun context worden gehaald (zoals een screenreader-linklijst toont).

**Methode:** Maak een lijst van alle accessible names van links op de pagina. Beoordeel of elke naam voldoende informatie geeft.

```
Voorbeeld linklijst van een pagina:

✅ "Logo van de Gemeente IJsselstein, link naar de Homepagina"
✅ "Plan een afspraak"
✅ "Contact en openingstijden"
✅ "Over deze site"
✅ "facebook-pagina van de Gemeente IJsselstein"

❌ "Lees meer"          → waarheen?
❌ "Klik hier"          → waarheen?
❌ "Meer informatie"    → waarover? (als dit meerdere keren voorkomt)
❌ "Download"           → welk document?
❌ ""                   → lege link
```

### 5. AFBEELDING ALS LINK

**Regel:** Wanneer een `<img>` de enige inhoud van een link is, fungeert het `alt`-attribuut als linktekst. Het `alt` moet het **linkdoel** beschrijven, niet de afbeelding.

```html
<!-- FAIL: alt beschrijft afbeelding i.p.v. linkdoel -->
<a href="/">
  <img src="logo.png" alt="Logo">
</a>

<!-- FAIL: lege alt bij afbeelding-als-link -->
<a href="/">
  <img src="logo.png" alt="">
</a>
<!-- Link heeft nu GEEN accessible name -->

<!-- PASS: alt beschrijft linkdoel -->
<a href="/">
  <img src="logo.png" alt="Gemeente IJsselstein, ga naar homepage">
</a>

<!-- PASS: afbeelding + tekst in dezelfde link -->
<a href="/">
  <img src="logo.png" alt="">
  <span>Gemeente IJsselstein - Homepage</span>
</a>
<!-- alt="" is hier correct: de tekst fungeert als accessible name -->
```

**Gecombineerde afbeelding + tekst links (H2-techniek):**
Wanneer een afbeelding en tekst naast elkaar naar dezelfde bestemming linken, moeten ze worden gecombineerd in één `<a>`-element om dubbele links te voorkomen.

```html
<!-- FAIL: twee aparte links naar dezelfde bestemming -->
<a href="/nieuws/artikel1"><img src="foto.jpg" alt="Wethouder opent park"></a>
<a href="/nieuws/artikel1">Wethouder opent nieuw stadspark</a>
<!-- Screenreader meldt twee links; de eerste met de afbeeldingsbeschrijving -->

<!-- PASS: gecombineerd in één link -->
<a href="/nieuws/artikel1">
  <img src="foto.jpg" alt="">
  Wethouder opent nieuw stadspark
</a>
```

### 6. ICOONLINKS OF LEGE LINKS

**Regel:** Links die alleen een icoon bevatten (Font Awesome, SVG, icoon-afbeelding) moeten een toegankelijke naam hebben. Een link zonder accessible name is altijd een FAIL.

```html
<!-- FAIL: icoonlink zonder accessible name -->
<a href="https://facebook.com/gemeente">
  <span class="fa-facebook"></span>
</a>

<!-- FAIL: lege link -->
<a href="/zoeken"></a>

<!-- PASS: icoon + visueel verborgen tekst -->
<a href="https://facebook.com/gemeente">
  <span class="fa-facebook" aria-hidden="true"></span>
  <span class="visually-hidden">Facebook-pagina van de gemeente</span>
</a>

<!-- PASS: icoon + aria-label -->
<a href="https://facebook.com/gemeente" aria-label="Facebook-pagina van de gemeente">
  <span class="fa-facebook" aria-hidden="true"></span>
</a>

<!-- PASS: SVG met titel -->
<a href="/zoeken">
  <svg aria-hidden="true">...</svg>
  <span class="visually-hidden">Zoeken</span>
</a>
```

**Veelvoorkomend op gemeente-websites:**
- Social media iconen in footer
- Zoek-icoon in header
- Telefoon-icoon bij contactgegevens
- Pijl-iconen in knoppen
- Hamburger-menu icoon

### 7. GEBRUIK VAN TITLE-ATTRIBUUT

**Regel:** Het `title`-attribuut mag niet de enige bron zijn van het linkdoel. Title wordt niet betrouwbaar weergegeven door alle hulptechnologieën en is niet zichtbaar voor toetsenbord- en touchscreengebruikers.

```html
<!-- FAIL: linkdoel alleen in title -->
<a href="/geboorteaangifte" title="Geboorteaangifte doen">
  Klik hier
</a>
<!-- "Klik hier" is niet beschrijvend; title is onbetrouwbaar -->

<!-- FAIL: title als enige accessible name -->
<a href="/geboorteaangifte" title="Geboorteaangifte doen">
  <img src="arrow.png" alt="">
</a>
<!-- Alleen title als naam; onbetrouwbaar -->

<!-- PASS: beschrijvende linktekst, title als aanvulling -->
<a href="/geboorteaangifte.pdf" title="PDF, 2,3 MB">
  Geboorteaangifte formulier downloaden
</a>
<!-- Linktekst is beschrijvend; title voegt optionele details toe -->
```

**Richtlijn:** Gebruik `title` alleen als aanvulling op al beschrijvende linktekst, nooit als vervanging.

### 8. BESTANDSLINKS

**Regel:** Links naar bestanden moeten duidelijk maken wat het document is. Het is sterk aanbevolen om het bestandstype te vermelden.

```html
<!-- FAIL: onduidelijk bestandslink -->
<a href="/formulier.pdf">Download</a>

<!-- FAIL: alleen bestandsnaam -->
<a href="/doc_2024_v3_final.pdf">doc_2024_v3_final.pdf</a>

<!-- PASS: beschrijvend met bestandstype -->
<a href="/formulier.pdf">Aanvraagformulier geboorteaangifte (PDF)</a>

<!-- PASS: uitgebreid met formaat -->
<a href="/formulier.pdf">Aanvraagformulier geboorteaangifte (PDF, 245 KB)</a>

<!-- PASS: met visueel verborgen aanvulling -->
<a href="/formulier.pdf">
  Aanvraagformulier
  <span class="visually-hidden">(PDF, 245 KB)</span>
</a>
```

**Veelvoorkomende bestandstypen op gemeente-websites:**
- PDF (verordeningen, formulieren, notulen)
- Word/DOCX (aanvraagformulieren)
- Excel/XLSX (overzichten)

---

## Beslisboom per link

```
Link gevonden
│
├─ Heeft de link een accessible name?
│  ├─ NEE → FAIL (lege link / F89)
│  └─ JA → Ga door
│
├─ Is het alleen een title-attribuut?
│  ├─ JA → FAIL (title onbetrouwbaar)
│  └─ NEE → Ga door
│
├─ Is de accessible name beschrijvend?
│  ├─ JA → PASS
│  └─ NEE (generiek: "Lees meer", "Klik hier", etc.)
│     │
│     ├─ Is er programmatisch bepaalde context?
│     │  ├─ JA: zelfde zin/alinea/li/td/kop/aria → PASS
│     │  └─ NEE: context in ander element → FAIL (F63)
│     │
│     └─ Zijn er identieke linkteksten met verschillende bestemmingen?
│        ├─ JA → FAIL
│        └─ NEE → check context
│
├─ Is het een afbeelding-link?
│  ├─ alt="" of ontbrekend → FAIL (F89)
│  ├─ alt beschrijft afbeelding, niet linkdoel → FAIL
│  └─ alt beschrijft linkdoel → PASS
│
└─ Is het een bestandslink?
   ├─ Bestandstype vermeld → PASS (best practice)
   └─ Niet vermeld → opmerking (aanbevolen, geen harde FAIL)
```

---

## Veelvoorkomende patronen op gemeente-websites (SIMsite/Drupal)

### Patroon A: Nieuwsoverzicht met "Lees meer"

```html
<!-- Typisch SIMsite-patroon -->
<div class="news-teaser">
  <a href="/nieuws/artikel1"><img src="foto.jpg" alt=""></a>
  <h3><a href="/nieuws/artikel1">Wethouder opent nieuw stadspark</a></h3>
  <p>De wethouder heeft vandaag het nieuwe stadspark geopend.</p>
  <a href="/nieuws/artikel1">Lees meer</a>
</div>
```

**Analyse:**
- De foto-link met `alt=""` heeft geen accessible name → **FAIL**
- De kop-link "Wethouder opent nieuw stadspark" → **PASS**
- "Lees meer" zonder context in dezelfde `<p>` → **mogelijke FAIL** (afhankelijk van of de voorgaande kop als context geldt, H80-techniek)

**Aanbeveling:** Combineer foto + kop + lees-meer in één link, of gebruik `aria-label` op de "Lees meer" link.

### Patroon B: Logo-link in header

```html
<!-- SIMsite-patroon -->
<a title="Ga naar de homepage" href="/">
  <img src="logo.png" alt="Logo van de Gemeente IJsselstein, link naar de Homepagina">
</a>
```

**Analyse:** Het `alt`-attribuut beschrijft zowel de afbeelding als het linkdoel → **PASS**

### Patroon C: Social media iconen in footer

```html
<a href="https://facebook.com/gemeente" class="SocialLink">
  <span class="fa-facebook" role="img" aria-hidden="true"></span>
  <span class="SocialLink_text">facebook-pagina van de Gemeente</span>
</a>
```

**Analyse:** Icoon is `aria-hidden`, tekst fungeert als accessible name → **PASS**

### Patroon D: CTA-knoppen

```html
<a class="btn-arrow" href="https://afspraakmaken.nl/">
  Plan een afspraak
  <span class="arrowIcon" role="img" aria-hidden="true"></span>
</a>
```

**Analyse:** Tekst "Plan een afspraak" is beschrijvend, pijl-icoon is decoratief → **PASS**

### Patroon E: Breadcrumb-links

```html
<nav aria-label="Kruimelpad">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/wonen-en-leven">Wonen en leven</a></li>
    <li><span aria-current="location">Geboorteaangifte doen</span></li>
  </ol>
</nav>
```

**Analyse:** Elke link heeft beschrijvende tekst → **PASS**

### Patroon F: Externe links met icoon

```html
<a href="https://extern.nl">
  Webarchief
  <span role="img" aria-label="(externe link)">
    <span class="ExternalLinkIcon" aria-hidden="true"></span>
  </span>
</a>
```

**Analyse:** Accessible name = "Webarchief (externe link)" → **PASS**

### Patroon G: Snelmenu-links met iconen

```html
<a href="/contact">
  <span class="fas fa-phone" role="img" aria-hidden="true"></span>
  <span>Contact</span>
</a>
```

**Analyse:** Icoon decoratief, tekst "Contact" als accessible name → **PASS**

### Patroon H: Teaserkaarten (klikbare kaart)

```html
<!-- Veel voorkomend op overzichtspagina's -->
<a href="/product1" class="card">
  <img src="foto.jpg" alt="">
  <h3>Paspoort aanvragen</h3>
  <p>Vraag online uw paspoort aan.</p>
</a>
```

**Analyse:** Accessible name = "Paspoort aanvragen Vraag online uw paspoort aan." (alle tekst in de link). Beschrijvend → **PASS**. Let op: `alt=""` is hier correct omdat de tekst al het doel beschrijft.

### Patroon I: Telefoon- en e-maillinks in footer

Telefoonnummers en e-mailadressen worden op gemeente-websites vaak als link weergegeven zonder contexttekst. In een screenreader-linklijst zijn deze niet altijd herkenbaar.

**Telefoonlink:**

```html
<!-- Typisch SIMsite-patroon: telefoonnummer als link naar /# -->
<p>Overtoom 1<br/>3401 BK IJsselstein<br/>
<a href="/#">14 030</a></p>
```

**Analyse:** "14 030" is op zichzelf in een linklijst niet direct herkenbaar als telefoonnummer. Daarnaast leidt `href="/#"` naar de bovenkant van de pagina — de link doet niet wat de gebruiker verwacht.

**E-maillink:**

```html
<!-- Typisch patroon: e-mailadres als link zonder context -->
<p><a href="mailto:info@gemeente.nl">info@gemeente.nl</a></p>
```

**Analyse:** Een e-mailadres is herkenbaarder dan een telefoonnummer (door het @-teken), maar in een linklijst met meerdere e-mailadressen is het niet duidelijk welk e-mailadres bij welke afdeling hoort. Contexttekst maakt het doel explicieter.

**Oplossingen telefoon:**

```html
<!-- BEST: contexttekst + correcte tel:-href -->
<p>Telefoonnummer: <a href="tel:14030">14 030</a></p>

<!-- REDACTIONEEL: contexttekst toevoegen (gemeente kan dit zelf) -->
<p>Telefoonnummer: <a href="/#">14 030</a></p>
<!-- Lost SC 2.4.4 op; href blijft een usability-issue -->

<!-- ALTERNATIEF: geen link, platte tekst -->
<p>Telefoonnummer: 14 030</p>
```

**Oplossingen e-mail:**

```html
<!-- BEST: contexttekst + correcte mailto:-href -->
<p>E-mail: <a href="mailto:info@gemeente.nl">info@gemeente.nl</a></p>

<!-- BEST bij meerdere adressen: afdeling benoemen -->
<p>E-mail burgerzaken: <a href="mailto:burgerzaken@gemeente.nl">burgerzaken@gemeente.nl</a></p>
<p>E-mail belastingen: <a href="mailto:belastingen@gemeente.nl">belastingen@gemeente.nl</a></p>

<!-- ALTERNATIEF: aria-label voor extra context -->
<a href="mailto:info@gemeente.nl"
   aria-label="E-mail gemeente: info@gemeente.nl">info@gemeente.nl</a>
```

**Opmerking voor audit:** De contexttekst ("Telefoonnummer:", "E-mail:") is een redactionele oplossing die de gemeente zelf kan doorvoeren in het CMS. De correcte `tel:`- en `mailto:`-href is een template-aanpassing door Shift2/SIM. Adviseer beide samen voor het beste resultaat.

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G91 | Linktekst die het doel beschrijft |
| G53 | Linkdoel bepaald uit linktekst + omringende zin |
| H30 | `<a>` met beschrijvende linktekst |
| H24 | Alt-tekst voor `<area>` in image maps |
| H77 | Linkdoel uit linktekst + omringend lijstitem |
| H78 | Linkdoel uit linktekst + omringende alinea |
| H79 | Linkdoel uit linktekst + omringende tabelcel/header |
| H81 | Linkdoel uit linktekst + genest lijstitem |
| ARIA7 | `aria-labelledby` voor linkdoel |
| ARIA8 | `aria-label` voor linkdoel |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| H2 | Combineer aangrenzende afbeelding- en tekstlinks voor dezelfde bron |
| H80 | Linkdoel uit linktekst + voorgaande kop |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F63 | Linkcontext alleen in niet-gerelateerde content |
| F89 | Geen accessible name voor afbeelding die enige linkinhoud is |

---

## Rapportageformat

Voor elke bevinding:

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-8: linktekst | context | identiek | linklijst |
                  afbeelding | icoon | title | bestand]
Element:         [beschrijving van de link]
Locatie:         [positie op pagina / HTML-selector]
Beoordeling:     [PASS | FAIL]
Accessible name: [berekende naam van de link]
Bestemming:      [href waarde]
HTML-code:       [relevante code snippet]

Probleem:        [alleen bij FAIL]
Technique:       [W3C failure/sufficient technique code]
Aanbeveling:     [concrete oplossing met code-voorbeeld]
```

---

## Tips voor efficiënte audit

### Quick wins: waar zitten de meeste issues?

1. **Nieuwsoverzichten:** "Lees meer" links zonder context — meest voorkomende FAIL op gemeente-websites
2. **Social media iconen:** vaak correct in SIMsite-templates, maar controleer altijd
3. **Logo-link:** controleer of `alt` het linkdoel beschrijft
4. **Download-links:** bestandstype vaak niet vermeld
5. **Identieke linkteksten:** meerdere "Meer informatie" links op productpagina's

### Screenreader-linklijst simuleren

Maak een lijst van alle accessible names op de pagina. Dit kan met:
- Browser DevTools: `document.querySelectorAll('a').forEach(a => console.log(a.textContent.trim() || a.getAttribute('aria-label') || a.querySelector('img')?.alt || '[LEEG]'))`
- Of handmatig uit de HTML

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.4.4 is Niveau A:**
- Verplicht voor compliance
- Een van de meest voorkomende WCAG-schendingen op het web
- Meestal eenvoudig op te lossen door linktekst aan te passen
- Vaak redactioneel issue (CMS-content) eerder dan template-issue

**Relatie met SC 2.4.9 (Linkdoel - Alleen link, Niveau AAA):**
SC 2.4.9 vereist dat elke link op zichzelf begrijpelijk is, zonder context. Dit is strenger dan 2.4.4. Hoewel niet verplicht voor AA-compliance, is het de beste praktijk om links zelfstandig beschrijvend te maken.

## Bronnen

- **WCAG 2.2 Understanding 2.4.4:** https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html
- **Technique G91 (Link text):** https://www.w3.org/WAI/WCAG22/Techniques/general/G91
- **Technique H30 (Anchor text):** https://www.w3.org/WAI/WCAG22/Techniques/html/H30
- **Technique H2 (Combined links):** https://www.w3.org/WAI/WCAG22/Techniques/html/H2
- **Failure F63 (Context not related):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F63
- **Failure F89 (No accessible name):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F89
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
