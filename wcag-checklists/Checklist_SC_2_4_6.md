---
name: wcag-2-4-6-headings-and-labels
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 2.4.6 (Headings and Labels) on Dutch government websites. Use when conducting accessibility audits to verify that headings and labels are descriptive and clearly describe the topic or purpose. Covers koppen (h1-h6), formulier-labels, niet-beschrijvende koppen, generieke labels, de relatie met SC 1.3.1 en SC 3.3.2, en veelvoorkomende patronen op gemeente-websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 2.4.6 Koppen en labels — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 2.4.6 (Niveau AA):**
Koppen en labels beschrijven het onderwerp of doel.

**Kernprincipe:** Als koppen (headings) of labels worden gebruikt, moeten ze beschrijvend zijn. Ze moeten duidelijk maken wat de content in de betreffende sectie bevat, of wat het doel is van het formulier-element.

---

## Cruciale nuance: "als ze worden gebruikt"

SC 2.4.6 **vereist niet** dat koppen of labels aanwezig zijn. Het vereist alleen dat **als** ze er zijn, ze beschrijvend moeten zijn.

- Geen koppen op de pagina? → SC 2.4.6 is niet van toepassing (maar mogelijk wel een issue onder SC 2.4.10 op AAA-niveau, of een best-practice-probleem)
- Geen labels bij formuliervelden? → SC 2.4.6 is niet van toepassing (maar wel een issue onder SC 3.3.2 Labels of Instructies)
- Koppen aanwezig maar niet beschrijvend? → **FAIL onder SC 2.4.6**
- Labels aanwezig maar niet beschrijvend? → **FAIL onder SC 2.4.6**

---

## Auditscope: thema B vs. thema E

Bij Shift2-audits wordt SC 2.4.6 in twee fasen beoordeeld:
- **Thema B (structuur):** Beoordeel vooral de **koppen** en beperkt de labels van interactieve componenten (knoppen, keuzelijsten, etc.)
- **Thema E (formulieren):** Beoordeel de **labels** specifiek in relatie tot invoervelden

Dit voorkomt dubbel werk en sluit aan bij de logische auditflow.

---

## Wat zijn "koppen" en "labels"?

### Koppen (Headings)

Een kop is een stuk tekst dat iets zegt over de tekst eronder. **Een "kop" zonder tekst eronder is dus automatisch ook geen kop.**

Koppen kunnen zijn:
- HTML heading-elementen: `<h1>` t/m `<h6>`
- Elementen met `role="heading"`
- Teksten die visueel als kop zijn opgemaakt (groter, vet) maar niet als heading gemarkeerd — deze falen onder SC 1.3.1, niet onder SC 2.4.6

**PDF-koppen:** Voor PDF-documenten geldt hetzelfde als voor HTML-pagina's. Ook de koppen in een PDF-document moeten beschrijvend zijn voor de content waar de kop bij hoort.

### Labels

Het woord "label" in SC 2.4.6 is breder dan alleen het HTML `<label>` element. Het gaat om de **zichtbare tekst** ("tekstlabel") van een interactief element:
- `<label>` elementen bij formuliervelden
- Zichtbare tekst op **knoppen** (`<button>`)
- Zichtbare tekst bij **keuzelijsten**, **selectievakjes**, **radiobuttons**
- Tekst bij andere interactieve componenten
- Iconen met tekst-alternatieven die als label dienen (bijv. vergrootglas met alt="Zoeken")

**Koppen vs. labels:** Koppen zijn niet interactief. Alle interactieve componenten kunnen een zichtbaar tekstlabel hebben. Omdat koppen niet interactief zijn maar wel onder dit SC vallen, zijn ze apart benoemd.

**Visueel verborgen teksten:** SC 2.4.6 gaat puur om de **zichtbare** teksten. Visueel verborgen teksten (sr-only, aria-label) worden op kwaliteit beoordeeld bij SC 1.1.1 (tekst-alternatieven) of SC 4.1.2 (accessible name), niet bij SC 2.4.6.

**Links:** Links vallen ook onder SC 2.4.6, maar worden al apart beoordeeld bij SC 2.4.4 (Linkdoel in context). De eisen bij SC 2.4.4 zijn strenger. Daarom keuren we links niet dubbel af onder SC 2.4.6.

---

