---
name: wcag-2-5-3-label-in-name
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.5.3 (Label in Name) on Dutch government websites. Use when conducting accessibility audits to verify that the visible label text of interactive components is contained in their accessible name. Covers the relationship between visible labels and accessible names, speech input users, aria-label/aria-labelledby pitfalls, image buttons with text, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.5.3 Label in naam — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.5.3 (Niveau A):**
Voor gebruikersinterfacecomponenten met labels die tekst of afbeeldingen van tekst bevatten, bevat de toegankelijke naam de tekst die visueel wordt weergegeven.

**Kernprincipe:** Wat je ziet moet overeenkomen met wat de technologie "weet". Als een knop visueel "Zoeken" toont, moet de accessible name ook "Zoeken" bevatten. Zo kunnen spraakgestuurde gebruikers het element activeren door te zeggen wat ze zien.

**Best practice (W3C):** "When in doubt, where a meaningful visible label exists, match the string exactly for the accessible name."

---

## Waarom is dit belangrijk?

### Spraakgestuurde gebruikers

Gebruikers van spraakherkenningssoftware (Dragon NaturallySpeaking, Windows Voice Access, Apple Voice Control) bedienen hun computer door commando's te spreken:
- "Klik Zoeken"
- "Klik Verzenden"
- "Klik Inloggen"

Als de zichtbare tekst "Zoeken" is maar de accessible name "Vind informatie op deze site" is, dan werkt het commando "Klik Zoeken" niet. De gebruiker ziet "Zoeken" maar kan het niet activeren.

### Screenreader-gebruikers

Als een knop visueel "Winkelwagen" toont maar de screenreader "Bestelmandje" voorleest, ontstaat er verwarring. De gebruiker ziet iets anders dan wat wordt voorgelezen.

### Cognitieve belasting

Een mismatch tussen wat je ziet en wat je hoort verhoogt de cognitieve belasting voor iedereen die hulptechnologie gebruikt.

---

## Twee kernbegrippen

### Visible label (zichtbaar label)

De tekst die visueel op het scherm wordt getoond bij een interactief element:
- De tekst op een knop: "Verzenden"
- De tekst van een link: "Meer informatie"
- Het label bij een invoerveld: "E-mailadres"
- De tekst in een afbeelding die als knop dient

### Accessible name (toegankelijke naam)

De programmatisch bepaalde naam van het element, zoals berekend door de Accessible Name Computation. Deze naam wordt gebruikt door hulptechnologie. De accessible name kan komen uit:
- De tekst in het element zelf (`<button>Zoeken</button>`)
- Een gekoppeld `<label>` element
- Een `aria-label` attribuut
- Een `aria-labelledby` attribuut
- Een `alt` attribuut op een afbeelding
- Een `title` attribuut (laagste prioriteit)

**Belangrijk:** `aria-label` en `aria-labelledby` **overschrijven** andere bronnen van de accessible name. Als je een `aria-label` toevoegt, vervangt dat de volledige accessible name — het voegt niet toe.

---

## De regel

**De accessible name moet de tekst van het zichtbare label bevatten.**

| Situatie | Beoordeling |
|---------|------------|
| Zichtbaar label: "Zoeken" — Accessible name: "Zoeken" | ✓ PASS (identiek — best practice) |
| Zichtbaar label: "Zoeken" — Accessible name: "Zoeken op deze website" | ✓ PASS (zichtbare tekst zit erin) |
| Zichtbaar label: "Zoeken" — Accessible name: "Vind informatie" | ✗ FAIL ("Zoeken" zit niet in de naam) |
| Zichtbaar label: "Zoeken" — Accessible name: "" (leeg) | ✗ FAIL (ook SC 4.1.2 failure) |
| Zichtbaar label: "Zoeken" — Accessible name: "Zoek informatie" | ✗ FAIL ("Zoeken" ≠ "Zoek") |

### Volgorde is belangrijk

De zichtbare labeltekst moet als **aaneengesloten reeks** in de accessible name voorkomen. Woorden tussengevoegd door andere tekst is een failure:

```
Zichtbaar:  "Download specificatie"
Accessible: "Download gizmo specificatie"
→ FAIL: "Download specificatie" komt niet als
  aaneengesloten reeks voor (er staat "gizmo" tussen)
```

### Best practice: zichtbaar label aan het begin

De zichtbare tekst staat idealiter aan het **begin** van de accessible name:

```
Beter:  "Zoeken op deze website" (begint met "Zoeken")
Minder: "Op deze website zoeken" ("Zoeken" staat aan het einde)

Beide zijn een PASS, maar "Zoeken" aan het begin werkt
beter met spraakherkenning.
```

### Hoofdletters doen er niet toe

