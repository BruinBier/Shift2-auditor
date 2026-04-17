---
name: wcag-2-4-2-page-titled
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.4.2 (Page Titled) on Dutch government websites. Use when conducting accessibility audits to verify that web pages have descriptive, unique titles in the HTML title element that identify the content and distinguish the page from other pages. Covers title element inspection, descriptive vs. generic titles, page-specific vs. site-wide titles, the relationship between page title and h1, SPA dynamic titles, PDF document titles, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.4.2 Paginatitel — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.4.2 (Niveau A):**
Webpagina's hebben een titel die het onderwerp of doel beschrijft.

**Kernprincipe:** Elke webpagina moet een beschrijvende titel hebben (in het HTML `<title>` element) die het onderwerp of doel van de pagina identificeert. De titel helpt gebruikers zich te oriënteren, pagina's te onderscheiden, en snel te bepalen of de content relevant is — zonder de pagina-inhoud te hoeven lezen.

---

## Wat maakt een goede paginatitel?

### Een goede titel:

- **Beschrijft het onderwerp of doel** van de pagina
- **Onderscheidt de pagina** van andere pagina's binnen de site
- **Is begrijpelijk zonder context** (werkt als losstaande tekst, bijv. in een browsertab, bladwijzer, zoekresultaat, of screenreader-aankondiging)
- **Is uniek** binnen de website (geen twee pagina's met dezelfde titel)

### Titel-opbouw (best practice):

```
[Pagina-specifiek onderwerp] - [Sitenaam]

Voorbeelden:
"Paspoort aanvragen - Gemeente IJsselstein"
"Openingstijden stadskantoor - Gemeente IJsselstein"
"Contact - Gemeente IJsselstein"
```

**Waarom pagina-specifiek eerst?** Screenreaders lezen de titel voor bij het laden van de pagina. Als alle titels beginnen met "Gemeente IJsselstein - ..." hoort de gebruiker steeds hetzelfde begin en moet wachten op het onderscheidende deel. Door het specifieke deel eerst te plaatsen kan de gebruiker direct horen op welke pagina hij is.

---

## Veelvoorkomende problemen

### 1. Titel ontbreekt

```html
<!-- FAIL: geen title element -->
<head>
  <meta charset="utf-8">
</head>
```

### 2. Lege titel

```html
<!-- FAIL: leeg title element -->
<head>
  <title></title>
</head>
```

### 3. Generieke/niet-beschrijvende titel

```html
<!-- FAIL (F25): titel beschrijft de inhoud niet -->
<title>Welkom</title>
<title>Home</title>
<title>Pagina</title>
<title>Untitled Document</title>
```

### 4. Alle pagina's dezelfde titel

```html
<!-- FAIL: elke pagina heeft dezelfde titel -->
<title>Gemeente IJsselstein</title>
<!-- Op ALLE pagina's dezelfde titel →
     gebruiker kan pagina's niet onderscheiden -->
```

### 5. Titel komt niet overeen met de content

```html
<!-- FAIL (F25): titel beschrijft andere content dan
     wat op de pagina staat -->
<title>Contact - Gemeente IJsselstein</title>
<!-- Maar de pagina gaat over afvalinzameling -->
```

### 6. Titel bevat alleen technische info

```html
<!-- FAIL: bestandsnaam of URL als titel -->
<title>index.html</title>
<title>/nl/producten/paspoort</title>
```

---

## Beslisboom

```
Pagina heeft een <title> element?
│
├─ NEE → FAIL (titel ontbreekt)
│
└─ JA → Is de titel niet-leeg?
   │
   ├─ NEE → FAIL (lege titel)
   │
   └─ JA → Beschrijft de titel het onderwerp/doel?
      │
      ├─ NEE → FAIL (F25: niet-beschrijvend)
      │
      └─ JA → Is de titel uniek (onderscheidt de pagina)?
         │
         ├─ NEE → Niet per se een FAIL maar wel een
         │        best-practice-schending
         └─ JA → PASS
```

---

## Stapsgewijze auditprocedure

### Stap 1: Bekijk de titel

Drie manieren om de paginatitel te controleren:
1. **Browsertab:** De titel staat in de tab van de browser
2. **Broncode:** Bekijk de `<title>` tag in de `<head>` sectie
3. **DevTools:** In de Console: `document.title`

### Stap 2: Beoordeel de kwaliteit

Stel jezelf de volgende vragen:
- Beschrijft de titel waar de pagina over gaat?
- Kan ik aan de titel zien op welke pagina ik ben, zonder de pagina te bekijken?
- Is de titel anders dan die van andere pagina's op dezelfde site?
- Klopt de titel met de daadwerkelijke inhoud van de pagina?

### Stap 3: Controleer meerdere pagina's

Controleer niet alleen de homepage, maar ook:
- Subpagina's (producten, diensten)
- Zoekresultatenpagina
- Formulierpagina's
- Foutpagina's (404, 500)
- PDF-documenten

### Stap 4: Controleer de verhouding titel vs. h1

De titel en de h1 hoeven niet identiek te zijn, maar moeten wel consistent zijn:
- Titel: "Paspoort aanvragen - Gemeente IJsselstein"
- H1: "Paspoort aanvragen"
→ Consistent ✓

- Titel: "Producten en diensten - Gemeente IJsselstein"
- H1: "Afval ophalen"
→ Inconsistent ✗ (niet per se een SC 2.4.2 failure, maar verwarrend)

---

## De 5 auditgebieden

### 1. HOMEPAGE

```
De homepage heeft vaak de meest generieke titel.

FAIL:
<title>Home</title>
<title>Welkom</title>
<title>Gemeente IJsselstein</title>
(alleen sitenaam, maar niet onjuist — de homepage IS
 de hoofdpagina van de gemeente)

PASS:
<title>Home - Gemeente IJsselstein</title>
<title>Gemeente IJsselstein - Officiële website</title>

Let op: voor de homepage is alleen de sitenaam als titel
aanvaardbaar — de homepage IS de site. Maar een
toevoeging als "Home" of "Officiële website" is beter
voor de herkenbaarheid.
```

### 2. SUBPAGINA'S

```
Elke subpagina moet een unieke, beschrijvende titel hebben.

PASS:
<title>Paspoort aanvragen - Gemeente IJsselstein</title>
<title>Afvalkalender 2026 - Gemeente IJsselstein</title>
<title>Openingstijden - Gemeente IJsselstein</title>

FAIL:
<title>Gemeente IJsselstein</title>
(op alle subpagina's dezelfde titel)
<title>Pagina</title>
<title>Content</title>
```

### 3. ZOEKRESULTATENPAGINA

```
PASS:
<title>Zoekresultaten voor 'paspoort' - Gemeente IJsselstein</title>

FAIL:
<title>Zoeken - Gemeente IJsselstein</title>
(beschrijft niet wat er gezocht is — maar is niet altijd
 een harde failure; de pagina gaat over zoeken)
```

### 4. FORMULIEREN EN STAPPEN

```
Bij een meerstappenformulier (bijv. afspraak maken):

BEST:
<title>Afspraak maken - Stap 1: Kies een product - Gemeente IJsselstein</title>
<title>Afspraak maken - Stap 2: Kies datum en tijd - Gemeente IJsselstein</title>

ACCEPTABEL:
<title>Afspraak maken - Gemeente IJsselstein</title>
(op alle stappen dezelfde titel — dit is toegestaan: de titel
 van de eerste pagina van een proces mag gelden als de titel
 van alle pagina's binnen dat proces)

FAIL:
<title>Formulier</title>
```

**Nuance:** Iedere processtap mag dezelfde titel hebben. Het is niet verkeerd. Maar als iedere processtap een eigen beschrijvende titel heeft, is dat beter — vooral voor screenreader-gebruikers die willen weten bij welke stap ze zijn.

### 5. FOUTPAGINA'S

```
PASS:
<title>Pagina niet gevonden (404) - Gemeente IJsselstein</title>
<title>Er is een fout opgetreden - Gemeente IJsselstein</title>

FAIL:
<title>404</title>
<title>Error</title>
```

---

## Speciale situaties

### Single Page Applications (SPA's)

Bij SPA's verandert de URL en de weergave, maar de pagina wordt niet opnieuw geladen. De titel moet **dynamisch worden bijgewerkt** zodat deze de huidige weergave/content beschrijft.

```javascript
// Bij navigatie binnen de SPA:
document.title = "Afspraak maken - Stap 2 - Gemeente IJsselstein";
```

Als de titel niet dynamisch wordt bijgewerkt en op elke "pagina" binnen de SPA dezelfde titel toont → FAIL.

### PDF-documenten

PDF-documenten moeten ook een titel hebben. Dit wordt ingesteld in de document-eigenschappen (Document Properties → Title).

```
Controleer:
- Open het PDF-document
- Bestand → Eigenschappen → Beschrijving → Titel
- Is er een beschrijvende titel ingevuld?
- Staat de PDF-viewer ingesteld om de documenttitel te tonen
  (niet de bestandsnaam)?
```

**Let op:** De bestandsnaam (bijv. "verordening-2025-v3-definitief.pdf") is GEEN goede titel. De documenttitel moet beschrijvend zijn (bijv. "Algemene Plaatselijke Verordening 2025").

### Iframes

Pagina's die door middel van een iframe binnen een andere pagina worden getoond, moeten ook een beschrijvende titel hebben. Dit geldt ook voor het `<title>` element van de HTML-pagina binnen het iframe. Een YouTube-video zit vaak in een iframe — de pagina binnen dat iframe moet een beschrijvende titel hebben.

Daarnaast moet het `<iframe>` element zelf een `title` attribuut hebben dat de inhoud beschrijft (bijv. `<iframe title="YouTube video: Uitleg afvalscheiding">`). Dit valt ook onder SC 4.1.2 (Naam, Rol, Waarde).

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: SIMsite/Drupal standaard titels

SIMsite-gebaseerde gemeente-websites genereren meestal automatisch titels op basis van de paginanaam. Controleer:
- Worden titels automatisch gegenereerd?
- Bevatten ze de paginanaam + sitenaam?
- Zijn ze uniek per pagina?

### Patroon B: Sitenaam eerst vs. pagina eerst

```
Sitenaam eerst (minder goed):
"Gemeente IJsselstein - Paspoort aanvragen"
→ Screenreader leest steeds "Gemeente IJsselstein" als eerste

Pagina eerst (beter):
"Paspoort aanvragen - Gemeente IJsselstein"
→ Screenreader leest meteen het onderscheidende deel

Pagina met pad/broodkruimel (best):
"Bedrijfsgegevens aanpassen – Bouwen en vestigen – Ondernemers – Gemeente Tilburg"
→ Volledige context, van specifiek naar algemeen
```

### Patroon C: Link-tekst vs. paginatitel

De tekst van de link naar een pagina moet overeenkomen met de titel van die pagina. Dit biedt continuïteit:
- Link: "Paspoort aanvragen"
- Paginatitel: "Paspoort aanvragen - Gemeente IJsselstein"
→ Consistent ✓

### Patroon D: Zoekresultaten en lijstpagina's

Pagina's met paginering moeten idealiter het paginanummer in de titel hebben:
- "Nieuwsoverzicht - Pagina 3 - Gemeente IJsselstein"

---

## Onderscheid met andere SC's

| SC | Relatie met 2.4.2 |
|----|------------------|
| **1.3.1** | Informatie en relaties: de heading-structuur (h1, h2, etc.) moet programmatisch bepaalbaar zijn. De `<title>` is apart van de headings. |
| **2.4.2** | **Paginatitel: beschrijvende titel in het `<title>` element** |
| **2.4.4** | Linkdoel: de tekst van links naar pagina's moet het doel beschrijven. De paginatitel en linktekst moeten consistent zijn. |
| **2.4.6** | Koppen en labels: koppen (h1-h6) moeten het onderwerp beschrijven. Overlap met de titel, maar apart criterium. |
| **3.2.4** | Consistente identificatie: componenten met dezelfde functie moeten consistent worden geïdentificeerd. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G88 | Beschrijvende titels bieden voor webpagina's |
| H25 | Titel bieden via het HTML `<title>` element |
| PDF18 | Documenttitel specificeren in de PDF document-eigenschappen |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| G127 | De relatie van een pagina tot een groter geheel identificeren (bijv. "Stap 2 van 4") |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F25 | De titel van een webpagina identificeert de inhoud niet |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: homepage | subpagina | zoekresultaten |
                  formulieren/stappen | foutpagina's]
Pagina:          [URL]
Huidige titel:   [de huidige <title> tekst]
Beoordeling:     [PASS | FAIL]

Titel aanwezig:  [ja/nee]
Titel niet-leeg: [ja/nee]
Beschrijvend:    [ja/nee — beschrijft de titel het onderwerp?]
Uniek:           [ja/nee — verschilt de titel van andere pagina's?]
Consistent
met h1:          [ja/nee]
Consistent
met linktekst:   [ja/nee]

Probleem:        [specifieke beschrijving]
Technique:       [G88 / H25 / F25 / PDF18]
Aanbeveling:     [concrete suggestie voor betere titel]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Alle pagina's dezelfde titel** — alleen "Gemeente IJsselstein" op elke pagina
2. **Generieke titels** — "Home", "Welkom", "Pagina"
3. **Sitenaam eerst** — "Gemeente IJsselstein - Paspoort aanvragen" (minder goed)
4. **Titel komt niet overeen met content** — titel zegt iets anders dan de pagina toont
5. **PDF zonder documenttitel** — bestandsnaam als titel
6. **Zoekresultaten zonder zoekterm in titel** — "Zoeken" i.p.v. "Zoekresultaten voor 'paspoort'"
7. **Meerstappenformulier zonder stap-indicatie** — elke stap dezelfde titel
8. **SPA-pagina's zonder dynamische titel** — titel verandert niet bij navigatie

### Snelle audit-methode

1. Open meerdere pagina's van de website in verschillende tabs
2. Bekijk de tabs: kan je aan de tabnamen zien welke pagina welke is?
3. Zo nee → waarschijnlijk een probleem met de titels

### Technisch of redactioneel issue?

SC 2.4.2 kan **beide** zijn:
- **Technisch:** Het CMS genereert de titels automatisch. Als het template fout is geconfigureerd (bijv. alleen sitenaam, geen paginanaam) → technisch issue
- **Redactioneel:** De redacteur voert een niet-beschrijvende titel in → redactioneel issue
- Bij Shift2: typisch een mix — het template moet correct zijn (Cardan), en de redacteur moet zinvolle titels invoeren (content audit)

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — de titel wordt als eerste voorgelezen bij het laden van een pagina; het is de primaire manier om te weten op welke pagina je bent
- **Mensen met cognitieve beperkingen** — een duidelijke titel helpt bij oriëntatie
- **Alle gebruikers** — titels verschijnen in browsertabs, bladwijzers, zoekresultaten, en de taakbalk
- **Zoekmachines** — descriptieve titels verbeteren SEO (niet WCAG-gerelateerd, maar een bonus)

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.4.2 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 2.4.2:** https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html
- **Technique G88 (beschrijvende titels):** https://www.w3.org/WAI/WCAG22/Techniques/general/G88
- **Technique H25 (title element):** https://www.w3.org/WAI/WCAG22/Techniques/html/H25
- **Technique PDF18 (PDF-documenttitel):** https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF18
- **Failure F25 (titel identificeert inhoud niet):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F25
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
