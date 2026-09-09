# Shift2-beoordelingsregels SC 1.3.5

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_3_5.md` als ze elkaar tegenspreken.

## Alleen velden die in de WCAG-lijst met invoerdoelen staan

1.3.5 geldt uitsluitend voor invoervelden waarvoor de WCAG-specificatie een invoerdoel kent
(de lijst met "input purposes"). Ontbreekt een autocomplete-waarde bij een veld dat NIET in
die lijst staat, dan is dat **geen bevinding**: er bestaat simpelweg geen geldige waarde om
in te vullen.

**Huisnummer en toevoeging: geen bevinding.** Daarvoor bestaan wereldwijd geen
autocomplete-waarden. De WCAG-lijst is gemaakt voor internationale adresformulieren en kent
alleen `address-line1` / `address-line2` (volledige adresregels), niet een los huisnummer.
Adviseer die waarden hier dus ook niet.

**Voorletter(s): geen bevinding.** De WCAG-lijst kent `given-name` (voornaam),
`additional-name` (tussennamen) en `family-name` (achternaam), maar geen waarde voor
initialen. Adviseer hier dus geen `given-name`; dat is voor de voornaam zelf, niet voor een
afkorting daarvan. Vastgelegd door Frits op 2026-08-03 bij UTHEU-01 (contactformulier stap 2),
waar Achternaam, Telefoonnummer en E-mailadres wél een autocomplete hadden en Voorletter(s)
niet.

## Waar de norm zelf nog in beweging is

Bij het W3C loopt issue **#5213** over 1.3.5 ("Add clarification to 1.3.5 Identify Input Purpose
the heuristics-based autocomplete is not enough"). De kern daarvan raakt hoe je dit criterium
beoordeelt:

**Browser-autocomplete is een bijwerking van 1.3.5, niet het doel.** Dat een browser het veld
tóch invult op basis van de veldnaam of het type, betekent niet dat het criterium gehaald is.
De eis is dat het invoerdoel **expliciet programmatisch bepaald** kan worden, dus met een
`autocomplete`-attribuut. Zonder dat werken andere toepassingen niet, zoals eigen iconen of
kleuren per veldtype voor gebruikers met een cognitieve beperking.

Gevolg voor de beoordeling: laat je niet overtuigen door "de browser vult het al in". Kijk of
het attribuut er staat. Het issue staat op "in progress"; de Understanding-tekst wordt
aangepast.

## De volledige lijst met invoerdoelen

Toets alleen velden die in deze lijst staan. Staat een veldtype er niet in, dan bestaat er
geen geldige waarde en is er geen bevinding.

**Persoon:** `name`, `honorific-prefix`, `given-name`, `additional-name`, `family-name`,
`honorific-suffix`, `nickname`, `organization-title`, `username`, `new-password`,
`current-password`, `organization`, `language`, `bday` (+ `-day`, `-month`, `-year`), `sex`,
`url`, `photo`

**Adres:** `street-address`, `address-line1` t/m `address-line3`, `address-level1` t/m
`address-level4`, `country`, `country-name`, `postal-code`

**Telefoon en e-mail:** `tel`, `tel-country-code`, `tel-national`, `tel-area-code`,
`tel-local` (+ `-prefix`, `-suffix`), `tel-extension`, `email`, `impp`

**Betaling:** `cc-name`, `cc-given-name`, `cc-additional-name`, `cc-family-name`, `cc-number`,
`cc-exp` (+ `-month`, `-year`), `cc-csc`, `cc-type`, `transaction-currency`,
`transaction-amount`

Let op de Nederlandse praktijk: voor een **huisnummer** en een **toevoeging** bestaat geen
waarde (de lijst kent alleen volledige adresregels), en voor **voorletters** ook niet. In een
Nederlands adresformulier toets je dus in de praktijk alleen `postal-code`, plus de
naam-, telefoon- en e-mailvelden.

Wat wél getoetst wordt in een Nederlands adresformulier:
- Postcode → `autocomplete="postal-code"`
- Naam, e-mailadres, telefoonnummer → zie de QuickFinding `a3e675f7-...`

Aanleiding: UTHEU-01 (2026-08-03), afvalkalender-formulier met postcode, huisnummer en
toevoeging. De auditor keurde af omdat huisnummer en toevoeging geen autocomplete hadden en
adviseerde `address-line2`; Frits gaf aan dat die waarden voor deze velden niet bestaan. De
postcode had correct `postal-code`, dus het criterium voldoet.

## Regels

- Iets dat alleen in de HTML zit maar niet zichtbaar is op de pagina: check eerst de full-page screenshot voordat je rapporteert. HTML-only betekent niet automatisch zichtbaar voor de gebruiker.
- Geen URL's in het advies. De QuickFinding `a3e675f7-...` eindigt met een link naar de W3C-vertaling; laat die weg in de bevinding zelf, conform `Shift2_Schrijfregels.md`.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Een veld voor je eigen gegevens zegt in de code waar het voor is

### In het kort

Vraagt een formulier om gegevens van de bezoeker zelf, zoals naam, e-mailadres,
telefoonnummer of postcode, dan moet het veld in de code een `autocomplete`-waarde dragen
die zegt welk gegeven het is. Daarmee kan een browser het veld invullen, en kan hulpsoftware
er een herkenbaar icoon of een eigen kleur bij zetten voor wie moeite heeft met formulieren.

Het criterium geldt alleen voor velden waarvoor de WCAG-lijst met invoerdoelen een waarde
kent. Voor een huisnummer, een toevoeging of voorletters bestaat geen waarde, dus daar valt
niets af te keuren. `autocomplete="on"` is niet genoeg, en dat de browser het veld tóch
invult telt niet: de waarde moet in de code staan.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — In de code

1. [agent] Zoek alle invoervelden op de pagina, ook die in een uitklapblok of een volgende
   formulierstap; open die in de auditsessie. Een zoekveld of een vraag over iets anders dan
   de bezoeker zelf valt af.
2. [agent] Houd alleen de velden over die om een gegeven van de bezoeker zelf vragen én
   waarvoor de WCAG-lijst een waarde kent: naam, voornaam, achternaam, e-mail, telefoon,
   straat, postcode, woonplaats, land, geboortedatum. Huisnummer, toevoeging en voorletters
   staan niet in die lijst en tellen niet mee.
3. [agent] Kijk per overgebleven veld of er een `autocomplete`-waarde staat en of die klopt
   met het gevraagde gegeven. Geen waarde, `on`, of een verkeerde of verzonnen waarde is een
   afkeuring. `off` is alleen goed bij gevoelige gegevens zoals een wachtwoord of een
   eenmalige code.

#### Stap 2 — Op het scherm

4. [agent] Controleer op de schermafdruk dat het veld ook echt zichtbaar is. Een veld dat
   alleen in de code staat en niet op de pagina, is geen bevinding.

#### Stap 3 — Wegen

5. [jij] Weeg de twijfelgevallen: een veld waarvan niet duidelijk is of het om de bezoeker
   zelf gaat, of een gegeven waarvoor de lijst net geen passende waarde heeft.

#### Stap 4 — Wegschrijven

6. [agent] Noteer in `reden` welke velden je hebt gevonden en welke daarvan onder dit
   criterium vallen. Zijn er geen velden voor eigen gegevens, dan is het oordeel
   `niet_aanwezig`, met erbij wat je wél hebt gezien, zoals alleen een zoekveld. Geen
   webadressen in het advies.

### Zo is het vastgesteld

Voor dit criterium bestaat geen meting. De agent leest de invoervelden uit de code van de
pagina zoals die na de JavaScript in de browser staat, met hun `autocomplete`-attribuut, en
legt die naast de WCAG-lijst met invoerdoelen en naast de schermafdruk. Velden die pas na
een klik verschijnen, zoals een volgende formulierstap, ziet hij alleen als hij die in de
auditsessie zelf heeft geopend.
