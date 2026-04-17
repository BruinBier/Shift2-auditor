---
name: wcag-3-2-4-consistent-identification
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.2.4 (Consistent Identification) on Dutch government websites. Use when conducting accessibility audits to verify that components with the same functionality are identified consistently across a set of web pages. Covers consistent labels, names, text alternatives, icons, navigation elements, search functions, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.2.4 Consistente identificatie — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.2.4 (Niveau AA):**
Componenten die dezelfde functionaliteit hebben binnen een verzameling webpagina's, worden consistent geïdentificeerd.

**Kernprincipe:** Als een element (knop, link, icoon, formulierveld) dezelfde functie heeft op verschillende pagina's binnen een website, moet het op al die pagina's hetzelfde label, dezelfde naam en hetzelfde tekst-alternatief hebben. Zo kunnen gebruikers vertrouwen op herkenning: wat ze op één pagina leren, werkt hetzelfde op andere pagina's.

---

## Consistent ≠ altijd identiek

**Belangrijk onderscheid:** "Consistent" betekent niet altijd "identiek". Labels mogen variëren als het patroon consistent is:

```
CONSISTENT (niet identiek, maar acceptabel):
- "Ga naar pagina 2", "Ga naar pagina 3", "Ga naar pagina 4"
  → Patroon is consistent: "Ga naar pagina [nummer]"

- "Download jaarverslag 2024", "Download begroting 2025"
  → Patroon is consistent: "Download [documentnaam]"

- "Afdrukken bon", "Afdrukken factuur"
  → Patroon is consistent: "Afdrukken [type document]"

INCONSISTENT (failure):
- "Zoeken" op de ene pagina, "Vinden" op de andere pagina
  → Dezelfde functie, ander label

- Zoek-icoon met alt="Zoeken" op pagina A,
  maar alt="Doorzoek de site" op pagina B
  → Dezelfde functie, ander tekst-alternatief
```

---

## Scope: "verzameling webpagina's"

SC 3.2.4 geldt binnen een **verzameling webpagina's** (set of web pages). Dit is typisch:
- Alle pagina's van een website
- Alle pagina's binnen een webapplicatie
- Alle pagina's die samen een proces vormen

Bij gemeente-websites: alle pagina's van de gemeentewebsite vormen samen de verzameling.

---

## Wat valt onder "consistent geïdentificeerd"?

De consistentie geldt voor drie aspecten:

### 1. Labels (zichtbare tekst)

De zichtbare tekst op knoppen, links en andere interactieve elementen met dezelfde functie moet consistent zijn.

### 2. Accessible names (programmatische naam)

De accessible name (via `aria-label`, `aria-labelledby`, `alt`, `<label>`, etc.) moet consistent zijn. Zelfs als de zichtbare tekst identiek is, kan een inconsistente `aria-label` een failure zijn.

```html
<!-- FAIL: zelfde visuele tekst, maar verschillende aria-labels -->
<!-- Pagina A: -->
<button aria-label="Zoek op de website">Zoeken</button>
<!-- Pagina B: -->
<button aria-label="Doorzoek alles">Zoeken</button>
```

### 3. Tekst-alternatieven (bij iconen/afbeeldingen)

Iconen met dezelfde functie moeten hetzelfde tekst-alternatief hebben.

```html
<!-- FAIL: zelfde icoon, zelfde functie, andere alt-tekst -->
<!-- Pagina A: -->
<img src="search.png" alt="Zoeken">
<!-- Pagina B: -->
<img src="search.png" alt="Doorzoek de website">
```

---

## Zelfde icoon, andere functie = andere tekst-alternatieven

Als hetzelfde icoon op verschillende pagina's een **andere functie** heeft, moeten de tekst-alternatieven juist **verschillend** zijn:

```
✓ CORRECT: Vinkje-icoon met alt="Goedgekeurd" op pagina A
           en alt="Opgenomen" op pagina B
           → Verschillende functies, dus verschillende alternatieven

✗ FOUT:    Vinkje-icoon met alt="Vinkje" op alle pagina's
           → Beschrijft het icoon, niet de functie
```

---

## Beslisboom

