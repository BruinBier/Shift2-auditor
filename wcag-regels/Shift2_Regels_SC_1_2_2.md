# Shift2-regels SC 1.2.2 — Ondertiteling (vooraf opgenomen), niveau A

Video met geluid moet ondertiteling hebben. Voor de onderzoeksmethode zie
`Shift2_Werkwijze_Video.md`.

## Wanneer niet aanwezig

- Geen video in de main-content, of alleen een **link** naar YouTube of Vimeo → `niet_aanwezig`.
- Video **zonder geluid** → `niet_aanwezig` voor 1.2.2 (dat loopt via 1.2.1).

## Twee soorten ondertiteling

**Gesloten** ondertiteling kan de kijker aan- en uitzetten. Die zie je in de speler-API: de
ondertitelknop en het `timedtext`-endpoint.

**Open** ondertiteling is in het beeld gebrand en altijd zichtbaar. Die staat **nergens** in de
API. Vind je geen gesloten spoor, dan moet je frames bekijken voordat je iets concludeert.

> Bij BEV-03 zei de speler "Ondertiteling niet beschikbaar" en gaf het endpoint nul bytes,
> terwijl de video van begin tot eind ingebrande ondertiteling toont. Alleen op de API afgaan
> had een onterechte afkeuring opgeleverd.

Beide vormen voldoen aan 1.2.2. Er is dus geen afkeuring als je open ondertiteling vindt.

## Beoordeling

| Situatie | Status |
|---|---|
| Gesloten ondertiteling, handmatig gemaakt | `voldoet` |
| Open ondertiteling, hele video | `voldoet` |
| Automatisch gegenereerde ondertiteling (`kind: 'asr'`) | `afgekeurd` |
| Ondertiteling maar over een deel van de video | `afgekeurd` |
| Geen van beide | `afgekeurd` |
| Video start niet, of frames niet vast te leggen | `niet_te_bepalen` + concrete vraag |

Automatische ondertiteling telt niet: die bevat fouten en volgt de spreker niet betrouwbaar.
Meld dat expliciet in de bevinding, anders denkt de redacteur dat het geregeld is.

## Bij een afkeuring

Check eerst de QuickFinding-bibliotheek (`search-quick-findings ondertiteling`). Schrijf drie
zinnen volgens `Shift2_Schrijfregels.md`: wat de kijker mist, waarom dat een probleem is, en wat
de organisatie moet doen. Noem de videotitel, niet de URL.

Wie doof of slechthorend is, kan de video zonder ondertiteling niet volgen. Impact `serieus`,
verantwoordelijkheid `redacteur`.

## Als je open ondertiteling vindt

Zet 1.2.2 op `voldoet`, maar loop 1.2.3 en 1.2.5 gewoon door: ondertiteling dekt de gesproken
tekst, niet de **visuele** informatie zoals naambalkjes en tekst in beeld. Dat zijn losse
criteria met losse bevindingen.

## Op de kaart

> Dit blok staat in het scherm van "Waar sta ik". De kaart leest het rechtstreeks uit dit
> bestand: wat je hier verandert, staat bij de volgende keer verversen op de kaart. Er is
> geen tussenstap en geen kopie. Houd het kort — een kaart is geen naslagwerk. Wat langer
> is hoort in de secties hierboven.

### Titel

Ondertiteling bij video met geluid

### In het kort

Wie doof of slechthorend is, kan een video zonder ondertiteling niet volgen. Dat is de hele
vraag van dit criterium: staat de gesproken tekst er ook als tekst in beeld?

Twee vormen tellen allebei mee. **Gesloten** ondertiteling kun je aan- en uitzetten, en die
staat in de speler-API. **Open** ondertiteling zit in het beeld gebrand en staat daar juist
níét in: die zie je alleen door beeldjes te bekijken. Vind je geen spoor in de API, dan is dat
dus geen conclusie maar een reden om te gaan kijken.

Automatisch gegenereerde ondertiteling telt niet mee. Die bevat fouten en volgt de spreker
niet betrouwbaar, en in de sporen is hij te herkennen aan `kind: "asr"`.

### Audit-instructies

> Zet voor elke stap wie hem uitvoert: `[meting]` als een commando het al doet, `[jij]` als er
> een mens voor nodig is. De kaart toont dat met een vinkje of een open rondje, zodat er niet
> als opdracht staat wat allang gedaan is.

#### Stap 1 — Is er iets te beoordelen?

