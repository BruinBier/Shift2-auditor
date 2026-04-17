---
name: wcag-1-3-5-identify-input-purpose
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 1.3.5 (Identify Input Purpose) on Dutch government websites. Use when conducting accessibility audits to verify that form input fields collecting personal user data have programmatically determinable purpose via the HTML autocomplete attribute with correct tokens. Covers contact forms, registration forms, afspraak-formulieren, and e-loket forms on gemeente websites. Includes the complete list of WCAG Section 7 input purposes, common autocomplete tokens for Dutch municipal forms, and the distinction between user data (in scope) and non-user data (out of scope). Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 1.3.5 Identificeer het doel van de input — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 1.3.5 (Niveau AA):**
Het doel van elk invoerveld dat informatie over de gebruiker verzamelt, kan programmatisch worden bepaald wanneer:
- Het invoerveld een doel heeft dat is geïdentificeerd in de sectie Invoerdoelen voor gebruikersinterfacecomponenten; en
- De content is geïmplementeerd met technologieën die het identificeren van de verwachte betekenis voor formulierinvoergegevens ondersteunen.

**Kernprincipe:** Wanneer een formulierveld persoonlijke gegevens van de gebruiker verzamelt (naam, adres, e-mail, telefoon, etc.), moet het doel van dat veld programmatisch bepaalbaar zijn — in HTML via het `autocomplete`-attribuut met de juiste token-waarde.

**Belangrijk:** Dit criterium geldt ALLEEN voor velden die informatie over de gebruiker zelf verzamelen, niet voor velden over andere personen of niet-persoonlijke data.

---

## Twee voorwaarden voor toepasselijkheid

SC 1.3.5 is alleen van toepassing wanneer BEIDE voorwaarden waar zijn:

| Voorwaarde | Uitleg |
|-----------|--------|
| 1. Het veld verzamelt gebruikersdata | Het veld vraagt persoonlijke gegevens van de gebruiker (naam, adres, e-mail, etc.) die voorkomen in WCAG Sectie 7 |
| 2. De technologie ondersteunt het | HTML ondersteunt dit via het `autocomplete`-attribuut |

### Wanneer NIET van toepassing:

- Velden die gegevens van **anderen** verzamelen (bijv. "e-mail van ontvanger")
- Velden waarvan het doel **niet** voorkomt in de WCAG Sectie 7 lijst (bijv. "BSN", "kenteken", "kadastrale gegevens")
- Zoekvelden die geen persoonlijke data verzamelen
- Type-ahead / edit comboboxen (niet gedekt door dit criterium)

---

## Hoe voldoen: het autocomplete-attribuut

De primaire (en momenteel enige) techniek om in HTML te voldoen aan SC 1.3.5 is het `autocomplete`-attribuut. Dit attribuut:

1. Vertelt browsers welk type gegevens wordt verwacht
2. Maakt autofill mogelijk op basis van eerder opgeslagen data
3. Stelt hulptechnologieën in staat het doel van het veld te presenteren (bijv. een icoon van een verjaardagstaart bij `autocomplete="bday"`)
4. Werkt taalonafhankelijk — de tokens zijn standaard Engels

```html
<!-- PASS: autocomplete met correct token -->
<label for="naam">Naam:</label>
<input type="text" id="naam" name="naam" autocomplete="name">

<!-- FAIL: geen autocomplete op veld dat naam verzamelt -->
<label for="naam">Naam:</label>
<input type="text" id="naam" name="naam">

<!-- N.v.t.: veld verzamelt geen gebruikersdata -->
<label for="zoek">Zoeken:</label>
<input type="search" id="zoek" name="q">
```

**Let op:** `type="email"` of `type="tel"` is niet voldoende. Het `type`-attribuut geeft alleen het type invoer aan (een e-mailadres), maar niet het doel (de e-mail van de gebruiker). Het `autocomplete`-attribuut is nodig voor het specifieke doel.

---

## Beslisboom

