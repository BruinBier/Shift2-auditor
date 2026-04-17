---
name: wcag-4-1-2-name-role-value
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 4.1.2 (Name, Role, Value) on Dutch government websites. Use when conducting accessibility audits to verify that all user interface components have programmatically determinable name and role, and that states/properties/values can be programmatically set. Covers native HTML elements, custom widgets, ARIA roles/states/properties, accessible names, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 4.1.2 Naam, rol, waarde — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 4.1.2 (Niveau A):**
Voor alle componenten van de gebruikersinterface (inclusief maar niet beperkt tot: formulierelementen, links en door scripts gegenereerde componenten) kunnen de naam en de rol door software bepaald worden; toestanden, eigenschappen en waarden die door de gebruiker ingesteld kunnen worden, kunnen door software ingesteld worden; en kennisgeving van veranderingen van deze items is beschikbaar voor user agents, met inbegrip van hulptechnologieën.

**Kernprincipe:** Elk interactief element op een webpagina moet drie dingen aan hulptechnologie doorgeven:
1. **Naam** — waarvoor dient dit element? (het label)
2. **Rol** — wat voor soort element is het? (knop, link, checkbox, etc.)
3. **Waarde/toestand** — wat is de huidige status? (aangevinkt, uitgevouwen, geselecteerd, etc.)

---

## Standaard HTML = automatisch correct

**Cruciaal uitgangspunt:** Standaard HTML-elementen die correct worden gebruikt, voldoen automatisch aan SC 4.1.2. De browser stelt naam, rol en waarde automatisch beschikbaar via de accessibility API.

```html
<!-- Automatisch correct — naam, rol en waarde ingebouwd -->
<button>Verzenden</button>
<!-- Naam: "Verzenden", Rol: button -->

<a href="/contact">Contact</a>
<!-- Naam: "Contact", Rol: link -->

<label><input type="checkbox" checked> Akkoord</label>
<!-- Naam: "Akkoord", Rol: checkbox, Toestand: checked -->

<select id="afd">
  <option selected>Burgerzaken</option>
  <option>Financiën</option>
</select>
<!-- Naam: via label, Rol: combobox, Waarde: "Burgerzaken" -->
```

**SC 4.1.2 is primair relevant voor auteurs die eigen (custom) componenten ontwikkelen of scripten.** Bij standaard HTML-elementen gaat het alleen fout als ze verkeerd worden gebruikt (bijv. een `<div>` als knop).

### Hoe werkt het: de Accessibility API

De browser (user agent) linkt componenten als formuliervelden en links aan de **Accessibility API**. Hulptechnologie gebruikt deze API om informatie over naam, rol, waarde en toestand op te halen. Op die manier kan hulpsoftware (screenreaders, schermvergroters, spraakherkenning) de informatie overbrengen aan de gebruiker.

Als een standaard HTML-link wordt gebruikt met een linktekst en een `href`-attribuut, kan hulpsoftware automatisch bepalen:
- **Rol:** "link"
- **Naam:** de linktekst
- De gebruiker weet dan wat voor soort element het is, hoe het heet, en hoe het bediend kan worden.

---

## Knoppen vs. links

Een belangrijk onderscheid voor de juiste rol:

- **Knop:** als er iets verandert (contextwijziging) of er wordt iets uitgevoerd (bijv. formulier versturen, accordion openen) → `<button>` of `role="button"`
- **Link:** als de focus verplaatst wordt (er wordt ergens naar verwezen, navigatie naar andere pagina) → `<a href="...">`

---

## De drie onderdelen

### 1. Naam (accessible name)

De **naam** is het label waarmee hulptechnologie het element identificeert. Bronnen voor de accessible name (in volgorde van prioriteit):

1. `aria-labelledby` — verwijst naar een ander element dat de naam bevat
2. `aria-label` — directe tekst als naam
3. `<label>` — gekoppeld via `for`/`id`
4. Inhoud van het element — de tekst in een `<button>` of `<a>`
5. `title` — tooltip als laatste redmiddel
6. `alt` — bij afbeeldingen

```html
<!-- Naam via label -->
<label for="email">E-mailadres</label>
<input type="email" id="email">

<!-- Naam via aria-label -->
<button aria-label="Sluiten">×</button>

<!-- Naam via content -->
<a href="/contact">Contact opnemen</a>

<!-- FAIL: geen naam -->
<button><i class="icon-search"></i></button>
<!-- Screenreader: "knop" — maar waarvoor? -->
```

### 2. Rol (role)

De **rol** vertelt hulptechnologie wat voor soort element het is. Standaard HTML-elementen hebben een ingebouwde rol:

