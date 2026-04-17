---
name: wcag-2-5-8-target-size-minimum
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.5.8 (Target Size Minimum) on Dutch government websites. Use when conducting accessibility audits to verify that interactive targets are at least 24x24 CSS pixels, or have sufficient spacing. Covers the 24px minimum, the spacing exception with circle-intersection test, inline exception, equivalent exception, user agent control, essential exception, and common patterns on gemeente websites. New in WCAG 2.2. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.5.8 Grootte van het aanwijsgebied (minimum) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.5.8 (Niveau AA):**
De grootte van het aanwijsgebied voor aanwijzerinvoer is ten minste 24 bij 24 CSS-pixels, behalve wanneer:
- **Ruimte (Spacing):** Het te kleine aanwijsgebied is zo geplaatst dat als er een cirkel met een diameter van 24 CSS-pixels op het midden van het selectiekader wordt gecentreerd, de cirkels niet overlappen met een ander aanwijsgebied of de cirkel van een ander te klein aanwijsgebied.
- **Gelijkwaardig (Equivalent):** De functie kan worden bereikt via een ander besturingselement op dezelfde pagina dat aan dit criterium voldoet.
- **Inline:** Het aanwijsgebied bevindt zich in een zin of de grootte wordt beperkt door de regelhoogte van niet-aanwijsbare tekst.
- **Bepaald door user agent:** De grootte wordt bepaald door de user agent en is niet gewijzigd door de auteur.
- **Essentieel:** De specifieke presentatie is essentieel of wettelijk vereist.

**Kernprincipe:** Interactieve elementen (knoppen, links, formuliervelden, selectievakjes, etc.) moeten groot genoeg zijn om nauwkeurig te kunnen worden aangeklikt of aangeraakt. Het minimum is 24×24 CSS-pixels, óf er moet voldoende ruimte zijn tussen kleine targets.

**Nieuw in WCAG 2.2** — dit criterium is in oktober 2023 toegevoegd aan WCAG 2.2.

---

## Waarom is dit belangrijk?

- **Motorische beperkingen:** Mensen met trillingen (Parkinson), beperkte handfunctie, of die alternatieve invoerapparaten gebruiken (hoofdaanwijzer, mondstick) hebben moeite met kleine klikgebieden
- **Touchscreens:** Vingertoppen zijn gemiddeld 16-20mm breed (~45 CSS-pixels); kleine targets leiden tot miskliks
- **Ouderen:** Afnemende motorische precisie
- **Situationele beperkingen:** Eénhandig bedienen, onderweg, handschoenen
- **Alle gebruikers:** Kleine targets zijn voor iedereen frustrerend

---

## De meting: CSS-pixels, niet visuele grootte

### Target size = klikbaar gebied, niet visueel element

De grootte van het aanwijsgebied is het **volledige klikbare/tikbare gebied**, niet alleen het zichtbare element:

```
Icoon van 16×16px met 4px padding aan alle zijden:
- Visueel: 16×16px
- Klikbaar gebied: 24×24px (16 + 4 + 4)
→ PASS ✓
```

### CSS-pixels veranderen niet bij zoom

Een element van 16×16 CSS-pixels bij 100% zoom is nog steeds 16×16 CSS-pixels bij 400% zoom. Het wordt visueel groter op het scherm, maar de CSS-pixelwaarde verandert niet. Er is geen "zoom-escape" voor te kleine targets.

### Bedekte/overlapte targets vallen niet onder dit SC

Het criterium is niet van toepassing op aanwijsgebieden die **afgedekt of bedekt** worden door nieuwe content als gevolg van gebruikersinteractie of gescript gedrag. Voorbeelden:
- Een dropdown bij een combobox die andere elementen bedekt
- Een modal venster dat verschijnt na interactie met een knop
- Een cookiebalk die bij het laden van de pagina verschijnt en andere content bedekt

Deze situaties vallen niet onder SC 2.5.8 omdat de bedekking het gevolg is van gebruikersinteractie of pagina-laadgedrag, niet van het oorspronkelijke ontwerp van de targets.

---

## De vijf uitzonderingen

### 1. Ruimte (Spacing) — Offset-regel

Als een target kleiner is dan 24×24px, kan het alsnog slagen als de **offset** naar elk aangrenzend target minstens 24px is.

**Offset-definitie:** De afstand gemeten van het **verste punt** van een aanwijsgebied tot het **meest dichtbijzijnde punt** van het aangrenzende aanwijsgebied. Dit is dus de optelsom van de eigen omvang van het target plus de tussenruimte naar het aangrenzende target.