```
Formulierveld gevonden op de pagina
│
├─ Verzamelt het veld informatie over de gebruiker zelf?
│  ├─ NEE (over iemand anders, of geen persoonlijke data)
│  │  → SC 1.3.5 is NIET van toepassing
│  └─ JA ↓
│
├─ Komt het doel voor in de WCAG Sectie 7 lijst?
│  ├─ NEE (bijv. BSN, kenteken)
│  │  → SC 1.3.5 is NIET van toepassing
│  └─ JA ↓
│
├─ Heeft het veld een autocomplete-attribuut?
│  ├─ NEE → FAIL
│  └─ JA ↓
│
├─ Is de autocomplete-waarde een geldige token?
│  ├─ NEE (typo, verzonnen waarde) → FAIL (F107)
│  └─ JA ↓
│
├─ Komt de token overeen met het daadwerkelijke doel van het veld?
│  ├─ NEE (verkeerde token voor het veld) → FAIL (F107)
│  └─ JA → PASS
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer alle formuliervelden
Zoek alle `<input>`, `<select>` en `<textarea>` elementen op de pagina.

### Stap 2: Filter op gebruikersdata
Bepaal per veld: verzamelt dit veld persoonlijke informatie over de gebruiker zelf? Zo niet → N.v.t.

### Stap 3: Controleer of het doel in Sectie 7 staat
Komt het doel van het veld voor in de lijst van WCAG Sectie 7 input purposes? Zo niet → N.v.t.

### Stap 4: Controleer het autocomplete-attribuut
- Is `autocomplete` aanwezig?
- Is de waarde een geldige token uit de HTML-specificatie?
- Komt de token overeen met het daadwerkelijke doel van het veld?

### Stap 5: Controleer op ongeldige waarden
- **`autocomplete="on"` is NIET voldoende.** De waarde "on" identificeert niet het specifieke doel van het veld. Er moet een gestandaardiseerde token worden gebruikt (bijv. `given-name`, `email`, `tel`).
- **`autocomplete="off"`** is geen failure als het bewust wordt gebruikt voor gevoelige gegevens (bijv. wachtwoorden, OTP-codes). Maar voor gewone persoonlijke gegevens (naam, adres, e-mail) is het een gemiste kans en kan het als failure worden beschouwd.

### Stap 6 (optioneel): Test met browser-autofill
Zorg dat je in de browser al persoonlijke gegevens hebt opgeslagen en probeer deze automatisch in te vullen (bijv. in Chrome: klik op een invoerveld, dan verschijnt een suggestie met je opgeslagen gegevens).

**Let op:** Ook als géén autocomplete-attribuut is gebruikt, zal Chrome proberen om gegevens op de goede plek te zetten. Dit is echter **niet betrouwbaar en niet voldoende** voor dit succescriterium. Het feit dat Chrome autofill "toevallig" werkt, betekent niet dat het veld voldoet aan SC 1.3.5. Het autocomplete-attribuut met de juiste token moet expliciet aanwezig zijn.

---

## De 4 auditgebieden

### 1. AANWEZIGHEID VAN AUTOCOMPLETE

**Regel:** Elk invoerveld dat persoonlijke gebruikersdata verzamelt en waarvan het doel voorkomt in Sectie 7, moet een autocomplete-attribuut hebben.

```html
<!-- FAIL: naam-veld zonder autocomplete -->
<label for="voornaam">Voornaam:</label>
<input type="text" id="voornaam" name="voornaam">

<!-- PASS: naam-veld met correct autocomplete -->
<label for="voornaam">Voornaam:</label>
<input type="text" id="voornaam" name="voornaam"
       autocomplete="given-name">
```

### 2. CORRECTE TOKEN-WAARDE

**Regel:** De autocomplete-waarde moet een geldige token zijn die overeenkomt met het daadwerkelijke doel van het veld.

```html
<!-- FAIL (F107): verkeerde token -->
<label for="email">E-mailadres:</label>
<input type="email" id="email" name="email"
       autocomplete="name">
<!-- Token "name" komt niet overeen met e-mailveld -->

<!-- FAIL (F107): ongeldige/verzonnen token -->
<label for="tel">Telefoon:</label>
<input type="tel" id="tel" name="tel"
       autocomplete="telefoon">
<!-- "telefoon" is geen geldige token -->