## Drie verwante maar gescheiden criteria

Dit is essentieel om te begrijpen. Drie criteria raken aan koppen en labels, maar toetsen elk iets anders:

| SC | Wat wordt getoetst | Voorbeeld failure |
|----|-------------------|-------------------|
| **1.3.1** | Is de kop/het label **programmatisch bepaalbaar**? (Is het correct gemarkeerd in de code?) | Tekst is visueel groot en vet maar niet als `<h2>` gemarkeerd |
| **2.4.6** | Is de kop/het label **beschrijvend**? (Beschrijft het de content of het doel?) | `<h2>Meer informatie</h2>` boven een sectie over afvalinzameling |
| **3.3.2** | Is er een label of instructie **aanwezig** bij invoervelden? | Formulierveld zonder enig label |
| **4.1.2** | Heeft het element een **accessible name**? (via label, aria-label, etc.) | Input met `aria-label="veld1"` — heeft een name maar niet beschrijvend |

**Het is mogelijk dat:**
- Een kop slaagt voor SC 1.3.1 (correct gemarkeerd als `<h2>`) maar faalt voor SC 2.4.6 (niet beschrijvend)
- Een label slaagt voor SC 4.1.2 (heeft een accessible name via `aria-label`) maar faalt voor SC 2.4.6 (de labeltekst is niet beschrijvend)
- Content slaagt voor SC 2.4.6 (beschrijvende tekst) maar faalt voor SC 1.3.1 (niet als heading gemarkeerd)

---

## Wat maakt een kop "beschrijvend"?

### Een goede kop:

- **Beschrijft de content** die in de sectie eronder staat
- **Is begrijpelijk zonder context** — werkt ook in een automatisch gegenereerde inhoudsopgave of bij het navigeren van kop naar kop
- **Helpt de gebruiker te voorspellen** wat de sectie bevat
- **Is beknopt maar informatief** — een enkel woord kan voldoende zijn als het de juiste aanwijzing geeft

### Voorbeelden van goede koppen:

```
✓ "Paspoort aanvragen"
✓ "Openingstijden"
✓ "Veelgestelde vragen over afvalinzameling"
✓ "Stap 2: Kies een datum"
✓ "Contact"
```

### Voorbeelden van niet-beschrijvende koppen:

```
✗ "Meer informatie" (waarover?)
✗ "Lees meer" (waarover?)
✗ "Belangrijk" (wat is belangrijk?)
✗ "Hier" (waar?)
✗ "Sectie 1", "Sectie 2" (wat staat erin?)
✗ "..." of lege koppen
```

---

## Wat maakt een label "beschrijvend"?

### Een goed label:

- **Beschrijft wat er verwacht wordt** als invoer
- **Is ondubbelzinnig** — de gebruiker hoeft niet te raden
- **Is beknopt maar volledig** — "Voornaam" is beter dan "Naam" als er ook een achternaamveld is

### Voorbeelden van goede labels:

```
✓ "Voornaam"
✓ "Achternaam"
✓ "E-mailadres"
✓ "Telefoonnummer (optioneel)"
✓ "Zoeken"
✓ "Werktelefoon"
✓ "Privételefoon"
```

### Voorbeelden van niet-beschrijvende labels:

```
✗ "Veld 1", "Veld 2"
✗ "Invoer"
✗ "Tekst hier"
✗ "Naam" (als er meerdere naamvelden zijn — welke naam?)
✗ "Adres 1", "Adres 2" (beter: "Adresregel 1", "Adresregel 2")
✗ "Telefoon", "Telefoon" (twee keer dezelfde label voor
   werk- en privételefoon)
```

---

## Beslisboom

```
Koppen of labels aanwezig op de pagina?
│
├─ NEE → SC 2.4.6 is NIET van toepassing
│        (mogelijk issue onder SC 3.3.2 of SC 2.4.10)
│
└─ JA → Per kop/label: beschrijft het het onderwerp of doel?
   │
   ├─ JA → Is het begrijpelijk zonder omliggende context?
   │  │
   │  ├─ JA → PASS
   │  └─ NEE → FAIL (kop/label is niet zelfstandig beschrijvend)
   │
   └─ NEE → FAIL (kop/label is generiek of misleidend)
```

---

## Stapsgewijze auditprocedure

### Belangrijk: visuele beoordeling