```
Voorbeeld: Knop A (20px breed) staat links van Knop B.

Offset = eigen breedte van A (20px) + tussenruimte tot B
Vereiste: offset ≥ 24px
→ Er is minimaal 4px tussenruimte nodig rechts van A

                ←── offset ≥ 24px ──→
  [  Knop A  ]····gap····[ Knop B ]
  ←── 20px ──→←─ 4px+ ─→

De breedte van Knop B maakt voor Knop A niet uit.
Het gaat om de eigen omvang + tussenruimte tot B.
```

**Per richting:** De offset moet in **elke richting** (links, rechts, boven, onder) voldoende zijn waar aangrenzende aanwijsgebieden zijn. Naar elk ander aanwijsgebied moet een minimale offset van 24px aanwezig zijn.

```
Voorbeeld: Knop A (20px breed) staat tussen Knop C en Knop B:
[Knop C]····gap····[Knop A]····gap····[Knop B]

- Offset A→B (naar rechts): 20px + tussenruimte ≥ 24px
- Offset A→C (naar links): 20px + tussenruimte ≥ 24px
Dus: minimaal 4px tussenruimte aan beide zijden
```

**Praktische vuistregel:** Benodigde tussenruimte = 24 − eigen omvang van het target (per richting naar elk aangrenzend target).

### 2. Gelijkwaardig (Equivalent)

Als een klein target dezelfde functie heeft als een ander element op dezelfde pagina dat wél 24×24px is, geldt de uitzondering.

```
Voorbeeld: Een klein icoon (16×16px) voor "Zoeken"
naast een grotere "Zoeken"-knop (24×24px of groter)
→ Het kleine icoon is uitgezonderd
```

### 3. Inline

Targets in een zin of blok tekst (alinea) zijn uitgezonderd. Links binnen een alinea hoeven niet 24×24px te zijn.

```
Voorbeeld 1 — WEL uitzondering:
<p>Lees meer over het <a href="/afval">afvalbeleid</a>
van onze gemeente.</p>
→ De link "afvalbeleid" staat inline in een zin → uitzondering

Voorbeeld 2 — WEL uitzondering:
Meerdere links in een alinea die door tekstherloop
visueel onder elkaar komen te staan. Normaal zou er
een minimale offset nodig zijn, maar omdat de positie
niet te voorspellen is bij wisselende schermgrootte
→ uitzondering
```

**Belangrijk onderscheid:**
- Links in een **alinea** die door tekstherloop onder elkaar komen → WEL uitzondering (positie is niet voorspelbaar)
- Links in een **lijst** die bewust onder elkaar staan → GEEN uitzondering (positie ligt vast, hier kan op geanticipeerd worden)

```
GEEN inline-uitzondering:
<ul>
  <li><a href="/a">Link A</a></li>
  <li><a href="/b">Link B</a></li>
</ul>
→ De links staan bewust onder elkaar in een lijst
→ De positie is voorspelbaar → geen inline-uitzondering
→ Offset-regel geldt
```

Links in een navigatiemenu staan ook niet in een zin en worden niet beperkt door regelhoogte → geen inline-uitzondering.

### 4. Bepaald door user agent

Als de browser de grootte bepaalt en de auteur deze niet heeft aangepast, geldt de uitzondering.

```
Voorbeeld: standaard <input type="checkbox"> zonder
aangepaste CSS → de browser bepaalt de grootte
→ uitzondering (maar: de meeste standaard checkboxen
   zijn 13-16px, wat problematisch is)
```

**Let op:** Zodra de auteur de grootte aanpast via CSS, geldt deze uitzondering niet meer.

### 5. Essentieel

Als de specifieke grootte of positie essentieel is voor de informatie.

```
Voorbeeld: pinnen op een interactieve kaart
→ de positie van de pin is essentieel
→ uitzondering

Ander voorbeeld: wettelijk verplichte formulieren die
papierformulieren moeten nabootsen
→ juridische verplichting → uitzondering
```

---

## Beslisboom

