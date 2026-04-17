---
name: wcag-3-3-2-labels-or-instructions
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.3.2 (Labels or Instructions) on Dutch government websites. Use when conducting accessibility audits to verify that labels or instructions are provided when content requires user input. Covers form labels, required field indicators, format instructions, placeholder text, grouped controls, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.3.2 Labels of instructies — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.3.2 (Niveau A):**
Labels of instructies worden geleverd wanneer content invoer van de gebruiker vereist.

**Kernprincipe:** Elk invoerveld, elke checkbox, elke radiobutton en elk ander formulierbesturingselement moet een label of instructie hebben, zodat de gebruiker weet welke invoer wordt verwacht. Dit omvat ook informatie over verwachte formaten en specifieke regels.

**Let op:** Het woord "vereist" in dit criterium betekent niet "verplicht veld" — het betekent dat het formulierveld invoer van de gebruiker **verwacht** of **accepteert**. Het criterium geldt voor alle formuliervelden, zowel verplichte als optionele.

---

## Labels vs. instructies

### Labels

Een label identificeert het invoerveld — het vertelt de gebruiker **wat** er moet worden ingevuld:
- "Naam"
- "E-mailadres"
- "Telefoonnummer"
- "Geboortedatum"

### Instructies

Een instructie geeft aanvullende informatie over **hoe** de invoer moet worden ingevuld:
- "Formaat: dd-mm-jjjj"
- "Minimaal 8 tekens, waarvan 1 hoofdletter en 1 cijfer"
- "Verplicht veld"
- "Selecteer maximaal 3 opties"

SC 3.3.2 vereist een label **of** een instructie — maar in de praktijk zijn vaak beide nodig voor een goed toegankelijk formulier.

---

## Wat valt onder SC 3.3.2?

### Alle typen invoerelementen:
- Tekstvelden (`<input type="text">`)
- E-mailvelden, telefoonnummervelden, etc.
- Wachtwoordvelden
- Textarea's
- Selectieboxen / dropdowns (`<select>`)
- Radiobuttons (`<input type="radio">`)
- Checkboxen (`<input type="checkbox">`)
- Datum-/tijdvelden
- Bestandsuploads
- Zoekformulieren

### Wat moet aanwezig zijn?
- **Per invoerveld:** een label dat aangeeft wat de verwachte invoer is
- **Per groep gerelateerde velden:** een groepslabel (bijv. via `<fieldset>` + `<legend>`)
- **Bij speciale formaten:** instructies over het verwachte formaat
- **Bij verplichte velden:** een aanduiding dat het veld verplicht is

---

## Placeholder is GEEN label

**Cruciaal:** Placeholder-tekst (`placeholder="..."`) is GEEN vervanging voor een label.

Redenen:
- Placeholder-tekst verdwijnt zodra de gebruiker begint te typen
- De gebruiker kan niet meer terugzien wat er werd verwacht
- Screenreaders behandelen placeholder niet altijd als label
- Lage contrast (grijze tekst) is moeilijk leesbaar

```html
<!-- FAIL: alleen placeholder, geen label -->
<input type="text" placeholder="Uw naam">

<!-- PASS: label + optioneel placeholder als voorbeeld -->
<label for="naam">Naam</label>
<input type="text" id="naam" placeholder="bijv. Jan Jansen">
```

Placeholder-tekst mag wél als aanvulling op het label worden gebruikt (bijv. als voorbeeld van het verwachte formaat).

---

## Afbeelding als label

Een afbeelding mag als label worden gebruikt in plaats van tekst, mits de afbeelding een tekstalternatief heeft. Bijvoorbeeld een vergrootglas-icoon bij een zoekveld met `alt="Zoeken"`.

---

## Instructies alleen zichtbaar bij focus

Het is acceptabel als instructies pas zichtbaar worden wanneer het betreffende invoerveld de focus heeft. Dit is vooral nuttig bij lange instructies, om het formulier overzichtelijk te houden.

---

## Meerdere velden voor één invoer

Soms worden meerdere velden gebruikt voor één gegeven (bijv. datum in drie aparte velden: dag, maand, jaar). In dat geval:
- Elk afzonderlijk veld moet een eigen label krijgen (mag visueel verborgen zijn, bijv. via het `title`-attribuut)
- Het overkoepelende label (bijv. "Datum") moet voor alle drie velden gelden — dit kan via `<fieldset>` + `<legend>` (maar dat valt onder SC 1.3.1)

```html
<!-- Goede aanpak -->
<fieldset>
  <legend>Geboortedatum</legend>
  <input type="text" title="Dag" size="2">
  <input type="text" title="Maand" size="2">
  <input type="text" title="Jaar" size="4">
</fieldset>
```

---

## Verplichte velden markeren

