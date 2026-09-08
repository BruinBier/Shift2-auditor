# Shift2-beoordelingsregels SC 1.3.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_3_2.md` als ze elkaar tegenspreken.

## Hoe je 1.3.2 op een HTML-pagina test

Op een HTML-pagina wordt 1.3.2 gewoon getoetst. De eis: de volgorde van de elementen in de
code moet logisch zijn en de betekenis behouden, ongeacht hoe CSS het visueel rangschikt.
Hulpsoftware volgt de codevolgorde van boven naar beneden, dus styling met flexbox, grid of
absolute positionering mag die volgorde niet verstoren.

**1. Lineariseren (de snelste en sterkste test).** Zet alle CSS uit en lees de pagina van
boven naar beneden. Blijft de inhoud begrijpelijk, sluiten koppen aan op hun tekst, staan
labels bij hun velden? Zo niet, dan is dat een afkeuring. In de audit-sessie-Chrome kan dat
door alle stylesheets uit te schakelen en de tekst uit te lezen.

**2. Actief zoeken naar de constructies die de volgorde omkeren.** Controleer in de gerenderde
pagina op:
- `order` bij flexbox of grid (verandert de visuele volgorde zonder de code aan te passen)
- `position: absolute` of `fixed`
- negatieve marges
- `flex-direction: row-reverse` / `column-reverse`
Vind je die, kijk dan gericht of de betekenis erdoor verschuift.

**3. Vergelijk met de screenshot.** Komt de leesvolgorde in de code overeen met wat je ziet?
Let vooral op nieuwskaarten waarbij datum of categorie visueel boven de titel staat maar in de
code eronder; dan koppelt hulpsoftware die gegevens aan het verkeerde item.

Alleen een screenshot-vergelijking is niet genoeg: dat toont de uitkomst, niet de oorzaak.
Doe minstens stap 1 of stap 2 erbij en meld in `reden` welke test je hebt gedaan.

## Regels

- 1.3.2 IS NIET TE BEOORDELEN OP OPGEHAALDE HTML. De volgorde in de code is de ene helft van het antwoord, de opmaak de andere. Een kaart met de afbeelding in de code na de titel kan hem op het scherm erboven zetten met `order`, `row-reverse`, `grid-area` of absolute positionering — en dat staat in externe stylesheets die je niet ophaalt. Op heuvelrug.nl zijn dat er vijftien. Schrijf dus nooit "er is geen CSS-positionering die de leesvolgorde omkeert" op grond van de opgehaalde pagina: dat is een afwezigheid vaststellen in materiaal waar het niet in kán staan.
- GEBRUIK `npm run cli -- get-leesvolgorde <url>`. Dat opent de pagina in een echte browser, leest van elk zichtbaar element de positie, en meldt waar het volgende element in de code visueel bóven of links van zijn voorganger staat. Met `--zonder-css` komt er ook een schermafdruk zonder opmaak uit, het equivalent van "Disable All Styles" in de Web Developer-extensie. Er wordt altijd een tekstbestand weggeschreven met de voorleesvolgorde: dat is wat hulpsoftware achter elkaar doorloopt.
- WAT DAT GEREEDSCHAP NIET MELDT, en wat je dus zelf moet bekijken: elementen die ver buiten het scherm geparkeerd staan (skiplinks, schermlezerlabels), kolommen naast elkaar, en links die over twee regels afbreken. Die drie leveren anders zoveel valse meldingen op dat de echte omkeringen erin verdwijnen. Zie ook de mogelijkheid dat JavaScript pas na interactie iets verplaatst; daarvoor moet je zelf klikken in een auditsessie.
- EEN OMKERING IS NIET AUTOMATISCH EEN BEVINDING. Weeg of het verplaatste element betekenis draagt. Een afbeelding met een leeg tekstalternatief die visueel boven de titel staat maar in de code eronder, wordt niet voorgelezen en verandert de betekenisvolle volgorde dus niet: geen bevinding. Verplaatst er tekst, een kop of een bedienbaar element, dan wel. Noteer in de onderbouwing welke omkeringen je vond en waarom ze wel of niet meetellen.
- Aanleiding voor bovenstaande: heuvelrug.nl (2026-08-15). De onderbouwing beschreef dat de afbeelding in elke nieuwskaart in de code na de titel staat en visueel erboven, en concludeerde twee zinnen later dat er geen CSS-positionering is die de leesvolgorde omkeert. Het gereedschap vindt die vijf kaarten en verder niets; op een vervolgpagina nul.
- Niet-getagde PDF: zet 1.3.2 op niet_te_bepalen, niet op afgekeurd. Zonder tags bestaat er geen programmatische leesvolgorde om te toetsen. De wortel-oorzaak wordt al onder 1.3.1 afgekeurd.
- Vermijd technisch jargon: schrijf "volgorde in de code", niet "DOM-volgorde".

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