| HTML-element | Ingebouwde rol |
|-------------|---------------|
| `<button>` | button |
| `<a href>` | link |
| `<input type="checkbox">` | checkbox |
| `<input type="radio">` | radio |
| `<select>` | combobox / listbox |
| `<nav>` | navigation |
| `<main>` | main |
| `<dialog>` | dialog |

**Custom elementen** moeten een rol krijgen via het `role` attribuut:

```html
<!-- FAIL: div als knop zonder rol -->
<div onclick="submit()" class="btn">Verzenden</div>
<!-- Screenreader: "Verzenden" — maar weet niet dat het een knop is -->

<!-- PASS: div als knop met rol -->
<div role="button" tabindex="0" onclick="submit()">Verzenden</div>
<!-- Maar beter: gebruik gewoon <button> -->
```

### 3. Waarde en toestand (value / state)

De **waarde** is de huidige inhoud (bijv. geselecteerde optie). De **toestand** is de huidige status (aangevinkt, uitgevouwen, uitgeschakeld, etc.).

Bij standaard HTML-elementen worden waarde en toestand automatisch bijgehouden. Bij custom elementen moet dit via ARIA:

```html
<!-- Standaard checkbox: toestand automatisch -->
<input type="checkbox" checked>

<!-- Custom checkbox: toestand handmatig via ARIA -->
<div role="checkbox" aria-checked="true" tabindex="0">
  Akkoord met voorwaarden
</div>

<!-- Accordion: uitgevouwen/samengevouwen -->
<button aria-expanded="false" aria-controls="panel1">
  Meer informatie
</button>
<div id="panel1" hidden>Inhoud...</div>
<!-- aria-expanded moet worden bijgewerkt via JavaScript -->
```

**Kritieke eis:** Statuswijzigingen moeten worden gecommuniceerd. Als een accordion wordt uitgevouwen, moet `aria-expanded` van `false` naar `true` wijzigen via JavaScript. Een statisch `aria-expanded="false"` dat nooit wijzigt is een failure.

---

## Beslisboom

```
Interactief element gevonden
│
├─ Is het een standaard HTML-element,
│  correct gebruikt?
│  └─ JA → Heeft het een accessible name?
│     ├─ JA → PASS (naam, rol, waarde automatisch)
│     └─ NEE → FAIL (geen naam)
│
└─ NEE (custom element of verkeerd gebruikt HTML)
   │
   ├─ Heeft het element een naam?
   │  └─ NEE → FAIL
   │
   ├─ Heeft het element een rol?
   │  └─ NEE → FAIL (bijv. div zonder role)
   │
   ├─ Heeft het element de juiste toestand/waarde?
   │  └─ NEE → FAIL (bijv. aria-expanded niet bijgewerkt)
   │
   └─ Worden wijzigingen gecommuniceerd?
      └─ NEE → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle interactieve elementen

- Knoppen (ook icon-knoppen)
- Links
- Formuliervelden
- Checkboxen en radiobuttons
- Dropdown-menu's
- Tabpanelen
- Accordions
- Modals/dialogen
- Sliders
- Paginering
- Custom widgets

### Stap 2: Controleer de accessible name

Per element: open DevTools → Accessibility tab → check "Computed Name":
- Is er een naam?
- Is de naam beschrijvend?

### Stap 3: Controleer de rol

Per element: check de accessibility tree:
- Heeft het element de juiste rol?
- Wordt een `<div>` of `<span>` als interactief element gebruikt zonder `role`?

### Stap 4: Controleer toestand en waarde

Per element met veranderende toestand:
- Wordt `aria-expanded` bijgewerkt?
- Wordt `aria-checked` bijgewerkt?
- Wordt `aria-selected` bijgewerkt?
- Wordt `aria-disabled` correct gebruikt?

---

## De 7 auditgebieden

### 1. KNOPPEN

```
Controleer:
- Heeft elke knop een accessible name?
- Is de naam beschrijvend?

Veelvoorkomende failures:
✗ <button><i class="icon-search"></i></button>
  (icoonknop zonder naam)
✗ <div onclick="..." class="btn">Tekst</div>
  (div als knop zonder role="button")
✗ <button aria-label="x">×</button>
  (naam "x" is niet beschrijvend)

Correcte implementaties:
✓ <button>Verzenden</button>
✓ <button aria-label="Zoeken">
    <i class="icon-search"></i>
  </button>
✓ <button aria-label="Sluiten">×</button>
```

### 2. LINKS

```
Controleer:
- Heeft elke link een accessible name?
- Heeft <a> een href? (zonder href geen link-rol)

Veelvoorkomende failures:
✗ <a href="/pagina"><img src="..." alt=""></a>
  (link met afbeelding zonder alt-tekst → geen naam)
✗ <a onclick="navigate()">Producten</a>
  (geen href → geen link-rol)