**Let op: het markeren van verplichte velden is momenteel een best practice, niet een WCAG-verplichting.** Het wordt sterk aanbevolen en kan als advies worden opgenomen in het auditrapport, maar het ontbreken ervan is geen failure van SC 3.3.2.

Als verplichte velden wél worden gemarkeerd, gelden deze richtlijnen:

```html
<!-- Methode 1: tekst in het label -->
<label for="naam">Naam (verplicht)</label>

<!-- Methode 2: asterisk met uitleg -->
<p>Velden met een * zijn verplicht.</p>
<label for="naam">Naam *</label>

<!-- Methode 3: aria-required -->
<label for="naam">Naam *</label>
<input type="text" id="naam" aria-required="true">
```

**Belangrijk:** Als een asterisk (*) wordt gebruikt, moet de betekenis ervan worden uitgelegd voordat het eerste verplichte veld verschijnt.

---

## Beslisboom

```
Invoerveld gevonden
│
├─ Heeft het veld een zichtbaar label?
│  │
│  ├─ NEE → Is er een instructie die het doel
│  │         van het veld duidelijk maakt?
│  │  │
│  │  ├─ NEE → FAIL (geen label, geen instructie)
│  │  │
│  │  └─ JA → Is de instructie voldoende?
│  │     │     (bijv. aangrenzende knop "Zoeken")
│  │     ├─ JA → PASS
│  │     └─ NEE → FAIL
│  │
│  └─ JA → Is het label beschrijvend genoeg?
│     │
│     ├─ NEE → FAIL (label onduidelijk)
│     │
│     └─ JA → Heeft het veld een speciaal formaat?
│        │
│        ├─ JA → Wordt het formaat uitgelegd?
│        │  │
│        │  ├─ JA → PASS
│        │  └─ NEE → FAIL (formaat niet uitgelegd)
│        │
│        └─ NEE → PASS
│
├─ Is het veld verplicht?
│  │
│  └─ JA → Is dit duidelijk aangegeven?
│     │
│     ├─ JA → OK (aanvullend op het label)
│     └─ NEE → FAIL (verplicht niet aangegeven)
│
└─ Is het een groep gerelateerde velden?
   (radiobuttons, checkboxen, telefoonnummerdelen)
   │
   ├─ JA → Is er een groepslabel?
   │  │    (fieldset/legend of aria-labelledby)
   │  ├─ JA → PASS
   │  └─ NEE → FAIL (geen groepslabel)
   │
   └─ NEE → Beoordeel individueel label
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle formuliervelden

Zoek alle invoerelementen op de pagina:
- Tekstvelden, e-mailvelden, datumvelden, etc.
- Radiobuttons en checkboxen
- Dropdowns/selectieboxen
- Zoekformulieren
- Nieuwsbriefinschrijving

### Stap 2: Controleer of elk veld een label heeft

Per invoerveld:
- Is er een zichtbaar label?
- Is het label beschrijvend (weet de gebruiker wat er wordt verwacht)?
- Is het label niet alleen een placeholder?

### Stap 3: Controleer aanvullende instructies

- Worden verplichte velden aangeduid?
- Worden speciale formaten uitgelegd (datum, telefoonnummer, postcode)?
- Worden selectie-beperkingen uitgelegd ("selecteer maximaal 3")?

### Stap 4: Controleer gegroepeerde velden

- Hebben groepen radiobuttons een groepslabel?
- Hebben groepen checkboxen een groepslabel?
- Hebben gesplitste velden (bijv. telefoonnummer in 3 delen) een groepslabel?

---

## De 6 auditgebieden

### 1. TEKSTVELDEN EN ANDERE INVOERVELDEN

```
Controleer per veld:
- Is er een zichtbaar label?
- Beschrijft het label wat er moet worden ingevuld?

PASS:
<label for="email">E-mailadres</label>
<input type="email" id="email">

FAIL:
<input type="email" placeholder="E-mailadres">
(alleen placeholder, geen label)

FAIL:
<input type="text">
(geen label, geen placeholder, geen instructie)
```

### 2. VERPLICHTE VELDEN

```
Controleer:
- Zijn verplichte velden duidelijk gemarkeerd?
- Is de markering uitgelegd? (bijv. "* = verplicht")

PASS:
Uitleg bovenaan: "Velden met * zijn verplicht"
<label for="naam">Naam *</label>

FAIL:
<label for="naam">Naam *</label>
(asterisk zonder uitleg)

FAIL:
Verplichte velden alleen visueel gemarkeerd
(bijv. dikgedrukt of andere kleur) zonder
tekstuele aanduiding
```

### 3. FORMAAT-INSTRUCTIES

```
Controleer bij velden met een specifiek formaat:
- Wordt het verwachte formaat uitgelegd?

PASS:
<label for="datum">Geboortedatum (dd-mm-jjjj)</label>
<input type="text" id="datum">

