---
name: wcag-3-1-2-language-of-parts
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.1.2 (Language of Parts) on Dutch government websites. Use when conducting accessibility audits to verify that changes in human language within a page are programmatically identified via the lang attribute. Covers the four exceptions (proper names, technical terms, indeterminate language, vernacular), leenwoorden in het Nederlands, Engelse termen op gemeente-websites, and common patterns. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.1.2 Taal van onderdelen — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.1.2 (Niveau AA):**
De menselijke taal van elke passage of zin in de content kan programmatisch worden bepaald, behalve voor eigennamen, technische termen, woorden van onbepaalde taal, en woorden of zinnen die deel zijn geworden van het jargon van de direct omringende tekst.

**Kernprincipe:** Als een webpagina tekst bevat in een andere taal dan de standaardtaal van de pagina (SC 3.1.1), moet die anderstalige tekst worden gemarkeerd met het `lang` attribuut. Zo kan een screenreader overschakelen naar de juiste uitspraakregels.

**In de praktijk:**

```html
<html lang="nl">
  <body>
    <p>De gemeente biedt een
       <span lang="en">helpdesk</span> voor vragen.</p>
    <blockquote lang="en">
      <p>To be or not to be, that is the question.</p>
    </blockquote>
  </body>
</html>
```

---

## Waarom is dit belangrijk?

Zonder taalmarkering probeert een screenreader anderstalige tekst met de uitspraakregels van de paginataal voor te lezen:
- Het Franse woord "voiture" (auto) wordt door een Nederlandse screenreader uitgesproken als iets dat klinkt als "vooi-tuu-ree"
- Een Engelse passage wordt met Nederlandse klanken voorgelezen → onverstaanbaar
- Braille-vertaalsoftware maakt verkeerde samentrekkingen

Met correcte taalmarkering schakelt de screenreader automatisch over naar de juiste spraakmodule.

---

## De vier uitzonderingen

SC 3.1.2 kent vier situaties waarin taalmarkering NIET vereist is:

### 1. Eigennamen (Proper Names)

Namen van personen, plaatsen, organisaties, merken:
- "Paris", "McDonald's", "Barack Obama"
- Hoeven NIET gemarkeerd te worden, zelfs als ze uit een andere taal komen

### 2. Technische termen (Technical Terms)

Vakjargon dat universeel wordt gebruikt en meestal niet vertaald wordt:
- "HTTP", "API", "CSS", "PDF", "DNS"
- Medische termen: "diabetes", "DNA"
- Juridische termen: "habeas corpus"

### 3. Woorden van onbepaalde taal (Indeterminate Language)

Woorden waarvan niet duidelijk is in welke taal ze zijn:
- Verzinsels, nonsenswoorden
- Woorden die in meerdere talen identiek zijn

### 4. Woorden die deel zijn geworden van het jargon (Vernacular)

Dit is de belangrijkste uitzondering voor Nederlandse gemeente-websites. Veel Engelse woorden zijn ingeburgerd in het Nederlands:

**Vuistregel van W3C:** Als je twijfelt of een taalwisseling bedoeld is, overweeg dan of het woord **op dezelfde manier zou worden uitgesproken** (behalve accent of intonatie) in de taal van de omringende tekst.

```
Ingeburgerd in het Nederlands (GEEN markering nodig):
- "website", "e-mail", "internet", "online", "software"
- "manager", "team", "design", "feedback"
- "deadline", "meeting", "workshop"
- "smartphone", "laptop", "wifi"
- "pdf", "url"

Staan in Van Dale? → Waarschijnlijk ingeburgerd
→ Geen lang="en" nodig
```

```
NIET ingeburgerd / duidelijk Engelstalige passage
(WEL markering nodig):
- Een heel Engelstalig citaat
- Een paragraaf in het Engels
- Een Engelse slagzin die niet is ingeburgerd
- Instructies in het Engels
```

**Praktische test:** Wordt het woord door een Nederlandse screenreader (met Nederlandse spraakmodule) begrijpelijk uitgesproken? Zo ja → geen markering nodig. Zo nee → markering nodig.

