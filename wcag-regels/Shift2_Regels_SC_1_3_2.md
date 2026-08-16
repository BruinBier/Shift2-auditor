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