PASS:
<label for="postcode">Postcode</label>
<input type="text" id="postcode"
       aria-describedby="postcode-hint">
<span id="postcode-hint">4 cijfers, 2 letters
  (bijv. 1234 AB)</span>

FAIL:
<label for="datum">Geboortedatum</label>
<input type="text" id="datum">
(geen formaat-instructie terwijl een specifiek
 formaat wordt verwacht)
```

### 4. RADIOBUTTONS EN CHECKBOXEN

```
Controleer:
- Heeft elke optie een label?
- Heeft de groep een groepslabel?

PASS:
<fieldset>
  <legend>Hoe wilt u gecontacteerd worden?</legend>
  <input type="radio" id="tel" name="contact">
  <label for="tel">Telefoon</label>
  <input type="radio" id="mail" name="contact">
  <label for="mail">E-mail</label>
</fieldset>

FAIL:
<p>Hoe wilt u gecontacteerd worden?</p>
<input type="radio" name="contact"> Telefoon
<input type="radio" name="contact"> E-mail
(geen programmatische labels, geen groepslabel)
```

### 5. ZOEKFORMULIEREN

```
Het zoekformulier is een speciaal geval:
een aangrenzende knop "Zoeken" kan als
label/instructie dienen.

PASS:
<input type="search" aria-label="Zoeken">
<button>Zoeken</button>

PASS:
<label for="zoek" class="sr-only">Zoeken</label>
<input type="search" id="zoek">
<button>Zoeken</button>

FAIL:
<input type="search">
<button><img src="search.png" alt=""></button>
(geen label, geen toegankelijke naam)
```

### 6. SELECTIEBOXEN / DROPDOWNS

```
Controleer:
- Heeft de selectiebox een label?
- Beschrijft het label de verwachte selectie?

PASS:
<label for="afdeling">Kies een afdeling</label>
<select id="afdeling">
  <option>Burgerzaken</option>
  <option>Financiën</option>
</select>

FAIL:
<select>
  <option>Kies...</option>
  <option>Burgerzaken</option>
</select>
(geen label — de eerste option is geen label)
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Contactformulier

Het meest voorkomende formulier. Typische controles:
- Naam, e-mail, telefoonnummer, onderwerp, bericht
- Verplichte velden gemarkeerd met *
- Controleeer of de * wordt uitgelegd

### Patroon B: Meldingsformulier ("Doe een melding")

Meerstaps-formulieren:
- Elke stap heeft eigen velden
- Controleer of elk veld op elke stap gelabeld is
- Controleer of radiobuttons/checkboxen groepslabels hebben

### Patroon C: Zoekformulier in header

Bijna alle gemeente-websites hebben een zoekformulier:
- Heeft het zoekveld een (eventueel visueel verborgen) label?
- Is de zoekknop gelabeld? (tekst of aria-label)
- Een aangrenzende knop "Zoeken" kan als label dienen

### Patroon D: Nieuwsbriefinschrijving

Vaak een enkel e-mailveld in de footer:
- Heeft het veld een label? (niet alleen placeholder)
- Is de knop gelabeld?

### Patroon E: Datumvelden

Gemeente-formulieren vragen vaak om datums (geboortedatum, datum incident):
- Is het verwachte formaat uitgelegd?
- Bij gescheiden velden (dag/maand/jaar): is er een groepslabel?

### Patroon F: Adresvelden

Postcode + huisnummer in gescheiden velden:
- Heeft elk veld een eigen label?
- Is er uitleg over het formaat? (bijv. "4 cijfers, 2 letters")

---

## Onderscheid met andere SC's

| SC | Relatie met 3.3.2 |
|----|------------------|
| **1.3.1** | Info en relaties: het label is programmatisch gekoppeld aan het veld (`<label for>`, `aria-labelledby`). SC 3.3.2 gaat over de aanwezigheid en duidelijkheid van het label. |
| **2.4.6** | Koppen en labels: labels zijn beschrijvend. SC 3.3.2 gaat over aanwezigheid, 2.4.6 over beschrijvendheid. |
| **3.3.1** | Foutidentificatie: foutmelding achteraf. SC 3.3.2 gaat over instructies vooraf. |
| **3.3.2** | **Labels of instructies: labels en instructies zijn aanwezig bij invoervelden.** |
| **4.1.2** | Naam, rol, waarde: elk besturingselement heeft een accessible name. SC 3.3.2 gaat over zichtbare labels/instructies. |

### Belangrijk verschil SC 1.3.1 vs. SC 3.3.2

- **1.3.1:** Is het label **programmatisch gekoppeld**? (technisch: `<label for>`, `aria-labelledby`, etc.)
- **3.3.2:** Is het label **aanwezig en duidelijk**? (inhoudelijk: weet de gebruiker wat er wordt verwacht?)