Correcte implementaties:
✓ <a href="/contact">Contact</a>
✓ <a href="/pagina"><img src="..." alt="Startpagina"></a>
```

### 3. FORMULIERELEMENTEN

```
Controleer:
- Heeft elk invoerveld een gekoppeld label?
- Hebben radiobuttons/checkboxen individuele labels?
- Hebben groepen een groepslabel (fieldset/legend)?

Veelvoorkomende failures:
✗ <input type="text"> (geen label)
✗ <input type="checkbox"> Akkoord
  (tekst niet programmatisch gekoppeld)

Correcte implementaties:
✓ <label for="naam">Naam</label>
  <input type="text" id="naam">
✓ <label><input type="checkbox"> Akkoord</label>
```

### 4. ACCORDIONS EN UITKLAPBARE SECTIES

```
Controleer:
- Heeft de trigger een rol? (button)
- Is aria-expanded aanwezig?
- Wordt aria-expanded bijgewerkt bij openen/sluiten?

Veelvoorkomende failures:
✗ aria-expanded="false" dat nooit naar "true" wijzigt
✗ <div class="accordion-header" onclick="...">
  (div zonder button-rol)

Correcte implementatie:
✓ <button aria-expanded="false"
          aria-controls="content">
    Meer informatie
  </button>
  <div id="content" hidden>...</div>
  <!-- JavaScript update aria-expanded en hidden -->
```

### 5. TABPANELEN

```
Controleer:
- Heeft de tablist role="tablist"?
- Heeft elke tab role="tab"?
- Heeft elk panel role="tabpanel"?
- Is aria-selected correct op de actieve tab?
- Worden wijzigingen gecommuniceerd?

Veelvoorkomende failures:
✗ Tabs gebouwd met <div> zonder ARIA-rollen
✗ aria-selected nooit bijgewerkt
```

### 6. MODALS EN DIALOGEN

```
Controleer:
- Heeft de modal role="dialog" of <dialog>?
- Heeft de modal een accessible name?
  (aria-labelledby naar de titel)
- Wordt focus beheerd?

Veelvoorkomende failures:
✗ Modal zonder role="dialog"
✗ Modal zonder aria-label of aria-labelledby
```

### 7. IFRAMES

```
Iframes moeten een title-attribuut hebben zodat
hulptechnologie weet wat het iframe bevat.

Controleer:
- Heeft het <iframe> een title-attribuut?
- Is de title beschrijvend?

FAIL:
<iframe src="..."></iframe>
(geen title)

<iframe src="..." title=""></iframe>
(leeg title)

PASS:
<iframe src="..." title="Google Maps locatie gemeentehuis"></iframe>
<iframe src="..." title="Contactformulier"></iframe>
```

### 8. CUSTOM WIDGETS

```
Alle andere custom componenten:
- Sliders (role="slider", aria-valuemin,
  aria-valuemax, aria-valuenow)
- Tooltips (role="tooltip")
- Treeviews (role="tree", role="treeitem")
- Menus (role="menu", role="menuitem")

Controleer per widget:
- Correcte ARIA-rol
- Accessible name
- Alle vereiste ARIA-toestanden en -eigenschappen
- Toestanden worden bijgewerkt bij interactie
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Hamburger-menu

```
De mobiele navigatie met hamburger-icoon:
- Heeft de knop een accessible name? ("Menu" of "Navigatie")
- Is aria-expanded aanwezig en wordt het bijgewerkt?
```

### Patroon B: Cookie-banner

```
- Hebben de knoppen ("Accepteren", "Weigeren",
  "Instellingen") accessible names?
- Heeft de banner een rol? (role="dialog" of
  role="alertdialog")
- Sluit-knop (×): heeft deze een beschrijvende naam?
```

### Patroon C: Zoekfunctie

```
- Heeft het zoekveld een naam?
- Heeft de zoekknop een naam? (niet alleen een icoon)
- Autocomplete-suggesties: hebben ze de juiste rollen?
  (role="listbox", role="option")
```

### Patroon D: Formulieren

```
- Hebben alle invoervelden een gekoppeld label?
- Hebben custom datepickers de juiste ARIA-attributen?
- Hebben selectiecomponenten (custom dropdowns)
  de juiste rollen?
```

### Patroon E: Nieuwsoverzicht met accordions

```
- Uitklapbare nieuwsitems: aria-expanded correct?
- "Lees meer"-knoppen: hebben ze een beschrijvende naam?
```

---

## Onderscheid met andere SC's

