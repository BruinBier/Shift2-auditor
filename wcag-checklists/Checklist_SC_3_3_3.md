---
name: wcag-3-3-3-error-suggestion
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.3.3 (Error Suggestion) on Dutch government websites. Use when conducting accessibility audits to verify that when input errors are automatically detected and suggestions for correction are known, those suggestions are provided to the user. Covers the relationship with SC 3.3.1 and 3.3.2, security exception, format suggestions, required field suggestions, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.3.3 Foutsuggestie — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.3.3 (Niveau AA):**
Als een invoerfout automatisch ontdekt wordt en suggesties voor verbetering bekend zijn, dan worden de suggesties aan de gebruiker geleverd, tenzij dit de beveiliging of het doel van de content in gevaar zou brengen.

**Kernprincipe:** Dit criterium gaat een stap verder dan SC 3.3.1. Waar 3.3.1 vraagt "wat is er fout?", vraagt 3.3.3 "hoe kan de gebruiker het oplossen?". Als het systeem weet hoe de fout gecorrigeerd kan worden, moet het die suggestie aan de gebruiker geven.

---

## Relatie met SC 3.3.1 en SC 3.3.2

De drie "fout"-criteria werken als een keten:

| SC | Wanneer | Wat |
|----|---------|-----|
| **3.3.2** | Vóór invoer | Labels en instructies: wat wordt verwacht, in welk formaat |
| **3.3.1** | Na fout | Foutidentificatie: waar zit de fout en wat is er fout gegaan? |
| **3.3.3** | Na fout | Foutsuggestie: hoe kan de gebruiker de fout corrigeren? |

**In de praktijk overlappen 3.3.1 en 3.3.3 vaak:** een goede foutmelding bevat zowel de foutidentificatie (3.3.1) als de suggestie (3.3.3).

```
SC 3.3.1 alleen (foutmelding):
"Het e-mailadres is niet geldig."

SC 3.3.1 + 3.3.3 (foutmelding + suggestie):
"Het e-mailadres is niet geldig. Gebruik het formaat
naam@voorbeeld.nl."
```

**Foutmelding vs. instructie (belangrijk onderscheid uit SC 3.3.1):**
- Foutmelding (3.3.1): "U heeft geen geldige plaats ingevuld" — beschrijft wat er fout is
- Foutsuggestie (3.3.3): "Gebruik het formaat dd-mm-jjjj" — beschrijft hoe het op te lossen

**Belangrijk:** Als er al een duidelijke instructie bij het invoerveld staat (SC 3.3.2) over het verwachte formaat, dan hoeft deze instructie niet nog een keer als foutsuggestie herhaald te worden. De gebruiker kan de instructie bij het veld terugvinden.

---

## "Tenzij suggesties bekend zijn"

SC 3.3.3 geldt alleen als suggesties voor verbetering **bekend** zijn. Voorbeelden:

```
Suggestie BEKEND (moet worden gegeven):
- Verplicht veld niet ingevuld → "Dit veld is verplicht"
- Ongeldig e-mailformaat → "Gebruik het formaat naam@voorbeeld.nl"
- Datum in verkeerd formaat → "Gebruik het formaat dd-mm-jjjj"
- Telefoonnummer te kort → "Een telefoonnummer moet uit 10 cijfers
  bestaan, bijvoorbeeld 06-12345678"
- Waarde uit beperkte lijst → "Kies een van de volgende: ..."
- Spelfout in bekende waarde → suggestie van correct gespeld woord

Suggestie NIET BEKEND (geen verplichting):
- Vrij tekstveld met inhoudelijke fout die het systeem
  niet kan beoordelen
```

---

## Beveiligingsuitzondering

Als een suggestie de beveiliging in gevaar zou brengen, hoeft deze niet gegeven te worden:

```
GEEN suggestie nodig (beveiliging):
- Fout wachtwoord → NIET: "U heeft 'wachtwoord123' ingetypt,
  bedoelde u 'Wachtwoord123'?"
- Foute beveiligingscode → NIET: "De juiste code is 4827"

WEL suggestie nodig (geen beveiligingsrisico):
- Wachtwoord voldoet niet aan eisen bij aanmaken → "Het wachtwoord
  moet minimaal 8 tekens bevatten, waarvan 1 hoofdletter en 1 cijfer"
  (dit is een format-suggestie, geen inhoudelijke suggestie)
```

---

## Specifiek vs. algemeen

De suggestie mag variëren in specificiteit. Zowel heel specifieke als meer algemene suggesties voldoen:

```
Heel specifiek:
- Spelfout "Amssterdam" → suggestie: "Bedoelde u Amsterdam?"
- Ongeldig maandnummer "13" → "De maand moet tussen 1 en 12 zijn"

Algemeen (ook acceptabel):
- Telefoonnummer met 9 cijfers → "Een telefoonnummer moet uit
  10 cijfers bestaan, bijvoorbeeld 06-12345678"
- Ongeldige postcode → "Een postcode bestaat uit 4 cijfers
  en 2 letters, bijvoorbeeld 1234 AB"
```