---

## Niet bij losse woorden, WEL bij verzamelingen

**Losse woorden:** Het gaat bij SC 3.1.2 niet om losse woorden in een andere taal. Een enkel Engels woord in een Nederlandse zin hoeft niet gemarkeerd te worden (het is ook niet fout om het wel te doen). Het criterium richt zich op minimaal **zinsdelen of zinnen**, bestaande uit meerdere woorden.

**Verzamelingen van losse woorden:** Alhoewel de taalwisseling niet geldt voor individuele losse woorden, geldt het WEL voor **verzamelingen van losse woorden**. Als bijvoorbeeld alle items in het hoofdmenu Engelstalig zijn op een verder Nederlandse webpagina, moet toch de taalwisseling worden aangegeven voor het menu.

```html
<!-- Hoofdmenu met Engelse items op een NL-pagina:
     WEL markering nodig (verzameling losse woorden) -->
<nav lang="en">
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

**Omsluitend element:** Als de anderstalige tekst in meerdere bij elkaar horende elementen voorkomt, kan het lang-attribuut éénmalig op één omsluitend HTML-element worden toegepast (zoals `<nav lang="en">` in het voorbeeld hierboven).

---

## Verborgen teksten

Taalmarkering is ook vereist voor **visueel verborgen teksten** (sr-only, aria-label, etc.). Verborgen teksten worden wél door screenreaders voorgelezen en moeten dus de juiste taalmarkering hebben.

```html
<!-- Verborgen tekst in het Engels op een NL-pagina -->
<span class="sr-only" lang="en">Read more about our services</span>
```

---

## Beslisboom

```
Anderstalige tekst gevonden op een pagina met lang="nl"
│
├─ Is het een eigennaam?
│  └─ JA → Geen markering nodig (uitzondering)
│
├─ Is het een technische term?
│  └─ JA → Geen markering nodig (uitzondering)
│
├─ Is het woord/de zin ingeburgerd in het Nederlands?
│  (Staat het in Van Dale? Wordt het op een "Nederlandse"
│   manier uitgesproken?)
│  └─ JA → Geen markering nodig (vernacular)
│
├─ Is de taal van het woord/de zin onbepaald?
│  └─ JA → Geen markering nodig (uitzondering)
│
└─ NEE op alle bovenstaande → Markering vereist
   │
   ├─ Is er een lang attribuut met de juiste taalcode?
   │  └─ JA → PASS
   │
   └─ NEE → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer anderstalige content

Lees de pagina door en let op:
- Passages of zinnen in een andere taal
- Citaten in een andere taal
- Engelstalige termen die niet ingeburgerd zijn
- Content in het Fries, Duits, Frans, etc.
- Anderstalige links of knoppen

### Stap 2: Beoordeel de uitzonderingen

Per gevonden anderstalige tekst:
- Is het een eigennaam? → Geen markering nodig
- Is het een technische term? → Geen markering nodig
- Is het ingeburgerd in het Nederlands? → Geen markering nodig
- Is het een hele passage of zin in een andere taal? → Markering vereist

### Stap 3: Controleer de taalmarkering

Als markering vereist is:
- Open de broncode of DevTools
- Controleer of het element een `lang` attribuut heeft
- Is de taalcode geldig en correct?

```html
<!-- PASS -->
<p lang="en">Welcome to our municipality.</p>

<!-- PASS -->
<span lang="en">Terms and Conditions</span>

<!-- FAIL: Engelse passage zonder lang attribuut -->
<p>Welcome to our municipality.</p>
```

### Stap 4: Controleer of niet over-gemarkeerd wordt

**Over-markering** (te veel lang-attributen) kan ook problematisch zijn: de screenreader schakelt onnodig heen en weer tussen spraakmodules, wat verwarrend en irritant is.

```html
<!-- Over-markering (niet nodig): -->
<p>Wij bieden een <span lang="en">online</span>
   <span lang="en">service</span> aan.</p>
→ "online" en "service" zijn ingeburgerd → geen markering nodig

<!-- Correct: -->
<p>Wij bieden een online service aan.</p>
```