<!-- PASS: juiste token -->
<label for="email">E-mailadres:</label>
<input type="email" id="email" name="email"
       autocomplete="email">
```

### 3. SPECIFIEKE VS. GENERIEKE TOKENS

**Regel:** Gebruik de meest specifieke token die beschikbaar is.

```html
<!-- MINDER GOED: te generiek -->
<label for="straat">Straatnaam en huisnummer:</label>
<input type="text" id="straat" name="straat"
       autocomplete="address-line1">

<!-- BETER: specifiekere token -->
<label for="straat">Straatnaam en huisnummer:</label>
<input type="text" id="straat" name="straat"
       autocomplete="street-address">

<!-- COMBINATIE: specifiek context + token -->
<label for="verzendstraat">Verzendadres straat:</label>
<input type="text" id="verzendstraat" name="verzendstraat"
       autocomplete="shipping street-address">
```

### 4. SCOPE: GEBRUIKERSDATA VS. OVERIGE DATA

**Regel:** Autocomplete is alleen vereist voor velden die informatie over de gebruiker zelf verzamelen.

```html
<!-- IN SCOPE: e-mail van de gebruiker zelf -->
<label for="mijn-email">Uw e-mailadres:</label>
<input type="email" id="mijn-email" autocomplete="email">

<!-- BUITEN SCOPE: e-mail van iemand anders -->
<label for="partner-email">E-mailadres partner:</label>
<input type="email" id="partner-email">
<!-- Geen autocomplete vereist: dit is niet de gebruiker zelf -->

<!-- BUITEN SCOPE: geen persoonlijk gegeven -->
<label for="zoek">Zoeken op deze site:</label>
<input type="search" id="zoek" name="q">
```

---

## Volledige lijst autocomplete-tokens (WCAG Sectie 7)

### Naam-gerelateerd

| Token | Doel | Gemeente-voorbeeld |
|-------|------|-------------------|
| `name` | Volledige naam | Naam |
| `honorific-prefix` | Titel/aanspreektitel | Dhr./Mevr. |
| `given-name` | Voornaam | Voornaam |
| `additional-name` | Tussenvoegsel/tweede naam | Tussenvoegsel |
| `family-name` | Achternaam | Achternaam |
| `honorific-suffix` | Naamachtervoegsel | — |
| `nickname` | Bijnaam/gebruikersnaam | — |

### Adres-gerelateerd

| Token | Doel | Gemeente-voorbeeld |
|-------|------|-------------------|
| `street-address` | Volledig straatadres | Straatnaam + huisnummer |
| `address-line1` | Adresregel 1 | Straatnaam |
| `address-line2` | Adresregel 2 | Huisnummer + toevoeging |
| `address-line3` | Adresregel 3 | — |
| `address-level1` | Provincie | Provincie |
| `address-level2` | Stad/gemeente | Woonplaats |
| `address-level3` | Subgemeente/wijk | — |
| `address-level4` | Fijnste niveau | — |
| `country` | Land | Land |
| `country-name` | Landnaam (tekst) | Land |
| `postal-code` | Postcode | Postcode |

### Communicatie

| Token | Doel | Gemeente-voorbeeld |
|-------|------|-------------------|
| `tel` | Volledig telefoonnummer | Telefoonnummer |
| `tel-country-code` | Landcode | +31 |
| `tel-national` | Nationaal nummer | 0612345678 |
| `tel-area-code` | Netnummer | 030 |
| `tel-local` | Lokaal nummer | — |
| `tel-local-prefix` | Prefix lokaal | — |
| `tel-local-suffix` | Suffix lokaal | — |
| `tel-extension` | Toestelnummer | — |
| `email` | E-mailadres | E-mailadres |
| `impp` | Instant messaging URL | — |

### Account-gerelateerd

| Token | Doel | Gemeente-voorbeeld |
|-------|------|-------------------|
| `username` | Gebruikersnaam | Gebruikersnaam (MijnOverheid) |
| `new-password` | Nieuw wachtwoord | — |
| `current-password` | Huidig wachtwoord | — |

### Persoonlijke gegevens

| Token | Doel | Gemeente-voorbeeld |
|-------|------|-------------------|
| `bday` | Geboortedatum (volledig) | Geboortedatum |
| `bday-day` | Geboortedag | Dag |
| `bday-month` | Geboortemaand | Maand |
| `bday-year` | Geboortejaar | Jaar |
| `sex` | Geslacht | Geslacht |
| `url` | Website/homepage URL | Website |
| `photo` | Foto/avatar URL | — |
| `language` | Voorkeurstaal | Taal |
| `organization` | Organisatienaam | Bedrijf/organisatie |
| `organization-title` | Functietitel | Functie |

### Betaling (minder relevant voor gemeenten)

| Token | Doel |
|-------|------|
| `cc-name` | Naam op creditcard |
| `cc-given-name` | Voornaam op creditcard |
| `cc-additional-name` | Tweede naam op creditcard |
| `cc-family-name` | Achternaam op creditcard |
| `cc-number` | Creditcardnummer |
| `cc-exp` | Vervaldatum |
| `cc-exp-month` | Vervalmaand |
| `cc-exp-year` | Vervaljaar |
| `cc-csc` | Beveiligingscode |
| `cc-type` | Type creditcard |
| `transaction-currency` | Valuta |
| `transaction-amount` | Bedrag |

### Context-prefixen

Tokens kunnen worden voorafgegaan door een context-prefix:

| Prefix | Betekenis | Voorbeeld |
|--------|-----------|-----------|
| `shipping` | Verzendadres | `shipping street-address` |
| `billing` | Factuuradres | `billing postal-code` |
| `home` | Thuis | `home tel` |
| `work` | Werk | `work email` |
| `mobile` | Mobiel | `mobile tel` |
| `fax` | Fax | `fax tel` |
| `pager` | Pager | — |

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Contactformulier

Het meest voorkomende formulier op gemeente-websites.

```html
<!-- Typisch contactformulier — alle velden vereisen autocomplete -->