1. [agent] Zoek de videospelers in de main-content: `video`-elementen, en `iframe`-insluitingen
   van YouTube, Vimeo of een eigen speler. Noteer waarop je hebt gezocht.
2. [agent] Een video die alleen gelínkt is, zonder speler op de pagina, valt buiten de scope —
   ook bij het eigen kanaal van de organisatie. Zie `Shift2_Scope_Per_Sample.md`.
3. [agent] Heeft de video geen geluid, dan is dit criterium `niet aanwezig`: dat loopt via
   1.2.1. Stel dat vast door het audiospoor te lezen, niet door te kijken.

#### Stap 2 — De sporen lezen

4. [agent] Lees per video de ondertitelsporen uit de speler. Let op `kind: "asr"`: dat is
   automatisch gegenereerd en telt niet mee, ook al staat er een ondertitelknop.
5. [agent] Vind je geen spoor, concludeer dan NIETS. Bekijk eerst beeldjes verspreid over de
   video op ingebrande ondertiteling. Bij BEV-03 zei de speler "Ondertiteling niet beschikbaar"
   terwijl de video van begin tot eind ondertiteld was.
6. [agent] Zijn de sporen niet af te lezen — video start niet, beeldjes komen niet los — dan is
   dat `niet te bepalen` met de concrete vraag erbij. Niet gokken.

#### Stap 3 — Wegen

7. [jij] Dekt de ondertiteling de hele video, of stopt hij halverwege? Een deel is een
   afkeuring.
8. [jij] Bij een afkeuring: check eerst de bibliotheek met `search-quick-findings ondertiteling`.
   Impact `serieus`, verantwoordelijkheid `redacteur`. Noem de videotitel, niet het adres. Staat
   er automatische ondertiteling, schrijf dat dan expliciet — anders denkt de redacteur dat het
   geregeld is.
9. [jij] Vond je open ondertiteling, dan voldoet 1.2.2. Loop 1.2.3 en 1.2.5 wél door:
   ondertiteling dekt de gesproken tekst, niet wat er in beeld te zien is.

#### Stap 4 — Wegschrijven

10. [agent] Stuur de vier deelgebieden hieronder mee met het oordeel, in hetzelfde
    `save-checks`-bericht: `"gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking",
    "toelichting": "..." }]`. Zonder een complete lijst wordt het oordeel geweigerd. Staat er
    geen video op de pagina, gebruik dan `nvt` met de zin waaróp je hebt gezocht.
11. [agent] De onderbouwing bij `reden` is **één of twee zinnen**: of de meting geldig was —
    kwam je op de gevraagde pagina uit, draaide de JavaScript, was het een auditsessie — en
    verder niets. Al het inhoudelijke gaat naar de deelgebieden.

### Deelgebieden

> Gebied 1 heette eerst "Video's met geluid in de main-content". Dat "in de main-content" is
> eruit: welk deel van de pagina je beoordeelt is de scoperegel, en die geldt voor élk
> criterium — op een vervolgpagina alleen de main-content, op de homepage de hele pagina. Een
> gebiedsnaam die dat herhaalt zegt dus iets wat per pagina anders is. Wat wél eigen is aan
> 1.2.2 staat er nog: met geluid, want zonder geluid loopt het via 1.2.1.

1. Video's met geluid
2. Gesloten ondertiteling, en of die handmatig is
3. Open ondertiteling, in het beeld gebrand
4. Dekking over de hele video

### Zo is het vastgesteld

`get-videosporen` leest per video de ondertitelsporen uit de speler, inclusief of ze
automatisch gegenereerd zijn, en legt drie beeldjes vast voor de open ondertiteling. Dat
commando staat geregistreerd op 1.2.3 en 1.2.5 en is hier nog niet aan gekoppeld: op een
steekproef zonder video's levert die knop niets op. Komt er een onderzoek met video, dan is
dat het eerste wat erbij hoort.

Waarom die beeldjes onmisbaar zijn: open ondertiteling staat in geen enkele gegevensbron. Op
"Graven in het Groen, afl. 3" geeft YouTube alleen een automatisch spoor op, terwijl er
ingebrande ondertiteling in beeld staat. Wie op de API afgaat keurt die video ten onrechte af.

Wat hier niet uit blijkt: of de ondertiteling inhoudelijk deugt. Dat de sporen er zijn zegt
niets over de kwaliteit van de vertaling, en dat is met geen enkel commando vast te stellen.