"Zoeken", "zoeken" en "ZOEKEN" worden als gelijk beschouwd. Spraakherkenningssoftware maakt geen onderscheid in hoofdlettergebruik.

---

## Wanneer is SC 2.5.3 van toepassing?

SC 2.5.3 is van toepassing op alle **gebruikersinterfacecomponenten met een zichtbaar tekstlabel**:
- Knoppen met tekst
- Links met tekst
- Invoervelden met een zichtbaar label
- Selectievakjes met zichtbare tekst
- Radiobuttons met zichtbare tekst
- Keuzelijsten met zichtbaar label
- Tabbladen met tekst
- Menu-items met tekst

### Wanneer is het NIET van toepassing?

- **Icoon zonder zichtbare tekst:** Een knop met alleen een icoon (zonder zichtbare tekst ernaast) — er is geen zichtbaar label om mee te matchen. (Het icoon moet wél een accessible name hebben onder SC 4.1.2, maar SC 2.5.3 is niet van toepassing.)
- **Geen interactief element:** Statische tekst, koppen, paragrafen.

---

## Beslisboom

```
Interactief element gevonden (knop, link, invoerveld, etc.)
│
├─ Heeft het element een zichtbaar tekstlabel?
│  └─ NEE → SC 2.5.3 niet van toepassing
│           (mogelijk SC 4.1.2 issue als geen accessible name)
│
└─ JA → Heeft het element een accessible name?
   │
   ├─ NEE → FAIL (ook SC 4.1.2 en mogelijk SC 1.3.1 failure)
   │
   └─ JA → Bevat de accessible name de zichtbare labeltekst?
      │
      ├─ JA (als aaneengesloten reeks) → PASS
      │
      └─ NEE → FAIL (F96)
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer interactieve elementen met zichtbare tekst

Scan de pagina op:
- Knoppen met tekst
- Links met tekst
- Formuliervelden met zichtbare labels
- Andere interactieve componenten met zichtbare tekst

### Stap 2: Controleer de accessible name

Per element: open de browser DevTools → tabblad Accessibility (Chrome) of Accessibility Inspector (Firefox):
- Wat is de **computed accessible name**?
- Komt deze overeen met de zichtbare tekst?

Controleer specifiek:
1. Is er een `aria-labelledby` of `aria-label` gebruikt? → Controleer of de visueel zichtbare tekst daar onderdeel van uitmaakt.
2. Is er een `title` of `alt` attribuut? → Controleer of deze de visueel zichtbare tekst bevatten.

### Stap 3: Vergelijk zichtbaar label met accessible name

- Is de zichtbare tekst identiek aan de accessible name? → Best case
- Zit de zichtbare tekst als aaneengesloten reeks in de accessible name? → PASS
- Ontbreekt de zichtbare tekst in de accessible name? → FAIL (F96)
- Heeft het element geen accessible name? → FAIL (F111, ook SC 4.1.2)

### Stap 4: Controleer aria-label en aria-labelledby

**Dit is de meest voorkomende bron van failures.** Controleer of:
- `aria-label` de zichtbare tekst overschrijft met iets anders
- `aria-labelledby` verwijst naar tekst die afwijkt van het zichtbare label
- Verborgen tekst (sr-only spans) woorden tussenvoegt in de accessible name

---

## De 5 auditgebieden

### 1. KNOPPEN

```
Controleer alle knoppen op de pagina:

PASS:
<button>Verzenden</button>
→ Accessible name: "Verzenden" ✓

FAIL:
<button aria-label="Formulier opsturen">Verzenden</button>
→ Zichtbaar: "Verzenden"
→ Accessible name: "Formulier opsturen"
→ "Verzenden" zit niet in "Formulier opsturen" ✗

FAIL:
<button>
  <img src="submit.png" alt="Opsturen">
  Verzenden
</button>
→ Zichtbaar: "Verzenden"
→ Accessible name: "Opsturen Verzenden" (afhankelijk van
   berekening — kan problematisch zijn)
```

### 2. LINKS

```
PASS:
<a href="/contact">Contact</a>
→ Accessible name: "Contact" ✓

FAIL:
<a href="/contact" aria-label="Neem contact met ons op">
  Contact
</a>
→ Zichtbaar: "Contact"
→ Accessible name: "Neem contact met ons op"
→ "Contact" zit erin als substring ✓ (PASS)

FAIL:
<a href="/contact" aria-label="Schrijf ons">Contact</a>
→ Zichtbaar: "Contact"
→ Accessible name: "Schrijf ons"
→ "Contact" zit niet in "Schrijf ons" ✗
```

### 3. FORMULIERVELDEN

```
PASS:
<label for="email">E-mailadres</label>
<input id="email" type="email">
→ Zichtbaar label: "E-mailadres"
→ Accessible name: "E-mailadres" ✓

