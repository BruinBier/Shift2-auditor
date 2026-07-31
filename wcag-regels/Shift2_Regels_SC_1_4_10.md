# Shift2-beoordelingsregels SC 1.4.10

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_10.md` als ze elkaar tegenspreken.

## Niet uit HTML of screenshot te bepalen

Dit criterium vereist een test in de browser. Zet het altijd op `niet_te_bepalen`
(of `niet_aanwezig` als het aantoonbaar niet van toepassing is) en noteer de vraag in `reden`.

**Vraag voor de onderzoeker:**

> Kun je [pagina] checken op 320px breedte (DevTools responsive mode of het venster versmallen)? Werkt alles zonder horizontaal scrollen, en valt er geen content weg?

## Regels

- NOOIT zelf concluderen uit een screenshot of uit CSS. Een CMS kan responsive ogen en toch op 320px breken.
- Niet "waarschijnlijk OK" of "lijkt responsive" invullen.
- Bij PDF-samples is 1.4.10 niet van toepassing.
