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
