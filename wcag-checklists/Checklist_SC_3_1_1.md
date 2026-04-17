---
name: wcag-3-1-1-language-of-page
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.1.1 (Language of Page) on Dutch government websites. Use when conducting accessibility audits to verify that the default human language of each web page is programmatically determined via the lang attribute on the html element. Covers lang attribute, BCP 47 language tags, PDF document language, common failures, and gemeente-specific patterns. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.1.1 Taal van de pagina — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.1.1 (Niveau A):**
De standaard menselijke taal van elke webpagina kan programmatisch worden bepaald.

**Kernprincipe:** Elke webpagina moet in de code aangeven welke taal de hoofdtaal van de pagina is. Zo kunnen screenreaders de juiste uitspraakregels laden, browsers de juiste tekens tonen, en media-spelers de juiste ondertitels weergeven.

**In de praktijk:** Het `lang` attribuut op het `<html>` element.

```html
<html lang="nl">
```

---

## Waarom is dit belangrijk?

### Screenreaders

Een screenreader moet weten in welke taal de pagina is geschreven om de tekst correct uit te spreken. Als een Nederlandse pagina geen `lang="nl"` heeft, of foutief `lang="en"`, dan:
- Probeert de screenreader Nederlandse woorden met Engelse uitspraakregels voor te lezen
- Het resultaat is onverstaanbaar
- De gebruiker begrijpt de content niet

### Braille-vertaling

Braille-vertaalsoftware gebruikt de taalinformatie om:
- De juiste stuurcodes in te voegen voor letters met accenten
- Verkeerde Grade 2 braille-samentrekkingen te voorkomen

### Visuele weergave

