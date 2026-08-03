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

- Niet-getagde PDF: zet 1.3.2 op niet_te_bepalen, niet op afgekeurd. Zonder tags bestaat er geen programmatische leesvolgorde om te toetsen. De wortel-oorzaak wordt al onder 1.3.1 afgekeurd.
- Vermijd technisch jargon: schrijf "volgorde in de code", niet "DOM-volgorde".
