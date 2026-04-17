---
name: wcag-1-4-3-contrast-minimum
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.4.3 (Contrast Minimum) on Dutch government websites. Use when conducting accessibility audits to verify that text and images of text have sufficient contrast ratio against their background — at least 4.5:1 for normal text and 3:1 for large text (18pt / 14pt bold). Covers body text, headings, links, placeholder text, text on images, text on gradients, button text, footer text, and common exceptions (logos, decorative text, inactive components). Includes tools for measuring contrast and the distinction with SC 1.4.6 (Enhanced) and SC 1.4.11 (Non-text Contrast). Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.4.3 Contrast (minimum) — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.4.3 (Niveau AA):**
De visuele weergave van tekst en afbeeldingen van tekst heeft een contrastverhouding van ten minste 4.5:1, met de volgende uitzonderingen:

- **Grote tekst:** Grote tekst en afbeeldingen van grote tekst hebben een contrastverhouding van ten minste 3:1.
- **Incidenteel:** Tekst of afbeeldingen van tekst die deel uitmaken van een inactief UI-component, die puur decoratief zijn, die voor niemand zichtbaar zijn, of die deel uitmaken van een afbeelding die aanzienlijke andere visuele content bevat, hebben geen contrasteis.
- **Logo's:** Tekst die onderdeel is van een logo of merknaam heeft geen contrasteis.

**Kernprincipe:** Tekst moet voldoende contrast hebben met de achtergrond zodat mensen met matig verminderd gezichtsvermogen (die geen contrastverhogende hulptechnologie gebruiken) het kunnen lezen.

---

## De twee contrasteisen

| Teksttype | Minimale contrastverhouding | Definitie |
|-----------|---------------------------|-----------|
| **Normale tekst** | **4.5:1** | Alle tekst kleiner dan 18pt (24px) of kleiner dan 14pt bold (19px) |
| **Grote tekst** | **3:1** | Tekst van minimaal 18pt (24px) of minimaal 14pt bold (19px) |

### Wat is "grote tekst"?

| Eigenschap | Waarde |
|-----------|--------|
| Normaal gewicht (niet-vet) | ≥ 18pt = ≥ 24px |
| Vet (bold, font-weight ≥ 700) | ≥ 14pt = ≥ 18.5px (afgerond 19px) |

**Omrekeningsfactor:** 1pt = 1.333 CSS pixels

**Noten:**
- De lettergrootte is de grootte bij aflevering, niet na herschaling door de gebruiker
- Lettertypen met buitengewoon dunne lijnen of ongebruikelijke kenmerken zijn moeilijker te lezen, vooral bij lager contrast
- De contrastverhoudingen 3:1 en 4.5:1 zijn drempelwaarden — niet afronden (4.499:1 voldoet NIET aan de 4.5:1 eis)
- Met dikgedrukte tekst bedoelen we `font-weight: bold`, `font-weight: 700` of hoger, of de bold-variant van een font
- Soms staat de font-size in `em` of `rem`. Klik dan in de DevTools inspector rechts op "Computed" (of "Berekend") — daar staat de font-size in px
- In een PDF-bestand kun je de font-size alleen met bepaalde Adobe-software bekijken (bijv. Acrobat Pro), niet met de gratis Adobe Reader

---

## Drie uitzonderingen

### 1. Incidentele tekst
Geen contrasteis voor:
- Tekst in **inactieve UI-componenten** (disabled buttons, grayed-out inputs)
- **Puur decoratieve** tekst (achtergrondpatroon van woorden die geen informatie dragen)
- Tekst die **voor niemand zichtbaar** is (verborgen content)
- Tekst die **deel uitmaakt van een afbeelding** met aanzienlijke andere visuele content (bijv. tekst op een foto van een straat waar de foto het belangrijkste is)

### 2. Logo's en merknamen
Tekst die onderdeel is van een logo of merknaam heeft geen contrasteis. Dit geldt voor:
- Het gemeentelogo
- Merknamen van externe partijen
- Tekst die integraal onderdeel is van een beeldmerk

### 3. Tekst die de gebruiker niet kan zien
Tekst die via CSS verborgen is (display: none, visibility: hidden) of via aria-hidden="true" voor hulptechnologie verborgen is, heeft geen contrasteis — mits niemand de tekst kan waarnemen.

---

## Beslisboom

