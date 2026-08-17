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

### De hele pagina, van buiten naar buiten

De handeling die nagebootst wordt, in de woorden van Frits: **ga in de adresbalk staan, tab
door de pagina helemaal naar onderen, langs "Terug naar boven", en dan weer de adresbalk in.**
Dat is de test — niet een stuk van de pagina.

Daarom is de hele pagina de norm en niet de main-content. Een val in de header of de footer
is net zo goed een val: wie daar vast komt te zitten bereikt de inhoud nooit. Beperken tot de
main hoort bij het rapporteren, niet bij het meten. Met `--scope=main` kan het nog, maar dan
omdat je het wilt.

| Ronde | Waarom |
|---|---|
| vooruit vanaf de bovenkant | de gewone doorloop; het laatste element hoort gevolgd te worden door een Tab die het document verlaat |
| achteruit vanaf de onderkant (`--achteruit=true`) | een val kan één kant op zitten: eruit met Tab lukt, met Shift+Tab niet |
| met een widget open (`--typ-in`) | een suggestielijst onder een zoekveld bestaat pas ná typen. Zonder deze ronde test je een pagina waarop die lijst er niet eens is — en juist zo'n lijst is een klassieke val |

**Let op het startpunt.** `blur()` haalt de focus weg maar verzet het startpunt voor Tab niet:
de browser onthoudt waar je was en gaat daarvandaan verder. Daardoor begon een ronde
halverwege de header en werd maar een stuk van de pagina afgelopen, zonder dat daar iets van
te zien was. Het commando zet het startpunt nu expliciet en schrijft het bovenaan het
tabvolgorde-bestand; controleer dat het staat waar je het verwacht.

Kijk in dat bestand ook of de volgorde klopt met wat je verwacht, en of de laatste regel
`(buiten de pagina)` is. Staat er iets in wat je niet had voorzien, dan meet je iets anders
dan je denkt.

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

Opnieuw gemeten op 2026-08-17, nu met het vaste commando. Vooruit vanaf de bovenkant: 40
focusbare elementen, alle 40 bereikt, "Terug naar boven" als laatste en daarna het document
uit. Achteruit vanaf de onderkant: in 39 stappen terug tot "Naar de inhoud gaan", ook daar
het document uit. Met de zoeksuggesties open (getypt: "afval") kom je vanuit de lijst op
"Meer resultaten", dan de zoekknop, en verder tot buiten het document. De openstaande vraag
aan de onderzoeker ging precies over die suggestielijst en over de ReadSpeaker-balk; beide
zijn meegenomen.

De eerste opzet mat alleen de main-content en miste daardoor "Terug naar boven" onderaan.
Frits: "de hele pagina moet telkens worden getoetst."

## Regels

- Voer de toetsenbordtest zelf uit in de audit-sessie-Chrome. Alleen als die test niet lukt
  (site achter login, pagina laadt niet) zet je 2.1.2 op `niet_te_bepalen` met de vraag voor
  de onderzoeker: "Kun je met Tab door [pagina] navigeren en bevestigen dat je nergens vast
  komt te zitten?"
- NOOIT concluderen uit statische HTML alleen. "Geen verdachte elementen dus OK" is geen
  geldige onderbouwing zonder de daadwerkelijke tabtest.
- Bij PDF-samples is 2.1.2 niet van toepassing.