---

## De 5 auditgebieden

### 1. ENGELSTALIGE PASSAGES EN ZINNEN

```
Hele zinnen of alinea's in het Engels op een
Nederlandstalige pagina:

PASS:
<p lang="en">For English information about our
municipality, please visit the English page.</p>

FAIL:
<p>For English information about our municipality,
please visit the English page.</p>
(geen lang="en" attribuut)
```

### 2. CITATEN IN EEN ANDERE TAAL

```
Citaten uit anderstalige bronnen:

PASS:
<blockquote lang="en">
  <p>"The best way to predict the future
     is to create it."</p>
</blockquote>

FAIL:
<blockquote>
  <p>"The best way to predict the future
     is to create it."</p>
</blockquote>
```

### 3. ANDERSTALIGE LINKS EN KNOPPEN

```
Links naar anderstalige pagina's of knoppen met
anderstalige tekst:

PASS:
<a href="/en/contact" lang="en">Contact (English)</a>

FAIL:
<a href="/en/contact">Contact (English)</a>
(de tekst "Contact (English)" is deels Engels)

Let op: als de linktekst gewoon "Contact" is, hoeft
er geen markering — "Contact" is in beide talen gelijk.
```

### 4. FRIESE CONTENT

```
Op websites van Friese gemeenten:

PASS:
<p lang="fy">Wolkom yn ús gemeente.</p>

FAIL:
<p>Wolkom yn ús gemeente.</p>
(Friese zin zonder lang="fy")
```

### 5. PDF-DOCUMENTEN

```
Anderstalige passages in PDF-documenten moeten ook
een taalmarkering hebben:
- Via de /Lang entry in de PDF-structuur
- In Adobe Acrobat: Tags-panel → Eigenschappen →
  Taal per element

In de praktijk: dit wordt in PDF's vaak niet gedaan
en is moeilijk te implementeren. Benoem het als
failure maar erken de technische beperking.
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Ingeburgerde Engelse termen

Nederlandse gemeente-websites gebruiken veel Engelse woorden die ingeburgerd zijn:

```
Geen markering nodig (ingeburgerd):
- "website", "e-mail", "online", "download"
- "feedback", "pdf", "social media"
- "wifi", "app", "link"
- "privacy", "cookies" (in digitale context)

Wél markering nodig (niet ingeburgerd):
- Hele Engelse zinnen of passages
- Engelse titels van documenten
- Engelse citaten
```

### Patroon B: Engelstalige pagina's

Sommige gemeenten hebben Engelstalige pagina's voor expats. Hier geldt:
- De pagina zelf moet `<html lang="en">` hebben (SC 3.1.1)
- Nederlandse passages op die Engelse pagina moeten `lang="nl"` krijgen (SC 3.1.2)

### Patroon C: Taalwissel-links

```
Links naar anderstalige versies:

<nav>
  <a href="/nl" aria-current="page">Nederlands</a>
  <a href="/en" lang="en">English</a>
  <a href="/de" lang="de">Deutsch</a>
</nav>

Het woord "English" in het Engels en "Deutsch" in het Duits:
→ Markering nodig want het zijn anderstalige woorden
   die niet zijn ingeburgerd in het Nederlands
```

### Patroon D: Juridische en Latijnse termen

```
Latijnse juridische termen:
- "ad hoc", "per se", "de facto", "pro forma"
→ Ingeburgerd in het Nederlands → geen markering nodig

Maar een heel Latijns citaat:
→ Markering met lang="la" nodig
```

### Patroon E: Engelse functietitels

```
"Chief Technology Officer", "Product Owner", etc.
→ Technische termen / jargon → geen markering nodig