SC 2.4.6 gaat om de **visuele tekst**. Het gaat er NIET om of de juiste HTML-elementen zijn gebruikt (dat wordt bij SC 1.3.1 gecontroleerd). Bekijk de pagina visueel en beoordeel of de zichtbare kopteksten en labels beschrijvend zijn.

### Drempel voor afkeuren

**Alleen afkeuren als het echt onzin is.** Als een kop of label niet helemaal perfect is, maar wel redelijk en begrijpelijk, dan gewoon goedkeuren. Het criterium vraagt dat koppen en labels "het onderwerp of doel beschrijven" — niet dat ze perfect geformuleerd zijn.

### Stap 1: Inventariseer alle koppen

Bekijk de webpagina of PDF visueel en identificeer alle koppen:
- Welke teksten fungeren als kop (groter, vetter, boven een sectie)?
- Optioneel: gebruik **HeadingsMap** extensie, **WAVE** toolbar, of screenreader-koppenlijst (NVDA: Insert+F7) om alle heading-elementen te tonen

Bekijk de koppenlijst: zijn de koppen op zichzelf staand begrijpelijk?

### Stap 2: Beoordeel elke kop

Stel per kop:
- Beschrijft deze kop wat er in de sectie eronder staat?
- Zou ik aan alleen de kop kunnen zien wat de sectie bevat?
- Is de kop niet te generiek (bijv. "Meer", "Info", "Overig")?
- **Is het echt onzin?** → Alleen dan afkeuren

### Stap 3: Inventariseer alle labels (visueel)

Bekijk de pagina visueel en identificeer alle zichtbare tekstlabels van interactieve componenten:
- Knoppen (wat staat erop?)
- Keuzelijsten, selectievakjes, radiobuttons
- Formuliervelden (thema E)
- **Let op:** Links worden bij SC 2.4.4 beoordeeld, niet hier dubbel afkeuren

### Stap 4: Beoordeel elke label

Stel per label:
- Beschrijft het label duidelijk de functie of het doel van de component?
- Zou een gebruiker weten wat er gebeurt als hij de knop activeert?
- Zijn labels uniek waar nodig (bijv. niet twee keer "Verzenden" voor verschillende acties)?

---

## De 4 auditgebieden

### 1. PAGINAKOPPEN (H1-H6)

```
Controleer:
- Is de h1 beschrijvend voor de pagina-inhoud?
- Beschrijven subkoppen (h2, h3, etc.) hun secties?
- Zijn er generieke koppen zoals "Meer informatie",
  "Lees meer", "Overig"?
- Zijn er dubbele koppen die niet te onderscheiden zijn?

Veelvoorkomend op gemeente-websites:
- h2 "Meer informatie" boven gerelateerde links
  → Beter: "Gerelateerde informatie over afvalinzameling"
- h2 "Downloads" zonder context
  → Acceptabel als het duidelijk is dat het
    downloads bij het huidige onderwerp betreft
```

### 2. FORMULIER-LABELS

```
Controleer:
- Beschrijft elk label wat er ingevuld moet worden?
- Zijn labels uniek waar nodig?
- Zijn labels niet misleidend?

Veelvoorkomend op gemeente-websites:
- Afspraakformulieren met generieke labels
- Contactformulieren met "Bericht" zonder context
  → Acceptabel: "Bericht" is in de context van een
    contactformulier voldoende beschrijvend
- Zoekformulieren met alleen een vergrootglas-icoon
  → Acceptabel als het icoon een tekst-alternatief
    "Zoeken" heeft en dit breed begrepen wordt
```

### 3. NAVIGATIE-KOPPEN

```
Controleer:
- Hebben navigatiesecties beschrijvende koppen?
  (bijv. "Hoofdnavigatie", "Snelkoppelingen",
   "Gerelateerde pagina's")

Let op: visueel verborgen koppen (sr-only) vallen NIET
onder SC 2.4.6 — die worden beoordeeld bij SC 1.1.1
of SC 4.1.2. SC 2.4.6 gaat puur om zichtbare teksten.
```

### 4. TABEL-KOPPEN

