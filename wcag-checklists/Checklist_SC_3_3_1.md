---
name: wcag-3-3-1-error-identification
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.3.1 (Error Identification) on Dutch government websites. Use when conducting accessibility audits to verify that automatically detected input errors are identified and described to the user in text. Covers form validation, error messages, aria-invalid, aria-describedby, error summaries, inline errors, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.3.1 Foutidentificatie — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.3.1 (Niveau A):**
Als een invoerfout automatisch wordt ontdekt, wordt het onderdeel waar de fout zit geïdentificeerd en wordt de fout in tekst aan de gebruiker beschreven.

**Kernprincipe:** Twee eisen in één criterium:
1. **Identificatie:** het veld met de fout wordt aangewezen
2. **Beschrijving:** de fout wordt in **tekst** uitgelegd

Alleen een rode rand om een veld, of alleen een kleurverandering, is NIET voldoende. De fout moet in tekst worden beschreven.

---

## Wat is een "invoerfout"?

De WCAG-definitie van "input error" omvat twee situaties:

1. **Informatie die vereist is maar ontbreekt** — een verplicht veld dat niet is ingevuld
2. **Informatie die niet voldoet aan het vereiste formaat of de toegestane waarden** — bijv. een ongeldig e-mailadres, letters in een telefoonnummerveld, een datum in het verkeerde formaat

**Belangrijk:** Het gaat om fouten die **automatisch** worden ontdekt (door client-side of server-side validatie). Fouten die niet automatisch gedetecteerd worden, vallen niet onder dit criterium.

---

## Twee eisen uitgelegd

### Eis 1: Het fout-veld wordt geïdentificeerd

De gebruiker moet weten **welk veld** de fout bevat. Methoden:
- De foutmelding staat direct bij het betreffende veld
- De foutmelding noemt het veld expliciet ("Het veld 'E-mailadres' bevat een fout")
- Een foutoverzicht bovenaan het formulier met links naar de foutvelden

### Eis 2: De fout wordt in tekst beschreven

De gebruiker moet weten **wat er mis is**. De foutmelding moet specifiek genoeg zijn om de gebruiker te helpen de fout te corrigeren.

```
FAIL — te vaag:
"Fout"
"Ongeldige invoer"
"Dit veld is onjuist"

PASS — specifiek genoeg:
"Vul een geldig e-mailadres in (bijv. naam@voorbeeld.nl)"
"Voer een postcode in (4 cijfers, 2 letters)"
"Het telefoonnummer mag alleen cijfers bevatten"
"Dit veld is verplicht"
```

**Let op:** "Dit veld is verplicht" is voor een leeg verplicht veld specifiek genoeg — het is duidelijk wat er mis is (het veld is niet ingevuld) en wat de gebruiker moet doen (het veld invullen).

---

## Foutmelding vs. instructie

**Belangrijk onderscheid:** Een foutmelding beschrijft wat er fout is gegaan. Een instructie vertelt wat de gebruiker moet doen. SC 3.3.1 vereist een **foutmelding**, niet een instructie.

```
INSTRUCTIE (geen foutmelding):
"Vul een geldige plaats in"
"Voer uw e-mailadres in"
"Selecteer een optie"

FOUTMELDING (wel correct):
"U heeft geen geldige plaats ingevuld"
"Het ingevulde e-mailadres is niet geldig"
"Er is geen optie geselecteerd"
```

**Uitzondering:** Een instructie bij het veld is wél acceptabel in combinatie met een algemene foutmelding bovenaan het formulier, zoals "Er zijn fouten gevonden in het formulier." Dan mag verwacht worden dat de gebruiker "Voer een geldig e-mailadres in" opvat als onderdeel van de foutmeldingen waar bovenaan naar verwezen wordt.

---

## Positie bepaalt vereiste specifiekheid

De positie van de foutmelding bepaalt hoe specifiek deze moet zijn:

