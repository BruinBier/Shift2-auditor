# Shift2-beoordelingsregels SC 2.2.2

> Vastgelegde Shift2-voorkeuren voor dit succescriterium: wanneer iets een afkeuring is,
> wanneer een opmerking, en wanneer juist geen bevinding.
> Deze regels gaan **voor** `wcag-checklists/Checklist_SC_2_2_2.md` als ze elkaar tegenspreken.

## Wel automatisch te testen — via de browser

Dit criterium is **niet** uit opgehaalde HTML te bepalen, maar wel te meten. Voer de meting
zelf uit; schrijf 2.2.2 niet op `niet_aanwezig` op grond van een blik in de code.

```
npm run cli -- get-beweging <url>
npm run cli -- get-beweging <url> --klik="tekst:Accepteren"    (als een melding de pagina afdekt)
npm run cli -- get-beweging <url> --seconden=10                (langer kijken)
```

### Waarom de code niet genoeg is

"Er is geen carrousel" en "ik heb niet gekeken of er een carrousel is" leveren dezelfde zin
op. Een slider die om de vier seconden doorschuift, een teller die zichzelf bijwerkt, een
CSS-animatie die eeuwig doorloopt, een filmpje in een kader van YouTube — niets daarvan is
als zodanig in de HTML te herkennen. Wat er wél is: tijd laten verstrijken en kijken of er
iets verandert.

### De tijdlijn is de grens uit het criterium

```
binnenkomst ---- 3 s bezinken ---- venster van 5 s ---- einde
```

De eerste drie seconden tellen **niet** mee. Daarin komt van alles binnen dat niets met
beweging te maken heeft: luie afbeeldingen, lettertypen die inschuiven, een widget die
zichzelf opbouwt, en het scrollen dat de paginabrede opname zelf veroorzaakt. Verandert er
in de vijf seconden dáárna nog steeds iets, dan duurt het langer dan vijf seconden en is de
eis van 2.2.2 niet leeg.

Beeld en code worden op precies dezelfde twee momenten geknipt. Dat staat in het overzicht
("het venster loopt van 5,7s tot 11,2s"). Zonder die gelijkloop viel op heuvelrug.nl de
ReadSpeaker-balk, die nog aan het inladen was, in het venster dat telt.

### Vier zintuigen, want geen enkele ziet alles

| Zintuig | Ziet | Ziet niet |
|---|---|---|
| beeldvergelijking | alles wat zichtbaar verandert, ook in een kader van een ander domein en op een canvas | verandering buiten de opname |
| bijwerkingen in de code | tekst en elementen die veranderen, ook als het beeld nauwelijks verschilt | een canvas, een video, een ander domein |
| verplaatsingen | elementen die opschuiven of van maat veranderen | verandering zonder verplaatsing (kleur, tekst) |
| opgaaf van de pagina zelf | CSS-animaties, `<marquee>`, spelende media | wat met JavaScript wordt getekend |

Het commando levert per veranderd gebied een uitsnede vóór en ná. **Keur nooit af op het
getal alleen; leg de uitsnedes ernaast.** Twee foto's van dezelfde plek laten in één blik
zien of de carrousel is doorgeschoven of dat er alleen een lui geladen foto is ingevallen.

## Regels

- **Voer de meting uit.** Alleen als dat niet lukt (site achter login, pagina laadt niet)
  gaat 2.2.2 op `niet_te_bepalen`, met de reden waarom het niet lukte.

- **`niet_aanwezig`, niet `voldoet`.** Beweegt er niets, dan is de eis van 2.2.2 leeg en is
  het criterium niet van toepassing. Zie `Shift2_Voldoet_Of_Niet_Aanwezig.md`; dit is het
  schoolvoorbeeld dat daar staat.

- **Niet elke bijwerking is beweging.** 2.2.2 gaat over informatie die beweegt, knippert of
  zichzelf bijwerkt — iets dat een bezoeker merkt. Een attribuut dat omklapt zonder dat er
  iets anders komt te staan is dat niet. Het commando schift daar zelf op en laat in het
  overzicht per regel zien wat wel en niet meetelde (`telt` / `niet`); loop die lijst na
  voordat je een afkeuring schrijft. Op heuvelrug.nl wisselden `name` en `type` van het
  zoekveld zes keer terwijl er op het beeld geen enkel vakje veranderde.

- **Beweegt er wel iets, dan is dat nog geen afkeuring.** Drie vragen daarna, en die
  beantwoordt het commando niet:
  1. Begon het uit zichzelf, of na een handeling van de bezoeker?
  2. Staat het naast andere inhoud (een filmpje op een lege pagina valt er niet onder)?
  3. Is er een manier om het te pauzeren, te stoppen of te verbergen?

  Het commando noemt kandidaat-knoppen op naam ("pauze", "stop", "carrousel"), maar loopt
  ze niet na. Dat doe je zelf: een knop die zo heet hoeft niet te werken en hoeft niet bij
  de bewegende inhoud te horen.

- **`prefers-reduced-motion` is geen pauzeermogelijkheid.** Het commando meldt of die
  mediaquery in de opmaak voorkomt, als feit. Het is een aanwijzing dat de makers aan
  beweging gedacht hebben, geen mechanisme op de pagina in de zin van 2.2.2.

- **Onbeslist is geen "nee".** Staat er een speler met een `autoplay`-attribuut die niet
  gespeeld heeft, dan zet het commando `beslist: false`. Chrome houdt geluid dat uit zichzelf
  begint tegen; op het scherm van een bezoeker kan diezelfde speler wél aangaan. Meet dan
  opnieuw in de audit-sessie (`npm run chrome:debug`) en zet 2.2.2 niet op `niet_aanwezig`
  zolang dit openstaat.

- **Meet ná het wegklikken van een melding.** Een cookiescherm dekt de halve pagina af; wat
  eronder beweegt is dan niet te zien. Gebruik `--klik`.

- Bij PDF-samples is 2.2.2 niet van toepassing.

## Wat je hiermee NIET beoordeelt

Geluid dat uit zichzelf begint valt onder 1.4.2 en flitsen onder 2.3.1. De mediaspelers die
dit commando opsomt zijn voor 1.4.2 bruikbaar als **aanwijzing**, maar niet als meting: het
autoplay-beleid van de browser vertekent precies dat. Bewegen dat pas begint als de bezoeker
scrolt of ergens overheen gaat, valt buiten 2.2.2 — dat start niet automatisch.

## Aanleiding

heuvelrug.nl, homepage, 2026-08-20. Op de kaart "Zo is het vastgesteld" stond onder 2.2.2 één
stap: de pagina ophalen. De onderbouwing ("geen carrousel, de hero staat stil, het
aria-live-gebied vult alleen na typen") kwam uit het lezen van die HTML, en dat lezen laat
geen spoor na. Frits vroeg waarom daar één stap stond en onder 2.1.4 twee.

Gemeten met het nieuwe commando: venster van 5,5 s, 0 van de 3658 vakjes op het beeld
veranderd, 0 elementen verplaatst, 0 bijwerkingen in de weergave (wel 3 attribuutwissels op
het zoekveld, die niet meetellen), geen CSS-animaties, geen mediaspelers. Oordeel blijft
`niet_aanwezig`, nu met een meting eronder in plaats van een geloofwaardige zin.
