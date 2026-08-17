# Shift2-beoordelingsregels SC 2.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_1_2.md` als ze elkaar tegenspreken.

## Wel automatisch te testen — via de audit-sessie-Chrome

Dit criterium is **niet** uit statische HTML of een screenshot te bepalen, maar wel met een
echte toetsenbordtest in de browser. Voer die zelf uit; zet 2.1.2 niet standaard op
`niet_te_bepalen`.

```
npm run cli -- get-toetsenbordval <url>                       (de main-content)
npm run cli -- get-toetsenbordval <url> --scope=pagina         (ter controle: alles)
npm run cli -- get-toetsenbordval <url> --typ-in=<css> --typ=<woord>
npm run cli -- get-toetsenbordval <url> --achteruit=true       (Shift+Tab)
```

Het commando zet een merkteken op elk focusbaar element, drukt Tab, leest na elke druk
`document.activeElement` uit, en herkent een val doordat de focus het gebied niet verlaat
terwijl een korte reeks elementen zich blijft herhalen. Het merkteken is nodig: zes sociale
links zien er in een beschrijving identiek uit, en dan lijkt een normale doorloop op een
cyclus van één element. Het inventariseert daarnaast de risicoconstructies (`iframe`, `embed`,
`object`, mediaspelers met bedieningsknoppen, positieve `tabindex`, dialoogvensters) en drukt
Escape zodra de focus in een dialoog belandt.

### Vier rondes, niet één

| Ronde | Waarom |
|---|---|
| main-content vooruit | het eigenlijke onderzoeksgebied |
| hele pagina vooruit | ter controle; een val in de header telt ook als hij buiten scope valt om te rapporteren |
| met een widget open (`--typ-in`) | een suggestielijst onder een zoekveld bestaat pas ná typen. Zonder deze ronde test je een pagina waarop die lijst er niet eens is — en juist zo'n lijst is een klassieke val |
| achteruit (`--achteruit=true`) | een val kan één kant op zitten: eruit met Tab lukt, met Shift+Tab niet |

Kijk in het tabvolgorde-bestand of de volgorde klopt met wat je verwacht. Staat er iets in
wat je niet had voorzien, dan meet je iets anders dan je denkt.

### Alleen de main-content

Bij een deelonderzoek content vallen het hoofdmenu, de hoofdnavigatie en de
toegankelijkheidsbalk **buiten de scope**. Test het uitklapmenu dus niet; beperk je tot de
main-content van de pagina.

### Wat je hiermee NIET beoordeelt

Of de focus zichtbaar is, valt onder 2.4.7 en is een ander criterium. Een val die zich alleen
voordoet in een specifieke schermlezer-modus vind je hiermee ook niet.

Aanleiding: heuvelrug.nl (2026-08-02). Main-content met 16 focusbare elementen, in 17 tabs
doorlopen waarna de focus de main netjes verliet. Geen iframes, geen positieve tabindex, geen
mediaspelers. Ter controle 200 tabs over de hele pagina: 90 unieke elementen, cyclus loopt
rond, geen val. Oordeel: voldoet. Frits vroeg of Claude dit criterium zelf kon oppakken; dat
kan.

Opnieuw gemeten op 2026-08-17, nu met het vaste commando. Main-content: 14 focusbare
elementen, alle 14 bereikt, focus eruit na 23 tabs. Hele pagina: 40 van 40, eruit na 41 tabs.
Met de zoeksuggesties open (getypt: "afval") kom je vanuit de lijst op "Meer resultaten", dan
de zoekknop, en verder; eruit na 33 tabs. Achteruit met Shift+Tab eruit in 9. De openstaande
vraag aan de onderzoeker ging precies over die suggestielijst en over de ReadSpeaker-balk;
beide blijken in de main te vallen en zijn dus meegenomen.

## Regels

- Voer de toetsenbordtest zelf uit in de audit-sessie-Chrome. Alleen als die test niet lukt
  (site achter login, pagina laadt niet) zet je 2.1.2 op `niet_te_bepalen` met de vraag voor
  de onderzoeker: "Kun je met Tab door [pagina] navigeren en bevestigen dat je nergens vast
  komt te zitten?"
- NOOIT concluderen uit statische HTML alleen. "Geen verdachte elementen dus OK" is geen
  geldige onderbouwing zonder de daadwerkelijke tabtest.
- Bij PDF-samples is 2.1.2 niet van toepassing.
