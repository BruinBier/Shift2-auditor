---
name: wcag-3-3-7-redundant-entry
description: Comprehensive guide for auditing WCAG 2.2 Success Criterion 3.3.7 (Redundant Entry) on Dutch government websites. Use when conducting accessibility audits to verify that information previously entered by the user in the same process is either auto-populated or available for selection. New in WCAG 2.2. Covers multi-step forms, same-process requirement, exceptions, auto-population techniques, and common patterns on gemeente websites. Essential for audits under the Dutch Toegankelijkheidswet.
---

# WCAG 3.3.7 Overbodige invoer — Audit Skill

## Kerndefinitie

**WCAG 2.2 SC 3.3.7 (Niveau A) — Nieuw in WCAG 2.2:**
Informatie die eerder door de gebruiker is ingevoerd of aan de gebruiker is verstrekt en die opnieuw moet worden ingevoerd in hetzelfde proces, wordt:
- automatisch ingevuld, of
- beschikbaar gesteld voor selectie door de gebruiker

...tenzij een uitzondering van toepassing is.

**Kernprincipe:** Vraag gebruikers niet om dezelfde informatie twee keer in te voeren binnen hetzelfde proces. Als je de informatie al hebt, vul het automatisch in of geef de gebruiker een manier om het te hergebruiken.

---

## Waarom is dit belangrijk?

Informatie onthouden en opnieuw invoeren is een forse belasting:

- **Mensen met cognitieve beperkingen** — korte-termijngeheugen is beperkt; opnieuw moeten onthouden en invoeren kost veel mentale energie en verhoogt de kans op fouten
- **Mensen met motorische beperkingen** — herhaald typen kost extra inspanning bij gebruik van alternatieve invoermethoden (spraakinvoer, schakelaar)
- **Alle gebruikers** — mentale vermoeidheid neemt toe naarmate een proces meer stappen heeft; dit wordt verergerd door herhaalde invoer

---

## Scope: "hetzelfde proces"

SC 3.3.7 geldt alleen binnen **hetzelfde proces** en **dezelfde sessie**:

```
WEL van toepassing:
- Meerstaps-formulier waar stap 3 dezelfde info
  vraagt als stap 1
- Checkout-proces waar factuuradres gelijk is
  aan verzendadres
- Proces dat over verschillende domeinen loopt
  (bijv. betaalprovider als onderdeel van het proces)

NIET van toepassing:
- Gebruiker sluit het browsertabblad en komt later terug
- Gebruiker navigeert weg van de site en keert terug
- Informatie moet opnieuw worden ingevoerd in een
  nieuw, los proces
- Informatie opgeslagen tussen sessies
  (niet vereist door dit criterium)
```

**"Hetzelfde proces"** = een activiteit van begin tot eind, zonder dat de gebruiker de sessie verlaat of wegnavigeert.

---

## Twee manieren om te voldoen

### 1. Automatisch invullen (auto-populate)

De website vult het veld automatisch in met de eerder ingevoerde informatie:

```html
<!-- Stap 1: gebruiker voert naam in -->
<label for="naam">Naam</label>
<input type="text" id="naam" value="Jan Jansen">

<!-- Stap 3: naam is automatisch ingevuld -->
<label for="naam-bevestig">Naam</label>
<input type="text" id="naam-bevestig" value="Jan Jansen">
```

### 2. Beschikbaar voor selectie

De gebruiker kan de informatie hergebruiken via een selectiemechanisme:

```html
<!-- Checkbox: "Factuuradres is gelijk aan verzendadres" -->
<input type="checkbox" id="zelfde-adres">
<label for="zelfde-adres">
  Factuuradres is hetzelfde als het bezorgadres
</label>

<!-- Of: dropdown met eerder ingevoerde adressen -->
<select>
  <option>Gebruik eerder ingevoerd adres: Kerkstraat 1</option>
  <option>Nieuw adres invoeren</option>
</select>

<!-- Of: tekst op de pagina die de gebruiker kan kopiëren -->
<p>Uw eerder ingevoerde adres: Kerkstraat 1, Amsterdam</p>
```

**"Beschikbaar voor selectie"** is breed gedefinieerd:
- Dropdown met eerder ingevoerde waarden
- Checkbox ("gebruik hetzelfde adres")
- Tekst op dezelfde pagina die de gebruiker kan kopiëren en plakken
- Moet op dezelfde pagina staan, maar hoeft niet programmatisch gekoppeld te zijn aan het formulier

---

## Browser-autocomplete telt NIET

**Cruciaal:** De autocomplete-functie van de browser is NIET voldoende om aan SC 3.3.7 te voldoen. Het is de **website** (de content) die de opgeslagen informatie moet bieden, niet de browser.

De gebruiker kan browser-autocomplete hebben uitgeschakeld, of de browser kan de informatie niet beschikbaar hebben.

---

## De uitzonderingen

SC 3.3.7 kent vier uitzonderingen:

### 1. Herinvoer is essentieel

Als het opnieuw invoeren essentieel is voor het doel van de content:
- **Geheugenspelletjes** waar het onthouden van eerder gegeven antwoorden het doel is
- Dit is zelden relevant op gemeente-websites