FAIL:
<label for="email">E-mailadres</label>
<input id="email" type="email"
       aria-label="Vul hier uw e-mail in">
→ Zichtbaar label: "E-mailadres"
→ Accessible name: "Vul hier uw e-mail in"
  (aria-label overschrijft het <label>)
→ "E-mailadres" zit niet in de naam ✗
```

### 4. AFBEELDINGSKNOPPEN

```
PASS:
<input type="image" src="zoeken.png" alt="Zoeken">
→ Zichtbaar: afbeelding met tekst "Zoeken"
→ Accessible name: "Zoeken" ✓

FAIL:
<input type="image" src="submit.png" alt="Verstuur">
→ Zichtbaar: afbeelding met tekst "Verzenden"
→ Accessible name: "Verstuur"
→ "Verzenden" ≠ "Verstuur" ✗
```

### 5. ICONEN MET TEKST

```
Icoon met bijbehorende zichtbare tekst:

PASS:
<button>
  <svg aria-hidden="true">...</svg>
  Zoeken
</button>
→ Icoon is decoratief (aria-hidden), tekst is het label
→ Accessible name: "Zoeken" ✓

FAIL:
<button aria-label="Vind">
  <svg aria-hidden="true">...</svg>
  Zoeken
</button>
→ Zichtbaar: "Zoeken"
→ Accessible name: "Vind" (aria-label overschrijft alles)
→ "Zoeken" ≠ "Vind" ✗
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Zoekfunctie

```
Zoekveld met zichtbaar label "Zoeken" en een zoekknop:

Controleer:
- Heeft het zoekveld een accessible name die "Zoeken" bevat?
- Heeft de zoekknop een accessible name die overeenkomt
  met de zichtbare tekst?
- Is er een aria-label die de zichtbare tekst overschrijft?
```

### Patroon B: "Lees meer"-links met sr-only tekst

```
Veelvoorkomend patroon:
<a href="/nieuws/1">
  Lees meer
  <span class="sr-only"> over nieuw afvalbeleid</span>
</a>

Zichtbaar: "Lees meer"
Accessible name: "Lees meer over nieuw afvalbeleid"
→ PASS: "Lees meer" staat aan het begin als
  aaneengesloten reeks ✓

Maar let op:
<a href="/nieuws/1">
  <span class="sr-only">Meer informatie: </span>
  Lees meer
</a>

Zichtbaar: "Lees meer"
Accessible name: "Meer informatie: Lees meer"
→ PASS: "Lees meer" zit erin als aaneengesloten reeks ✓
  (maar het staat niet aan het begin — minder ideaal)
```

### Patroon C: Formulierknoppen

```
Gemeente-formulieren met knoppen als "Volgende stap",
"Verstuur aanvraag", etc.:

Controleer of aria-label of aria-labelledby de zichtbare
tekst niet overschrijft met een afwijkende naam.
```

### Patroon D: Hamburger-menu

```
Hamburgermenu met zichtbare tekst "Menu":

PASS:
<button aria-label="Menu">
  <svg>...</svg> Menu
</button>
→ Accessible name: "Menu" = zichtbare tekst ✓

FAIL:
<button aria-label="Navigatie openen">
  <svg>...</svg> Menu
</button>
→ Zichtbaar: "Menu"
→ Accessible name: "Navigatie openen"
→ "Menu" zit niet in "Navigatie openen" ✗
```

### Patroon E: Sociale media-iconen met tekst

```
Als er zichtbare tekst bij het icoon staat, moet die
tekst in de accessible name zitten.

Als er GEEN zichtbare tekst is (alleen een icoon),
is SC 2.5.3 niet van toepassing (maar SC 4.1.2 wel).
```

---

## Veelvoorkomende oorzaken van failures

1. **Afbeeldingen die als link fungeren** — veruit de meest voorkomende fout. De zichtbare tekst in de afbeelding komt niet overeen met de accessible name (alt-tekst). Bijvoorbeeld: een banner met tekst "Afspraak maken" maar alt="Klik hier voor een afspraak".

2. **`aria-label` op links** — een link heeft zichtbare linktekst, maar er wordt ook een aria-label gebruikt dat de accessible name vormt. De linktekst of tekst in een afbeelding binnen de link komt niet terug in het aria-label attribuut.

3. **`aria-label` overschrijft de zichtbare tekst op knoppen** — een goedbedoelende ontwikkelaar voegt een "helpende" aria-label toe die afwijkt van de zichtbare tekst.

4. **`alt`-tekst van afbeeldingsknop wijkt af** — een knop is een afbeelding met tekst "Verzenden" maar de alt-tekst zegt "Opsturen".

