# Shift2-beoordelingsregels SC 2.1.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_1_2.md` als ze elkaar tegenspreken.

## Wel automatisch te testen — via de audit-sessie-Chrome

Dit criterium is **niet** uit statische HTML of een screenshot te bepalen, maar wel met een
echte toetsenbordtest in de browser. Voer die zelf uit; zet 2.1.2 niet standaard op
`niet_te_bepalen`.

De test draait via de Chrome achter "Audit-sessie starten" (debugpoort 9222). Zie
`tmp/tabtest-content.mjs` voor het werkende voorbeeld.

### Werkwijze

1. **Inventariseer de risicoconstructies binnen de main-content.** Een toetsenbordval ontstaat
   vrijwel altijd bij: `iframe`, `embed`, `object`, `video`/`audio` met controls, custom
   widgets, modals, en elementen met een positieve `tabindex`. Zijn die er geen enkele, dan is
   de kans op een val klein.
2. **Tab door de main-content** en lees na elke Tab uit welk element focus heeft
   (`document.activeElement`). Ga door tot de focus de main-content verlaat.
3. **Herken een val:** hetzelfde element komt steeds terug zonder dat er iets anders
   tussendoor komt. Verlaat de focus de main-content netjes, dan is er geen val.
4. **Test bij een modal of widget ook Escape** en of de focus daarna terugkeert naar de
   pagina.

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

## Regels

- Voer de toetsenbordtest zelf uit in de audit-sessie-Chrome. Alleen als die test niet lukt
  (site achter login, pagina laadt niet) zet je 2.1.2 op `niet_te_bepalen` met de vraag voor
  de onderzoeker: "Kun je met Tab door [pagina] navigeren en bevestigen dat je nergens vast
  komt te zitten?"
- NOOIT concluderen uit statische HTML alleen. "Geen verdachte elementen dus OK" is geen
  geldige onderbouwing zonder de daadwerkelijke tabtest.
- Bij PDF-samples is 2.1.2 niet van toepassing.
