# Shift2-beoordelingsregels SC 2.1.4

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_1_4.md` als ze elkaar tegenspreken.

## Sneltoetsen druk je in; je vraagt er niet naar

Dit criterium is niet uit de HTML te bepalen. Een attribuut als `data-rsshortcut="play"` zegt
dát er een sneltoets bedoeld is, niet wélke toets, en ook niet of er werkelijk iets aan hangt.
Zet 2.1.4 daarom niet op `niet_te_bepalen` met een vraag aan de onderzoeker.

```
npm run cli -- get-sneltoetsen <url>                              alle letters en cijfers
npm run cli -- get-sneltoetsen <url> --in=<css>                   met de focus op een onderdeel
npm run cli -- get-sneltoetsen <url> --toetsen=",./;'[]\-=`"      leestekens
```

Het commando drukt elke toets in en vergelijkt de pagina ervoor en erna: aantal elementen,
lengte van de tekst, welk element focus heeft, of er geluid begint te spelen, of er een
dialoogvenster bij komt en of het adres wijzigt. Verandert er iets, dan deed die toets iets.

De focus gaat eerst naar de body. Staat de focus in een invoerveld, dan typ je letters en meet
je niets.

## Drie rondes, want het criterium kent drie uitwegen

De norm zegt: als er een sneltoets van één teken is, dan moet minstens één van deze drie waar
zijn — hij is uit te zetten, hij is te herdefiniëren met Ctrl of Alt erbij, of hij werkt alleen
wanneer dat onderdeel focus heeft. Die derde is met dit commando direct te toetsen:

| Ronde | Wat het beantwoordt |
|---|---|
| letters en cijfers, focus op de pagina | is er überhaupt een sneltoets van één teken |
| dezelfde toetsen met `--in=<css>` op het onderdeel | werkt hij alleen bij focus (dan toegestaan) |
| leestekens | het criterium noemt ook leestekens en symbolen, niet alleen letters |

Reageert een toets op de pagina zelf, dan is het pas een afkeuring als hij ook niet uit te
zetten of te herdefiniëren is. Zoek dan naar een instelling in het onderdeel zelf.

## Geen sneltoetsen: `niet_aanwezig`, niet `voldoet`

2.1.4 is een voorwaardelijke eis: hij begint met "if a keyboard shortcut is implemented". Is er
geen enkele sneltoets van één teken, dan is die eis leeg en is het criterium `niet_aanwezig` —
dezelfde vorm als 2.2.2, dat pas iets eist zodra er iets automatisch beweegt. Zie
`Shift2_Voldoet_Of_Niet_Aanwezig.md`.

Aanleiding: heuvelrug.nl, homepage (2026-08-19). Het oordeel stond op `niet_te_bepalen` met de
vraag welke toetsen de ReadSpeaker-functies activeren. Gemeten: 26 letters en 10 cijfers met de
focus op de pagina, dezelfde 36 met de focus op de webReader-knop, en 11 leestekens. Geen van
de 83 toetsaanslagen deed iets. De balk draagt wel `data-rsshortcut="menu"` en
`data-rsshortcut="play"`, maar daar hangt op deze pagina geen werkende sneltoets aan; die
attributen alleen zijn geen sneltoets.

## Regels

- Meet zelf. `niet_te_bepalen` alleen als de meting niet lukt, met de reden waarom.
- Bij PDF-samples is 2.1.4 niet van toepassing.