---

## Beslisboom

```
Invoerfout automatisch gedetecteerd
│
├─ Is een suggestie voor verbetering bekend?
│  │
│  ├─ NEE → SC 3.3.3 niet van toepassing
│  │
│  └─ JA → Zou de suggestie de beveiliging
│           in gevaar brengen?
│     │
│     ├─ JA → Geen suggestie nodig (uitzondering)
│     │
│     └─ NEE → Wordt de suggestie aan de
│              gebruiker gegeven?
│        │
│        ├─ JA → PASS
│        │
│        └─ NEE → Staat er al een duidelijke
│                 instructie bij het veld
│                 (SC 3.3.2) die hetzelfde uitlegt?
│           │
│           ├─ JA → PASS (instructie is voldoende)
│           │
│           └─ NEE → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Trigger fouten in formulieren

- Laat verplichte velden leeg en klik op de verzendknop
- Vul ongeldige waarden in (verkeerd e-mailformaat, te kort telefoonnummer, ongeldige postcode, verkeerd datumformaat)
- Probeer waarden buiten de toegestane lijst

### Stap 2: Beoordeel de foutmelding en suggestie

Per fout, controleer:
1. **Is er een foutmelding?** (SC 3.3.1)
2. **Bevat de foutmelding een suggestie voor verbetering?** (SC 3.3.3)
3. **Of staat er al een duidelijke instructie bij het veld die hetzelfde uitlegt?** Zo ja → PASS

### Stap 3: Controleer het behoud van ingevulde data

Na het tonen van foutmeldingen:
- Zijn alle eerder ingevulde gegevens behouden?
- De gebruiker mag niet gedwongen worden alles opnieuw in te vullen
- Uitzondering: beveiligingsvelden (wachtwoorden, captcha) mogen worden gewist

---

## De 4 auditgebieden

### 1. VERPLICHTE VELDEN NIET INGEVULD

```
Trigger: dien formulier in met lege verplichte velden

Controleer:
- Wordt aangegeven dat het veld verplicht is?
- Wordt een suggestie gegeven om het veld in te vullen?

PASS:
"Het veld 'Naam' is niet ingevuld. Vul uw naam in."
"Dit veld is verplicht."

FAIL:
"Fout" (geen suggestie, geen context)
```

### 2. INVOER IN VERKEERD FORMAAT

```
Trigger: vul ongeldige formaten in

Controleer:
- Wordt het verwachte formaat als suggestie gegeven?
- Of staat het formaat al als instructie bij het veld?

PASS:
"De postcode is niet geldig. Gebruik het formaat
1234 AB (4 cijfers, 2 letters)."

PASS (als instructie al bij het veld staat):
Instructie bij veld: "Formaat: 1234 AB"
Foutmelding: "De postcode is niet geldig."
→ Suggestie staat al als instructie → voldoende

FAIL:
"De postcode is niet geldig."
(geen suggestie, geen instructie bij het veld)
```

### 3. WAARDE BUITEN TOEGESTANE LIJST

```
Trigger: vul een waarde in die niet in de
toegestane lijst staat

Controleer:
- Worden de toegestane waarden als suggestie gegeven?
- Of wordt verwezen naar waar de juiste waarden
  te vinden zijn?

PASS:
"De ingevoerde gemeente is niet gevonden.
Kies een gemeente uit de lijst."

PASS (heel specifiek):
"Bedoelde u 'Amsterdam' in plaats van 'Amssterdam'?"
```

### 4. BEVEILIGINGSGEVOELIGE VELDEN

```
Controleer: wordt terecht geen suggestie gegeven?

PASS (geen inhoudelijke suggestie bij beveiligingsveld):
"Het wachtwoord is onjuist." (geen verdere suggestie)

PASS (format-suggestie bij wachtwoord is wél ok):
"Het wachtwoord voldoet niet aan de eisen.
Gebruik minimaal 8 tekens, waarvan 1 hoofdletter."
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Contactformulier

- E-mailadres: suggestie voor correct formaat
- Telefoonnummer: suggestie voor lengte en formaat
- Verplichte velden: suggestie om het veld in te vullen

### Patroon B: Meldingsformulier

- Postcode: suggestie voor formaat (4 cijfers + 2 letters)
- Datum: suggestie voor formaat (dd-mm-jjjj)
- Locatie: suggestie als adres niet wordt herkend

### Patroon C: Zoekformulier

Zoekformulieren hebben zelden foutsuggesties nodig. Een lege zoekopdracht levert "geen resultaten", niet een fout.

### Patroon D: Inlogformulier

- Wachtwoord fout: geen inhoudelijke suggestie (beveiliging)
- Wachtwoord voldoet niet aan eisen bij aanmaken: format-suggestie wél geven