<!-- FAIL: geen autocomplete-attributen -->
<form>
  <label for="naam">Naam:</label>
  <input type="text" id="naam" name="naam">

  <label for="email">E-mail:</label>
  <input type="email" id="email" name="email">

  <label for="tel">Telefoon:</label>
  <input type="tel" id="tel" name="tel">

  <label for="bericht">Bericht:</label>
  <textarea id="bericht" name="bericht"></textarea>

  <button type="submit">Verzenden</button>
</form>

<!-- PASS: met correcte autocomplete-attributen -->
<form>
  <label for="naam">Naam:</label>
  <input type="text" id="naam" name="naam"
         autocomplete="name">

  <label for="email">E-mail:</label>
  <input type="email" id="email" name="email"
         autocomplete="email">

  <label for="tel">Telefoon:</label>
  <input type="tel" id="tel" name="tel"
         autocomplete="tel">

  <label for="bericht">Bericht:</label>
  <textarea id="bericht" name="bericht"></textarea>
  <!-- Geen autocomplete nodig: "bericht" is geen persoonlijk gegeven
       uit Sectie 7 -->

  <button type="submit">Verzenden</button>
</form>
```

### Patroon B: Afspraak maken

```html
<!-- Afspraakformulier op gemeente-website -->

<!-- Velden die autocomplete nodig hebben: -->
<input type="text" name="voornaam" autocomplete="given-name">
<input type="text" name="achternaam" autocomplete="family-name">
<input type="email" name="email" autocomplete="email">
<input type="tel" name="telefoon" autocomplete="tel">

<!-- Velden die GEEN autocomplete nodig hebben: -->
<select name="product"><!-- product/dienst keuze --></select>
<input type="date" name="datum"><!-- gewenste datum (geen bday) -->
<input type="time" name="tijd"><!-- gewenste tijd -->
<textarea name="opmerking"></textarea><!-- vrij tekstveld -->
```

### Patroon C: Aanvraagformulier (e-loket)

```html
<!-- E-loketformulier voor bijv. paspoort, rijbewijs -->

