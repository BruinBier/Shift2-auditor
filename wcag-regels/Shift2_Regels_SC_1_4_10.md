# Shift2-beoordelingsregels SC 1.4.10

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_1_4_10.md` als ze elkaar tegenspreken.

## Wel te testen — via de audit-sessie-Chrome op 320px

Reflow is meetbaar: zet de viewport op 320 CSS-pixels en kijk of de pagina horizontaal moet
scrollen. Doe dat zelf; vul geen "voldoet" of "lijkt responsive" in zonder gemeten te hebben,
en zet het criterium niet standaard op `niet_te_bepalen`.

De test draait via de Chrome achter "Audit-sessie starten" (debugpoort 9222). Zie
`tmp/reflow2.mjs` voor het werkende voorbeeld.

### Werkwijze

1. **Zet de viewport op 320px en controleer dat het er ook echt 320 zijn.** De verticale
   scrollbar pikt ongeveer 15px af, waardoor `document.documentElement.clientWidth` op 305
   uitkomt en je te smal test. Meet die waarde, corrigeer de viewportbreedte met het verschil
   en controleer opnieuw.
2. **Test in de NORMALE weergave.** Staat er nog een hoogcontrast-instelling in `localStorage`
   van een eerdere test, verwijder die dan eerst en herlaad.
3. **Vergelijk `scrollWidth` met de viewportbreedte.** Is `scrollWidth` groter, dan moet de
   gebruiker horizontaal scrollen: **afkeuring**.
4. **Loop de elementen af die rechts buiten beeld steken.** Negeer daarbij elementen in een
   container die zelf horizontaal mag scrollen (`overflow-x: auto|scroll`), zoals een brede
   tabel in een wrapper. Dat is toegestaan.
5. **Maak een screenshot en bekijk die.** Alleen zo zie je overlappende of afgeknipte tekst.

Steekt een element uit zonder dat de pagina scrollt, dan loopt het onzichtbaar over (vaak een
negatieve marge). Dat is op zichzelf geen afkeuring, maar controleer op de screenshot of er
inhoud wegvalt.

### Wat deze meting NIET dekt — altijd melden

Kun je een van deze punten niet vaststellen, zet het criterium dan op `niet_te_bepalen` met
een concrete vraag; laat het nooit stilzwijgend als "voldoet" staan.

- **Content die verdwijnt** door `display: none` in een media query. Dat geeft geen overloop,
  maar de gebruiker mist wel informatie. Vergelijk daarvoor met de brede weergave.
- **Functionaliteit die stukgaat** op smal scherm (een dropdown die niet meer opengaat, een
  slider die vastloopt). Dat vergt interactie, niet alleen meten.
- **Overlappende of afgeknipte tekst** buiten het zichtbare deel van de screenshot. Maak dan
  een `fullPage`-screenshot.

Aanleiding: heuvelrug.nl (2026-08-02). Op exact 320px is `scrollWidth` gelijk aan de viewport,
dus geen horizontaal scrollen; de toptaakblokken klappen onder elkaar en het menu is ingeklapt.
Eén container is 335px breed maar veroorzaakt geen scrollbalk. Oordeel: voldoet. Bij de eerste
poging testte Claude op 305px door de scrollbar, en stond de pagina nog in hoogcontrast-modus
uit een eerdere test. Frits vroeg of dit criterium te testen was; dat kan.

## Regels

- Meet zelf in de audit-sessie-Chrome op exact 320 CSS-pixels. Lukt de test niet (site achter
  login, pagina laadt niet), zet 1.4.10 dan op `niet_te_bepalen` met de vraag voor de
  onderzoeker: "Kun je [pagina] checken op 320px breedte? Werkt alles zonder horizontaal
  scrollen, en valt er geen content weg?"
- NOOIT concluderen uit CSS alleen of uit een screenshot op volle breedte. Een CMS kan
  responsive ogen en toch op 320px breken.
- "Waarschijnlijk OK" of "lijkt responsive" is geen geldige onderbouwing.
- Bij PDF-samples is 1.4.10 niet van toepassing.
