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

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Wat uit zichzelf beweegt, is te pauzeren, te stoppen of te verbergen

### In het kort

Een carrousel die doorschuift, een teller die bijwerkt, een animatie die doorloopt: begint
het uit zichzelf, duurt het langer dan vijf seconden en staat het naast andere inhoud, dan
moet de bezoeker het kunnen pauzeren, stoppen of verbergen. Of er iets beweegt is uit de
code niet te lezen; je laat tijd verstrijken en kijkt.

Beweegt er niets, dan is dit criterium niet aanwezig, geen "voldoet". Beweegt er wel
iets, dan is dat nog geen afkeuring: dan volgen drie vragen. Bij een PDF is het niet van
toepassing.

Sinds 2026-09-14 wordt dit niet meer per pagina uitgezocht. 2.2.2 staat in `ALTIJD_NIET_AANWEZIG` (`lib/metingen.ts`) en krijgt op elke pagina `niet_aanwezig` met bron `steekproef`. Op deze websites staan geen carrousels, tellers of doorlopende animaties; de pagina staat stil tot de bezoeker iets doet. `get-beweging` blijft bestaan en is vanaf de kaart te draaien als je het wilt nameten.


### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Meten

1. [meting] `get-beweging <url>`: drie opnamen, bij binnenkomst, na drie seconden en vijf
   seconden daarna; alleen het venster ná die drie seconden telt. Met
   `--klik="tekst:Accepteren"` als een melding de pagina afdekt.
2. [meting] Bij `beslist: false` (een speler met autoplay die niet gespeeld heeft): opnieuw
   in de auditsessie, want de browser houdt geluid dat uit zichzelf begint tegen.

#### Stap 2 — Beoordelen

3. [agent] Leg per veranderd gebied de uitsnede vóór en ná naast elkaar. Een lui geladen
   foto is geen beweging; een doorgeschoven carrousel wel. Loop de lijst `telt`/`niet` na.
4. [agent] Beweegt er iets: begon het uit zichzelf, staat het naast andere inhoud, duurt het
   langer dan vijf seconden? Alleen dan geldt de eis.
5. [agent] Zoek de pauze-, stop- of verbergknop en probeer hem in de auditsessie. Een knop
   die "pauze" heet hoeft niet te werken; `prefers-reduced-motion` telt niet als knop.

#### Stap 3 — Vastleggen

6. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
   `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
   "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Kon je een
   gebied niet beoordelen, gebruik dan `nvt` met een toelichting.
7. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
   kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
   verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Zo is het vastgesteld

`get-beweging` kijkt met vier zintuigen: de beeldpunten (ook een canvas en een kader van
een ander domein), de bijwerkingen in de code, de verplaatsingen van elementen, en wat de
pagina zelf opgeeft aan CSS-animaties en spelende media. Van elk veranderd gebied komt een
uitsnede vóór en ná.

Wat hier niet uit blijkt: of een beweging uit zichzelf begon of na een handeling, en of een
gevonden pauzeknop werkt en bij die beweging hoort. Dat loopt de agent na. Geluid is 1.4.2,
flitsen is 2.3.1.

### Deelgebieden

1. Beeldvergelijking: veranderde gebieden na de eerste drie seconden, uitsnedes bekeken
2. Bijwerkingen in de code en verplaatsingen die de bezoeker merkt, geschift op telt/niet
3. CSS-animaties en spelende media die de pagina zelf opgeeft
4. Bediening bij beweging: pauze, stop of verberg, nagelopen en geprobeerd

> Kaartblok toegevoegd op 2026-09-13 bij ZOET-01: dit bestand had wel regels maar geen
> kaartblok, en Frits wilde voor elk criterium dezelfde opmaak als 1.4.1. Het blok is uit de
> regels hierboven samengevat; er staat niets nieuws in. Zet uitleg bij deze lijst altijd
> als blokcitaat: een gewone alinea eronder plakt de kaartlezer aan het laatste gebied vast.