```
Interactief element gevonden
│
├─ Is het klikbare gebied ≥ 24×24 CSS-pixels?
│  └─ JA → PASS
│
└─ NEE (kleiner dan 24×24px) → Controleer uitzonderingen:
   │
   ├─ Spacing: Is er voldoende ruimte (cirkel-test)?
   │  └─ JA → PASS (spacing exception)
   │
   ├─ Equivalent: Is er een alternatief ≥ 24×24px
   │  op dezelfde pagina?
   │  └─ JA → PASS (equivalent exception)
   │
   ├─ Inline: Staat het target in een zin/blok tekst?
   │  └─ JA → PASS (inline exception)
   │
   ├─ User agent: Wordt de grootte door de browser
   │  bepaald (ongewijzigd door auteur)?
   │  └─ JA → PASS (user agent exception)
   │
   ├─ Essential: Is de grootte/positie essentieel?
   │  └─ JA → PASS (essential exception)
   │
   └─ Geen uitzondering van toepassing → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle interactieve targets

Scan de pagina op:
- Knoppen (buttons, submit, image buttons)
- Links (tekst-links, icoon-links, afbeelding-links)
- Formuliervelden (invoervelden, selectievakjes, radiobuttons, keuzelijsten)
- Sliders, toggles, tabs
- Sluit-knoppen (modals, meldingen)
- Paginering-links
- Icoon-knoppen (social media, delen, sluiten)

### Stap 2: Meet de target-grootte

Gebruik DevTools:
1. Rechtermuisklik → Inspecteren
2. Bekijk het **box model** in het Elements-panel
3. De target-grootte = content + padding (de klikbare area)
4. Check: is de totale klikbare area ≥ 24×24px?

**Let op:** De border en margin tellen NIET mee voor de klikbare area (tenzij de border klikbaar is gemaakt via CSS).

### Stap 3: Controleer uitzonderingen voor kleine targets

Als een target < 24×24px:
- Inline-tekst? → Uitzondering
- Voldoende spacing? → Doe de cirkel-test
- Alternatief aanwezig? → Equivalent
- Ongewijzigde browser-standaard? → User agent
- Essentieel? → Essential

### Stap 4: Controleer specifiek probleemgebieden

Bekijk vooral:
- **Sluit-knoppen** (×) op modals/meldingen → vaak te klein
- **Icoon-knoppen** zonder voldoende padding
- **Paginering** → vaak kleine links dicht bij elkaar
- **Social media-iconen** → vaak klein
- **Formulier-selectievakjes en radiobuttons**

---

## De 6 auditgebieden

### 1. KNOPPEN EN ICOON-KNOPPEN

```
Controleer:
- Hebben alle knoppen een klikbaar gebied van ≥ 24×24px?
- Icoon-knoppen: is er voldoende padding rond het icoon?
- Sluit-knoppen (×) op modals, cookie-banners, meldingen

Veelvoorkomend probleem:
Een sluit-knop (×) van 20×20px zonder extra padding
→ FAIL (tenzij spacing exception van toepassing)
```

### 2. LINKS

```
Controleer:
- Links in navigatie: ≥ 24px hoog? (breedte vaak voldoende)
- Links in lijsten: voldoende hoogte en spacing?
- Inline links in tekst → uitzondering (inline)

Let op: links in een navigatiemenu zijn NIET inline
(ze staan niet in een zin). Deze moeten ≥ 24×24px zijn
of voldoende spacing hebben.
```

### 3. FORMULIERELEMENTEN

```
Controleer:
- Selectievakjes (checkboxen): standaard vaak 13-16px
  → als de auteur ze niet heeft aangepast: user agent exception
  → als ze zijn aangepast via CSS: moet ≥ 24×24px zijn
- Radiobuttons: zelfde als selectievakjes
- Invoervelden: meestal voldoende groot
- Datum-pickers: kleine knoppen voor dag-selectie

Tip: als het <label> element correct is gekoppeld,
is het HELE label + veld samen het klikbare gebied.
Dit kan het target veel groter maken.
```

### 4. PAGINERING

```
Pagineringsknoppen (1, 2, 3, ..., volgende):
- Vaak kleine klikgebieden dicht bij elkaar
- Controleer zowel de grootte als de spacing

Voorbeeld failure:
[1] [2] [3] [4] [5]
Elk 20×20px met 4px tussenruimte
→ FAIL (te klein EN te dicht bij elkaar)
```

### 5. SOCIAL MEDIA EN DEEL-ICONEN

```
Social media-iconen (Facebook, Twitter, LinkedIn, etc.):
- Vaak 16-20px iconen
- Controleer of padding het klikbare gebied vergroot
- Controleer de spacing tussen de iconen
```

### 6. BROODKRUIMELPAD

```
Broodkruimelpad-links:
- Staan ze in een zin-achtige structuur?
  → Kan als inline worden beschouwd
- Zijn ze gescheiden door tekst (bijv. ">")?
  → Die tekst is geen target
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Cookie-banner sluit-knop

```
Veel cookie-banners hebben een kleine sluit-knop (×).
Controleer:
- Is het klikbare gebied ≥ 24×24px?
- Vaak is het icoon klein maar is er padding → meten!
```

### Patroon B: Navigatie-items

```
Hoofdnavigatie: meestal voldoende groot (links met padding).
Subnavigatie/footer-links: kunnen te klein zijn.

Controleer vooral de footer met veel kleine links
dicht bij elkaar.
```

