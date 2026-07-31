# Shift2-beoordelingsregels SC 2.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_1_2.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen

Dit criterium vereist een test in de browser. Zet het altijd op `niet_te_bepalen`
(of `niet_aanwezig` als het aantoonbaar niet van toepassing is) en noteer de vraag in `reden`.

**Vraag voor de onderzoeker:**

> Kun je met Tab door [pagina] navigeren en bevestigen dat je nergens vast komt te zitten (modals, custom dropdowns, embeds)?

## Regels

- NOOIT zelf concluderen uit HTML of screenshot. Een toetsenbordval ontstaat door JS-gedrag van modals, custom widgets en embeds, en is niet uit statische HTML te detecteren.
- Niet "geen verdachte elementen dus OK" invullen.
- Bij PDF-samples is 2.1.2 niet van toepassing.