- **Direct vóór of na het invoerveld** → "Dit veld is verplicht" is voldoende (de positie maakt duidelijk welk veld)
- **Elders op de pagina** (bijv. in een foutoverzicht bovenaan) → de naam van het veld moet worden genoemd: "Het veld 'E-mailadres' is verplicht"

Voor blinde bezoekers is het anders niet duidelijk om welk veld het gaat als de melding niet direct bij het veld staat.

---

## Ingevulde gegevens mogen niet verloren gaan

Bij het opnieuw tonen van het formulier na foutdetectie moeten alle eerder ingevulde gegevens behouden blijven. De gebruiker mag niet gedwongen worden alles opnieuw in te vullen. Uitzondering: beveiligingsvelden (bijv. wachtwoorden, captcha) mogen worden gewist.

---

## "In tekst" — niet alleen visueel

De foutmelding moet **in tekst** beschikbaar zijn, niet alleen via visuele middelen:

```
FAIL — alleen visueel:
- Alleen een rode rand om het veld
- Alleen een kleurverandering van het label
- Alleen een icoon (uitroepteken) zonder tekst
- Alleen een tooltip die verschijnt bij hover

PASS — in tekst:
- Foutmelding in tekst naast het veld
- Foutmelding in tekst + rode rand (visueel versterkt)
- Foutmelding in tekst + icoon + rode rand (nog beter)
```

**Visuele versterking is goed**, maar de tekst is de eis. Kleur en iconen zijn aanvullend, niet vervangend.

---

## Programmatische koppeling