```
Controleer:
- Hebben tabelkoppen (<th>) beschrijvende tekst?
- Zijn rij- en kolomkoppen duidelijk genoeg om de
  datacel te begrijpen?

Veelvoorkomend op gemeente-websites:
- Openingstijdentabel met "Dag" en "Tijd" als koppen
  → Voldoende beschrijvend
- Tarieven met "Bedrag" als kop
  → Voldoende, maar "Tarief (€)" is beter
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: "Meer informatie"-koppen

Veel gemeente-pagina's hebben een sectie met gerelateerde links onder een kop "Meer informatie" of "Zie ook".

```
Minder goed:
<h2>Meer informatie</h2>

Beter:
<h2>Meer informatie over paspoort aanvragen</h2>

Beoordeling: "Meer informatie" is generiek maar niet altijd
een failure — als de context duidelijk maakt waar "meer
informatie" over gaat (bijv. direct onder het hoofdonderwerp).
Bij navigatie van kop naar kop (screenreader) is het
echter onduidelijk. Daarom: bij voorkeur specifieker.
```

### Patroon B: Nieuwsoverzicht met identieke koppen

```
Als een nieuwsoverzicht meerdere items toont met elk
een eigen kop, moeten die koppen uniek en beschrijvend zijn.

PASS:
<h2>Werkzaamheden N201 gestart</h2>
<h2>Nieuw afvalbeleid 2026</h2>
<h2>Subsidie duurzame energie aanvragen</h2>

FAIL:
<h2>Nieuwsbericht</h2>
<h2>Nieuwsbericht</h2>
<h2>Nieuwsbericht</h2>
(niet te onderscheiden)
```

### Patroon C: Formulier met adresvelden

```
FAIL:
Label: "Adres"
Label: "Adres"
(twee velden met dezelfde label — welk is straat,
 welk is postcode?)

PASS:
Label: "Straatnaam en huisnummer"
Label: "Postcode"
Label: "Woonplaats"
```

### Patroon D: Zoekfunctie

```
Een zoekveld met alleen een vergrootglas-icoon:
- Heeft het icoon alt="Zoeken"? → Beschrijvend label ✓
- Is het gebruik van een vergrootglas als "zoeken"
  breed begrepen? → JA, dit is een conventie ✓
→ PASS

Maar: een vergrootglas-icoon naast een afbeelding
(als zoom-functie) heeft een andere betekenis.
Context bepaalt of het label beschrijvend is.
```

### Patroon E: Herhalende koppen in sjablonen

```
CMS-sjablonen genereren soms vaste koppen:
- "Downloads" op elke productpagina
- "Veelgestelde vragen" op elke dienstpagina
- "Contact" op elke pagina