```
Tekst of afbeelding van tekst gevonden
│
├─ Is het een logo of merknaam?
│  └─ JA → Geen contrasteis (uitzondering)
│
├─ Is het inactief, decoratief, of onzichtbaar?
│  └─ JA → Geen contrasteis (uitzondering)
│
├─ Is de tekst "groot"? (≥ 18pt of ≥ 14pt bold)
│  ├─ JA → Minimaal 3:1 contrast vereist
│  └─ NEE → Minimaal 4.5:1 contrast vereist
│
├─ Meet de contrastverhouding (voorgrondkleur vs. achtergrondkleur)
│  ├─ Voldoet aan de eis → PASS
│  └─ Voldoet niet → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle tekst op de pagina
Scan alle zichtbare tekst: koppen, bodytekst, links, knoppen, labels, foutmeldingen, footer, navigatie, placeholder-tekst, tekst op afbeeldingen.

### Stap 2: Bepaal per tekstelement of het een uitzondering is
- Logo/merknaam → uitzondering
- Inactief/decoratief/onzichtbaar → uitzondering
- Overige tekst → moet worden getoetst

### Stap 3: Bepaal of de tekst "groot" of "normaal" is
- ≥ 18pt (24px) of ≥ 14pt bold (19px) → groot → 3:1 eis
- Kleiner → normaal → 4.5:1 eis

### Stap 4: Meet de contrastverhouding
Gebruik een contrasttool om de verhouding te meten tussen:
- De **voorgrondkleur** (tekstkleur) → uit de CSS `color` property
- De **achtergrondkleur** → uit de CSS `background-color` (of achtergrondafbeelding)

**Let op:** Meet de kleuren uit de CSS/broncode, niet van het scherm (anti-aliasing kan de weergave beïnvloeden).

### Stap 5: Beoordeel het resultaat
- Contrastverhouding ≥ vereiste drempel → PASS
- Contrastverhouding < vereiste drempel → FAIL
- 4.499:1 voldoet NIET aan 4.5:1 (niet afronden)

### Notatie van contrastwaarden

**Noteer contrastwaarden altijd met 1 decimaal**, ook als het een rond getal is:
- Correct: 3,0:1 (of 3.0:1 bij Engelstalige rapporten)
- Fout: 3:1

**Bij heel laag contrast:** Noteer als "minder dan 1,1:1". Een contrast van 1,0:1 betekent dat er helemaal geen contrast is (identieke kleuren).

### Contrastswitch

Het aanbieden van een contrastswitch (schakelaar om het contrast van de hele website aan te passen) is een goede aanvullende oplossing. Voorwaarden:
- De switch zelf moet **toegankelijk** zijn (toetsenbord-bedienbaar, voldoende contrast)
- De alternatieve weergave moet een **volledig equivalent** zijn qua informatie en functionaliteit
- **Alle teksten** moeten voldoen als de switch aan staat — ook teksten in afbeeldingen (deze worden vaak vergeten)

**Let op:** Een contrastswitch is geen vervanging voor de basiseis. De standaardweergave moet bij voorkeur ook voldoen.

---

## De 8 auditgebieden

### 1. BODYTEKST

De hoofdtekst op de pagina — de meest voorkomende tekst.

```
Typisch op gemeente-websites:
- Bodytekst: donkergrijs (#333333) op wit (#FFFFFF)
  → Contrast: 12.63:1 → PASS ✓
- Bodytekst: lichtgrijs (#999999) op wit (#FFFFFF)
  → Contrast: 2.85:1 → FAIL ✗ (moet 4.5:1 zijn)
```

### 2. KOPPEN (HEADINGS)

Koppen zijn vaak groot genoeg om als "grote tekst" te kwalificeren (3:1).

```
Controleer:
- Is de kop ≥ 24px (of ≥ 19px bold)?
  → JA: 3:1 eis
  → NEE: 4.5:1 eis
- Let op: subkoppen (h3, h4) zijn soms klein genoeg
  om onder de 4.5:1 eis te vallen
```

### 3. LINKS

Links moeten voldoende contrast hebben met hun achtergrond. Dit geldt voor:
- **Niet-gevolgde links** (standaardkleur)
- **Gevolgde links** (visited-kleur) — ook deze moeten voldoende contrast hebben

**Uitzondering:** Een link die (muis- of tab)focus heeft, hoeft niet aan deze eis te voldoen.

```
Twee contrastverhoudingen om te meten:
1. Link vs. achtergrond: ≥ 4.5:1 (of 3:1 voor grote links)
   → SC 1.4.3

2. Link vs. omringende tekst: ≥ 3:1
   → SC 1.4.1 (gebruik van kleur) — apart criterium
```

**Let op:** Dit zijn twee verschillende metingen voor twee verschillende succescriteria. Controleer bij links zowel de standaardkleur als de visited-kleur.

### 4. PLACEHOLDER-TEKST

Placeholder-tekst in formuliervelden is vaak lichtgrijs en voldoet vaak niet.

```html
<!-- Typisch probleem: lichtgrijze placeholder -->
<input type="text" placeholder="Zoeken..."
       style="color: #999;">
<!-- #999999 op wit (#FFFFFF) = 2.85:1 → FAIL -->

<!-- PASS: donkerdere placeholder -->
<input type="text" placeholder="Zoeken..."
       style="color: #767676;">
<!-- #767676 op wit (#FFFFFF) = 4.54:1 → PASS -->
```

**Noot:** Placeholder-tekst is wel degelijk tekst die de gebruiker leest en moet voldoen aan SC 1.4.3. Browsers tonen placeholder standaard in een lichte kleur die vaak niet voldoet.

### 5. TEKST OP AFBEELDINGEN

Tekst die over een foto of achtergrondafbeelding wordt weergegeven.

```
Controleer:
- Is er een semi-transparante overlay achter de tekst?
- Wat is het laagste contrast op enig punt van de achtergrond?
- Gebruik het SLECHTSTE punt voor de beoordeling

Veelvoorkomend op gemeente-websites:
- Hero-afbeelding met witte tekst eroverheen
- Bannertekst op foto
- Tekst in een card met achtergrondafbeelding
```

```html
<!-- FAIL (F83): tekst op drukke achtergrondafbeelding
     zonder overlay -->
<div style="background-image: url('foto.jpg');">
  <h1 style="color: white;">Welkom in onze gemeente</h1>
</div>

<!-- PASS: tekst op afbeelding met donkere overlay -->
<div style="background-image: url('foto.jpg');">
  <div style="background: rgba(0,0,0,0.7);">
    <h1 style="color: white;">Welkom in onze gemeente</h1>
  </div>
</div>
```

### 6. KNOPTEKST (BUTTONS)

Tekst in knoppen moet voldoende contrast hebben met de knopachtergrond.

```
Controleer:
- Tekst vs. knopachtergrondkleur
- Niet: knopachtergrond vs. pagina-achtergrond
  (dat valt onder SC 1.4.11 Non-text Contrast)

Voorbeeld:
- Witte tekst (#FFFFFF) op blauwe knop (#0066CC)
  → Contrast: 5.74:1 → PASS ✓
- Witte tekst (#FFFFFF) op lichtblauwe knop (#66AAFF)
  → Contrast: 2.45:1 → FAIL ✗
```

### 7. FOOTER-TEKST

Footers bevatten vaak lichte tekst op donkere achtergrond. De kleinere lettergrootte maakt de 4.5:1 eis extra relevant.

```
Controleer:
- Footertekst vs. footerachtergrondkleur
- Footerlinks vs. footerachtergrondkleur
- Let op: footer-tekst is vaak kleiner dan bodytekst
```

### 8. TEKST OP GRADIËNTEN

Tekst op achtergronden met een kleurverloop (gradient).

```
Controleer:
- Meet het contrast op het SLECHTSTE punt van het verloop
  (waar de achtergrondkleur het dichtst bij de tekstkleur ligt)
- Als de tekst over het hele verloop loopt, meet op meerdere
  punten
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: SIMsite/Drupal standaardkleuren

Veel SIMsite-gebaseerde gemeente-websites gebruiken een vast kleurschema. Controleer:
- De huisstijlkleuren van de gemeente (vaak blauw, groen, of oranje)
- Tekst in de huisstijlkleur vs. achtergrond
- Links in de huisstijlkleur vs. achtergrond

### Patroon B: Hero-banner met tekst op foto

```
Controleer:
- Is er een overlay (donkere/lichte laag over de foto)?
- Wat is het contrast op het slechtste punt?
- Verandert de achtergrondafbeelding per pagina?
  (het contrast kan per afbeelding verschillen)
```

### Patroon C: Cookie-banner

Cookie-banners hebben vaak een donkere achtergrond met lichte tekst. Controleer:
- Tekst in de banner vs. bannerachtergrond
- Linktekst vs. bannerachtergrond
- Knoptekst vs. knopachtergrond

### Patroon D: Formulieren

```
Controleer:
- Labels vs. achtergrond
- Placeholder-tekst vs. veldachtergrond
- Foutmeldingstekst vs. achtergrond
- Helptekst vs. achtergrond (vaak kleiner en lichter)
```

### Patroon E: Breadcrumbs en metadata

Breadcrumbs, datumstempels en metadata-tekst zijn vaak kleiner en lichter dan bodytekst.
- Deze tekst is bijna altijd "normale tekst" (< 18pt)
- Dus 4.5:1 eis geldt

### Patroon F: Teaserkaarten

Kaarten op overzichtspagina's bevatten:
- Koptekst (vaak groot → 3:1)
- Beschrijvingstekst (vaak normaal → 4.5:1)
- Datumtekst (vaak klein en licht → 4.5:1)
- Categorielabel (soms met gekleurde achtergrond)

---

## Specifieke situaties

### Voorgrondkleur zonder achtergrondkleur (of omgekeerd)

**Failure F24:** Als een voorgrondkleur wordt opgegeven maar geen achtergrondkleur (of omgekeerd), is dit een failure. De achtergrondkleur van de gebruiker is onbekend en kan niet worden geëvalueerd.

```css
/* FAIL (F24): tekstkleur zonder achtergrondkleur */
body { color: #333333; }
/* Geen background-color opgegeven */

/* PASS: beide opgegeven */
body { color: #333333; background-color: #FFFFFF; }
```

### Achtergrondafbeelding zonder fallback-kleur (F83)

```css
/* FAIL (F83): achtergrondafbeelding kan niet laden */
.banner {
  background-image: url('donkere-foto.jpg');
  color: white;
}
/* Als de afbeelding niet laadt, witte tekst op standaard achtergrond */

/* PASS: fallback achtergrondkleur */
.banner {
  background-color: #003366;
  background-image: url('donkere-foto.jpg');
  color: white;
}
```

### Anti-aliasing en dunne lettertypen

Browsers passen anti-aliasing toe op tekst, wat de weergave kan beïnvloeden. Bij het meten van contrast moet je de kleuren uit de CSS/broncode gebruiken, niet de weergegeven pixels op het scherm. Dunne of ongebruikelijke lettertypen kunnen in de praktijk een veel lager contrast hebben dan de CSS-waarden suggereren.

---

## Onderscheid met andere SC's

| SC | Contrasteis | Toepassing |
|----|-------------|-----------|
| **1.4.3** | **4.5:1 normaal / 3:1 groot** | **Tekst en afbeeldingen van tekst (Niveau AA)** |
| **1.4.6** | 7:1 normaal / 4.5:1 groot | Tekst — versterkt contrast (Niveau AAA) |
| **1.4.11** | 3:1 | Niet-tekstueel contrast: UI-componenten en grafische objecten (Niveau AA) |
| **1.4.1** | — | Kleur niet als enige visuele middel (geen specifieke ratio) |

**Belangrijk:**
- SC 1.4.3 gaat over **tekst** vs. achtergrond
- SC 1.4.11 gaat over **UI-componenten en grafische objecten** vs. aangrenzende kleuren
- SC 1.4.1 gaat over **kleur als informatie-drager**, niet over leesbaarheid

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: Tekst op effen achtergrond**

| Code | Beschrijving |
|------|-------------|
| G18 | Contrastverhouding van minimaal 4.5:1 tussen tekst en achtergrond |
| G145 | Contrastverhouding van minimaal 3:1 tussen tekst en achtergrond (grote tekst) |
| G148 | Geen achtergrondkleur of tekstkleur opgeven (standaarden gebruiken) |
| G174 | Een schakelaar bieden waarmee de gebruiker naar voldoende contrast kan wisselen |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F24 | Voorgrondkleur opgeven zonder achtergrondkleur (of omgekeerd) |
| F83 | Achtergrondafbeelding die onvoldoende contrast biedt met voorgrondtekst |

---

## Meettools

| Tool | Type | URL |
|------|------|-----|
| WCAG Color Contrast Checker | Browser-extensie | Via Chrome extensie-store |
| Colour Contrast Analyser (CCA) | Desktop app | https://www.tpgi.com/color-contrast-checker/ |
| WebAIM Contrast Checker | Online | https://webaim.org/resources/contrastchecker/ |
| axe DevTools | Browser-extensie | Via Chrome/Firefox extensie-store |
| WAVE | Browser-extensie | https://wave.webaim.org/ |
| Chrome DevTools | Ingebouwd | Element inspecteren → kleur → contrast info |

**Tip:** Gebruik de **WCAG Color Contrast Checker extensie** en de **Colour Contrast Analyser (CCA)** samen. Achterhaal waar nodig de kleurcodes uit CSS via de browserinspector.

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-8: bodytekst | koppen | links | placeholder |
                  tekst op afbeelding | knoppen | footer | gradiënten]
Element:         [beschrijving van het tekstelement]
Locatie:         [positie op pagina]
Beoordeling:     [PASS | FAIL | N.v.t. (uitzondering)]

Tekstkleur:      [hex-waarde, bijv. #333333]
Achtergrondkleur:[hex-waarde, bijv. #FFFFFF]
Lettergrootte:   [px / pt + bold/normaal]
Teksttype:       [normaal / groot]
Vereist contrast:[4.5:1 / 3:1]
Gemeten contrast:[X.XX:1]

Uitzondering:    [geen / logo / inactief / decoratief]
Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [G18 / G145 / F24 / F83]
Aanbeveling:     [concrete oplossing — nieuwe kleurwaarde]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Lichtgrijze bodytekst** — #999 of #AAA op witte achtergrond (voldoet niet aan 4.5:1)
2. **Placeholder-tekst te licht** — standaard browser-placeholder is vaak onvoldoende
3. **Tekst op hero-afbeelding** — witte tekst op wisselende foto's zonder overlay
4. **Footer-tekst te licht** — grijze tekst op donkergrijze achtergrond
5. **Foutmeldingsteksten in formulieren** — rode foutmeldingen die onvoldoende contrast hebben met de achtergrond
6. **Datums bij nieuwsberichten** — datum/tijdstempel in lichtgrijs
7. **Helptekst onder formuliervelden** — bewust licht gemaakt, maar moet nog steeds aan 4.5:1 voldoen
8. **Breadcrumbs en metadata** — kleine, lichte tekst die onder de 4.5:1 drempel valt
9. **Knoptekst met onvoldoende contrast** — witte tekst op lichtgekleurde huisstijlknop
10. **Voorgrondkleur zonder achtergrondkleur** — of omgekeerd (F24)
11. **Teksten in afbeeldingen** — ook bij gebruik van een contrastswitch worden deze vaak vergeten
12. **Stappenplan/voortgangsindicatoren** — niet-actieve stappen in zeer lichtgrijs

### Meet altijd in Chrome

In verband met mogelijke browserverschillen: doe contrastmetingen altijd in **Chrome**. Let ook op computer- en browserinstellingen (schermresolutie, zoom-niveau, nachtmodus).

### Snelle audit-aanpak

1. **Automatische scan:** Gebruik axe DevTools of WAVE om de meeste contrastissues automatisch te detecteren
2. **Handmatige check:** Controleer tekst op afbeeldingen, gradiënten, en situaties die automatische tools missen
3. **Steekproef:** Focus op de meest voorkomende teksttypen (body, koppen, links, footer, knoppen)

### Technisch of redactioneel issue?

SC 1.4.3 is bijna altijd een **technisch/design issue**:
- Kleurkeuzes worden gemaakt in het CSS-thema/template
- De gemeente kan dit meestal niet zelf aanpassen in het CMS
- Bij Shift2-audits valt dit typisch onder de **technische audit** (Cardan/template)

**Uitzondering:** Tekst op afbeeldingen kan soms een redactioneel issue zijn (gemeente kiest een te lichte foto als achtergrond).

### Wie heeft er baat bij?

- **Slechtzienden** — mensen met matig verminderd gezichtsvermogen (ca. 20/40 visus) die geen contrastverhogende hulpmiddelen gebruiken
- **Ouderen** — leeftijdsgerelateerd verminderd gezichtsvermogen
- **Kleurenblinden** — kleurdeficiënties beïnvloeden het waargenomen contrast
- **Iedereen** — in situaties met schittering, zonlicht op het scherm, of slechte beeldschermkwaliteit

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.4.3 is Niveau AA — dus verplicht.**

SC 1.4.6 (Contrast Enhanced, 7:1 / 4.5:1) is Niveau AAA en niet verplicht, maar wel aanbevolen.

---

## Bronnen

- **WCAG 2.2 Understanding 1.4.3:** https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- **Technique G18 (4.5:1 contrast):** https://www.w3.org/WAI/WCAG22/Techniques/general/G18
- **Technique G145 (3:1 contrast):** https://www.w3.org/WAI/WCAG22/Techniques/general/G145
- **Failure F24 (kleur zonder achtergrond):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F24
- **Failure F83 (achtergrondafbeelding):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F83
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