### Patroon C: Kaart-integratie

```
Google Maps of andere kaart-integraties:
- Zoom-knoppen (+/-): vallen onder user agent of essential
- Eigen kaart-iconen: controleer de grootte
- Pinnen op de kaart: essential exception (positie is essentieel)
```

### Patroon D: Formulier met selectievakjes

```
Afspraakmaken-formulier of contactformulier:
- Standaard browser-checkboxen → user agent exception
  (mits niet aangepast)
- Custom checkboxen → moeten ≥ 24×24px zijn
- Label gekoppeld aan checkbox → het hele label is
  klikbaar, wat het target vergroot
```

### Patroon E: Nieuwsoverzicht paginering

```
Paginering onder nieuwsoverzicht:
"< Vorige  1  2  3  4  5  Volgende >"
Controleer de grootte en spacing van elke link.
```

---

## Onderscheid met andere SC's

| SC | Relatie met 2.5.8 |
|----|------------------|
| **2.5.5** | Target Size (Enhanced): 44×44px minimum (AAA). 2.5.8 is de AA-variant met 24×24px. |
| **2.5.8** | **Target Size (Minimum): 24×24px minimum (AA).** |
| **1.4.4** | Resize Text: tekst tot 200% vergroten. Target size gaat over het klikbare gebied, niet tekst-zoom. |
| **1.4.10** | Reflow: layout bij 320px. Target size gaat over individuele elementen, niet layout. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| C42 | min-height en min-width gebruiken op target-containers voor voldoende spacing |

### Failure Techniques

Er zijn geen formeel gedefinieerde failure techniques voor SC 2.5.8, maar een target < 24×24px zonder dat een uitzondering van toepassing is, is een failure.

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-6: knoppen | links | formulierelementen |
                  paginering | social media | broodkruimelpad]
Element:         [beschrijving]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL | N.v.t.]

Gemeten grootte: [breedte × hoogte in CSS-pixels]
Minimum vereist: [24 × 24 CSS-pixels]

Uitzondering
gecontroleerd:   [spacing / equivalent / inline / user agent /
                  essential / geen]
Uitzondering
van toepassing:  [ja/nee — toelichting]

Probleem:        [specifieke beschrijving]
Aanbeveling:     [concrete oplossing — bijv. padding toevoegen,
                  min-width/min-height instellen]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Sluit-knoppen (×) op modals en cookie-banners** — vaak 16-20px zonder extra padding
2. **Icoon-knoppen zonder padding** — het icoon is het hele klikbare gebied
3. **Paginering-links te klein en te dicht bij elkaar** — noch groot genoeg, noch voldoende spacing
4. **Footer-links** — veel kleine links dicht bij elkaar
5. **Social media-iconen** — vaak te klein
6. **Custom checkboxen/radiobuttons** — aangepast via CSS maar niet groot genoeg gemaakt

### Snelle audit-methode

1. Open DevTools
2. Selecteer interactieve elementen die visueel klein lijken
3. Bekijk het box model: content + padding = klikbaar gebied
4. Is het ≥ 24×24px? → PASS
5. Zo nee: controleer of een uitzondering van toepassing is

**Bookmarklet:** Er zijn accessibility-bookmarklets beschikbaar die target-grootten visueel markeren, maar deze zijn niet altijd betrouwbaar. Handmatige meting via DevTools is betrouwbaarder.

### Technisch of redactioneel issue?

SC 2.5.8 is vrijwel altijd een **technisch issue**:
- Target-grootten worden bepaald door CSS en HTML-structuur
- Padding, min-width, min-height zijn template-verantwoordelijkheid
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

**Uitzondering:** Als een redacteur een afbeelding als link plaatst zonder voldoende grootte → deels redactioneel.

### Wie heeft er baat bij?

- **Mensen met motorische beperkingen** — trillingen, beperkte handfunctie, gebruik van alternatieve invoer
- **Ouderen** — afnemende motorische precisie
- **Touchscreen-gebruikers** — vingertoppen zijn groter dan een muiscursor
- **Alle gebruikers** — grotere targets zijn voor iedereen makkelijker

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**Let op:** SC 2.5.8 is nieuw in WCAG **2.2** (oktober 2023). De Toegankelijkheidswet verwijst naar EN 301 549, die is bijgewerkt naar WCAG 2.2. SC 2.5.8 is daarmee ook verplicht voor Nederlandse overheidswebsites.

**SC 2.5.8 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 2.5.8:** https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- **Technique C42 (min-height/min-width):** https://www.w3.org/WAI/WCAG22/Techniques/css/C42
- **TPGi — How to test 2.5.8:** https://vispero.com/resources/how-to-test-2-5-8-target-size-minimum/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
