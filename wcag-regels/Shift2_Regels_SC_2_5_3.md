# Shift2-beoordelingsregels SC 2.5.3

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_5_3.md` als ze elkaar tegenspreken.

## Wel automatisch te meten — via de audit-sessie-Chrome

De kern van 2.5.3 is een vergelijking: de **zichtbare tekst** van een element moet vóórkomen in
zijn **toegankelijke naam**. Beide zijn uit de gerenderde pagina te lezen, dus meet dit zelf.
Vul geen "voldoet" in zonder vergeleken te hebben.

De test draait via de Chrome achter "Audit-sessie starten" (debugpoort 9222). Zie
`tmp/labelinname.mjs` voor het werkende voorbeeld.

### Werkwijze

1. **Bepaal de zichtbare tekst** per interactief element. Verwijder daarbij:
   - alles met `aria-hidden="true"` (meestal de iconen)
   - visueel verborgen tekst (`sr-only`, `visually-hidden`, `screen-reader`)

   Wat overblijft is wat de gebruiker daadwerkelijk leest. Heeft een element geen zichtbare
   tekst (alleen een icoon), dan is 2.5.3 **niet van toepassing**; dat is een 4.1.2-kwestie.

2. **Bepaal de toegankelijke naam** in deze volgorde:
   `aria-labelledby` → `aria-label` → gekoppeld `<label>` (bij formuliervelden) →
   inhoud van het element (met het `alt` van afbeeldingen erin) → `title`.

3. **Vergelijk:** de zichtbare tekst moet als tekenreeks vóórkomen in de toegankelijke naam.
   Normaliseer op hoofdletters, dubbele spaties, harde spaties en aanhalingstekens.

4. **Mismatch = AFKEURING.** Het meest voorkomende geval is een `aria-label` die de zichtbare
   tekst overschrijft: de knop toont "Zoeken", maar `aria-label="Vind informatie op deze site"`.
   Spraakgestuurde gebruikers kunnen het element dan niet activeren met wat ze zien staan.

### Wat deze meting NIET dekt — altijd melden

Twee gevallen vallen buiten de automatische vergelijking. Kom je die tegen, zet het criterium
dan op `niet_te_bepalen` met een concrete vraag; laat het nooit stilzwijgend als "voldoet"
staan (zie de algemene regel: kun je iets niet beoordelen, meld het).

- **Zichtbaar label in een afbeelding van tekst.** Staat de knoptekst in een JPG of PNG, dan
  is die tekst niet uit te lezen en moet je op beeld beoordelen of de toegankelijke naam
  overeenkomt met wat er in de afbeelding staat.
- **Samengestelde `aria-labelledby`.** Wijst die naar meerdere elementen, of hebben de
  aangewezen elementen zelf weer een `aria-label`, dan is de vereenvoudigde berekening niet
  betrouwbaar. Controleer die gevallen met de hand in de accessibility-boom van de browser.

### Let op het verschil met 2.4.4 en 4.1.2

- **2.5.3** — er is zichtbare tekst, maar de toegankelijke naam bevat die niet
- **2.4.4** — de link heeft wel een naam, maar die maakt het linkdoel niet duidelijk
- **4.1.2** — het element heeft helemaal geen (betrouwbare) naam

Een X/Twitter-mismatch in de footer (X-logo zichtbaar, naam zegt nog "Twitter") is géén
2.5.3-kwestie: 2.5.3 vereist zichtbare **tekst**, en een logo is dat niet. Die hoort als
opmerking onder 2.4.4, zie `Shift2_Regels_SC_2_4_4.md`.

Aanleiding: heuvelrug.nl (2026-08-02). 41 elementen met een zichtbaar label, nul mismatches;
duurzaam.beverwijk.nl 32 elementen, ook nul. De auditor had "voldoet" ingevuld zonder te
vergelijken; de uitkomst klopte, de onderbouwing ontbrak. Frits vroeg hoe dit getest wordt.

## Logo met een slogan eronder: niet alles hoeft in de naam

Bevat een logo naast de organisatienaam ook een slogan of payoff ("Samen sterker", "voor de
kinderen van Ochakiv"), dan hoeft die tekst **niet** in de toegankelijke naam. Zet de
organisatienaam in het tekstalternatief en laat de slogan weg.

Reden: 2.5.3 bestaat voor spraakbesturing. Iemand zegt "klik gemeente X", niet de hele slogan.
Extra tekst in de naam maakt het commando juist lastiger.

Bij het W3C loopt hierover issue **#5171** ("2.5.3 Label in name, F96 example for logos"). De
faalconditie F96 dekt dit geval nu niet, waardoor een letterlijke lezing van 2.5.3 zou
suggereren dat álle zichtbare tekst in de naam moet. Dat is niet de bedoeling; er wordt om een
verduidelijkend voorbeeld gevraagd.

Praktische lijn: keur een logo niet af onder 2.5.3 omdat de slogan ontbreekt in het
tekstalternatief.

## Organisatienaam in het logo, niet in de toegankelijke naam: 1.1.1 EN 2.5.3

Staat de organisatienaam zichtbaar in het logo en komt hij niet terug in de toegankelijke
naam van de link, dan zijn dat **twee bevindingen**, geen keuze tussen twee criteria:

| Criterium | Wat er misgaat | Voor wie |
|---|---|---|
| 1.1.1 | de afbeelding heeft geen tekstalternatief | wie blind is en een schermlezer gebruikt, krijgt geen naam voor het logo |
| 2.5.3 | de zichtbare naam komt niet voor in de toegankelijke naam | wie spraakbediening gebruikt, leest de naam op het scherm, spreekt hem uit, en er gebeurt niets |

Dat één aanpassing allebei oplost, maakt het niet één bevinding. De gebruikersgroep en het
mechanisme verschillen, en in het rapport staan ze onder verschillende criteria.

Let op het onderscheid met de slogan hierboven: een ontbrekende **slogan** is geen
2.5.3-afkeuring, een ontbrekende **organisatienaam** wel.

Vastgesteld door Frits op 2026-08-18. Aanleiding: het logo op de homepage van heuvelrug.nl
toont "GEMEENTE UTRECHTSE HEUVELRUG" met een leeg tekstalternatief; de toegankelijke naam van
de link is "Ga naar de homepage", uit het title-attribuut. Ik adviseerde het bij 1.1.1 te
laten omdat de reparatie dezelfde is; Frits: "ik denk wel het zijn 2 verschillende dingen."

## Regels

- Meet zelf in de audit-sessie-Chrome. "Voldoet" alleen op basis van de vergelijking, niet op
  het oog of uit de HTML.
- Elementen zonder zichtbare tekst vallen buiten 2.5.3. Beoordeel die onder 4.1.2.
- De zichtbare tekst hoeft niet exact gelijk te zijn aan de naam, maar moet er wel volledig in
  zitten. "Zoeken" in "Zoeken op deze website" is goed; "Zoek" in "Zoeken" niet, want dan
  ontbreekt de zichtbare tekst.
- Bij een deelonderzoek content: beperk je tot de main-content. Hoofdmenu, hoofdnavigatie en
  toegankelijkheidsbalk vallen buiten de scope.
- Bij PDF-samples is 2.5.3 niet van toepassing.