### 2. Beveiliging

Als herinvoer nodig is voor beveiligingsredenen:
- **Wachtwoord bevestigen** bij het aanmaken van een account (twee keer hetzelfde wachtwoord invoeren om typefouten te voorkomen)
- **Creditcardgegevens opnieuw invoeren** als een eerdere betaling is geweigerd

### 3. Eerder ingevoerde informatie is niet meer geldig

Als de informatie is gewijzigd of verlopen:
- Creditcard verlopen → nieuwe gegevens nodig
- Adres is gewijzigd → nieuw adres nodig

### 4. Informatie in een ander formaat

Als de informatie in een ander formaat moet worden aangeleverd dan eerder (bijv. eerder als tekst, nu als geüpload document).

---

## Beslisboom

```
Meerstaps-proces gevonden
│
├─ Wordt in een latere stap informatie gevraagd
│  die al eerder in het proces is ingevoerd?
│  │
│  ├─ NEE → SC 3.3.7 niet van toepassing
│  │
│  └─ JA → Is een uitzondering van toepassing?
│     │    (beveiliging / essentieel / niet meer geldig)
│     │
│     ├─ JA → Geen verplichting om te auto-populaten
│     │
│     └─ NEE → Wordt de informatie automatisch
│              ingevuld OF beschikbaar voor selectie?
│        │
│        ├─ JA → PASS
│        │
│        └─ NEE → FAIL
```

---

## Stapsgewijze auditprocedure

### Stap 1: Identificeer meerstaps-processen

Zoek naar processen met meerdere stappen:
- Aanvraagformulieren
- Meldingsformulieren ("Doe een melding")
- Vergunningaanvragen
- Afspraak-planners
- Inschrijfprocessen
- Formulieren met bevestigingsstap

### Stap 2: Doorloop het volledige proces

- Vul alle stappen in met testgegevens
- Let op: wordt er in latere stappen gevraagd om informatie die je al eerder hebt ingevuld?
- Navigeer heen en weer tussen stappen: blijft eerder ingevulde data behouden?

### Stap 3: Beoordeel hoe herhaalde informatie wordt afgehandeld

Als dezelfde informatie opnieuw wordt gevraagd:
- Is het veld automatisch ingevuld?
- Is er een selectiemechanisme (checkbox, dropdown)?
- Is de eerder ingevoerde informatie op de pagina beschikbaar om te kopiëren?

### Stap 4: Test zonder browser-autocomplete

Test in incognito-modus of met uitgeschakelde autocomplete:
- Worden de velden nog steeds automatisch ingevuld door de website?
- Browser-autocomplete telt niet

---

## De 4 auditgebieden

### 1. MEERSTAPS-AANVRAAGFORMULIEREN

```
Gemeente-websites hebben vaak meerstaps-formulieren
voor vergunningen, meldingen, etc.

Controleer:
- Wordt in stap 3 dezelfde info gevraagd als in stap 1?
  (bijv. naam, adres, contactgegevens)
- Is de info automatisch ingevuld of selecteerbaar?
- Blijft data behouden bij terug-navigeren?

PASS:
Stap 1: naam en adres invullen
Stap 3: naam en adres zijn vooraf ingevuld

FAIL:
Stap 1: naam en adres invullen
Stap 3: naam en adres opnieuw (leeg) invullen
```

### 2. BEVESTIGINGSPAGINA'S

```
Formulieren met een overzichts-/bevestigingsstap:

Controleer:
- Toont de bevestigingspagina de eerder ingevoerde data?
- Als de gebruiker terug gaat om iets te wijzigen,
  zijn dan alle andere velden nog ingevuld?

PASS:
Bevestigingspagina toont overzicht van alle data
met mogelijkheid om te wijzigen

FAIL:
Bevestigingspagina vraagt opnieuw om alle gegevens
```

### 3. AFSPRAAK-PLANNERS

```
Online afspraak maken bij de gemeente:

Controleer:
- Als je product/dienst kiest in stap 1 en
  persoonsgegevens invult in stap 2, worden deze
  dan hergebruikt in de bevestigingsstap?
- Moet je opnieuw gegevens invoeren die je al hebt gegeven?
```

### 4. ZOEKRESULTATEN

```
Zoekpagina's:

PASS:
De zoekresultatenpagina toont de eerder ingevoerde
zoekterm in het zoekveld (pre-filled)

FAIL:
Na het zoeken is het zoekveld leeg en moet de
gebruiker de zoekterm opnieuw invoeren om
de zoekopdracht aan te passen
```

---

## Veelvoorkomende patronen op gemeente-websites

### Patroon A: Meldingsformulier ("Doe een melding")

Meerstaps-proces: locatie → categorie → beschrijving → persoonsgegevens → bevestiging.
- Controleer of de locatie/categorie in de bevestigingsstap wordt hergebruikt
- Controleer of persoonsgegevens niet opnieuw gevraagd worden

### Patroon B: DigiD-integratie