| SC | Relatie met 4.1.2 |
|----|------------------|
| **1.1.1** | Alt-tekst voor afbeeldingen: als een afbeelding de enige content is in een link of knop, is het alt-attribuut de accessible name → raakt 4.1.2 |
| **1.3.1** | Info en relaties: labels zijn programmatisch gekoppeld. 4.1.2 gaat breder over naam, rol en waarde van alle interactieve elementen. |
| **2.4.4** | Linkdoel: de linktekst beschrijft het doel. 4.1.2 gaat over de programmatische accessible name. |
| **2.5.3** | Label in Name: zichtbaar label zit in accessible name. 4.1.2 gaat over de aanwezigheid van een accessible name. |
| **3.3.2** | Labels of instructies: zichtbare labels bij invoervelden. 4.1.2 gaat over de programmatische naam. |
| **4.1.2** | **Naam, rol, waarde: programmatisch bepaalbare naam, rol, waarde en toestand voor alle interactieve elementen.** |

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: Standaard HTML-elementen**

| Code | Beschrijving |
|------|-------------|
| ARIA14 | `aria-label` gebruiken om een onzichtbaar label te geven |
| ARIA16 | `aria-labelledby` gebruiken om een naam te geven |
| H44 | `<label>` elementen koppelen aan formuliervelden |
| H65 | `title` attribuut gebruiken als label niet mogelijk is |
| H91 | HTML formulierelementen en links gebruiken |

**Situatie B: Custom componenten**

| Code | Beschrijving |
|------|-------------|
| ARIA4 | `role` attribuut gebruiken om de rol bloot te stellen |
| ARIA5 | ARIA state/property attributen gebruiken voor toestand |
| G10 | Componenten maken met technologie die accessibility-meldingen ondersteunt |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F59 | `<div>` of `<span>` als interactief element zonder `role` |
| F15 | Custom controls die geen accessibility API gebruiken |
| F20 | Tekst-alternatieven niet bijwerken bij wijzigingen |
| F79 | Focusstatus niet programmatisch bepaalbaar |
| F86 | Geen namen voor delen van een meerdelig formulierveld |
| F89 | Geen accessible name voor afbeelding die enige content is in een link |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-8: knoppen | links | formulierelementen |
                  accordions | tabpanelen | modals |
                  iframes | custom widgets]
Element:         [beschrijving van het element]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL]

Accessible name: [de naam, of "geen"]
Rol:             [de rol, of "geen" / "onjuist"]
Toestand/waarde: [correct / niet bijgewerkt / ontbreekt / n.v.t.]
HTML-element:    [het gebruikte HTML-element]
ARIA-attributen: [aanwezige ARIA-attributen]

Probleem:        [specifieke beschrijving]
Technique:       [ARIA4 / ARIA5 / ARIA14 / H44 / F59 / etc.]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Icoonknoppen zonder naam** — zoekknop, hamburger-menu, sluiten-knop (×) zonder aria-label
2. **Links met afbeelding zonder alt** — afbeelding is enige content in link, maar alt is leeg
3. **Formuliervelden zonder label** — invoervelden niet gekoppeld via `<label for>` of `aria-label`. Afkeuren bij zowel SC 1.3.1 (relatie niet te bepalen) als SC 4.1.2 (geen naam)
4. **Custom dropdowns zonder ARIA** — visueel als dropdown, maar `<div>` zonder role/state
5. **Accordions met statische aria-expanded** — nooit bijgewerkt via JavaScript
6. **Cookie-banner zonder dialog-rol** — knoppen mogelijk zonder naam
7. **`<a>` zonder href** — verliest de link-rol; screenreader ziet het niet als link
8. **Heading als interactief element** — `<h1>` of `<h2>` interactief gemaakt via JavaScript: heeft geen interactieve rol
9. **Iframes zonder title** — `<iframe>` zonder title-attribuut

### Snelle audit-methode

1. Open DevTools → Accessibility tab
2. Klik op interactieve elementen → controleer "Computed Name" en "Role"
3. Is er een naam? Is de rol correct?
4. Interacteer met het element → wordt de toestand bijgewerkt?
5. **Zoek in de broncode op `role=` en `aria-`** — maak een lijst van alle elementen met ARIA-attributen en controleer of ze correct zijn toegepast
6. Maak een lijst van alle niet-standaard interactieve elementen en controleer naam, rol en toestand
7. Test met een screenreader (NVDA/VoiceOver) voor de volledige ervaring

### Technisch of redactioneel issue?

SC 4.1.2 is **vrijwel altijd een technisch issue**:
- Naam, rol en waarde worden in de code bepaald
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — moeten weten wat elk element is, hoe het heet en wat de status is
- **Spraakgestuurde gebruikers** — moeten elementen bij naam kunnen aanspreken
- **Alle hulptechnologie-gebruikers** — schermlezers, schermvergroters, alternatieve invoerapparaten

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 4.1.2 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 4.1.2:** https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
- **Technique ARIA4 (role):** https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA4
- **Technique ARIA5 (state/property):** https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5
- **Technique ARIA14 (aria-label):** https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14
- **Technique ARIA16 (aria-labelledby):** https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16
- **Failure F59 (div/span zonder role):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F59
- **WAI-ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