<!-- Persoonlijke gegevens (autocomplete vereist): -->
<input type="text" name="voornaam" autocomplete="given-name">
<input type="text" name="tussenvoegsel" autocomplete="additional-name">
<input type="text" name="achternaam" autocomplete="family-name">
<input type="text" name="straat" autocomplete="street-address">
<input type="text" name="postcode" autocomplete="postal-code">
<input type="text" name="woonplaats" autocomplete="address-level2">
<input type="date" name="geboortedatum" autocomplete="bday">
<input type="email" name="email" autocomplete="email">
<input type="tel" name="telefoon" autocomplete="tel">

<!-- NIET in scope (geen Sectie 7 token beschikbaar): -->
<input type="text" name="bsn"><!-- BSN: geen Sectie 7 token -->
<input type="text" name="documentnummer"><!-- geen token -->
```

### Patroon D: Nieuwsbrief aanmelding

```html
<!-- Eenvoudig formulier, vaak in footer -->

<!-- FAIL: -->
<input type="email" name="email" placeholder="Uw e-mailadres">

<!-- PASS: -->
<label for="nieuwsbrief-email">E-mailadres:</label>
<input type="email" id="nieuwsbrief-email" name="email"
       autocomplete="email">
```

### Patroon E: Inlogformulier (MijnGemeente)

```html
<!-- Inlogformulier -->

<!-- PASS: -->
<label for="user">Gebruikersnaam:</label>
<input type="text" id="user" name="user"
       autocomplete="username">

<label for="pass">Wachtwoord:</label>
<input type="password" id="pass" name="pass"
       autocomplete="current-password">
```

### Patroon F: Formulier met gegevens van derden

```html
<!-- Formulier waar je IEMAND ANDERS opgeeft -->

<!-- IN SCOPE (je eigen gegevens): -->
<h2>Uw gegevens (aanvrager)</h2>
<input type="text" name="eigen-naam" autocomplete="name">
<input type="email" name="eigen-email" autocomplete="email">

<!-- BUITEN SCOPE (gegevens van iemand anders): -->
<h2>Gegevens pasgeborene</h2>
<input type="text" name="kind-voornaam">
<input type="date" name="kind-geboortedatum">
<!-- Geen autocomplete vereist: dit zijn niet de gegevens
     van de gebruiker zelf -->