Browsers gebruiken de taalinformatie voor:
- Correcte weergave van tekens en scripts
- Correcte woordafbreking (hyphenation)
- Correcte aanhalingstekens (Engels: "…" vs. Nederlands: „…")

---

## De technische eis

### HTML: het `lang` attribuut op `<html>`

```html
<!-- PASS: Nederlands als paginataal -->
<html lang="nl">

<!-- PASS: Nederlands (België) als paginataal -->
<html lang="nl-BE">

<!-- PASS: Engels als paginataal -->
<html lang="en">
```

### Geldige taalcodes (BCP 47)

De waarde van het `lang` attribuut moet een geldige **BCP 47** taalcode zijn:

| Code | Taal |
|------|------|
| `nl` | Nederlands |
| `nl-NL` | Nederlands (Nederland) |
| `nl-BE` | Nederlands (België) |
| `en` | Engels |
| `en-US` | Engels (VS) |
| `en-GB` | Engels (VK) |
| `de` | Duits |
| `fr` | Frans |
| `fy` | Fries |
| `tr` | Turks |
| `ar` | Arabisch |

**Basisregel:** De korte code (bijv. `nl`) is voldoende. De regiocode (bijv. `nl-NL`) mag, maar is niet vereist.

### Meertalige pagina's

Als een pagina meerdere talen bevat, is de standaardtaal de taal die het **meest wordt gebruikt**. Als meerdere talen gelijk vertegenwoordigd zijn, kies dan de taal die als eerste wordt gebruikt.

**Hoe bepaal je de "meest gebruikte taal"?** Kijk niet alleen naar de bodytekst, maar ook naar de taal van het hoofdmenu, footermenu's, logo's en zoekvelden. De standaardtaal is de taal waarin de meeste content van de website is geschreven, inclusief deze structurele elementen.

```html
<!-- Pagina is overwegend Nederlands met wat Engels -->
<html lang="nl">
  <body>
    <p>Welkom bij de gemeente IJsselstein.</p>
    <p lang="en">Welcome to the municipality of IJsselstein.</p>
  </body>
</html>
```

**Let op:** Het markeren van anderstalige passages valt onder SC 3.1.2 (Taal van onderdelen, Niveau AA).

---

## Beslisboom

```
Webpagina gevonden
│
├─ Heeft het <html> element een lang attribuut?
│  └─ NEE → FAIL (ontbrekend lang attribuut)
│
└─ JA → Is het lang attribuut niet-leeg?
   │
   ├─ NEE → FAIL (leeg lang attribuut)
   │
   └─ JA → Is de waarde een geldige BCP 47 taalcode?
      │
      ├─ NEE → FAIL (ongeldige taalcode, bijv. "dutch")
      │
      └─ JA → Komt de taalcode overeen met de
               hoofdtaal van de pagina?
         │
         ├─ NEE → FAIL (verkeerde taal aangegeven)
         │
         └─ JA → PASS
```

---

## Stapsgewijze auditprocedure

### Stap 1: Controleer het `lang` attribuut

Open de broncode van de pagina (Ctrl+U) of DevTools en controleer:

```html
<html lang="nl">
```

- Is er een `lang` attribuut op het `<html>` element?
- Is de waarde niet-leeg?
- Is het een geldige BCP 47 code?
- Komt het overeen met de daadwerkelijke taal van de pagina?

### Stap 2: Gebruik geautomatiseerde tools

Dit criterium is **volledig automatisch testbaar**. Gebruik:
- **axe DevTools** — detecteert ontbrekend of ongeldig lang attribuut
- **WAVE** — meldt ontbrekend of fout taalattribuut
- **Lighthouse** — controleert de aanwezigheid van lang
- **W3C Validator** — controleert de aanwezigheid van lang

Geautomatiseerde tools hebben bijna 100% nauwkeurigheid voor dit criterium. Handmatig hoeft alleen gecontroleerd te worden of de taalcode daadwerkelijk bij de content past (bijv. `lang="en"` op een Nederlandse pagina).

### Stap 3: Controleer PDF-documenten

PDF-documenten moeten ook een taalinformatie hebben:
- Open het PDF-document in Adobe Acrobat
- Ga naar Bestand → Eigenschappen → Geavanceerd → Taal
- Is er een taal ingesteld?
- Komt de taal overeen met de inhoud van het document?

### Stap 4: Controleer meerdere pagina's

Controleer niet alleen de homepage, maar ook:
- Subpagina's
- Pagina's in een andere taal (bijv. Engelse versie van de site)
- Formulierpagina's
- PDF-documenten

---

## De 4 auditgebieden

### 1. HTML-PAGINA'S

```
Controleer:
- <html lang="nl"> aanwezig op alle Nederlandstalige pagina's
- Geldige BCP 47 code
- Code komt overeen met de content

Veelgemaakte fouten:
✗ <html> (geen lang attribuut)
✗ <html lang=""> (leeg)
✗ <html lang="dutch"> (ongeldig — moet "nl" zijn)
✗ <html lang="en"> op een Nederlandse pagina
✗ lang alleen op <body> i.p.v. op <html>
```

### 2. ANDERSTALIGE VERSIES

```
Veel gemeente-websites bieden content in andere talen:
- Engelse versie → <html lang="en">
- Duitse versie → <html lang="de">
- Turkse versie → <html lang="tr">
- Arabische versie → <html lang="ar">
- Friese versie → <html lang="fy">

Controleer of elke taalversie de juiste taalcode heeft.
Als de Engelse versie <html lang="nl"> heeft → FAIL
```

### 3. PDF-DOCUMENTEN

```
PDF-documenten moeten een standaardtaal hebben:
- Via de /Lang entry in de document catalog
- In Adobe Acrobat: Bestand → Eigenschappen → Geavanceerd

PASS:
PDF met Taal ingesteld op "nl-NL" of "nl"

FAIL:
PDF zonder taalinformatie
PDF met verkeerde taalcode
```

### 4. IFRAMES

```
Pagina's in iframes zijn aparte documenten en moeten
ook een lang attribuut hebben.

Controleer:
- Heeft de pagina binnen het iframe een <html lang="...">?
- Komt de taalcode overeen met de content in het iframe?

Let op: bij externe iframes (bijv. YouTube) heb je
geen controle over het lang attribuut van de ingebedde
pagina. Dit valt buiten de verantwoordelijkheid van de
auteur, maar vermeld het wel in het rapport.
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: SIMsite/Drupal standaard

SIMsite-gebaseerde gemeente-websites zetten het `lang` attribuut normaal gesproken automatisch op basis van de site-configuratie. Controleer:
- Is `lang="nl"` aanwezig op alle pagina's?
- Wordt het automatisch goed gezet door het CMS?

### Patroon B: Meertalige website

Sommige gemeenten bieden pagina's in meerdere talen:
- Nederlands (standaard)
- Engels (voor expats)
- Duits (grensgemeenten)
- Turks, Arabisch, etc.

```
Controleer of bij het wisselen van taal ook het lang
attribuut op <html> meewisselt.
Als je de Engelse versie opent maar <html lang="nl">
nog steeds aanwezig is → FAIL
```

### Patroon C: Fries

Friese gemeenten (bijv. in Fryslân) hebben soms Friese content:
- De hoofdtaal van de pagina is Fries → `lang="fy"`
- Of de pagina is overwegend Nederlands met Friese passages → `lang="nl"` met `lang="fy"` op de Friese passages (SC 3.1.2)

---

## Veelvoorkomende fouten

1. **`lang` attribuut ontbreekt** — de meest voorkomende fout. Templates of starttemplates laten het weg.
2. **Ongeldige taalcode** — `lang="dutch"` of `lang="NL"` i.p.v. `lang="nl"`. Codes zijn niet hoofdlettergevoelig, maar "dutch" is geen geldige BCP 47 code.
3. **Verkeerde taal aangegeven** — `lang="en"` op een Nederlandse pagina. Dit is erger dan het weglaten — je geeft actief verkeerde informatie.
4. **`lang` alleen op `<body>`** — het attribuut moet op `<html>` staan, niet op `<body>`.
5. **PDF zonder taalinformatie** — teams repareren HTML-pagina's maar vergeten PDF-documenten.
6. **Anderstalige versie met verkeerd `lang`** — de taalcode wisselt niet mee bij het schakelen naar een andere taal.

---

## Onderscheid met andere SC's

| SC | Relatie met 3.1.1 |
|----|------------------|
| **3.1.1** | **Taal van de pagina: standaardtaal van de hele pagina in `lang` op `<html>`.** |
| **3.1.2** | Taal van onderdelen (AA): taal van passages/zinnen in een andere taal. Niet het `<html>` element maar elementen binnen de pagina (bijv. `<p lang="en">`). |

**Aanbeveling W3C:** Voor meertalige sites wordt sterk aanbevolen om ook SC 3.1.2 te volgen, zelfs als je alleen op Niveau A mikt.

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| H57 | Het `lang` attribuut gebruiken op het `<html>` element |
| PDF16 | De standaardtaal instellen via de /Lang entry in de PDF-documentcatalogus |
| PDF19 | De taal specificeren voor een passage of zin in PDF-documenten |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| SVR5 | De standaardtaal specificeren in de HTTP-header |
| — | Het `Content-Language` meta-tag gebruiken voor metadata |

### Failure Techniques

Er zijn geen formeel gedefinieerde failure techniques voor SC 3.1.1, maar de volgende situaties zijn failures:
- Ontbrekend `lang` attribuut op `<html>`
- Leeg `lang` attribuut
- Ongeldige taalcode
- Taalcode die niet overeenkomt met de daadwerkelijke paginataal

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: HTML-pagina's | anderstalige versies |
                  PDF-documenten | iframes]
Pagina:          [URL]
Beoordeling:     [PASS | FAIL]

lang attribuut
aanwezig:        [ja/nee]
lang attribuut
op <html>:       [ja/nee — niet op <body> of ander element]
Waarde:          [de huidige waarde, bijv. "nl" of "en"]
Geldig BCP 47:   [ja/nee]
Komt overeen
met content:     [ja/nee]

Probleem:        [specifieke beschrijving]
Technique:       [H57 / PDF16]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Ontbrekend `lang` attribuut** — op hoofdpagina of specifieke subpagina's
2. **Anderstalige versie wisselt `lang` niet** — Engelse pagina met `lang="nl"`
3. **PDF-documenten zonder taal** — veelvoorkomend bij oudere PDF's
4. **Fries niet gemarkeerd** — Friese gemeenten met `lang="nl"` i.p.v. `lang="fy"`

### Snelle audit-methode

1. Open de broncode (Ctrl+U)
2. Zoek naar `<html` aan het begin
3. Controleer of `lang="nl"` aanwezig is
4. Klaar — dit is letterlijk een 5-seconden-check

**Of:** Open DevTools → Elements → klik op het `<html>` element → bekijk de attributen.

**Of:** Gebruik een geautomatiseerde tool (axe, WAVE, Lighthouse) — dit criterium wordt door alle tools betrouwbaar gedetecteerd.

### Technisch of redactioneel issue?

SC 3.1.1 is een **technisch issue**:
- Het `lang` attribuut wordt in het template/CMS gezet
- Eénmalige fix in het template repareert alle pagina's
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

**Uitzondering:** PDF-documenten waarvoor de redacteur de documenteigenschappen moet instellen → deels redactioneel.

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — juiste uitspraak van de tekst
- **Braille-gebruikers** — correcte vertaling naar braille
- **Mensen met leesproblemen** — hulptechnologie kan correct functioneren
- **Mensen met cognitieve beperkingen** — tekst-naar-spraak software werkt correct
- **Alle gebruikers** — correcte woordafbreking en typografie

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 3.1.1 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 3.1.1:** https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html
- **Technique H57 (lang attribuut):** https://www.w3.org/WAI/WCAG22/Techniques/html/H57
- **Technique PDF16 (PDF-taal):** https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF16
- **BCP 47 taalcodes:** https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
