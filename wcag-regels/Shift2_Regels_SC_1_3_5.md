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