```
Component gevonden dat op meerdere pagina's voorkomt
│
├─ Heeft het component dezelfde functie op alle pagina's?
│  │
│  ├─ JA → Is het label/naam/tekst-alternatief
│  │       consistent op alle pagina's?
│  │  │
│  │  ├─ JA → PASS
│  │  └─ NEE → FAIL (F31)
│  │
│  └─ NEE → Verschillende functies → labels MOGEN
│           (en moeten) verschillen → PASS
│
└─ Component komt maar op één pagina voor
   → SC 3.2.4 niet van toepassing voor dit component
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer herhaalde componenten

Bekijk meerdere pagina's van de website en identificeer componenten die op meerdere pagina's voorkomen:
- Zoekfunctie (zoekknop, zoekveld)
- Navigatie-elementen (menu-items, broodkruimelpad)
- Footerlinks (contact, privacy, sitemap)
- Social media-iconen
- "Terug naar boven"-link
- "Delen"-knoppen
- Formulierknoppen (verzenden, annuleren)
- Print-iconen
- Download-iconen

### Stap 2: Vergelijk labels op verschillende pagina's

Per herhaald component:
- Open 3-5 verschillende pagina's
- Vergelijk het zichtbare label: is het hetzelfde?
- Vergelijk de accessible name (DevTools → Accessibility): is die consistent?
- Vergelijk tekst-alternatieven van iconen: zijn die consistent?

### Stap 3: Controleer of functie daadwerkelijk dezelfde is

Als labels verschillen:
- Hebben de componenten daadwerkelijk dezelfde functie?
  → JA: inconsistent label = FAIL
  → NEE: verschillende labels zijn correct

---

## De 6 auditgebieden

### 1. ZOEKFUNCTIE

```
De zoekfunctie staat op (bijna) elke pagina.

Controleer:
- Heeft het zoekveld hetzelfde label op elke pagina?
- Heeft de zoekknop dezelfde tekst op elke pagina?
- Is de accessible name consistent?

FAIL:
- Zoekknop "Zoeken" op de homepage,
  "Vind" op een subpagina
- Zoekveld label "Zoeken" op pagina A,
  aria-label "Doorzoek de site" op pagina B
```

### 2. NAVIGATIE

```
Hoofdnavigatie, subnavigatie, footernavigatie:

Controleer:
- Zijn de menu-items consistent benoemd?
- Heeft het hamburgermenu hetzelfde label op elke pagina?
- Zijn navigatie-landmarks consistent benoemd?
  (bijv. altijd "Hoofdnavigatie", niet soms
   "Menu" en soms "Navigatie")

Let op: SC 3.2.3 (Consistente navigatie) gaat over
de volgorde van navigatie-items. SC 3.2.4 gaat over
de identificatie (naamgeving).
```

### 3. FOOTER-ELEMENTEN

```
Footer-links en -iconen die op elke pagina staan:

Controleer:
- Is de "Contact"-link overal "Contact"?
  (niet soms "Neem contact op" en soms "Contact")
- Zijn privacy/disclaimer-links consistent benoemd?
```

### 4. SOCIAL MEDIA-ICONEN

```
Social media-iconen (Facebook, Twitter, LinkedIn, etc.):

Controleer:
- Hebben de iconen hetzelfde tekst-alternatief
  op elke pagina?
- Niet: alt="Facebook" op pagina A en
  alt="Bezoek onze Facebook-pagina" op pagina B
```

### 5. FORMULIERKNOPPEN

```
Knoppen in formulieren (verzenden, volgende, annuleren):

Controleer:
- Heet de verzendknop overal "Verzenden"?
  (niet soms "Verstuur" en soms "Verzenden")
- Heet de annuleerknop overal "Annuleren"?
  (niet soms "Terug" en soms "Annuleren"
   als ze dezelfde functie hebben)
```

### 6. ICONEN MET FUNCTIES

```
Download-iconen, print-iconen, deel-iconen:

Controleer:
- Hebben download-iconen consistent hetzelfde
  alt-tekst-patroon? (bijv. altijd "Download [naam]")
- Heeft het print-icoon overal dezelfde alt-tekst?
- Heeft het deel-icoon overal dezelfde alt-tekst?
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Zoekfunctie in header

De zoekfunctie staat in de header van elke pagina. Controleer dat het label, de placeholder, de knooptekst en de accessible name op elke pagina identiek zijn.

### Patroon B: "Terug naar boven"-link

Sommige gemeenten hebben een "Terug naar boven"-link onderaan de pagina. Controleer dat deze op elke pagina dezelfde tekst heeft.

### Patroon C: Broodkruimelpad

Het broodkruimelpad is consistent als het op alle pagina's het patroon "Home > Sectie > Pagina" volgt. Het label "Home" moet overal "Home" zijn (niet soms "Startpagina").