Hoewel SC 3.3.1 dit niet expliciet eist, is het sterk aanbevolen (en nodig voor andere SC's) om de foutmelding programmatisch aan het veld te koppelen:

```html
<!-- Goede implementatie -->
<label for="email">E-mailadres</label>
<input type="email" id="email"
       aria-invalid="true"
       aria-describedby="email-error">
<span id="email-error" class="error">
  Vul een geldig e-mailadres in.
</span>
```

**`aria-invalid="true"`** — markeert het veld als ongeldig voor screenreaders
**`aria-describedby`** — koppelt de foutmelding aan het veld, zodat de screenreader de foutmelding voorleest bij het veld

**Let op:** `aria-invalid` moet alleen op `true` staan als er daadwerkelijk een fout is gedetecteerd — niet standaard bij het laden van het formulier.

---

## Beslisboom

```
Formulier ingediend / validatie getriggerd
│
├─ Worden fouten automatisch gedetecteerd?
│  └─ NEE → SC 3.3.1 niet van toepassing
│
└─ JA → Per gedetecteerde fout:
   │
   ├─ Wordt het fout-veld geïdentificeerd?
   │  └─ NEE → FAIL (veld niet aangewezen)
   │
   ├─ Wordt de fout in tekst beschreven?
   │  │
   │  ├─ NEE (alleen kleur/icoon) → FAIL
   │  │
   │  └─ JA → Is de beschrijving specifiek genoeg
   │           om de gebruiker te helpen?
   │     │
   │     ├─ NEE (te vaag: "Fout") → FAIL
   │     │
   │     └─ JA → PASS
   │
   └─ Wordt de fout voor screenreaders aangekondigd?
      (niet expliciet vereist door 3.3.1, maar
       sterk aanbevolen en raakt andere SC's)
```

---

## Stapsgewijze auditprocedure

### Stap 1: Vind formulieren op de pagina

Zoek naar:
- Contactformulieren
- Zoekformulieren
- Aanvraagformulieren
- Inlogformulieren
- Nieuwsbriefinschrijving
- Meldingsformulieren (bijv. "Doe een melding")

### Stap 2: Trigger foutmeldingen

Probeer het formulier in te dienen:
- Laat verplichte velden leeg
- Voer ongeldige waarden in (bijv. letters in een telefoonnummerveld)
- Voer een ongeldig e-mailadres in
- Voer een ongeldige postcode in

### Stap 3: Beoordeel de foutmeldingen

Per foutmelding, controleer:
1. **Wordt het fout-veld aangewezen?** — staat de melding bij het juiste veld?
2. **Is de fout in tekst beschreven?** — niet alleen kleur/icoon?
3. **Is de beschrijving specifiek genoeg?** — weet de gebruiker wat er mis is?

### Stap 4: Test met screenreader (optioneel maar aanbevolen)

- Tab door het formulier na foutmeldingen
- Worden de fouten aangekondigd?
- Wordt `aria-invalid` gebruikt?
- Is de foutmelding via `aria-describedby` gekoppeld?

---

## De 5 auditgebieden

### 1. VERPLICHTE VELDEN DIE NIET ZIJN INGEVULD

```
Trigger: dien het formulier in met lege verplichte velden

Controleer:
- Wordt per leeg verplicht veld een foutmelding getoond?
- Is de melding in tekst? (niet alleen rode rand)
- Is de melding specifiek? ("Dit veld is verplicht"
  of "Vul uw naam in")

PASS:
"Het veld 'Naam' is verplicht."

FAIL:
Alleen een rode rand om het lege veld
"Fout" zonder verdere uitleg
Geen foutmelding zichtbaar
```

### 2. ONGELDIGE INVOERWAARDEN

```
Trigger: voer ongeldige waarden in
(letters in telefoonnummer, ongeldig e-mail, etc.)

Controleer:
- Wordt de fout specifiek beschreven?
- Wordt het verwachte formaat uitgelegd?

PASS:
"Vul een geldig e-mailadres in (bijv. naam@voorbeeld.nl)"
"De postcode moet bestaan uit 4 cijfers en 2 letters"

FAIL:
"Ongeldige invoer"
"Dit veld is onjuist"
```

### 3. FOUTOVERZICHT (ERROR SUMMARY)

```
Sommige formulieren tonen een foutoverzicht bovenaan:

Controleer:
- Wordt het foutoverzicht na submit getoond?
- Noemt het overzicht de specifieke velden?
- Zijn het links naar de foutvelden? (best practice)
- Krijgt het overzicht focus na submit? (best practice)

Een foutoverzicht is NIET vereist door SC 3.3.1,
maar als het er is, moeten de individuele foutmeldingen
bij de velden ook in tekst aanwezig zijn.
```

### 4. INLINE VALIDATIE (REAL-TIME)

```
Sommige formulieren valideren terwijl je typt:

Controleer:
- Wordt de foutmelding in tekst getoond?
- Verschijnt de melding op een logisch moment?
  (niet meteen bij het eerste karakter, maar bijv.
   na het verlaten van het veld)
- Wordt de melding voor screenreaders aangekondigd?
  (role="alert" of aria-live="polite")

Let op: inline validatie die te vroeg triggert
(bijv. "Ongeldig e-mailadres" terwijl de gebruiker
nog aan het typen is) kan verwarrend zijn, maar is
geen WCAG-failure zolang de foutmelding in tekst is.
```

### 5. BROWSER-VALIDATIE (NATIVE)

```
Sommige formulieren gebruiken native browser-validatie
(HTML5 required, type="email", pattern, etc.)

Controleer:
- Toont de browser een foutmelding?
- Is de melding in de taal van de gebruiker?
  (browser-afhankelijk — niet door auteur te beïnvloeden)
- Worden alle fouten gemeld of alleen de eerste?
  (browsers tonen vaak maar één fout per keer)

Native browser-validatie is in principe voldoende
voor SC 3.3.1, maar heeft beperkingen:
- Stijl is niet aanpasbaar
- Screenreader-ondersteuning varieert
- Vaak wordt maar één fout per keer getoond
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Contactformulier

Het contactformulier is het meest voorkomende formulier op gemeente-websites. Typische velden: naam, e-mail, telefoonnummer, onderwerp, bericht.

```
Controleer:
- Worden verplichte velden gemarkeerd VOORAF?
  (visueel met * + tekst "Verplicht veld",
   en/of met aria-required="true")
  → Dit valt onder SC 3.3.2 (Labels of instructies)
- Worden fouten bij submit in tekst gemeld?
  → Dit valt onder SC 3.3.1
```

### Patroon B: Meldingsformulier ("Doe een melding")

Meerstaps-formulieren voor het melden van bijv. overlast, kapotte straatverlichting, etc.

```
Controleer bij elke stap:
- Worden fouten per stap gemeld?
- Blijft ingevulde data behouden na foutmelding?
- Worden fouten specifiek per veld beschreven?
```

### Patroon C: Zoekformulier

```
Zoekformulieren hebben zelden foutvalidatie
(een lege zoekopdracht levert gewoon "geen resultaten").
Maar als er validatie is → controleer SC 3.3.1.
```

### Patroon D: Nieuwsbriefinschrijving

```
Vaak een enkel e-mailveld met een "Aanmelden"-knop.
Controleer:
- Wat gebeurt er als je een ongeldig e-mailadres invult?
- Is er een foutmelding in tekst?
```

### Patroon E: Automatische waardecorrectie

```
Sommige formulieren corrigeren automatisch de invoer
(bijv. een getal dat te hoog is wordt verlaagd naar
het maximum).

Let op: ook dan moet de gebruiker in tekst worden
geïnformeerd dat de waarde is gewijzigd. Anders
weet de gebruiker niet dat de invoer is aangepast.
```

---

## Onderscheid met andere SC's

| SC | Relatie met 3.3.1 |
|----|------------------|
| **1.4.1** | Gebruik van kleur: foutmeldingen mogen niet alleen op kleur vertrouwen → raakt 3.3.1 (alleen rode rand = failure voor beide) |
| **3.3.1** | **Foutidentificatie: de fout wordt geïdentificeerd en in tekst beschreven.** |
| **3.3.2** | Labels of instructies: instructies worden vooraf gegeven (bijv. "Verplicht veld", verwacht formaat). 3.3.1 gaat over de foutmelding achteraf. |
| **3.3.3** | Foutsuggestie (AA): als een fout wordt gedetecteerd en suggesties mogelijk zijn, worden die aan de gebruiker gegeven. 3.3.1 beschrijft de fout, 3.3.3 suggereert een oplossing. |
| **4.1.3** | Statusberichten: foutmeldingen die zonder focusverplaatsing verschijnen moeten als statusbericht worden aangekondigd (role="alert", aria-live). |

### Samenspel SC 3.3.1 en SC 3.3.3

- **3.3.1 (A):** "Vul een geldig e-mailadres in." → beschrijft de fout
- **3.3.3 (AA):** "Vul een geldig e-mailadres in, bijv. naam@voorbeeld.nl." → beschrijft de fout + geeft een suggestie

In de praktijk overlappen ze vaak: een goede foutmelding voldoet aan beide.

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: Verplicht veld niet ingevuld**

| Code | Beschrijving |
|------|-------------|
| G83 | Tekstbeschrijving geven om verplichte velden te identificeren die niet zijn ingevuld |
| ARIA21 | `aria-invalid` gebruiken om een foutveld aan te geven |
| ARIA18 | `aria-alertdialog` gebruiken om fouten te identificeren |
| ARIA19 | `role="alert"` of live regions gebruiken om fouten te identificeren |

**Situatie B: Invoer voldoet niet aan formaat/waarden**

| Code | Beschrijving |
|------|-------------|
| G84 | Tekstbeschrijving geven als de invoer niet in de lijst van toegestane waarden staat |
| G85 | Tekstbeschrijving geven als de invoer buiten het vereiste formaat of waardenbereik valt |
| ARIA21 | `aria-invalid` gebruiken om een foutveld aan te geven |
| ARIA18 | `aria-alertdialog` gebruiken om fouten te identificeren |
| ARIA19 | `role="alert"` of live regions gebruiken om fouten te identificeren |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| G139 | Een mechanisme creëren waarmee gebruikers naar fouten kunnen springen |
| G199 | Succesfeedback geven als data succesvol is ingediend |

### Failure Techniques

Er zijn geen formeel gedefinieerde failure techniques specifiek voor SC 3.3.1, maar de volgende situaties zijn failures:
- Foutmelding alleen via kleur (raakt ook SC 1.4.1)
- Geen foutmelding in tekst na automatische foutdetectie
- Foutmelding die het foutveld niet identificeert
- Te vage foutmelding die de fout niet beschrijft

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-5: verplichte velden | ongeldige invoer |
                  foutoverzicht | inline validatie |
                  browser-validatie]
Formulier:       [beschrijving / URL]
Veld:            [naam van het veld]
Trigger:         [wat triggert de fout?]
Beoordeling:     [PASS | FAIL]

Foutmelding
zichtbaar:       [ja/nee]
In tekst:        [ja/nee — of alleen kleur/icoon]
Specifiek:       [ja/nee — beschrijft de fout specifiek?]
Bij het veld:    [ja/nee — staat de melding bij het juiste veld?]
aria-invalid:    [ja/nee]
aria-describedby:[ja/nee — is de melding programmatisch gekoppeld?]

Probleem:        [specifieke beschrijving]
Technique:       [G83 / G84 / G85 / ARIA21]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Alleen rode rand, geen tekst** — het meest voorkomende probleem: een veld wordt rood omrand maar er is geen foutmelding in tekst
2. **Instructie i.p.v. foutmelding** — "Vul een geldige plaats in" is een instructie, geen foutmelding. De melding moet beschrijven wat er fout is gegaan: "U heeft geen geldige plaats ingevuld"
3. **Te vage foutmelding** — "Fout" of "Ongeldige invoer" zonder verdere uitleg
4. **Foutmelding niet bij het veld** — foutmelding alleen bovenaan het formulier zonder de veldnaam te noemen
5. **Screenreader krijgt geen melding** — geen `aria-invalid`, geen `aria-describedby`, geen `role="alert"`
6. **Verplichte velden niet gemarkeerd** — geen sterretje, geen "verplicht"-tekst, geen `aria-required` (raakt SC 3.3.2)
7. **Formulierdata verdwijnt na foutmelding** — gebruiker moet alles opnieuw invullen (alle eerder ingevulde gegevens moeten behouden blijven, behalve beveiligingsvelden)
8. **Submit-knop uitgeschakeld totdat formulier geldig is** — gebruiker weet niet wat er mis is (slechte praktijk)

### Snelle audit-methode

1. Vind een formulier op de gemeente-website
2. Klik direct op "Verzenden" zonder iets in te vullen
3. Worden foutmeldingen in tekst getoond?
4. Staan ze bij de juiste velden?
5. Zijn ze specifiek genoeg?
6. Vul daarna ongeldige waarden in en herhaal de controle

### Technisch of redactioneel issue?

SC 3.3.1 is een **technisch issue**:
- Foutvalidatie en foutmeldingen worden in het template/CMS/formuliercomponent geprogrammeerd
- De tekst van de foutmeldingen wordt vaak centraal beheerd
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

**Uitzondering:** Als redacteuren zelf formulieren maken met een formulier-builder en de foutmeldingen aanpassen → deels redactioneel.

### Wie heeft er baat bij?

- **Screenreader-gebruikers** — zonder tekstuele foutmeldingen weten ze niet dat er een fout is
- **Mensen met kleurenblindheid** — kunnen rode randen niet waarnemen
- **Mensen met cognitieve beperkingen** — specifieke foutmeldingen helpen begrijpen wat er mis is
- **Alle gebruikers** — duidelijke foutmeldingen verbeteren de gebruikerservaring

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 3.3.1 is Niveau A — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 3.3.1:** https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- **Technique G83 (verplichte velden):** https://www.w3.org/WAI/WCAG22/Techniques/general/G83
- **Technique G84 (niet-toegestane waarden):** https://www.w3.org/WAI/WCAG22/Techniques/general/G84
- **Technique G85 (buiten formaat/bereik):** https://www.w3.org/WAI/WCAG22/Techniques/general/G85
- **Technique ARIA21 (aria-invalid):** https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