---

## In de praktijk gaat dit zelden fout

Het bronmateriaal bevestigt: SC 3.3.3 gaat zelden fout. In veel gevallen zijn foutsuggesties niet nodig door de aanwezigheid van goede labels en instructies (SC 3.3.2). Als er wél een failure is, overlapt het vaak met een failure op SC 3.3.1 of SC 3.3.2.

---

## Onderscheid met andere SC's

| SC | Relatie met 3.3.3 |
|----|------------------|
| **3.3.1** | Foutidentificatie (A): waar zit de fout en wat is er fout? |
| **3.3.2** | Labels/instructies (A): vooraf aangeven wat wordt verwacht |
| **3.3.3** | **Foutsuggestie (AA): hoe kan de gebruiker de fout corrigeren?** |

---

## Officiële W3C Techniques

### Sufficient Techniques

**Situatie A: Verplicht veld niet ingevuld**

| Code | Beschrijving |
|------|-------------|
| G83 | Tekstbeschrijving geven om verplichte velden te identificeren die niet zijn ingevuld |
| ARIA2 | Verplicht veld identificeren met `aria-required` |

**Situatie B: Invoer vereist specifiek formaat**

| Code | Beschrijving |
|------|-------------|
| G85 | Tekstbeschrijving geven als invoer buiten vereist formaat valt |
| G177 | Suggestie voor correcte tekst geven |
| ARIA18 | `aria-alertdialog` gebruiken om fouten te identificeren |

**Situatie C: Invoer moet uit beperkte set waarden komen**

| Code | Beschrijving |
|------|-------------|
| G84 | Tekstbeschrijving geven als invoer niet in de toegestane waarden staat |
| G177 | Suggestie voor correcte tekst geven |

### Advisory Techniques

| Code | Beschrijving |
|------|-------------|
| G139 | Mechanisme om naar fouten te springen |
| G199 | Succesfeedback geven bij succesvolle indiening |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: verplichte velden | verkeerd formaat |
                  waarde buiten lijst | beveiligingsvelden]
Formulier:       [beschrijving / URL]
Veld:            [naam van het veld]
Trigger:         [wat triggert de fout?]
Beoordeling:     [PASS | FAIL | N.v.t.]

Foutmelding
(SC 3.3.1):      [de foutmelding tekst]
Suggestie
(SC 3.3.3):      [de suggestie tekst, of "geen"]
Instructie bij
veld (SC 3.3.2): [al aanwezige instructie, of "geen"]
Beveiliging:     [ja/nee — valt suggestie onder uitzondering?]
Data behouden:   [ja/nee — zijn eerder ingevulde gegevens
                  behouden na de foutmelding?]

Probleem:        [specifieke beschrijving]
Technique:       [G83 / G84 / G85 / G177]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Geen formaat-suggestie bij datum/postcode** — "De datum is ongeldig" zonder uitleg welk formaat verwacht wordt, terwijl er ook geen instructie bij het veld staat
2. **Alleen "Dit veld is verplicht" zonder context** — bij een complex veld kan een suggestie nodig zijn over wát er moet worden ingevuld
3. **Ingevulde data verdwijnt na foutmelding** — alle eerder ingevulde gegevens moeten behouden blijven (behalve beveiligingsvelden)

### Snelle audit-methode

1. Vul een formulier in met lege verplichte velden → controleer suggesties
2. Vul ongeldige waarden in (verkeerd e-mail, korte postcode, fout datumformaat) → controleer suggesties
3. Als er geen suggestie is: staat er al een duidelijke instructie bij het veld? Zo ja → PASS
4. Controleer of ingevulde data behouden is na foutmeldingen

### Technisch of redactioneel issue?

SC 3.3.3 is een **technisch issue**:
- Foutsuggesties worden geprogrammeerd in het formuliercomponent
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

### Wie heeft er baat bij?

- **Mensen met cognitieve beperkingen** — duidelijke suggesties helpen bij het begrijpen hoe een fout gecorrigeerd kan worden
- **Blinde gebruikers** — de aard van de fout en de oplossing worden duidelijk beschreven
- **Alle gebruikers** — snellere en foutloze invulling van formulieren

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 3.3.3 is Niveau AA — dus verplicht.**

---

## Bronnen

- **WCAG 2.2 Understanding 3.3.3:** https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
- **Technique G83 (verplichte velden):** https://www.w3.org/WAI/WCAG22/Techniques/general/G83
- **Technique G84 (niet-toegestane waarden):** https://www.w3.org/WAI/WCAG22/Techniques/general/G84
- **Technique G85 (buiten formaat/bereik):** https://www.w3.org/WAI/WCAG22/Techniques/general/G85
- **Technique G177 (suggestie voor correcte tekst):** https://www.w3.org/WAI/WCAG22/Techniques/general/G177
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
