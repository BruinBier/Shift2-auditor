---
status: proposed
---

# Een browser naast de kaart, in plaats van ernaast in een ander venster

Bij het beoordelen van een criterium kijk je naar twee dingen tegelijk: de kaart met de
instructies, en de pagina waar het over gaat. Die stonden tot nu toe in twee vensters. Wat je
op de kaart leest moet je dan onthouden terwijl je in de browser zoekt, en wat je in de
browser ziet moet je onthouden terwijl je terugklikt.

Er staat nu een paneel naast de kaart met de levende pagina erin: te bedienen, met de
uitkomst van de meting eroverheen getekend.

## Waarom geen `<iframe>`

Dat verbieden de sites zelf. heuvelrug.nl stuurt:

```
Content-Security-Policy: ... frame-ancestors 'self' https://*.polly.help
```

`localhost:3000` mag die pagina dus niet in een kader zetten, en vrijwel elke gemeentesite
stuurt zo'n regel mee. Dit is geen instelling die wij kunnen omzeilen.

## Waarom geen bevroren kopie

Een opgeslagen kopie van de pagina zou wél in een kader mogen. Maar dan draait de JavaScript
niet meer: uitklapmenu's doen niets, zoeksuggesties verschijnen niet, knoppen reageren niet.
Dat ziet er precies zo uit als een bevinding. Op 15 augustus 2026 leverde datzelfde probleem
drie afkeuringen op heuvelrug.nl op die geen van drieën bestonden. Zie de waarschuwing over
hydratatie in `CLAUDE.md`.

## Wat het wel is

Een eigen browser die op de achtergrond draait en zijn beeld doorstuurt
(`Page.startScreencast`), met muis- en toetsaanslagen die de andere kant op gaan. Voor de
site is het een gewone bezoeker.

```
paneel ──beeld──►  /api/meting/scherm          (SSE)      ──►  eigen Chrome
       ◄─invoer──  /api/meting/scherm/invoer   (POST)
       ◄─kaders──  /api/meting/scherm/markeer  (POST)  ──►  get-links
       ◄─springen─ /api/meting/scherm/oplichten (POST)
```

**Waarom een eigen browser en niet de auditsessie.** Chrome tekent alleen voor de tab die vóór
staat en zichtbaar is; een tab op de achtergrond levert geen enkel beeld. De proef op een
draaiende auditsessie liep daarop vast. Wat je inlevert zijn cookies en inloggegevens — voor
een openbare pagina niets, achter een login is de auditsessie het aangewezen middel. Die blijft
bestaan via `get-links --laat-staan`.

## De kaders komen uit de meting, niet uit een tweede lezing

Het paneel rekent geen toegankelijke namen uit. Het draait `get-links` en zet de kaders op wat
daar uitkomt. Zou het paneel die berekening overdoen, dan bestond de regel — `aria-labelledby`,
dan `aria-label`, dan de tekst zonder `aria-hidden`, dan `title` — op twee plekken. Precies zo
ging het mis met de logolink: de regel stond in twee bestanden, één was verouderd, en wie die
las keurde het logo van elke gemeentesite af.

Vier kleuren:

| kleur | betekenis |
|---|---|
| rood | staat in `opvallend` van de meting |
| groen | naam in orde volgens de mechanische toets |
| grijs gestippeld | draagt een andere rol dan link — valt buiten 2.4.4, hoort onder 4.1.2 |
| blauw gestippeld | **viel buiten de meting** — knoppen, elementen met een linkrol, ingesloten kaders |

Die laatste is er niet voor de sier. `get-links` loopt de `<a>`-elementen af; zonder een eigen
kleur voor de rest lijkt een pagina vol groene kaders volledig nagelopen terwijl de
contrastknop, de zoekknop en de ReadSpeaker-widget er nooit in zaten. Op de homepage van
heuvelrug.nl zijn dat er zes.

## Wat het paneel over de focus zegt, en waarom voorzichtig

Bij elke Tab meldt het paneel welk element focus heeft, welke ring het draagt, en wat de meting
over dat element zei. Twee waarborgen daarbij:

- **Wachten voor het lezen.** Een lopende CSS-overgang wint van alles in de cascade, ook van
  `!important`, en dan meet je de beginwaarde nul. Zonder een pauze meldde dit "geen zichtbare
  omranding" op elementen die wél een ring krijgen — een valse 2.4.7-afkeuring uit het
  gereedschap zelf.
- **Van wie is die rand.** De markering zet zelf een outline op het element. Het paneel weet
  welke rand van hem is en zegt het erbij, zodat je 2.4.7 niet beoordeelt op een kader dat wij
  eroverheen hebben gelegd.

## Alleen lokaal

De routes weigeren dienst als `NODE_ENV=production`. Ze starten processen en houden ze open;
op een server hoort dat niet te bestaan. Een sessie sluit zichzelf als het paneel dichtgaat, en
anders na vijf minuten zonder kijker.

## Wat er nog niet is

De lijst in het paneel — vijf sociale-media-links, vier navigatie-items, zes niet-meegenomen
elementen — heeft dezelfde vorm als de bevindingenlijst op de kaart, maar er is geen koppeling
tussen een element op de pagina en een bevinding in de database. Klikken op B006 springt niet
naar die vijf links, en vanuit een regel in het paneel is geen bevinding aan te maken. Dat is
de volgende stap.