Maar een hele Engelse functieomschrijving:
→ Markering met lang="en" nodig
```

---

## Onderscheid met andere SC's

| SC | Relatie met 3.1.2 |
|----|------------------|
| **3.1.1** | Taal van de pagina: standaardtaal op `<html>`. 3.1.2 gaat over afwijkingen binnen de pagina. |
| **3.1.2** | **Taal van onderdelen: taalwisselingen binnen de pagina markeren.** |

SC 3.1.1 en 3.1.2 werken samen:
- 3.1.1 stelt de basis: `<html lang="nl">`
- 3.1.2 markeert de uitzonderingen: `<span lang="en">...</span>`
- Zonder 3.1.1 weet de screenreader de basisuitspraak niet
- Zonder 3.1.2 worden anderstalige passages verkeerd uitgesproken

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| H58 | Het `lang` attribuut gebruiken om taalwisselingen te identificeren |
| PDF19 | De taal specificeren voor een passage of zin in PDF-documenten |

### Failure Techniques

Er zijn geen formeel gedefinieerde failure techniques voor SC 3.1.2, maar het ontbreken van een `lang` attribuut op anderstalige passages (die niet onder een uitzondering vallen) is een failure.

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: Engelse passages | citaten |
                  anderstalige links | Friese content |
                  PDF-documenten]
Element:         [de anderstalige tekst]
Taal:            [de taal van het onderdeel]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL | N.v.t. (uitzondering)]

Uitzondering:    [eigennaam / technische term / ingeburgerd /
                  onbepaalde taal / geen]
lang attribuut
aanwezig:        [ja/nee]
Waarde:          [de huidige waarde]
Correct:         [ja/nee]

Probleem:        [specifieke beschrijving]
Technique:       [H58 / PDF19]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Engelse passages zonder lang="en"** — hele zinnen of alinea's in het Engels zonder markering
2. **Taalwissel-links zonder markering** — "English" en "Deutsch" zonder lang attribuut
3. **Friese content zonder lang="fy"** — op websites van Friese gemeenten
4. **Over-markering van ingeburgerde woorden** — "online", "e-mail", "website" onnodig markeren (niet een WCAG-failure maar veroorzaakt irritante spraakwisselingen)
5. **PDF-documenten met anderstalige passages** — taalmarkering ontbreekt bijna altijd in PDF's
6. **Verborgen teksten zonder taalmarkering** — sr-only teksten in een andere taal worden ook door screenreaders voorgelezen en moeten gemarkeerd zijn
7. **Verzameling Engelse woorden in navigatie** — menu-items in het Engels zonder lang-markering op het omsluitende element

### Snelle audit-methode

1. Lees de pagina door — staan er passages in een andere taal?
2. Zo ja: zijn het ingeburgerde woorden of hele passages?
3. Voor hele passages: controleer in de broncode of er een `lang` attribuut is
4. Test optioneel met een screenreader: klinkt de anderstalige tekst correct?

### Technisch of redactioneel issue?

SC 3.1.2 is een **mix van technisch en redactioneel**:
- **Technisch:** Het CMS moet het mogelijk maken om taalwisselingen te markeren (bijv. een "taal"-optie in de teksteditor)
- **Redactioneel:** De redacteur moet de anderstalige passages markeren bij het invoeren van content

Bij Shift2: valt onder de **content audit** (redactioneel), maar het CMS moet de functionaliteit bieden (technisch).

### De "Van Dale-test"

Een praktische test voor Nederlandse gemeente-websites:
- Staat het woord in Van Dale? → Waarschijnlijk ingeburgerd → geen markering nodig
- Staat het niet in Van Dale en is het een heel woord/zin in een andere taal? → Markering nodig

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — juiste uitspraak van anderstalige passages
- **Braille-gebruikers** — correcte vertaling naar braille
- **Mensen met leesproblemen** — tekst-naar-spraak werkt correct per taal
- **Alle gebruikers** — in de toekomst mogelijk automatische vertaling van anderstalige passages

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 3.1.2 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 3.1.2:** https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html
- **Technique H58 (lang attribuut voor taalwisselingen):** https://www.w3.org/WAI/WCAG22/Techniques/html/H58
- **Technique PDF19 (taal in PDF):** https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF19
- **BCP 47 taalcodes:** https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