Een formulier kan 1.3.1 passeren (label is gekoppeld) maar 3.3.2 falen (label is niet duidelijk). En vice versa.

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G131 | Beschrijvende labels geven (in combinatie met onderstaande) |
| ARIA1 | `aria-describedby` gebruiken voor aanvullende beschrijving |
| ARIA9 | `aria-labelledby` gebruiken om een label samen te stellen uit meerdere tekstelementen |
| ARIA17 | Groepeerrollen gebruiken om gerelateerde formuliervelden te identificeren |
| H44 | `<label>` elementen gebruiken om labels te koppelen aan invoervelden |
| H71 | `<fieldset>` en `<legend>` gebruiken voor groepen formuliervelden |
| H65 | `title` attribuut gebruiken als het label-element niet kan worden gebruikt |
| G184 | Tekstinstructies geven aan het begin van een formulier |
| G162 | Labels positioneren om de relatie voorspelbaar te maken |
| G83 | Tekstbeschrijving geven voor verplichte velden die niet zijn ingevuld |
| G167 | Een aangrenzende knop gebruiken om het doel van een veld te labelen |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F82 | Visueel een set velden opmaken (bijv. telefoonnummer) maar geen tekstlabel opnemen |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-6: tekstvelden | verplichte velden |
                  formaat-instructies | radio/checkbox |
                  zoekformulier | selectieboxen]
Formulier:       [beschrijving / URL]
Veld:            [naam of beschrijving van het veld]
Beoordeling:     [PASS | FAIL]

Zichtbaar label
aanwezig:        [ja/nee]
Label
beschrijvend:    [ja/nee]
Alleen
placeholder:     [ja/nee — als ja: FAIL]
Formaat-
instructie:      [ja/nee/n.v.t.]
Verplicht
aangeduid:       [ja/nee/n.v.t.]
Groepslabel:     [ja/nee/n.v.t.]

Probleem:        [specifieke beschrijving]
Technique:       [H44 / H71 / G131 / G184 / F82]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Placeholder als enige label** — het meest voorkomende probleem: placeholder verdwijnt bij typen
2. **Formaat niet uitgelegd** — datumveld zonder "dd-mm-jjjj", postcodeveld zonder formaat. Testmethode: vul zelf een waarde in een ander formaat in → als je een foutmelding krijgt over verkeerd formaat terwijl er geen instructie stond, is het een failure
3. **Instructies onder het formulier** — instructies en uitleg moeten bij het invoerveld staan, niet eronder of op een andere plek op de pagina
4. **Groepslabel ontbreekt** — radiobuttons of checkboxen zonder `<fieldset>`/`<legend>`
5. **Gesplitste velden zonder individueel label** — telefoonnummer of datum in meerdere velden zonder labels per deel (mag visueel verborgen via title-attribuut)
6. **Zoekformulier zonder label** — geen zichtbaar of verborgen label, geen aria-label
7. **Selectiebox zonder label** — eerste `<option>` ("Kies...") wordt als label gebruikt, maar is geen label

### Snelle audit-methode

1. Vind alle formulieren op de pagina
2. Controleer per veld: is er een zichtbaar label? (niet alleen placeholder)
3. Controleer: zijn verplichte velden gemarkeerd?
4. Controleer: worden speciale formaten uitgelegd?
5. Controleer: hebben groepen (radio/checkbox) een groepslabel?

### Technisch of redactioneel issue?

SC 3.3.2 is een **mix van technisch en redactioneel**:
- **Technisch:** Het CMS/formuliercomponent moet labels ondersteunen en correct koppelen
- **Redactioneel:** De redacteur moet duidelijke labels en instructies schrijven

Bij Shift2: deels **technische audit** (template-labels, zoekformulier) en deels **content audit** (labelteksten, instructies bij specifieke formulieren).

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — hebben labels nodig om te weten wat elk veld verwacht
- **Mensen met cognitieve beperkingen** — duidelijke labels en instructies verminderen verwarring
- **Mensen met beperkt gezichtsvermogen** — vergroting kan de relatie label-veld verstoren; correcte koppeling helpt
- **Alle gebruikers** — duidelijke labels en instructies voorkomen fouten en frustratie

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 3.3.2 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 3.3.2:** https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html
- **Technique H44 (label elementen):** https://www.w3.org/WAI/WCAG22/Techniques/html/H44
- **Technique H71 (fieldset/legend):** https://www.w3.org/WAI/WCAG22/Techniques/html/H71
- **Technique G131 (beschrijvende labels):** https://www.w3.org/WAI/WCAG22/Techniques/general/G131
- **Technique G184 (instructies bij formulier):** https://www.w3.org/WAI/WCAG22/Techniques/general/G184
- **Failure F82 (geen tekstlabel bij gesplitste velden):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F82
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