5. **Verborgen tekst tussengevoegd** — sr-only spans die woorden tussenvoegen in de accessible name, waardoor de zichtbare tekst niet meer als aaneengesloten reeks voorkomt.

6. **Geen accessible name** — het element heeft een zichtbaar label maar geen programmatische naam (ook SC 4.1.2 en SC 1.3.1 failure).

---

## Onderscheid met andere SC's

| SC | Relatie met 2.5.3 |
|----|------------------|
| **1.3.1** | Is de relatie tussen label en veld programmatisch bepaalbaar? 2.5.3 gaat over of de accessible name de zichtbare tekst bevat. |
| **2.4.6** | Koppen en labels moeten beschrijvend zijn. 2.5.3 gaat over of zichtbare en programmatische namen matchen. |
| **2.5.3** | **Label in naam: zichtbaar label moet in accessible name zitten.** |
| **3.3.2** | Labels of instructies zijn aanwezig. 2.5.3 gaat over de match tussen zichtbaar en programmatisch. |
| **4.1.2** | Naam, Rol, Waarde: element heeft een accessible name. Als er geen accessible name is maar wel een zichtbaar label → failure onder zowel 4.1.2 als 2.5.3. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G208 | De tekst van het zichtbare label opnemen als deel van de accessible name |
| G211 | De accessible name laten overeenkomen met het zichtbare label |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| G162 | Labels positioneren om de relatie voorspelbaar te maken |
| — | Als een icoon geen begeleidende tekst heeft, overweeg de hover-tekst als accessible name |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F96 | De accessible name bevat de zichtbare labeltekst niet |
| F111 | Element heeft zichtbaar label maar geen accessible name (ook failure voor SC 1.3.1 en SC 4.1.2) |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: knoppen | links | formuliervelden |
                  afbeeldingsknoppen | iconen met tekst]
Element:         [beschrijving]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL | N.v.t.]

Zichtbaar label: [de tekst die de gebruiker ziet]
Accessible name: [de berekende accessible name]
Bron van name:   [tekst in element / <label> / aria-label /
                  aria-labelledby / alt / title]
Match:           [identiek / bevat / bevat niet]

Probleem:        [specifieke beschrijving]
Technique:       [G208 / G211 / F96 / F111]
Aanbeveling:     [concrete oplossing — meestal: verwijder
                  de afwijkende aria-label of pas deze aan]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **aria-label op knoppen die de zichtbare tekst overschrijft** — een ontwikkelaar voegt "extra context" toe via aria-label maar creëert een mismatch
2. **Alt-tekst van image-buttons wijkt af van de zichtbare tekst** in de afbeelding
3. **Zoekknop met afwijkende aria-label** — zichtbaar "Zoeken", aria-label "Doorzoek de website"
4. **Hamburgermenu met "Navigatie" als aria-label** maar "Menu" als zichtbare tekst
5. **Formuliervelden met aria-label die het zichtbare `<label>` overschrijft**

### Snelle audit-methode

1. Open DevTools → Accessibility-tabblad
2. Klik op interactieve elementen (knoppen, links, velden)
3. Vergelijk "Computed Name" met de zichtbare tekst
4. Zoek specifiek naar elementen met `aria-label` of `aria-labelledby` — dit zijn de meest waarschijnlijke probleemgevallen

### Technisch of redactioneel issue?

SC 2.5.3 is vrijwel altijd een **technisch issue**:
- `aria-label`, `aria-labelledby`, en `alt`-attributen worden in de code gezet
- Het CMS of template bepaalt de accessible name
- Zelden een redactioneel issue (tenzij een redacteur alt-tekst invult die afwijkt van de zichtbare tekst)

Bij Shift2: valt typisch onder de **technische audit** (Cardan/template).

### Wie heeft er baat bij?

- **Spraakgestuurde gebruikers** — kunnen elementen activeren door de zichtbare tekst te spreken
- **Screenreader-gebruikers** — horen wat ze zien, geen verwarrende mismatch
- **Mensen met cognitieve beperkingen** — minder verwarring door consistentie
- **Alle gebruikers van hulptechnologie** — voorspelbare interactie

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.5.3 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 2.5.3:** https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html
- **Technique G208 (zichtbaar label in accessible name):** https://www.w3.org/WAI/WCAG22/Techniques/general/G208
- **Technique G211 (accessible name matcht zichtbaar label):** https://www.w3.org/WAI/WCAG22/Techniques/general/G211
- **Failure F96 (accessible name bevat zichtbare tekst niet):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F96
- **Failure F111 (zichtbaar label maar geen accessible name):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F111
- **Accessible Name Computation:** https://www.w3.org/TR/accname-1.2/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