Beoordeling: deze koppen zijn beschrijvend in hun context
(downloads bij DIT product, FAQ's over DEZE dienst).
Dit is PASS — ze beschrijven het onderwerp van de sectie.
```

---

## Wat is GEEN failure onder SC 2.4.6

Het is belangrijk om te weten wat NIET onder dit criterium valt:

| Situatie | Geen failure onder SC 2.4.6 | Wel failure onder... |
|----------|----------------------------|---------------------|
| Geen koppen aanwezig | SC 2.4.6 niet van toepassing | Mogelijk SC 2.4.10 (AAA) |
| Koppen niet als heading gemarkeerd | SC 2.4.6 niet van toepassing (geen heading = niet te beoordelen) | SC 1.3.1 |
| Geen labels bij formuliervelden | SC 2.4.6 niet van toepassing | SC 3.3.2 |
| Heading-niveaus overgeslagen (h1→h3) | Geen WCAG failure | Best practice |
| Meerdere h1's op de pagina | Geen WCAG failure | Best practice |
| Geen h1 op de pagina | Geen WCAG failure | Best practice |

---

## Onderscheid met andere SC's

| SC | Relatie met 2.4.6 |
|----|------------------|
| **1.1.1** | Tekst-alternatieven: visueel verborgen teksten (sr-only, aria-label) worden hier beoordeeld op kwaliteit, niet bij 2.4.6. |
| **1.3.1** | Is de kop/label programmatisch bepaalbaar? (Correcte HTML-markup.) SC 2.4.6 gaat over de visuele tekst, 1.3.1 over de code. |
| **2.4.2** | Paginatitel: beschrijvende titel in `<title>`. Apart van koppen. |
| **2.4.4** | Linkdoel (in context): links worden hier beoordeeld, niet dubbel bij 2.4.6. De eisen bij 2.4.4 zijn strenger. |
| **2.4.6** | **Koppen en labels beschrijven het onderwerp of doel.** |
| **2.4.10** | Sectiekoppen worden gebruikt om content te organiseren (AAA). |
| **3.3.2** | Labels of instructies zijn **aanwezig** bij invoervelden. 2.4.6 gaat over de **kwaliteit** van labels, 3.3.2 over de **aanwezigheid**. |
| **4.1.2** | Naam, Rol, Waarde: elementen hebben een accessible name (kan verborgen zijn). 2.4.6 gaat over de zichtbare tekst. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| G130 | Beschrijvende koppen bieden |
| G131 | Beschrijvende labels bieden |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| — | Unieke sectiekoppen gebruiken op een pagina |
| — | Sectiekoppen beginnen met unieke informatie |

### Failure Techniques

Er zijn geen formeel gedefinieerde failure techniques voor SC 2.4.6, maar niet-beschrijvende koppen of labels zijn een failure.

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: paginakoppen | formulier-labels |
                  navigatie-koppen | tabel-koppen]
Element:         [de kop of het label in kwestie]
Type:            [heading h1-h6 | label | aria-label | th]
Locatie:         [positie op pagina / URL]
Beoordeling:     [PASS | FAIL]

Beschrijvend:    [ja/nee — beschrijft het de content/het doel?]
Begrijpelijk
zonder context:  [ja/nee — werkt het in een koppenlijst?]
Uniek:           [ja/nee — te onderscheiden van andere koppen/labels?]

Probleem:        [specifieke beschrijving]
Huidige tekst:   [de huidige kop-/labeltekst]
Aanbeveling:     [concrete suggestie voor betere tekst]
Technique:       [G130 / G131]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Generieke koppen** — "Meer informatie", "Lees meer", "Overig", "Downloads" zonder context
2. **Dubbele identieke koppen** — meerdere secties met dezelfde koptekst die niet te onderscheiden zijn
3. **Niet-beschrijvende formulier-labels** — "Veld 1", "Invoer", of twee keer "Telefoon"
4. **Lege koppen** — heading-elementen zonder tekst (ook een SC 1.3.1 issue)
5. **Misleidende koppen** — kop die iets anders suggereert dan de content eronder

### Snelle audit-methode

1. Open de HeadingsMap extensie of de screenreader-koppenlijst
2. Lees alleen de koppen: kan je aan de koppenlijst een goed beeld krijgen van de pagina-inhoud?
3. Zo nee → waarschijnlijk niet-beschrijvende koppen

### Technisch of redactioneel issue?

SC 2.4.6 is primair een **redactioneel issue**:
- De redacteur schrijft de kopteksten en labelteksten
- Het CMS/template bepaalt alleen de markup (SC 1.3.1)
- De inhoud van de kop is de verantwoordelijkheid van de contentmaker

**Uitzondering:** Als het CMS automatisch koppen genereert (bijv. "Downloads", "Gerelateerd") → dan is het een template/technisch issue.

Bij Shift2: valt typisch onder de **content audit** (redactioneel), tenzij het template automatische koppen genereert (dan Cardan/technisch).

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — navigeren van kop naar kop; beschrijvende koppen geven context zonder de hele sectie te lezen
- **Mensen met cognitieve beperkingen** — voorspelbare koppen helpen bij het vinden en begrijpen van content
- **Mensen met beperkt kortetermijngeheugen** — sectietitels helpen te onthouden waar content over gaat
- **Mensen met motorische beperkingen** — minder toetsaanslagen nodig als koppen duidelijk de weg wijzen
- **Slechtzienden** — zien maar een paar woorden tegelijk; beschrijvende koppen geven snel overzicht
- **Alle gebruikers** — scannen pagina's eerder dan dat ze woord voor woord lezen; koppen zijn ankerpunten

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 2.4.6 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 2.4.6:** https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html
- **Technique G130 (beschrijvende koppen):** https://www.w3.org/WAI/WCAG22/Techniques/general/G130
- **Technique G131 (beschrijvende labels):** https://www.w3.org/WAI/WCAG22/Techniques/general/G131
- **TPGi — When do headings fail WCAG?:** https://www.tpgi.com/heading-off-confusion-when-do-headings-fail-wcag/
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