```

---

## Onderscheid met andere SC's

| SC | Relatie met 1.3.5 |
|----|------------------|
| **1.3.1** | Info en relaties: labels programmatisch gekoppeld aan velden. SC 1.3.5 gaat een stap verder: niet alleen het label, maar ook het **specifieke doel** moet programmatisch bepaalbaar zijn. |
| **3.3.2** | Labels of instructies: zichtbare labels bij invoervelden. SC 1.3.5 voegt de programmatische laag toe via autocomplete. |
| **4.1.2** | Naam, rol, waarde: de naam en rol van UI-componenten. SC 1.3.5 specificeert daarbovenop het semantische doel van het veld. |

---

## Officiële W3C Techniques

### Sufficient Techniques

| Code | Beschrijving |
|------|-------------|
| H98 | HTML autocomplete-attribuut gebruiken met geldige tokens |

### Failure Techniques

| Code | Beschrijving |
|------|-------------|
| F107 | Onjuiste autocomplete-attribuutwaarden (verkeerde token, ongeldige waarde, of token die niet overeenkomt met het doel van het veld) |

### ACT Test Rules

| Rule | Beschrijving |
|------|-------------|
| 73f2c2 | Autocomplete-attribuut heeft een geldige waarde |

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: aanwezigheid | correcte token |
                  specificiteit | scope]
Element:         [beschrijving van het formulierveld]
Locatie:         [positie op pagina / HTML-selector]
Beoordeling:     [PASS | FAIL | N.v.t.]

Veldlabel:       [zichtbaar label van het veld]
Verwacht doel:   [welke persoonlijke data wordt verzameld]
Autocomplete
aanwezig:        [ja/nee]
Autocomplete
waarde:          [huidige waarde of "ontbreekt"]
Verwachte
token:           [correcte autocomplete-token]

Probleem:        [alleen bij FAIL — specifieke beschrijving]
Technique:       [H98 / F107]
Aanbeveling:     [concrete oplossing met code-voorbeeld]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Autocomplete volledig afwezig** — veruit de meest voorkomende fout; formuliervelden zonder enig autocomplete-attribuut
2. **`autocomplete="on"` gebruikt** — de waarde "on" is niet voldoende; er moet een specifieke token worden gebruikt
3. **Verkeerde token** — `autocomplete="name"` op een e-mailveld (F107)
4. **Te generiek** — `autocomplete="address"` terwijl `street-address` of `postal-code` beschikbaar en specifieker is
5. **autocomplete="off" op alles** — sommige CMS'en of formuliercomponenten schakelen autocomplete uit
6. **Verzonnen tokens** — `autocomplete="telefoon"` of `autocomplete="naam"` (Nederlandse woorden i.p.v. standaard Engelse tokens). Afwijkende waarden worden niet herkend en genegeerd door browsers en hulptechnologieën
7. **type vs. autocomplete verwarring** — denken dat `type="email"` voldoende is
8. **Vertrouwen op Chrome-autofill** — Chrome probeert ook zonder autocomplete-attribuut gegevens in te vullen, maar dit is niet betrouwbaar en niet voldoende voor SC 1.3.5

### Snelle DevTools-check

```javascript
// Alle input/select/textarea elementen met ontbrekend autocomplete
document.querySelectorAll('input, select, textarea').forEach(el => {
  const ac = el.getAttribute('autocomplete');
  const type = el.getAttribute('type');
  const name = el.getAttribute('name') || el.getAttribute('id');
  if (!ac && type !== 'hidden' && type !== 'submit' && type !== 'button') {
    console.log(`Mogelijk ontbrekend autocomplete: ${name} (type=${type})`);
  }
});
```

### Technisch of redactioneel issue?

SC 1.3.5 is in de praktijk **bijna altijd een technisch issue**:
- Het autocomplete-attribuut moet worden toegevoegd in de HTML-template of het formuliercomponent
- De gemeente/redacteur kan dit meestal niet zelf instellen in het CMS
- Voor SIMsite/Drupal-gebaseerde formulieren is dit een **template-aanpassing** door de ontwikkelaar

**Bij Shift2-audits:** SC 1.3.5 valt typisch onder de **technische audit** (Cardan), niet onder de content-audit (Shift2).

### Wie heeft er baat bij?

- **Mensen met cognitieve beperkingen** — autofill vermindert de noodzaak om gegevens te onthouden en in te typen
- **Mensen met motorische beperkingen** — minder typen door autofill
- **Mensen met dyslexie** — minder kans op typfouten bij persoonlijke gegevens
- **Mensen met geheugenprobllemen** — browser onthoudt en vult gegevens in
- **Iedereen** — autofill bespaart tijd en vermindert fouten

### Toekomstperspectief

Hoewel nu primair via autocomplete geïmplementeerd, is SC 1.3.5 ontworpen om compatibel te zijn met toekomstige personalisatietechnologieën. In de toekomst kunnen hulptechnologieën op basis van het geïdentificeerde doel:
- Bekende iconen tonen naast invoervelden (verjaardagstaart bij geboortedatum, telefoonicoon bij telefoonnummer)
- Gepersonaliseerde symbolen weergeven voor mensen die moeite hebben met tekst
- Formulieren automatisch aanpassen aan de behoeften van de gebruiker

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA.

**SC 1.3.5 is Niveau AA — dus verplicht.**

Dit criterium is nieuw in WCAG 2.1 (niet aanwezig in WCAG 2.0). Veel bestaande formulieren voldoen niet omdat ze zijn gebouwd vóór WCAG 2.1.

---

## Bronnen

- **WCAG 2.2 Understanding 1.3.5:** https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html
- **Technique H98 (autocomplete):** https://www.w3.org/WAI/WCAG22/Techniques/html/H98
- **Failure F107 (verkeerde autocomplete):** https://www.w3.org/WAI/WCAG22/Techniques/failures/F107
- **WCAG Sectie 7 Input Purposes:** https://www.w3.org/TR/WCAG21/#input-purposes
- **HTML autocomplete tokens:** https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofilling-form-controls:-the-autocomplete-attribute
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