De volgorde in de code is ook de volgorde die je ziet

### In het kort

Hulpsoftware leest een pagina in de volgorde van de code, van boven naar beneden. Opmaak
kan die volgorde op het scherm omgooien: een datum die boven de titel staat, een kolom die
naar links schuift, een knop die ergens anders wordt neergezet. Blijft de pagina zonder
opmaak begrijpelijk en horen de dingen die bij elkaar horen ook in de code bij elkaar, dan
voldoet dit criterium.

Een omkering is niet vanzelf een afkeuring. Het gaat om betekenis: een afbeelding zonder
tekstalternatief die visueel ergens anders staat, wordt niet voorgelezen en verandert
niets. Tekst, een kop of een bedienbaar element op een andere plek wel.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-leesvolgorde` opent de pagina in een echte browser, leest van elk zichtbaar
   element de positie en meldt waar het volgende element in de code visueel bóven of links
   van zijn voorganger staat. Met `--zonder-css` komt er ook een schermafdruk zonder opmaak
   uit, en altijd een tekstbestand met de voorleesvolgorde.

#### Stap 2 — In de auditsessie

2. [agent] Lees de schermafdruk zonder opmaak van boven naar beneden. Sluiten koppen aan op
   hun tekst, staan labels bij hun velden, horen datum en categorie bij het juiste item?
3. [agent] Loop de gemelde omkeringen na en kijk zelf naar wat het gereedschap overslaat:
   elementen die buiten beeld staan, kolommen naast elkaar, en wat JavaScript pas na een
   klik verplaatst. Open daarvoor uitklapblokken en menu's in de auditsessie.
4. [agent] Kijk in de opgemaakte pagina naar `order`, `row-reverse` of `column-reverse`,
   absolute of vaste positionering en negatieve marges, en noteer wat daardoor verschuift.

#### Stap 3 — Wegen

5. [jij] Weeg per omkering of het verplaatste element betekenis draagt. Een afbeelding met
   een leeg tekstalternatief telt niet mee; tekst, een kop of een bedienbaar element wel.
   Noteer welke omkeringen je vond en waarom ze wel of niet meetellen.

#### Stap 4 — Wegschrijven

6. [agent] Zet in `reden` welke test je hebt gedaan en wat er verschoof. Alleen een
   vergelijking met de schermafdruk is niet genoeg: die toont de uitkomst, niet de oorzaak.
   Bij een niet-getagde PDF is het oordeel `niet_te_bepalen`, niet `afgekeurd`: zonder tags
   is er geen leesvolgorde in de code om te toetsen.

### Zo is het vastgesteld

`get-leesvolgorde` opent de pagina in een echte browser, zodat de JavaScript en de externe
stylesheets van de site hebben gedraaid. Van elk zichtbaar element legt het de plek op het
scherm naast de plek in de code, en het meldt elke keer dat het volgende element in de code
visueel boven of links van zijn voorganger staat. Drie bekende valse meldingen filtert het
zelf weg: elementen buiten het scherm, kolommen naast elkaar en links die over twee regels
afbreken. Met `--zonder-css` komt er een schermafdruk zonder opmaak bij, het equivalent van
"alle stijlen uit" in de browser, en altijd een tekstbestand met de volgorde waarin
hulpsoftware de pagina doorloopt.

Wat het gereedschap niet ziet: verplaatsingen die pas na een klik ontstaan, en of een
gevonden omkering betekenis draagt. Dat eerste is werk voor de agent in de auditsessie, het
tweede is een weging en staat in de onderbouwing.