### Patroon D: Taalwisseling

Links naar anderstalige versies ("English", "Deutsch") moeten op elke pagina consistent zijn.

### Patroon E: Skiplinks

Als de website skiplinks heeft ("Direct naar content", "Direct naar navigatie"), moeten deze op elke pagina dezelfde tekst hebben.

### Patroon F: Links naar dezelfde pagina met verschillende linktekst

Een link naar het nieuwsoverzicht heeft in de hoofdnavigatie als linktekst "Nieuws". In de footer staat ook een link naar dezelfde pagina, maar daar is de linktekst "Actueel". Dit is een failure: dezelfde functie (link naar nieuwsoverzicht), maar niet consistent geïdentificeerd.

---

## Onderscheid met andere SC's

| SC | Relatie met 3.2.4 |
|----|------------------|
| **2.4.4** | Linkdoel: de tekst van een individuele link beschrijft het doel. 3.2.4 gaat over consistentie van dezelfde functie over pagina's heen. |
| **2.4.6** | Koppen en labels: koppen en labels zijn beschrijvend. 3.2.4 gaat over consistentie, niet beschrijvendheid. |
| **2.5.3** | Label in Name: zichtbaar label zit in accessible name. 3.2.4 gaat over consistentie over pagina's. |
| **3.2.3** | Consistente navigatie: navigatie verschijnt in dezelfde **volgorde**. 3.2.4 gaat over dezelfde **naamgeving**. |
| **3.2.4** | **Consistente identificatie: dezelfde functie → dezelfde naam.** |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G197 | Consistente labels, namen en tekst-alternatieven gebruiken voor content met dezelfde functionaliteit (in combinatie met SC 1.1.1 en SC 4.1.2 techniques) |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F31 | Twee verschillende labels gebruiken voor dezelfde functie op verschillende pagina's |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-6: zoekfunctie | navigatie | footer |
                  social media | formulierknoppen | iconen]
Component:       [beschrijving van het herhaalde component]
Functie:         [de functie van het component]
Beoordeling:     [PASS | FAIL]

Pagina A:
- URL:           [...]
- Zichtbaar label: [...]
- Accessible name: [...]

Pagina B:
- URL:           [...]
- Zichtbaar label: [...]
- Accessible name: [...]

Consistent:      [ja/nee]
Probleem:        [specifieke beschrijving van de inconsistentie]
Technique:       [G197 / F31]
Aanbeveling:     [concrete oplossing — welk label uniformeren]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Zoekknop verschilt per pagina** — "Zoeken" vs. "Zoek" vs. "Vind"
2. **Inconsistente accessible names** — zichtbare tekst is gelijk maar aria-label verschilt per pagina
3. **Social media-iconen met verschillende alt-teksten** — "Facebook" vs. "Bezoek ons op Facebook" vs. "Facebook-pagina"
4. **Navigatie-landmarks** — soms "Hoofdnavigatie", soms "Menu", soms "Navigatie"
5. **Formulierknoppen** — "Verzenden" vs. "Verstuur" vs. "Opslaan" voor dezelfde functie
6. **Skiplinks** — "Ga naar inhoud" vs. "Direct naar content"

### Snelle audit-methode

1. Open 3-5 verschillende pagina's van de website
2. Vergelijk de herhaalde elementen: header, zoekfunctie, footer, navigatie
3. Zijn de labels, namen en tekst-alternatieven consistent?
4. Gebruik DevTools om accessible names te vergelijken

### Technisch of redactioneel issue?

SC 3.2.4 is meestal een **technisch issue**:
- Herhaalde componenten (header, footer, zoekfunctie) komen uit het template
- Inconsistenties ontstaan vaak door template-wijzigingen of verschillende templates
- Bij Shift2: valt typisch onder de **technische audit** (Cardan/template)

**Uitzondering:** Als redacteuren formulierknoppen handmatig labelen → redactioneel issue.

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — vertrouwen op herkenning van functies; inconsistente namen zijn verwarrend
- **Mensen met cognitieve beperkingen** — consistente labels verminderen cognitieve belasting
- **Spraakgestuurde gebruikers** — moeten dezelfde commando's kunnen gebruiken op elke pagina
- **Alle gebruikers** — voorspelbaarheid verbetert de gebruikerservaring

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 3.2.4 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 3.2.4:** https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html
- **Technique G197 (consistente labels):** https://www.w3.org/WAI/WCAG22/Techniques/general/G197
- **Failure F31 (inconsistente labels):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F31
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
