# Shift2-beoordelingsregels SC 2.4.6

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_4_6.md` als ze elkaar tegenspreken.

## Loop ELKE kop na, niet alleen de h2's

Beoordeel per kop of de tekst het onderwerp beschrijft van wat eronder staat. Doe dit voor
alle niveaus (h1 tot en met h6), niet alleen voor de hoofdkoppen. Juist de lagere koppen
zijn vaak de niet-beschrijvende.

Niet-beschrijvende koppen zijn een **AFKEURING** (impact klein, responsibility redacteur).
Typische gevallen: "TIP!", "Let op!", "Wist je dat?", "Meer informatie", "Overig", "Nieuw",
losse uitroepen en labels die niets zeggen over de inhoud eronder.

De toets is: wie via de koppenlijst van een schermlezer door de pagina navigeert en alleen
de koppen hoort, weet die dan waar dat onderdeel over gaat? Zo nee, dan is het een afkeuring.

### Uitzondering: de kop erboven geeft de context

Een kop die onder een andere kop valt, ontleent zijn context aan die bovenliggende kop. Staat
"Wat betekent dit?" als h3 onder "Woningen van het gas af", dan is dat GEEN 2.4.6-bevinding:
in de koppenlijst hoort de gebruiker de bovenliggende kop en weet daarmee waar de vraag over
gaat.

Beoordeel dus altijd de kop IN ZIJN HIERARCHIE, niet los. Alleen als de kop ook mét zijn
bovenliggende kop niets zegt, is er een 2.4.6-bevinding. Bij "TIP!" was dat het geval; daar
stond geen zinvolle bovenliggende kop en de tip ging bovendien over een ander onderwerp dan
de kop waaronder hij hing.

Let op: staat zo'n kop op HETZELFDE niveau als de kop erboven (twee keer h2), dan hangt hij
er programmatisch niet onder en vervalt de context. Dat is echter een 1.3.1-bevinding over
het kopniveau, geen 2.4.6-bevinding over de tekst. Frits bevestigde dit op 2026-07-28 bij
BEV-03 (Klimaatmonitor, "Wat betekent dit?" onder "Woningen van het gas af"): geen
2.4.6-afkeuring en ook geen opmerking, alleen de 1.3.1-bevinding B014 over het niveau.

Advies: geef de kop een omschrijving van de inhoud, met een concreet voorbeeld uit de
werkelijke tekst ("Tip: kies kleding die lang meegaat").

### 2.4.6 en 1.3.1 op dezelfde kop

Deze twee kunnen tegelijk gelden en zijn verschillende bevindingen:

| Wat er mis is | Criterium |
|---|---|
| De koptekst beschrijft de inhoud eronder niet | **2.4.6** (afkeuring) |
| Het kopniveau of de nesting klopt niet met de inhoud | **1.3.1** |
| De kop is geen echt kop-element (strong, p met opmaak) | **1.3.1** |
| De kop is leeg | **1.3.1** |

Vind je een niet-beschrijvende kop die óók verkeerd genest is, maak dan beide bevindingen.

Aanleiding: duurzaam.beverwijk.nl/tweedehands (2026-07-28). De kop "TIP!" stond als h3 onder
"Online" terwijl de tekst over kleding ging. De auditor zag dit wel bij 1.3.1 maar zette
2.4.6 op "voldoet", omdat hij daar alleen de h2's langsliep. Frits wees erop. Bevindingen
B007 (2.4.6, afkeuring) en B008 (1.3.1, opmerking) in BEV-03.

Let op: er zijn geen QuickFindings onder 2.4.6, dus je schrijft deze bevindingen zelf. Volg
`Shift2_Schrijfregels.md`.

## Regels

- Bestandsnaam als bijschrift in een vergrote galerij-weergave (SIMsite-patroon): eigen bevinding onder 2.4.6, klein en redacteur, los van de 1.1.1-bevinding over de ontbrekende tekstalternatieven. Spreek hier over "onderschrift", bij 1.1.1 over "tekstalternatief".
- NIET-GETAGDE PDF: 2.4.6 WEL gewoon beoordelen. Dit criterium gaat over de inhoudelijke kwaliteit van de koptekst, en die staat er ook zonder tags. Kijk naar de pagina: staan er koppen boven de paragrafen, en dekt die tekst de lading van wat eronder staat? Geef een echt oordeel (voldoet of afkeuring); zet het niet op niet_te_bepalen met "geen tags" als reden. Dat de kop technisch niet als kop is vastgelegd, is een 1.3.1-kwestie, niet een 2.4.6-kwestie. Vastgelegd door Frits op 2026-08-02 bij UTHEU-01.