Na inloggen met DigiD zijn naam en BSN bekend:
- Worden deze gegevens automatisch ingevuld in het formulier?
- Moet de gebruiker ze toch handmatig invoeren?

### Patroon C: Afspraak maken

Online afspraak inplannen: kies dienst → kies datum/tijd → vul gegevens in → bevestig.
- Worden eerder gekozen opties behouden bij terug-navigeren?

### Patroon D: Zoekfunctie

De zoekresultatenpagina moet de zoekterm in het zoekveld behouden.

---

## Onderscheid met andere SC's

| SC | Relatie met 3.3.7 |
|----|------------------|
| **1.3.5** | Identify Input Purpose (AA): autocomplete-attributen voor invoervelden. Gerelateerd maar anders: 1.3.5 gaat over browser-autocomplete, 3.3.7 gaat over het proces zelf. |
| **3.3.1** | Foutidentificatie: fouten na invoer. 3.3.7 voorkomt dat de gebruiker überhaupt opnieuw moet invoeren. |
| **3.3.7** | **Overbodige invoer: vraag niet twee keer om dezelfde informatie.** |

---

## Officiële W3C Techniques

### Sufficient Techniques

Op het moment van schrijven zijn er nog geen formeel gepubliceerde sufficient techniques specifiek voor SC 3.3.7. De volgende aanpak wordt aanbevolen:

- Automatisch invullen van velden met eerder ingevoerde data
- "Gebruik hetzelfde adres"-checkbox bieden
- Eerder ingevoerde data tonen op de pagina zodat de gebruiker het kan kopiëren
- Pre-filled zoekveld op zoekresultatenpagina
- Sessiondata gebruiken om formulierdata binnen het proces te bewaren

### Advisory Techniques

- Elimineer overbodige velden volledig waar mogelijk
- Gebruik `autocomplete`-attributen als aanvulling (maar niet als vervanging)

---

## Rapportageformat

```
BEVINDING [nummer]
─────────────────────
Auditgebied:     [1-4: meerstaps-formulier |
                  bevestigingspagina | afspraak-planner |
                  zoekresultaten]
Proces:          [beschrijving van het proces]
Stap:            [in welke stap wordt info opnieuw gevraagd]
Eerder ingevuld
in stap:         [in welke stap was de info al ingevoerd]
Beoordeling:     [PASS | FAIL | N.v.t.]

Auto-populated:  [ja/nee]
Selecteerbaar:   [ja/nee — checkbox, dropdown, kopieerbaar]
Uitzondering:    [beveiliging / essentieel / niet meer geldig / geen]

Probleem:        [specifieke beschrijving]
Aanbeveling:     [concrete oplossing]
```

---

## Praktische audittips

### Veelgemaakte fouten op gemeente-websites

1. **Meerstaps-formulier dat gegevens niet bewaart** — persoonsgegevens of adres opnieuw invoeren in latere stappen
2. **Zoekterm verdwijnt na zoeken** — zoekveld is leeg op de resultatenpagina
3. **Terug-navigeren wist data** — bij het teruggaan naar een eerdere stap zijn de velden leeg
4. **Bevestigingspagina vraagt opnieuw om data** — i.p.v. de eerder ingevoerde data te tonen
5. **DigiD-gegevens niet overgenomen** — na inloggen met DigiD worden bekende gegevens niet automatisch ingevuld

### Snelle audit-methode

1. Zoek meerstaps-formulieren op de gemeente-website
2. Doorloop het proces volledig met testdata
3. Let op of in latere stappen dezelfde informatie opnieuw wordt gevraagd
4. Navigeer heen en weer: blijft data behouden?
5. Test de zoekfunctie: is de zoekterm ingevuld op de resultatenpagina?
6. Test in incognito-modus (browser-autocomplete telt niet)

### Technisch of redactioneel issue?

SC 3.3.7 is een **technisch issue**:
- Sessionbeheer en auto-populatie worden geprogrammeerd
- Bij Shift2: valt onder de **technische audit** (Cardan/template)

### Wie heeft er baat bij?

- **Mensen met cognitieve beperkingen** — vermindert de belasting op het korte-termijngeheugen
- **Mensen met motorische beperkingen** — minder typen bij gebruik van alternatieve invoermethoden
- **Alle gebruikers** — snellere en minder frustrerende processen

---

## Juridische context

**Toegankelijkheidswet — verplicht sinds 23 september 2020:**
Nederlandse overheidswebsites moeten voldoen aan WCAG 2.1 Niveau AA. WCAG 2.2 is op 5 oktober 2023 als W3C Recommendation gepubliceerd.

**SC 3.3.7 is Niveau A in WCAG 2.2 — nieuw criterium.**

**Let op:** Controleer of de Toegankelijkheidswet al is bijgewerkt naar WCAG 2.2 of nog op WCAG 2.1 staat. SC 3.3.7 bestaat niet in WCAG 2.1.

---

## Bronnen

- **WCAG 2.2 Understanding 3.3.7:** https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- **WCAG 2.2 SC 3.3.7:** https://www.w3.org/TR/WCAG22/#redundant-entry
- **Toegankelijkheidswet:** https://wetten.overheid.nl/BWBR0040936/
