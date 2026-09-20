# Rusten er oordelen op een headless `get-html`? — ZOET-01, 20 september 2026

Aanleiding: de auditsessie-badge zette groen zodra één meting uit een sessie kwam. Op
Home was dat de schermafdruk en niet de HTML-ophaling, terwijl juist die laatste het
oordeel draagt. De vraag was of die headless ophalingen tot verkeerde oordelen hebben
geleid.

**Kort antwoord: nee, niet op deze twee pagina's.** De headless ophaling levert dezelfde
inhoud op als de ophaling in een auditsessie. Er is geen oordeel dat herzien moet worden.

## Wat er is bekeken

46 oordelen rusten op een `get-html` die headless is gedaan: 23 criteria op Home en
dezelfde 23 op Omgevingsprogramma's. De andere vier samples (twee PDF's en twee pagina's
waarvan de HTML wél in een sessie is opgehaald) vallen erbuiten.

## Waarom het hier niet uitmaakt

Headless mist wat pas na een klik in de code komt: uitklapblokken, menu's achter een
knop, formulierstappen achter een sessie. Op deze twee pagina's staat dat er niet.

| | Home | Omgevingsprogramma's |
|---|---|---|
| `gehydrateerd` | true | true |
| `dichtgeklapt` | 0 | 0 |
| elementen met `aria-expanded` | 1 (ReadSpeaker-widget) | 1 (idem) |
| `<details>` / `role="dialog"` | 0 | 0 |

Het enige dichtgeklapte element is de voorleesknop van ReadSpeaker, een widget van een
externe dienst met `display: none`. Geen inhoud van de gemeente.

De CLI waarschuwt hier zelf al voor: staan er dichtgeklapte blokken én is de ophaling
headless, dan zet `get-html` er `waarschuwing_dichtgeklapt` bij
(`scripts/audit-cli.ts`). Die waarschuwing is bij deze ophalingen niet afgegaan.

## De directe vergelijking

Van beide pagina's bestaat zowel een ophaling in een auditsessie als een headless
ophaling. Naast elkaar gelegd, na het wegfilteren van SIMsite-versienummers (2.12.0 →
2.12.1) en gegenereerde React-id's:

**Home** — sessie 13 sep tegen headless 17 sep (de ophaling waar de oordelen op rusten):

- 22 verschilregels, alle over scriptbestanden, de ReadSpeaker-widget en het
  `__NEXT_DATA__`-blok
- gelijk: 19 links, 6 knoppen, 1 h1, 6 h2, 2 afbeeldingen, 1 `aria-expanded`
- gelijk: dezelfde 2 alt-teksten (`Logo gemeente Zoetermeer` en één leeg), dezelfde 9
  aria-labels, dezelfde 7 koppen in dezelfde volgorde

**Omgevingsprogramma's** — sessie 13 sep tegen headless 14 sep, beide op de hoofdinhoud:

- 8 verschilregels, alle in de ReadSpeaker-widget: attribuutvolgorde, en `lang`,
  `title` en `aria-label` die het externe script later toevoegt
- gelijk: 3 links, 2 knoppen, 1 h1, 2 h2, 0 afbeeldingen

Precies de onderdelen waar 1.1.1, 1.3.1, 2.4.4 en 4.1.2 op rusten zijn dus gelijk.

## Wat dit niet zegt

- Het zegt niets over de **inhoudelijke juistheid** van de oordelen, alleen dat de
  ophaalwijze er hier geen verschil in maakt.
- Het geldt **voor deze twee pagina's van deze site**. Een pagina met een uitklapbare
  FAQ, een menu achter een knop of een formulier in stappen kan headless wél iets
  missen. De maat daarvoor is `dichtgeklapt` in de uitvoer van `get-html`.
- `get-html` staat in dit onderzoek 46 om 46 tussen sessie en headless, en zelfs binnen
  één dag wisselt het. Het is dus geen kenmerk van één auditronde.
